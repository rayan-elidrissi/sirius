import { useState, FormEvent, ChangeEvent } from 'react'
import { useCreateBlob } from '../hooks/useCreateBlob'
import type { BlobData } from '../types/blob'

interface CreateBlobModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (blobId: string) => void
}

type InputMode = 'file' | 'text'

export default function CreateBlobModal({ isOpen, onClose, onSuccess }: CreateBlobModalProps) {
  const { createBlob, isCreating, error, reset } = useCreateBlob()
  const [inputMode, setInputMode] = useState<InputMode>('file')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [contentType, setContentType] = useState('text/plain')
  const [metadata, setMetadata] = useState('')
  const [metadataError, setMetadataError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      setFileName('')
      return
    }

    setFile(selectedFile)
    setFileName(selectedFile.name)

    // Détecter automatiquement le type MIME
    const detectedType = selectedFile.type || 'application/octet-stream'
    setContentType(detectedType)

    // Lire le contenu du fichier
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Pour les fichiers texte, on peut aussi stocker la version string
      if (detectedType.startsWith('text/') || detectedType === 'application/json') {
        const text = await selectedFile.text()
        setContent(text)
      } else {
        // Pour les fichiers binaires, on stocke juste le nom du fichier pour l'affichage
        setContent('')
      }
    } catch (err) {
      console.error('Error reading file:', err)
      setFile(null)
      setFileName('')
    }
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleContentTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setContentType(e.target.value)
  }

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode)
    if (mode === 'file') {
      setContent('')
      setFile(null)
      setFileName('')
    } else {
      setFile(null)
      setFileName('')
    }
  }

  const handleMetadataChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMetadata(value)
    setMetadataError(null)

    // Valider le JSON si non vide
    if (value.trim()) {
      try {
        JSON.parse(value)
      } catch {
        setMetadataError('Invalid JSON format')
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Valider les métadonnées JSON
    let parsedMetadata: Record<string, unknown> | undefined
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata)
      } catch {
        setMetadataError('Invalid JSON format')
        return
      }
    }

    // Valider le contenu selon le mode
    if (inputMode === 'file' && !file) {
      return
    }
    if (inputMode === 'text' && !content.trim()) {
      return
    }

    try {
      let blobContent: string | Uint8Array
      let finalContentType = contentType

      if (inputMode === 'file' && file) {
        // Lire le fichier comme Uint8Array
        const arrayBuffer = await file.arrayBuffer()
        blobContent = new Uint8Array(arrayBuffer)
        finalContentType = file.type || contentType
      } else {
        // Utiliser le contenu texte
        blobContent = content
      }

      const blobData: BlobData = {
        content: blobContent,
        contentType: finalContentType,
        metadata: parsedMetadata,
      }

      const result = await createBlob({
        data: blobData,
      })

      // Réinitialiser le formulaire
      setContent('')
      setFile(null)
      setFileName('')
      setContentType('text/plain')
      setMetadata('')
      setMetadataError(null)
      reset()

      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess(result.blobId)
      }

      // Fermer le modal
      onClose()
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
      console.error('Error creating blob:', error)
    }
  }

  const handleClose = () => {
    setContent('')
    setFile(null)
    setFileName('')
    setContentType('text/plain')
    setMetadata('')
    setMetadataError(null)
    setInputMode('file')
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#161923] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#334155]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create a Blob</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du mode d'entrée */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Input Method
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleModeChange('file')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  inputMode === 'file'
                    ? 'bg-[#97F0E5] text-black'
                    : 'bg-[#334155] text-white hover:bg-[#475569]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('text')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  inputMode === 'text'
                    ? 'bg-[#97F0E5] text-black'
                    : 'bg-[#334155] text-white hover:bg-[#475569]'
                }`}
              >
                Enter Text
              </button>
            </div>
          </div>

          {/* Upload de fichier */}
          {inputMode === 'file' && (
            <div>
              <label
                htmlFor="fileInput"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                File <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  required={inputMode === 'file'}
                />
                <label
                  htmlFor="fileInput"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[#334155] rounded-lg cursor-pointer hover:border-[#97F0E5] transition-colors bg-[#0f172a]"
                >
                  <div className="text-center">
                    {fileName ? (
                      <div className="flex flex-col items-center gap-2">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-white text-sm font-medium">{fileName}</span>
                        <span className="text-gray-400 text-xs">Click to change file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-10 h-10 text-gray-400"
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
                        <span className="text-gray-400 text-sm">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-gray-500 text-xs">Any file type</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Saisie de texte */}
          {inputMode === 'text' && (
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={handleContentChange}
                required={inputMode === 'text'}
                rows={8}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CCA9DD] focus:border-transparent resize-none font-mono text-sm"
                placeholder="Enter blob content..."
              />
            </div>
          )}

          {/* Type de contenu */}
          <div>
            <label
              htmlFor="contentType"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Content Type {inputMode === 'file' && '(auto-detected)'}
            </label>
            <select
              id="contentType"
              value={contentType}
              onChange={handleContentTypeChange}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#CCA9DD] focus:border-transparent"
            >
              <option value="text/plain">Text/Plain</option>
              <option value="application/json">JSON</option>
              <option value="text/markdown">Markdown</option>
              <option value="text/html">HTML</option>
              <option value="image/png">PNG Image</option>
              <option value="image/jpeg">JPEG Image</option>
              <option value="application/pdf">PDF</option>
              <option value="application/octet-stream">Binary</option>
            </select>
            {inputMode === 'file' && file && (
              <p className="mt-1 text-xs text-gray-400">
                Type detected from file. You can change it manually.
              </p>
            )}
          </div>

          {/* Métadonnées (optionnel) */}
          <div>
            <label
              htmlFor="metadata"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Metadata (JSON, optional)
            </label>
            <textarea
              id="metadata"
              value={metadata}
              onChange={handleMetadataChange}
              rows={4}
              className={`w-full bg-[#0f172a] border rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CCA9DD] focus:border-transparent resize-none font-mono text-sm ${
                metadataError
                  ? 'border-red-500'
                  : 'border-[#334155]'
              }`}
              placeholder='{"key": "value"}'
            />
            {metadataError && (
              <p className="mt-1 text-sm text-red-400">{metadataError}</p>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium text-white bg-[#334155] hover:bg-[#475569] transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-medium text-black transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#97F0E5' }}
              disabled={
                isCreating ||
                !!metadataError ||
                (inputMode === 'file' && !file) ||
                (inputMode === 'text' && !content.trim())
              }
            >
              {isCreating ? 'Creating...' : 'Create Blob'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

