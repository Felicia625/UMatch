import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, OptionPicker, PasswordField, Screen, TextField } from '../../src/components/ui';
import { GENDERS, MAJORS, schoolYearOptions } from '../../src/constants/options';
import { BirthDateField } from '../../src/components/BirthDateField';
import { useTheme } from '../../src/constants/theme';
import { friendlyAuthError, register } from '../../src/services/auth';
import { RegistrationForm, validateRegistration } from '../../src/utils/validation';

const emptyForm: RegistrationForm = {
  username: '', password: '', name: '', email: '', birthDate: '', gender: '', schoolyear: '', major: '',
};

export default function Register() {
  const t = useTheme();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (key: keyof RegistrationForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function onSignUp() {
    const result = validateRegistration(form, accepted);
    if ('error' in result) return Alert.alert('Check your details', result.error);
    setLoading(true);
    try {
      await register(result.input);
      Alert.alert('Account created', 'Please verify your email before logging in.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e) {
      Alert.alert('Registration failed', friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
        <Text style={{ color: t.text, fontSize: 24 }}>←</Text>
      </Pressable>
      <Text style={[styles.title, { color: t.text }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>Join UMN Dating today</Text>

      <TextField placeholder="Username" value={form.username} onChangeText={set('username')} autoCapitalize="none" />
      <PasswordField placeholder="Password" value={form.password} onChangeText={set('password')} />
      <TextField placeholder="Full Name" value={form.name} onChangeText={set('name')} />
      <TextField placeholder="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <BirthDateField value={form.birthDate} onChange={set('birthDate')} />
      <OptionPicker label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS.map((g) => ({ value: g.code, label: g.label }))} />
      <OptionPicker label="School Year" value={form.schoolyear} onChange={set('schoolyear')} options={schoolYearOptions().map((y) => ({ value: y, label: y }))} />
      <OptionPicker label="Major" value={form.major} onChange={set('major')} options={MAJORS.map((m) => ({ value: m.code, label: m.label }))} />

      <View style={styles.termsRow}>
        <Pressable
          onPress={() => setAccepted((a) => !a)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          style={[styles.box, { borderColor: t.primary, backgroundColor: accepted ? t.primary : 'transparent' }]}
        >
          {accepted && <Text style={{ color: t.onPrimary, fontWeight: '800' }}>✓</Text>}
        </Pressable>
        <Text style={{ color: t.text, flexShrink: 1 }}>
          I agree to the{' '}
          <Text style={{ color: t.primary, fontWeight: '600' }} onPress={() => router.push('/terms')}>
            Terms and Conditions
          </Text>
        </Text>
      </View>

      <Button title="Sign Up" onPress={onSignUp} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginTop: 12 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
