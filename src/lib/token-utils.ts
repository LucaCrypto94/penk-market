import { readFileSync } from 'fs';
import { join } from 'path';

export interface Token {
  symbol: string;
  path: string;
  note?: string;
}

export interface Network {
  name: string;
  path: string;
  tokens: Token[];
}

export interface TokenData {
  networks: {
    l1: Network;
    pepeUnchained: Network;
  };
  links: {
    [key: string]: string;
  };
}

export function getTokenData(): TokenData {
  try {
    const filePath = join(process.cwd(), 'tokens.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading tokens.json:', error);
    throw new Error('Failed to read token configuration');
  }
}

export function getAllTokens(): Token[] {
  const tokenData = getTokenData();
  return [
    ...tokenData.networks.l1.tokens,
    ...tokenData.networks.pepeUnchained.tokens
  ];
}

export function getTokensByNetwork(networkKey: 'l1' | 'pepeUnchained'): Token[] {
  const tokenData = getTokenData();
  return tokenData.networks[networkKey].tokens;
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  const allTokens = getAllTokens();
  return allTokens.find(token => token.symbol === symbol);
}

export function getFromTokens(): string[] {
  // From tokens are the L1 tokens (ETH, USDC, PEPU)
  return getTokensByNetwork('l1').map(token => token.symbol);
}

export function getToTokens(): string[] {
  // To tokens are the Pepe Unchained tokens (SPRING, PENK)
  return getTokensByNetwork('pepeUnchained').map(token => token.symbol);
} 