import React,{useEffect,useState,useCallback} from 'react';
import { Alert,FlatList,KeyboardAvoidingView,Platform,Pressable,Text,TextInput,View } from 'react-native';
import { useLocalSearchParams,router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';
import { getMessages,saveMessage } from '@/database/database';
import { lanNetwork } from '@/services/LanNetwork';
import type { ChatMessage } from '@/types/network';
export default function ChatScreen(){
 const {id,title='Local chat',peerId}=useLocalSearchParams<{id:string;title:string;peerId?:string}>();const {colors,profile}=useApp();const net=useNetwork();
 const [items,setItems]=useState<ChatMessage[]>([]);const [text,setText]=useState('');
 const refresh=useCallback(async()=>{const rows=await getMessages(id);setItems(rows.map((r:any)=>({...r,mine:r.sender_id===profile.id,createdAt:r.created_at,type:r.message_type,fileName:r.file_name,fileMime:r.file_mime,fileBase64:r.file_base64})));},[id,profile.id]);
 useEffect(()=>{refresh();const off=lanNetwork.subscribe(async p=>{const direct=!!peerId&&p.to===profile.id;const group=!peerId&&p.conversationId===id;if((p.type==='chat'||p.type==='file')&&(direct||group)){await saveMessage({...p,conversationId:direct?id:p.conversationId,type:p.type==='file'?'file':'text',deliveryState:'received',conversationTitle:String(title)});refresh();}});return () => { off(); };},[id,refresh,peerId,profile.id,title]);
 const send=async(payload:any)=>{
  const msg={id:`m-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,conversationId:id,senderId:profile.id,senderName:profile.name,body:payload.body||'',type:payload.type||'text',fileName:payload.fileName,fileMime:payload.fileMime,fileBase64:payload.fileBase64,createdAt:new Date().toISOString(),conversationTitle:String(title),kind:peerId?'direct':'group',peerId:peerId?String(peerId):undefined};
  await saveMessage(msg);setItems(x=>[...x,{...msg,mine:true}]);
  try{net.send({...msg,type:msg.type==='file'?'file':'chat',...(peerId?{to:String(peerId)}:{})});}catch(e:any){Alert.alert('Not connected',e.message||'Join a room before sending.');}
 };
 const openFile=async(item:ChatMessage)=>{try{if(!item.fileBase64)return Alert.alert('File unavailable','The original file data is not stored on this device.');const safe=(item.fileName||'shared-file').replace(/[^a-zA-Z0-9._-]/g,'_');const uri=(FileSystem.documentDirectory||'')+safe;await FileSystem.writeAsStringAsync(uri,item.fileBase64,{encoding:FileSystem.EncodingType.Base64});if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:item.fileMime||'application/octet-stream',dialogTitle:item.fileName||'Shared file'});else Alert.alert('File saved',`Saved inside Offline Connect Pro: ${safe}`);}catch(e:any){Alert.alert('Could not open file',e.message||'Try sharing the file again.');}};
 const attach=async()=>{const r=await DocumentPicker.getDocumentAsync({copyToCacheDirectory:true});if(r.canceled)return;const f=r.assets[0];try{const b64=await FileSystem.readAsStringAsync(f.uri,{encoding:FileSystem.EncodingType.Base64});if(b64.length>4_000_000){Alert.alert('File too large','For this first release, choose a file smaller than about 3 MB.');return;}await send({type:'file',body:f.name,fileName:f.name,fileMime:f.mimeType||'application/octet-stream',fileBase64:b64});}catch{Alert.alert('File error','Could not read this file on your device.');}};
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={{paddingTop:52,paddingHorizontal:18,paddingBottom:14,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',gap:12}}>
   <Pressable onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color={colors.text}/></Pressable>
   <View style={{flex:1}}><Text style={{color:colors.text,fontWeight:'800',fontSize:17}}>{title}</Text><Text style={{color:colors.muted,fontSize:12}}>Local network conversation</Text></View>
   <Pressable onPress={()=>router.push({pathname:'/call/[id]',params:{id,title,kind:'audio'}})}><Ionicons name="call" size={21} color={colors.primary}/></Pressable>
   <Pressable onPress={()=>router.push({pathname:'/call/[id]',params:{id,title,kind:'video'}})}><Ionicons name="videocam" size={23} color={colors.primary}/></Pressable>
  </View>
  <FlatList style={{flex:1}} contentContainerStyle={{padding:16,gap:10}} data={items} keyExtractor={x=>x.id} renderItem={({item})=><Pressable onPress={()=>item.type==='file'?openFile(item):undefined} style={{alignSelf:item.mine?'flex-end':'flex-start',maxWidth:'84%',backgroundColor:item.mine?colors.primary:colors.surface2,padding:12,borderRadius:16}}>
   {!item.mine&&<Text style={{fontWeight:'800',fontSize:11,color:colors.primary,marginBottom:4}}>{item.senderName}</Text>}
   <Text style={{color:item.mine?'#062014':colors.text,fontSize:15}}>{item.type==='file'?'📎 '+(item.fileName||item.body):item.body}</Text>
   <Text style={{fontSize:10,color:item.mine?'#164b31':colors.muted,alignSelf:'flex-end',marginTop:5}}>{new Date(item.createdAt||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text>
  </Pressable>}/>
  <View style={{padding:12,flexDirection:'row',alignItems:'flex-end',gap:8,borderTopWidth:1,borderColor:colors.border,backgroundColor:colors.surface}}>
   <Pressable onPress={attach} style={{padding:10}}><Ionicons name="attach" size={23} color={colors.primary}/></Pressable>
   <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={colors.muted} multiline style={{flex:1,maxHeight:110,minHeight:42,backgroundColor:colors.surface2,color:colors.text,borderRadius:18,paddingHorizontal:14,paddingVertical:10}}/>
   <Pressable onPress={()=>{const v=text.trim();if(v){setText('');send({body:v});}}} style={{backgroundColor:colors.primary,width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'}}><Ionicons name="send" size={18} color="#062014"/></Pressable>
  </View>
 </KeyboardAvoidingView>;
}
