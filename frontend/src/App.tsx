import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import HashResults from './components/HashResults';
import './styles/App.css';

export interface HashResult {
  algorithm: string;
  digest: string;
  computedAt: string;
}

export interface WorkflowResult {
  fileName: string;
  fileSize: number;
  hashes: HashResult[];
  startedAt: string;
  completedAt: string;
}

function App() {
  const [results, setResults] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (result: WorkflowResult) => {
    setResults(result);
    setLoading(false);
    setError(null);
  };

  const handleUploadStart = () => {
    setLoading(true);
    setResults(null);
    setError(null);
  };

  const handleUploadError = (message: string) => {
    setLoading(false);
    setError(message);
  };

  const handleReset = () => {
    setResults(null);
    setLoading(false);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐃 Durabull Image Hash Generator</h1>
        <p className="subtitle">
          Production-ready durable workflow demo with parallel hash computation
        </p>
      </header>

      <main className="app-main">
        <ImageUpload
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          loading={loading}
        />

        {error && <div className="error-banner">{error}</div>}

        {results && <HashResults results={results} onReset={handleReset} />}
      </main>

      <footer className="app-footer">
        <p>
          Powered by <strong>Durabull</strong> • Built with Fastify, React, and Redis
        </p>
      </footer>
    </div>
  );
}

export default App;
