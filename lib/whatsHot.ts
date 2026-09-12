// ─────────────────────────────────────────────────────────────────────────────
//  👇 THE "WHAT'S HOT" NEWS TICKER — EDIT THE HEADLINES HERE  👇
//
//  This is the scrolling bar under the navbar, like the news ticker along the
//  bottom of a TV channel. To post a new update, edit the text below.
//
//  • Add more than one item and they scroll past one after another.
//  • `href` is optional — if set, the headline becomes clickable.
//  • To hide the bar entirely, set WHATS_HOT_ENABLED to false.
// ─────────────────────────────────────────────────────────────────────────────

export const WHATS_HOT_ENABLED = true

export interface HotItem {
  /** The headline text that scrolls past. */
  text: string
  /** Optional link — makes the headline clickable. */
  href?: string
}

export const WHATS_HOT: HotItem[] = [
  {
    text:
      'The FIFA Men World Cup had a huge impact on the 2026 WRCES 2nd provisional ranking. ' +
      'USA still tops the ranking, but Spain is now ranked 2nd, France 3rd, and Argentina 4th ! ' +
      'Stay tuned for more!',
    href: '/rankings/elite-sport',
  },
]
