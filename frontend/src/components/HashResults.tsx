import { WorkflowResult } from '../App';

interface HashResultsProps {
  results: WorkflowResult;
  onReset: () => void;
}

function HashResults({ results, onReset }: HashResultsProps) {
  const duration = results.startedAt && results.completedAt 
    ? ((new Date(results.completedAt).getTime() - new Date(results.startedAt).getTime()) / 1000).toFixed(2)
    : '0';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="results-section">
      <div className="results-card">
        <div className="results-header">
          <h2>✅ Hash Results</h2>
        </div>
        <div className="results-actions">
          <button onClick={onReset} className="btn btn-secondary btn-small">
            Upload Another
          </button>
        </div>

        <div className="file-metadata">
          <div className="metadata-item">
            <span className="label">File:</span>
            <span className="value">{results.fileName}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Size:</span>
            <span className="value">{results.fileSize ? (results.fileSize / 1024).toFixed(2) : '0.00'} KB</span>
          </div>
          <div className="metadata-item">
            <span className="label">Computed in:</span>
            <span className="value">{duration}s</span>
          </div>
        </div>

        <div className="hash-list">
          {results.hashes.map((hash) => (
            <div key={hash.algorithm} className="hash-item">
              <div className="hash-header">
                <span className="hash-algorithm">{hash.algorithm.toUpperCase()}</span>
                <button
                  onClick={() => copyToClipboard(hash.digest)}
                  className="copy-btn"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="hash-digest">{hash.digest}</div>
            </div>
          ))}
        </div>

        <div className="workflow-info">
          <p className="info-text">
            ✨ All hashes were computed in parallel using Durabull's durable workflow engine
          </p>
        </div>
      </div>
    </div>
  );
}

export default HashResults;
