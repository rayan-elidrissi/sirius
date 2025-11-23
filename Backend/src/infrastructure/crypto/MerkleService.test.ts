import { MerkleService } from './MerkleService';
import { ManifestEntry } from '../../domain/entities/ManifestEntry';

describe('MerkleService', () => {
  let merkleService: MerkleService;

  beforeEach(() => {
    merkleService = new MerkleService();
  });

  const createMockEntry = (
    id: string,
    blobId: string,
    datasetId: string = 'dataset-1'
  ): ManifestEntry => ({
    id,
    datasetId,
    blobId,
    path: `file-${id}.txt`,
    metadata: {
      mimeType: 'text/plain',
      size: 1024,
      checksum: 'abc123',
    },
    createdAt: new Date(),
  });

  describe('computeManifestRoot', () => {
    it('should compute root for single entry', () => {
      const entries = [createMockEntry('1', 'blob1')];
      const root = merkleService.computeManifestRoot(entries);

      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBe(64); // SHA-256 hex
    });

    it('should compute root for multiple entries', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
        createMockEntry('3', 'blob3'),
      ];

      const root = merkleService.computeManifestRoot(entries);

      expect(root).toBeDefined();
      expect(root.length).toBe(64);
    });

    it('should compute consistent root for same entries', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
      ];

      const root1 = merkleService.computeManifestRoot(entries);
      const root2 = merkleService.computeManifestRoot(entries);

      expect(root1).toBe(root2);
    });

    it('should compute different roots for different entries', () => {
      const entries1 = [createMockEntry('1', 'blob1')];
      const entries2 = [createMockEntry('2', 'blob2')];

      const root1 = merkleService.computeManifestRoot(entries1);
      const root2 = merkleService.computeManifestRoot(entries2);

      expect(root1).not.toBe(root2);
    });

    it('should handle empty entry list', () => {
      const root = merkleService.computeManifestRoot([]);

      expect(root).toBeDefined();
      expect(root.length).toBe(64);
    });

    it('should produce same root regardless of input order (sorted internally)', () => {
      const entry1 = createMockEntry('aaa', 'blob1');
      const entry2 = createMockEntry('bbb', 'blob2');
      const entry3 = createMockEntry('ccc', 'blob3');

      const root1 = merkleService.computeManifestRoot([entry1, entry2, entry3]);
      const root2 = merkleService.computeManifestRoot([entry3, entry1, entry2]);
      const root3 = merkleService.computeManifestRoot([entry2, entry3, entry1]);

      expect(root1).toBe(root2);
      expect(root2).toBe(root3);
    });

    it('should detect changes in blob ID', () => {
      const entries1 = [createMockEntry('1', 'blob1')];
      const entries2 = [createMockEntry('1', 'blob2')];

      const root1 = merkleService.computeManifestRoot(entries1);
      const root2 = merkleService.computeManifestRoot(entries2);

      expect(root1).not.toBe(root2);
    });

    it('should detect changes in metadata', () => {
      const entry1 = createMockEntry('1', 'blob1');
      const entry2 = {
        ...createMockEntry('1', 'blob1'),
        metadata: {
          mimeType: 'text/plain',
          size: 2048, // Changed
          checksum: 'abc123',
        },
      };

      const root1 = merkleService.computeManifestRoot([entry1]);
      const root2 = merkleService.computeManifestRoot([entry2]);

      expect(root1).not.toBe(root2);
    });

    it('should handle odd number of entries', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
        createMockEntry('3', 'blob3'),
      ];

      const root = merkleService.computeManifestRoot(entries);

      expect(root).toBeDefined();
      expect(root.length).toBe(64);
    });

    it('should handle power-of-two entry count', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
        createMockEntry('3', 'blob3'),
        createMockEntry('4', 'blob4'),
      ];

      const root = merkleService.computeManifestRoot(entries);

      expect(root).toBeDefined();
      expect(root.length).toBe(64);
    });
  });

  describe('verifyManifestRoot', () => {
    it('should verify correct root', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
      ];

      const root = merkleService.computeManifestRoot(entries);
      const isValid = merkleService.verifyManifestRoot(entries, root);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect root', () => {
      const entries = [createMockEntry('1', 'blob1')];
      const wrongRoot = 'incorrect-root-hash';

      const isValid = merkleService.verifyManifestRoot(entries, wrongRoot);

      expect(isValid).toBe(false);
    });

    it('should reject tampered entries', () => {
      const entries = [createMockEntry('1', 'blob1')];
      const root = merkleService.computeManifestRoot(entries);

      const tamperedEntries = [createMockEntry('1', 'blob-tampered')];
      const isValid = merkleService.verifyManifestRoot(tamperedEntries, root);

      expect(isValid).toBe(false);
    });

    it('should reject when entry count changes', () => {
      const entries = [
        createMockEntry('1', 'blob1'),
        createMockEntry('2', 'blob2'),
      ];
      const root = merkleService.computeManifestRoot(entries);

      const fewerEntries = [createMockEntry('1', 'blob1')];
      const isValid = merkleService.verifyManifestRoot(fewerEntries, root);

      expect(isValid).toBe(false);
    });
  });
});

