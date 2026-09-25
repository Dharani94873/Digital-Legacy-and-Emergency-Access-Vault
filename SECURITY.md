# Security Policy

## 🛡️ Supported Versions

The following versions of **Digital Legacy Vault** are actively maintained and receiving security updates:

| Version | Supported |
|---|---|
| 0.1.x | :white_check_mark: |

---

## 🔐 Cryptographic Architecture

Digital Legacy Vault uses a zero-knowledge security model:

1. **Symmetric Cipher**: `AES-256-GCM` with a 256-bit key, randomized 96-bit initialization vector (IV), and 128-bit authentication tag per file.
2. **Blockchain Hash Anchoring**: Pre-encryption SHA-256 checksums are registered on the **Polygon Amoy Testnet** (`DocumentRegistry.sol` at `0x8CD9DD2B3c54F04fFDdd9fA563261e125CB900aA`).
3. **Decentralized Verification**: Decrypted documents are re-hashed and cross-verified against the immutable smart contract ledger before delivery.
4. **Isolated Storage**: Encrypted blobs are held in Cloudinary. Database stores only IVs, auth tags, and encrypted pointers. Plaintext is never written to disk.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within this repository, please report it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Send an email directly to **[dharani94873@gmail.com](mailto:dharani94873@gmail.com)** with the subject line:
   `[SECURITY] Vulnerability Report - Digital Legacy Vault`
3. Include:
   - Description of the vulnerability and its potential impact.
   - Proof-of-concept (PoC) code or steps to reproduce.
   - Any recommended remediation steps.

We will acknowledge receipt within 48 hours and provide status updates as we investigate and deploy fixes.
