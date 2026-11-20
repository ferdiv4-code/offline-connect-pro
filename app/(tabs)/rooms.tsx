import React from 'react';
import { Text,View,Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ActionButton,Card,Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';
export default function RoomsScreen(){
 const {colors,profile}=useApp();const net=useNetwork();
 return <Screen><Heading title="Rooms" subtitle="Host a room or join a nearby group."/>
 <View style={{gap:10}}><ActionButton title="Create a room" icon="add-circle" onPress={()=>router.push('/create-room' as never)}/><ActionButton title="Join with room code or IP" icon="keypad" secondary onPress={()=>router.push('/join-room' as never)}/></View>
 {net.room?<Card><Text style={{color:colors.text,fontWeight:'800'}}>{net.room.name}</Text><Text style={{color:colors.muted}}>Room code: {net.room.code}</Text><Text style={{color:colors.muted}}>Host IP: {net.localIp||net.room.host}</Text><Text style={{color:colors.muted}}>Connected members: {net.members.length}</Text>
 {net.members.filter(m=>m.id!==profile.id).map(m=><Pressable key={m.id} onPress={()=>router.push({pathname:'/chat/[id]',params:{id:`dm-${m.id}`,title:m.name,peerId:m.id}})}><Text style={{color:colors.primary,fontWeight:'700',paddingVertical:7}}>Message {m.name} privately  ›</Text></Pressable>)}<ActionButton title="Open group chat" icon="chatbubbles" onPress={()=>router.push({pathname:'/chat/[id]',params:{id:net.room!.id,title:net.room!.name}})}/><ActionButton title="Leave room" icon="exit-outline" secondary onPress={net.leave}/></Card>:null}
 <Heading title="Discovered nearby" subtitle="Devices visible on the same local network."/>
 {net.peers.map(p=><Pressable key={p.id} onPress={()=>router.push({pathname:'/join-room',params:{host:p.host,code:p.roomCode}})}><Card style={{flexDirection:'row',alignItems:'center'}}><Ionicons name="wifi" color={colors.primary} size={22}/><View style={{flex:1}}><Text style={{color:colors.text,fontWeight:'800'}}>{p.roomName}</Text><Text style={{color:colors.muted,fontSize:12}}>{p.host} · {p.members}/{p.maxMembers}</Text></View><Ionicons name="chevron-forward" color={colors.muted}/></Card></Pressable>)}
 </Screen>;
}
