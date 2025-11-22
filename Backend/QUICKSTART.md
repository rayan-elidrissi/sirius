# Quick Start Guide - 5 Minutes to First Version

This guide gets you running in 5 minutes.

## Prerequisites

✅ Node.js 18+ installed
✅ Walrus CLI configured
✅ Sui wallet with testnet tokens

## Setup (2 minutes)

```bash
# 1. Navigate to Backend
cd Backend

# 2. Install dependencies
npm install

# 3. Generate Prisma client (this might take a moment)
npm run prisma:generate

# 4. Initialize database
npm run dev init-db

# 5. Generate signing key
npm run dev generate-key
```

**📝 Save the public key shown!**

## Your First Dataset (3 minutes)

### 1. Create Dataset

```bash
npm run dev create-dataset -- --name "Test Dataset" --description "My first test"
```

**📝 Copy the Dataset ID from the output!**

### 2. Upload to Walrus

```bash
cd samples
walrus store sample1.csv
```

**📝 Copy the Blob ID (starts with `wblb...`)!**

### 3. Edit Manifest

Edit `samples/sample-manifest.json` and replace `REPLACE_WITH_ACTUAL_BLOB_ID_1` with your blob ID.

You can leave the second entry or remove it if you only want to test with one file.

### 4. Add Manifest

```bash
cd ..
npm run dev add-manifest -- --dataset <YOUR_DATASET_ID> --entries-file samples/sample-manifest.json
```

### 5. Commit Version

```bash
npm run dev commit-version -- --dataset <YOUR_DATASET_ID>
```

### 6. Verify

```bash
npm run dev verify-chain -- --dataset <YOUR_DATASET_ID>
```

## Expected Result

You should see:

```
🔍 Verification Results:

Dataset:  <YOUR_DATASET_ID>
Versions: 1
Status:   ✅ VALID

...

✅ All versions verified successfully!
```

## What Just Happened?

1. ✅ Created a SQLite database with Prisma
2. ✅ Generated an Ed25519 keypair for signing
3. ✅ Created a dataset to track versions
4. ✅ Uploaded a file to Walrus (decentralized storage)
5. ✅ Created a manifest entry linking to the Walrus blob
6. ✅ Committed a version with:
   - Merkle root (cryptographic fingerprint)
   - Ed25519 signature (proof of authenticity)
7. ✅ Verified the entire chain

## Next Steps

- **Add more files**: Upload another file to Walrus and commit a second version
- **See the chain**: Use `npm run dev list-versions -- --dataset <ID>` to see version history
- **Read full guide**: See `TESTING_GUIDE.md` for comprehensive testing
- **Integrate**: Use the programmatic API (see `README.md`)

## Common Issues

**"Keystore already exists"**
- This is fine if you already ran `generate-key`
- To regenerate: `rm keystore.json && npm run dev generate-key`

**"Dataset not found"**
- Make sure you're using the correct Dataset ID
- List all datasets: `npm run dev list-datasets`

**"Walrus command not found"**
- Ensure Walrus CLI is installed and in PATH
- Test: `walrus --version`

**TypeScript errors during build**
- Run: `npm run build` to check for issues
- Most errors will be caught by TypeScript compiler

## Architecture

```
Walrus (Decentralized Storage)
    ↓ (store blobs)
Sirius Data Layer (Integrity & Versioning)
    ↓ (compute Merkle roots + sign)
Version Chain (Tamper-evident History)
```

Each version commit:
- References Walrus blobs via `blobId`
- Computes Merkle root of all entries
- Links to previous version via `parentRoot`
- Signed with Ed25519 keypair

## Resources

- **Full README**: `README.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Walrus Docs**: https://docs.wal.app/
- **Sui Docs**: https://docs.sui.io/

---

**Ready to test? Start with Step 1! 🚀**


