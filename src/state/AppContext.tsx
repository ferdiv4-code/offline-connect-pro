import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes } from '@/theme/palette';
import { initializeDatabase,saveLocalUser } from '@/database/database';
type ThemeMode='dark'|'light'|'system';
type Profile={id:string;name:string;status:string;avatar:string|null};
type ContextValue={theme:'dark'|'light';themeMode:ThemeMode;setThemeMode:(v:ThemeMode)=>void;colors:typeof palettes.dark;profile:Profile;saveProfile:(p:Partial<Profile>)=>Promise<void>;ready:boolean};
const AppContext=createContext<ContextValue|null>(null);
const defaultProfile:Profile={id:`local-${Date.now().toString(36)}`,name:'Guest User',status:'Available nearby',avatar:null};
export function AppProvider({children}:{children:React.ReactNode}){
 const [themeMode,setThemeModeState]=useState<ThemeMode>('system');
 const [systemDark,setSystemDark]=useState(Appearance.getColorScheme()!=='light');
 const [profile,setProfile]=useState<Profile>(defaultProfile);const [ready,setReady]=useState(false);
 useEffect(()=>{const sub=Appearance.addChangeListener(v=>setSystemDark(v.colorScheme!=='light'));return()=>sub.remove();},[]);
 const theme=themeMode==='system'?(systemDark?'dark':'light'):themeMode;
 useEffect(()=>{(async()=>{try{const [p,t]=await Promise.all([AsyncStorage.getItem('ocp.profile'),AsyncStorage.getItem('ocp.theme')]);const next=p?JSON.parse(p):defaultProfile;setProfile(next);if(t==='dark'||t==='light'||t==='system')setThemeModeState(t);await initializeDatabase();await saveLocalUser(next);}catch(e){console.warn('Local initialization issue',e);}finally{setReady(true);}})();},[]);
 const setThemeMode=async(v:ThemeMode)=>{setThemeModeState(v);await AsyncStorage.setItem('ocp.theme',v);};
 const saveProfile=async(updates:Partial<Profile>)=>{const next={...profile,...updates};setProfile(next);await AsyncStorage.setItem('ocp.profile',JSON.stringify(next));await saveLocalUser(next);};
 const value=useMemo(()=>({theme,themeMode,setThemeMode,colors:palettes[theme],profile,saveProfile,ready}),[theme,themeMode,profile,ready]);
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const v=useContext(AppContext);if(!v)throw new Error('useApp must be used inside AppProvider');return v;}
