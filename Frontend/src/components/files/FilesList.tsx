import { useState } from 'react';
import { ManifestEntry } from '../../types/project';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface FilesListProps {
  projectId: string;
  files: ManifestEntry[];
  onFileDeleted?: () => void;
}

export default function FilesList({ projectId, files, onFileDeleted }: FilesListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [blobInfo, setBlobInfo] = useState<{ [key: string]: any }>({});
  if (files.length === 0) {
    return (
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-12 text-center">
        <div className="text-gray-400 mb-4">No files yet</div>
        <p className="text-gray-500 text-sm">
          Upload your first files to begin
        </p>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('csv') || mimeType.includes('excel')) return '📊';
    return '📁';
  };

  const handleView = async (file: ManifestEntry) => {
    // Toggle expansion
    if (expandedFileId === file.id) {
      setExpandedFileId(null);
      return;
    }

    setViewingIds(prev => new Set(prev).add(file.id));
    setExpandedFileId(file.id);

    try {
      // Get blob status to check if it's available
      const statusResult = await api.getWalrusBlobStatus(file.blobId);
      
      // Store blob info for display
      setBlobInfo(prev => ({
        ...prev,
        [file.id]: {
          status: statusResult.status.status,
          certified: statusResult.status.certified,
          size: statusResult.status.size || file.size,
        },
      }));

      // Copy blob ID to clipboard
      await navigator.clipboard.writeText(file.blobId);
      toast.success('Blob ID copied to clipboard!');
    } catch (error: any) {
      toast.error(`Failed to load blob info: ${error.message}`);
      setExpandedFileId(null);
    } finally {
      setViewingIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  const handleDownload = async (file: ManifestEntry) => {
    setViewingIds(prev => new Set(prev).add(file.id));
    try {
      toast.loading('Downloading file...');
      
      const blob = await api.downloadBlob(file.blobId, file.filename || file.path || undefined);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename || file.path || `blob-${file.blobId.slice(0, 16)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('File downloaded successfully!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to download file: ${error.message}`);
    } finally {
      setViewingIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  const handleDelete = async (file: ManifestEntry) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.filename || file.path || 'this file'}"?\n\nThis will burn the blob on Walrus and cannot be undone.`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(file.id));
    try {
      toast.loading('Burning blob on Walrus...');
      
      // First, delete the manifest entry from the database
      // TODO: Add API endpoint to delete manifest entry
      // For now, we'll just burn the blob
      
      await api.burnBlob(file.blobId);
      
      toast.dismiss();
      toast.success('File deleted and blob burned successfully!');
      
      // Refresh the list
      onFileDeleted?.();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to delete file: ${error.message}`);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">
          Uncommitted Files ({files.length})
        </h2>
        {files.length > 0 && (
          <div className="text-gray-400 text-sm">
            Ready to create a version
          </div>
        )}
      </div>

      {files.map((file) => {
        const isExpanded = expandedFileId === file.id;
        const info = blobInfo[file.id];

        return (
          <div key={file.id}>
            <div
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 hover:border-[#97F0E5] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-3xl">{getFileIcon(file.mimeType)}</span>

                  <div className="flex-1">
                    <div className="text-white font-semibold mb-1">
                      {file.filename || file.path || 'Untitled'}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="font-mono text-xs">{file.blobId.slice(0, 20)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(file)}
                    disabled={viewingIds.has(file.id)}
                    className={`p-2 transition-colors disabled:opacity-50 ${
                      isExpanded 
                        ? 'text-[#97F0E5] hover:text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="View blob info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDownload(file)}
                    disabled={viewingIds.has(file.id)}
                    className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Download file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deletingIds.has(file.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Delete and burn blob"
                  >
                    {deletingIds.has(file.id) ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded info section */}
            {isExpanded && (
              <div className="bg-[#0a0f1a] border-x border-b border-[#334155] rounded-b-lg px-4 py-3 mt-[-1px]">
                {viewingIds.has(file.id) ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Loading blob info...</span>
                  </div>
                ) : info ? (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Blob ID:</span>
                        <div className="text-white font-mono text-xs mt-1 break-all">
                          {file.blobId}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <div className="text-white mt-1 capitalize">
                          {info.status}
                          {info.certified && (
                            <span className="ml-2 text-[#97F0E5] text-xs">✓ Certified</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#334155]">
                      <span className="text-gray-400">Access (TESTNET):</span>
                      <div className="text-gray-300 text-xs mt-1 space-y-1">
                        <div>• CLI: <code className="bg-[#161923] px-1 rounded">walrus read "{file.blobId}"</code></div>
                        <div>• Explorer: <a 
                          href={`https://walruscan.com/testnet/blob/${file.blobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#97F0E5] hover:underline font-mono"
                        >
                          walruscan.com/testnet/blob/{file.blobId.slice(0, 16)}...
                        </a></div>
                        <div>• Aggregator: <code className="bg-[#161923] px-1 rounded">http://127.0.0.1:31415/{file.blobId}</code></div>
                      </div>
                    </div>
                    {/* Upload Logs Section */}
                    {file.metadata?.uploadLogs && Array.isArray(file.metadata.uploadLogs) && file.metadata.uploadLogs.length > 0 && (
                      <div className="pt-2 border-t border-[#334155]">
                        <span className="text-gray-400">Upload Logs:</span>
                        <div className="bg-[#0a0f1a] border border-[#334155] rounded-lg p-3 mt-2 max-h-64 overflow-y-auto">
                          <div className="space-y-1 font-mono text-xs">
                            {file.metadata.uploadLogs.map((log: string, index: number) => (
                              <div 
                                key={index} 
                                className={`${
                                  log.includes('ERROR') || log.includes('❌') || log.includes('⚠️') 
                                    ? 'text-red-400' 
                                    : log.includes('SUCCESS') || log.includes('✅')
                                    ? 'text-green-400'
                                    : log.includes('🔵')
                                    ? 'text-blue-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No information available</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

