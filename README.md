# UMatch

UMatch is an Expo React Native application backed by Firebase services.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19
- Firebase Authentication and client SDKs
- Cloud Firestore
- Firebase Data Connect
- Firebase Cloud Functions

## Prerequisites

Install the following before starting:

- Node.js 22.13 or newer
- npm
- Git
- Expo Go on a physical device, or an Android/iOS emulator
- Firebase CLI for backend development and deployment

Install the Firebase CLI if it is not already available:

```bash
npm install -g firebase-tools
firebase login
```

Expo SDK 57 targets Android 7+ and iOS 16.4+.

## Setup from GitHub

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Felicia625/UMatch.git
cd UMatch
```

Install the app dependencies:

```bash
npm install
```

Install the Firebase CLI and sign in:

```bash
npm install -g firebase-tools
firebase login
```

Start the Expo development server:

```bash
npm start
```

Then use the Expo terminal menu to open the app on a device or emulator. The available npm scripts are:

```bash
npm run android
npm run ios
npm run web
```

For a physical device, make sure the computer and device are on the same network. Expo Go must support the project's Expo SDK version.

## Firebase setup

The app is configured for the Firebase project `umatch-cc8cc`. If Firebase has not been initialized in your local checkout, run this from the repository root:

```bash
firebase init
```

Select the existing project `umatch-cc8cc` and configure the services used by this repository:

- Firestore
- Functions
- Data Connect

Keep the existing repository files when Firebase asks whether to overwrite them. The relevant configuration is already present in `firebaseConfig.js`, `firestore.rules`, `firestore.indexes.json`, `functions/`, and `dataconnect/`.

### Firestore

Deploy Firestore rules and indexes with:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The current rules are temporary development rules and allow unrestricted reads and writes until **October 16, 2026**. Replace them with authenticated, least-privilege rules before using the app with real user data.

### Cloud Functions

Install the Functions dependencies:

```bash
cd functions
npm install
cd ..
```

Run the Functions emulator:

```bash
cd functions
npm run serve
```

Deploy Functions from the repository root or the `functions` directory:

```bash
firebase deploy --only functions
```

### Firebase Data Connect

The Data Connect service is defined in `dataconnect/dataconnect.yaml` and uses the `umatch` service in `asia-southeast2`.

Use the Firebase CLI to deploy Data Connect after configuring the required Cloud SQL/Data Connect access:

```bash
firebase deploy --only dataconnect
```

Generated client code is stored in `src/dataconnect-generated/`. Regenerate it using the Firebase Data Connect workflow whenever the schema or connector queries change.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run android` | Start Expo and open Android |
| `npm run ios` | Start Expo and open iOS |
| `npm run web` | Start the web version |
| `firebase emulators:start` | Start configured Firebase emulators |
| `firebase deploy` | Deploy configured Firebase services |

## Project structure

```text
app/                    Expo Router screens and routes
assets/                 App icons and other static assets
dataconnect/            Data Connect schema, connectors, and seed data
functions/              Firebase Cloud Functions
src/dataconnect-generated/Generated Data Connect client code
firebaseConfig.js       Firebase client configuration
firestore.rules         Firestore security rules
firestore.indexes.json  Firestore indexes
app.json                Expo application configuration
```

## Troubleshooting

- If Expo reports a version mismatch, run `npx expo install --fix` and confirm that the installed packages match Expo SDK 57.
- If the app cannot connect to Firebase, verify that you are using the expected Firebase project and that the required services are enabled in the Firebase console.
- If an emulator command fails, confirm that you are logged in with `firebase login` and that the Firebase CLI is using the correct project.
