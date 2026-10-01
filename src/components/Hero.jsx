import { useEffect, useRef, useState } from 'react';
import { FRAME_COUNT, frameUrls, createFrameStore } from '../lib/frames.js';
import { createSequence } from '../lib/sequenceEngine.js';
import CursorHint from './CursorHint.jsx';

const ALT =
  'A woman with a sleek dark bob wearing blue-tinted glasses, a white t-shirt, denim overalls and a plaid overshirt, turning from a side view towards the camera.';

export default function Hero() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const dialRef = useRef(null);
  const fillRef = useRef(null);
  const loaderRef = useRef(null);
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const store = createFrameStore(frameUrls);

    const engine = createSequence({
      canvas: canvasRef.current,
      stage: stageRef.current,
      container: containerRef.current,
      store,
      reducedMotion: reduced,
      onFrame(index) {
        // Direct DOM writes: no React re-render while the sequence moves.
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${index / (FRAME_COUNT - 1)})`;
        const dial = dialRef.current;
        if (dial) {
          dial.setAttribute('aria-valuenow', String(index + 1));
          dial.setAttribute('aria-valuetext', `View ${index + 1} of ${FRAME_COUNT}`);
        }
      },
    });
    engineRef.current = engine;

    store.onLoad((index, loaded) => {
      if (loaderRef.current) loaderRef.current.style.transform = `scaleX(${loaded / FRAME_COUNT})`;
      engine.refresh(index);
    });

    const { first, all } = store.start();
    first.then(() => setReady(true));
    all.then(() => loaderRef.current?.classList.add('is-done'));

    return () => {
      store.cancel();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const onDialKey = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const moves = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (e.key in moves) {
      engine.nudge(moves[e.key]);
    } else if (e.key === 'Home') {
      engine.seek(0);
    } else if (e.key === 'End') {
      engine.seek(1);
    } else {
      return;
    }
    e.preventDefault();
  };

  const onDialPointerDown = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    engineRef.current?.seek((e.clientX - rect.left) / rect.width);
  };

  return (
    <section
      id="top"
      ref={containerRef}
      className={`hero${ready ? ' is-ready' : ''}`}
      aria-label="New collection"
    >
      <div ref={stageRef} className="hero__stage">
        <canvas ref={canvasRef} className="hero__canvas" role="img" aria-label={ALT} />
        <div className="hero__fade hero__fade--top" aria-hidden="true" />
        <div className="hero__fade" aria-hidden="true" />

        <div className="hero__copy">
          <p className="hero__eyebrow reveal" style={{ '--d': '0.1s' }}>
            The new collection
          </p>
          <h1 className="hero__title reveal" style={{ '--d': '0.2s' }}>
            See your style differently
          </h1>
          <p className="hero__lead reveal" style={{ '--d': '0.32s' }}>
            Contemporary eyewear designed around clarity, comfort and effortless style.
          </p>
          <a className="button reveal" style={{ '--d': '0.44s' }} href="#collection">
            Explore Collection
          </a>
        </div>

        <div className="dial reveal" style={{ '--d': '0.6s' }}>
          <p className="dial__hint">
            <span className="hint-fine">Move to turn. Scroll to continue.</span>
            <span className="hint-touch">Swipe to turn. Scroll to continue.</span>
          </p>
          <div
            ref={dialRef}
            className="dial__track"
            role="slider"
            tabIndex={0}
            aria-label="Rotate view"
            aria-valuemin={1}
            aria-valuemax={FRAME_COUNT}
            aria-valuenow={1}
            aria-valuetext={`View 1 of ${FRAME_COUNT}`}
            onKeyDown={onDialKey}
            onPointerDown={onDialPointerDown}
          >
            <span className="dial__line">
              <span ref={fillRef} className="dial__fill" />
            </span>
          </div>
        </div>

        <div ref={loaderRef} className="loader" aria-hidden="true" />
        <CursorHint stageRef={stageRef} />
      </div>
    </section>
  );
}
