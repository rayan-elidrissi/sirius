import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useUIStore } from '../stores/useUIStore';
import { useAuthStore } from '../stores/useAuthStore';
import WalletInfo from '../components/wallet/WalletInfo';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import logoSirius from '../assets/svg/logo-sirius.svg';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { openCreateProjectModal } = useUIStore();
  const { address, isConnected } = useAuthStore();

  // Redirect to landing if not connected (optional - you can remove this if you want to show dashboard anyway)
  // useEffect(() => {
  //   if (!isConnected && !address) {
  //     navigate('/sirius');
  //   }
  // }, [isConnected, address, navigate]);

  return (
    <div className="min-h-screen bg-[#161923]">
      {/* Header */}
      <nav className="border-b border-[#334155] bg-[#0f172a]/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoSirius} alt="Sirius Logo" className="h-8" />
              <span className="text-xl font-bold text-white">Sirius</span>
            </div>

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
      <div className="max-w-7xl mx-auto px-6 py-12">
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
              <button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-[#0f172a] border border-[#334155] rounded-xl p-6 hover:border-[#97F0E5] transition-all text-left group"
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
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal />
    </div>
  );
}

