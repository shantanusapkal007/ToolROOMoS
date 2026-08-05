"use client";

import React, { useRef, useEffect } from 'react';

export function SpotlightWrapper({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameId !== null) return;

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          wrapperRef.current.style.setProperty('--mouse-x', `${x}px`);
          wrapperRef.current.style.setProperty('--mouse-y', `${y}px`);
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div 
      ref={wrapperRef}
      className="relative min-h-screen w-full flex flex-col"
    >
      {children}
    </div>
  );
}

