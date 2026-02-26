"use client";

import { useState, useRef, useCallback } from "react";
import { Info } from "lucide-react";

interface InfoPopoverProps {
  text: string;
}

export function InfoPopover({ text }: InfoPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  return (
    <span
      ref={iconRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Info
        className={`h-3.5 w-3.5 transition-colors duration-100 cursor-help ${
          isVisible ? "text-[#2563eb]" : "text-[#9ca3af]"
        }`}
        aria-hidden="true"
      />
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-[280px] rounded-lg border border-[#e5e7eb] bg-white p-3 text-[13px] font-normal leading-relaxed text-[#374151] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          role="tooltip"
        >
          {text}
        </div>
      )}
    </span>
  );
}
