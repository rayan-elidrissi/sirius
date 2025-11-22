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
              <div className="flex items-center gap-3">
                <img src={logoSirius} alt="Sirius" className="h-6" />
                <span className="text-white font-semibold">{project.name}</span>
              </div>
            </div>

            <WalletInfo />
          </div>
        </div>
      </nav>

      {/* Project Info Bar */}
      <div className="bg-[#0f172a] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 text-sm">
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

