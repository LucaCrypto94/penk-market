# Hardhat Setup for Penk Market

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Ethereum Sepolia Testnet RPC URL
# Get this from providers like Alchemy, Infura, or QuickNode
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Private key for deployment (without 0x prefix)
# WARNING: Never commit your actual private key to version control
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

## Getting Sepolia RPC URL

1. **Infura**: Go to [infura.io](https://infura.io), create an account, and create a new project
2. **Alchemy**: Go to [alchemy.com](https://alchemy.com), create an account, and create a new app
3. **QuickNode**: Go to [quicknode.com](https://quicknode.com), create an account, and create a new endpoint

## Getting Sepolia ETH

1. **Sepolia Faucet**: Visit [sepoliafaucet.com](https://sepoliafaucet.com) or [faucet.sepolia.dev](https://faucet.sepolia.dev)
2. **Alchemy Faucet**: If using Alchemy, they provide Sepolia ETH through their platform

## Available Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run tests on local network
npx hardhat test --network hardhat

# Deploy to local network
npx hardhat run scripts/deploy.js --network hardhat

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Start local node
npx hardhat node

# Verify contract on Etherscan (after deployment)
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor Argument"
```

## Network Configuration

- **Hardhat Network**: Local development network (chainId: 31337)
- **Sepolia**: Ethereum testnet (chainId: 11155111)

## Security Notes

- Never commit your `.env` file to version control
- Keep your private keys secure
- Use testnet accounts for development
- Consider using environment-specific configuration files 