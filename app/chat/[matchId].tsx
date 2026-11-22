import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { ChatView } from '../../src/components/ChatView';
import { WIDE_SCREEN } from '../../src/constants/layout';

// Phones: the chat opens full screen. Wide screens show the chat inside the Matches tab, so a direct link or a
// notification tap goes there with this chat selected.
export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const wide = width >= WIDE_SCREEN;

  useEffect(() => {
    if (wide && matchId) router.replace({ pathname: '/matches', params: { open: matchId } });
  }, [wide, matchId, router]);

  if (wide || !matchId) return null;
  return <ChatView matchId={matchId} />;
}
