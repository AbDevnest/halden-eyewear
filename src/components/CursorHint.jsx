import { useEffect, useRef } from 'react';

// A small label that trails the mouse while it is over the hero.
// Fine-pointer devices only; the real cursor is never hidden or replaced.
export default function CursorHint({ stageRef }) {
  const ref = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const node = ref.current;
    if (!stage || !node) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let visible = false;

    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX + 20;
      ty = e.clientY + 20;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        node.classList.add('is-on');
      }
      node.classList.toggle('is-hidden', Boolean(e.target.closest('a, button, [role="slider"]')));
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      visible = false;
      node.classList.remove('is-on');
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [stageRef]);

  return (
    <div ref={ref} className="cursor-hint" aria-hidden="true">
      <span>&larr;</span>
      <span>Move</span>
      <span>&rarr;</span>
    </div>
  );
}
