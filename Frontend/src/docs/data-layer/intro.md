# Introduction to Data Layer

The Data Layer adds integrity and versioning to stored data, transforming simple storage into a verifiable trust platform.

## What It Does

While systems like Walrus ensure data availability, they don't track:
- Which version of data is canonical
- The history of changes
- Cryptographic proof of integrity

The Data Layer solves this by:

1. **Creating manifests** — Organizing blobs into structured datasets
2. **Building Merkle chains** — Linking versions cryptographically
3. **Adaptive anchoring** — Recording critical states on Sui when needed

## Goals

- **Cryptographic identity** — Each dataset has an immutable identity
- **Verifiable history** — Complete chain of versions
- **Efficiency** — Reduced on-chain costs via adaptive anchoring
- **Compatibility** — No modification of underlying storage system required
