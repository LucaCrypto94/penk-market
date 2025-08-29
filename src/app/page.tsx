"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, Wallet, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { getToTokenAddress } from '@/lib/token-utils';

export default function PenkMarket() {
  const [fromAmount, setFromAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('SPRING');
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fromTokens, setFromTokens] = useState(['ETH', 'USDC', 'PEPU']); // Default fallback
  const [toTokens, setToTokens] = useState(['SPRING', 'PENK']); // Default fallback
  const [usdValue, setUsdValue] = useState<number>(0);
  const [equivalentAmount, setEquivalentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [penkBonus, setPenkBonus] = useState<number>(0);
  const [totalUsdValue, setTotalUsdValue] = useState<number>(0);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // ETH balance
  const { data: ethBalance } = useBalance({
    address,
  });

  // USDC and PEPU balances
  const { data: usdcBalance } = useBalance({
    address,
    token: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  });
  
  const { data: pepuBalance } = useBalance({
    address,
    token: process.env.NEXT_PUBLIC_PEPU_ADDRESS as `0x${string}`,
  });

  // Contract addresses
  const L1_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_L1_CONTRACT_ADDRESS as `0x${string}`;
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
  const PEPU_ADDRESS = process.env.NEXT_PUBLIC_PEPU_ADDRESS as `0x${string}`;

  // Contract write functions
  const { writeContract: buyWithETH, data: ethTxData, isPending: isEthPending } = useWriteContract();

  const { writeContract: buyWithUSDC, data: usdcTxData, isPending: isUsdcPending } = useWriteContract();

  const { writeContract: buyWithPEPU, data: pepuTxData, isPending: isPepuPending } = useWriteContract();

  // USDC approval
  const { writeContract: approveUSDC, data: usdcApprovalData, isPending: isUsdcApprovalPending } = useWriteContract();

  // PEPU approval
  const { writeContract: approvePEPU, data: pepuApprovalData, isPending: isPepuApprovalPending } = useWriteContract();

  // Wait for transactions
  const { isLoading: isEthTxLoading } = useWaitForTransactionReceipt({ hash: ethTxData });
  const { isLoading: isUsdcTxLoading } = useWaitForTransactionReceipt({ hash: usdcTxData });
  const { isLoading: isPepuTxLoading } = useWaitForTransactionReceipt({ hash: pepuTxData });
  const { isLoading: isUsdcApprovalLoading } = useWaitForTransactionReceipt({ hash: usdcApprovalData });
  const { isLoading: isPepuApprovalLoading } = useWaitForTransactionReceipt({ hash: pepuApprovalData });



  // Fetch available tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/tokens');
        const data = await response.json();
        if (data.success) {
          if (data.fromTokens) {
            setFromTokens(data.fromTokens);
            if (data.fromTokens.length > 0) {
              setFromToken(data.fromTokens[0]);
            }
          }
          if (data.toTokens) {
            setToTokens(data.toTokens);
            if (data.toTokens.length > 0) {
              setToToken(data.toTokens[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      }
    };

    fetchTokens();
  }, []);

  const handleFromTokenSelect = (token: string) => {
    setFromToken(token);
    setFromDropdownOpen(false);
    // Reset amount when changing token
    setFromAmount('');
    setUsdValue(0);
    setEquivalentAmount('');
    setPenkBonus(0);
    setTotalUsdValue(0);
  };

  const handleToTokenSelect = (token: string) => {
    setToToken(token);
    setToDropdownOpen(false);
    // Reset equivalent amount when changing target token
    setEquivalentAmount('');
    setPenkBonus(0);
    setTotalUsdValue(0);
  };

  const toggleFromDropdown = () => {
    setFromDropdownOpen(!fromDropdownOpen);
    setToDropdownOpen(false);
  };

  const toggleToDropdown = () => {
    setToDropdownOpen(!toDropdownOpen);
    setFromDropdownOpen(false);
  };

  const getCurrentBalance = () => {
    if (!isConnected) return '0';
    
    if (fromToken === 'ETH') {
      return ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0';
    } else if (fromToken === 'USDC') {
      return usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0';
    } else if (fromToken === 'PEPU') {
      return pepuBalance ? parseFloat(pepuBalance.formatted).toFixed(2) : '0';
    }
    // For any other tokens, return 0 for now
    return '0';
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    const currentBalance = parseFloat(getCurrentBalance());
    
    if (numValue > currentBalance) {
      // Cap at max balance
      setFromAmount(currentBalance.toString());
    } else {
      setFromAmount(value);
    }
  };

  const getMaxAmount = () => {
    const balance = getCurrentBalance();
    setFromAmount(balance);
  };

  const handleGetQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setIsLoading(true);
    
    try {
      console.log('Getting quote for:', { fromToken, fromAmount, toToken });
      
      // Call the quote API
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          fromAmount,
          toToken
        })
      });

      const data = await response.json();
      console.log('Quote API response:', data);
      
      if (data.success) {
        // Update the TO field with the quote result
        const tokensReceived = data.data.tokensReceived;
        const inputUsdValue = data.data.inputUsdValue;
        const penkBonusAmount = data.data.penkBonus;
        const totalUsdValueAmount = data.data.totalUsdValue;
        console.log('Setting equivalent amount to:', tokensReceived);
        console.log('Setting USD value to:', inputUsdValue);
        console.log('Setting PenkBonus to:', penkBonusAmount);
        console.log('Setting total USD value to:', totalUsdValueAmount);
        setEquivalentAmount(tokensReceived.toString());
        setUsdValue(inputUsdValue);
        setPenkBonus(penkBonusAmount);
        setTotalUsdValue(totalUsdValueAmount);
      } else {
        console.error('Quote API error:', data.error);
        // Just update with 0 if there's an error
        setEquivalentAmount('0.0');
      }
      
    } catch (error) {
      console.error('Error getting quote:', error);
      // Just update with 0 if there's an error
      setEquivalentAmount('0.0');
    } finally {
      setIsLoading(false);
    }
  };

  // Gas estimation helper function
  const estimateGas = (baseGas: number, multiplier: number = 1.2) => {
    return Math.ceil(baseGas * multiplier);
  };

  const executeTransaction = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !equivalentAmount) return;
    
    setIsExecuting(true);
    setTxStatus('Preparing transaction...');
    
    try {
      const amount = parseFloat(fromAmount);
      
      // Get the actual contract address for the TO token using the utility function
      const toTokenAddress = getToTokenAddress(toToken);
      if (!toTokenAddress) {
        throw new Error(`Could not get address for TO token: ${toToken}`);
      }
      
      // The providedString should be the TO token address, not a descriptive string
      const providedString = toTokenAddress;
      
      // Debug logging to see what's actually being sent
      console.log('=== DEBUG INFO ===');
      console.log('Selected TO token:', toToken);
      console.log('TO token address:', toTokenAddress);
      console.log('Final providedString:', providedString);
      console.log('==================');
      
      // Dynamic gas limit configurations with safety margins
      const gasLimits = {
        ETH: estimateGas(500000, 2.0),      // ETH transactions with 100% safety margin
        USDC: estimateGas(600000, 2.5),     // ERC20 approval + contract call with 150% safety margin
        PEPU: estimateGas(600000, 2.5)      // ERC20 approval + contract call with 150% safety margin
      };
      
      if (fromToken === 'ETH') {
        // Buy with ETH
        setTxStatus('Executing ETH transaction...');
        await buyWithETH({
          address: L1_CONTRACT_ADDRESS,
          abi: [
            {
              "inputs": [{"internalType": "string", "name": "providedString", "type": "string"}],
              "name": "buy",
              "outputs": [],
              "stateMutability": "payable",
              "type": "function"
            }
          ],
          functionName: 'buy',
          args: [providedString],
          value: parseEther(fromAmount),
          gas: BigInt(gasLimits.ETH)
        });
        setTxStatus('ETH transaction submitted!');
        
      } else if (fromToken === 'USDC') {
        // Buy with USDC
        setTxStatus('Approving USDC...');
        await approveUSDC({
          address: USDC_ADDRESS,
          abi: [
            {
              "inputs": [
                {"internalType": "address", "name": "spender", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
              ],
              "name": "approve",
              "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'approve',
          args: [L1_CONTRACT_ADDRESS, parseUnits(fromAmount, 6)],
          gas: BigInt(estimateGas(200000, 2.0)) // ERC20 approval with 100% safety margin
        });
        
        setTxStatus('USDC approved, executing transaction...');
        await buyWithUSDC({
          address: L1_CONTRACT_ADDRESS,
          abi: [
            {
              "inputs": [
                {"internalType": "string", "name": "providedString", "type": "string"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
              ],
              "name": "buyWithUSDC",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'buyWithUSDC',
          args: [providedString, parseUnits(fromAmount, 6)],
          gas: BigInt(gasLimits.USDC)
        });
        setTxStatus('USDC transaction submitted!');
        
      } else if (fromToken === 'PEPU') {
        // Buy with PEPU
        setTxStatus('Approving PEPU...');
        await approvePEPU({
          address: PEPU_ADDRESS,
          abi: [
            {
              "inputs": [
                {"internalType": "address", "name": "spender", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
              ],
              "name": "approve",
              "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'approve',
          args: [L1_CONTRACT_ADDRESS, parseUnits(fromAmount, 18)],
          gas: BigInt(estimateGas(200000, 2.0)) // ERC20 approval with 100% safety margin
        });
        
        setTxStatus('PEPU approved, executing transaction...');
        await buyWithPEPU({
          address: L1_CONTRACT_ADDRESS,
          abi: [
            {
              "inputs": [
                {"internalType": "string", "name": "providedString", "type": "string"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
              ],
              "name": 'buyWithPEPU',
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'buyWithPEPU',
          args: [providedString, parseUnits(fromAmount, 18)],
          gas: BigInt(gasLimits.PEPU)
        });
        setTxStatus('PEPU transaction submitted!');
      }
      
    } catch (error) {
      console.error('Transaction error:', error);
      setTxStatus('Transaction failed. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-yellow-400 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="text-yellow-400 font-bold text-xl sm:text-2xl">Penk Market</span>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Market
            </a>
            <a href="/portfolio" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Portfolio
            </a>
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Analytics
            </a>
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Docs
            </a>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-yellow-400 hover:bg-[#111111] rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {/* Custom Connect Button */}
          <div className="hidden sm:block">
            {!isConnected ? (
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  return (
                    <button
                      onClick={openConnectModal}
                      className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                  <ChevronDown className={`w-3 h-3 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Wallet Dropdown Menu */}
                {walletDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[200px]">
                    <div className="p-3 border-b border-gray-600">
                      <div className="text-white text-sm font-medium">Connected Wallet</div>
                      <div className="text-gray-400 text-xs">{address}</div>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-[#111111] transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
            <nav className="flex flex-col gap-4 pt-4">
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium px-4 py-2">
                Market
              </a>
              <a href="/portfolio" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium px-4 py-2">
                Portfolio
              </a>
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium px-4 py-2">
                Analytics
              </a>
              <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium px-4 py-2">
                Docs
              </a>
              
              {/* Mobile Connect Button */}
              <div className="px-4 pt-2">
                {!isConnected ? (
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      mounted,
                    }) => {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="w-full bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                          <Wallet className="w-5 h-5" />
                          Connect Wallet
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-[#111111] rounded-lg p-3">
                      <div className="text-white text-sm font-medium">Connected Wallet</div>
                      <div className="text-gray-400 text-xs break-all">{address}</div>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md px-2 sm:px-0">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">Penk Market</h1>
            <p className="text-gray-400 text-sm">Buy coins on Sepolia Testnet</p>
          </div>

          {/* Main Trading Card */}
          <div className="bg-[#0a0a0a] border border-yellow-400 rounded-xl p-4 sm:p-6">
            {/* From Section */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">From</div>
              <div className="bg-black border border-gray-700 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    disabled={!isConnected}
                    className="bg-transparent text-xl sm:text-2xl outline-none w-full text-white"
                  />
                  <div className="relative">
                    <button 
                      onClick={toggleFromDropdown}
                      disabled={!isConnected}
                      className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-lg border transition-colors bg-[#0a0a0a] border-gray-600 hover:border-yellow-400"
                    >
                      <span className="text-white font-medium">
                        {fromToken}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {fromDropdownOpen && isConnected && (
                      <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px] w-full sm:w-auto">
                        {fromTokens.map((token) => (
                          <button
                            key={token}
                            onClick={() => handleFromTokenSelect(token)}
                            className={`w-full text-left px-3 py-2 hover:bg-[#111111] transition-colors ${
                              fromToken === token ? 'text-yellow-400 bg-[#111111]' : 'text-white'
                            }`}
                          >
                            {token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Balance: {getCurrentBalance()} {fromToken}
                </div>
                <button
                  onClick={getMaxAmount}
                  className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500 transition-colors mt-1"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-4">
              <button className="bg-[#111111] p-2 rounded-full border border-gray-700 hover:border-yellow-400 transition-colors">
                <ArrowUpDown className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* To Section */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">To</div>
              <div className="bg-black border border-gray-700 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  {/* Token Selection */}
                  <div className="flex items-center justify-between">
                  <div className="text-xl sm:text-2xl text-white">
                      {isLoading ? 'Calculating...' : (equivalentAmount ? equivalentAmount : '0.0')}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={toggleToDropdown}
                      disabled={!isConnected}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors bg-[#0a0a0a] border-gray-600 hover:border-yellow-400"
                    >
                      <span className="text-white font-medium">
                        {toToken}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {toDropdownOpen && isConnected && (
                        <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px]">
                        {toTokens.map((token) => (
                          <button
                            key={token}
                            onClick={() => handleToTokenSelect(token)}
                            className={`w-full text-left px-3 py-2 hover:bg-[#111111] transition-colors ${
                              toToken === token ? 'text-yellow-400 bg-[#111111]' : 'text-white'
                            }`}
                          >
                            {token}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  
                                                         {/* Quote Details */}
                    {equivalentAmount && !isLoading && (
                      <div className="bg-[#0a0a0a] border border-gray-600 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">You Pay:</span>
                          <span className="text-white">{fromAmount} {fromToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">You Receive:</span>
                          <span className="text-white">{equivalentAmount} {toToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">From Token Price:</span>
                          <span className="text-white">${usdValue > 0 ? (usdValue / parseFloat(fromAmount)).toFixed(6) : '0.00'} per {fromToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">PenkBonus:</span>
                          <span className="text-yellow-400">+${penkBonus.toFixed(2)} (2%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Value:</span>
                          <span className="text-white">≈ ${totalUsdValue.toFixed(2)}</span>
                        </div>
                        
                        {/* Transaction Status */}
                        {txStatus && (
                          <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/50 rounded text-xs text-blue-300">
                            {txStatus}
                          </div>
                        )}
                        
                        {/* Execute Button */}
                        <button
                          onClick={executeTransaction}
                          disabled={isExecuting || isEthPending || isUsdcPending || isPepuPending || isUsdcApprovalPending || isPepuApprovalPending}
                          className={`w-full mt-3 font-bold py-2 rounded-lg transition-colors ${
                            isExecuting || isEthPending || isUsdcPending || isPepuPending || isUsdcApprovalPending || isPepuApprovalPending
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isExecuting || isEthPending || isUsdcPending || isPepuPending || isUsdcApprovalPending || isPepuApprovalPending ? (
                            <div className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Executing...</span>
                            </div>
                          ) : (
                            'Execute Transaction'
                          )}
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {isConnected && !equivalentAmount && fromAmount && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-400">Click "Get Quote" to see the exchange rate</p>
              </div>
            )}

            {/* Connect/Swap Button */}
            {!isConnected ? (
              <div className="text-center">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="w-full bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-5 h-5" />
                        Connect Wallet
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            ) : (
              <button
                onClick={handleGetQuote}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isLoading}
                className={`w-full font-bold py-3 rounded-lg transition-colors ${
                  !fromAmount || parseFloat(fromAmount) <= 0 || isLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-400 text-black hover:bg-yellow-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Getting Quote...</span>
                  </div>
                ) : (
                  'Get Quote'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}