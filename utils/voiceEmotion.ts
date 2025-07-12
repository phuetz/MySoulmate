export type Emotion = 'positive' | 'neutral' | 'negative';

export function getEmotionFromMeterings(meterings: number[]): Emotion {
  if (!meterings || meterings.length === 0) return 'neutral';
  const avg = meterings.reduce((a, b) => a + b, 0) / meterings.length;
  if (avg > -40) return 'positive';
  if (avg < -60) return 'negative';
  return 'neutral';
}
