import { Text } from 'react-native';
import { HEADER_EDGES, Screen } from '../src/components/ui';
import { MIN_AGE } from '../src/constants/options';
import { useTheme } from '../src/constants/theme';

// Text from res/layout/fragment_terms_conditions.xml. The age requirement now follows MIN_AGE (17) so the Terms and
// the registration check can't disagree again. This screen sits outside the (auth) group because it is opened from
// both Register (signed out) and Settings (signed in).
const SECTIONS = [
  ['1. Acceptance of Terms', 'By using UMNDatingApp, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.'],
  ['2. Eligibility', `You must be a current student of Universitas Multimedia Nusantara (UMN) and at least ${MIN_AGE} years old to use this service.`],
  ['3. User Conduct', 'Users must maintain respectful behavior, provide accurate information, and not engage in harassment, spam, or inappropriate content sharing.'],
  ['4. Privacy and Data', 'We collect and process your data in accordance with our Privacy Policy. Your profile information is visible to other UMN students using the app.'],
  ['5. Account Termination', 'We reserve the right to suspend or terminate accounts that violate these terms or engage in inappropriate behavior.'],
  ['6. Contact Us', "For questions about these Terms and Conditions, please contact us through the app's support feature."],
];

export default function Terms() {
  const t = useTheme();
  return (
    <Screen edges={HEADER_EDGES}>
      <Text style={{ color: t.textSecondary, marginBottom: 16 }}>Last updated: October 2026</Text>
      {SECTIONS.map(([heading, body]) => (
        <Text key={heading} style={{ color: t.text, marginBottom: 16, lineHeight: 22 }}>
          <Text style={{ fontWeight: '700' }}>{heading + '\n'}</Text>
          {body}
        </Text>
      ))}
    </Screen>
  );
}
