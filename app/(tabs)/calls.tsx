import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ActionButton,Card,EmptyState,Heading } from '@/components/UI';
import { useNetwork } from '@/state/NetworkContext';
import { useApp } from '@/state/AppContext';
export default function CallsScreen(){
 const {colors}=useApp();const net=useNetwork();
 return <Screen><Heading title="Calls" subtitle="Voice and video calls over the local network."/>
 <Card><EmptyState icon="call-outline" title="Start a local call" body="Open a conversation with a room member and use the call or video button in its header."/></Card>
 <Text style={{color:colors.muted,fontSize:12,lineHeight:18}}>Calls require the phones to be able to reach one another directly on the Wi-Fi or hotspot network. Group calls use a peer-to-peer mesh and are best kept to a small number of devices.</Text>
 {net.room?<ActionButton title="Open room chat" icon="chatbubbles" onPress={()=>router.push({pathname:'/chat/[id]',params:{id:net.room!.id,title:net.room!.name}})}/>:null}
 </Screen>;
}
