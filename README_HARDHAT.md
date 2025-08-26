# Hardhat Setup for Penk Market

## Overview
This project is configured with Hardhat for Ethereum smart contract development and testing on the Sepolia testnet.

## Contracts

### USDC Token Contract
- **Name**: USD Coin
- **Symbol**: USDC
- **Decimals**: 6 (standard for USDC)
- **Initial Supply**: 1000 USDC tokens
- **Features**: 
  - ERC20 standard implementation
  - Owner can mint additional tokens
  - Users can burn their own tokens
  - Standard transfer functionality

## Setup

### 1. Environment Variables
Create a `.env` file in the root directory with:
```
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
PRIVATE_KEY=your_private_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Compile Contracts
```bash
npx hardhat compile
```

### 4. Run Tests
```bash
npx hardhat test
```

## Deployment

### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy-usdc.js --network sepolia
```

### Deploy to Local Hardhat Network
```bash
npx hardhat run scripts/deploy-usdc.js --network hardhat
```

## Available Commands

- `npx hardhat compile` - Compile all contracts
- `npx hardhat test` - Run all tests
- `npx hardhat test test/USDC.test.js` - Run specific test file
- `npx hardhat run scripts/deploy-usdc.js --network sepolia` - Deploy to Sepolia
- `npx hardhat console --network sepolia` - Open Hardhat console on Sepolia

## Network Configuration

- **Sepolia Testnet**: Chain ID 11155111
- **Local Hardhat**: Chain ID 31337

## Contract Addresses
After deployment, contract addresses will be displayed in the console output.

## Testing
The project includes comprehensive tests for:
- Contract deployment
- Token minting (owner only)
- Token burning
- Token transfers
- Access control (only owner can mint)

## Gas Usage
- **USDC Deployment**: ~1,228,730 gas
- **SampleContract Deployment**: ~493,906 gas
- **Mint Operation**: ~54,142 gas
- **Transfer Operation**: ~52,152 gas
- **Burn Operation**: ~34,155 gas 