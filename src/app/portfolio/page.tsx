"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAccount, useBalance, useBlockNumber, useDisconnect } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { erc20Abi, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { ArrowUpRight, ArrowDownRight, ArrowDownLeft, ArrowUp, ArrowDown, ChevronDown, Menu, X, Wallet, Clock } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Fetch token prices from our API route
const fetchTokenPrices = async () => {
  try {
    const response = await fetch('/api/prices');
    const result = await response.json();
    
    if (result.success) {
      const prices: Record<string, { price: number; change24h: number }> = {};
      result.data.forEach((token: any) => {
        prices[token.symbol] = {
          price: token.price,
          change24h: token.change24h
        };
      });
      return prices;
    }
    return {};
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
};

// Token addresses from environment variables
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const PEPU_ADDRESS = process.env.NEXT_PUBLIC_PEPU_ADDRESS as `0x${string}`;

// Token type definition
type TokenConfig = {
  symbol: string;
  decimals: number;
  address?: `0x${string}`;
};

// Token configurations
const TOKENS: Record<string, TokenConfig> = {
  ETH: {
    symbol: 'ETH',
    decimals: 18,
  },
  USDC: {
    address: USDC_ADDRESS,
    symbol: 'USDC',
    decimals: 6,
  },
  PEPU: {
    address: PEPU_ADDRESS,
    symbol: 'PEPU',
    decimals: 18,
  },
};

type Transaction = {
  hash: string;
  timestamp: number;
  type: 'in' | 'out';
  token: string;
  amount: string;
  from: string;
  to: string;
};

interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  price: number;
  rawPrice?: string;
  change24h: number;
};

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const { data: blockNumber } = useBlockNumber();
  const { disconnect } = useDisconnect();

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleWalletDropdown = () => {
    setWalletDropdownOpen(!walletDropdownOpen);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create a single public client instance
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  });

  // Fetch token balances with real prices
  const fetchBalances = async () => {
    if (!address) return;
    setLoading(true);

    try {
      const balances: Record<string, TokenBalance> = {};
      
      // Fetch all token prices
      const prices = await fetchTokenPrices();
      
      // Fetch ETH balance
      const ethBalance = await publicClient.getBalance({ address });
      const ethBalanceFormatted = formatEther(ethBalance);
      const ethPrice = prices['ETH'] || { price: 0, change24h: 0 };
      const ethValue = parseFloat(ethBalanceFormatted) * ethPrice.price;
      
      balances.ETH = {
        symbol: 'ETH',
        balance: ethBalanceFormatted,
        value: ethValue,
        price: ethPrice.price,
        change24h: ethPrice.change24h,
      };

      // Fetch ERC20 token balances
      for (const [key, token] of Object.entries(TOKENS)) {
        if (key === 'ETH' || !token.address) continue;
        
        try {
          const balance = await publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          });

          const balanceFormatted = formatUnits(balance, token.decimals);
          const tokenData = prices[token.symbol] || { price: 0, change24h: 0 };
          const tokenValue = parseFloat(balanceFormatted) * tokenData.price;
          
          balances[key] = {
            symbol: token.symbol,
            balance: balanceFormatted,
            value: tokenValue,
            price: tokenData.price,
            change24h: tokenData.change24h,
          };
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          // Add token with zero balance if there's an error
          balances[key] = {
            symbol: token.symbol,
            balance: '0',
            value: 0,
            price: 0,
            change24h: 0,
          };
        }
      }

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history (simplified mock implementation)
  const fetchTransactions = async () => {
    if (!address) return;
    
    try {
      // Mock transactions for demonstration
      const mockTransactions: Transaction[] = [
        {
          hash: '0x123...',
          timestamp: Date.now() - 3600000, // 1 hour ago
          type: 'in',
          token: 'USDC',
          amount: '100.00',
          from: '0x456...',
          to: address,
        },
        {
          hash: '0x789...',
          timestamp: Date.now() - 7200000, // 2 hours ago
          type: 'out',
          token: 'PEPU',
          amount: '5000.00',
          from: address,
          to: '0xabc...',
        },
        {
          hash: '0xabc...',
          timestamp: Date.now() - 10800000, // 3 hours ago
          type: 'in',
          token: 'ETH',
          amount: '0.1',
          from: '0xdef...',
          to: address,
        },
        // Add more mock transactions as needed
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch data on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, blockNumber]);

  // Helper to get price with fallback
  const getTokenPrice = (token: TokenBalance): number => {
    return token.rawPrice ? parseFloat(token.rawPrice) : token.price;
  };

  // Calculate total portfolio value with full precision
  const totalValue = Object.values(tokenBalances).reduce(
    (sum, token) => {
      const balance = parseFloat(token.balance);
      const price = getTokenPrice(token);
      const tokenValue = balance * price;
      return sum + (isNaN(tokenValue) ? 0 : tokenValue);
    },
    0
  );
  
  // Calculate 24h change (weighted average of all tokens' changes)
  const portfolio24hChange = Object.values(tokenBalances).reduce<number>(
    (acc, token) => {
      const balance = parseFloat(token.balance);
      const price = getTokenPrice(token);
      const tokenValue = balance * price;
      if (isNaN(tokenValue) || tokenValue === 0) return acc;
      const weight = tokenValue / totalValue;
      return acc + (token.change24h * weight);
    },
    0
  );
  
  // Format number with appropriate decimal places
  const formatNumber = (value: number, maxDecimals = 8) => {
    if (value === 0) return '0';
    if (value < 0.000001) return value.toExponential(4);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Header component
  const Header = () => (
    <header className="bg-[#0a0a0a] border-b border-yellow-400 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="text-yellow-400 font-bold text-xl sm:text-2xl">Penk Market</span>
          </a>
        </div>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
            Market
          </a>
          <a href="/portfolio" className="text-yellow-400 font-medium">
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
        
        {/* Wallet Connection */}
        <div className="hidden sm:block">
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <div className="relative" ref={walletDropdownRef}>
              <button
                onClick={toggleWalletDropdown}
                className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              >
                <Wallet className="w-4 h-4" />
                {formatAddress(address!)}
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
            <a href="/" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium px-4 py-2">
              Market
            </a>
            <a href="/portfolio" className="text-yellow-400 font-medium px-4 py-2">
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
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="w-full bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </button>
                  )}
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
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center p-4 h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect your wallet to view your portfolio</h2>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-6 text-yellow-400">My Portfolio</h1>
        
        {/* Portfolio Summary */}
        <div className="bg-[#0a0a0a] border border-yellow-400 rounded-xl p-4 sm:p-5 mb-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-400">Portfolio Value</h2>
            <button 
              onClick={fetchBalances}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '⟳ Refresh'}
            </button>
          </div>
          <div className="text-3xl font-bold mb-1">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center text-sm ${portfolio24hChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <span>{portfolio24hChange >= 0 ? '↑' : '↓'} {Math.abs(portfolio24hChange).toFixed(2)}% (24h)</span>
          </div>
        </div>

        {/* Token Balances */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Assets</h2>
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium text-gray-400 border-b border-gray-800">
              <div className="col-span-6">Asset</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Value</div>
            </div>
            {Object.entries(tokenBalances).map(([key, token]) => (
              <div key={key} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 hover:bg-[#111111] transition-colors">
                <div className="col-span-6 flex items-center">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center mr-2">
                    <span className="text-black font-bold text-sm">{token.symbol[0]}</span>
                  </div>
                  <span className="font-medium text-sm">{token.symbol}</span>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm">
                    {parseFloat(token.balance).toLocaleString('en-US', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: token.symbol === 'PEPU' ? 8 : 4 
                    })}
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm">
                    ${token.symbol === 'PEPU'
                      ? getTokenPrice(token).toFixed(8)
                      : getTokenPrice(token).toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 6 
                        })
                    }
                  </div>
                  <div className={`text-xs ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(token.change24h.toString())).toFixed(2)}%
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="font-medium">
                    ${token.value < 0.01 && token.value > 0 
                      ? token.value.toExponential(4) 
                      : token.value.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: token.value < 1 ? 6 : 2 
                        })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-3">Recent Transactions</h2>
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
            {transactions.length > 0 ? (
              <>
                <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium text-gray-400 border-b border-gray-800">
                  <div className="col-span-7">Transaction</div>
                  <div className="col-span-3 text-right">Amount</div>
                  <div className="col-span-2 text-right">Time</div>
                </div>
                {transactions.map((tx, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 p-3 border-b border-gray-800 hover:bg-[#111111] transition-colors text-sm">
                    <div className="col-span-7 flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${tx.type === 'in' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {tx.type === 'in' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div>
                        <div className="font-medium">
                          {tx.type === 'in' ? 'Received' : 'Sent'} {tx.token}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">
                          {tx.type === 'in' ? 'From' : 'To'} {tx.type === 'in' ? tx.from : tx.to}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className={`font-medium ${tx.type === 'in' ? 'text-green-400' : 'text-white'}`}>
                        {tx.type === 'in' ? '+' : '-'}{tx.amount} {tx.token}
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-xs text-gray-400">
                      <div className="flex items-center justify-end">
                        <Clock size={12} className="mr-1" />
                        {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div>{new Date(tx.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
