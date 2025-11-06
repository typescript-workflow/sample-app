import { useState, useRef, ChangeEvent } from 'react';
import { WorkflowResult } from '../App';

interface ImageUploadProps {
  onUploadStart: () => void;
  onUploadComplete: (result: WorkflowResult) => void;
  onUploadError: (message: string) => void;
  loading: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

function ImageUpload({ onUploadStart, onUploadComplete, onUploadError, loading }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const pollWorkflowResult = async (workflowId: string): Promise<WorkflowResult> => {
    const maxAttempts = 30;
    const pollInterval = 1000; // 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${API_BASE}/api/result/${workflowId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow result');
      }

      const data = await response.json();

      if (data.status === 'completed') {
        return data.result;
      } else if (data.status === 'failed') {
        throw new Error('Workflow failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Workflow timed out');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onUploadStart();
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const result = await pollWorkflowResult(data.workflowId);
      onUploadComplete(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onUploadError(message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-card">
        <h2>Upload Image</h2>

        {!selectedFile && (
          <div className="file-input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              <span className="upload-icon">📁</span>
              <span>Choose an image to hash</span>
            </label>
          </div>
        )}

        {previewUrl && (
          <div className="preview-section">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <div className="file-info">
              <p>
                <strong>{selectedFile?.name}</strong>
              </p>
              <p className="file-size">
                {((selectedFile?.size || 0) / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {selectedFile && (
          <div className="button-group">
            <button onClick={handleUpload} disabled={loading} className="btn btn-primary">
              {loading ? '⏳ Computing Hashes...' : '🚀 Generate Hashes'}
            </button>
            <button onClick={handleReset} disabled={loading} className="btn btn-secondary">
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
