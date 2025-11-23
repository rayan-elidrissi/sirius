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

interface TeeVerificationResult {
  entryId: string;
  filename: string;
  mimeType: string | null;
  size: number;
  verified: boolean;
  decision: boolean;
  weapon: boolean;
  description: string;
  error?: string;
}

export default function CreateVersionModal({ projectId, onVersionCreated }: CreateVersionModalProps) {
  const { isCreateVersionModalOpen, closeCreateVersionModal } = useUIStore();
  const authStore = useAuthStore();
  const { signTransaction, isSigning, address } = useWallet();
  const { entries: uncommittedFiles } = useManifestEntries(projectId, true);

  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdVersion, setCreatedVersion] = useState<any>(null);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState<{signature: string; publicKey: string} | null>(null);
  
  // TEE Verification state
  const [teeVerification, setTeeVerification] = useState<{
    results: Map<string, TeeVerificationResult>;
    isVerifying: boolean;
    verified: boolean;
  }>({
    results: new Map(),
    isVerifying: false,
    verified: false,
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isCreateVersionModalOpen) {
      setCreatedVersion(null);
      setNote('');
      setSignatureConfirmed(false);
      setSignatureData(null);
      setTeeVerification({
        results: new Map(),
        isVerifying: false,
        verified: false,
      });
    }
  }, [isCreateVersionModalOpen]);

  // Verify files with TEE when modal opens
  useEffect(() => {
    if (isCreateVersionModalOpen && address && uncommittedFiles.length > 0 && !teeVerification.verified) {
      verifyFilesWithTee();
    }
  }, [isCreateVersionModalOpen, address, uncommittedFiles.length]);

  const verifyFilesWithTee = async () => {
    if (!address || !projectId) return;

    setTeeVerification(prev => ({ ...prev, isVerifying: true }));

    try {
      toast.loading('Verifying files with TEE...', { duration: 30000 });
      const result = await api.verifyFilesTee(projectId, address);
      
      // Convert array to Map for easy lookup
      const resultsMap = new Map<string, TeeVerificationResult>();
      result.files.forEach(file => {
        resultsMap.set(file.entryId, file);
      });

      setTeeVerification({
        results: resultsMap,
        isVerifying: false,
        verified: true,
      });

      toast.dismiss();
      
      if (result.illegalFiles > 0) {
        toast.error(`${result.illegalFiles} file(s) failed TEE verification and will be burned`, { duration: 5000 });
      } else {
        toast.success(`All files verified and certified by Nautilus TEE`, { duration: 3000 });
      }
    } catch (error: any) {
      console.error('TEE verification error:', error);
      toast.dismiss();
      toast.error(`TEE verification failed: ${error.message}`, { duration: 5000 });
      setTeeVerification(prev => ({ ...prev, isVerifying: false, verified: true }));
    }
  };

  if (!isCreateVersionModalOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter legal files only
  const legalFiles = uncommittedFiles.filter(file => {
    const verification = teeVerification.results.get(file.id);
    // If not verified yet, include it (will be verified)
    if (!verification) return true;
    // Only include if decision is true (legal)
    return verification.decision === true;
  });

  const illegalFiles = uncommittedFiles.filter(file => {
    const verification = teeVerification.results.get(file.id);
    return verification && verification.decision === false;
  });

  const totalSize = legalFiles.reduce((sum, file) => sum + (file.size || 0), 0);

  const handleCreateVersion = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (legalFiles.length === 0) {
      toast.error('No legal files to commit');
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Prepare commit (this will burn illegal files automatically)
      toast.loading('Preparing commit...');
      const prepareResult = await api.prepareCommit({
        repoObjectId: projectId,
        authorAddress: address,
        note: note || undefined,
      });

      toast.dismiss();
      toast.loading('Please approve the transaction in your wallet...', { duration: 15000 });
      
      // Step 2: Sign transaction with wallet
      const signResult = await signTransaction(prepareResult.transactionBytes);
      
      // Store signature data and confirm
      setSignatureData({
        signature: signResult.signature,
        publicKey: signResult.publicKey,
      });
      setSignatureConfirmed(true);
      
      toast.dismiss();
      toast.success('✅ Transaction signed!', { duration: 2000 });
      
      // Small delay to show confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.loading('Executing commit...', { duration: 10000 });

      // Step 3: Execute signed commit
      // IMPORTANT: Use signResult.transactionBytes (signed transaction bytes), not prepareResult.transactionBytes (JSON)
      const commitResult = await api.executeCommit({
        repoObjectId: projectId,
        transactionBytes: signResult.transactionBytes, // Use signed transaction bytes, not the JSON from prepare
        signature: signResult.signature,
        publicKey: signResult.publicKey,
        signerAddress: address,
        manifestBlobId: prepareResult.manifestBlobId,
        merkleRoot: prepareResult.merkleRoot,
        parentCommitId: prepareResult.parentCommitId,
      });

      toast.dismiss();
      
      setCreatedVersion(commitResult);
      toast.success('Version created successfully!', { duration: 5000 });
      
      // Call callback to refresh
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

  const getFileVerificationStatus = (fileId: string) => {
    return teeVerification.results.get(fileId);
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
            {/* Files Preview with TEE Status */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Files to Include ({legalFiles.length})
                {teeVerification.isVerifying && (
                  <span className="ml-2 text-sm text-gray-400">(Verifying with TEE...)</span>
                )}
              </label>
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 max-h-64 overflow-y-auto">
                {uncommittedFiles.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4">
                    No uncommitted files. Upload files first.
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-3">
                      {uncommittedFiles.map((file) => {
                        const verification = getFileVerificationStatus(file.id);
                        const isLegal = verification ? verification.decision : null;
                        const isVerifying = !teeVerification.verified && teeVerification.isVerifying;

                        return (
                          <div key={file.id} className="flex items-start gap-3 text-sm">
                            {/* Status Icon */}
                            <div className="flex-shrink-0 mt-1">
                              {isVerifying ? (
                                <div className="w-5 h-5 border-2 border-[#97F0E5] border-t-transparent rounded-full animate-spin" />
                              ) : isLegal === true ? (
                                <div className="w-5 h-5 rounded-full bg-[#97F0E5] flex items-center justify-center">
                                  <svg className="w-3 h-3 text-[#161923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : isLegal === false ? (
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-1 h-1 bg-[#97F0E5] rounded-full mt-2" />
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`text-white truncate ${isLegal === false ? 'line-through text-red-400' : ''}`}>
                                  {file.filename || file.path || 'Untitled'}
                                </div>
                                {isLegal === true && (
                                  <span className="text-xs bg-[#97F0E5]/20 text-[#97F0E5] px-2 py-0.5 rounded">
                                    ✓ Nautilus Certified
                                  </span>
                                )}
                                {isLegal === false && (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                    ✗ Burned
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {formatFileSize(file.size)} • Blob: <span className="font-mono">{file.blobId?.slice(0, 16) || 'N/A'}...</span>
                              </div>
                              {verification && (
                                <div className={`text-xs mt-1 ${isLegal === false ? 'text-red-400' : 'text-gray-400'}`}>
                                  {verification.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-3 border-t border-[#334155] text-sm text-gray-400">
                      Total: {formatFileSize(totalSize)} across {legalFiles.length} legal file{legalFiles.length !== 1 ? 's' : ''}
                      {illegalFiles.length > 0 && (
                        <span className="text-red-400 ml-2">
                          • {illegalFiles.length} file{illegalFiles.length !== 1 ? 's' : ''} burned
                        </span>
                      )}
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
                  Transaction Signed by {authStore.walletName || 'Wallet'}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white font-mono text-xs">{address?.slice(0, 16)}...</span>
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
                  {createdVersion.commitObjectId && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Commit ID:</span>
                      <span className="text-white font-mono text-xs">{createdVersion.commitObjectId.slice(0, 20)}...</span>
                    </div>
                  )}
                  {createdVersion.suiscanUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">View on Suiscan:</span>
                      <a 
                        href={createdVersion.suiscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#97F0E5] hover:underline text-xs"
                      >
                        Open →
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Files:</span>
                    <span className="text-white">{legalFiles.length} file{legalFiles.length !== 1 ? 's' : ''}</span>
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
                  disabled={
                    isCreating || 
                    isSigning || 
                    legalFiles.length === 0 || 
                    !address || 
                    teeVerification.isVerifying ||
                    !teeVerification.verified
                  }
                  className="flex-1 bg-[#97F0E5] text-[#161923] px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {teeVerification.isVerifying 
                    ? 'Verifying...' 
                    : isCreating || isSigning 
                    ? 'Creating...' 
                    : 'Create Version'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
