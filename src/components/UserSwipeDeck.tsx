import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FILL } from '../constants/layout';
import { SwipeDirection } from '../services/swipes';
import { UserProfile } from '../types';
import { LikeIcon } from './LikeIcon';
import { UserCard } from './UserCard';

// The card is at most ~460 wide, so on a desktop window the drag threshold and rotation follow the card, not the window.
const WINDOW_W = Dimensions.get('window').width;
const SCREEN_W = Math.min(WINDOW_W, 480);
const FLY = WINDOW_W * 1.5; // distance a card flies off before it is replaced
const THRESHOLD = SCREEN_W * 0.3;
const FLING_VELOCITY = 800;

export interface SwipeDeckHandle {
  swipe: (direction: SwipeDirection) => void;
  current: () => UserProfile | undefined;
}

interface Props {
  users: UserProfile[];
  onSwipe: (user: UserProfile, direction: SwipeDirection) => void;
  empty: React.ReactNode;
  /** Mode of the person swiping: decides the icon of the like cue (heart or handshake). */
  friendMode?: boolean;
}

/** Replaces the CardStackView library: drag a card, or call ref.swipe('left' | 'right') from buttons. */
export const UserSwipeDeck = forwardRef<SwipeDeckHandle, Props>(function UserSwipeDeck({ users, onSwipe, empty, friendMode = false }, ref) {
  const [index, setIndex] = useState(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const locked = useSharedValue(false);

  const usersRef = useRef(users);
  const indexRef = useRef(index);
  const onSwipeRef = useRef(onSwipe);
  usersRef.current = users;
  indexRef.current = index;
  onSwipeRef.current = onSwipe;

  const complete = useCallback((direction: SwipeDirection) => {
    const item = usersRef.current[indexRef.current];
    if (item) onSwipeRef.current(item, direction);
    setIndex((i) => i + 1);
  }, []);

  // Put the (new) top card back in the centre before the next paint.
  useLayoutEffect(() => {
    x.value = 0;
    y.value = 0;
    locked.value = false;
  }, [index, x, y, locked]);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => {
        if (locked.value || indexRef.current >= usersRef.current.length) return;
        locked.value = true;
        x.value = withTiming((direction === 'right' ? 1 : -1) * FLY, { duration: 250 }, (finished) => {
          if (finished) runOnJS(complete)(direction);
        });
      },
      current: () => usersRef.current[indexRef.current],
    }),
    [complete, locked, x],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (locked.value) return;
      x.value = e.translationX;
      y.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (locked.value) return;
      const far = Math.abs(e.translationX) > THRESHOLD;
      const fast = Math.abs(e.velocityX) > FLING_VELOCITY;
      if (far || fast) {
        const goingRight = (far ? e.translationX : e.velocityX) > 0;
        locked.value = true;
        x.value = withTiming((goingRight ? 1 : -1) * FLY, { duration: 200 }, (finished) => {
          if (finished) runOnJS(complete)(goingRight ? 'right' : 'left');
        });
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-SCREEN_W, 0, SCREEN_W], [-15, 0, 15], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(Math.abs(x.value), [0, THRESHOLD], [0.95, 1], Extrapolation.CLAMP) }],
  }));
  // A quiet cue while dragging: the card edge picks up a soft colour and a small round icon fades in. No text stamp.
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));
  const likeScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.value, [0, THRESHOLD], [0.7, 1], Extrapolation.CLAMP) }],
  }));
  const nopeScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.value, [-THRESHOLD, 0], [1, 0.7], Extrapolation.CLAMP) }],
  }));

  const top = users[index];
  const next = users[index + 1];
  if (!top) return <>{empty}</>;

  return (
    <View style={styles.container}>
      {next && (
        <Animated.View key={`next-${next.uid}`} style={[styles.card, nextStyle]} pointerEvents="none">
          <UserCard user={next} />
        </Animated.View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View key={`top-${top.uid}`} style={[styles.card, topStyle]}>
          <UserCard user={top} />
          <Animated.View style={[styles.wash, { backgroundColor: 'rgba(46,125,50,0.22)' }, likeStyle]} pointerEvents="none" />
          <Animated.View style={[styles.wash, { backgroundColor: 'rgba(211,47,47,0.22)' }, nopeStyle]} pointerEvents="none" />
          <Animated.View style={[styles.cue, { left: 20 }, likeStyle, likeScale]} pointerEvents="none">
            <LikeIcon friend={friendMode} size={26} color="#2E7D32" />
          </Animated.View>
          <Animated.View style={[styles.cue, { right: 20 }, nopeStyle, nopeScale]} pointerEvents="none">
            <Ionicons name="close" size={30} color="#D32F2F" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { ...FILL },
  wash: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  cue: {
    position: 'absolute',
    top: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
