# Overview

Sirius is an AI × DATA layer of observability, governance, and attestation that integrates on top of a distributed storage system.

## Architecture Layers

```
┌─────────────────────────────────────┐
│      Dashboard (Web Interface)      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│    On-chain Layer (Sui Blockchain)  │
│  - anchor_epoch                     │
│  - submit_snapshot                   │
│  - record_receipt                    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      AI Layer (Surveillance)        │
│  - Fingerprints                      │
│  - Divergence Detection              │
│  - Integrity Scoring                 │
│  - Reputation                        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│     Data Layer (Versioning)         │
│  - Manifest                          │
│  - Merkle Chain                      │
│  - Adaptive Anchoring                │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│   Underlying Storage System         │
│  - Blob Storage                      │
│  - Retrieval                         │
└─────────────────────────────────────┘
```

## Design Principles

1. **Compatibility** — No modification of the underlying storage protocol
2. **Efficiency** — Adaptive anchoring to reduce on-chain costs
3. **Traceability** — Complete and verifiable history of each dataset
4. **Security** — Automatic detection of divergences and tampering
5. **Reproducibility** — Cryptographic proofs for AI

## How It Works

Sirius operates as an intelligent overlay that:

- **Monitors** data versions across storage nodes
- **Detects** inconsistencies and divergences automatically
- **Anchors** critical states on Sui blockchain when needed
- **Tracks** complete history of every dataset
- **Provides** cryptographic proofs for AI reproducibility

All of this happens without modifying the underlying storage system, making Sirius compatible with systems like Walrus while adding the missing trust and governance layers.
