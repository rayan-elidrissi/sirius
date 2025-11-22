import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

export type BlobEventType = 'creation' | 'modification' | 'anomaly' | 'anchor' | 'deletion' | 'other'

export interface BlobEventMetadata {
  transactionId?: string
  nodeId?: string
  integrityScore?: number
  changes?: string[]
  epoch?: number
}

export interface BlobEvent {
  id: string
  timestamp: Date
  type: BlobEventType
  description: string
  blobHash: string
  metadata?: BlobEventMetadata
}

export interface BlobHistoryProps {
  blobId: string
  events: BlobEvent[]
  isLoading?: boolean
}

const EVENT_COLORS: Record<BlobEventType, string> = {
  creation: '#6EE7B7',      // Pastel green
  modification: '#93C5FD',   // Pastel blue
  anomaly: '#FCD34D',        // Pastel yellow/orange
  anchor: '#C4B5FD',         // Pastel purple
  deletion: '#FCA5A5',       // Pastel red/pink
  other: '#9CA3AF'           // Pastel gray
}

const EVENT_LABELS: Record<BlobEventType, string> = {
  creation: 'Blob Creation',
  modification: 'Content Modification',
  anomaly: 'Anomaly Detected',
  anchor: 'Blockchain Anchor',
  deletion: 'Deletion or Archive',
  other: 'Other Events'
}

const FILTERS = [
  { id: 'all', label: 'All', type: null as BlobEventType | null },
  { id: 'creation', label: 'Creations', type: 'creation' as BlobEventType },
  { id: 'modification', label: 'Modifications', type: 'modification' as BlobEventType },
  { id: 'anomaly', label: 'Anomalies', type: 'anomaly' as BlobEventType },
  { id: 'anchor', label: 'Anchors', type: 'anchor' as BlobEventType },
  { id: 'deletion', label: 'Deletions', type: 'deletion' as BlobEventType },
  { id: 'other', label: 'Other', type: 'other' as BlobEventType }
]

function formatTimestamp(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`
}

function formatHash(hash: string): string {
  // Retirer le préfixe 0x s'il existe pour le traitement
  const hashWithoutPrefix = hash.startsWith('0x') ? hash.substring(2) : hash
  
  if (hashWithoutPrefix.length <= 8) return hash
  const first4 = hashWithoutPrefix.substring(0, 4)
  const last4 = hashWithoutPrefix.substring(hashWithoutPrefix.length - 4)
  return `0x${first4}...${last4}`
}

export default function BlobHistoryGraph({ blobId, events, isLoading = false }: BlobHistoryProps) {
  const [selectedFilter, setSelectedFilter] = useState<BlobEventType | null>(null) // null = "Tous"

  const filteredEvents = useMemo(() => {
    if (!selectedFilter) return events
    return events.filter(event => event.type === selectedFilter)
  }, [events, selectedFilter])

  if (isLoading) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <div className="text-gray-400">Loading history...</div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <div className="text-gray-400">No events found for this blob</div>
      </div>
    )
  }

  return (
    <div className="w-full mt-8">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              (selectedFilter === null && filter.type === null) || (selectedFilter === filter.type)
                ? 'bg-[#97F0E5] text-black'
                : 'bg-[#0f172a] border border-[#334155] text-gray-300 hover:border-[#97F0E5]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Ligne verticale */}
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: '#334155' }}
        />

        {/* Événements */}
        <div className="space-y-8">
          {filteredEvents.map((event, index) => {
            const color = EVENT_COLORS[event.type]
            const label = EVENT_LABELS[event.type]

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: 'easeOut'
                }}
                className="relative flex items-start gap-4 group"
              >
                {/* Point sur la timeline */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Effet de brillance au survol */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5), transparent 70%)`,
                      }}
                      initial={{ opacity: 0 }}
                      whileHover={{ 
                        opacity: [0, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                    {/* Lueur supplémentaire au survol */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: `0 0 8px ${color}40`,
                      }}
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div className="w-2 h-2 rounded-full bg-white relative z-10" />
                  </motion.div>
                </div>

                {/* Contenu de l'événement */}
                <motion.div
                  className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg p-4 hover:border-[#97F0E5] transition-colors"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">{label}</h3>
                      <p className="text-gray-300 text-sm">{event.description}</p>
                    </div>
                    <div className="text-gray-400 text-sm font-mono">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>

                  {/* Hash */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-sm">Hash:</span>
                    <span className="text-[#9cdcfe] font-mono text-sm">
                      {formatHash(event.blobHash)}
                    </span>
                  </div>

                  {/* Métadonnées supplémentaires */}
                  {event.metadata && (
                    <div className="mt-3 pt-3 border-t border-[#334155] space-y-1">
                      {event.metadata.transactionId && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Transaction ID:</span>
                          <span className="text-[#9cdcfe] font-mono">
                            {formatHash(event.metadata.transactionId)}
                          </span>
                        </div>
                      )}
                      {event.metadata.nodeId && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Node:</span>
                          <span className="text-gray-300">{event.metadata.nodeId}</span>
                        </div>
                      )}
                      {event.metadata.integrityScore !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Integrity Score:</span>
                          <span className="text-gray-300">{event.metadata.integrityScore}</span>
                        </div>
                      )}
                      {event.metadata.epoch !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Epoch:</span>
                          <span className="text-gray-300">{event.metadata.epoch}</span>
                        </div>
                      )}
                      {event.metadata.changes && event.metadata.changes.length > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-400">Changes:</span>
                          <ul className="list-disc list-inside ml-2 text-gray-300">
                            {event.metadata.changes.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

