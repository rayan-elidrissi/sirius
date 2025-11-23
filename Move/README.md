# Sirius Data Layer - Move Package

## 🎯 Overview

This Move package implements the **on-chain source of truth** for Sirius Data Layer V2 (Move-first architecture).

**Key Objects:**
- `Repository`: Root object for each project (owner, writers, readers, head commit)
- `Commit`: Versioned snapshots with anti-fork protection

## 📦 Structure

```
Move/
├── sources/
│   └── sirius.move      # Main Move module
├── Move.toml            # Package configuration
└── README.md            # This file
```

## 🚀 Deployment

### Prerequisites

- Sui CLI installed
- Active Sui wallet with testnet SUI

### Build

```bash
cd Move
sui move build
```

### Test

```bash
sui move test
```

### Deploy to Testnet

```bash
# Set your active address
sui client active-address

# Deploy
sui client publish --gas-budget 100000000

# Save the published package ID and object IDs
```

### Update Address in Move.toml

After first publish, update `Move.toml`:

```toml
[addresses]
sirius = "0x<PUBLISHED_PACKAGE_ID>"
```

Then rebuild and republish.

## 📋 Functions

### `create_repo(owner, sealed_rmk_blob_id)`
Creates a new repository on-chain.

**Parameters:**
- `owner`: address - Repository owner
- `sealed_rmk_blob_id`: vector<u8> - Walrus blob ID for sealed RMK

**Returns:**
- `(Repository, ID)` - Repository object and its ID

**Example:**
```move
let (repo, repo_id) = sirius::repository::create_repo(
    @0x123..., // owner
    b"walrus_blob_id_here", // sealed RMK blob ID
    ctx
);
```

### `push_commit(repo, parent, manifest_blob_id, merkle_root)`
Pushes a new commit to the repository.

**Parameters:**
- `repo`: &mut Repository - Repository object
- `parent`: vector<u8> - Parent commit ID (empty for first commit)
- `manifest_blob_id`: vector<u8> - Walrus blob ID for manifest JSON
- `merkle_root`: vector<u8> - Merkle root hash

**Returns:**
- `(Commit, ID)` - Commit object and its ID

**Anti-fork Protection:**
- First commit: `parent` must be empty
- Subsequent commits: `parent` must equal `repo.head`
- Aborts with `E_FORK_DETECTED` if fork detected

**Permissions:**
- Caller must be `owner` or in `writers` vector
- Aborts with `E_NOT_WRITER` if unauthorized

**Example:**
```move
let (commit, commit_id) = sirius::repository::push_commit(
    &mut repo,
    b"parent_commit_id", // or empty for first commit
    b"manifest_blob_id",
    b"merkle_root_hash",
    ctx
);
```

### `grant_reader(repo, addr)`
Grants read access to an address.

**Permissions:**
- Only `owner` can grant
- Aborts with `E_NOT_OWNER` if unauthorized

### `grant_writer(repo, addr)`
Grants write access to an address.

**Permissions:**
- Only `owner` can grant
- Aborts with `E_NOT_OWNER` if unauthorized

### View Functions

- `get_head(repo)`: Returns current head commit ID
- `is_reader(repo, addr)`: Checks if address is reader
- `is_writer(repo, addr)`: Checks if address is writer
- `get_repo_info(repo)`: Returns (owner, writers, readers, head)

## 🔒 Security Features

### Anti-Fork Protection
- Each commit must have `parent == repo.head`
- Prevents concurrent commits from creating forks
- Enforces linear history (no DAG for MVP)

### Permissions
- Owner: Full control (create, push, grant permissions)
- Writers: Can push commits
- Readers: Can read/clone (enforced off-chain via Seal)

### Seal Policy
- Seal policy is stored on-chain in Repository
- Off-chain Seal SDK enforces policy when unsealing keys
- Only owner/readers/writers can unseal RMK and FileKeys

## 🧪 Testing

### Test Create Repo
```bash
sui move test test_create_repo
```

### Test Push Commit
```bash
sui move test test_push_commit
```

### Test Anti-Fork
```bash
sui move test test_anti_fork
```

### Test Permissions
```bash
sui move test test_permissions
```

## 📝 Notes

- **Shared Objects**: Repository and Commit are shared objects (accessible by all)
- **Immutable History**: Once a commit is created, it cannot be modified
- **Linear Chain**: MVP supports only linear history (no branches/merges)
- **Seal Integration**: Seal policy is simple allowlist (no ZK/ABAC for MVP)

## 🔄 Integration with Backend

The backend `SuiChainService` calls these Move functions via Sui SDK:

1. `createRepo()` → calls `create_repo()`
2. `pushCommit()` → calls `push_commit()`
3. `grantReader()` → calls `grant_reader()`
4. `grantWriter()` → calls `grant_writer()`
5. `getHeadCommitId()` → calls `get_head()`
6. `isReader()` → calls `is_reader()`
7. `isWriter()` → calls `is_writer()`

See `Backend/src/infrastructure/blockchain/SuiChainService.ts` for implementation.

