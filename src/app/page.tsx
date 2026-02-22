import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { ResultsPanel } from "@/components/ResultsPanel";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen lg:h-screen">
      <Header />
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        <InputPanel />
        <main className="flex-1 lg:overflow-y-auto bg-background p-6">
          <ResultsPanel />
        </main>
      </div>
    </div>
  );
}
