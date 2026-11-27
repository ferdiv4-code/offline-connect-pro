import React from 'react';
import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card, Heading } from '@/components/UI';
import { useApp } from '@/state/AppContext';
import { PRIVACY_EMAIL } from '@/config/ads';

const sections: { title: string; body: string }[] = [
  {
    title: 'What stays on your phone',
    body: 'Your profile, chats and shared files are stored on your device. Messages, calls and files travel directly between phones on the same local Wi-Fi or hotspot. We do not run servers that receive your messages, calls or files.',
  },
  {
    title: 'Permissions we ask for',
    body: 'Microphone and camera: voice and video calls. Local network / Wi-Fi state: finding nearby phones. Photos and videos: sending files you choose. Vibration and wake lock: incoming-call alerts and keeping calls active. Internet permission is needed by Android for local connections and for ads.',
  },
  {
    title: 'Advertising',
    body: 'The app shows ads from Unity LevelPlay and its ad partners (and may also use Google AdMob). These providers may collect your device advertising ID, IP address and general usage data to serve and measure ads. Where the law requires it, you are asked for consent, and you can change your choice any time in Settings > Ad privacy choices. See unity.com/legal/privacy-policy and policies.google.com/technologies/ads to learn how they use data.',
  },
  {
    title: 'Security note',
    body: 'Local traffic is protected only by the room code. It is not end-to-end encrypted, so use the app on networks you trust.',
  },
  {
    title: 'Children',
    body: 'Offline Connect Pro is not directed at children under 13.',
  },
  {
    title: 'Contact',
    body: `Questions or requests: ${PRIVACY_EMAIL}`,
  },
];

export default function PrivacyScreen() {
  const { colors } = useApp();
  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>‹  Back</Text>
      </Pressable>
      <Heading title="Privacy policy" subtitle="Offline Connect Pro" />
      {sections.map((s) => (
        <Card key={s.title}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{s.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{s.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
