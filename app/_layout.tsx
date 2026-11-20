import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider,useApp } from '@/state/AppContext';
import { NetworkProvider } from '@/state/NetworkContext';
function RootNavigator(){const {theme}=useApp();return <><StatusBar style={theme==='light'?'dark':'light'}/><NetworkProvider><Stack screenOptions={{headerShown:false}}/></NetworkProvider></>;}
export default function RootLayout(){return <AppProvider><RootNavigator/></AppProvider>;}
