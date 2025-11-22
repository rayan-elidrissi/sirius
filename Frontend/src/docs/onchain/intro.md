# Introduction to On-chain Integration

The on-chain integration provides immutability and public verification through the Sui blockchain.

## Why On-chain?

While systems like Walrus provide excellent availability guarantees, they lack:
- **Immutability** — Proof that data states cannot be changed
- **Public verification** — Anyone can verify data integrity
- **Temporal proof** — Cryptographic timestamp of when data was in a specific state

## How It Works

Sirius uses three types of Sui transactions:

1. **anchor_epoch** — Records Merkle roots of dataset versions
2. **submit_snapshot** — Records system-wide consistency state
3. **record_receipt** — Links AI models to exact data versions used

## Benefits

- **Public auditability** — All anchors are publicly verifiable
- **Cost efficiency** — Adaptive anchoring reduces gas costs
- **Immutability** — Once anchored, states cannot be modified
- **Interoperability** — Works with any Sui-compatible system
