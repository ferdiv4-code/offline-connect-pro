import TcpSocket from 'react-native-tcp-socket';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import type { NearbyPeer, WirePacket } from '@/types/network';

const TCP_PORT = 45454;
const UDP_PORT = 45455;
const BEACON = 'OCP_DISCOVER_V2';
type Listener = (packet:WirePacket)=>void;
type PeerListener = (peers:NearbyPeer[])=>void;

class LanNetwork {
  private server:any = null;
  private discovery:any = null;
  private socket:any = null;
  private clients = new Map<string,any>();
  private clientNames = new Map<string,string>();
  private listeners = new Set<Listener>();
  private peerListeners = new Set<PeerListener>();
  private peerMap = new Map<string,NearbyPeer>();
  private bufferMap = new WeakMap<object,string>();
  private self:any = null;
  private hostAddress = '';
  private roomCode = '';
  private active = false;

  subscribe(fn:Listener){ this.listeners.add(fn); return ()=>this.listeners.delete(fn); }
  subscribePeers(fn:PeerListener){ this.peerListeners.add(fn); fn([...this.peerMap.values()]); return ()=>this.peerListeners.delete(fn); }
  private emit(p:WirePacket){ this.listeners.forEach(fn=>fn(p)); }
  private emitPeers(){ const list=[...this.peerMap.values()].filter(p=>Date.now()-p.seenAt<15000); this.peerListeners.forEach(fn=>fn(list)); }
  private sendSocket(s:any,p:WirePacket){ try{s.write(JSON.stringify(p)+'\n');}catch(e){console.warn('LAN send failed',e);} }
  private attach(s:any,onPacket:(p:WirePacket)=>void){
    s.on('data',(chunk:any)=>{
      let all=(this.bufferMap.get(s as any)||'')+Buffer.from(chunk).toString('utf8');
      const lines=all.split('\n'); this.bufferMap.set(s as any,lines.pop()||'');
      for(const line of lines){ if(!line.trim())continue; try{onPacket(JSON.parse(line));}catch{this.emit({type:'error',message:'Received an invalid local-network packet'});} }
    });
    s.on('error',(e:any)=>this.emit({type:'error',message:e?.message||'Socket error'}));
    s.on('close',()=>this.emit({type:'peer-left'}));
  }
  async hostRoom(info:{id:string;hostId:string;hostIp?:string;name:string;displayName:string;maxMembers:number;isPrivate:boolean;code:string}){
    await this.stop();
    this.self=info; this.roomCode=info.code; this.active=true;
    this.server=TcpSocket.createServer((s:Socket)=>{
      let peerId='';
      this.attach(s,(p)=>{
        if(p.type==='hello'){
          if(this.self.isPrivate && p.code!==this.roomCode){this.sendSocket(s,{type:'rejected',reason:'Incorrect room code'});s.destroy();return;}
          if(this.clients.size+1 >= Number(this.self.maxMembers||8)){this.sendSocket(s,{type:'rejected',reason:'This room is full'});s.destroy();return;}
          peerId=String(p.peerId||''); this.clients.set(peerId,s); this.clientNames.set(peerId,String(p.name||'Nearby user'));
          const members=[{id:this.self.hostId,name:this.self.displayName},...Array.from(this.clientNames.entries()).map(([id,name])=>({id,name}))];
          this.sendSocket(s,{type:'welcome',room:{...this.self,host:this.self.hostIp,port:TCP_PORT,hostId:this.self.hostId},host:this.self.displayName,hostId:this.self.hostId,members});
          this.broadcast({type:'member-joined',peerId,name:p.name});
          this.emit({type:'member-joined',peerId,name:p.name});
        } else {
          if(p.type==='chat'||p.type==='signal'||p.type==='file'||p.type==='typing') if(p.to){
            if(p.to===this.self?.hostId) this.emit({...p,from:peerId});
            else { const target=this.clients.get(String(p.to)); if(target) this.sendSocket(target,{...p,from:peerId}); }
          } else { this.broadcast({...p,from:peerId},s); this.emit({...p,from:peerId}); }
        }
      });
      s.on('close',()=>{if(peerId){this.clients.delete(peerId);this.clientNames.delete(peerId);this.broadcast({type:'member-left',peerId});this.emit({type:'member-left',peerId});}});
    });
    await new Promise<void>((resolve,reject)=>{
      this.server!.once('error',reject);
      this.server!.listen({port:TCP_PORT,host:'0.0.0.0'},()=>resolve());
    });
    this.startDiscovery();
    this.emit({type:'hosting',port:TCP_PORT,roomCode:this.roomCode});
    return TCP_PORT;
  }
  private broadcast(p:WirePacket,except?:any){ const data=JSON.stringify(p)+'\n'; for(const s of this.clients.values()){if(s!==except)try{s.write(data);}catch{}} }
  private startDiscovery(){
    try{
      this.discovery=dgram.createSocket('udp4');
      this.discovery.on('message',(msg:any,rinfo:any)=>{
        const text=Buffer.from(msg).toString('utf8');
        if(text===BEACON){
          const response={tag:'OCP_ROOM_V2',id:this.self.hostId,roomId:this.self.id,name:this.self.displayName,host:this.self.name,port:TCP_PORT,code:this.self.isPrivate?'':this.roomCode,roomName:this.self.name,maxMembers:this.self.maxMembers,isPrivate:this.self.isPrivate,members:this.clients.size+1};
          const b=Buffer.from(JSON.stringify(response));
          this.discovery.send(b,0,b.length,rinfo.port,rinfo.address);
        } else {
          try{const p=JSON.parse(text);if(p.tag==='OCP_ROOM_V2'&&p.id!==this.self.hostId){this.peerMap.set(p.id,{id:p.id,name:p.name,host:rinfo.address,port:p.port,roomCode:p.code,roomName:p.roomName,members:p.members,maxMembers:p.maxMembers,isPrivate:p.isPrivate,seenAt:Date.now()});this.emitPeers();}}catch{}
        }
      });
      this.discovery.bind(UDP_PORT,()=>{try{this.discovery.setBroadcast(true);}catch{}});
      this.beaconLoop();
    }catch(e){this.emit({type:'error',message:'Room hosting started, but automatic discovery could not start. Share the host IP and room code.'});}
  }
  private beaconLoop(){
    if(!this.discovery||!this.active)return;
    const payload={tag:'OCP_ROOM_V2',id:this.self.hostId,roomId:this.self.id,name:this.self.displayName,host:this.self.name,port:TCP_PORT,code:this.self.isPrivate?'':this.roomCode,roomName:this.self.name,maxMembers:this.self.maxMembers,isPrivate:this.self.isPrivate,members:this.clients.size+1};
    const b=Buffer.from(JSON.stringify(payload));
    try{this.discovery.send(b,0,b.length,UDP_PORT,'255.255.255.255');}catch{}
    setTimeout(()=>this.beaconLoop(),2500);
  }
  async discover(){
    if(this.discovery)return;
    try{
      this.discovery=dgram.createSocket('udp4');
      this.discovery.on('message',(msg:any,rinfo:any)=>{
        try{const p=JSON.parse(Buffer.from(msg).toString('utf8'));if(p.tag==='OCP_ROOM_V2'){this.peerMap.set(p.id,{id:p.id,name:p.name,host:rinfo.address,port:p.port,roomCode:p.code,roomName:p.roomName,members:p.members,maxMembers:p.maxMembers,isPrivate:p.isPrivate,seenAt:Date.now()});this.emitPeers();}}catch{}
      });
      this.discovery.bind(UDP_PORT,()=>{try{this.discovery.setBroadcast(true);}catch{};const b=Buffer.from(BEACON);this.discovery.send(b,0,b.length,UDP_PORT,'255.255.255.255');});
      const repeat=()=>{if(!this.discovery)return;const b=Buffer.from(BEACON);try{this.discovery.send(b,0,b.length,UDP_PORT,'255.255.255.255');}catch{};setTimeout(repeat,3000);}; repeat();
    }catch(e){this.emit({type:'error',message:'Automatic discovery is unavailable on this network. Use Join by IP instead.'});}
  }
  async connect(host:string,code:string,profile:{id:string;name:string}){
    await this.disconnectClient();
    return new Promise<void>((resolve,reject)=>{
      const s=TcpSocket.createConnection({port:TCP_PORT,host,connectTimeout:8000,...(Platform.OS==='android'?{interface:'wifi'}:{})},()=>{
        this.socket=s;this.attach(s,(p)=>{
          if(p.type==='welcome'){this.emit(p);resolve();}
          else if(p.type==='rejected'){reject(new Error(p.reason||'Room rejected the connection'));s.destroy();}
          else this.emit(p);
        });
        this.sendSocket(s,{type:'hello',peerId:profile.id,name:profile.name,code});
      });
      s.once('error',(e:any)=>reject(new Error(e?.message||'Could not connect to room host')));
    });
  }
  send(p:WirePacket){
    if(this.socket){this.sendSocket(this.socket,p);return;}
    if(this.server){if(p.to){if(p.to===this.self?.hostId)this.emit({...p,from:this.self?.id});else{const target=this.clients.get(String(p.to));if(target)this.sendSocket(target,{...p,from:this.self?.id});}}else{this.broadcast(p);this.emit({...p,from:this.self?.id});}return;}
    throw new Error('Connect to a room before sending.');
  }
  async disconnectClient(){if(this.socket){try{this.socket.destroy();}catch{}this.socket=null;}}
  async stop(){
    this.active=false;
    if(this.discovery){try{this.discovery.close();}catch{}this.discovery=null;}
    await this.disconnectClient();
    for(const s of this.clients.values())try{s.destroy();}catch{}
    this.clients.clear();this.clientNames.clear();
    if(this.server){await new Promise<void>(r=>{try{this.server!.close(()=>r());}catch{r();}});this.server=null;}
    this.peerMap.clear();this.emitPeers();this.emit({type:'disconnected'});
  }
}
export const lanNetwork = new LanNetwork();
