"use client";

type TabValue = "calculator" | "learn";

interface TabStripProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

export function TabStrip({ activeTab, onTabChange }: TabStripProps) {
  return (
    <div className="w-full border-b border-[#e5e7eb] bg-white">
      <div className="flex">
        <button
          type="button"
          onClick={() => onTabChange("calculator")}
          className={`px-6 py-4 text-sm transition-colors ${
            activeTab === "calculator"
              ? "border-b-2 border-[#2563eb] font-semibold text-[#111827]"
              : "font-normal text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          Calculator
        </button>
        <button
          type="button"
          onClick={() => onTabChange("learn")}
          className={`px-6 py-4 text-sm transition-colors ${
            activeTab === "learn"
              ? "border-b-2 border-[#2563eb] font-semibold text-[#111827]"
              : "font-normal text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          Learn
        </button>
      </div>
    </div>
  );
}
