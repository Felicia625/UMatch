import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadMatchMeta, MatchMeta, partnerOf, subscribeToMatches } from '../services/matches';
import { getUsersByIds } from '../services/users';
import { Match, UserProfile } from '../types';

export type MatchStatus = 'active' | 'inactive' | 'blocked';

export interface MatchRow {
  match: Match;
  partner: UserProfile;
  status: MatchStatus;
  favorite: boolean;
  blockedByPartner: boolean;
}

/**
 * Live match list. The match documents come from a real-time listener; partner profiles are fetched once and cached;
 * the swipe / block / favourite lookups (`meta`) are refreshed on demand (screen focus, pull to refresh, after actions).
 */
export function useMatches(myId: string | undefined) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [meta, setMeta] = useState<MatchMeta | null>(null);
  const [partners, setPartners] = useState<Record<string, UserProfile>>({});
  const [error, setError] = useState(false);
  const partnersRef = useRef(partners);
  partnersRef.current = partners;

  const refreshMeta = useCallback(async () => {
    if (!myId) return;
    try {
      setMeta(await loadMatchMeta(myId));
      setError(false);
    } catch (e) {
      console.warn('Failed to load match meta', e);
      setError(true);
    }
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    return subscribeToMatches(myId, setMatches, (e) => {
      console.warn('Match listener failed', e);
      setError(true);
    });
  }, [myId]);

  useEffect(() => {
    if (!myId || !matches) return;
    const missing = matches
      .map((m) => partnerOf(m, myId))
      .filter((id): id is string => !!id && !partnersRef.current[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    getUsersByIds(missing)
      .then((users) => {
        if (cancelled) return;
        setPartners((p) => ({ ...p, ...Object.fromEntries(users.map((u) => [u.uid, u])) }));
      })
      .catch((e) => console.warn('Failed to load partners', e));
    return () => {
      cancelled = true;
    };
  }, [matches, myId]);

  const rows = useMemo<MatchRow[] | null>(() => {
    if (!myId || !matches || !meta) return null;
    return matches
      .flatMap((match) => {
        const pid = partnerOf(match, myId);
        const partner = pid ? partners[pid] : undefined;
        if (!pid || !partner) return [];
        const blockedByPartner = meta.blockedMe.has(pid);
        const mutual = meta.iLiked.has(pid) && meta.likedMe.has(pid);
        // If the partner blocked me the match shows as inactive, so the block isn't advertised in the "Active" tab.
        const status: MatchStatus = meta.iBlocked.has(pid) ? 'blocked' : mutual && !blockedByPartner ? 'active' : 'inactive';
        return [{ match, partner, status, favorite: meta.favorites.has(pid), blockedByPartner }];
      })
      .sort((a, b) => (b.match.timestamp?.getTime() ?? 0) - (a.match.timestamp?.getTime() ?? 0));
  }, [matches, meta, partners, myId]);

  return { rows, error, refreshMeta };
}
