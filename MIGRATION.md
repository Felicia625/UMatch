# Native Android to React Native Migration

The source project is `../datingapp`. The React Native app keeps the same product flow while moving view logic into JavaScript/TypeScript.

## Migrated structure

- `activities/SplashActivity`, `OnboardingActivity`, `LoginActivity`, and `RegisterActivity` -> onboarding and auth states in `App.tsx` plus `src/services/authService.ts`
- `activities/MainActivity` and `drawer_menu.xml` -> `Home`, `Matches`, and `Profile` tabs in `App.tsx`
- `fragments/HomeFragment` and `CardStackAdapter` -> discovery card and swipe actions
- `fragments/MatchListFragment`, `LikesFragment`, `MyLikesFragment`, and `PassedUsersFragment` -> match and swipe service operations in `src/services/datingService.ts`
- `fragments/ProfileFragment` and `ProfileEditActivity` -> profile screen and `datingService.updateCurrentUser`
- `fragments/ChatFragment` and chat adapters -> chat screen and `datingService.getMessages/sendMessage`
- `fragments/GuideFragment`, `SettingsFragment`, and `TermsConditionsFragment` -> detail screens in `App.tsx`
- `models/User`, `Preferences`, `Match`, `Message`, `Gender`, `Jurusan`, and `YearPreferences` -> `src/models/dating.ts`
- `utils/DummyData` and `SharedPrefManager` -> `src/data/dummyData.ts` and `src/services/datingService.ts`
- `MyFirebaseMessagingService` -> `src/services/notificationService.ts`
- TensorFlow Lite image verification -> `src/services/mediaService.ts` interface

## Platform integrations still required

The UI and service boundaries are migrated, but production integrations require React Native packages and project credentials:

- Firebase Auth, Firestore, Storage, and Messaging
- AsyncStorage or a secure storage equivalent for `SharedPreferences`
- Image picker/camera and image upload
- A React Native TensorFlow Lite package for `model.tflite`
- Android notification permissions and iOS push notification setup

`android/app/google-services.json` and the source logo are now copied into the RN project. The Firebase file should be treated as Android build configuration, not imported by JavaScript.
