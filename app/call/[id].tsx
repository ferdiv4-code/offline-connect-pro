import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View, Vibration } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { callService } from '@/services/CallService';

type CallStatus = 'starting' | 'incoming' | 'preparing' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';

export default function CallScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    kind?: 'audio' | 'video';
    incoming?: string;
    offer?: string;
  }>();
  const [status, setStatus] = useState<CallStatus>('starting');
  const [streams, setStreams] = useState<any>({});
  const [offer, setOffer] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(false);

  const peerId = String(params.id || '');
  const peerName = String(params.title || 'Nearby user');
  const kind = params.kind === 'video' ? 'video' : 'audio';

  useEffect(() => {
    if (status === 'incoming') Vibration.vibrate([0, 650, 350, 650], true);
    else Vibration.cancel();
    return () => Vibration.cancel();
  }, [status]);

  useEffect(() => {
    let active = true;
    callService.setListener((state) => {
      if (!active) return;
      setStatus((state.status || 'connecting') as CallStatus);
      setStreams(callService.streams);
      if (state.status === 'incoming' && state.offer) setOffer(state.offer);
    });

    // NetworkProvider handles all call packets globally, including early ICE candidates.

    if (params.incoming === '1' && params.offer) {
      try {
        const incomingOffer = JSON.parse(String(params.offer));
        setOffer(incomingOffer);
        setStatus('incoming');
      } catch (error: any) {
        Alert.alert('Call error', error?.message || 'The incoming call information is invalid.');
        setStatus('failed');
      }
    } else {
      callService.start(peerId, peerName, kind).catch((error) => {
        Alert.alert('Call unavailable', error?.message || 'Could not start a local call. Make sure both phones are connected to the same room.');
        setStatus('failed');
      });
    }

    return () => {
      active = false;
      callService.end();
    };
  }, [peerId, peerName, kind, params.incoming, params.offer]);

  const accept = async () => {
    if (!offer || busy) return;
    setBusy(true);
    try {
      await callService.accept(peerId, peerName, kind, offer);
      setOffer(null);
    } catch (error: any) {
      Alert.alert('Could not answer', error?.message || 'The call could not be accepted.');
      setStatus('failed');
    } finally {
      setBusy(false);
    }
  };

  const endCall = () => {
    callService.end();
    router.back();
  };

  const statusText: Record<CallStatus, string> = {
    starting: 'Starting local call…',
    incoming: 'Incoming voice call',
    preparing: 'Preparing microphone…',
    ringing: 'Ringing on their phone…',
    connecting: 'Connecting over local Wi-Fi…',
    connected: 'Connected locally',
    reconnecting: 'Local connection interrupted. Reconnecting…',
    failed: 'Call connection failed',
    ended: 'Call ended'
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#06182A', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {streams.remote && kind === 'video' ? (
        <RTCView streamURL={streams.remote.toURL()} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} objectFit="cover" />
      ) : null}
      {streams.local && kind === 'video' ? (
        <RTCView streamURL={streams.local.toURL()} style={{ position: 'absolute', right: 18, top: 60, width: 110, height: 160, borderRadius: 16 }} objectFit="cover" />
      ) : null}

      <View style={{ alignItems: 'center', gap: 14 }}>
        <View style={{ width: 116, height: 116, borderRadius: 58, backgroundColor: '#123A50', borderWidth: 2, borderColor: '#39D5C4', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={kind === 'video' ? 'videocam' : 'person'} size={48} color="#72F0D2" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '800', textAlign: 'center' }}>{peerName}</Text>
        <Text style={{ color: '#B7D0D8', fontSize: 14, textAlign: 'center' }}>{statusText[status] || 'Connecting over local network…'}</Text>
        <Text style={{ color: '#7899A8', fontSize: 11 }}>OFFLINE CONNECT PRO · LOCAL CALL</Text>
      </View>

      {status === 'incoming' && offer ? (
        <View style={{ position: 'absolute', bottom: 64, flexDirection: 'row', alignItems: 'center', gap: 34 }}>
          <Pressable onPress={endCall} accessibilityRole="button" accessibilityLabel="Decline call" style={{ backgroundColor: '#D94150', width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="call" size={27} color="white" />
          </Pressable>
          <Pressable disabled={busy} onPress={accept} accessibilityRole="button" accessibilityLabel="Accept call" style={{ backgroundColor: '#20B978', opacity: busy ? 0.6 : 1, width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="call" size={27} color="white" />
          </Pressable>
        </View>
      ) : (
        <View style={{ position: 'absolute', bottom: 64, flexDirection: 'row', alignItems: 'center', gap: 25 }}>
          <Pressable onPress={() => { const next = !muted; setMuted(next); callService.setMicrophoneEnabled(!next); }} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'} style={{ backgroundColor: muted ? '#D69B36' : '#24495A', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color="white" />
          </Pressable>
          <Pressable onPress={endCall} accessibilityRole="button" accessibilityLabel="End call" style={{ backgroundColor: '#E5484D', width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="call" size={27} color="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
