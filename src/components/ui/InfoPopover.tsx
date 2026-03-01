"use client";

import { useState, useRef, useCallback } from "react";
import { Info } from "lucide-react";

interface InfoPopoverProps {
  text: string;
}

export function InfoPopover({ text }: InfoPopoverProps) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const iconRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (!iconRef.current) return;
      const rect = iconRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      const margin = 12;
      const viewportWidth = window.innerWidth;

      // Center on icon, then clamp within viewport
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      left = Math.max(margin, Math.min(left, viewportWidth - popoverWidth - margin));

      // Position above icon by default; flip below if near top
      const spaceAbove = rect.top;
      const popoverHeight = 120; // approximate

      const top = spaceAbove > popoverHeight + 8
        ? rect.top - popoverHeight - 8
        : rect.bottom + 8;

      setStyle({ position: "fixed", left, top, width: popoverWidth });
      setVisible(true);
    }, 200);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span
      ref={iconRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Info
        size={14}
        className="transition-colors duration-100"
        style={{ color: visible ? "#2563EB" : "#9CA3AF", cursor: "default" }}
      />
      {visible && (
        <div
          style={{
            ...style,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: 13,
            lineHeight: 1.5,
            color: "#374151",
            fontFamily: "Inter, sans-serif",
            pointerEvents: "none",
          }}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </span>
  );
}
