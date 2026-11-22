
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Network from 'expo-network';

import { lanNetwork } from '@/services/LanNetwork';

import type {
  NearbyPeer,
  RoomInfo,
  NetworkStatus
} from '@/types/network';

import { useApp } from './AppContext';
import { saveMessage } from '@/database/database';
import { callService } from '@/services/CallService';

type Ctx = {
  status: NetworkStatus;
  peers: NearbyPeer[];
  room: RoomInfo | null;
  members: { id: string; name: string }[];
  localIp: string;
  connect: (host: string, code: string) => Promise<void>;
  host: (v: any) => Promise<void>;
  send: (p: any) => void;
  leave: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

export function NetworkProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = useApp();

  const [status, setStatus] =
    useState<NetworkStatus>('idle');

  const [peers, setPeers] =
    useState<NearbyPeer[]>([]);

  const [room, setRoom] =
    useState<RoomInfo | null>(null);

  const [members, setMembers] =
    useState<{ id: string; name: string }[]>([]);

  const [localIp, setLocalIp] = useState('');

  useEffect(() => {
    let mounted = true;

    const u = lanNetwork.subscribe(p => {
      if (p.type === 'hosting') {
        setStatus('hosting');
      }

      if (p.type === 'welcome') {
        setRoom(p.room);
        setStatus('connected');
        setMembers(p.members || []);
      }

      if (p.type === 'disconnected') {
        setStatus('idle');
        setRoom(null);
        setMembers([]);
      }

      if (p.type === 'member-joined') {
        setMembers(x =>
          x.some(m => m.id === p.peerId)
            ? x
            : [
                ...x,
                {
                  id: p.peerId,
                  name: p.name || 'Nearby user'
                }
              ]
        );
      }

      if (p.type === 'member-left') {
        setMembers(x =>
          x.filter(m => m.id !== p.peerId)
        );
      }

      if (
        (p.type === 'chat' || p.type === 'file') &&
        p.senderId
      ) {
        const direct = p.to === profile.id;

        const conversationId = direct
          ? `dm-${p.from}`
          : p.conversationId;

        if (conversationId) {
          saveMessage({
            ...p,
            conversationId,
            conversationTitle: direct
              ? (p.senderName || 'Nearby user')
              : (p.conversationTitle || 'Local room'),
            kind: direct ? 'direct' : 'group',
            peerId: direct ? p.from : undefined,
            type: p.type === 'file' ? 'file' : 'text',
            deliveryState: 'received'
          }).catch(e =>
            console.warn(
              'Could not save incoming message:',
              e
            )
          );
        }
      }

      if (p.type === 'signal' && p.to === profile.id) {
        // Keep call signalling in the always-mounted network provider. This
        // prevents early ICE candidates being lost while the call screen mounts.
        callService.handleSignal(
          String(p.from || ''),
          p.signal,
          p.fromName || 'Nearby user'
        ).catch(error => console.warn('Incoming call signal failed:', error));

        if (p.signal?.type === 'offer') {
          router.push({
            pathname: '/call/[id]',
            params: {
              id: String(p.from || ''),
              title: p.fromName || 'Nearby user',
              kind: p.signal.kind || 'audio',
              incoming: '1',
              offer: JSON.stringify(p.signal)
            }
          });
        }
      }

      if (p.type === 'error') {
        Alert.alert('Local network', p.message);
      }
    });

    const up = lanNetwork.subscribePeers(setPeers);

    // Get the active local IP before starting discovery.
    // This helps discovery target both general and
    // typical Android hotspot subnet broadcasts.
    const startDiscovery = async () => {
      let ip = '';

      try {
        ip = await Network.getIpAddressAsync();

        if (mounted) {
          setLocalIp(ip);
        }
      } catch (e) {
        console.warn(
          'Could not read local network IP:',
          e
        );
      }

      if (mounted) {
        lanNetwork.discover(ip);
      }
    };

    startDiscovery();

    return () => {
      mounted = false;
      u();
      up();
    };
  }, [profile.id]);

  const host = async (v: any) => {
    let ip = '';

    try {
      ip = await Network.getIpAddressAsync();
      setLocalIp(ip);
    } catch (e) {
      console.warn(
        'Could not read host local IP:',
        e
      );
    }

    await lanNetwork.hostRoom({
      ...v,
      displayName: profile.name,
      hostId: profile.id,
      hostIp: ip
    });

    setRoom({
      id: v.id,
      name: v.name,
      code: v.code,
      hostId: profile.id,
      hostName: profile.name,
      host: ip || 'Check phone Wi-Fi details',
      port: 45454,
      members: 1,
      maxMembers: v.maxMembers,
      isPrivate: v.isPrivate
    });

    setStatus('hosting');

    setMembers([
      {
        id: profile.id,
        name: profile.name
      }
    ]);
  };

  const connect = async (
    host: string,
    code: string
  ) => {
    await lanNetwork.connect(
      host,
      code,
      profile
    );
  };

  const send = (p: any) => {
    lanNetwork.send(p);
  };

  const leave = async () => {
    await lanNetwork.stop();

    setStatus('idle');
    setRoom(null);
    setMembers([]);
  };

  return (
    <C.Provider
      value={{
        status,
        peers,
        room,
        members,
        localIp,
        connect,
        host,
        send,
        leave
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useNetwork() {
  const c = useContext(C);

  if (!c) {
    throw new Error('NetworkProvider missing');
  }

  return c;
}
