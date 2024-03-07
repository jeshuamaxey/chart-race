import ChartConfigurator from "@/components/ChartConfigurator";

export default function Home() {
  return (
    <main className="max-w-screen-2xl m-auto">
      <h1 className="text-4xl font-semibold text-center p-2">Chart Race</h1>
      <p className="text-center p-2">Create animated market capitalisation charts for popular companies.</p>
      <ChartConfigurator />
    </main>
  );
}
