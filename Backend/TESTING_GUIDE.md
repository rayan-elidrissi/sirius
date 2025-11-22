# Testing Guide: Sirius Data Layer with Walrus Testnet

This guide walks you through testing the Sirius Data Layer with real Walrus blobs on testnet.

## Prerequisites

Before starting, ensure:

1. ✅ Walrus CLI is installed and configured
2. ✅ Sui CLI is installed and active address is set
3. ✅ You have testnet SUI (~1.48 SUI) and WAL (~0.18 WAL) tokens
4. ✅ Sirius Data Layer is installed (`npm install` in Backend directory)
5. ✅ Database is initialized (`npm run dev init-db`)
6. ✅ Keypair is generated (`npm run dev generate-key`)

## Step-by-Step Test Scenario

### Scenario: Research Dataset with Version History

We'll create a dataset tracking research documents, commit two versions, and verify the chain.

---

## Phase 1: Setup & Verification

### 1.1 Verify Your Wallet

```bash
# Check active Sui address
sui client active-address

# Check balances
sui client gas
```

Expected output:
- Address: `0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897`
- SUI: ~1.48 SUI
- WAL: ~0.18 WAL

### 1.2 Check Walrus Configuration

```bash
# View Walrus cluster info
walrus info

# List your blobs (if any)
walrus list-blobs
```

---

## Phase 2: Upload Files to Walrus

### 2.1 Upload First File

Navigate to the samples directory:

```bash
cd Backend/samples
```

Upload `sample1.csv`:

```bash
walrus store sample1.csv
```

**📝 Record the Blob ID from the output!**

Example output:
```
Storing blob...
Successfully stored blob with ID: wblbXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Blob size: 250 bytes
Certified: true
...
```

**Save the blob ID** (starting with `wblb...`)

### 2.2 Upload Second File

```bash
walrus store sample2.txt
```

**📝 Record this Blob ID too!**

### 2.3 Verify Blob Status (Optional)

```bash
# Check first blob
walrus blob-status <BLOB_ID_1>

# Check second blob
walrus blob-status <BLOB_ID_2>
```

---

## Phase 3: Create Dataset in Sirius

### 3.1 Create Dataset

Navigate back to Backend:

```bash
cd ..
```

Create a new dataset:

```bash
npm run dev create-dataset -- --name "Research Documents" --description "Scientific research data versioning test"
```

**📝 Save the Dataset ID from the output!**

Example output:
```
✅ Dataset created successfully!

📊 Dataset Details:
   ID:          12345678-1234-1234-1234-123456789abc
   Name:        Research Documents
   Description: Scientific research data versioning test
   Created:     2024-01-01T12:00:00.000Z
```

### 3.2 Verify Dataset Creation

```bash
npm run dev list-datasets
```

You should see your "Research Documents" dataset.

---

## Phase 4: First Version Commit

### 4.1 Create Manifest File

Create a file `Backend/samples/manifest-v1.json` with your actual blob IDs:

```json
[
  {
    "blobId": "YOUR_BLOB_ID_1_HERE",
    "path": "data/sample1.csv",
    "metadata": {
      "mimeType": "text/csv",
      "size": 250,
      "description": "Initial dataset - CSV format",
      "version": "1.0"
    }
  }
]
```

Replace `YOUR_BLOB_ID_1_HERE` with the blob ID from step 2.1.

### 4.2 Add Manifest Entries

```bash
npm run dev add-manifest -- --dataset <YOUR_DATASET_ID> --entries-file samples/manifest-v1.json
```

### 4.3 Commit First Version

```bash
npm run dev commit-version -- --dataset <YOUR_DATASET_ID> --author "0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897"
```

**📝 Save the Version Root from the output!**

Example output:
```
✅ Version committed successfully!

🔖 Version Details:
   Version ID:   version-uuid-here
   Version Root: a1b2c3d4e5f6...
   Parent Root:  (none - first version)
   Entries:      1
   Signature:    Xy9z8...
   ...
```

### 4.4 Verify First Version

```bash
npm run dev list-versions -- --dataset <YOUR_DATASET_ID>
```

You should see 1 version with `parentRoot: null`.

---

## Phase 5: Second Version Commit

### 5.1 Create Second Manifest

Create `Backend/samples/manifest-v2.json`:

```json
[
  {
    "blobId": "YOUR_BLOB_ID_2_HERE",
    "path": "docs/sample2.txt",
    "metadata": {
      "mimeType": "text/plain",
      "size": 350,
      "description": "Added documentation",
      "version": "2.0"
    }
  }
]
```

Replace `YOUR_BLOB_ID_2_HERE` with the blob ID from step 2.2.

### 5.2 Add New Entries

```bash
npm run dev add-manifest -- --dataset <YOUR_DATASET_ID> --entries-file samples/manifest-v2.json
```

### 5.3 Commit Second Version

```bash
npm run dev commit-version -- --dataset <YOUR_DATASET_ID> --author "0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897"
```

This version will have:
- **Version Root**: New Merkle root for updated manifest
- **Parent Root**: The version root from step 4.3 (creates the chain!)

### 5.4 View Version Chain

```bash
npm run dev list-versions -- --dataset <YOUR_DATASET_ID>
```

You should see 2 versions with a parent-child relationship:

```
📊 Chain Structure:
  └─ a1b2c3d4... (version-1)
    └─ x9y8z7w6... (version-2)
```

---

## Phase 6: Verify Chain Integrity

### 6.1 Full Chain Verification

```bash
npm run dev verify-chain -- --dataset <YOUR_DATASET_ID>
```

Expected output:
```
🔍 Verification Results:

Dataset:  <YOUR_DATASET_ID>
Versions: 2
Status:   ✅ VALID

📋 Version Details:

1. version-1-id
   Root:         a1b2c3d4...
   Parent:       (none)
   Merkle Root:  ✅ Valid
   Signature:    ✅ Valid
   Parent Link:  ✅ Valid
   Overall:      ✅ VALID

2. version-2-id
   Root:         x9y8z7w6...
   Parent:       a1b2c3d4...
   Merkle Root:  ✅ Valid
   Signature:    ✅ Valid
   Parent Link:  ✅ Valid
   Overall:      ✅ VALID

✅ All versions verified successfully!
```

### 6.2 Understanding the Verification

The verify-chain command checks:

1. **Merkle Root Validity**
   - Re-computes the Merkle root from manifest entries
   - Compares with stored `versionRoot`
   - Ensures data hasn't been tampered with

2. **Signature Validity**
   - Verifies Ed25519 signature using public key
   - Proves the commit was signed by keystore owner
   - Detects any tampering with commit metadata

3. **Parent Link Integrity**
   - Checks that `parentRoot` points to a valid previous version
   - Ensures chronological order (parent created before child)
   - Validates the chain structure

---

## Phase 7: Advanced Testing (Optional)

### 7.1 Test with All Entries

Commit a version including all entries (not just new ones):

```bash
npm run dev commit-version -- --dataset <YOUR_DATASET_ID> --all
```

This creates a "snapshot" version containing both files.

### 7.2 Retrieve Walrus Blobs

Test retrieving the actual files from Walrus:

```bash
# Download first blob
walrus read <BLOB_ID_1> > retrieved-sample1.csv

# Download second blob
walrus read <BLOB_ID_2> > retrieved-sample2.txt

# Verify they match originals
diff samples/sample1.csv retrieved-sample1.csv
diff samples/sample2.txt retrieved-sample2.txt
```

### 7.3 Database Inspection

Open Prisma Studio to inspect the database:

```bash
npm run prisma:studio
```

Navigate to:
- `Dataset` table → See your dataset
- `ManifestEntry` table → See blob references
- `VersionCommit` table → See commits with signatures
- `VersionCommitEntry` table → See entry-version relationships

---

## Troubleshooting

### Walrus Upload Fails

```bash
# Check Walrus status
walrus info

# Verify you have WAL tokens
sui client gas

# Try smaller file
echo "test" > test.txt
walrus store test.txt
```

### Database Issues

```bash
# Reset and reinitialize
npx prisma migrate reset
npm run dev init-db
npm run dev generate-key
```

### Verification Fails

Common causes:
1. **Keystore changed**: Signatures become invalid
2. **Database corrupted**: Reset and start fresh
3. **Manual database edits**: Don't modify data directly

---

## Success Criteria

You've successfully tested the Sirius Data Layer if:

✅ Files uploaded to Walrus and blob IDs obtained
✅ Dataset created in Sirius
✅ Manifest entries added with Walrus blob IDs
✅ Multiple versions committed with signatures
✅ Version chain displays parent-child relationships
✅ Full chain verification passes all checks
✅ Merkle roots are consistent and verifiable
✅ Signatures are valid

---

## Next Steps

After successful testing:

1. **Integrate with AI Layer**: Add fingerprint analysis and risk scoring
2. **Add Sui On-chain Anchoring**: Publish Merkle roots to Sui blockchain
3. **Build Dashboard**: Visualize dataset history and verification status
4. **Production Hardening**: Add error recovery, connection pooling, monitoring

---

## Questions?

- **Walrus**: https://docs.wal.app/
- **Sui**: https://docs.sui.io/
- **Sirius**: See `Backend/README.md`

---

**Happy Testing! 🚀**


