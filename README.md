# UMatch

<img width="1265" height="1044" alt="logo" src="https://github.com/user-attachments/assets/e7423fb3-d7ad-47ea-87e1-75800ae0c5b3" />


UMatch is a mobile and web app for Universitas Multimedia Nusantara (UMN) students to meet each other, either by **matching** (the default mode) or as **friends** (Friend Mode). It is a rewrite of the original native Android (Kotlin) app in **React Native with Expo and TypeScript**, using **Firebase** for the backend.


## Features

**Account**
- Sign up and log in with a UMN student email (`@student.umn.ac.id`) and email verification; forgot password by reset email.
- Date of birth instead of age (minimum age 17); the age is calculated from it every time a profile is loaded.
- A public **username** is shown everywhere. The full name (taken from the email) stays private.
- Edit profile with photo upload, unsaved-changes warning, change password, delete account (asks for the password first).

**Discover**
- Swipe deck with like / pass, a match dialog, and a filter linked to "I want to connect with" (batch and major).
- Two modes, switched with the Friend Mode switch on the Profile tab:
  - **Match mode** (default): you meet people of the opposite gender who are also in Match mode.
  - **Friend Mode**: you meet other Friend Mode users of any gender.
- You can only like people in the same mode. The like icon is a heart in Match mode and a handshake / thumbs-up in Friend Mode.
- Empty and error states with Adjust filters and Refresh buttons.

**Likes**
- *Who liked me*: people who liked you in the mode you are in now. The mode of a like is stored when the like is made, so it stays even if the other person switches mode later. A notice tells you how many people liked you in the other mode and have not been liked back.
- *People I liked*: with a Match / Friend badge per like and unlike with confirmation.
- *People I passed*: undo a pass.
- Search by username on all three lists.

**Matches and chat**
- Matches list (Active / Inactive / Blocked), All / Match / Friend filter, favourites, block and unblock.
- Chat with reply, edit, delete, pin and copy; Enter sends and Shift+Enter makes a new line on the web.
- **AI conversation starters** in Bahasa Indonesia (Gemini through Firebase AI Logic, 5 requests per day, built-in ideas as fallback).
- Local notifications for new matches and messages.

**Connections graph**
- A force-directed graph (in the style of Obsidian's graph view) of a person's matches and the matches of those people. Pictures grow with the number of connections, pink lines are Match connections and orange lines are Friend connections.
- Drag a picture to move it, drag the background to pan, zoom with the buttons, the mouse wheel (web) or two fingers (full screen on a phone). Hover (web) or hold / drag (phone) a picture to light up the shortest way to the person in the middle.
- Each person decides whether their connections are visible to others (default: hidden).

**Web / desktop**
- Same app in the browser. At 900 px wide or more it shows an icon-only navigation rail (Home, Matches, Profile, Guide, Settings) with hover labels; phones keep the bottom tabs.
- Right-click menus on chat messages, custom scrollbar, custom dialogs instead of browser pop-ups.

**Other**
- Light and dark theme, first-run tutorial, Guide, Settings, Terms and Conditions.

## Tech stack

| Area | Technology |
|---|---|
| App | React Native, Expo (SDK 57), TypeScript |
| Navigation | Expo Router (file based; stack + tabs) |
| Backend | Firebase Authentication, Cloud Firestore, Firebase AI Logic (Gemini) |
| Photos | Cloudinary (unsigned upload) |
| Notifications | `expo-notifications` (local only, no push) |
| Tests | Jest (`jest-expo`), Firestore rules tests with the Firebase emulator |

## Getting started

### Prerequisites
- Node.js (LTS) and npm
- A Firebase project with a Web app, Email/Password sign-in turned on, and Cloud Firestore created
- Expo Go on a phone, or an emulator, or just a browser (`w` in the Expo CLI)

### Install
1. Create the Expo project and bring the code in:
   ```bash
   npx create-expo-app@latest umn-dating
   cd umn-dating
   npm run reset-project   # then delete the generated app-example/ folder
   ```
   Copy this repository's `app/`, `src/`, `assets/`, `__tests__/`, `rules-tests/`, `jest.config.js` and `.env.example` into the project (overwrite `app/`).
2. Install the dependencies:
   ```bash
   npx expo install firebase @react-native-async-storage/async-storage expo-splash-screen expo-image \
     expo-image-picker expo-notifications expo-clipboard expo-screen-orientation \
     react-native-gesture-handler react-native-reanimated
   ```
   If Expo says Reanimated needs `react-native-worklets`, run `npx expo install react-native-worklets` as well.
3. Configure `app.json`:
   - `"name": "UMatch"`, `"scheme": "umndating"`, `"android.package": "com.example.datingapp"`
   - `icon` → `./assets/icon.png`, Android `adaptiveIcon.foregroundImage` → `./assets/adaptive-icon.png` (`backgroundColor` `#FFFFFF`), `web.favicon` → `./assets/favicon.png`
   - plugins: `expo-splash-screen` with `image` `./assets/splash-icon.png`, `expo-image-picker` (with a camera permission text such as "Allow UMatch to use the camera for your profile photo."), and `expo-notifications` with `icon` `./assets/notification-icon.png`
4. Create `.env` from `.env.example` (see below).
5. Publish the Firestore rules (see below).
6. Start the app:
   ```bash
   npx expo start        # press w for the web version, scan the QR code for a phone
   npx expo start -c     # the same, with a clean cache (after changing .env)
   ```

> Expo Go is fine for everything except the custom notification icon and the UMatch app icon, which only show in a development build (`npx expo run:android` or EAS Build). Notifications are local, so no push setup is needed.

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID` | Firebase web app config (Firebase console → Project settings → Your apps) |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Profile photo upload |
| `EXPO_PUBLIC_GEMINI_MODEL` | Optional. A Gemini model name with a free tier; leave empty to use only the built-in conversation starters |

Everything with the `EXPO_PUBLIC_` prefix is bundled into the app, so never put a secret in it. Do not commit `.env`.

### Firebase setup
- **Authentication**: enable Email/Password. Accounts must verify their email before they can log in.
- **Firestore rules**: the rules are in `firestore.rules.proposed`. Copy them into Firebase console → Firestore → Rules and press Publish (republish after every change to that file).
- **AI conversation starters** (optional): Firebase console → AI Logic → Get started → Gemini Developer API, then set `EXPO_PUBLIC_GEMINI_MODEL`. Without it the app uses the built-in ideas only.
- Deleting users in the Firestore console does not delete their login. Remove them in Authentication → Users too, or use *Delete account* in the app.

## Data model (Cloud Firestore)

| Collection | Content |
|---|---|
| `users/{uid}` | username, name, email, birthDate, gender (`M`/`F`), major, schoolyear, bio, photoUrl, `friendFirst` (Friend Mode), preference (batch, majors) |
| `swipes/{uid}` | `liked[]`, `passed[]`, `likeModes` (`{ otherUid: 'friend' \| 'dating' }`, the mode each like was made in) |
| `matches/{uidA_uidB}` (ids sorted) | `users[]`, `friend` (mode of the match), `modeHistory[]`, `lastMessage`, `lastSenderId`, `timestamp`; subcollection `chats/{id}` with the messages |
| `blocks/{uid}` | `blockedUsers[]` |
| `favorites/{uid}` | `favoriteUsers[]` |
| `connections/{uid}` | `visible`, `partners[]`, `friends[]`: the small public document the connections graph is drawn from, written only by its owner |

## Project structure

```
app/                    Expo Router screens
  (auth)/               onboarding, login, register
  (tabs)/               Home (discover), Matches, Profile
  chat/  lists/  profile/   chat, liked/passed lists, profile view and edit
  connections.tsx  guide.tsx  settings.tsx  terms.tsx
src/
  components/           UI pieces (swipe deck, chat, graph, side navigation, dialogs, ...)
  services/             all Firebase access (auth, users, swipes, likes, matches, chat, connections, AI starters)
  providers/            auth and theme providers
  utils/                pure logic (age, validation, who-can-see-whom, like modes, force layout, ...)
  constants/  types/  config/  hooks/  setup/
assets/                 icons, logo (umatch-logo.svg is the source of the generated PNGs)
__tests__/              Jest unit tests
rules-tests/            Firestore security rules tests
```

All Firebase access lives in `src/services/`, so moving to another backend later means replacing those files.

## Tests

**Unit tests (Jest)**
```bash
npx expo install jest-expo jest @types/jest --dev
```
Add `"types": ["jest"]` to `compilerOptions` in `tsconfig.json` and `"test": "jest"` to the `scripts` in `package.json` (do not add a `"jest"` key: the configuration is in `jest.config.js`).
```bash
npm test                 # one run
npx jest --coverage      # with a coverage table
npx jest likeModes       # only files whose name contains "likeModes"
npx tsc --noEmit         # type check
```
The tests cover the pure logic: age from birth date, names from the email, registration validation, who-can-see-whom, like modes, the force layout and shortest path, year preferences, conversation starters, and the Firestore document normaliser.

**Firestore rules tests**: `rules-tests/firestore.rules.test.js` uses `@firebase/rules-unit-testing` and expects the Firebase emulator on `127.0.0.1:8080` and the rules in a file named `firestore.rules` in the project root (a copy of `firestore.rules.proposed`).

## Notifications

Only local notifications are used (`expo-notifications`, no push, no FCM token, no server). `NotificationWatcher` listens to the signed-in user's matches and posts a notification for a new match and for a new incoming message; tapping it opens the chat. They only fire while the app process is running, and can be turned off in Settings.

## Known limitations
- Enforcement of "same mode / opposite gender" and of hidden connections happens in the app; a modified client could still read other users' data. Real enforcement belongs on a server.
- Photo verification from the Android app was not ported: `photoVerified` stays false and no badge is shown.
- No push notifications (see above).
- The AI conversation starters depend on Firebase AI Logic working in your Expo setup and on the free-tier quota shared by all users of the project; if it fails the app falls back to the built-in ideas.
- Not tested on every device and screen size yet, so expect small fixes.

## More documentation
`MIGRATION_NOTES.md` has the screen map from the Kotlin app, the problems found in the original app, and the decisions made during the rewrite.

## Branding
Colours live in `src/constants/theme.ts`: UMN dark blue `#0D346E` (primary), logo blue `#0661C6` (accent) and `#4E89CE` (light accent). Dark mode uses a lighter primary (`#3C7CC6`) so text and icons stay readable.
