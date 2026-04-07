import { useCallback, useRef } from 'react';

const DEFAULT_MS = 520;
const MOVE_THRESHOLD_PX = 14;

/**
 * Fires `onLongPress` after the pointer is held ~520ms without moving much.
 * Pointer events cover touch on modern mobile browsers; avoids double timers.
 */
export function useLongPress(onLongPress: () => void, durationMs = DEFAULT_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const activePointerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activePointerRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      clearTimer();
      originRef.current = { x: e.clientX, y: e.clientY };
      activePointerRef.current = e.pointerId;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        activePointerRef.current = null;
        onLongPress();
      }, durationMs);
    },
    [clearTimer, durationMs, onLongPress],
  );

  const cancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (timerRef.current == null) return;
      if (e.pointerId !== activePointerRef.current) return;
      const dx = e.clientX - originRef.current.x;
      const dy = e.clientY - originRef.current.y;
      if (dx * dx + dy * dy > MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  return {
    onPointerDown,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onPointerMove,
  };
}
