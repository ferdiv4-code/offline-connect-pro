# Build an Android APK without a paid coding platform

The project includes `.github/workflows/build-android.yml` so GitHub Actions can generate a signed-for-testing Android debug APK on a free public repository.

1. Create a GitHub account if you do not already have one.
2. Create a **public** repository named `offline-connect-pro`.
3. Upload the contents of this project folder to the repository root (not the ZIP file itself).
4. Open the repository's **Actions** tab.
5. Select **Build Android APK** and press **Run workflow**.
6. When the workflow finishes successfully, open its run and download the artifact named `offline-connect-pro-android-debug`.
7. Extract the downloaded artifact and install `app-debug.apk` on Android. Android may ask you to allow installation from the browser or file manager you used.

GitHub Actions has usage limits and policies that can change. A public repository generally has free standard-runner usage, but GitHub may apply account-level restrictions. This workflow does not require Replit or a paid coding subscription.

The APK is a debug build for personal installation, not a Play Store release. A failed workflow will show the exact build error in its log. The workflow has not been run from this environment.

## iPhone

The same source targets iOS, but a physical iPhone installation requires an iOS build made on macOS and signing with an Apple provisioning profile. A Windows/Android-only environment cannot create a directly installable iPhone IPA. iOS network discovery also has stricter multicast entitlement requirements; manual host-IP joining is provided as a fallback.
