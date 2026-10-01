// The supplied image sequence: ezgif-frame-005.jpg … ezgif-frame-088.jpg
// Index 0 is frame 005 (first), index 83 is frame 088 (last). Never reordered.
export const FIRST_FRAME = 5;
export const LAST_FRAME = 88;
export const FRAME_COUNT = LAST_FRAME - FIRST_FRAME + 1; // 84

const base = import.meta.env.BASE_URL;

export const frameUrls = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(FIRST_FRAME + i).padStart(3, '0');
  return `${base}frames/ezgif-frame-${n}.jpg`;
});

const KEYFRAME_STEP = 7;
const CONCURRENCY = 6;

/**
 * Loads and decodes frames in priority order:
 *   1. frame 0 (so the hero can appear immediately)
 *   2. every 7th frame (so scrubbing has coarse coverage early)
 *   3. everything else, in ascending order
 * Until a frame is ready, `nearest()` returns the closest one that is.
 */
export function createFrameStore(urls) {
  const count = urls.length;
  const images = new Array(count).fill(null);
  const listeners = new Set();
  let loaded = 0;
  let cancelled = false;

  function load(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const finish = (ok) => {
        if (ok && !cancelled) {
          images[i] = img;
          loaded += 1;
          listeners.forEach((fn) => fn(i, loaded));
        }
        resolve(ok);
      };
      img.onload = () => {
        const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        decoded.then(() => finish(true));
      };
      img.onerror = () => finish(false);
      img.src = urls[i];
    });
  }

  async function loadRest() {
    const order = [];
    for (let i = KEYFRAME_STEP; i < count; i += KEYFRAME_STEP) order.push(i);
    for (let i = 1; i < count; i += 1) if (i % KEYFRAME_STEP !== 0) order.push(i);
    let cursor = 0;
    const worker = async () => {
      while (!cancelled && cursor < order.length) {
        await load(order[cursor++]);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  return {
    count,
    start() {
      const first = load(0);
      const all = first.then(loadRest);
      return { first, all };
    },
    nearest(i) {
      for (let d = 0; d < count; d += 1) {
        const before = images[i - d];
        if (before) return before;
        const after = images[i + d];
        if (after) return after;
      }
      return null;
    },
    onLoad(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    cancel() {
      cancelled = true;
      listeners.clear();
    },
  };
}
