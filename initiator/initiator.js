require('dotenv').config();
const { ethers } = require('ethers');

// Configuration
const L1_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_L1_CONTRACT_ADDRESS;
const L2_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_L2_CONTRACT_ADDRESS;
const VERIFIER_KEY = process.env.VERIFIER_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PEPU_V2_RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';

// Uniswap V3 addresses
const QUOTER_ADDRESS = "0xd647b2D80b48e93613Aa6982b85f8909578b4829";
const SWAP_ROUTER_ADDRESS = "0x150c3F0f16C3D9EB34351d7af9c961FeDc97A0fb";
const WPEPU_ADDRESS = "0xf9cf4a16d26979b929be7176bac4e7084975fcb8";

// Contract ABIs - Updated for new contract
const L1_ABI = [
  "event TransactionCreated(string indexed txidIndexed, string txid, address indexed user, string providedString, uint256 amount, uint256 penkBonus, uint256 totalAmount, string tokenType, uint256 timestamp)",
  "function getTransaction(string memory txid) external view returns (tuple(address user, address tokenAddress, uint256 amount, uint256 timestamp, uint8 status, string tokenType))",
  "function completeTransaction(string memory txid) external"
];

const L2_ABI = [
  "function swap(uint256 amount, string memory txid) external",
  "function getContractBalance() external view returns (uint256)"
];

const QUOTER_ABI = [
  {
    "inputs": [{
      "components": [
        { "internalType": "address", "name": "tokenIn", "type": "address" },
        { "internalType": "address", "name": "tokenOut", "type": "address" },
        { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
        { "internalType": "uint24", "name": "fee", "type": "uint24" },
        { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
      ],
      "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
      "name": "params",
      "type": "tuple"
    }],
    "name": "quoteExactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
      { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const SWAP_ROUTER_ABI = [
  {
    "inputs": [{
      "components": [
        { "internalType": "address", "name": "tokenIn", "type": "address" },
        { "internalType": "address", "name": "tokenOut", "type": "address" },
        { "internalType": "uint24", "name": "fee", "type": "uint24" },
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
        { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
        { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
      ],
      "internalType": "struct IV3SwapRouter.ExactInputSingleParams",
      "name": "params",
      "type": "tuple"
    }],
    "name": "exactInputSingle",
    "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }
    ],
    "name": "multicall",
    "outputs": [{ "internalType": "bytes[]", "name": "results", "type": "bytes[]" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "refundETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Get token price from GeckoTerminal API (matching your route's approach)
async function getTokenPrice(tokenType) {
  try {
    if (tokenType === 'USDC') return 1.0;
    
    // Use the correct PEPU pool from your config
    if (tokenType === 'PEPU') {
      console.log('Fetching PEPU price from GeckoTerminal...');
      const response = await fetch('https://api.geckoterminal.com/api/v2/networks/eth/pools/0xb1b10b05aa043dd8d471d4da999782bc694993e3ecbe8e7319892b261b412ed5');
      
      if (!response.ok) {
        console.log(`GeckoTerminal API error: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('GeckoTerminal response:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.attributes) {
        const price = parseFloat(data.data.attributes.base_token_price_usd);
        console.log('Parsed PEPU price:', price);
        if (!isNaN(price) && price > 0) return price;
      }
      
      console.log('Failed to get PEPU price from GeckoTerminal, using fallback');
    }
    
    // Fallback to CoinGecko for ETH
    if (tokenType === 'ETH') {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum?.usd || 4000;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching ${tokenType} price:`, error);
    if (tokenType === 'ETH') return 4000;
    if (tokenType === 'PEPU') {
      console.log('Using fallback PEPU price: $0.000014');
      return 0.000014; // Fallback PEPU price
    }
    return 0;
  }
}

// Calculate PEPU tokens equivalent to USD value (matching your route logic)
async function calculatePepuTokensFromUSD(usdValue) {
  const pepuPrice = await getTokenPrice('PEPU');
  if (pepuPrice === 0) throw new Error('Could not fetch PEPU price');
  
  // Calculate how many PEPU tokens equal this USD value
  const pepuTokenAmount = usdValue / pepuPrice;
  return ethers.parseEther(pepuTokenAmount.toString());
}

// Get best Uniswap quote across fee tiers
async function getBestQuote(amountIn, provider, targetToken) {
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
  const feeTiers = [500, 3000, 10000];
  
  let bestQuote = BigInt(0);
  let bestFee = 3000;
  
  for (const fee of feeTiers) {
    try {
      const params = {
        tokenIn: WPEPU_ADDRESS,
        tokenOut: targetToken, // Use the target token from the transaction
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: BigInt(0)
      };
      
      const result = await quoter.quoteExactInputSingle.staticCall(params);
      const amountOut = BigInt(result[0]);
      
      if (amountOut > bestQuote) {
        bestQuote = amountOut;
        bestFee = fee;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (bestQuote === BigInt(0)) {
    throw new Error('No liquidity available');
  }
  
  return { amountOut: bestQuote, fee: bestFee };
}

// Execute native PEPU swap
async function executeSwap(pepuAmount, userAddress, wallet, targetToken) {
  const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet);
  
  // Get quote
  const { amountOut, fee } = await getBestQuote(pepuAmount, wallet.provider, targetToken);
  
  // Calculate minimum output (0.5% slippage)
  const slippageBps = BigInt(50); // 0.5%
  const amountOutMin = (amountOut * (BigInt(10000) - slippageBps)) / BigInt(10000);
  
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
  
  const swapParams = {
    tokenIn: WPEPU_ADDRESS,
    tokenOut: targetToken, // Use the target token from the transaction
    fee: fee,
    recipient: userAddress,
    amountIn: pepuAmount,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: BigInt(0)
  };
  
  // Encode multicall
  const swapData = router.interface.encodeFunctionData("exactInputSingle", [swapParams]);
  const refundData = router.interface.encodeFunctionData("refundETH");
  
  // Execute swap
  const tx = await router.multicall(deadline, [swapData, refundData], {
    value: pepuAmount,
    gasLimit: 300000
  });
  
  return tx.hash;
}

// Process a transaction
async function processTransaction(txid, eventData, l1Contract, l1Wallet, l2Contract, l2Wallet) {
  try {
    console.log(`Processing: ${txid}`);
    console.log(`User: ${eventData.user}`);
    console.log(`Token: ${eventData.tokenType}`);
    
    // Check status using the txid string (now we have the real txid from the event)
    const transaction = await l1Contract.getTransaction(txid);
    console.log(`Raw transaction status value:`, transaction.status);
    console.log(`Status type:`, typeof transaction.status);
    console.log(`Status === 0:`, transaction.status === 0);
    console.log(`Status !== 0:`, transaction.status !== 0);
    
    // Convert to number to be safe
    const statusNum = Number(transaction.status);
    console.log(`Status as number: ${statusNum} (0=PENDING, 1=COMPLETED, 2=REFUNDED)`);
    
    if (statusNum !== 0) {
      console.log(`Transaction is not PENDING (status ${statusNum}), skipping`);
      return;
    }
    
    console.log('Transaction is PENDING, processing...');
    
    // Calculate USD value
    const tokenPrice = await getTokenPrice(eventData.tokenType);
    const decimals = eventData.tokenType === 'USDC' ? 6 : 18;
    const paymentAmount = Number(ethers.formatUnits(eventData.totalAmount, decimals));
    const usdValue = paymentAmount * tokenPrice;
    
    console.log(`Token price: ${tokenPrice}`);
    console.log(`Payment amount: ${paymentAmount} ${eventData.tokenType}`);
    console.log(`USD value: ${usdValue.toFixed(2)}`);
    
    // Calculate PEPU tokens equivalent to the USD value (this is what user should receive)
    const pepuTokensEquivalent = await calculatePepuTokensFromUSD(usdValue);
    console.log(`PEPU tokens equivalent: ${ethers.formatEther(pepuTokensEquivalent)}`);
    
    // Check if we need to get PEPU from L2 contract using swap function
    const contractBalance = await l2Contract.getContractBalance();
    const walletBalance = await l2Wallet.provider.getBalance(l2Wallet.address);
    console.log(`L2 contract balance: ${ethers.formatEther(contractBalance)} PEPU`);
    console.log(`Current wallet balance: ${ethers.formatEther(walletBalance)} PEPU`);
    console.log(`PEPU needed: ${ethers.formatEther(pepuTokensEquivalent)} PEPU`);
    
    if (contractBalance < pepuTokensEquivalent) {
      console.log(`ERROR: L2 contract has insufficient balance!`);
      console.log(`Contract has: ${ethers.formatEther(contractBalance)} PEPU`);
      console.log(`Need: ${ethers.formatEther(pepuTokensEquivalent)} PEPU`);
      console.log(`Shortfall: ${ethers.formatEther(pepuTokensEquivalent - contractBalance)} PEPU`);
      console.log(`Please deposit more PEPU into L2 contract: ${L2_CONTRACT_ADDRESS}`);
      return;
    }
    
    if (walletBalance < pepuTokensEquivalent) {
      console.log(`Wallet needs more PEPU. Calling swap function on L2 contract...`);
      const swapTx = await l2Contract.swap(pepuTokensEquivalent, txid);
      await swapTx.wait();
      console.log(`L2 swap complete: ${swapTx.hash}`);
      
      // Check new wallet balance
      const newWalletBalance = await l2Wallet.provider.getBalance(l2Wallet.address);
      console.log(`New wallet balance: ${ethers.formatEther(newWalletBalance)} PEPU`);
    }
    
    // Execute swap
    console.log(`Executing swap for ${eventData.user}`);
    console.log(`Target token address from providedString: ${eventData.providedString}`);
    const swapHash = await executeSwap(pepuTokensEquivalent, eventData.user, l2Wallet, eventData.providedString);
    console.log(`Swap initiated: ${swapHash}`);
    
    // Wait for confirmation
    const receipt = await l2Wallet.provider.waitForTransaction(swapHash);
    if (receipt && receipt.status === 1) {
      console.log(`Swap successful! Gas used: ${receipt.gasUsed}`);
      
      // Complete the L1 transaction
      console.log(`Completing L1 transaction: ${txid}`);
      try {
        const completeTx = await l1Contract.connect(l1Wallet).completeTransaction(txid);
        await completeTx.wait();
        console.log(`L1 transaction completed: ${completeTx.hash}`);
      } catch (completeError) {
        console.error(`Error completing L1 transaction:`, completeError);
      }
    } else {
      console.log(`Swap failed`);
    }
    
    console.log('---');
    
  } catch (error) {
    console.error(`Error processing ${txid}:`, error);
  }
}

// Scan blocks for events (with chunking)
async function scanBlocks(contract, fromBlock, toBlock) {
  const CHUNK_SIZE = 100;
  let allEvents = [];
  
  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, toBlock);
    
    try {
      // Simple query - the new contract provides the actual txid in the non-indexed parameter
      const events = await contract.queryFilter('TransactionCreated', start, end);
      allEvents = allEvents.concat(events);
    } catch (error) {
      console.error(`Error scanning blocks ${start}-${end}:`, error);
    }
  }
  
  return allEvents;
}

// Main function
async function startInitiator() {
  console.log('Starting Penk Market Initiator...');
  console.log(`L1 Contract: ${L1_CONTRACT_ADDRESS}`);
  console.log(`L2 Contract: ${L2_CONTRACT_ADDRESS}`);
  console.log('');

  // Setup
  const l1Provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const l1Wallet = new ethers.Wallet(VERIFIER_KEY, l1Provider);
  const l1Contract = new ethers.Contract(L1_CONTRACT_ADDRESS, L1_ABI, l1Provider);
  
  const l2Provider = new ethers.JsonRpcProvider(PEPU_V2_RPC_URL);
  const l2Wallet = new ethers.Wallet(VERIFIER_KEY, l2Provider);
  const l2Contract = new ethers.Contract(L2_CONTRACT_ADDRESS, L2_ABI, l2Wallet);

  console.log(`Verifier Wallet: ${l1Wallet.address}`);
  console.log(`L1 Balance: ${ethers.formatEther(await l1Provider.getBalance(l1Wallet.address))} ETH`);
  console.log(`L2 Balance: ${ethers.formatEther(await l2Provider.getBalance(l2Wallet.address))} PEPU`);
  console.log(`Contract Balance: ${ethers.formatEther(await l2Contract.getContractBalance())} PEPU`);
  console.log('');

  // Scan past 100 blocks
  try {
    console.log('Scanning past 100 blocks...');
    const currentBlock = await l1Provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100);
    
    const events = await scanBlocks(l1Contract, fromBlock, currentBlock);
    console.log(`Found ${events.length} past events`);
    
    for (const event of events) {
      if (event.args) {
        // With the new contract, use the non-indexed txid parameter (second parameter)
        const txid = event.args.txid; // This is the actual generated txid string
        
        const eventData = {
          user: event.args.user,
          tokenType: event.args.tokenType,
          amount: event.args.amount,
          penkBonus: event.args.penkBonus,
          totalAmount: event.args.totalAmount,
          providedString: event.args.providedString
        };
        
        await processTransaction(txid, eventData, l1Contract, l1Wallet, l2Contract, l2Wallet);
      }
    }
  } catch (error) {
    console.error('Error scanning past blocks:', error);
  }

  // Listen for new events
  console.log('Listening for new events...');
  l1Contract.on('TransactionCreated', async (txidIndexed, txid, user, providedString, amount, penkBonus, totalAmount, tokenType, timestamp) => {
    // Use the non-indexed txid parameter (second parameter)
    const eventData = {
      user,
      tokenType,
      amount,
      penkBonus,
      totalAmount,
      providedString
    };
    
    await processTransaction(txid, eventData, l1Contract, l1Wallet, l2Contract, l2Wallet);
  });

  // Periodic polling every 5 seconds
  setInterval(async () => {
    try {
      console.log('Polling for new transactions...');
      const currentBlock = await l1Provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10); // Check recent blocks only
      
      const events = await scanBlocks(l1Contract, fromBlock, currentBlock);
      
      if (events.length > 0) {
        console.log(`Found ${events.length} events in recent blocks`);
        
        for (const event of events) {
          if (event.args) {
            // With the new contract, use the non-indexed txid parameter (second parameter)
            const txid = event.args.txid; // This is the actual generated txid string
            
            const eventData = {
              user: event.args.user,
              tokenType: event.args.tokenType,
              amount: event.args.amount,
              penkBonus: event.args.penkBonus,
              totalAmount: event.args.totalAmount,
              providedString: event.args.providedString
            };
            
            await processTransaction(txid, eventData, l1Contract, l1Wallet, l2Contract, l2Wallet);
          }
        }
      } else {
        console.log('No new events found');
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 5000); // Poll every 5 seconds

  console.log('Initiator running. Press Ctrl+C to stop.');
}

// Error handling
process.on('SIGINT', () => {
  console.log('\nStopping...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
});

// Run the initiator
startInitiator().catch(console.error);