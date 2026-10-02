// ─── Text helpers ─────────────────────────────────────────────────────────────

/** Splits text into words for word-by-word animation, keeping the last two
 *  words together (joined by a no-break space) so a wrapped line never ends
 *  on a single word — the pair moves down, or stays up, together. Texts of
 *  one or two words are left alone. */
export function words(text: string): string[] {
  const w = text.split(' ')
  if (w.length > 2) w.splice(-2, 2, `${w[w.length - 2]} ${w[w.length - 1]}`)
  return w
}
