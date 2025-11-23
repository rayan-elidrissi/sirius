import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useManifestEntries, useVersions } from '../hooks/useProjects';
import { useUIStore } from '../stores/useUIStore';
import WalletInfo from '../components/wallet/WalletInfo';
import FileUploader from '../components/files/FileUploader';
import FilesList from '../components/files/FilesList';
import CreateVersionModal from '../components/versions/CreateVersionModal';
import VersionsList from '../components/versions/VersionsList';
import logoSirius from '../assets/svg/logo-sirius.svg';

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, isLoading } = useProject(projectId);
  const { openCreateVersionModal, openUploadFilesModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<'files' | 'versions' | 'activity'>('files');

  // Fetch manifest entries (uncommitted files)
  const { entries: uncommittedFiles, invalidate: invalidateFiles } = useManifestEntries(projectId, true);
  
  // Fetch versions
  const { versions, invalidate: invalidateVersions } = useVersions(projectId);

  // Callback to refresh files after upload
  const handleFilesUploaded = () => {
    invalidateFiles();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161923] flex items-center justify-center">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#161923] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">Project not found</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[#97F0E5] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161923]">
      {/* Header */}
      <nav className="border-b border-[#334155] bg-[#0f172a]/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
              >
                <div className="relative">
                  <img 
                    src={logoSirius} 
                    alt="Sirius" 
                    className="h-12 w-12 group-hover:scale-110 transition-transform"
                    style={{
                      filter: 'brightness(2) contrast(1.5) saturate(1.5) drop-shadow(0 0 8px rgba(151, 240, 229, 0.8)) drop-shadow(0 0 16px rgba(151, 240, 229, 0.5))',
                      WebkitFilter: 'brightness(2) contrast(1.5) saturate(1.5) drop-shadow(0 0 8px rgba(151, 240, 229, 0.8)) drop-shadow(0 0 16px rgba(151, 240, 229, 0.5))',
                    }}
                  />
                  {/* Overlay pour épaisseur */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(151, 240, 229, 0.3) 0%, transparent 70%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                </div>
                <span className="text-white font-semibold drop-shadow-md" style={{ fontFamily: 'TheAliens, sans-serif' }}>{project.name}</span>
              </button>
            </div>

            <WalletInfo />
          </div>
        </div>
      </nav>

      {/* Project Info Bar */}
      <div className="bg-[#0f172a] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Files:</span>
                <span className="text-white font-semibold">{uncommittedFiles.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Versions:</span>
                <span className="text-white font-semibold">{versions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Security:</span>
                <span className="text-[#97F0E5] font-semibold capitalize">
                  {project.securityLevel}
                </span>
              </div>
              {/* Repository ID (Sui Object ID) */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Repository ID:</span>
                <span className="text-white font-mono text-xs">
                  {((project as any).repoObjectId || project.id).substring(0, 10)}...{((project as any).repoObjectId || project.id).substring(((project as any).repoObjectId || project.id).length - 6)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText((project as any).repoObjectId || project.id);
                  }}
                  className="text-[#97F0E5] hover:text-white transition-colors"
                  title="Copy Repository ID"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              {/* Owner Address */}
              {(project as any).suiInfo?.owner && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-white font-mono text-xs">
                    {(project as any).suiInfo.owner.substring(0, 8)}...{(project as any).suiInfo.owner.substring((project as any).suiInfo.owner.length - 6)}
                  </span>
                </div>
              )}
              {/* Suiscan Link */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://suiscan.xyz/testnet/object/${(project as any).repoObjectId || project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#97F0E5] hover:text-white transition-colors flex items-center gap-1"
                  title="View Repository on Suiscan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs">View on Suiscan</span>
                </a>
              </div>
            </div>

            {uncommittedFiles.length > 0 && (
              <button
                onClick={openCreateVersionModal}
                className="bg-[#97F0E5] text-[#161923] px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Version
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'files'
                  ? 'border-[#97F0E5] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'versions'
                  ? 'border-[#97F0E5] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Versions
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 border-b-2 font-semibold transition-colors ${
                activeTab === 'activity'
                  ? 'border-[#97F0E5] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Activity
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'files' && (
          <div>
            <FileUploader projectId={projectId!} onFilesUploaded={handleFilesUploaded} />
            <FilesList 
              projectId={projectId!} 
              files={uncommittedFiles}
              onFileDeleted={handleFilesUploaded}
              repoObjectId={(project as any)?.repoObjectId || projectId}
              authorAddress={(project as any)?.ownerAddress}
            />
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            <VersionsList projectId={projectId!} versions={versions} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="text-center py-20 text-gray-400">
            Activity log coming soon...
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateVersionModal 
        projectId={projectId!} 
        onVersionCreated={() => {
          invalidateFiles();
          invalidateVersions();
        }}
      />
    </div>
  );
}

