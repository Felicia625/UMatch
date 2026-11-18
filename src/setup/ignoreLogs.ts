import { LogBox } from 'react-native';

// The app uses LOCAL notifications only. Importing expo-notifications in Expo Go prints warnings about remote (push)
// notifications that this app does not use, so they are hidden. Import this file first so it runs before that package loads.
LogBox.ignoreLogs([
  'expo-notifications` functionality is not fully supported in Expo Go',
  '[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go',
]);
