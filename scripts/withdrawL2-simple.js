const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // Configuration
  const L2_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_L2_CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';
  
  if (!L2_CONTRACT_ADDRESS) {
    throw new Error('NEXT_PUBLIC_L2_CONTRACT_ADDRESS not found in environment variables');
  }
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in environment variables');
  }

  console.log('🚀 Starting L2 Withdrawal Script');
  console.log('📍 L2 Contract Address:', L2_CONTRACT_ADDRESS);
  console.log('🌐 RPC URL:', RPC_URL);
  console.log('');

  // Connect to the network
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('👤 Connected wallet address:', wallet.address);
  console.log('💰 Wallet balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'PEPU');
  console.log('');

  // L2 Contract ABI (minimal for withdraw function)
  const L2_ABI = [
    "function withdraw(uint256 amount) external",
    "function getContractBalance() external view returns (uint256)",
    "function owner() external view returns (address)"
  ];

  // Create contract instance
  const l2Contract = new ethers.Contract(L2_CONTRACT_ADDRESS, L2_ABI, wallet);
  
  try {
    // Check if caller is owner
    const contractOwner = await l2Contract.owner();
    console.log('🏗️  Contract owner:', contractOwner);
    console.log('👤 Caller address:', wallet.address);
    
    if (contractOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log('⚠️  Warning: You are not the contract owner');
      console.log('   Only owner or verifier can call withdraw function');
      console.log('');
    }

    // Get contract balance
    const contractBalance = await l2Contract.getContractBalance();
    console.log('💼 Contract PEPU balance:', ethers.formatEther(contractBalance), 'PEPU');
    
    if (contractBalance === 0n) {
      console.log('❌ No PEPU available to withdraw');
      return;
    }

    // Ask user for withdrawal amount
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Enter amount to withdraw (in PEPU, max: ${ethers.formatEther(contractBalance)}): `, async (amountInput) => {
      try {
        const withdrawAmount = ethers.parseEther(amountInput);
        
        if (withdrawAmount > contractBalance) {
          console.log('❌ Withdrawal amount exceeds contract balance');
          rl.close();
          return;
        }

        if (withdrawAmount <= 0n) {
          console.log('❌ Withdrawal amount must be greater than 0');
          rl.close();
          return;
        }

        console.log('');
        console.log('📝 Withdrawal Details:');
        console.log('   Amount:', ethers.formatEther(withdrawAmount), 'PEPU');
        console.log('   To address:', wallet.address);
        console.log('');

        // Confirm withdrawal
        rl.question('Confirm withdrawal? (yes/no): ', async (confirm) => {
          if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
            console.log('');
            console.log('🔄 Executing withdrawal...');
            
            try {
              // Execute withdrawal
              const tx = await l2Contract.withdraw(withdrawAmount);
              console.log('📡 Transaction hash:', tx.hash);
              console.log('⏳ Waiting for confirmation...');
              
              // Wait for transaction confirmation
              const receipt = await tx.wait();
              console.log('✅ Withdrawal successful!');
              console.log('   Block number:', receipt.blockNumber);
              console.log('   Gas used:', receipt.gasUsed.toString());
              console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');
              
              // Get updated balances
              const newContractBalance = await l2Contract.getContractBalance();
              const newWalletBalance = await provider.getBalance(wallet.address);
              
              console.log('');
              console.log('📊 Updated Balances:');
              console.log('   Contract PEPU:', ethers.formatEther(newContractBalance), 'PEPU');
              console.log('   Wallet PEPU:', ethers.formatEther(newWalletBalance), 'PEPU');
              
            } catch (error) {
              console.log('❌ Withdrawal failed:', error.message);
            }
          } else {
            console.log('❌ Withdrawal cancelled');
          }
          
          rl.close();
        });
        
      } catch (error) {
        console.log('❌ Invalid amount format:', error.message);
        rl.close();
      }
    });

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Handle errors
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 