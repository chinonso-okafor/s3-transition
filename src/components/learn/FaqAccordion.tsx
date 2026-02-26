"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

function FaqRow({
  item,
  isOpen,
  onToggle,
  isFirst,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  isFirst: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div className={`border-b border-[#e5e7eb] ${isFirst ? "border-t" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-semibold text-[#111827] pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6b7280] transition-transform duration-150 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        style={{
          height: isOpen ? height : 0,
          overflow: "hidden",
          transition: "height 150ms ease-out",
        }}
      >
        <div ref={contentRef} className="pt-4 pb-5">
          <p className="text-[15px] leading-[1.7] text-[#6b7280]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, index) => (
        <FaqRow
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() =>
            setOpenIndex(openIndex === index ? null : index)
          }
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}
