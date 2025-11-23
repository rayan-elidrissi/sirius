import { VerifyChainUseCase } from './VerifyChainUseCase';
import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { ICryptoService } from '../../domain/services/ICryptoService';
import { IMerkleService } from '../../domain/services/IMerkleService';
import { Dataset } from '../../domain/entities/Dataset';
import { ManifestEntry } from '../../domain/entities/ManifestEntry';
import { VersionCommitWithEntries } from '../../domain/entities/VersionCommit';

describe('VerifyChainUseCase', () => {
  let useCase: VerifyChainUseCase;
  let mockDatasetRepo: jest.Mocked<IDatasetRepository>;
  let mockManifestRepo: jest.Mocked<IManifestEntryRepository>;
  let mockVersionRepo: jest.Mocked<IVersionCommitRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;
  let mockMerkleService: jest.Mocked<IMerkleService>;

  const mockDataset: Dataset = {
    id: 'dataset-1',
    name: 'Test Dataset',
    description: null,
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockDatasetRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    mockManifestRepo = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findByDatasetId: jest.fn(),
      findUncommittedByDatasetId: jest.fn(),
      findByIds: jest.fn(),
    };

    mockVersionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithEntries: jest.fn(),
      findByDatasetId: jest.fn(),
      findByDatasetIdWithEntries: jest.fn(),
      findLatestByDatasetId: jest.fn(),
      findByVersionRoot: jest.fn(),
    };

    mockCryptoService = {
      generateKeyPair: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      hash: jest.fn(),
    };

    mockMerkleService = {
      computeManifestRoot: jest.fn(),
      verifyManifestRoot: jest.fn(),
    };

    useCase = new VerifyChainUseCase(
      mockDatasetRepo,
      mockManifestRepo,
      mockVersionRepo,
      mockCryptoService,
      mockMerkleService
    );
  });

  it('should verify valid chain with single version', async () => {
    const mockEntries: ManifestEntry[] = [
      {
        id: 'entry-1',
        datasetId: 'dataset-1',
        blobId: 'blob1',
        path: 'file1.txt',
        metadata: { mimeType: 'text/plain' },
        createdAt: new Date('2024-01-01'),
      },
    ];

    const mockVersion: VersionCommitWithEntries = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'root-1',
      parentRoot: null,
      signature: 'sig-1',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-02'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [
        {
          id: 'entry-1',
          blobId: 'blob1',
          path: 'file1.txt',
          metadata: { mimeType: 'text/plain' },
        },
      ],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockVersionRepo.findByDatasetIdWithEntries.mockResolvedValue([mockVersion]);
    mockManifestRepo.findByIds.mockResolvedValue(mockEntries);
    mockMerkleService.computeManifestRoot.mockReturnValue('root-1');
    mockCryptoService.verify.mockReturnValue(true);

    const result = await useCase.execute({ datasetId: 'dataset-1' });

    expect(result.valid).toBe(true);
    expect(result.versionCount).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(result.versions[0].merkleRootValid).toBe(true);
    expect(result.versions[0].signatureValid).toBe(true);
    expect(result.versions[0].parentLinkValid).toBe(true);
  });

  it('should verify valid chain with multiple versions', async () => {
    const mockEntries: ManifestEntry[] = [
      {
        id: 'entry-1',
        datasetId: 'dataset-1',
        blobId: 'blob1',
        path: 'file1.txt',
        metadata: { mimeType: 'text/plain' },
        createdAt: new Date('2024-01-01'),
      },
    ];

    const version1: VersionCommitWithEntries = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'root-1',
      parentRoot: null,
      signature: 'sig-1',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-02'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [],
    };

    const version2: VersionCommitWithEntries = {
      id: 'commit-2',
      datasetId: 'dataset-1',
      versionRoot: 'root-2',
      parentRoot: 'root-1',
      signature: 'sig-2',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-03'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockVersionRepo.findByDatasetIdWithEntries.mockResolvedValue([version1, version2]);
    mockManifestRepo.findByIds.mockResolvedValue(mockEntries);
    mockMerkleService.computeManifestRoot.mockImplementation((entries) => {
      return entries.length > 0 ? 'root-1' : 'root-2';
    });
    mockCryptoService.verify.mockReturnValue(true);

    const result = await useCase.execute({ datasetId: 'dataset-1' });

    expect(result.versionCount).toBe(2);
    expect(result.versions[1].parentLinkValid).toBe(true);
  });

  it('should detect invalid Merkle root', async () => {
    const mockEntries: ManifestEntry[] = [
      {
        id: 'entry-1',
        datasetId: 'dataset-1',
        blobId: 'blob1',
        path: 'file1.txt',
        metadata: { mimeType: 'text/plain' },
        createdAt: new Date('2024-01-01'),
      },
    ];

    const mockVersion: VersionCommitWithEntries = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'wrong-root',
      parentRoot: null,
      signature: 'sig-1',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-02'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockVersionRepo.findByDatasetIdWithEntries.mockResolvedValue([mockVersion]);
    mockManifestRepo.findByIds.mockResolvedValue(mockEntries);
    mockMerkleService.computeManifestRoot.mockReturnValue('correct-root');
    mockCryptoService.verify.mockReturnValue(true);

    const result = await useCase.execute({ datasetId: 'dataset-1' });

    expect(result.valid).toBe(false);
    expect(result.versions[0].merkleRootValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid signature', async () => {
    const mockEntries: ManifestEntry[] = [
      {
        id: 'entry-1',
        datasetId: 'dataset-1',
        blobId: 'blob1',
        path: 'file1.txt',
        metadata: { mimeType: 'text/plain' },
        createdAt: new Date('2024-01-01'),
      },
    ];

    const mockVersion: VersionCommitWithEntries = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'root-1',
      parentRoot: null,
      signature: 'invalid-sig',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-02'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockVersionRepo.findByDatasetIdWithEntries.mockResolvedValue([mockVersion]);
    mockManifestRepo.findByIds.mockResolvedValue(mockEntries);
    mockMerkleService.computeManifestRoot.mockReturnValue('root-1');
    mockCryptoService.verify.mockReturnValue(false);

    const result = await useCase.execute({ datasetId: 'dataset-1' });

    expect(result.valid).toBe(false);
    expect(result.versions[0].signatureValid).toBe(false);
  });

  it('should detect broken parent link', async () => {
    const mockVersion: VersionCommitWithEntries = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'root-1',
      parentRoot: 'non-existent-parent',
      signature: 'sig-1',
      publicKey: 'key-1',
      author: null,
      createdAt: new Date('2024-01-02'),
      manifestEntryIds: ['entry-1'],
      manifestEntries: [],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockVersionRepo.findByDatasetIdWithEntries.mockResolvedValue([mockVersion]);
    mockManifestRepo.findByIds.mockResolvedValue([]);
    mockMerkleService.computeManifestRoot.mockReturnValue('root-1');
    mockCryptoService.verify.mockReturnValue(true);

    const result = await useCase.execute({ datasetId: 'dataset-1' });

    expect(result.valid).toBe(false);
    expect(result.versions[0].parentLinkValid).toBe(false);
  });
});

