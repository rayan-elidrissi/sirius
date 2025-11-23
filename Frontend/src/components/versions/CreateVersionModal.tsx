import { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useWallet } from '../../hooks/useWallet';
import { useManifestEntries } from '../../hooks/useProjects';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateVersionModalProps {
  projectId: string;
  onVersionCreated?: () => void;
}

export default function CreateVersionModal({ projectId, onVersionCreated }: CreateVersionModalProps) {
  const { isCreateVersionModalOpen, closeCreateVersionModal } = useUIStore();
  const authStore = useAuthStore();
  const { signMessage, isSigning, address } = useWallet();
  const { entries: uncommittedFiles } = useManifestEntries(projectId, true);

  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdVersion, setCreatedVersion] = useState<any>(null);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState<{signature: string; publicKey: string} | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isCreateVersionModalOpen) {
      setCreatedVersion(null);
      setNote('');
      setSignatureConfirmed(false);
      setSignatureData(null);
    }
  }, [isCreateVersionModalOpen]);

  if (!isCreateVersionModalOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = uncommittedFiles.reduce((sum, file) => sum + (file.size || 0), 0);

  const handleCreateVersion = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (uncommittedFiles.length === 0) {
      toast.error('No files to commit');
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Prepare commit data (call backend)
      toast.loading('Preparing commit...');
      const prepareResult = await api.prepareCommit({ 
        datasetId: projectId, // projectId is the datasetId
        includeAllEntries: false, // Only uncommitted files
      });

      toast.dismiss();
      toast.loading('Please approve the signature in your wallet...', { duration: 15000 });
      
      // Step 2: Sign with wallet
      const signResult = await signMessage(prepareResult.message);
      
      // Store signature data and confirm
      setSignatureData(signResult);
      setSignatureConfirmed(true);
      
      toast.dismiss();
      toast.success('✅ Signature confirmed!', { duration: 2000 });
      
      // Small delay to show confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.loading('Creating version...', { duration: 10000 });

      // Step 3: Create version with signature
      const versionResult = await api.createVersion({
        datasetId: projectId,
        signature: signResult.signature,
        publicKey: signResult.publicKey,
        author: address,
        note: note || undefined,
      });

      toast.dismiss();
      
      // Show success with details
      const version = versionResult.version;
      setCreatedVersion(version);
      
      toast.success('Version created successfully!', { duration: 5000 });
      
      // Call callback to refresh versions list
      onVersionCreated?.();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        closeCreateVersionModal();
      }, 3000);
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error.message || 'Failed to create version';
      toast.error(errorMessage, { duration: 6000 });
      console.error('Version creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeCreateVersionModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#1e293b] border-b border-[#334155] px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Version</h2>
            <button
              onClick={closeCreateVersionModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Files Preview */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Files to Include ({uncommittedFiles.length})
              </label>
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 max-h-64 overflow-y-auto">
                {uncommittedFiles.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4">
                    No uncommitted files. Upload files first.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      {uncommittedFiles.map((file) => (
                        <div key={file.id} className="flex items-start gap-2 text-sm">
                          <div className="w-1 h-1 bg-[#97F0E5] rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white truncate">{file.filename || file.path || 'Untitled'}</div>
                            <div className="text-gray-500 text-xs mt-1">
                              {formatFileSize(file.size)} • Blob: <span className="font-mono">{file.blobId.slice(0, 16)}...</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-[#334155] text-sm text-gray-400">
                      Total: {formatFileSize(totalSize)} across {uncommittedFiles.length} file{uncommittedFiles.length !== 1 ? 's' : ''}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Version Note */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Version Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what changed in this version..."
                rows={3}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#97F0E5] focus:border-transparent resize-none"
              />
            </div>

            {/* Signature Confirmation */}
            {signatureConfirmed && signatureData && (
              <div className="bg-[#0f172a] border border-[#97F0E5] rounded-lg p-4 space-y-3 animate-pulse">
                <div className="text-[#97F0E5] font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Signature Confirmed by {authStore.walletName || 'Wallet'}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Signature:</span>
                    <span className="text-white font-mono text-xs break-all">{signatureData.signature.slice(0, 32)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Public Key:</span>
                    <span className="text-white font-mono text-xs break-all">{signatureData.publicKey.slice(0, 32)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white font-mono text-xs">{address.slice(0, 16)}...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {createdVersion && (
              <div className="bg-[#0f172a] border border-[#97F0E5] rounded-lg p-4 space-y-3">
                <div className="text-[#97F0E5] font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Version Created Successfully!
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Version Root:</span>
                    <span className="text-white font-mono text-xs">{createdVersion.versionRoot.slice(0, 20)}...</span>
                  </div>
                  {createdVersion.suiTxHash && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Sui TX:</span>
                      <a 
                        href={`https://suiexplorer.com/txblock/${createdVersion.suiTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#97F0E5] hover:underline font-mono text-xs"
                      >
                        {createdVersion.suiTxHash.slice(0, 20)}...
                      </a>
                    </div>
                  )}
                  {createdVersion.ipfsCID && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">IPFS CID:</span>
                      <a 
                        href={createdVersion.ipfsUrl || `https://ipfs.io/ipfs/${createdVersion.ipfsCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#97F0E5] hover:underline font-mono text-xs"
                      >
                        {createdVersion.ipfsCID.slice(0, 20)}...
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Files:</span>
                    <span className="text-white">{uncommittedFiles.length} file{uncommittedFiles.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={closeCreateVersionModal}
                disabled={isCreating || isSigning}
                className="flex-1 bg-[#0f172a] border border-[#334155] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#161923] transition-colors disabled:opacity-50"
              >
                {createdVersion ? 'Close' : 'Cancel'}
              </button>
              {!createdVersion && (
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  disabled={isCreating || isSigning || uncommittedFiles.length === 0 || !address}
                  className="flex-1 bg-[#97F0E5] text-[#161923] px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating || isSigning ? 'Creating...' : 'Create Version'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

