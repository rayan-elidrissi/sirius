import { useState } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useProjects } from '../../hooks/useProjects';
import { CreateProjectInput } from '../../types/project';

export default function CreateProjectModal() {
  const { isCreateProjectModalOpen, closeCreateProjectModal } = useUIStore();
  const { createProject, isCreating } = useProjects();

  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    category: 'research',
    securityLevel: 'enhanced',
    collaborators: [],
  });

  if (!isCreateProjectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProject(formData);
      // Close modal and reset form after successful creation
      closeCreateProjectModal();
      setFormData({
        name: '',
        description: '',
        category: 'research',
        securityLevel: 'enhanced',
        collaborators: [],
      });
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('Failed to create project:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeCreateProjectModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#1e293b] border-b border-[#334155] px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create New Project</h2>
            <button
              onClick={closeCreateProjectModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Climate Research 2024"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#97F0E5] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your project..."
                rows={3}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#97F0E5] focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#97F0E5] focus:border-transparent"
              >
                <option value="research">🔬 Scientific Research</option>
                <option value="medical">🏥 Medical / Healthcare</option>
                <option value="enterprise">💼 Enterprise / Business</option>
                <option value="education">🎓 Education</option>
                <option value="personal">👤 Personal</option>
                <option value="other">📦 Other</option>
              </select>
            </div>

            {/* Security Level */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Security Level
              </label>
              <div className="space-y-3">
                {/* Standard */}
                <label className="flex items-start gap-3 p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#97F0E5] transition-colors">
                  <input
                    type="radio"
                    name="security"
                    value="standard"
                    checked={formData.securityLevel === 'standard'}
                    onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-1">Standard</div>
                    <div className="text-gray-400 text-sm">
                      Single signature • Local storage • Free
                    </div>
                  </div>
                </label>

                {/* Enhanced */}
                <label className="flex items-start gap-3 p-4 bg-[#0f172a] border-2 border-[#97F0E5] rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="security"
                    value="enhanced"
                    checked={formData.securityLevel === 'enhanced'}
                    onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-white font-semibold">Enhanced</div>
                      <span className="text-xs bg-[#97F0E5] text-[#161923] px-2 py-0.5 rounded-full font-semibold">
                        Recommended
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Blockchain anchoring + IPFS backup • ~$0.002 per version
                    </div>
                  </div>
                </label>

                {/* Maximum */}
                <label className="flex items-start gap-3 p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#97F0E5] transition-colors">
                  <input
                    type="radio"
                    name="security"
                    value="maximum"
                    checked={formData.securityLevel === 'maximum'}
                    onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-1">Maximum</div>
                    <div className="text-gray-400 text-sm">
                      Multi-sig + Blockchain + Arweave permanent archive • ~$0.10 once
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Collaborators */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Collaborators (Sui Wallet Addresses)
              </label>
              <p className="text-gray-400 text-sm mb-3">
                Add Sui wallet addresses (starting with 0x) of people who will have full access to this project
              </p>
              <div className="space-y-2">
                {formData.collaborators?.map((collab, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={collab}
                      onChange={(e) => {
                        const newCollaborators = [...(formData.collaborators || [])];
                        newCollaborators[index] = e.target.value;
                        setFormData({ ...formData, collaborators: newCollaborators });
                      }}
                      placeholder="0x..."
                      className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#97F0E5] focus:border-transparent font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCollaborators = formData.collaborators?.filter((_, i) => i !== index) || [];
                        setFormData({ ...formData, collaborators: newCollaborators });
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Remove collaborator"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      collaborators: [...(formData.collaborators || []), ''],
                    });
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] border-dashed text-gray-400 hover:text-[#97F0E5] hover:border-[#97F0E5] rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Collaborator
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={closeCreateProjectModal}
                className="flex-1 bg-[#0f172a] border border-[#334155] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#161923] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !formData.name}
                className="flex-1 bg-[#97F0E5] text-[#161923] px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

