// Map des routes aux fichiers markdown
const markdownMap: Record<string, () => Promise<string>> = {
  '/': () => import('../docs/README.md?raw').then(m => m.default),
  
  // Architecture
  '/architecture/overview': () => import('../docs/architecture/overview.md?raw').then(m => m.default),
  '/architecture/components': () => import('../docs/architecture/components.md?raw').then(m => m.default),
  '/architecture/components/data-layer': () => import('../docs/architecture/components/data-layer.md?raw').then(m => m.default),
  '/architecture/components/ai-layer': () => import('../docs/architecture/components/ai-layer.md?raw').then(m => m.default),
  '/architecture/components/onchain-layer': () => import('../docs/architecture/components/onchain-layer.md?raw').then(m => m.default),
  '/architecture/components/dashboard': () => import('../docs/architecture/components/dashboard.md?raw').then(m => m.default),
  '/architecture/data-flow': () => import('../docs/architecture/data-flow.md?raw').then(m => m.default),
  '/architecture/security': () => import('../docs/architecture/security.md?raw').then(m => m.default),
  
  // Data Layer
  '/data-layer/intro': () => import('../docs/data-layer/intro.md?raw').then(m => m.default),
  '/data-layer/manifest': () => import('../docs/data-layer/manifest.md?raw').then(m => m.default),
  '/data-layer/merkle-chain': () => import('../docs/data-layer/merkle-chain.md?raw').then(m => m.default),
  '/data-layer/adaptive-anchoring': () => import('../docs/data-layer/adaptive-anchoring.md?raw').then(m => m.default),
  '/data-layer/storage': () => import('../docs/data-layer/storage.md?raw').then(m => m.default),
  
  // AI Layer
  '/ai-layer/intro': () => import('../docs/ai-layer/intro.md?raw').then(m => m.default),
  '/ai-layer/fingerprints': () => import('../docs/ai-layer/fingerprints.md?raw').then(m => m.default),
  '/ai-layer/divergence-detection': () => import('../docs/ai-layer/divergence-detection.md?raw').then(m => m.default),
  '/ai-layer/integrity-scoring': () => import('../docs/ai-layer/integrity-scoring.md?raw').then(m => m.default),
  '/ai-layer/reputation': () => import('../docs/ai-layer/reputation.md?raw').then(m => m.default),
  '/ai-layer/snapshots': () => import('../docs/ai-layer/snapshots.md?raw').then(m => m.default),
  
  // On-chain
  '/onchain/intro': () => import('../docs/onchain/intro.md?raw').then(m => m.default),
  '/onchain/sui-transactions': () => import('../docs/onchain/sui-transactions.md?raw').then(m => m.default),
  '/onchain/sui-transactions/anchor-epoch': () => import('../docs/onchain/sui-transactions/anchor-epoch.md?raw').then(m => m.default),
  '/onchain/sui-transactions/submit-snapshot': () => import('../docs/onchain/sui-transactions/submit-snapshot.md?raw').then(m => m.default),
  '/onchain/sui-transactions/record-receipt': () => import('../docs/onchain/sui-transactions/record-receipt.md?raw').then(m => m.default),
  '/onchain/smart-contracts': () => import('../docs/onchain/smart-contracts.md?raw').then(m => m.default),
  '/onchain/costs': () => import('../docs/onchain/costs.md?raw').then(m => m.default),
  
  // Dashboard
  '/dashboard/intro': () => import('../docs/dashboard/intro.md?raw').then(m => m.default),
  '/dashboard/installation': () => import('../docs/dashboard/installation.md?raw').then(m => m.default),
  '/dashboard/version-visualization': () => import('../docs/dashboard/version-visualization.md?raw').then(m => m.default),
  '/dashboard/node-monitoring': () => import('../docs/dashboard/node-monitoring.md?raw').then(m => m.default),
  '/dashboard/reproducibility': () => import('../docs/dashboard/reproducibility.md?raw').then(m => m.default),
  '/dashboard/api': () => import('../docs/dashboard/api.md?raw').then(m => m.default),
  
  // Usage
  '/usage/getting-started': () => import('../docs/usage/getting-started.md?raw').then(m => m.default),
  '/usage/installation': () => import('../docs/usage/installation.md?raw').then(m => m.default),
  '/usage/configuration': () => import('../docs/usage/configuration.md?raw').then(m => m.default),
  '/usage/examples': () => import('../docs/usage/examples.md?raw').then(m => m.default),
  '/usage/api-reference': () => import('../docs/usage/api-reference.md?raw').then(m => m.default),
  '/usage/troubleshooting': () => import('../docs/usage/troubleshooting.md?raw').then(m => m.default),
  
  // Dev Guide
  '/dev-guide/technical-architecture': () => import('../docs/dev-guide/technical-architecture.md?raw').then(m => m.default),
  '/dev-guide/module-development': () => import('../docs/dev-guide/module-development.md?raw').then(m => m.default),
  '/dev-guide/testing': () => import('../docs/dev-guide/testing.md?raw').then(m => m.default),
  '/dev-guide/performance': () => import('../docs/dev-guide/performance.md?raw').then(m => m.default),
  
  // Metrics
  '/metrics/performance': () => import('../docs/metrics/performance.md?raw').then(m => m.default),
  '/metrics/validation': () => import('../docs/metrics/validation.md?raw').then(m => m.default),
  '/metrics/alerts': () => import('../docs/metrics/alerts.md?raw').then(m => m.default),
  '/metrics/logging': () => import('../docs/metrics/logging.md?raw').then(m => m.default),
}

export async function loadMarkdown(path: string): Promise<string> {
  // Normaliser le chemin
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path
  const fullPath = normalizedPath || '/'
  
  // Chercher le chemin exact
  if (markdownMap[fullPath]) {
    try {
      return await markdownMap[fullPath]()
    } catch (error) {
      console.error(`Error loading markdown for ${fullPath}:`, error)
      return `# Erreur de chargement\n\nImpossible de charger le contenu pour ${fullPath}.`
    }
  }
  
  // Essayer avec /intro pour les sections
  const introPath = `${normalizedPath}/intro`
  if (markdownMap[introPath]) {
    try {
      return await markdownMap[introPath]()
    } catch (error) {
      console.error(`Error loading markdown for ${introPath}:`, error)
    }
  }
  
  return `# Page non trouvée\n\nCette page n'existe pas encore : ${fullPath}`
}

