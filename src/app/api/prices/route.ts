import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GECKO_TERMINAL_API = 'https://api.geckoterminal.com/api/v2';

// Token addresses and their GeckoTerminal network paths
const TOKENS = [
  { 
    symbol: 'ETH',
    path: 'networks/eth/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH address
  },
  { 
    symbol: 'USDC',
    path: 'networks/eth/tokens/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  { 
    symbol: 'PEPU',
    path: 'networks/eth/pools/0xb1b10b05aa043dd8d471d4da999782bc694993e3ecbe8e7319892b261b412ed5' // PEPU/WETH pool
  }
];

export async function GET() {
  try {
    const prices = await Promise.all(
      TOKENS.map(async (token) => {
        try {
          const url = `${GECKO_TERMINAL_API}/${token.path}`;
          console.log(`Fetching ${token.symbol} price from:`, url);
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`${token.symbol} API response:`, JSON.stringify(data, null, 2));
          
          if (!data.data || !data.data.attributes) {
            throw new Error('Invalid response format');
          }
          
          let price: number;
          let change24h: number;
          let rawPrice: string;
          
          if (token.symbol === 'PEPU') {
            // Handle PEPU pool data
            const attributes = data.data.attributes;
            price = parseFloat(attributes.base_token_price_usd);
            change24h = parseFloat(attributes.price_change_percentage?.h24 || '0');
            rawPrice = price.toFixed(8);
          } else {
            // Handle other tokens (like ETH)
            const attributes = data.data.attributes;
            price = parseFloat(attributes.price_usd);
            change24h = parseFloat(attributes.price_change_percentage?.usd_24h || '0');
            rawPrice = price.toFixed(8);
          }
          
          if (isNaN(price) || isNaN(change24h)) {
            throw new Error('Invalid price data');
          }
          
          return {
            symbol: token.symbol,
            price,
            change24h,
            rawPrice
          };
        } catch (error) {
          console.error(`Error fetching ${token.symbol} price:`, error);
          return { 
            symbol: token.symbol, 
            price: 0, 
            change24h: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in prices API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
