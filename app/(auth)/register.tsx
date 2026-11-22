import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, OptionPicker, PasswordField, Screen, TextField } from '../../src/components/ui';
import { GENDERS, MAJORS, schoolYearOptions } from '../../src/constants/options';
import { BirthDateField } from '../../src/components/BirthDateField';
import { FriendModeSwitch } from '../../src/components/FriendModeSwitch';
import { friendlyAuthError, register } from '../../src/services/auth';
import { displayNameFromEmail } from '../../src/utils/names';
import { useTheme } from '../../src/constants/theme';
import { EMAIL_DOMAIN } from '../../src/constants/options';
import { RegistrationForm, validateRegistration } from '../../src/utils/validation';

const emptyForm: RegistrationForm = {
  username: '', password: '', email: '', birthDate: '', gender: '', schoolyear: '', major: '', friendFirst: false,
};

export default function Register() {
  const t = useTheme();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (key: Exclude<keyof RegistrationForm, 'friendFirst'>) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  // There is no Full Name field: the name is set from the email (felicia.sabatini@... -> "Felicia Sabatini") and cannot
  // be edited later. This only previews it.
  const namePreview = form.email.includes('@') ? displayNameFromEmail(form.email.trim().toLowerCase()) : '';

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
    <Screen maxWidth={440}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
        <Text style={{ color: t.text, fontSize: 24 }}>←</Text>
      </Pressable>
      <Text style={[styles.title, { color: t.text }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>Join UMatch today</Text>

      <FriendModeSwitch value={form.friendFirst} onChange={(v) => setForm((f) => ({ ...f, friendFirst: v }))} />

      <TextField placeholder="Username" value={form.username} onChangeText={set('username')} autoCapitalize="none" />
      <PasswordField placeholder="Password" value={form.password} onChangeText={set('password')} />
      <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: -4, marginBottom: 12 }}>At least 6 characters</Text>
      <Text style={[styles.label, { color: t.text }]}>UMN Student Email</Text>
      <TextField
        placeholder={`yourname${EMAIL_DOMAIN}`}
        value={form.email}
        onChangeText={set('email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: -4, marginBottom: 12 }}>
        {namePreview
          ? `Your full name will be "${namePreview}". It is set from your email and can't be changed later.`
          : "Your full name is set from your email and can't be changed later."}
      </Text>
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
