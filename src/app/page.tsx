"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { TabStrip } from "@/components/layout/TabStrip";
import { LearnTab } from "@/components/learn/LearnTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"calculator" | "learn">(
    "calculator"
  );

  return (
    <div className="flex flex-col min-h-screen lg:h-screen">
      <Header />
      <TabStrip activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "calculator" ? (
        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
          <InputPanel />
          <main className="flex-1 lg:overflow-y-auto bg-background p-6">
            <ResultsPanel />
          </main>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-background">
          <LearnTab />
        </div>
      )}
    </div>
  );
}
