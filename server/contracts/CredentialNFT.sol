// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the OpenZeppelin ERC-1155 standard contract
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialNFT
 * @dev This is an ERC-1155 contract that mints unique skill/certificate tokens.
 * - The 'owner' (College) is the only one who can mint new tokens.
 * - Each 'tokenId' represents a unique certificate or skill (e.g., "Hackathon 2025" or "Python Skill").
 * - We can mint multiple copies (amount > 1) if needed, but for certificates, we'll mint 1.
 */
contract CredentialNFT is ERC1155, Ownable {
    
    // Counter to create a new, unique ID for each certificate type
    uint256 public tokenIdCounter;

    // Mapping: (Token ID => Certificate Hash)
    // This links our token ID to the off-chain certificate data hash
    mapping(uint256 => bytes32) public tokenHashes;

    // Mapping: (Hash => Revoked)
    // Our revocation ledger, just like before
    mapping(bytes32 => bool) public revokedHashes;

    // Event for when a hash is added
    event CertificateMinted(
        uint256 indexed tokenId, 
        bytes32 certHash, 
        address indexed studentWallet
    );

    // Event for revocation
    event CertificateRevoked(uint256 indexed tokenId, bytes32 certHash);

    /**
     * @dev Constructor
     * We pass a URI to the ERC1155 constructor. This URI would point to
     * a server or IPFS location where the token's metadata (image, etc.) is stored.
     * For now, we'll leave it as a placeholder.
     */
    constructor() ERC1155("https://api.mycollege.com/nft/{id}.json") Ownable(msg.sender) {
        tokenIdCounter = 0;
    }

    /**
     * @dev Mints a new, unique certificate NFT.
     * Only the owner (College) can call this.
     * @param studentWallet The student's public wallet address (e.g., 0x...)
     * @param certHash The 32-byte hash of the certificate details
     */
    function mintCertificate(address studentWallet, bytes32 certHash) public onlyOwner {
        // 1. Check if this hash has been revoked
        require(!revokedHashes[certHash], "This hash is revoked.");

        // 2. Increment the counter to get a new, unique ID for this certificate
        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;

        // 3. Store the hash, linking it to the new token ID
        tokenHashes[newTokenId] = certHash;

        // 4. Mint the NFT:
        //    - To: studentWallet
        //    - ID: newTokenId
        //    - Amount: 1 (because it's a unique certificate)
        //    - Data: "" (empty)
        _mint(studentWallet, newTokenId, 1, "");

        // 5. Fire the event
        emit CertificateMinted(newTokenId, certHash, studentWallet);
    }

    /**
     * @dev Revokes a certificate by its hash.
     * This prevents minting it again and flags it as invalid.
     */
    function revokeCertificateByHash(bytes32 certHash) public onlyOwner {
        // We'll just add it to the revoked list.
        // We can't easily find the tokenId from the hash, so this is the
        // simplest way to prevent future minting.
        revokedHashes[certHash] = true;
        // Note: This doesn't burn the existing token, just flags the hash.
    }

    /**
     * @dev Public verification function.
     * Returns true if a hash is NOT revoked.
     */
    function isHashValid(bytes32 certHash) public view returns (bool) {
        return !revokedHashes[certHash];
    }

    // --- Required by OpenZeppelin ---
    // This function allows the contract owner to update the metadata URI
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}