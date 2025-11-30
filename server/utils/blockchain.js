// In server/utils/blockchain.js
const { ethers } = require('ethers');
require('dotenv').config();

// 1. Get info from .env
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;

// 2. Get the NEW ABI (for CredentialNFT)
const contractArtifact = require('../artifacts/contracts/CredentialNFT.sol/CredentialNFT.json');
const CONTRACT_ABI = contractArtifact.abi;

// 3. Connect to the blockchain
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 4. Get the "signer" (Hardhat Account #0)
const signer = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
);

// 5. Create the "Contract" object
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

console.log('Blockchain helper loaded (NFT Mode).');
console.log(`Connected to NFT contract at: ${CONTRACT_ADDRESS}`);

// --- NEW MINTING FUNCTION ---
exports.mintNFT = async (studentWalletAddress, certificateHash) => {
    try {
        console.log(`Minting NFT for hash: ${certificateHash}`);
        
        // This calls the "mintCertificate" function in your Solidity contract
        const tx = await contract.mintCertificate(
            studentWalletAddress, // The student's public 0x... address
            '0x' + certificateHash  // The 64-char hash
        );
        
        const receipt = await tx.wait(); // Wait for the transaction to be mined
        
        // --- Find the Token ID from the event log ---
        const event = receipt.logs.find(log => log.fragment.name === 'CertificateMinted');
        if (!event) {
            throw new Error('CertificateMinted event not found in transaction.');
        }
        
        const tokenId = event.args.tokenId; // Get the new Token ID
        
        console.log(`✅ NFT MINTED! Token ID: ${tokenId}, TX Hash: ${tx.hash}`);
        return {
            transactionHash: tx.hash,
            tokenId: tokenId.toString() // Return both
        };

    } catch (error) {
        console.error('Blockchain minting failed:', error.message);
        throw new Error('Blockchain transaction failed.');
    }
};

// --- NEW REVOKE FUNCTION ---
exports.revokeByHash = async (certificateHash) => {
    try {
        console.log(`Sending REVOKE for hash: ${certificateHash}`);
        const tx = await contract.revokeCertificateByHash(
            '0x' + certificateHash
        );
        await tx.wait();
        console.log(`✅ Hash successfully REVOKED! TX Hash: ${tx.hash}`);
        return tx.hash;
    } catch (error) {
        console.error('Blockchain revocation failed:', error.message);
        throw new Error('Blockchain revocation failed.');
    }
};

// --- NEW VERIFICATION FUNCTION ---
exports.isHashValid = async (certificateHash) => {
    try {
        // This now calls "isHashValid" which returns 'true' if NOT revoked
        const isValid = await contract.isHashValid(
            '0x' + certificateHash
        );
        
        console.log(`Blockchain hash valid result: ${isValid}`);
        // For our logic: exists = true, isRevoked = !isValid
        return { exists: true, isRevoked: !isValid }; 

    } catch (error) {
        console.error('Blockchain verification failed:', error.message);
        return { exists: false, isRevoked: false };
    }
};