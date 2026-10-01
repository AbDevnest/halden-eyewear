# Halden Eyewear — first page

Premium eyewear landing hero built around an interactive image sequence
(`public/frames/ezgif-frame-005.jpg` … `088.jpg`, 84 frames, used in exact order).

React + JSX + JavaScript + CSS + Vite. No TypeScript.

```bash
npm install
npm run dev
```

Requires Node 20.19 or newer (Vite 7). `npm run build` creates a production build in `dist/`.

## How the hero behaves

- **Scroll** pins the hero and plays frame 005 → 088. Frame 088 is reached at 90% of the
  pinned distance and held for the rest, then the hero releases into the next section.
  Scrolling up reverses it back to 005. It never loops or jumps.
- **Mouse (desktop)**: horizontal movement turns her. Right = forward, left = backward.
  Movement is relative, smoothed, and stops the instant the cursor stops. Sweeping about 80%
  of the hero width covers the whole sequence.
- **Touch (mobile)**: a horizontal drag turns her; a vertical drag scrolls the page normally
  (`touch-action: pan-y` plus axis detection).
- **Keyboard**: the thin line at the bottom right is a slider (arrow keys, Page Up/Down, Home/End).
- **Reduced motion**: a static representative frame, no pinning; only the keyboard slider changes it.

Mouse, touch and scroll all feed a single target frame that is eased towards each animation
frame, so combining them stays consistent. In the last 30% of the pinned scroll the frame can no
longer sit far behind the scroll position, which guarantees frame 088 is showing before release.

## Where things are

| File | Purpose |
| --- | --- |
| `src/lib/sequenceEngine.js` | Canvas renderer, scroll / mouse / touch input, smoothing. Tuning constants are at the top (`SETTINGS`). |
| `src/lib/frames.js` | Frame URLs (005–088) and prioritised preloading (first frame, keyframes, the rest). |
| `src/components/Hero.jsx` | Sticky hero structure, copy, rotation slider, loader. |
| `src/components/CursorHint.jsx` | Small "Move" label that follows the mouse. |
| `src/config.js` | Placeholder brand name and nav links. Replace with the real brand. |
| `src/styles.css` | All styling and breakpoints. |

The pinned scroll distance is `--scroll-run` (in `svh`) at the top of `styles.css`.

## Notes

- "Halden" is a placeholder brand name. No logo or brand name was supplied.
- Typeface is Jost, loaded from Google Fonts in `index.html`. It falls back to system sans-serif offline.
- Nav links, search, account and cart are placeholders (`#` anchors); no other pages are included.
# halden-eyewear
