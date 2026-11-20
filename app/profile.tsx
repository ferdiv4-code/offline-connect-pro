import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ActionButton, Field, Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { saveLocalUser } from '@/database/database';

export default function ProfileScreen() {
  const { colors, profile, saveProfile } = useApp();
  const [name,setName] = useState(profile.name);
  const [status,setStatus] = useState(profile.status);
  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required','Please enter a display name.');
    const next = { name:name.trim(), status:status.trim() };
    await saveProfile(next);
    await saveLocalUser({ ...profile, ...next });
    Alert.alert('Profile saved','Your profile is saved on this device.');
    router.back();
  };
  return <Screen>
    <Pressable onPress={()=>router.back()}><Text style={{ color:colors.primary,fontWeight:'700' }}>‹  Back</Text></Pressable>
    <Heading title="Your profile" subtitle="This identity is stored locally on your device."/>
    <Field label="DISPLAY NAME" value={name} onChangeText={setName} placeholder="Your name" maxLength={32}/>
    <Field label="STATUS" value={status} onChangeText={setStatus} placeholder="Available nearby" maxLength={80}/>
    <View style={{ gap:8 }}><Text style={{ color:colors.muted,fontSize:12,fontWeight:'700' }}>LOCAL USER ID</Text><Text selectable style={{ color:colors.text,fontSize:12 }}>{profile.id}</Text></View>
    <ActionButton title="Save profile" icon="checkmark-circle" onPress={save}/>
  </Screen>;
}