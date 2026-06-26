// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentRegistry
 * @notice Stores SHA-256 hashes of encrypted documents for immutable integrity verification.
 * @dev Deployed on Polygon Amoy Testnet. Documents are NEVER stored on-chain — only their hashes.
 */
contract DocumentRegistry {

    struct DocumentRecord {
        string  documentId;
        string  ownerId;
        string  sha256Hash;
        uint256 timestamp;
        bool    exists;
    }

    // documentId => DocumentRecord
    mapping(string => DocumentRecord) private records;

    // ──────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────
    event DocumentRegistered(
        string indexed documentId,
        string          ownerId,
        string          sha256Hash,
        uint256         timestamp
    );

    event DocumentVerified(
        string indexed documentId,
        bool            isValid,
        uint256         timestamp
    );

    event EmergencyApproved(
        string indexed requestId,
        string          nomineeId,
        string          ownerId,
        uint256         timestamp
    );

    // ──────────────────────────────────────────────────────
    // Functions
    // ──────────────────────────────────────────────────────

    /**
     * @notice Register a new document hash on-chain.
     * @param documentId  MongoDB ObjectId string of the document.
     * @param ownerId     MongoDB ObjectId string of the owner.
     * @param sha256Hash  Hex string of the SHA-256 hash of the ORIGINAL (pre-encryption) file.
     */
    function registerDocument(
        string memory documentId,
        string memory ownerId,
        string memory sha256Hash
    ) external {
        require(!records[documentId].exists, "Document already registered");
        records[documentId] = DocumentRecord({
            documentId: documentId,
            ownerId:    ownerId,
            sha256Hash: sha256Hash,
            timestamp:  block.timestamp,
            exists:     true
        });
        emit DocumentRegistered(documentId, ownerId, sha256Hash, block.timestamp);
    }

    /**
     * @notice Verify a document hash against the stored record.
     * @param documentId  The MongoDB ObjectId string to look up.
     * @param sha256Hash  The hash to compare against the stored value.
     * @return isValid    True if the hash matches the stored record.
     */
    function verifyDocument(
        string memory documentId,
        string memory sha256Hash
    ) external returns (bool isValid) {
        require(records[documentId].exists, "Document not registered");
        isValid = keccak256(bytes(records[documentId].sha256Hash)) == keccak256(bytes(sha256Hash));
        emit DocumentVerified(documentId, isValid, block.timestamp);
        return isValid;
    }

    /**
     * @notice Log an emergency access approval event on-chain.
     * @param requestId   MongoDB ObjectId string of the emergency request.
     * @param nomineeId   MongoDB ObjectId string of the nominee.
     * @param ownerId     MongoDB ObjectId string of the owner.
     */
    function logEmergencyApproval(
        string memory requestId,
        string memory nomineeId,
        string memory ownerId
    ) external {
        emit EmergencyApproved(requestId, nomineeId, ownerId, block.timestamp);
    }

    /**
     * @notice Read stored document record (view-only, no gas for read).
     */
    function getDocumentRecord(string memory documentId)
        external
        view
        returns (
            string memory storedDocumentId,
            string memory storedOwnerId,
            string memory storedHash,
            uint256       storedTimestamp
        )
    {
        require(records[documentId].exists, "Document not registered");
        DocumentRecord memory r = records[documentId];
        return (r.documentId, r.ownerId, r.sha256Hash, r.timestamp);
    }
}
