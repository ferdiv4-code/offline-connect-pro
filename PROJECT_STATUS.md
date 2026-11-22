# Offline Connect Pro — version 2.4.4.0

## Scope of this update
- Focused on repairing one-to-one local voice-call signalling and the incoming-call experience.
- Kept the existing room, chat, file-transfer, peer-discovery and navigation implementation.
- Video calling remains in the interface but is not the focus of this release.

## Call fixes included
- Corrected the room-host sender identity when the host relays a call signal to a room member.
- Added sender names to relayed packets so the receiving device can identify the caller.
- Moved call-signal handling into the always-mounted network provider so early ICE candidates are not lost while the call screen is opening.
- Queue ICE candidates until the remote WebRTC description is ready, then apply them.
- Do not clear queued incoming ICE candidates when the recipient accepts the call.
- Show a visible incoming-call screen with vibration alert and accept/decline controls instead of relying only on a system alert.
- Added microphone mute control and clearer call states for ringing, connecting, connected, reconnecting and failure.
- Fixed direct-chat call buttons to use the other member's ID rather than the conversation ID.

## Branding
- App/package version: `2.4.4.0`
- Android version code: `2440`
- Added the supplied artwork as the launcher/adaptive icon.
- Added a short animated in-app startup screen based on the supplied artwork.

## Important test status
- JSON configuration validation completed.
- The project dependency installation could not complete in this build environment because the npm registry connection timed out.
- Therefore a full TypeScript/Expo/Android build and physical two-phone call test have **not** been completed here.
- The GitHub Actions workflow now runs `npx tsc --noEmit` before producing the APK. A successful CI build is still required, followed by a two-device test on one shared router with mobile data disabled.

## Network requirements
- Both phones must be in the same room session for the current call-signalling relay to route calls.
- Both devices need a working local network path to each other. A shared router is the recommended baseline; a phone hotspot may work depending on Android hotspot isolation and device behavior.
- No cloud signalling or internet-based calling service is used. Android still requires the `INTERNET` permission for local TCP sockets; this does not mean the app uses mobile data for calls.

## Next validation
1. Build the APK with GitHub Actions.
2. Install the same APK on two Android phones.
3. Connect both phones to the same Wi-Fi router, turn off mobile data, and join the same room.
4. Send a private message, place a voice call, accept it on the second phone, and verify two-way audio for at least 10 minutes.
5. Repeat with one phone hosting a hotspot and the other joining it.
