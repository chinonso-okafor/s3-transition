import { InputPanel } from "@/components/InputPanel";
import { ResultsPanel } from "@/components/ResultsPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 lg:p-8">
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col lg:flex-row gap-6">
          <InputPanel />
          <ResultsPanel />
        </div>
      </div>
    </main>
  );
}
