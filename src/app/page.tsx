"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';

export default function PenkMarket() {
  const [fromAmount, setFromAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('SPRING');
  const [isConnected, setIsConnected] = useState(false);
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);

  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  const fromTokens = ['ETH', 'USDC', 'PEPU'];
  const toTokens = ['SPRING', 'PENK'];

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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-yellow-400 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">P</span>
            </div>
            <span className="text-yellow-400 font-bold text-2xl">Penk Market</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Market
            </a>
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Portfolio
            </a>
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Analytics
            </a>
            <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Docs
            </a>
          </nav>
          
          <button
            onClick={() => setIsConnected(!isConnected)}
            className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl"
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">Penk Market</h1>
            <p className="text-gray-400 text-sm">Buy coins on Pepe Unchained Layer 2</p>
            {/* Debug info */}
            <div className="text-xs text-gray-500 mt-2">
              From dropdown: {fromDropdownOpen ? 'OPEN' : 'CLOSED'} | 
              To dropdown: {toDropdownOpen ? 'OPEN' : 'CLOSED'}
            </div>
          </div>

          {/* Main Trading Card */}
          <div className="bg-[#0a0a0a] border border-yellow-400 rounded-xl p-6">
            {/* From Section */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">From</div>
              <div className="bg-black border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-2xl outline-none w-full"
                  />
                  <div className="relative" ref={fromDropdownRef}>
                    <button 
                      onClick={toggleFromDropdown}
                      className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-600 hover:border-yellow-400 transition-colors"
                    >
                      <span className="text-white font-medium">{fromToken}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${fromDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {fromDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px]">
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
                  Balance: {isConnected ? `2.45 ${fromToken}` : `0.00 ${fromToken}`}
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
              <div className="bg-black border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-2xl text-white">
                    {fromAmount ? (parseFloat(fromAmount) * 121500).toLocaleString() : '0.0'}
                  </div>
                  <div className="relative" ref={toDropdownRef}>
                    <button 
                      onClick={toggleToDropdown}
                      className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-600 hover:border-yellow-400 transition-colors"
                    >
                      <span className="text-white font-medium">{toToken}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${toDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {toDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg shadow-xl z-50 min-w-[120px]">
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
                  Balance: {isConnected ? `0.00 ${toToken}` : `0.00 ${toToken}`}
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
            <button
              onClick={() => setIsConnected(!isConnected)}
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              {isConnected ? 'Swap' : 'Connect Wallet'}
            </button>
          </div>

          {/* Simple Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-yellow-400 font-bold">$0.008234</div>
              <div className="text-xs text-gray-400">PEPU Price</div>
            </div>
            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-green-400 font-bold">+12.45%</div>
              <div className="text-xs text-gray-400">24h Change</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}