import React,{useState,useEffect} from 'react';
import { Alert,Pressable,Text } from 'react-native';
import { useLocalSearchParams,router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ActionButton,Field,Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';
export default function JoinRoomScreen(){
 const {colors}=useApp();const net=useNetwork();const params=useLocalSearchParams<{host?:string;code?:string}>();const [host,setHost]=useState(params.host||'');const [code,setCode]=useState(params.code||'');
 useEffect(()=>{if(params.host)setHost(params.host);if(params.code)setCode(params.code);},[params.host,params.code]);
 const join=async()=>{if(!host.trim())return Alert.alert('Host IP required','Select a discovered room or enter the host phone IP address.');try{await net.connect(host.trim(),code.trim().toUpperCase());Alert.alert('Connected','You joined the local room.');router.replace('/(tabs)/rooms' as never);}catch(e:any){Alert.alert('Could not join room',e.message||'Check the IP, room code and Wi-Fi connection.');}};
 return <Screen><Pressable onPress={()=>router.back()}><Text style={{color:colors.primary,fontWeight:'700'}}>‹  Back</Text></Pressable><Heading title="Join a room" subtitle="Choose a discovered room or enter the host details."/>
 <Field label="HOST PHONE IP ADDRESS" value={host} onChangeText={setHost} placeholder="e.g. 192.168.1.5" autoCapitalize="none"/>
 <Field label="ROOM CODE (IF REQUIRED)" value={code} onChangeText={setCode} placeholder="6-character room code" autoCapitalize="characters" maxLength={12}/>
 <ActionButton title="Connect to room" icon="enter" onPress={join}/>
 <Text style={{color:colors.muted,fontSize:12,lineHeight:18}}>The host phone and your phone must be on the same Wi-Fi or hotspot network. If discovery cannot see the host, enter its local IP address manually.</Text>
 </Screen>;
}
