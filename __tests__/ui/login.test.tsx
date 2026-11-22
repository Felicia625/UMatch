import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Login from '../../app/(auth)/login';
import { login } from '../../src/services/auth';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// The real auth service talks to Firebase, so it is replaced by fakes.
jest.mock('../../src/services/auth', () => ({
  login: jest.fn(),
  requestPasswordReset: jest.fn(),
  resendVerificationEmail: jest.fn(),
  friendlyAuthError: (e: { message?: string }) => e?.message ?? 'error',
  isAppError: (e: { code?: string }) => !!e && e.code !== undefined,
}));

const mockLogin = login as jest.Mock;

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByPlaceholderText('yourname@student.umn.ac.id'), email);
  await fireEvent.changeText(screen.getByPlaceholderText('Password'), password);
}

describe('Login screen', () => {
  let alertSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('shows a message and does not call login when fields are empty', async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByText('Log In'));
    expect(alertSpy).toHaveBeenCalledWith('Please fill all fields');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('logs in with a trimmed, lower-case email', async () => {
    mockLogin.mockResolvedValue(undefined);
    await render(<Login />);
    await fill('  Felicia@Student.UMN.ac.id ', 'secret123');
    await fireEvent.press(screen.getByText('Log In'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('felicia@student.umn.ac.id', 'secret123'));
  });

  test('shows "Login failed" when the credentials are wrong', async () => {
    mockLogin.mockRejectedValue(new Error('Wrong email or password'));
    await render(<Login />);
    await fill('a@student.umn.ac.id', 'bad');
    await fireEvent.press(screen.getByText('Log In'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Login failed', 'Wrong email or password'));
    expect(screen.queryByText('Resend verification email')).toBeNull();
  });

  test('offers to resend the verification email when the email is not verified', async () => {
    mockLogin.mockRejectedValue(Object.assign(new Error('Please verify your email'), { code: 'email-not-verified' }));
    await render(<Login />);
    await fill('a@student.umn.ac.id', 'secret123');
    await fireEvent.press(screen.getByText('Log In'));
    expect(await screen.findByText('Resend verification email')).toBeTruthy();
  });

  test('password can be shown and hidden with the eye button', async () => {
    await render(<Login />);
    const field = screen.getByPlaceholderText('Password');
    expect(field.props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByLabelText('Show password'));
    expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Hide password')).toBeTruthy();
  });

  test('Sign Up opens the register screen', async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByText('Sign Up'));
    expect(mockPush).toHaveBeenCalledWith('/register');
  });
});
