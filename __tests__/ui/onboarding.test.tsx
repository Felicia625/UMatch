import { fireEvent, render, screen } from '@testing-library/react-native';
import Onboarding from '../../app/(auth)/onboarding';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

describe('Onboarding screen', () => {
  test('shows the tagline and opens the login screen from Get Started', async () => {
    await render(<Onboarding />);
    expect(screen.getByText('Find your perfect match')).toBeTruthy();
    await fireEvent.press(screen.getByText('Get Started'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
