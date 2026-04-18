type HapticStyle = 'light' | 'medium' | 'heavy'

const patterns: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
}

export function triggerHaptic(style: HapticStyle = 'light') {
  if ('vibrate' in navigator) {
    navigator.vibrate(patterns[style])
  }
}
