import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ActionButton, Card, Heading, SectionTitle } from '@/components/UI';
import AdBanner from '@/components/AdBanner';

import { useApp } from '@/state/AppContext';
import { useNetwork } from '@/state/NetworkContext';

export default function HomeScreen() {
  const { colors, profile } = useApp();
  const net = useNetwork();

  const status =
    net.status === 'hosting'
      ? 'Hosting a room'
      : net.status === 'connected'
        ? 'Connected to a room'
        : 'Discovering nearby rooms';

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, gap: 5 }}>
          <Text
            style={{
              color: colors.muted,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >
            OFFLINE CONNECT PRO
          </Text>

          <Heading
            title={`Hello, ${profile.name.split(' ')[0]}`}
            subtitle="Talk, share and meet nearby—without internet."
          />
        </View>

        <Pressable
          onPress={() => router.push('/profile' as never)}
          style={{
            width: 50,
            height: 50,
            borderRadius: 18,
            backgroundColor: colors.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="person"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* Connection Status */}
      <Card style={{ backgroundColor: colors.surface2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor:
                net.status === 'idle'
                  ? colors.warning
                  : colors.primary,
            }}
          />

          <Text
            style={{
              color: colors.text,
              fontWeight: '800',
            }}
          >
            {status}
          </Text>
        </View>

        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {net.room
            ? `${net.room.name} · code ${net.room.code}`
            : 'Turn on Wi-Fi or a phone hotspot. Nearby rooms are searched automatically.'}
        </Text>

        {net.room ? (
          <ActionButton
            title="Leave room"
            icon="exit-outline"
            secondary
            onPress={() => net.leave()}
          />
        ) : null}
      </Card>

      {/* Main Actions */}
      <SectionTitle>Get connected</SectionTitle>

      <View
        style={{
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <ActionButton
            title="Create room"
            icon="add-circle"
            onPress={() => router.push('/create-room' as never)}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ActionButton
            title="Join room"
            icon="enter"
            secondary
            onPress={() => router.push('/join-room' as never)}
          />
        </View>
      </View>

      {/* Nearby Rooms */}
      <SectionTitle>Nearby rooms</SectionTitle>

      {net.peers.length ? (
        net.peers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() =>
              router.push({
                pathname: '/join-room',
                params: {
                  host: p.host,
                  code: p.roomCode,
                },
              })
            }
          >
            <Card
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name="wifi"
                size={22}
                color={colors.primary}
              />

              <View
                style={{
                  flex: 1,
                  gap: 3,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: '800',
                  }}
                >
                  {p.roomName}
                </Text>

                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  {p.name} · {p.members}/{p.maxMembers} devices
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.muted}
              />
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <Text
            style={{
              color: colors.muted,
              fontSize: 13,
            }}
          >
            No rooms found yet. Make sure devices are on the same
            Wi-Fi or hotspot network.
          </Text>
        </Card>
      )}

      {/* About Offline Connect */}
      <SectionTitle>Built for local communication</SectionTitle>

      <Card style={{ gap: 8 }}>
        <Text
          style={{
            color: colors.text,
            fontWeight: '800',
          }}
        >
          No cloud account. No mobile data.
        </Text>

        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          Messages, room discovery and supported calls use your
          local network. One phone hosts the room; other phones
          join it.
        </Text>
      </Card>

      {/* AdMob Test Banner */}
      <View
        style={{
          alignItems: 'center',
          width: '100%',
          paddingTop: 4,
        }}
      >
        <AdBanner />
      </View>
    </Screen>
  );
}
