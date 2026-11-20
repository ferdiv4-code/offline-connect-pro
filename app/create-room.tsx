import React,{useState} from 'react';
import { Alert,Pressable,Switch,Text,View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ActionButton,Field,Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';
import { initializeDatabase } from '@/database/database';
export default function CreateRoomScreen(){
 const {colors,profile}=useApp();const net=useNetwork();const [name,setName]=useState('My local room');const [privateRoom,setPrivateRoom]=useState(false);const [limit,setLimit]=useState('8');
 const create=async()=>{if(!name.trim())return Alert.alert('Room name required','Enter a room name.');const max=Math.min(20,Math.max(2,Number(limit)||8));const id=`room-${Date.now().toString(36)}`;const code=Math.random().toString(36).slice(2,8).toUpperCase();
 try{await net.host({id,name:name.trim(),maxMembers:max,isPrivate:privateRoom,code});const db=await initializeDatabase();await db.runAsync('INSERT OR REPLACE INTO rooms(id,name,description,code,is_private,max_members,created_at) VALUES(?,?,?,?,?,?,?)',id,name.trim(),'Local room',code,privateRoom?1:0,max,new Date().toISOString());Alert.alert('Room is hosting',`Share this code with people joining: ${code}\nKeep this phone connected to the Wi-Fi or hotspot.`);router.replace('/(tabs)/rooms' as never);}catch(e:any){Alert.alert('Could not host room',e.message||'Check that Wi-Fi or hotspot is enabled.');}};
 return <Screen><Pressable onPress={()=>router.back()}><Text style={{color:colors.primary,fontWeight:'700'}}>‹  Back</Text></Pressable><Heading title="Create a room" subtitle="Your phone becomes the local room host."/>
 <Field label="ROOM NAME" value={name} onChangeText={setName} placeholder="Weekend Hangout" maxLength={40}/>
 <Field label="MAXIMUM DEVICES (2–20)" value={limit} onChangeText={setLimit} keyboardType="number-pad"/>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12}}><View style={{flex:1,gap:3}}><Text style={{color:colors.text,fontWeight:'700'}}>Private room</Text><Text style={{color:colors.muted,fontSize:12}}>Require the room code to join</Text></View><Switch value={privateRoom} onValueChange={setPrivateRoom} trackColor={{true:colors.primary}}/></View>
 <ActionButton title="Start hosting room" icon="wifi" onPress={create}/>
 <Text style={{color:colors.muted,fontSize:12,lineHeight:18}}>Connect every phone to the same Wi-Fi network or this phone's hotspot first. Keep this app open while hosting.</Text>
 </Screen>;
}
