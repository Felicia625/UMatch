# Migration notes: Kotlin to Expo

## Screen map
| Android | New (Expo Router) | Phase |
|---|---|---|
| SplashActivity | native splash + AuthGate (`app/_layout.tsx`) | 1 done |
| OnboardingActivity | `(auth)/onboarding` | 1 done |
| LoginActivity (+ forgot password) | `(auth)/login` | 1 done |
| RegisterActivity, TermsActivity | `(auth)/register`, `(auth)/terms` | 1 done |
| MainActivity (bottom nav, header, first-run tutorial) | `(tabs)/_layout`, tutorial later | 1 shell, tutorial 5 |
| ProfileFragment (logout, change password, delete account) | `(tabs)/profile` | done |
| ProfileViewFragment | `profile/[uid]` | read-only view done (photo-scan animation later) |
| LikesFragment, MyLikesFragment, PassedUsersFragment | `lists/[kind]` | done |
| ProfileEditActivity (photo, preferences, verification) | `profile/edit` | done except photo verification |
| HomeFragment + CardStackAdapter + filter + match dialog | `(tabs)/index` swipe deck | done |
| MatchListFragment (tabs, search, favorites, block) | `(tabs)/matches` | 4 |
| ChatFragment + ChatAdapter (reply, edit, delete, pin) | `chat/[matchId]` | 4 |
| MyFirebaseMessagingService, NotificationHelper, FCMSender | expo-notifications + server function | 4 |
| SettingsFragment (dark mode), GuideFragment | settings, guide | 5 |
| SharedPrefManager, DummyData, DummyChatManager, root-package MainActivity | dropped (dead code) | n/a |
| EditProfileActivity (root package) | dropped (early TFLite test screen, folded into profile edit) | n/a |

## Firestore schema (inferred from the code)
- `users/{uid}`: uid, username, name, email, age, gender (M/F), major (code), schoolyear, school, bio, photoUrl, photoVerified, preference{gender, yearPreferences, majorPreferences[]}, fcmToken
- `swipes/{uid}`: liked[], passed[]
- `matches/{uidA_uidB}` (ids sorted): users[], lastMessage, timestamp; subcollection `chats/{id}`: senderId, text, timestamp, messageId, replyTo, replyText, edited, pinned
- `blocks/{uid}`: blockedUsers[]    `favorites/{uid}`: favoriteUsers[]

## Problems found in the current app (not carried over)
1. **Plain-text passwords in Firestore.** RegisterActivity writes `password` into `users/{uid}`, and HomeFragment downloads the whole users collection, so every client receives every password. Delete that field from existing documents now and treat those passwords as exposed.
2. **Push notifications don't actually send.** FCMSender calls the legacy FCM endpoint (shut down in 2024) with a server key in the app, and NotificationHelper only logs. Phase 4 sends from a server function instead.
3. **Photo verification is client-trusted.** The app sets `photoVerified` from its own model result, so anyone can set it. The model classifies face manipulation (Deepfakes, Face2Face, FaceShifter, FaceSwap, NeuralTextures, Ori); it cannot tell you the person is who they claim. Plan: run it server-side and word the badge accordingly.
4. **Home loads every user and filters on the device.** Won't scale and exposes profile data. Phase 3 queries with filters and pagination.
5. **Chat edit/delete/pin find messages by text+timestamp** instead of document id. New code uses ids.
6. **Gender preference mismatch.** The edit screen saves the dropdown text while Home compares against "M"/"F". `services/users.ts` normalises both.
7. **Age rule inconsistency.** Code allows 17+, the Terms say 18+, and the register layout says "LocalDate". Pick one.
8. **Forgot password** queried Firestore by email+name before sending the reset, which needs publicly readable user data. Replaced by a plain reset email.

## Swipe deck notes
- The Android filter dialog never applied its filters (`applyFilters` was not called). The new filter dialog works and overrides saved preferences until cleared.
- Candidates are queried by preferred gender (and year) instead of downloading all users; the first 100 matches are used. Add paging before launch.
- Blocked users are now left out of the deck.
- Matching still happens on the device by reading the other user's `swipes` document, so your Firestore rules must allow that read. When you build your own backend, do matching server-side so swipe history stays private.
- The old app had no undo; the undo icon in your drawables was unused, so it was not ported.

## Profile / likes notes (phase 2)
- **Year preference never worked.** The edit screen offers Senior / Junior / Seangkatan / No Preferences, but HomeFragment compared the other person's school year to that literal text, so those choices matched nobody. They now mean "earlier batch", "later batch" and "same batch" relative to your own year. I assumed Senior = earlier batch; tell me if your intended meaning was the opposite.
- **Gender and major preferences were saved as display text** ("Male", "Informatika") while Home compared codes ("M", "TI"). The new edit screen saves codes, and the reader accepts both.
- **Photo check is not ported yet.** The Android app blocked saving a photo the model didn't call "Ori". The new app uploads new photos with `photoVerified = false` (no badge) until verification is rebuilt server-side. Decide whether you want to block unverified photos or just not badge them.
- Cloudinary is kept for photo upload (cloud name and preset prefilled in `.env.example` from your Kotlin code).
- Delete account now asks for your password first and deletes the login last, so it can't leave a half-deleted account.
- "Who liked me" uses an array-contains query instead of downloading all swipes.
- FIREBASE_STRUCTURE.md shows `timestamp` as a number, but the code writes Firestore server timestamps. The new app follows the code.
- FIREBASE_STRUCTURE.md's rules only let a user read their own `swipes` document, but matching, "who liked me" and delete-account all read or update other people's swipes. If those are your live rules, those features will fail with permission-denied. Check the Rules tab in the Firebase console.

## Needs from you
- Your Firebase web-app config (goes in `.env`), and whether existing users must keep working (the new code reads old documents)
- Decision on item 7 (17 or 18)
- Whether to keep Cloudinary for photos until your own backend exists
