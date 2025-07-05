import { ErrorBoundary, Grid } from "@/components";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Interactive Grid</h1>
        <div className="border rounded-lg p-4 bg-card">
          <ErrorBoundary>
            <Grid />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;
