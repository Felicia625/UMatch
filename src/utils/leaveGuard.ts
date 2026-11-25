/**
 * A screen with unsaved work (Edit Profile) registers a guard; the app's own navigation controls (the title bar's back
 * button, the desktop navigation rail) run their action through `withLeaveGuard`, so the screen can ask first.
 * This does not depend on the navigator's `beforeRemove` event, which is not raised for every kind of navigation on
 * every platform.
 */
type Guard = (proceed: () => void) => void;

let guard: Guard | null = null;

export function setLeaveGuard(g: Guard | null) {
  guard = g;
}

export function withLeaveGuard(go: () => void) {
  if (guard) guard(go);
  else go();
}
