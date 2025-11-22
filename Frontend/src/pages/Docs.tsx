import contentImage from '@/assets/png/content.png'
import DocsSidebar from '@/components/DocsSidebar'
import './Docs.css'

export default function Docs() {
  return (
    <div className="bg-[#161923] min-h-full text-white docs-page" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="docs-layout">
        <DocsSidebar />
        <div className="docs-content">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Main Title Section */}
        <div className="mb-12">
          <h1 id="sirius" className="font-bold mb-6 text-white" style={{ fontSize: '3.5rem', lineHeight: '4rem', letterSpacing: '0px' }}>
            Sirius
          </h1>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            Welcome to the developer documentation for Sirius, a layer of observability, governance, and attestation for distributed storage systems. Sirius focuses on providing cryptographic guarantees for data integrity, versioning, and AI reproducibility while ensuring high availability and reliability.
          </p>
        </div>

        {/* Content Image */}
        <div className="mb-12">
          <img 
            src={contentImage} 
            alt="Sirius Content" 
            className="w-full h-auto rounded-lg"
          />
        </div>

        {/* Fun fact Section */}
        <div className="p-6 md:p-8 my-8 rounded" role="note" style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)', borderLeft: '4px solid #10B981' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5" style={{ width: '1rem' }}>
              <svg 
                width="11" 
                height="14" 
                viewBox="0 0 11 14" 
                fill="currentColor" 
                xmlns="http://www.w3.org/2000/svg" 
                className="text-emerald-600 dark:text-emerald-400/80" 
                style={{ width: '0.875rem', height: 'auto' }}
                aria-label="Tip"
              >
                <path d="M3.12794 12.4232C3.12794 12.5954 3.1776 12.7634 3.27244 12.907L3.74114 13.6095C3.88471 13.8248 4.21067 14 4.46964 14H6.15606C6.41415 14 6.74017 13.825 6.88373 13.6095L7.3508 12.9073C7.43114 12.7859 7.49705 12.569 7.49705 12.4232L7.50055 11.3513H3.12521L3.12794 12.4232ZM5.31288 0C2.52414 0.00875889 0.5 2.26889 0.5 4.78826C0.5 6.00188 0.949566 7.10829 1.69119 7.95492C2.14321 8.47011 2.84901 9.54727 3.11919 10.4557C3.12005 10.4625 3.12175 10.4698 3.12261 10.4771H7.50342C7.50427 10.4698 7.50598 10.463 7.50684 10.4557C7.77688 9.54727 8.48281 8.47011 8.93484 7.95492C9.67728 7.13181 10.1258 6.02703 10.1258 4.78826C10.1258 2.15486 7.9709 0.000106649 5.31288 0ZM7.94902 7.11267C7.52078 7.60079 6.99082 8.37878 6.6077 9.18794H4.02051C3.63739 8.37878 3.10743 7.60079 2.67947 7.11294C2.11997 6.47551 1.8126 5.63599 1.8126 4.78826C1.8126 3.09829 3.12794 1.31944 5.28827 1.3126C7.2435 1.3126 8.81315 2.88226 8.81315 4.78826C8.81315 5.63599 8.50688 6.47551 7.94902 7.11267ZM4.87534 2.18767C3.66939 2.18767 2.68767 3.16939 2.68767 4.37534C2.68767 4.61719 2.88336 4.81288 3.12521 4.81288C3.36705 4.81288 3.56274 4.61599 3.56274 4.37534C3.56274 3.6515 4.1515 3.06274 4.87534 3.06274C5.11719 3.06274 5.31288 2.86727 5.31288 2.62548C5.31288 2.38369 5.11599 2.18767 4.87534 2.18767Z"></path>
              </svg>
            </div>
            <div className="flex-1" style={{ color: '#ECFDF5' }}>
              <h2 className="font-bold mb-3" style={{ fontSize: '1.25rem', lineHeight: '1.625rem', letterSpacing: '0px', color: '#ECFDF5' }}>Fun fact</h2>
              <p style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px', color: '#ECFDF5' }}>
                Sirius is designed to work seamlessly with existing distributed storage systems like Walrus, adding trust and traceability layers without modifying the underlying protocols.
              </p>
            </div>
          </div>
        </div>

        {/* The Problem Section */}
        <div className="mt-12 mb-8">
          <h2 id="the-problem" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            The Problem
          </h2>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            Distributed storage systems like Walrus guarantee that data exists and can be retrieved, but they do not guarantee that data is:
          </p>
          <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li>
              <span className="font-medium">Authentic</span> — free from tampering
            </li>
            <li>
              <span className="font-medium">Consistent</span> — the same across all nodes
            </li>
            <li>
              <span className="font-medium">Traceable</span> — with a verifiable history of changes
            </li>
          </ul>
        </div>

        {/* Our Solution Section */}
        <div className="mt-12 mb-8">
          <h2 id="our-solution" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            Our Solution
          </h2>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            Sirius addresses these gaps by introducing an intelligent overlay that:
          </p>
          <ol className="space-y-2 text-gray-300 list-decimal list-inside ml-4 mb-6" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li>
              Monitors versions and detects divergences between nodes
            </li>
            <li>
              Automatically canonizes the valid version via adaptive anchors on the Sui blockchain
            </li>
            <li>
              Produces AI reproducibility proofs when a model uses a dataset
            </li>
          </ol>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            In other words, Sirius transforms distributed storage into a verifiable trust and traceability platform, where each dataset has:
          </p>
          <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4 mb-6" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li>• A cryptographic identity</li>
            <li>• A complete evolution history</li>
            <li>• AI attestations guaranteeing its integrity</li>
          </ul>
          <p className="text-gray-300" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            The solution remains compatible with existing storage infrastructure, without modifying the underlying protocol.
          </p>
        </div>

        {/* Architecture Section */}
        <div className="mt-12 mb-8">
          <h2 id="architecture" className="font-bold mb-8 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            Architecture
          </h2>
          
          {/* Architecture Diagram */}
          <div className="mb-10 bg-[#0f172a] border border-[#334155] rounded-lg p-6">
            <svg viewBox="0 0 800 400" className="w-full h-auto">
              {/* Background */}
              <rect width="800" height="400" fill="#0f172a" />
              
              {/* Data Layer */}
              <rect x="50" y="50" width="150" height="80" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="8" />
              <text x="125" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="16" fontWeight="bold">Data Layer</text>
              <text x="125" y="105" textAnchor="middle" fill="#9cdcfe" fontSize="12">Integrity &amp; Versioning</text>
              
              {/* AI Layer */}
              <rect x="250" y="50" width="150" height="80" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="8" />
              <text x="325" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="16" fontWeight="bold">AI Layer</text>
              <text x="325" y="105" textAnchor="middle" fill="#9cdcfe" fontSize="12">Surveillance &amp; Governance</text>
              
              {/* Blockchain Layer */}
              <rect x="450" y="50" width="150" height="80" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="8" />
              <text x="525" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="16" fontWeight="bold">Blockchain</text>
              <text x="525" y="105" textAnchor="middle" fill="#9cdcfe" fontSize="12">On-chain Anchoring</text>
              
              {/* Dashboard */}
              <rect x="650" y="50" width="100" height="80" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="8" />
              <text x="700" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="16" fontWeight="bold">Dashboard</text>
              <text x="700" y="105" textAnchor="middle" fill="#9cdcfe" fontSize="12">User Interface</text>
              
              {/* Arrows */}
              <path d="M 200 90 L 250 90" stroke="#97F0E5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
              <path d="M 400 90 L 450 90" stroke="#97F0E5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
              <path d="M 600 90 L 650 90" stroke="#97F0E5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
              
              {/* Arrow marker */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#97F0E5" />
                </marker>
              </defs>
              
              {/* Storage Nodes */}
              <rect x="50" y="200" width="700" height="60" fill="#2d4a2d" stroke="#4ade80" strokeWidth="2" rx="8" opacity="0.3" />
              <text x="400" y="235" textAnchor="middle" fill="#86efac" fontSize="14" fontWeight="bold">Distributed Storage System (Walrus)</text>
              
              {/* Data flow */}
              <path d="M 125 130 L 125 200" stroke="#97F0E5" strokeWidth="2" fill="none" strokeDasharray="5,5" />
              <path d="M 325 130 L 325 200" stroke="#97F0E5" strokeWidth="2" fill="none" strokeDasharray="5,5" />
              <path d="M 525 130 L 525 200" stroke="#97F0E5" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            </svg>
          </div>

          {/* Data Layer Section */}
          <div className="mb-10">
            <h3 id="data-layer" className="font-bold mb-6 text-white" style={{ fontSize: '1.125rem', lineHeight: '1.5rem', letterSpacing: '0px' }}>
              1. Data Layer (Integrity and Versioning)
            </h3>
            <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4 mb-4" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
              <li>
                Groups files into an ordered manifest (list of <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">blob_id</code> + metadata)
              </li>
              <li>
                Calculates a global fingerprint (Merkle root) of this manifest
              </li>
              <li>
                Links each version to the previous one (<code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">parent_root</code>) to build a version chain (Merkle-chain)
              </li>
              <li>
                Version commits are signed and can be stored in Ceramic/IPLD for fast reading
              </li>
              <li>
                Every N minutes (epoch) or in case of an alert, a Merkle-of-Merkle anchor is published on the Sui blockchain, freezing a dataset state
              </li>
            </ul>
            <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
              <span className="font-bold">Goal:</span> obtain, for each dataset, an immutable identity and verifiable history without gas overhead.
            </p>
            
            {/* Versioning Diagram */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6 mb-6">
              <h4 className="text-white font-bold mb-4" style={{ fontSize: '1rem' }}>Version Chain (Merkle Chain)</h4>
              <svg viewBox="0 0 700 300" className="w-full h-auto">
                {/* Version 1 */}
                <rect x="50" y="50" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="110" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">Version 1</text>
                <text x="110" y="95" textAnchor="middle" fill="#9cdcfe" fontSize="10">root: abc123</text>
                
                {/* Version 2 */}
                <rect x="250" y="50" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="310" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">Version 2</text>
                <text x="310" y="95" textAnchor="middle" fill="#9cdcfe" fontSize="10">parent: abc123</text>
                <text x="310" y="108" textAnchor="middle" fill="#9cdcfe" fontSize="10">root: def456</text>
                
                {/* Version 3 */}
                <rect x="450" y="50" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="510" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">Version 3</text>
                <text x="510" y="95" textAnchor="middle" fill="#9cdcfe" fontSize="10">parent: def456</text>
                <text x="510" y="108" textAnchor="middle" fill="#9cdcfe" fontSize="10">root: ghi789</text>
                
                {/* Arrows */}
                <path d="M 170 80 L 250 80" stroke="#97F0E5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead2)" />
                <path d="M 370 80 L 450 80" stroke="#97F0E5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead2)" />
                
                {/* Arrow marker */}
                <defs>
                  <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#97F0E5" />
                  </marker>
                </defs>
                
                {/* Merkle Tree representation */}
                <text x="350" y="180" textAnchor="middle" fill="#86efac" fontSize="14" fontWeight="bold">Merkle Root (Fingerprint)</text>
                <rect x="300" y="200" width="100" height="40" fill="#2d4a2d" stroke="#4ade80" strokeWidth="2" rx="6" />
                <text x="350" y="225" textAnchor="middle" fill="#86efac" fontSize="12">Hash(blob_ids)</text>
                
                {/* Connection to blockchain */}
                <path d="M 350 240 L 350 280" stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="3,3" />
                <text x="400" y="265" textAnchor="middle" fill="#fbbf24" fontSize="12">Anchored on Sui</text>
              </svg>
            </div>
          </div>

          {/* AI Layer Section */}
          <div className="mb-10">
            <h3 id="ai-layer" className="font-bold mb-6 text-white" style={{ fontSize: '1.125rem', lineHeight: '1.5rem', letterSpacing: '0px' }}>
              2. AI Layer (Surveillance and Governance)
            </h3>
            <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4 mb-6" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
              <li>
                Collects lightweight fingerprints (statistical summaries, MinHash, Bloom Filter, quantized embeddings) generated by storage nodes or lightweight probes
              </li>
              <li>
                Analyzes inter-node consistency: if fingerprints diverge, the model evaluates a <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">risk_score</code>
              </li>
              <li>
                If this score exceeds a threshold, the AI automatically triggers an adaptive anchor of the new version
              </li>
              <li>
                The AI also calculates an <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">integrity_score</code> for each node and a dynamic reputation score (weighted moving average of past behaviors)
              </li>
              <li>
                This information is recorded in a global snapshot for audit
              </li>
            </ul>
            
            {/* AI Monitoring Flow Diagram */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
              <h4 className="text-white font-bold mb-4" style={{ fontSize: '1rem' }}>AI Monitoring Flow</h4>
              <svg viewBox="0 0 700 250" className="w-full h-auto">
                {/* Storage Nodes */}
                <circle cx="100" cy="80" r="30" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" />
                <text x="100" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="12" fontWeight="bold">Node 1</text>
                
                <circle cx="250" cy="80" r="30" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" />
                <text x="250" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="12" fontWeight="bold">Node 2</text>
                
                <circle cx="400" cy="80" r="30" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" />
                <text x="400" y="85" textAnchor="middle" fill="#9cdcfe" fontSize="12" fontWeight="bold">Node 3</text>
                
                {/* Fingerprints */}
                <text x="100" y="130" textAnchor="middle" fill="#86efac" fontSize="10">Fingerprint 1</text>
                <text x="250" y="130" textAnchor="middle" fill="#86efac" fontSize="10">Fingerprint 2</text>
                <text x="400" y="130" textAnchor="middle" fill="#86efac" fontSize="10">Fingerprint 3</text>
                
                {/* Arrows to AI */}
                <path d="M 100 150 L 250 180" stroke="#97F0E5" strokeWidth="2" fill="none" />
                <path d="M 250 150 L 250 180" stroke="#97F0E5" strokeWidth="2" fill="none" />
                <path d="M 400 150 L 250 180" stroke="#97F0E5" strokeWidth="2" fill="none" />
                
                {/* AI Analyzer */}
                <rect x="200" y="180" width="100" height="50" fill="#2d4a2d" stroke="#4ade80" strokeWidth="2" rx="6" />
                <text x="250" y="200" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="bold">AI Analyzer</text>
                <text x="250" y="215" textAnchor="middle" fill="#86efac" fontSize="10">risk_score</text>
                <text x="250" y="225" textAnchor="middle" fill="#86efac" fontSize="10">integrity_score</text>
                
                {/* Decision */}
                <path d="M 250 230 L 250 250" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#arrowhead3)" />
                <text x="300" y="245" textAnchor="middle" fill="#fbbf24" fontSize="11">If risk &gt; threshold</text>
                <text x="300" y="260" textAnchor="middle" fill="#fbbf24" fontSize="11">→ Trigger Anchor</text>
                
                <defs>
                  <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#fbbf24" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* On-chain Anchoring Section */}
          <div className="mb-10">
            <h3 id="on-chain-anchoring" className="font-bold mb-6 text-white" style={{ fontSize: '1.125rem', lineHeight: '1.5rem', letterSpacing: '0px' }}>
              3. On-chain Anchoring (Blockchain Layer)
            </h3>
            <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
              On the Sui blockchain, three types of transactions are used:
            </p>
            <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4 mb-6" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
              <li>
                <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">anchor_epoch</code> — publishes the Merkle root of a batch of commits (batched epochs)
              </li>
              <li>
                <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">submit_snapshot</code> — records inter-node consistency (k-of-n signatures, average of <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">integrity_scores</code>)
              </li>
              <li>
                <code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">record_receipt</code> — records AI reproducibility receipts (link between a model, a dataset, a version and its performance)
              </li>
            </ul>
            <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
              These anchors are public, consultable by any actor and form the basis of cryptographic verification of the system.
            </p>
            
            {/* Blockchain Transactions Diagram */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
              <h4 className="text-white font-bold mb-4" style={{ fontSize: '1rem' }}>Sui Blockchain Transactions</h4>
              <svg viewBox="0 0 700 200" className="w-full h-auto">
                {/* anchor_epoch */}
                <rect x="50" y="30" width="180" height="50" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="140" y="50" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">anchor_epoch</text>
                <text x="140" y="68" textAnchor="middle" fill="#9cdcfe" fontSize="11">Merkle root of commits</text>
                
                {/* submit_snapshot */}
                <rect x="260" y="30" width="180" height="50" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="350" y="50" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">submit_snapshot</text>
                <text x="350" y="68" textAnchor="middle" fill="#9cdcfe" fontSize="11">Inter-node consistency</text>
                
                {/* record_receipt */}
                <rect x="470" y="30" width="180" height="50" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
                <text x="560" y="50" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">record_receipt</text>
                <text x="560" y="68" textAnchor="middle" fill="#9cdcfe" fontSize="11">AI reproducibility</text>
                
                {/* Sui Blockchain */}
                <rect x="200" y="120" width="300" height="50" fill="#2d4a2d" stroke="#4ade80" strokeWidth="2" rx="6" />
                <text x="350" y="145" textAnchor="middle" fill="#86efac" fontSize="16" fontWeight="bold">Sui Blockchain</text>
                <text x="350" y="162" textAnchor="middle" fill="#86efac" fontSize="12">Public &amp; Verifiable</text>
                
                {/* Arrows */}
                <path d="M 140 80 L 250 120" stroke="#97F0E5" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)" />
                <path d="M 350 80 L 350 120" stroke="#97F0E5" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)" />
                <path d="M 560 80 L 450 120" stroke="#97F0E5" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)" />
                
                <defs>
                  <marker id="arrowhead4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#97F0E5" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* User Dashboard Section */}
          <div className="mb-10">
            <h3 id="user-dashboard" className="font-bold mb-6 text-white" style={{ fontSize: '1.125rem', lineHeight: '1.5rem', letterSpacing: '0px' }}>
              4. User Dashboard
            </h3>
            <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
              Web interface displaying:
            </p>
            <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4 mb-6" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
              <li>the version chain (DAG)</li>
              <li>the last state anchored on Sui</li>
              <li><code className="bg-[#334155] text-[#9cdcfe] px-1 py-0.5 rounded">integrity_scores</code> and node reputations</li>
              <li>associated reproducibility receipts</li>
            </ul>
            <p className="text-gray-300" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
              Allows visualization of the complete traceability of a dataset and knowing which version is "canonical" at a given time.
            </p>
          </div>
        </div>

        {/* Reputation and Snapshot Consensus Section */}
        <div className="mt-12 mb-8">
          <h2 id="reputation-consensus" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            <span className="text-orange-400">◆</span> Reputation and Snapshot Consensus
          </h2>
          <p className="text-gray-300 mb-3" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            At each epoch, an aggregator collects signatures and scores from multiple nodes.
          </p>
          <p className="text-gray-300 mb-3" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            It validates k-of-n consistency and publishes a unique snapshot with integrity average and list of faulty nodes.
          </p>
          <p className="text-gray-300" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            Reputation evolves according to the historical reliability of each node (smoothed score).
          </p>
        </div>

        {/* Reproducibility Receipts Section */}
        <div className="mt-12 mb-8">
          <h2 id="reproducibility-receipts" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            <span className="text-orange-400">◆</span> Reproducibility Receipts
          </h2>
          <p className="text-gray-300 mb-3" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            Each AI execution (training, evaluation, inference) generates a receipt:
          </p>
          <div className="bg-[#0f172a] border border-[#334155] p-3 rounded mb-6">
            <code className="text-[#9cdcfe] font-mono" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
              hash(model_id, code_hash, dataset_id, version_root, hyperparams, metrics)
            </code>
          </div>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            This hash is recorded on Sui and links the model to the exact data version used, ensuring scientific reproducibility.
          </p>
          
          {/* Reproducibility Flow Diagram */}
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
            <h4 className="text-white font-bold mb-4" style={{ fontSize: '1rem' }}>Reproducibility Receipt Flow</h4>
            <svg viewBox="0 0 700 250" className="w-full h-auto">
              {/* Model */}
              <rect x="50" y="30" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
              <text x="110" y="55" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">AI Model</text>
              <text x="110" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="11">model_id</text>
              
              {/* Dataset */}
              <rect x="250" y="30" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
              <text x="310" y="55" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">Dataset</text>
              <text x="310" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="11">version_root</text>
              
              {/* Execution */}
              <rect x="450" y="30" width="120" height="60" fill="#1e3a5f" stroke="#4a90e2" strokeWidth="2" rx="6" />
              <text x="510" y="55" textAnchor="middle" fill="#9cdcfe" fontSize="14" fontWeight="bold">Execution</text>
              <text x="510" y="75" textAnchor="middle" fill="#9cdcfe" fontSize="11">hyperparams</text>
              
              {/* Arrows to hash */}
              <path d="M 110 90 L 250 130" stroke="#97F0E5" strokeWidth="2" fill="none" />
              <path d="M 310 90 L 310 130" stroke="#97F0E5" strokeWidth="2" fill="none" />
              <path d="M 510 90 L 370 130" stroke="#97F0E5" strokeWidth="2" fill="none" />
              
              {/* Hash function */}
              <rect x="250" y="130" width="120" height="50" fill="#2d4a2d" stroke="#4ade80" strokeWidth="2" rx="6" />
              <text x="310" y="150" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="bold">Hash Function</text>
              <text x="310" y="168" textAnchor="middle" fill="#86efac" fontSize="11">Generate Receipt</text>
              
              {/* Receipt */}
              <path d="M 310 180 L 310 210" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)" />
              <rect x="200" y="210" width="220" height="30" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="2" rx="6" />
              <text x="310" y="230" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">Reproducibility Receipt</text>
              
              <defs>
                <marker id="arrowhead5" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#fbbf24" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* Key Advantages Section */}
        <div className="mt-12 mb-8">
          <h2 id="key-advantages" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            Key Advantages
          </h2>
          <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li>Verifiable traceability — Each dataset has a cryptographic identity and complete history</li>
            <li>Automatic divergence detection — Continuous monitoring of consistency between nodes</li>
            <li>Adaptive canonicalization — Smart anchoring only when necessary, reducing costs</li>
            <li>AI reproducibility — Cryptographic proofs linking models and data versions</li>
            <li>Compatible — No modification of the underlying storage system required</li>
          </ul>
        </div>

        {/* Performance Indicators Section */}
        <div className="mt-12 mb-8">
          <h2 id="performance-indicators" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            Performance Indicators
          </h2>
          <ul className="space-y-2 text-gray-300 list-disc list-inside ml-4" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li><span className="font-medium">Mean Integrity Score</span> — average consistency of nodes per epoch</li>
            <li><span className="font-medium">Average Risk Score</span> — rate of detected forks / total epochs</li>
            <li><span className="font-medium">Reduced anchoring cost</span> — average number of commits per transaction</li>
            <li><span className="font-medium">Reproducibility pass rate</span> — proportion of validated receipts</li>
            <li><span className="font-medium">Time-to-anchor</span> — average delay between detected fork and effective anchoring</li>
          </ul>
        </div>

        {/* Organization Section */}
        <div className="mt-12 mb-8">
          <h2 id="organization" className="font-bold mb-6 text-white" style={{ fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '0px' }}>
            Organization
          </h2>
          <p className="text-gray-300 mb-6" style={{ fontSize: '1rem', lineHeight: '1.375rem', letterSpacing: '0px' }}>
            This documentation is organized into several parts:
          </p>
          <ol className="space-y-2 text-gray-300 list-decimal list-inside ml-4" style={{ fontSize: '16px', lineHeight: '22px', letterSpacing: '0px' }}>
            <li><span className="font-medium">Architecture</span> describes the functional architecture and system components</li>
            <li><span className="font-medium">Data Layer</span> describes the integrity and versioning layer</li>
            <li><span className="font-medium">AI Layer</span> describes the surveillance and governance layer</li>
            <li><span className="font-medium">On-chain</span> describes integration with the Sui blockchain</li>
            <li><span className="font-medium">Dashboard</span> describes the user interface and visualizations</li>
            <li><span className="font-medium">Usage</span> provides concrete information for developers</li>
          </ol>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
