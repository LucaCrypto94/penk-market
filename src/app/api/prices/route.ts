import { NextResponse } from 'next/server';
import { getAllTokens, Token } from '@/lib/token-utils';

export const dynamic = 'force-dynamic';

const GECKO_TERMINAL_API = 'https://api.geckoterminal.com/api/v2';

export async function GET() {
  try {
    // Get all tokens from the utility function
    const tokens = getAllTokens();
    
    const prices = await Promise.all(
      tokens.map(async (token: Token) => {
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
          
          // Determine if this is a pool (PEPU, SPRING, PENK) or token (ETH, USDC)
          const isPool = token.path.includes('/pools/');
          
          if (isPool) {
            // Handle pool data
            const attributes = data.data.attributes;
            price = parseFloat(attributes.base_token_price_usd);
            change24h = parseFloat(attributes.price_change_percentage?.h24 || '0');
            rawPrice = price.toFixed(8);
          } else {
            // Handle token data
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
            rawPrice,
            network: token.path.includes('pepe-unchained') ? 'pepe-unchained' : 'eth'
          };
        } catch (error) {
          console.error(`Error fetching ${token.symbol} price:`, error);
          return { 
            symbol: token.symbol, 
            price: 0, 
            change24h: 0,
            network: token.path.includes('pepe-unchained') ? 'pepe-unchained' : 'eth',
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
