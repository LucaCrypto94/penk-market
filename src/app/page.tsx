"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, Wallet, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect } from 'wagmi';

export default function PenkMarket() {
  const [fromAmount, setFromAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('SPRING');
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  const fromTokens = ['ETH', 'USDC', 'PEPU'];
  const toTokens = ['SPRING', 'PENK'];

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    address,
  });
  const { disconnect } = useDisconnect();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Temporarily disabled to fix dropdown functionality
      // if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
      //   setFromDropdownOpen(false);
      // }
      // if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
      //   setToDropdownOpen(false);
      // }
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFromTokenSelect = (token: string) => {
    console.log('Selecting from token:', token);
    setFromToken(token);
    setFromDropdownOpen(false);
  };

  const handleToTokenSelect = (token: string) => {
    console.log('Selecting to token:', token);
    setToToken(token);
    setToDropdownOpen(false);
  };

  const toggleFromDropdown = () => {
    console.log('Toggling from dropdown, current state:', fromDropdownOpen);
    const newState = !fromDropdownOpen;
    console.log('Setting from dropdown to:', newState);
    setFromDropdownOpen(newState);
  };

  const toggleToDropdown = () => {
    console.log('Toggling to dropdown, current state:', toDropdownOpen);
    const newState = !toDropdownOpen;
    console.log('Setting to dropdown to:', newState);
    setToDropdownOpen(newState);
  };

  const toggleWalletDropdown = () => {
    setWalletDropdownOpen(!walletDropdownOpen);
  };

  // Format balance for display
  const formatBalance = (balance: any, token: string) => {
    if (!balance || !isConnected) return `0.00 ${token}`;
    
    if (token === 'ETH') {
      return `${parseFloat(balance.formatted).toFixed(4)} ${token}`;
    }
    
    // Mock balances for other tokens
    const mockBalances: { [key: string]: string } = {
      'USDC': '1250.00',
      'PEPU': '121500.00',
      'SPRING': '0.00',
      'PENK': '0.00'
    };
    
    return `${mockBalances[token] || '0.00'} ${token}`;
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            {/* Debug info - hidden on mobile */}
            <div className="hidden sm:block text-xs text-gray-500 mt-2">
              From dropdown: {fromDropdownOpen ? 'OPEN' : 'CLOSED'} | 
              To dropdown: {toDropdownOpen ? 'OPEN' : 'CLOSED'}
            </div>
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
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-xl sm:text-2xl outline-none w-full"
                  />
                  <div className="relative" ref={fromDropdownRef}>
                    <button 
                      onClick={toggleFromDropdown}
                      className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-600 hover:border-yellow-400 transition-colors"
                    >
                      <span className="text-white font-medium">{fromToken}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${fromDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {fromDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px] w-full sm:w-auto">
                        <div className="p-2 border-b border-gray-600">
                          <button 
                            onClick={() => setFromDropdownOpen(false)}
                            className="text-yellow-400 text-sm hover:text-yellow-300"
                          >
                            ✕ Close
                          </button>
                        </div>
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
                  Balance: {formatBalance(ethBalance, fromToken)}
                </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-xl sm:text-2xl text-white">
                    {fromAmount ? (parseFloat(fromAmount) * 121500).toLocaleString() : '0.0'}
                  </div>
                  <div className="relative" ref={toDropdownRef}>
                    <button 
                      onClick={toggleToDropdown}
                      className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-600 hover:border-yellow-400 transition-colors"
                    >
                      <span className="text-white font-medium">{toToken}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${toDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {toDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px] w-full sm:w-auto">
                        <div className="p-2 border-b border-gray-600">
                          <button 
                            onClick={() => setToDropdownOpen(false)}
                            className="text-yellow-400 text-sm hover:text-yellow-300"
                          >
                            ✕ Close
                          </button>
                        </div>
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
                <div className="text-xs text-gray-500 mt-2">
                  Balance: {formatBalance(null, toToken)}
                </div>
              </div>
            </div>

            {/* Rate Info */}
            <div className="bg-black border border-gray-700 rounded-lg p-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">1 ETH = 121,500 PEPU</span>
              </div>
            </div>

            {/* Connect/Swap Button */}
            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">Connect your wallet to start trading</p>
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
                        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
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
                className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Swap
              </button>
            )}
          </div>

          {/* Simple Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-yellow-400 font-bold text-sm sm:text-base">$0.008234</div>
              <div className="text-xs text-gray-400">PEPU Price</div>
            </div>
            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-green-400 font-bold text-sm sm:text-base">+12.45%</div>
              <div className="text-xs text-gray-400">24h Change</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}