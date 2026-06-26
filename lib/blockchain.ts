import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';

// ABI for DocumentRegistry — minimal interface matching the deployed contract
const DOCUMENT_REGISTRY_ABI = [
  'function registerDocument(string documentId, string ownerId, string sha256Hash) external',
  'function verifyDocument(string documentId, string sha256Hash) external returns (bool)',
  'function logEmergencyApproval(string requestId, string nomineeId, string ownerId) external',
  'function getDocumentRecord(string documentId) external view returns (string, string, string, uint256)',
  'event DocumentRegistered(string indexed documentId, string ownerId, string sha256Hash, uint256 timestamp)',
  'event DocumentVerified(string indexed documentId, bool isValid, uint256 timestamp)',
  'event EmergencyApproved(string indexed requestId, string nomineeId, string ownerId, uint256 timestamp)',
];

let _provider: JsonRpcProvider | null = null;
let _wallet: Wallet | null = null;
let _contract: Contract | null = null;

function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL!);
  }
  return _provider;
}

function getWallet(): Wallet {
  if (!_wallet) {
    _wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, getProvider());
  }
  return _wallet;
}

function getContract(): Contract {
  if (!_contract) {
    _contract = new Contract(
      process.env.CONTRACT_ADDRESS!,
      DOCUMENT_REGISTRY_ABI,
      getWallet(),
    );
  }
  return _contract;
}

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

export interface RegisterDocumentResult {
  txHash: string;
  blockNumber: number;
}

/**
 * Register a document hash on the Polygon Amoy blockchain.
 */
export async function registerDocumentOnChain(
  documentId: string,
  ownerId: string,
  sha256Hash: string,
): Promise<RegisterDocumentResult> {
  const contract = getContract();
  const tx = await contract.registerDocument(documentId, ownerId, sha256Hash);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Verify a document hash on-chain. Returns true if the hash matches.
 */
export async function verifyDocumentOnChain(
  documentId: string,
  sha256Hash: string,
): Promise<boolean> {
  const contract = getContract();
  // verifyDocument is a state-changing function (emits event), so we call it
  const tx = await contract.verifyDocument(documentId, sha256Hash);
  const receipt = await tx.wait();
  // Parse the DocumentVerified event to get the isValid result
  const iface = new ethers.Interface(DOCUMENT_REGISTRY_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'DocumentVerified') {
        return parsed.args.isValid as boolean;
      }
    } catch {
      // skip non-matching logs
    }
  }
  return false;
}

/**
 * Read document record from chain without sending a transaction (free).
 */
export async function getDocumentRecordFromChain(documentId: string): Promise<{
  storedDocumentId: string;
  storedOwnerId: string;
  storedHash: string;
  storedTimestamp: number;
} | null> {
  try {
    const contract = getContract();
    const [storedDocumentId, storedOwnerId, storedHash, storedTimestamp] =
      await contract.getDocumentRecord(documentId);
    return {
      storedDocumentId,
      storedOwnerId,
      storedHash,
      storedTimestamp: Number(storedTimestamp),
    };
  } catch {
    return null;
  }
}

/**
 * Log emergency approval event on-chain.
 */
export async function logEmergencyApprovalOnChain(
  requestId: string,
  nomineeId: string,
  ownerId: string,
): Promise<RegisterDocumentResult> {
  const contract = getContract();
  const tx = await contract.logEmergencyApproval(requestId, nomineeId, ownerId);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Get the Polygonscan Amoy URL for a given transaction hash.
 */
export function getPolygonscanUrl(txHash: string): string {
  return `https://amoy.polygonscan.com/tx/${txHash}`;
}
