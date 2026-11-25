import React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card, Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { router } from 'expo-router';
import AdBanner from '@/components/AdBanner';
import { openAdPrivacyOptions } from '@/services/Ads';
import { APP_VERSION } from '@/config/ads';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, profile } = useApp();
  const options = [{v:'system',label:'System default'},{v:'dark',label:'Dark mode'},{v:'light',label:'Light mode'}] as const;
  return <Screen><Heading title="Settings" subtitle="Make Offline Connect Pro yours."/>
    <Pressable onPress={()=>router.push('/profile' as never)}>
      <Card style={{ flexDirection:'row',alignItems:'center' }}>
        <View style={{ width:48,height:48,borderRadius:16,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center' }}><Ionicons name="person" size={23} color={colors.primary}/></View>
        <View style={{ flex:1,gap:3 }}><Text style={{ color:colors.text,fontWeight:'800',fontSize:16 }}>{profile.name}</Text><Text style={{ color:colors.muted,fontSize:12 }}>{profile.status}</Text></View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted}/>
      </Card>
    </Pressable>
    <Card>
      <Text style={{ color:colors.text,fontWeight:'800',fontSize:16 }}>Appearance</Text>
      {options.map(o=><Pressable key={o.v} onPress={()=>setThemeMode(o.v)} style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:10 }}>
        <Text style={{ color:colors.text }}>{o.label}</Text>
        <Ionicons name={themeMode===o.v?'radio-button-on':'radio-button-off'} size={20} color={themeMode===o.v?colors.primary:colors.muted}/>
      </Pressable>)}
    </Card>
    <Card>
      <Text style={{ color:colors.text,fontWeight:'800' }}>Privacy & connectivity</Text>
      <Text style={{ color:colors.muted,fontSize:13,lineHeight:20 }}>Messages and room discovery are designed for your local Wi-Fi or hotspot. This early source build uses a basic room-code gate; it does not yet provide end-to-end encryption or background call support.</Text>
    </Card>
    <Card>
      <Text style={{ color:colors.text,fontWeight:'800',fontSize:16 }}>More</Text>
      {[
        { icon:'shield-checkmark-outline', label:'Privacy policy', onPress:()=>router.push('/privacy' as never) },
        { icon:'megaphone-outline', label:'Ad privacy choices', onPress:()=>{ openAdPrivacyOptions(); } },
        { icon:'share-social-outline', label:'Share Offline Connect Pro', onPress:()=>{ Share.share({ message:'Chat, call and share files with people nearby without internet. Try Offline Connect Pro!' }); } },
      ].map(r=><Pressable key={r.label} onPress={r.onPress} style={{ flexDirection:'row',alignItems:'center',paddingVertical:10,gap:12 }}>
        <Ionicons name={r.icon as any} size={20} color={colors.primary}/>
        <Text style={{ color:colors.text,flex:1 }}>{r.label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted}/>
      </Pressable>)}
    </Card>
    <AdBanner />
    <Text style={{ color:colors.muted,textAlign:'center',fontSize:12 }}>Offline Connect Pro · Version {APP_VERSION}</Text>
  </Screen>;
}
