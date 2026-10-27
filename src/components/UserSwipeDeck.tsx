import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
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
import { SwipeDirection } from '../services/swipes';
import { UserProfile } from '../types';
import { UserCard } from './UserCard';

const SCREEN_W = Dimensions.get('window').width;
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
}

/** Replaces the CardStackView library: drag a card, or call ref.swipe('left' | 'right') from buttons. */
export const UserSwipeDeck = forwardRef<SwipeDeckHandle, Props>(function UserSwipeDeck({ users, onSwipe, empty }, ref) {
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
        x.value = withTiming((direction === 'right' ? 1 : -1) * SCREEN_W * 1.5, { duration: 250 }, (finished) => {
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
        x.value = withTiming((goingRight ? 1 : -1) * SCREEN_W * 1.5, { duration: 200 }, (finished) => {
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
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
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
          <Animated.View style={[styles.badge, styles.likeBadge, likeStyle]} pointerEvents="none">
            <Text style={[styles.badgeText, { color: '#2E7D32' }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.badge, styles.nopeBadge, nopeStyle]} pointerEvents="none">
            <Text style={[styles.badgeText, { color: '#D32F2F' }]}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { ...StyleSheet.absoluteFillObject },
  badge: { position: 'absolute', top: 32, borderWidth: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  likeBadge: { left: 24, borderColor: '#2E7D32', transform: [{ rotate: '-15deg' }] },
  nopeBadge: { right: 24, borderColor: '#D32F2F', transform: [{ rotate: '15deg' }] },
  badgeText: { fontSize: 32, fontWeight: '900' },
});
