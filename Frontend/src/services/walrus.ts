import { api } from './api'

export interface WalrusStats {
  totalBlobs: string
  averageIntegrityScore: string
  totalVersions: string
  activeNodes: string
  averageAnchorTime: string
  dailyBlobs: string
}

export interface DailyTransaction {
  date: string
  count: number
}

/**
 * Récupère les statistiques globales de Walrus
 * TODO: Remplacer par l'endpoint réel de l'API Walrus
 */
export async function getWalrusStats(): Promise<WalrusStats> {
  try {
    // TODO: Remplacer par l'endpoint réel
    // const data = await api.get<WalrusStats>('/v1/stats')
    // return data
    
    // Pour l'instant, on retourne des données simulées
    // En production, décommenter la ligne ci-dessus et supprimer ce bloc
    return {
      totalBlobs: '2,847,392',
      averageIntegrityScore: '98.7%',
      totalVersions: '12,008,114',
      activeNodes: '1,234',
      averageAnchorTime: '2.3s',
      dailyBlobs: '1.06M'
    }
  } catch (error) {
    console.error('Error fetching Walrus stats:', error)
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      totalBlobs: '0',
      averageIntegrityScore: '0%',
      totalVersions: '0',
      activeNodes: '0',
      averageAnchorTime: '0s',
      dailyBlobs: '0'
    }
  }
}

/**
 * Récupère les transactions quotidiennes pour le graphique
 * TODO: Remplacer par l'endpoint réel de l'API Walrus
 */
export async function getDailyTransactions(): Promise<DailyTransaction[]> {
  try {
    // TODO: Remplacer par l'endpoint réel
    // const data = await api.get<DailyTransaction[]>('/v1/stats/daily-transactions')
    // return data
    
    // Pour l'instant, on retourne des données simulées basées sur le graphique fourni
    // Les données correspondent aux points du path SVG fourni
    const now = new Date()
    const transactions: DailyTransaction[] = []
    
    // Générer 30 jours de données basées sur la courbe du graphique
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Valeurs basées sur la courbe du graphique (normalisées entre 0 et 100)
      const normalizedValue = getNormalizedValueForDay(29 - i)
      // Convertir en nombre de transactions (exemple: 500K à 1.5M)
      const count = Math.round(500000 + (normalizedValue / 100) * 1000000)
      
      transactions.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }
    
    return transactions
  } catch (error) {
    console.error('Error fetching daily transactions:', error)
    return []
  }
}

/**
 * Calcule la valeur normalisée pour un jour donné basée sur la courbe du graphique
 * Les valeurs sont extraites du path SVG fourni
 */
function getNormalizedValueForDay(dayIndex: number): number {
  // Points de la courbe extraits du path SVG (normalisés entre 0-100)
  const curvePoints = [
    15.18, 17.82, 20.45, 29.60, 38.75, 70.08, 70.08, 61.52, 61.52, 63.49,
    65.98, 76.50, 76.50, 75.11, 75.11, 78.12, 78.12, 75.28, 75.23, 75.16,
    75.16, 76.30, 76.30, 73.16, 73.16, 75.02, 75.02, 72.84, 72.84, 73.54
  ]
  
  // Interpoler entre les points pour avoir 30 valeurs
  const step = curvePoints.length / 30
  const index = Math.floor(dayIndex * step)
  const nextIndex = Math.min(index + 1, curvePoints.length - 1)
  const ratio = (dayIndex * step) - index
  
  if (index >= curvePoints.length - 1) {
    return curvePoints[curvePoints.length - 1]
  }
  
  return curvePoints[index] + (curvePoints[nextIndex] - curvePoints[index]) * ratio
}

/**
 * Génère le path SVG pour le graphique basé sur les données de transactions
 * Utilise le format exact du path fourni avec courbes de Bézier
 */
export function generateChartPath(transactions: DailyTransaction[], width: number, height: number): string {
  if (transactions.length === 0) {
    // Path par défaut basé sur l'exemple fourni
    return "M0,15.181464C10.243678301230245,17.81537133333333,20.487356602460487,20.44927866666666,30.731034903690734,29.598471999999994C40.97471320492098,38.74766533333333,51.21839150615122,70.076624,61.46206980738147,70.076624C71.70574810861171,70.076624,81.94942640984195,61.522344000000004,92.1931047110722,61.522344000000004C102.43678301230244,61.522344000000004,112.68046131353269,63.48646533333333,122.92413961476294,65.982664C133.16781791599317,68.47886266666667,143.41149621722343,76.499536,153.65517451845366,76.499536C163.8988528196839,76.499536,174.14253112091416,75.107448,184.3862094221444,75.107448C194.62988772337465,75.107448,204.87356602460488,78.11773600000001,215.11724432583514,78.11773600000001C225.36092262706538,78.11773600000001,235.60460092829564,75.28299733333334,245.84827922952587,75.233744C256.09195753075613,75.18449066666666,266.33563583198634,75.159864,276.5793141332166,75.159864C286.82299243444686,75.159864,297.06667073567706,76.300616,307.3103490369073,76.300616C317.5540273381376,76.300616,327.7977056393678,73.163872,338.04138394059805,73.163872C348.2850622418283,73.163872,358.5287405430585,75.019136,368.7724188442888,75.019136C379.01609714551904,75.019136,389.25977544674925,72.844912,399.5034537479795,72.844912C409.74713204920977,72.844912,419.99081035044003,73.544848,430.2344886516703,73.544848C440.47816695290055,73.544848,450.72184525413076,72.736896,460.965523555361,72.736896C471.2092018565913,72.736896,481.4528801578215,72.978096,491.69655845905174,72.978096C501.94023676028195,72.978096,512.1839150615122,72.843296,522.4275933627424,72.843296C532.6712716639727,72.843296,542.9149499652029,74.17731733333335,553.1586282664332,74.49022400000001C563.4023065676635,74.80313066666668,573.6459848688936,74.959584,583.8896631701239,74.959584C594.1333414713541,74.959584,604.3770197725844,74.808368,614.6206980738147,74.505936C624.8643763750449,74.20350400000001,635.1080546762752,70.505528,645.3517329775054,70.465688C655.5954112787357,70.425848,665.8390895799658,70.405928,676.0827678811961,70.405928C686.3264461824264,70.405928,696.5701244836566,74.292896,706.8138027848869,74.292896C717.0574810861171,74.292896,727.3011593873473,70.706136,737.5448376885776,70.706136C747.7885159898078,70.706136,758.032194291038,71.96196400000001,768.2758725922682,72.578584C778.5195508934985,73.195204,788.7632291947288,74.405856,799.006907495959,74.405856C809.2505857971893,74.405856,819.4942640984195,73.817488,829.7379423996498,73.403992C839.9816207008801,72.99049600000001,850.2252990021103,72.19214933333333,860.4689773033406,71.92488C870.7126556045708,71.65761066666667,880.956333905801,71.59079333333334,891.2000122070312,71.523976"
  }
  
  const maxCount = Math.max(...transactions.map(t => t.count))
  const minCount = Math.min(...transactions.map(t => t.count))
  const range = maxCount - minCount || 1
  
  // Normaliser les valeurs et créer les points
  const normalizedPoints = transactions.map((transaction, index) => {
    const normalizedValue = ((transaction.count - minCount) / range) * 100
    // Inverser Y car SVG commence en haut (0 = haut, height = bas)
    const y = height - (normalizedValue / 100) * height
    return { x: (index / (transactions.length - 1)) * width, y }
  })
  
  // Créer un path avec courbes de Bézier cubiques pour une ligne lisse
  // Format: M x,y C x1,y1 x2,y2 x,y (pour chaque segment)
  let path = `M ${normalizedPoints[0].x},${normalizedPoints[0].y}`
  
  for (let i = 1; i < normalizedPoints.length; i++) {
    const prev = normalizedPoints[i - 1]
    const curr = normalizedPoints[i]
    const next = normalizedPoints[i + 1] || curr
    
    // Points de contrôle pour une courbe lisse (courbe de Bézier cubique)
    const dx = (curr.x - prev.x) / 3
    const cp1x = prev.x + dx
    const cp1y = prev.y
    const cp2x = curr.x - (next.x - curr.x) / 3
    const cp2y = curr.y
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
  }
  
  return path
}

/**
 * Génère le path pour la zone remplie sous la courbe
 */
export function generateAreaPath(transactions: DailyTransaction[], width: number, height: number): string {
  const linePath = generateChartPath(transactions, width, height)
  if (!linePath) {
    // Path par défaut basé sur l'exemple fourni
    return "M0,15.181464C10.243678301230245,17.81537133333333,20.487356602460487,20.44927866666666,30.731034903690734,29.598471999999994C40.97471320492098,38.74766533333333,51.21839150615122,70.076624,61.46206980738147,70.076624C71.70574810861171,70.076624,81.94942640984195,61.522344000000004,92.1931047110722,61.522344000000004C102.43678301230244,61.522344000000004,112.68046131353269,63.48646533333333,122.92413961476294,65.982664C133.16781791599317,68.47886266666667,143.41149621722343,76.499536,153.65517451845366,76.499536C163.8988528196839,76.499536,174.14253112091416,75.107448,184.3862094221444,75.107448C194.62988772337465,75.107448,204.87356602460488,78.11773600000001,215.11724432583514,78.11773600000001C225.36092262706538,78.11773600000001,235.60460092829564,75.28299733333334,245.84827922952587,75.233744C256.09195753075613,75.18449066666666,266.33563583198634,75.159864,276.5793141332166,75.159864C286.82299243444686,75.159864,297.06667073567706,76.300616,307.3103490369073,76.300616C317.5540273381376,76.300616,327.7977056393678,73.163872,338.04138394059805,73.163872C348.2850622418283,73.163872,358.5287405430585,75.019136,368.7724188442888,75.019136C379.01609714551904,75.019136,389.25977544674925,72.844912,399.5034537479795,72.844912C409.74713204920977,72.844912,419.99081035044003,73.544848,430.2344886516703,73.544848C440.47816695290055,73.544848,450.72184525413076,72.736896,460.965523555361,72.736896C471.2092018565913,72.736896,481.4528801578215,72.978096,491.69655845905174,72.978096C501.94023676028195,72.978096,512.1839150615122,72.843296,522.4275933627424,72.843296C532.6712716639727,72.843296,542.9149499652029,74.17731733333335,553.1586282664332,74.49022400000001C563.4023065676635,74.80313066666668,573.6459848688936,74.959584,583.8896631701239,74.959584C594.1333414713541,74.959584,604.3770197725844,74.808368,614.6206980738147,74.505936C624.8643763750449,74.20350400000001,635.1080546762752,70.505528,645.3517329775054,70.465688C655.5954112787357,70.425848,665.8390895799658,70.405928,676.0827678811961,70.405928C686.3264461824264,70.405928,696.5701244836566,74.292896,706.8138027848869,74.292896C717.0574810861171,74.292896,727.3011593873473,70.706136,737.5448376885776,70.706136C747.7885159898078,70.706136,758.032194291038,71.96196400000001,768.2758725922682,72.578584C778.5195508934985,73.195204,788.7632291947288,74.405856,799.006907495959,74.405856C809.2505857971893,74.405856,819.4942640984195,73.817488,829.7379423996498,73.403992C839.9816207008801,72.99049600000001,850.2252990021103,72.19214933333333,860.4689773033406,71.92488C870.7126556045708,71.65761066666667,880.956333905801,71.59079333333334,891.2000122070312,71.523976L891.2000122070312,80C880.956333905801,80,870.7126556045708,80,860.4689773033406,80C850.2252990021103,80,839.9816207008801,80,829.7379423996498,80C819.4942640984195,80,809.2505857971893,80,799.006907495959,80C788.7632291947288,80,778.5195508934985,80,768.2758725922682,80C758.032194291038,80,747.7885159898078,80,737.5448376885776,80C727.3011593873473,80,717.0574810861171,80,706.8138027848869,80C696.5701244836566,80,686.3264461824264,80,676.0827678811961,80C665.8390895799658,80,655.5954112787357,80,645.3517329775054,80C635.1080546762752,80,624.8643763750449,80,614.6206980738147,80C604.3770197725844,80,594.1333414713541,80,583.8896631701239,80C573.6459848688936,80,563.4023065676635,80,553.1586282664332,80C542.9149499652029,80,532.6712716639727,80,522.4275933627424,80C512.1839150615122,80,501.94023676028195,80,491.69655845905174,80C481.4528801578215,80,471.2092018565913,80,460.965523555361,80C450.72184525413076,80,440.47816695290055,80,430.2344886516703,80C419.99081035044003,80,409.74713204920977,80,399.5034537479795,80C389.25977544674925,80,379.01609714551904,80,368.7724188442888,80C358.5287405430585,80,348.2850622418283,80,338.04138394059805,80C327.7977056393678,80,317.5540273381376,80,307.3103490369073,80C297.06667073567706,80,286.82299243444686,80,276.5793141332166,80C266.33563583198634,80,256.09195753075613,80,245.84827922952587,80C235.60460092829564,80,225.36092262706538,80,215.11724432583514,80C204.87356602460488,80,194.62988772337465,80,184.3862094221444,80C174.14253112091416,80,163.8988528196839,80,153.65517451845366,80C143.41149621722343,80,133.16781791599317,80,122.92413961476294,80C112.68046131353269,80,102.43678301230244,80,92.1931047110722,80C81.94942640984195,80,71.70574810861171,80,61.46206980738147,80C51.21839150615122,80,40.97471320492098,80,30.731034903690734,80C20.487356602460487,80,10.243678301230245,80,0,80Z"
  }
  
  // Fermer le path en ajoutant les lignes vers le bas
  return `${linePath} L ${width},${height} L 0,${height} Z`
}

/**
 * Types pour l'historique du blob
 */
export interface BlobEventMetadata {
  transactionId?: string
  nodeId?: string
  integrityScore?: number
  changes?: string[]
  epoch?: number
}

export type BlobEventType = 'creation' | 'modification' | 'anomaly' | 'anchor' | 'deletion' | 'other'

export interface BlobEvent {
  id: string
  timestamp: Date
  type: BlobEventType
  description: string
  blobHash: string
  metadata?: BlobEventMetadata
}

// Variable globale pour simuler l'état du blob (en production, cela sera géré par l'API)
let simulatedEventCounter = 4
let lastSimulatedEventTime = new Date('2024-11-17T11:25:18').getTime()

/**
 * Récupère l'historique des événements d'un blob
 * TODO: Remplacer par l'endpoint réel de l'API Walrus
 * @param blobId L'ID du blob
 * @param lastEventId Optionnel: ID du dernier événement connu pour ne récupérer que les nouveaux
 */
export async function getBlobHistory(blobId: string, lastEventId?: string): Promise<BlobEvent[]> {
  try {
    // TODO: Remplacer par l'endpoint réel
    // const params = lastEventId ? `?since=${lastEventId}` : ''
    // const data = await api.get<BlobEvent[]>(`/v1/blobs/${blobId}/history${params}`)
    // return data.map(event => ({
    //   ...event,
    //   timestamp: new Date(event.timestamp)
    // }))
    
    // Pour l'instant, on retourne des données simulées
    // En production, décommenter les lignes ci-dessus et supprimer ce bloc
    const baseEvents: BlobEvent[] = [
      {
        id: '1',
        timestamp: new Date('2024-11-15T14:32:10'),
        type: 'creation',
        description: 'Blob created by node node_abc123',
        blobHash: '0x7f3e8a2f9c4d5678abcd1234ef56789092ac',
        metadata: {
          nodeId: 'node_abc123'
        }
      },
      {
        id: '2',
        timestamp: new Date('2024-11-16T09:15:43'),
        type: 'modification',
        description: 'Metadata updated (fields: author, version)',
        blobHash: '0x8a2f7e3d9c4b5678abcd1234ef56789003bd',
        metadata: {
          changes: ['author', 'version']
        }
      },
      {
        id: '3',
        timestamp: new Date('2024-11-17T11:22:05'),
        type: 'anomaly',
        description: 'Divergence detected between nodes (risk_score: 0.73)',
        blobHash: '0x8a2f7e3d9c4b5678abcd1234ef56789003bd',
        metadata: {
          integrityScore: 0.73
        }
      },
      {
        id: '4',
        timestamp: new Date('2024-11-17T11:25:18'),
        type: 'anchor',
        description: 'Version anchored on Sui (epoch 142)',
        blobHash: '0x8a2f7e3d9c4b5678abcd1234ef56789003bd',
        metadata: {
          transactionId: '0x9c4d7e2a8b3f1c5d6e7a8b9c0d1e2f3a4b5c6d',
          epoch: 142
        }
      }
    ]

    // Simuler l'ajout de nouveaux événements au fil du temps
    // En production, cela sera géré par l'API
    const now = Date.now()
    const timeSinceLastEvent = now - lastSimulatedEventTime
    
    // Simuler un nouvel événement toutes les 10-15 secondes (pour la démo)
    if (timeSinceLastEvent > 10000) {
      simulatedEventCounter++
      const eventTypes: BlobEventType[] = ['modification', 'anchor', 'anomaly']
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      
      const newEvent: BlobEvent = {
        id: String(simulatedEventCounter),
        timestamp: new Date(now),
        type: randomType,
        description: randomType === 'modification' 
          ? 'Automatic update detected'
          : randomType === 'anchor'
          ? `New anchor on Sui (epoch ${142 + simulatedEventCounter - 4})`
          : 'New divergence detected',
        blobHash: '0x8a2f7e3d9c4b5678abcd1234ef56789003bd',
        metadata: randomType === 'anchor' 
          ? {
              transactionId: `0x${Math.random().toString(16).substring(2, 34)}`,
              epoch: 142 + simulatedEventCounter - 4
            }
          : {
              nodeId: `node_${Math.random().toString(36).substring(2, 8)}`
            }
      }
      baseEvents.push(newEvent)
      lastSimulatedEventTime = now
    }

    // Si lastEventId est fourni, retourner uniquement les nouveaux événements
    if (lastEventId) {
      const lastIndex = baseEvents.findIndex(e => e.id === lastEventId)
      return lastIndex >= 0 ? baseEvents.slice(lastIndex + 1) : []
    }

    return baseEvents
  } catch (error) {
    console.error('Error fetching blob history:', error)
    return []
  }
}

