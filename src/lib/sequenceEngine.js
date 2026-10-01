// Imperative image-sequence engine. All hot-path work (pointer, scroll, drawing)
// lives here, outside React, so nothing re-renders while the user interacts.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const SETTINGS = {
  // Fraction of the pinned scroll distance at which the last frame is reached.
  // The remainder is a short "hold" on the final frame before the hero releases.
  holdAt: 0.9,
  // In the final part of the scroll the frame is pulled up towards the last
  // frame, so the hero can never release before the final frame is showing.
  floorFrom: 0.7,
  // Horizontal focal point of the subject inside the source frame (0–1).
  focalX: 0.53,
  // Share of the stage width the cursor / finger must travel to sweep all frames.
  mouseSpan: 0.8,
  touchSpan: 0.9,
  // Higher = snappier. ~16 settles in a little over a tenth of a second.
  smoothing: 16,
  // Ignore pointer jumps larger than this (px) so a re-entering cursor can't leap.
  maxStep: 120,
};

export function createSequence({ canvas, stage, container, store, reducedMotion, onFrame }) {
  const cfg = SETTINGS;
  const count = store.count;
  const lastIndex = count - 1;
  const ctx = canvas.getContext('2d', { alpha: false });
  const view = { w: 0, h: 0, dpr: 1 };

  let target = 0; // where the frame wants to be (float, 0…lastIndex)
  let current = 0; // smoothed value that is actually shown
  let shown = -1; // integer frame currently painted
  let scrollFrame = 0;
  let floorFrame = 0;
  let raf = 0;
  let lastTime = 0;
  let mouseX = null;
  let touch = null;

  // ---- drawing -----------------------------------------------------------
  function measure() {
    const rect = canvas.getBoundingClientRect();
    view.w = rect.width;
    view.h = rect.height;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.max(1, Math.round(view.w * view.dpr));
    const ph = Math.max(1, Math.round(view.h * view.dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    shown = -1;
    request();
  }

  function draw(index) {
    const img = store.nearest(index);
    if (!img || !view.w || !view.h) return false;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    // "Cover" fit: fills the box without stretching. Anchored to the top so the
    // head is never cut; the subject stays centred horizontally when cropping.
    const s = Math.max(view.w / iw, view.h / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = clamp(view.w / 2 - cfg.focalX * dw, view.w - dw, 0);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, 0, dw, dh);
    return true;
  }

  // ---- scroll ------------------------------------------------------------
  function readScroll(initial) {
    const rect = container.getBoundingClientRect();
    const run = Math.max(1, container.offsetHeight - stage.offsetHeight);
    const progress = clamp(-rect.top / run, 0, 1);
    const p = clamp(progress / cfg.holdAt, 0, 1);
    const sf = p * lastIndex;
    if (initial) {
      target = current = sf;
    } else {
      target += sf - scrollFrame; // scrolling moves the frame by the same amount
    }
    scrollFrame = sf;
    floorFrame = lastIndex * clamp((p - cfg.floorFrom) / (1 - cfg.floorFrom), 0, 1);
    target = clamp(target, floorFrame, lastIndex);
  }

  // ---- animation loop (runs only while something is moving) --------------
  function request() {
    if (!raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    raf = 0;
    if (!reducedMotion) readScroll(false);
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;

    if (reducedMotion) {
      current = target;
    } else {
      current += (target - current) * (1 - Math.exp(-dt * cfg.smoothing));
      if (Math.abs(target - current) < 0.02) current = target;
    }

    const index = Math.round(clamp(current, 0, lastIndex));
    if (index !== shown && draw(index)) {
      shown = index;
      if (onFrame) onFrame(index);
    }
    if (current !== target) request();
  }

  function move(delta) {
    target = clamp(target + delta, floorFrame, lastIndex);
    request();
  }

  // ---- pointer input -----------------------------------------------------
  function onPointerMove(e) {
    if (e.pointerType === 'touch') return onTouchMove(e);
    if (mouseX !== null) {
      const dx = clamp(e.clientX - mouseX, -cfg.maxStep, cfg.maxStep);
      move((dx * lastIndex) / (view.w * cfg.mouseSpan));
    }
    mouseX = e.clientX;
  }

  function onPointerLeave() {
    mouseX = null;
  }

  function onPointerDown(e) {
    if (e.pointerType !== 'touch') return;
    touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, mode: null };
  }

  function onTouchMove(e) {
    if (!touch || e.pointerId !== touch.id) return;
    if (!touch.mode) {
      const ax = Math.abs(e.clientX - touch.x0);
      const ay = Math.abs(e.clientY - touch.y0);
      if (ax < 6 && ay < 6) return;
      // Clearly horizontal → we rotate. Otherwise the browser scrolls the page.
      touch.mode = ax > ay ? 'h' : 'v';
      touch.lastX = e.clientX;
      return;
    }
    if (touch.mode !== 'h') return;
    const dx = e.clientX - touch.lastX;
    touch.lastX = e.clientX;
    move((dx * lastIndex) / (view.w * cfg.touchSpan));
  }

  function onPointerEnd(e) {
    if (touch && e.pointerId === touch.id) touch = null;
  }

  // ---- setup -------------------------------------------------------------
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(canvas);

  if (reducedMotion) {
    // A stable representative frame; only the keyboard slider can change it.
    target = current = 0;
    floorFrame = 0;
  } else {
    readScroll(true);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerleave', onPointerLeave);
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointerup', onPointerEnd);
    stage.addEventListener('pointercancel', onPointerEnd);
  }
  measure();

  return {
    // Called when another frame finishes loading.
    refresh(loadedIndex) {
      if (shown === -1 || loadedIndex === shown || loadedIndex === Math.round(current)) {
        shown = -1;
        request();
      }
    },
    nudge(delta) {
      move(delta);
    },
    seek(fraction) {
      target = clamp(fraction * lastIndex, floorFrame, lastIndex);
      request();
    },
    destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onPointerEnd);
      stage.removeEventListener('pointercancel', onPointerEnd);
    },
  };
}
