export interface RouteItem {
  path: string
  title: string
  children?: RouteItem[]
}

export const routes: RouteItem[] = [
  {
    path: '/',
    title: 'Sirius',
  },
  {
    path: '/architecture',
    title: 'Architecture',
    children: [
      { path: '/architecture/overview', title: 'Vue d\'ensemble' },
      { path: '/architecture/components', title: 'Composants' },
      { path: '/architecture/components/data-layer', title: 'Data Layer' },
      { path: '/architecture/components/ai-layer', title: 'AI Layer' },
      { path: '/architecture/components/onchain-layer', title: 'On-chain Layer' },
      { path: '/architecture/components/dashboard', title: 'Dashboard' },
      { path: '/architecture/data-flow', title: 'Flux de données' },
      { path: '/architecture/security', title: 'Sécurité et propriétés' },
    ],
  },
  {
    path: '/data-layer',
    title: 'Data Layer',
    children: [
      { path: '/data-layer/intro', title: 'Introduction' },
      { path: '/data-layer/manifest', title: 'Manifest et versionnement' },
      { path: '/data-layer/merkle-chain', title: 'Merkle Chain' },
      { path: '/data-layer/adaptive-anchoring', title: 'Ancrage adaptatif' },
      { path: '/data-layer/storage', title: 'Stockage Ceramic/IPLD' },
    ],
  },
  {
    path: '/ai-layer',
    title: 'AI Layer',
    children: [
      { path: '/ai-layer/intro', title: 'Introduction' },
      { path: '/ai-layer/fingerprints', title: 'Fingerprints et surveillance' },
      { path: '/ai-layer/divergence-detection', title: 'Détection de divergences' },
      { path: '/ai-layer/integrity-scoring', title: 'Scoring d\'intégrité' },
      { path: '/ai-layer/reputation', title: 'Réputation des nœuds' },
      { path: '/ai-layer/snapshots', title: 'Snapshots et consensus' },
    ],
  },
  {
    path: '/onchain',
    title: 'On-chain',
    children: [
      { path: '/onchain/intro', title: 'Introduction' },
      { path: '/onchain/sui-transactions', title: 'Transactions Sui' },
      { path: '/onchain/sui-transactions/anchor-epoch', title: 'anchor_epoch' },
      { path: '/onchain/sui-transactions/submit-snapshot', title: 'submit_snapshot' },
      { path: '/onchain/sui-transactions/record-receipt', title: 'record_receipt' },
      { path: '/onchain/smart-contracts', title: 'Smart Contracts' },
      { path: '/onchain/costs', title: 'Coûts et optimisation' },
    ],
  },
  {
    path: '/dashboard',
    title: 'Dashboard',
    children: [
      { path: '/dashboard/intro', title: 'Introduction' },
      { path: '/dashboard/installation', title: 'Installation' },
      { path: '/dashboard/version-visualization', title: 'Visualisation des versions' },
      { path: '/dashboard/node-monitoring', title: 'Monitoring des nœuds' },
      { path: '/dashboard/reproducibility', title: 'Reproducibility receipts' },
      { path: '/dashboard/api', title: 'API' },
    ],
  },
  {
    path: '/usage',
    title: 'Usage',
    children: [
      { path: '/usage/getting-started', title: 'Getting started' },
      { path: '/usage/installation', title: 'Installation' },
      { path: '/usage/configuration', title: 'Configuration' },
      { path: '/usage/examples', title: 'Exemples d\'utilisation' },
      { path: '/usage/api-reference', title: 'API Reference' },
      { path: '/usage/troubleshooting', title: 'Troubleshooting' },
    ],
  },
  {
    path: '/dev-guide',
    title: 'Developer Guide',
    children: [
      { path: '/dev-guide/technical-architecture', title: 'Architecture technique' },
      { path: '/dev-guide/module-development', title: 'Développement de modules' },
      { path: '/dev-guide/testing', title: 'Tests' },
      { path: '/dev-guide/performance', title: 'Performance' },
    ],
  },
  {
    path: '/metrics',
    title: 'Metrics & Monitoring',
    children: [
      { path: '/metrics/performance', title: 'Indicateurs de performance' },
      { path: '/metrics/validation', title: 'Validation' },
      { path: '/metrics/alerts', title: 'Alertes' },
      { path: '/metrics/logging', title: 'Logging' },
    ],
  },
]

