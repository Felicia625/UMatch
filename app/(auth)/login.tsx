import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Screen, TextField } from '../../src/components/ui';
import { useTheme } from '../../src/constants/theme';
import {
  friendlyAuthError,
  isAppError,
  login,
  requestPasswordReset,
  resendVerificationEmail,
} from '../../src/services/auth';

export default function Login() {
  const t = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  async function onLogin() {
    if (!email.trim() || !password.trim()) return Alert.alert('Please fill all fields');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password.trim());
      // AuthGate in app/_layout.tsx redirects to the tabs once the user is verified and signed in.
    } catch (e) {
      setNeedsVerification(isAppError(e) && e.code === 'email-not-verified');
      Alert.alert('Login failed', friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    try {
      await resendVerificationEmail(email.trim().toLowerCase(), password.trim());
      Alert.alert('Verification email sent', 'Check your student inbox, then log in again.');
    } catch (e) {
      Alert.alert('Could not send email', friendlyAuthError(e));
    }
  }

  async function onReset() {
    if (!resetEmail.trim()) return Alert.alert('Please enter your email');
    try {
      await requestPasswordReset(resetEmail.trim().toLowerCase());
      setForgotOpen(false);
      Alert.alert('Check your inbox', 'If an account exists for that email, a reset link is on its way.');
    } catch (e) {
      Alert.alert('Failed to send reset email', friendlyAuthError(e));
    }
  }

  return (
    <Screen>
      <Text style={[styles.title, { color: t.text }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>Sign in to continue</Text>

      <TextField placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

      <Pressable onPress={() => { setResetEmail(email); setForgotOpen(true); }}>
        <Text style={[styles.link, { color: t.primary }]}>Forgot Password?</Text>
      </Pressable>

      <Button title="Log In" onPress={onLogin} loading={loading} />
      {needsVerification && <Button title="Resend verification email" variant="ghost" onPress={onResend} />}

      <Text style={[styles.or, { color: t.textSecondary }]}>or</Text>
      <Button title="Sign Up" variant="outline" onPress={() => router.push('/register')} />

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.dialog, { backgroundColor: t.surface }]}>
            <Text style={[styles.dialogTitle, { color: t.text }]}>Reset Password</Text>
            <Text style={{ color: t.textSecondary, marginBottom: 12 }}>Enter your email to receive a reset link.</Text>
            <TextField placeholder="Email" value={resetEmail} onChangeText={setResetEmail} autoCapitalize="none" keyboardType="email-address" />
            <Button title="Send reset link" onPress={onReset} />
            <Button title="Cancel" variant="ghost" onPress={() => setForgotOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  link: { textAlign: 'right', marginBottom: 12, fontWeight: '600' },
  or: { textAlign: 'center', marginVertical: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
});
