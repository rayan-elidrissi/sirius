import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useUIStore } from '../stores/useUIStore';
import WalletInfo from '../components/wallet/WalletInfo';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import Background3D from '../components/background/Background3D';
import logoSirius from '../assets/svg/logo-sirius.svg';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, isLoading, deleteProject, isDeleting } = useProjects();
  const { openCreateProjectModal } = useUIStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    if (!showDeleteConfirm || showDeleteConfirm !== projectId) {
      setShowDeleteConfirm(projectId);
      return;
    }

    setShowDeleteConfirm(null);

    try {
      console.log(`[Dashboard] Attempting to delete repository: ${projectId}`);
      await deleteProject(projectId);
      // Toast and invalidation are handled by the mutation in useProjects
    } catch (error: any) {
      console.error('[Dashboard] Delete project error:', error);
      // Error toast is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen bg-[#161923] relative overflow-hidden">
      {/* 3D Background */}
      <Background3D />
      
      {/* Header */}
      <nav className="border-b border-[#334155] bg-[#0f172a]/50 backdrop-blur-sm sticky top-0 z-30 relative">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
            >
              <div className="relative">
                <img 
                  src={logoSirius} 
                  alt="Sirius Logo" 
                  className="h-14 w-14 brightness-200 contrast-150 saturate-150 drop-shadow-2xl group-hover:scale-110 transition-transform filter"
                  style={{
                    filter: 'brightness(2) contrast(1.5) saturate(1.5) drop-shadow(0 0 10px rgba(151, 240, 229, 0.8)) drop-shadow(0 0 20px rgba(151, 240, 229, 0.5))',
                    WebkitFilter: 'brightness(2) contrast(1.5) saturate(1.5) drop-shadow(0 0 10px rgba(151, 240, 229, 0.8)) drop-shadow(0 0 20px rgba(151, 240, 229, 0.5))',
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
              <span className="text-3xl font-bold text-white drop-shadow-md" style={{ fontFamily: 'TheAliens, sans-serif' }}>Sirius</span>
            </button>

            <div className="flex items-center gap-4">
              <a
                href="/docs"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="/about"
                className="text-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <WalletInfo />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-gray-400">
              Manage your datasets with cryptographic integrity
            </p>
          </div>

          <button
            onClick={openCreateProjectModal}
            className="flex items-center gap-2 bg-[#97F0E5] text-[#161923] px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects List or Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#97F0E5]/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                No projects yet
              </h2>

              <p className="text-gray-400 mb-8">
                Create your first project to start versioning your data with
                cryptographic guarantees.
              </p>

              <button
                onClick={openCreateProjectModal}
                className="bg-[#97F0E5] text-[#161923] px-8 py-4 rounded-lg font-semibold hover:brightness-110 transition-all text-lg"
              >
                Create My First Project
              </button>

              {/* Info Cards */}
              <div className="grid grid-cols-1 gap-4 mt-12 text-left">
                <div className="bg-[#161923] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📸</div>
                    <div>
                      <div className="font-semibold text-white mb-1">
                        Merkle Roots
                      </div>
                      <div className="text-sm text-gray-400">
                        Unique cryptographic fingerprints of your datasets
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161923] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✍️</div>
                    <div>
                      <div className="font-semibold text-white mb-1">
                        Digital Signatures
                      </div>
                      <div className="text-sm text-gray-400">
                        Sign with your Sui wallet to prove authorship
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161923] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔗</div>
                    <div>
                      <div className="font-semibold text-white mb-1">
                        Version Chain
                      </div>
                      <div className="text-sm text-gray-400">
                        Complete audit trail with parent-child links
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#0f172a] border border-[#334155] rounded-xl p-6 hover:border-[#97F0E5] transition-all group relative"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  disabled={isDeleting}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Delete project"
                >
                  {isDeleting ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                {/* Delete Confirmation */}
                {showDeleteConfirm === project.id && (
                  <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-20 p-4">
                    <div className="text-center">
                      <div className="text-red-400 mb-3 text-lg font-semibold">
                        Delete "{project.name}"?
                      </div>
                      <div className="text-gray-400 text-sm mb-4">
                        This will soft delete the repository on Sui. The repository will be marked as deleted and hidden from your list.
                        <br />
                        <span className="text-red-400 font-semibold">This action cannot be undone.</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(null);
                          }}
                          className="px-4 py-2 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Card Content */}
                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#97F0E5]/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[#97F0E5]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>

                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#97F0E5] transition-colors">
                    {project.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      </svg>
                      {project.fileCount} files
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {project.versionCount} versions
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal />
    </div>
  );
}

