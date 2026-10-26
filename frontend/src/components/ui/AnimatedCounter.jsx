import React, { useState, useEffect } from 'react';

export default function AnimatedCounter({
  value = 0,
  duration = 1000,
  formatter = (val) => Math.round(val).toLocaleString(),
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check if prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
}
