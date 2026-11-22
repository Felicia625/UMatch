import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../../src/constants/theme';
import { Button } from '../../src/components/ui';

export default function Onboarding() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Connect with fellow UMN students</Text>
        <Text style={styles.body}>Meet and chat with people around campus</Text>
      </View>
      <View style={styles.footer}>
        <Button title="Get Started" onPress={() => router.push('/login')} />
        <Text style={styles.hint}>Start connecting with your campus</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 260, height: 215, marginBottom: 28 },
  subtitle: { color: palette.light.primary, fontSize: 20, fontWeight: '700' },
  body: { color: palette.light.textSecondary, marginTop: 4 },
  footer: { paddingBottom: 12 },
  hint: { color: palette.light.textSecondary, textAlign: 'center', marginTop: 12 },
});
