'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

type UseDragScrollOptions = {
  /** Multiplicateur de vitesse (1 = normal) */
  speed?: number;
  /** Décélération (plus petit = s'arrête plus vite). Ex: 0.92 */
  friction?: number;
};

/**
 * Permet de "grab & drag" horizontalement un conteneur scrollable.
 *
 * Usage:
 * const { ref, props, isDragging } = useDragScroll<HTMLDivElement>();
 * <div ref={ref} {...props} className={...} />
 */
export function useDragScroll<T extends HTMLElement>(options?: UseDragScrollOptions) {
  const speed = options?.speed ?? 1;
  const friction = options?.friction ?? 0.92;

  const ref = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  // Momentum
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0); // px/ms
  const rafRef = useRef<number | null>(null);

  const stopMomentum = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;

    // Seulement clic principal (évite clic droit)
    if (e.button !== 0) return;

    stopMomentum();

    pointerIdRef.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);

    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;

    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
  }, [stopMomentum]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      if (!isDragging) return;
      if (pointerIdRef.current !== e.pointerId) return;

      // Empêche la sélection de texte pendant le drag
      e.preventDefault();

      const dx = (e.clientX - startXRef.current) * speed;
      el.scrollLeft = startScrollLeftRef.current - dx;

      // Estimer la vitesse pour l'inertie
      const now = performance.now();
      const dt = now - lastTRef.current;
      if (dt > 0) {
        const vx = (e.clientX - lastXRef.current) / dt; // px/ms
        // Filtre léger pour éviter le jitter
        velocityRef.current = velocityRef.current * 0.7 + vx * 0.3;
        lastXRef.current = e.clientX;
        lastTRef.current = now;
      }
    },
    [isDragging, speed]
  );

  const startMomentum = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // v en px/ms -> convert en px/frame (~16ms)
    let v = velocityRef.current * speed;
    // Si mouvement trop faible, ne pas lancer
    if (Math.abs(v) < 0.02) return;

    const step = () => {
      const node = ref.current;
      if (!node) return;

      node.scrollLeft -= v * 16; // inverse: déplacer souris à droite => scrollLeft diminue
      v *= friction;

      if (Math.abs(v) < 0.02) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [friction, speed]);

  const endDrag = useCallback(
    (e?: React.PointerEvent<T>) => {
      const el = ref.current;
      if (el && e && pointerIdRef.current === e.pointerId) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      pointerIdRef.current = null;
      setIsDragging(false);
      startMomentum();
    },
    [startMomentum]
  );

  const props = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
    }),
    [onPointerDown, onPointerMove, endDrag]
  );

  return { ref, props, isDragging };
}


