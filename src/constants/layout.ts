// Stretches a view over its parent. Written out by hand because newer React Native versions deprecate / remove
// StyleSheet.absoluteFillObject, and a card that silently loses this style collapses to zero height.
export const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

// Width (dp) from which the app switches to its desktop layout (Matches list + chat side by side, centred content,
// side navigation). Phones and narrow browser windows keep the phone layout.
export const WIDE_SCREEN = 900;
// Widest a normal page (forms, profile, lists, guide, ...) gets on a wide screen; the rest stays empty on both sides.
export const CONTENT_MAX_WIDTH = 680;
