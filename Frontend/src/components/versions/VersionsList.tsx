import { Version } from '../../types/version';

interface VersionsListProps {
  projectId: string;
  versions: Version[];
}

export default function VersionsList({ projectId, versions }: VersionsListProps) {
  if (versions.length === 0) {
    return (
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-[#97F0E5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#97F0E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-lg mb-2">No versions yet</h3>
        <p className="text-gray-400 text-sm mb-6">
          Upload files and create your first version to begin tracking history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chain Visualization */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Version Chain</h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {versions.map((version, index) => (
            <div key={version.id} className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-[#97F0E5]/10 border-2 border-[#97F0E5] rounded-lg px-4 py-2 min-w-[120px]">
                <div className="text-[#97F0E5] font-semibold text-sm">V{index + 1}</div>
                <div className="text-gray-400 text-xs font-mono">{version.versionRoot.slice(0, 8)}...</div>
              </div>
              {index < versions.length - 1 && (
                <svg className="w-6 h-6 text-[#97F0E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Versions List */}
      {versions.map((version, index) => (
        <div
          key={version.id}
          className="bg-[#0f172a] border border-[#334155] rounded-xl p-6 hover:border-[#97F0E5] transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#97F0E5]/10 rounded-lg flex items-center justify-center">
                <span className="text-[#97F0E5] font-bold">V{index + 1}</span>
              </div>
              <div>
                <div className="text-white font-bold">Version {index + 1}</div>
                <div className="text-gray-400 text-sm">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-green-500 text-xs font-semibold">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-gray-400 text-xs mb-1">Merkle Root</div>
              <div className="text-white font-mono text-sm break-all">
                {version.versionRoot.slice(0, 32)}...
              </div>
            </div>

            {version.parentRoot && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Parent Version</div>
                <div className="text-white font-mono text-sm break-all">
                  {version.parentRoot.slice(0, 32)}...
                </div>
              </div>
            )}

            {version.suiTxHash && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Blockchain Tx</div>
                <div className="text-[#97F0E5] font-mono text-sm break-all">
                  {version.suiTxHash.slice(0, 32)}...
                </div>
              </div>
            )}

            {version.ipfsCID && (
              <div>
                <div className="text-gray-400 text-xs mb-1">IPFS Backup</div>
                <div className="text-[#97F0E5] font-mono text-sm break-all">
                  {version.ipfsCID.slice(0, 32)}...
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {version.note && (
            <div className="mb-4">
              <div className="text-gray-400 text-xs mb-1">Note</div>
              <div className="text-white text-sm">{version.note}</div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
            <span>{version.fileCount} files</span>
            <span>•</span>
            <span>Created by {version.author?.slice(0, 8)}...</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-[#97F0E5] hover:text-[#60D5E8] transition-colors text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>

            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify Chain
            </button>

            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

