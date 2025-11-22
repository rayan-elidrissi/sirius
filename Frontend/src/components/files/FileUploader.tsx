import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface FileUploaderProps {
  projectId: string;
  onFilesUploaded?: () => void;
}

export default function FileUploader({ projectId, onFilesUploaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    toast.loading(`Uploading ${files.length} file(s) to Walrus...`);

    try {
      const manifestEntries = [];

      // Upload each file to Walrus
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        try {
          // Upload to Walrus
          const walrusResult = await api.uploadToWalrus(file);
          
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          // Add to manifest entries
          manifestEntries.push({
            blobId: walrusResult.blobId,
            path: file.name,
            metadata: {
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              uploadLogs: walrusResult.logs || [], // Store upload logs
            },
          });
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          const errorMessage = error.message || 'Unknown error';
          
          // Show more helpful error message
          if (errorMessage.includes('Walrus CLI not found') || errorMessage.includes('not available')) {
            toast.error(
              `Walrus CLI not installed. Please install Walrus CLI to upload files.`,
              { duration: 6000 }
            );
          } else {
            toast.error(`Failed to upload ${file.name}: ${errorMessage}`, { duration: 5000 });
          }
        }
      }

      if (manifestEntries.length === 0) {
        throw new Error('No files were successfully uploaded');
      }

      // Add manifest entries to dataset
      await api.addManifestEntries(projectId, manifestEntries);

      toast.dismiss();
      toast.success(`Successfully uploaded ${manifestEntries.length} file(s)!`);
      onFilesUploaded?.();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to upload files: ${error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${
            isDragging
              ? 'border-[#97F0E5] bg-[#97F0E5]/5'
              : 'border-[#334155] hover:border-[#97F0E5]/50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {uploading ? (
          <div>
            <div className="w-16 h-16 mx-auto mb-4">
              <svg
                className="animate-spin text-[#97F0E5]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Uploading to Walrus...</p>
            <p className="text-gray-400 text-sm">This may take a moment</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-[#97F0E5]/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#97F0E5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <h3 className="text-white font-bold text-lg mb-2">
              Drop files here or click to browse
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              All file types supported • Max 10 GB per file
            </p>

            <label className="inline-block">
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
              <span className="inline-block bg-[#97F0E5] text-[#161923] px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all cursor-pointer">
                Select Files
              </span>
            </label>

            <p className="text-gray-500 text-xs mt-4">
              Files are stored on Walrus (decentralized storage)
            </p>
          </>
        )}
      </div>
    </div>
  );
}

