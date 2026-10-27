# UMN Dating: React Native (Expo + TypeScript)

Kotlin to Expo rewrite so far: project structure, typed data model, Firebase auth, the
splash / onboarding / login / register / terms flow, the swipe deck (like / pass / match / filters), a read-only profile view, and the own-profile area (view, edit with photo upload, who liked me / people I liked / people I passed, change password, delete account).
Not yet run on a device, so expect a few small fixes on first launch.

## Set up
1. `npx create-expo-app@latest umn-dating` (default template), then `cd umn-dating`
2. `npm run reset-project`, then delete the generated `app-example/` folder
3. Copy this folder's `app/`, `src/`, `assets/logo.png` and `.env.example` into the project (overwrite `app/`)
4. `npx expo install firebase @react-native-async-storage/async-storage expo-splash-screen expo-image expo-image-picker react-native-gesture-handler react-native-reanimated`
   (if Expo says reanimated needs `react-native-worklets`, `npx expo install react-native-worklets` too)
5. Copy `.env.example` to `.env` and fill in your Firebase web-app values
6. In `app.json` add `["expo-image-picker", { "cameraPermission": "Allow UMN Dating to use the camera for your profile photo." }]` to `plugins`, and set `"scheme": "umndating"`, `"android.package": "com.example.datingapp"`, `"name": "UMN Dating"`
   and point `icon` to `./assets/logo.png`
7. `npx expo start`  (Expo Go is fine for this phase; push notifications will need a dev build later)

Test path for swipe: you need at least two verified accounts of opposite preference. Like each other from both accounts to see the match dialog.

Test path for auth: Sign Up with an `@student.umn.ac.id` address, verify the email, log in, see your name on Profile, log out.

## Layout
- `app/` Expo Router screens: `(auth)` for onboarding/login/register/terms, `(tabs)` for the signed-in shell
- `src/services/` all Firebase access lives here (swap these files when you move to your own backend)
- `src/types/` data model for users, swipes, matches, messages
- `src/components/ui.tsx` shared Button / TextField / OptionPicker
