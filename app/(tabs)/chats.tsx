import React,{useEffect,useState} from 'react';
import { Text,View,Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card,EmptyState,Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { getConversations } from '@/database/database';
import AdBanner from '@/components/AdBanner';
export default function ChatsScreen(){
 const {colors}=useApp();const [rows,setRows]=useState<any[]>([]);
 const load=async()=>setRows(await getConversations());
 useEffect(()=>{load();const t=setInterval(load,2000);return()=>clearInterval(t);},[]);
 return <Screen><Heading title="Chats" subtitle="Your saved local conversations."/>
 {rows.length?rows.map(r=><Pressable key={r.id} onPress={()=>router.push({pathname:'/chat/[id]',params:{id:r.id,title:r.title,...(r.peer_id?{peerId:r.peer_id}:{})}})}><Card style={{flexDirection:'row',alignItems:'center'}}><View style={{width:48,height:48,borderRadius:24,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'}}><Ionicons name={r.kind==='group'?'people':'person'} size={22} color={colors.primary}/></View><View style={{flex:1,gap:4}}><Text style={{color:colors.text,fontWeight:'800'}}>{r.title}</Text><Text numberOfLines={1} style={{color:colors.muted,fontSize:12}}>{r.last_message||'No messages yet'}</Text></View><Text style={{color:colors.muted,fontSize:10}}>{r.last_time?new Date(r.last_time).toLocaleDateString():''}</Text></Card></Pressable>):<Card><EmptyState icon="chatbubbles-outline" title="No conversations yet" body="Join or host a room to start chatting with nearby devices."/></Card>}
 <AdBanner />
    </Screen>;
}
