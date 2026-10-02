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
      'Germany enters the top 5 in the 2026 3rd provisional ranking, while the top 3 remain unchanged: ' +
      'USA 1st, Spain 2nd, and France 3rd. 3 months to go before the final ranking. ' +
      'Stay tuned for more!',
    href: '/rankings/elite-sport',
  },
]
