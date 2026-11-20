import React,{useEffect,useState} from 'react';
import { Alert,Pressable,Text,View } from 'react-native';
import { useLocalSearchParams,router } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';
import { callService } from '@/services/CallService';
import { lanNetwork } from '@/services/LanNetwork';
export default function CallScreen(){
 const {id,title='Nearby user',kind='audio',incoming,offer}=useLocalSearchParams<{id:string;title:string;kind:'audio'|'video';incoming?:string;offer?:string}>();const {colors,profile}=useApp();const net=useNetwork();
 const [status,setStatus]=useState('starting');const [streams,setStreams]=useState<any>({});
 useEffect(()=>{
  callService.setListener(s=>{setStatus(s.status||'connecting');setStreams(callService.streams);if(s.status==='incoming')Alert.alert('Incoming call',`${s.peerName} is calling`,[{text:'Decline',style:'cancel',onPress:()=>router.back()},{text:'Accept',onPress:()=>callService.accept(s.peerId,s.peerName,s.kind,s.offer).catch(e=>Alert.alert('Call error',e.message))}]);});
  const off=lanNetwork.subscribe(p=>{if(p.type==='signal'&&p.signal?.type!=='offer'&&(!p.to||p.to===profile.id))callService.handleSignal(p.from,p.signal,p.fromName||'Nearby user').catch(()=>{});});
  if(incoming==='1'&&offer){Alert.alert('Incoming call',`${title} is calling`,[{text:'Decline',style:'cancel',onPress:()=>router.back()},{text:'Accept',onPress:()=>{try{callService.accept(String(id),String(title),kind==='video'?'video':'audio',JSON.parse(String(offer))).catch(e=>Alert.alert('Call error',e.message));}catch(e:any){Alert.alert('Call error',e.message);}}}]);}else{callService.start(String(id),String(title),kind==='video'?'video':'audio').catch(e=>{Alert.alert('Call unavailable',e.message||'Could not start local call.');setStatus('failed');});}
  return ()=>{off();callService.end();};
 },[]);
 return <View style={{flex:1,backgroundColor:'#06120D',alignItems:'center',justifyContent:'center',padding:24}}>
  {streams.remote&&kind==='video'?<RTCView streamURL={streams.remote.toURL()} style={{position:'absolute',top:0,left:0,right:0,bottom:0}} objectFit="cover"/>:null}
  {streams.local&&kind==='video'?<RTCView streamURL={streams.local.toURL()} style={{position:'absolute',right:18,top:60,width:110,height:160,borderRadius:16}} objectFit="cover"/>:null}
  <View style={{alignItems:'center',gap:12}}><View style={{width:100,height:100,borderRadius:50,backgroundColor:'#153A29',alignItems:'center',justifyContent:'center'}}><Ionicons name="person" size={44} color="#65D99B"/></View>
  <Text style={{color:'white',fontSize:25,fontWeight:'800'}}>{title}</Text><Text style={{color:'#A7B8AE'}}>{status==='connected'?'Connected locally':status==='failed'?'Call failed':'Connecting over local network…'}</Text></View>
  <View style={{position:'absolute',bottom:65,flexDirection:'row',gap:25}}>
   <Pressable onPress={()=>{callService.end();router.back();}} style={{backgroundColor:'#E5484D',width:64,height:64,borderRadius:32,alignItems:'center',justifyContent:'center'}}><Ionicons name="call" size={26} color="white"/></Pressable>
  </View>
 </View>;
}
