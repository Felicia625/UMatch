import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Screen } from '../../src/components/ui';
import { useTheme } from '../../src/constants/theme';

// Text copied from res/layout/fragment_terms_conditions.xml
const SECTIONS = [
  ['1. Acceptance of Terms', 'By using UMNDatingApp, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.'],
  ['2. Eligibility', 'You must be a current student of Universitas Multimedia Nusantara (UMN) and at least 18 years old to use this service.'],
  ['3. User Conduct', 'Users must maintain respectful behavior, provide accurate information, and not engage in harassment, spam, or inappropriate content sharing.'],
  ['4. Privacy and Data', 'We collect and process your data in accordance with our Privacy Policy. Your profile information is visible to other UMN students using the app.'],
  ['5. Account Termination', 'We reserve the right to suspend or terminate accounts that violate these terms or engage in inappropriate behavior.'],
  ['6. Contact Us', "For questions about these Terms and Conditions, please contact us through the app's support feature."],
];

export default function Terms() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
        <Text style={{ color: t.text, fontSize: 24 }}>←</Text>
      </Pressable>
      <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', marginTop: 12 }}>Terms and Conditions</Text>
      <Text style={{ color: t.textSecondary, marginBottom: 16 }}>Last updated: January 2025</Text>
      {SECTIONS.map(([heading, body]) => (
        <Text key={heading} style={{ color: t.text, marginBottom: 16, lineHeight: 22 }}>
          <Text style={{ fontWeight: '700' }}>{heading + '\n'}</Text>
          {body}
        </Text>
      ))}
    </Screen>
  );
}
