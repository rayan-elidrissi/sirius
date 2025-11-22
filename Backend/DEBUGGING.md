### Debugging Notes – Backend (Sirius Data Layer)

This document records the TypeScript/`npm install` issues that were encountered and how they were fixed, so you can recognize and resolve similar problems in the future.

---

### 1. `npm install` failed because `npm run build` (TypeScript) failed

**Symptom (PowerShell output):**

```text
npm install

> sirius-data-layer@1.0.0 prepare
> npm run build

> sirius-data-layer@1.0.0 build
> tsc

src/cli/commands/list-versions.ts:30:13 - error TS6133: 'isFirst' is declared but its value is never read.
...
error TS7006: Parameter 'e' implicitly has an 'any' type.
...
Found 17 errors in 4 files.
```

**Root cause:**

- The `prepare` script in `Backend/package.json` runs `npm run build` during `npm install`.
- The TypeScript compiler (`tsc`) is configured to be strict about:
  - **Unused variables** (`TS6133`)
  - **Implicit `any` parameter types** (`TS7006`)
- Several repository files used arrow function parameters without explicit types, and one CLI variable (`isFirst`) was declared but never used.

---

### 2. Files that were corrected

#### `src/cli/commands/list-versions.ts`

- **Issue:** Unused variable.
- **Original problem line:**
  - `const isFirst = version.parentRoot === null;` (never used)
- **Fix:** Remove the unused `isFirst` variable and keep the rest of the logic:
  - `const parentExists = version.parentRoot ? versionsByRoot.has(version.parentRoot) : false;`

This removes the `TS6133` error while preserving the behavior and warnings about missing parents.

---

#### `src/infrastructure/repositories/DatasetRepository.ts`

- **Issue:** Implicit `any` in `Array.map`.
- **Original pattern:**
  - `return datasets.map((d) => this.mapToEntity(d));`
- **Fix:** Add an explicit type for the mapped item:

```ts
return datasets.map((d: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}) => this.mapToEntity(d));
```

This satisfies `TS7006` by giving `d` a concrete type.

---

#### `src/infrastructure/repositories/ManifestEntryRepository.ts`

- **Issues:** Multiple implicit `any` parameters in `map` and `filter` calls.
- **Original patterns:**
  - `entries.map((e) => this.mapToEntity(e));`
  - `filteredEntries.map((e) => this.mapToEntity(e));`
  - `entries.filter((entry) => { ... })`
- **Fix:** Add explicit structural types for the Prisma records:

```ts
return entries.map((e: {
  id: string;
  datasetId: string;
  blobId: string;
  path: string | null;
  metadata: string;
  createdAt: Date;
}) => this.mapToEntity(e));
```

and similarly for:

- `filteredEntries.map(...)`
- `entries.filter((entry: { ... }) => { ... })`
- `findByIds` mapping.

All of these now have explicit parameter types, removing `TS7006` errors.

---

#### `src/infrastructure/repositories/VersionCommitRepository.ts`

- **Issues:** Many implicit `any` parameters when mapping over `manifestEntries` and `commits`.
- **Original patterns:**
  - `commit.manifestEntries.map((e) => e.manifestEntryId);`
  - `commits.map((c) => { ... })`
  - `c.manifestEntries.map((e) => ({ ... }))`
- **Fix:** Add explicit types to the mapped parameters, reflecting the Prisma shape:

Examples of the changes:

```ts
const manifestEntryIds = commit.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
```

```ts
const entries = commit.manifestEntries.map((e: {
  manifestEntry: {
    id: string;
    blobId: string;
    path: string | null;
    metadata: string;
  };
}) => ({
  id: e.manifestEntry.id,
  blobId: e.manifestEntry.blobId,
  path: e.manifestEntry.path,
  metadata: JSON.parse(e.manifestEntry.metadata) as Record<string, unknown>,
}));
```

```ts
return commits.map((c: {
  id: string;
  datasetId: string;
  versionRoot: string;
  parentRoot: string | null;
  signature: string;
  publicKey: string;
  author: string | null;
  note: string | null;
  createdAt: Date;
  suiTxHash: string | null;
  blockHeight: number | null;
  blockTimestamp: number | null;
  ipfsCID: string | null;
  ipfsUrl: string | null;
  isMultiSig: boolean;
  requiredSigs: number;
  manifestEntries: { manifestEntryId: string }[];
}) => {
  const manifestEntryIds = c.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
  return this.mapToEntity(c, manifestEntryIds);
});
```

Similar explicit types were added for:

- `findByDatasetIdWithEntries`
- `findLatestByDatasetId`
- `findByVersionRoot`

This eliminates all `TS7006` errors coming from `VersionCommitRepository`.

---

### 3. How to re-run after these fixes

From the `Backend` folder:

```powershell
cd Backend
npm install
```

You should now see `npm install` complete without TypeScript build errors.

To run the API server:

```powershell
npm run api:dev
```

Then open the health check in a browser:

```text
http://localhost:3000/health
```

Expected JSON response:

```json
{"status":"ok","service":"sirius-data-layer-api"}
```

---

### 4. General tips for future debugging

- **If `npm install` fails with TypeScript errors**:
  - Look for `TS6133` (unused variables) and `TS7006` (implicit `any`).
  - Fix the source files instead of disabling the rules; this keeps the codebase type-safe.
- **Use explicit types in callbacks** (`map`, `filter`, `forEach`):
  - Especially when consuming Prisma results or complex nested objects.
- **Keep debugging notes here** whenever you fix a non-trivial error, so other contributors (or future you) can follow the same reasoning quickly.


