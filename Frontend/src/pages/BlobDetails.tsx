import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import BlobHistoryGraph, { type BlobEvent } from '@/components/BlobHistoryGraph'
import { getBlobHistory } from '@/services/walrus'

interface BlobData {
  blobId: string
  suiObjectId: string
  startEpoch: number
  endEpoch: number
  size: string
  createTime: string
}

export default function BlobDetails() {
  const { blobId } = useParams<{ blobId: string }>()
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [blobEvents, setBlobEvents] = useState<BlobEvent[]>([])
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastEventIdRef = useRef<string | null>(null)
  
  // Pour l'instant, on simule des données. Plus tard, on pourra faire un appel API
  // En production, vous devrez valider le blobId et récupérer les données depuis une API
  const blobData: BlobData = {
    blobId: blobId || '',
    suiObjectId: '0x47c94860d69bdc9ce559df1a65e2356670587aa1d2ea663d84951ee086fbefbd',
    startEpoch: 18,
    endEpoch: 19,
    size: '104.86 MB',
    createTime: '37s'
  }

  // Charger l'historique initial et configurer le polling
  useEffect(() => {
    if (!blobId) return

    const loadInitialHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const events = await getBlobHistory(blobId)
        setBlobEvents(events)
        // Stocker l'ID du dernier événement pour le polling
        if (events.length > 0) {
          lastEventIdRef.current = events[events.length - 1].id
        }
      } catch (error) {
        console.error('Error loading blob history:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadInitialHistory()

    // Configurer le polling pour vérifier les nouveaux événements toutes les 5 secondes
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const newEvents = await getBlobHistory(blobId, lastEventIdRef.current || undefined)
        if (newEvents.length > 0) {
          // Ajouter les nouveaux événements à la liste existante
          setBlobEvents(prevEvents => {
            const updatedEvents = [...prevEvents, ...newEvents]
            // Mettre à jour l'ID du dernier événement
            lastEventIdRef.current = updatedEvents[updatedEvents.length - 1].id
            return updatedEvents
          })
        }
      } catch (error) {
        console.error('Error polling blob history:', error)
      }
    }, 5000) // Polling toutes les 5 secondes

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [blobId])

  const formatBlobId = (id: string) => {
    if (id.length <= 12) return id
    const start = id.substring(0, 6)
    const end = id.substring(id.length - 6)
    return { start, end }
  }

  const formatSuiObjectId = (id: string) => {
    if (id.length <= 10) return id
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="w-full min-h-screen bg-[#161921] text-white segoe-ui-font">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Titre SiriuScan en haut à gauche */}
        <Link to="/use-sir" className="inline-block">
          <h1 className="text-5xl font-bold mb-8 hover:opacity-80 transition-opacity cursor-pointer" style={{ color: '#ffffff' }}>
            SiriuScan
          </h1>
        </Link>

        {/* Tableau */}
        <div className="w-full">
          {/* En-tête du tableau */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-semibold" style={{ color: 'var(--text-main, #ffffff)' }}>
                Blobs
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-full" style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto auto' }}>
              {/* En-têtes de colonnes */}
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingLeft: '16px', paddingTop: '0px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 flex items-center justify-center cursor-help">
                    <svg width="4" height="8" viewBox="0 0 4 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.20766 1.61574C3.40255 1.43209 3.5 1.20916 3.5 0.947733C3.5 0.686722 3.40255 0.463939 3.20766 0.278587C3.0127 0.0932362 2.77861 0 2.50412 0C2.23075 0 1.99436 0.0932398 1.79836 0.278587C1.60346 0.463939 1.50489 0.686722 1.50489 0.947733C1.50489 1.20916 1.60345 1.43209 1.79836 1.61574C1.99437 1.79932 2.23077 1.89143 2.50412 1.89143C2.77861 1.89143 3.0127 1.79932 3.20766 1.61574ZM2.75845 7.75494C3.11014 7.5883 3.29618 7.2751 3.11357 7.13185C3.00824 7.04941 2.87041 7.18581 2.76961 7.18581C2.55345 7.18581 2.40102 7.15 2.3137 7.07781C2.22518 7.00505 2.18263 6.87027 2.18263 6.6713C2.18263 6.59177 2.19497 6.47528 2.22183 6.32116C2.24868 6.16654 2.28007 6.02838 2.3137 5.90787L2.73152 4.40931C2.77072 4.27171 2.79988 4.12047 2.81557 3.95617C2.83008 3.79017 2.83796 3.67532 2.83796 3.61047C2.83796 3.29502 2.72817 3.03804 2.50969 2.84017C2.29234 2.64296 1.98096 2.54343 1.57764 2.54343C1.35359 2.54343 1.11503 2.57698 0.865229 2.6645C0.375621 2.83841 0.4843 3.27057 0.592978 3.27057C0.813604 3.27057 0.961497 3.30858 1.03996 3.38423C1.11836 3.45932 1.15868 3.59289 1.15868 3.78558C1.15868 3.89133 1.1441 4.01021 1.11948 4.13862C1.09367 4.26718 1.06347 4.40415 1.02538 4.54796L0.605329 6.05226C0.569475 6.21027 0.54255 6.35182 0.524623 6.47743C0.507812 6.60309 0.5 6.72592 0.5 6.8465C0.5 7.15518 0.612025 7.40982 0.837197 7.61107C1.06236 7.81295 1.40855 8 1.81404 8C2.07729 8 2.45368 7.90054 2.75845 7.75496L2.75845 7.75494Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                    Blob ID
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingTop: '0px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 flex items-center justify-center cursor-help">
                    <svg width="4" height="8" viewBox="0 0 4 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.20766 1.61574C3.40255 1.43209 3.5 1.20916 3.5 0.947733C3.5 0.686722 3.40255 0.463939 3.20766 0.278587C3.0127 0.0932362 2.77861 0 2.50412 0C2.23075 0 1.99436 0.0932398 1.79836 0.278587C1.60346 0.463939 1.50489 0.686722 1.50489 0.947733C1.50489 1.20916 1.60345 1.43209 1.79836 1.61574C1.99437 1.79932 2.23077 1.89143 2.50412 1.89143C2.77861 1.89143 3.0127 1.79932 3.20766 1.61574ZM2.75845 7.75494C3.11014 7.5883 3.29618 7.2751 3.11357 7.13185C3.00824 7.04941 2.87041 7.18581 2.76961 7.18581C2.55345 7.18581 2.40102 7.15 2.3137 7.07781C2.22518 7.00505 2.18263 6.87027 2.18263 6.6713C2.18263 6.59177 2.19497 6.47528 2.22183 6.32116C2.24868 6.16654 2.28007 6.02838 2.3137 5.90787L2.73152 4.40931C2.77072 4.27171 2.79988 4.12047 2.81557 3.95617C2.83008 3.79017 2.83796 3.67532 2.83796 3.61047C2.83796 3.29502 2.72817 3.03804 2.50969 2.84017C2.29234 2.64296 1.98096 2.54343 1.57764 2.54343C1.35359 2.54343 1.11503 2.57698 0.865229 2.6645C0.375621 2.83841 0.4843 3.27057 0.592978 3.27057C0.813604 3.27057 0.961497 3.30858 1.03996 3.38423C1.11836 3.45932 1.15868 3.59289 1.15868 3.78558C1.15868 3.89133 1.1441 4.01021 1.11948 4.13862C1.09367 4.26718 1.06347 4.40415 1.02538 4.54796L0.605329 6.05226C0.569475 6.21027 0.54255 6.35182 0.524623 6.47743C0.507812 6.60309 0.5 6.72592 0.5 6.8465C0.5 7.15518 0.612025 7.40982 0.837197 7.61107C1.06236 7.81295 1.40855 8 1.81404 8C2.07729 8 2.45368 7.90054 2.75845 7.75496L2.75845 7.75494Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                    Sui Object ID
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingTop: '0px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 flex items-center justify-center cursor-help">
                    <svg width="4" height="8" viewBox="0 0 4 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.20766 1.61574C3.40255 1.43209 3.5 1.20916 3.5 0.947733C3.5 0.686722 3.40255 0.463939 3.20766 0.278587C3.0127 0.0932362 2.77861 0 2.50412 0C2.23075 0 1.99436 0.0932398 1.79836 0.278587C1.60346 0.463939 1.50489 0.686722 1.50489 0.947733C1.50489 1.20916 1.60345 1.43209 1.79836 1.61574C1.99437 1.79932 2.23077 1.89143 2.50412 1.89143C2.77861 1.89143 3.0127 1.79932 3.20766 1.61574ZM2.75845 7.75494C3.11014 7.5883 3.29618 7.2751 3.11357 7.13185C3.00824 7.04941 2.87041 7.18581 2.76961 7.18581C2.55345 7.18581 2.40102 7.15 2.3137 7.07781C2.22518 7.00505 2.18263 6.87027 2.18263 6.6713C2.18263 6.59177 2.19497 6.47528 2.22183 6.32116C2.24868 6.16654 2.28007 6.02838 2.3137 5.90787L2.73152 4.40931C2.77072 4.27171 2.79988 4.12047 2.81557 3.95617C2.83008 3.79017 2.83796 3.67532 2.83796 3.61047C2.83796 3.29502 2.72817 3.03804 2.50969 2.84017C2.29234 2.64296 1.98096 2.54343 1.57764 2.54343C1.35359 2.54343 1.11503 2.57698 0.865229 2.6645C0.375621 2.83841 0.4843 3.27057 0.592978 3.27057C0.813604 3.27057 0.961497 3.30858 1.03996 3.38423C1.11836 3.45932 1.15868 3.59289 1.15868 3.78558C1.15868 3.89133 1.1441 4.01021 1.11948 4.13862C1.09367 4.26718 1.06347 4.40415 1.02538 4.54796L0.605329 6.05226C0.569475 6.21027 0.54255 6.35182 0.524623 6.47743C0.507812 6.60309 0.5 6.72592 0.5 6.8465C0.5 7.15518 0.612025 7.40982 0.837197 7.61107C1.06236 7.81295 1.40855 8 1.81404 8C2.07729 8 2.45368 7.90054 2.75845 7.75496L2.75845 7.75494Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                    Start Epoch
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingTop: '0px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 flex items-center justify-center cursor-help">
                    <svg width="4" height="8" viewBox="0 0 4 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.20766 1.61574C3.40255 1.43209 3.5 1.20916 3.5 0.947733C3.5 0.686722 3.40255 0.463939 3.20766 0.278587C3.0127 0.0932362 2.77861 0 2.50412 0C2.23075 0 1.99436 0.0932398 1.79836 0.278587C1.60346 0.463939 1.50489 0.686722 1.50489 0.947733C1.50489 1.20916 1.60345 1.43209 1.79836 1.61574C1.99437 1.79932 2.23077 1.89143 2.50412 1.89143C2.77861 1.89143 3.0127 1.79932 3.20766 1.61574ZM2.75845 7.75494C3.11014 7.5883 3.29618 7.2751 3.11357 7.13185C3.00824 7.04941 2.87041 7.18581 2.76961 7.18581C2.55345 7.18581 2.40102 7.15 2.3137 7.07781C2.22518 7.00505 2.18263 6.87027 2.18263 6.6713C2.18263 6.59177 2.19497 6.47528 2.22183 6.32116C2.24868 6.16654 2.28007 6.02838 2.3137 5.90787L2.73152 4.40931C2.77072 4.27171 2.79988 4.12047 2.81557 3.95617C2.83008 3.79017 2.83796 3.67532 2.83796 3.61047C2.83796 3.29502 2.72817 3.03804 2.50969 2.84017C2.29234 2.64296 1.98096 2.54343 1.57764 2.54343C1.35359 2.54343 1.11503 2.57698 0.865229 2.6645C0.375621 2.83841 0.4843 3.27057 0.592978 3.27057C0.813604 3.27057 0.961497 3.30858 1.03996 3.38423C1.11836 3.45932 1.15868 3.59289 1.15868 3.78558C1.15868 3.89133 1.1441 4.01021 1.11948 4.13862C1.09367 4.26718 1.06347 4.40415 1.02538 4.54796L0.605329 6.05226C0.569475 6.21027 0.54255 6.35182 0.524623 6.47743C0.507812 6.60309 0.5 6.72592 0.5 6.8465C0.5 7.15518 0.612025 7.40982 0.837197 7.61107C1.06236 7.81295 1.40855 8 1.81404 8C2.07729 8 2.45368 7.90054 2.75845 7.75496L2.75845 7.75494Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                    End Epoch
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingTop: '0px' }}>
                <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                  Size
                </span>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155] bg-[#161921] sticky top-0" style={{ paddingTop: '0px' }}>
                <span className="text-sm font-medium" style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                  Create Time
                </span>
              </div>

              {/* Ligne de données */}
              <div className="px-4 py-3 border-b border-[#334155]" style={{ paddingLeft: '16px' }}>
                <div className="flex items-center gap-2 group">
                  <a 
                    href={`/blob/${blobData.blobId}`}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: '#9cdcfe' }}
                  >
                    {blobData.blobId.length > 12 ? (
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{formatBlobId(blobData.blobId).start}</span>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#9cdcfe' }}></div>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#9cdcfe' }}></div>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#9cdcfe' }}></div>
                        </div>
                        <span className="font-mono">{formatBlobId(blobData.blobId).end}</span>
                      </div>
                    ) : (
                      <span className="font-mono">{blobData.blobId}</span>
                    )}
                  </a>
                  <button
                    onClick={() => copyToClipboard(blobData.blobId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Copy to clipboard"
                    style={{ width: '12px', height: '14px' }}
                  >
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.0003 1.66732V11.0007H10.667C11.0352 11.0007 11.3337 10.7022 11.3337 10.334V1.00065C11.3337 0.632461 11.0352 0.333984 10.667 0.333984H4.00033C3.63214 0.333984 3.33366 0.632461 3.33366 1.00065V1.66732H10.0003ZM2.00033 12.334V4.33398H7.33366V12.334H2.00033ZM0.666992 3.66732C0.666992 3.29913 0.965469 3.00065 1.33366 3.00065H8.00033C8.36852 3.00065 8.66699 3.29913 8.66699 3.66732V13.0007C8.66699 13.3688 8.36851 13.6673 8.00033 13.6673H1.33366C0.965469 13.6673 0.666992 13.3688 0.666992 13.0007V3.66732Z" fill="currentColor" style={{ color: '#9cdcfe' }}/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155]">
                <div className="flex items-center gap-2 group">
                  <a
                    href={`https://suiscan.xyz/mainnet/object/${blobData.suiObjectId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: '#9cdcfe' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M2.71066 14.4716H12.6595C13.0503 14.4716 13.37 14.1519 13.37 13.761V8.076H11.9488V13.0504H3.4212V4.52285H8.3956V3.10156H2.71057C2.31972 3.10156 2 3.42128 2 3.81213V13.7609C1.99988 14.1518 2.31982 14.4716 2.71066 14.4716Z" fill="currentColor"/>
                      <path d="M7.4895 8.00489L8.48435 8.99974L13.0857 4.41617V5.96176H14.507V2H10.5274V3.42116H12.073L7.4895 8.00489Z" fill="currentColor"/>
                    </svg>
                    <span className="font-mono">{formatSuiObjectId(blobData.suiObjectId)}</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(blobData.suiObjectId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Copy to clipboard"
                    style={{ width: '12px', height: '14px' }}
                  >
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.0003 1.66732V11.0007H10.667C11.0352 11.0007 11.3337 10.7022 11.3337 10.334V1.00065C11.3337 0.632461 11.0352 0.333984 10.667 0.333984H4.00033C3.63214 0.333984 3.33366 0.632461 3.33366 1.00065V1.66732H10.0003ZM2.00033 12.334V4.33398H7.33366V12.334H2.00033ZM0.666992 3.66732C0.666992 3.29913 0.965469 3.00065 1.33366 3.00065H8.00033C8.36852 3.00065 8.66699 3.29913 8.66699 3.66732V13.0007C8.66699 13.3688 8.36851 13.6673 8.00033 13.6673H1.33366C0.965469 13.6673 0.666992 13.3688 0.666992 13.0007V3.66732Z" fill="currentColor" style={{ color: '#9cdcfe' }}/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155]">
                <span>{blobData.startEpoch}</span>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155]">
                <span>{blobData.endEpoch}</span>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155]">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{blobData.size.split(' ')[0]}</span>
                  <span className="text-sm opacity-70">{blobData.size.split(' ')[1]}</span>
                </div>
              </div>
              
              <div className="px-4 py-3 border-b border-[#334155]">
                <span>{blobData.createTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique du blob */}
        {blobId && (
          <BlobHistoryGraph
            blobId={blobId}
            events={blobEvents}
            isLoading={isLoadingHistory}
          />
        )}
      </div>
    </div>
  )
}

