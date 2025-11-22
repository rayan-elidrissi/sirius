import { CommitVersionUseCase } from './CommitVersionUseCase';
import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { ICryptoService } from '../../domain/services/ICryptoService';
import { IMerkleService } from '../../domain/services/IMerkleService';
import { IKeystoreService } from '../../domain/services/IKeystoreService';
import { Dataset } from '../../domain/entities/Dataset';
import { ManifestEntry } from '../../domain/entities/ManifestEntry';
import { VersionCommit } from '../../domain/entities/VersionCommit';
import { Keystore } from '../../domain/entities/Keystore';

describe('CommitVersionUseCase', () => {
  let useCase: CommitVersionUseCase;
  let mockDatasetRepo: jest.Mocked<IDatasetRepository>;
  let mockManifestRepo: jest.Mocked<IManifestEntryRepository>;
  let mockVersionRepo: jest.Mocked<IVersionCommitRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;
  let mockMerkleService: jest.Mocked<IMerkleService>;
  let mockKeystoreService: jest.Mocked<IKeystoreService>;

  const mockDataset: Dataset = {
    id: 'dataset-1',
    name: 'Test Dataset',
    description: null,
    createdAt: new Date(),
  };

  const mockKeystore: Keystore = {
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  };

  const mockEntries: ManifestEntry[] = [
    {
      id: 'entry-1',
      datasetId: 'dataset-1',
      blobId: 'blob1',
      path: 'file1.txt',
      metadata: { mimeType: 'text/plain' },
      createdAt: new Date(),
    },
  ];

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

    mockKeystoreService = {
      load: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new CommitVersionUseCase(
      mockDatasetRepo,
      mockManifestRepo,
      mockVersionRepo,
      mockCryptoService,
      mockMerkleService,
      mockKeystoreService
    );
  });

  it('should commit first version successfully', async () => {
    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockKeystoreService.load.mockResolvedValue(mockKeystore);
    mockManifestRepo.findUncommittedByDatasetId.mockResolvedValue(mockEntries);
    mockVersionRepo.findLatestByDatasetId.mockResolvedValue(null); // First version
    mockMerkleService.computeManifestRoot.mockReturnValue('merkle-root-123');
    mockCryptoService.sign.mockReturnValue('signature-123');

    const mockCommit: VersionCommit = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'merkle-root-123',
      parentRoot: null,
      signature: 'signature-123',
      publicKey: 'mock-public-key',
      author: null,
      createdAt: new Date(),
      manifestEntryIds: ['entry-1'],
    };

    mockVersionRepo.create.mockResolvedValue(mockCommit);

    const result = await useCase.execute({
      datasetId: 'dataset-1',
    });

    expect(result).toEqual(mockCommit);
    expect(mockVersionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId: 'dataset-1',
        versionRoot: 'merkle-root-123',
        parentRoot: null,
        signature: 'signature-123',
        publicKey: 'mock-public-key',
      })
    );
  });

  it('should commit version with parent', async () => {
    const parentCommit: VersionCommit = {
      id: 'commit-0',
      datasetId: 'dataset-1',
      versionRoot: 'parent-root',
      parentRoot: null,
      signature: 'sig-0',
      publicKey: 'key-0',
      author: null,
      createdAt: new Date(),
      manifestEntryIds: ['entry-0'],
    };

    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockKeystoreService.load.mockResolvedValue(mockKeystore);
    mockManifestRepo.findUncommittedByDatasetId.mockResolvedValue(mockEntries);
    mockVersionRepo.findLatestByDatasetId.mockResolvedValue(parentCommit);
    mockMerkleService.computeManifestRoot.mockReturnValue('merkle-root-456');
    mockCryptoService.sign.mockReturnValue('signature-456');

    const mockCommit: VersionCommit = {
      id: 'commit-1',
      datasetId: 'dataset-1',
      versionRoot: 'merkle-root-456',
      parentRoot: 'parent-root',
      signature: 'signature-456',
      publicKey: 'mock-public-key',
      author: null,
      createdAt: new Date(),
      manifestEntryIds: ['entry-1'],
    };

    mockVersionRepo.create.mockResolvedValue(mockCommit);

    const result = await useCase.execute({
      datasetId: 'dataset-1',
    });

    expect(result.parentRoot).toBe('parent-root');
  });

  it('should throw error when dataset not found', async () => {
    mockDatasetRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ datasetId: 'non-existent' })
    ).rejects.toThrow('Dataset not found');
  });

  it('should throw error when keystore not found', async () => {
    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockKeystoreService.load.mockResolvedValue(null);

    await expect(
      useCase.execute({ datasetId: 'dataset-1' })
    ).rejects.toThrow('Keystore not found');
  });

  it('should throw error when no entries to commit', async () => {
    mockDatasetRepo.findById.mockResolvedValue(mockDataset);
    mockKeystoreService.load.mockResolvedValue(mockKeystore);
    mockManifestRepo.findUncommittedByDatasetId.mockResolvedValue([]);

    await expect(
      useCase.execute({ datasetId: 'dataset-1' })
    ).rejects.toThrow('No manifest entries to commit');
  });
});

