# Offline Connect Pro — 2.4.4.0

Offline Connect Pro is a local-network communication app. The existing project includes room hosting/joining, nearby discovery, private and group chat, small file sharing, and one-to-one WebRTC calls.

## Version 2.4.4.0 focus
This update focuses on the voice-call problem:
- Fixes the room-host sender ID used when routing a call to another room member.
- Processes call signals from the always-running network provider, reducing the chance of losing early ICE candidates while opening the call screen.
- Queues remote ICE candidates until WebRTC is ready to apply them.
- Adds a visible incoming-call screen with vibration alert, accept/decline controls, call status, and microphone mute.
- Ensures direct calls use the other member's ID, not the local conversation ID.
- Uses the supplied artwork as the app icon and adds a short animated startup screen.

Video calling remains present but is not the focus of this version.

## Build an Android APK with GitHub Actions
1. Download and extract the ZIP, then open the extracted `offline-connect-pro-main` folder.
2. Upload the contents of that folder to the root of your GitHub repository (not the containing folder itself).
3. Commit the changes to the `main` branch.
4. In GitHub, open **Actions**.
5. Select **Build Android APK** in the left panel.
6. Tap **Run workflow**, select `main`, and run it.
7. Wait for the workflow to finish. If it succeeds, open the run and download the `offline-connect-pro-android-debug` artifact.
8. Extract the artifact ZIP to get the APK and install it on both test phones.

The workflow installs dependencies, aligns Expo packages, runs TypeScript validation, generates the Android project, and builds a debug APK.

## Test voice calling
1. Install the same APK on two Android phones.
2. Connect both to the same central Wi-Fi router.
3. Turn mobile data off on both phones.
4. Open Offline Connect Pro on both and join the same room (the host creates the room; the other phone joins it).
5. Open a private chat between the two members and place an audio call.
6. Accept the incoming call and verify that both phones can hear each other.
7. Keep the call active for at least 10 minutes, then repeat with one phone hosting a hotspot and the other joining it.

The app needs a local network path between the phones. The current call relay requires both devices to be members of the same room session. A central router is the recommended first test. Hotspot behavior can vary by Android manufacturer and hotspot isolation settings.

## Important limitations
- A complete Android build and physical two-phone call test were not possible in the preparation environment because npm dependency installation timed out.
- The code is prepared for GitHub Actions validation, but a successful CI build and real-device test are still required before calling this release error-free.
- Video calling, background calls, multi-person calls, and app-store release signing are not certified by this update.
