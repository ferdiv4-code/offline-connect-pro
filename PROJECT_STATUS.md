# Offline Connect Pro — 2.0 source delivery

Implemented in source:
- App navigation, profile, theme and local persistence.
- LAN TCP room host and TCP client.
- UDP room advertisement/discovery.
- Manual IP joining fallback.
- Room-code validation and room metadata.
- Local group conversation storage and live message relay.
- Small file attachment transfer over local TCP.
- WebRTC one-to-one audio/video call signaling and media tracks.
- Private one-to-one text/file conversation routing inside a room.
- Local-only/no-cloud architecture.

Not certified:
- No Android APK or iOS IPA is included.
- No physical device build/test was possible in this environment.
- Android hotspot and iOS peer-to-peer behavior varies by OS/device/network.
- Multi-person voice/video calls, large file transfers, end-to-end encryption, background calls and app-store release hardening remain beyond this first source delivery.

Next required action is a native build, not a sequence of feature phases. If the first build reports an error, use that exact error to make the necessary fixes.
