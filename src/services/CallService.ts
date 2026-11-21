import { mediaDevices, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { lanNetwork } from './LanNetwork';

const config = { iceServers: [] as any[] };
type CallState = { peerId:string; peerName:string; kind:'audio'|'video'; incoming:boolean };
class CallService {
  private pc:RTCPeerConnection|null=null;
  private local:any=null;
  private remote:any=null;
  private current:CallState|null=null;
  private onChange:(s:any)=>void=()=>{};
  setListener(fn:(s:any)=>void){this.onChange=fn;}
  get streams(){return {local:this.local,remote:this.remote};}
  get state(){return this.current;}
  async start(peerId:string,peerName:string,kind:'audio'|'video'){
    this.current={peerId,peerName,kind,incoming:false}; this.onChange({status:'connecting',...this.current});
    await this.setup(kind);
    const offer=await this.pc!.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:kind==='video'});
    await this.pc!.setLocalDescription(offer);
    lanNetwork.send({type:'signal',to:peerId,signal:{type:'offer',sdp:offer.sdp,kind}});
  }
  async accept(peerId:string,peerName:string,kind:'audio'|'video',offer:any){
    this.current={peerId,peerName,kind,incoming:true}; await this.setup(kind);
    await this.pc!.setRemoteDescription(new RTCSessionDescription({type:'offer',sdp:offer.sdp}));
    const answer=await this.pc!.createAnswer(); await this.pc!.setLocalDescription(answer);
    lanNetwork.send({type:'signal',to:peerId,signal:{type:'answer',sdp:answer.sdp}});
    this.onChange({status:'connected',...this.current});
  }
  private async setup(kind:'audio'|'video'){
    this.local=await mediaDevices.getUserMedia({audio:true,video:kind==='video'?{facingMode:'user',width:640,height:480,frameRate:24}:false});
    this.pc=new RTCPeerConnection(config);
    this.local.getTracks().forEach((t:any)=>this.pc!.addTrack(t,this.local));
    (this.pc as any).ontrack=(e:any)=>{this.remote=e.streams?.[0];this.onChange({status:'connected',...this.current,remote:this.remote,local:this.local});};
    (this.pc as any).onicecandidate=(e:any)=>{if(e.candidate&&this.current)lanNetwork.send({type:'signal',to:this.current.peerId,signal:{type:'candidate',candidate:e.candidate}});};
    (this.pc as any).onconnectionstatechange=()=>this.onChange({status:this.pc?.connectionState,...this.current,local:this.local,remote:this.remote});
  }
  async handleSignal(from:string,signal:any,peerName='Nearby user'){
    if(signal.type==='offer'){
      this.current={peerId:from,peerName,kind:signal.kind||'audio',incoming:true};
      this.onChange({status:'incoming',...this.current,offer:signal});
    }else if(signal.type==='answer'&&this.pc){
      await this.pc.setRemoteDescription(new RTCSessionDescription({type:'answer',sdp:signal.sdp}));
    }else if(signal.type==='candidate'&&this.pc){
      try{await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));}catch{}
    }else if(signal.type==='hangup'){this.end();}
  }
  end(){
    try{this.local?.getTracks().forEach((t:any)=>t.stop());this.remote?.getTracks().forEach((t:any)=>t.stop());this.pc?.close();}catch{}
    const previous=this.current;this.pc=null;this.local=null;this.remote=null;this.current=null;
    if(previous)try{lanNetwork.send({type:'signal',to:previous.peerId,signal:{type:'hangup'}});}catch{}
    this.onChange({status:'ended'});
  }
}
export const callService=new CallService();
