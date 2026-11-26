import { UserProfile } from '../types';
import { isCompatible } from './preferences';

export type LikeMode = 'friend' | 'dating';

/**
 * The mode a like was made in. It is the mode stored when the like was made (swipes/{liker}.likeModes[me]), so it stays
 * the same even if the liker switches mode later. Likes made before modes were stored have no entry: for those the
 * liker's current mode decides (same mode as mine = my mode, otherwise the other one).
 */
export function modeOfLike(me: UserProfile, liker: UserProfile, stored?: LikeMode): LikeMode {
  if (stored === 'friend' || stored === 'dating') return stored;
  const mine: LikeMode = me.friendFirst ? 'friend' : 'dating';
  const other: LikeMode = me.friendFirst ? 'dating' : 'friend';
  return isCompatible(me, liker) ? mine : other;
}

/**
 * Splits the people who liked me by the mode of their like. `here` are the likes made in the mode I am in now (they
 * are listed). `waiting` are the likes made in the other mode that I have not liked back (they only get a notice).
 */
export function splitLikers(
  me: UserProfile,
  likers: { user: UserProfile; stored?: LikeMode }[],
  iLike: ReadonlySet<string>,
): { here: UserProfile[]; waiting: UserProfile[] } {
  const mine: LikeMode = me.friendFirst ? 'friend' : 'dating';
  const here: UserProfile[] = [];
  const waiting: UserProfile[] = [];
  for (const { user, stored } of likers) {
    if (modeOfLike(me, user, stored) === mine) here.push(user);
    else if (!iLike.has(user.uid)) waiting.push(user);
  }
  return { here, waiting };
}
