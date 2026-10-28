// Stretches a view over its parent. Written out by hand because newer React Native versions deprecate / remove
// StyleSheet.absoluteFillObject, and a card that silently loses this style collapses to zero height.
export const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
