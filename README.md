# Offline Connect Pro 2.0

A local-network communication app source project for Android and iOS. It is designed to run on the same Wi-Fi network or a phone hotspot without a cloud account or internet service.

## Included in this source build
- Expo Router mobile app with Home, Chats, Rooms, Calls and Settings.
- Local SQLite persistence for conversations and messages.
- TCP room host/client messaging transport on the Wi-Fi interface.
- UDP LAN broadcast room discovery with manual host-IP fallback and host IP display.
- Room codes, private-room gate, room capacity setting and member events.
- Local file attachment transfer encoded over the room connection (small files only).
- WebRTC one-to-one audio/video call implementation with local-only ICE configuration.
- Profile, theme and local settings from the original scaffold.

## Important build facts
This app uses native modules (`react-native-tcp-socket`, `react-native-udp`, `react-native-webrtc`). It **cannot run in Expo Go**. It needs a native development build generated with Expo prebuild/EAS Build. iOS compilation and signing require macOS/Xcode or a compatible cloud build environment. This source archive is not an APK or IPA.

## Install / build
Use Node.js 22.13+ for Expo SDK 57. The project uses the SDK 57-compatible React Native and Expo package line.

```bash
npm install
npx expo install --fix
npx expo prebuild
```

Android debug build from a computer with Android SDK/JDK configured:
```bash
npx expo run:android
```

For a cloud Android preview build:
```bash
npx eas-cli build --platform android --profile preview
```
EAS may have free-tier limits and requires an Expo account. Do not assume unlimited free builds.

## How to use
1. Install the same native build on the phones.
2. Connect phones to the same Wi-Fi network, or connect other phones to the host phone's hotspot.
3. On one phone, choose Create Room and keep the app open.
4. On other phones, choose the discovered room. If it is not found, enter the host phone's local IP address and room code.
5. Open the room chat to exchange messages and small files.
6. Start an audio/video call from a conversation header.

## Network limitations
- The Wi-Fi access point must permit client-to-client traffic. Guest networks and client isolation can block all peer communication.
- Hotspot behavior differs by Android manufacturer. Some hotspots block UDP broadcast or client-to-client traffic.
- iOS local-network permissions must be granted. iOS UDP broadcast discovery may require Apple’s Multicast Networking entitlement; without it, use the displayed host IP and manual join. iOS background execution rules are stricter than Android.
- For a first build, keep the host app in the foreground.
- WebRTC uses no public STUN/TURN servers here; therefore direct local ICE connectivity is required. Some network combinations will fail to establish calls.
- Group text chat is supported. This delivery includes one-to-one voice/video calling; multi-person group voice/video calling is not implemented yet. Large group video calls would require a local media-forwarding service (SFU).
- File sharing is intended for small files; the chat transport sends file bytes in a base64 JSON packet and has a conservative size limit.

## Security note
Room codes are a basic join gate, not end-to-end encryption. Do not use this first build for sensitive or confidential communication. Add authenticated encryption and stronger peer identity verification before public release.

## Status
This is a substantial source implementation, not a device-certified release. It has not been compiled or tested on physical Android/iOS devices in this environment. The first real build may reveal native dependency or device-network compatibility fixes.
