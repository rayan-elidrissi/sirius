import { CryptoService } from './CryptoService';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid Ed25519 keypair', () => {
      const keystore = cryptoService.generateKeyPair();

      expect(keystore.publicKey).toBeDefined();
      expect(keystore.privateKey).toBeDefined();
      expect(typeof keystore.publicKey).toBe('string');
      expect(typeof keystore.privateKey).toBe('string');

      // Ed25519 public key is 32 bytes (44 chars in base64)
      expect(keystore.publicKey.length).toBe(44);
      // Ed25519 private key is 64 bytes (88 chars in base64)
      expect(keystore.privateKey.length).toBe(88);
    });

    it('should generate unique keypairs', () => {
      const keystore1 = cryptoService.generateKeyPair();
      const keystore2 = cryptoService.generateKeyPair();

      expect(keystore1.publicKey).not.toBe(keystore2.publicKey);
      expect(keystore1.privateKey).not.toBe(keystore2.privateKey);
    });
  });

  describe('sign and verify', () => {
    it('should sign and verify data correctly', () => {
      const keystore = cryptoService.generateKeyPair();
      const data = 'Hello, Sirius!';

      const signature = cryptoService.sign(data, keystore.privateKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');

      const isValid = cryptoService.verify(data, signature, keystore.publicKey);
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong public key', () => {
      const keystore1 = cryptoService.generateKeyPair();
      const keystore2 = cryptoService.generateKeyPair();
      const data = 'Hello, Sirius!';

      const signature = cryptoService.sign(data, keystore1.privateKey);
      const isValid = cryptoService.verify(data, signature, keystore2.publicKey);

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered data', () => {
      const keystore = cryptoService.generateKeyPair();
      const data = 'Hello, Sirius!';
      const tamperedData = 'Hello, Hacker!';

      const signature = cryptoService.sign(data, keystore.privateKey);
      const isValid = cryptoService.verify(tamperedData, signature, keystore.publicKey);

      expect(isValid).toBe(false);
    });

    it('should fail verification with invalid signature', () => {
      const keystore = cryptoService.generateKeyPair();
      const data = 'Hello, Sirius!';
      const invalidSignature = 'invalid-signature';

      const isValid = cryptoService.verify(data, invalidSignature, keystore.publicKey);

      expect(isValid).toBe(false);
    });

    it('should throw error with invalid private key', () => {
      const data = 'Hello, Sirius!';
      const invalidPrivateKey = 'invalid-key';

      expect(() => {
        cryptoService.sign(data, invalidPrivateKey);
      }).toThrow();
    });
  });

  describe('hash', () => {
    it('should compute SHA-256 hash', () => {
      const data = 'Hello, Sirius!';
      const hash = cryptoService.hash(data);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
    });

    it('should produce consistent hashes', () => {
      const data = 'Hello, Sirius!';
      const hash1 = cryptoService.hash(data);
      const hash2 = cryptoService.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = cryptoService.hash('Hello');
      const hash2 = cryptoService.hash('World');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = cryptoService.hash('');

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });
});

