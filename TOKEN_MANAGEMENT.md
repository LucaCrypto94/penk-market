# Token Management Guide

This document explains how to add new tokens to the Penk Market system.

## Overview

The system uses a centralized `tokens.json` file as the single source of truth for all token information. All API routes and the frontend automatically read from this file, so adding new tokens only requires editing this one file.

## File Structure

The `tokens.json` file has the following structure:

```json
{
  "networks": {
    "l1": {
      "name": "Ethereum Mainnet",
      "path": "networks/eth",
      "tokens": [
        {
          "symbol": "TOKEN_SYMBOL",
          "path": "networks/eth/tokens/0x...",
          "note": "Optional description"
        }
      ]
    },
    "pepeUnchained": {
      "name": "Pepe Unchained",
      "path": "networks/pepe-unchained",
      "tokens": [
        {
          "symbol": "TOKEN_SYMBOL",
          "path": "networks/pepe-unchained/pools/0x...",
          "note": "Optional description"
        }
      ]
    }
  }
}
```

## Adding New Tokens

### 1. L1 Tokens (Ethereum Mainnet)

To add a new L1 token (like ETH, USDC, PEPU):

1. Find the token's GeckoTerminal path
2. Add a new entry to the `l1.tokens` array:

```json
{
  "symbol": "NEWTOKEN",
  "path": "networks/eth/tokens/0x...",
  "note": "Description of the token"
}
```

### 2. Pepe Unchained Tokens

To add a new Pepe Unchained token (like SPRING, PENK):

1. Find the token's GeckoTerminal pool path
2. Add a new entry to the `pepeUnchained.tokens` array:

```json
{
  "symbol": "NEWPEPE",
  "path": "networks/pepe-unchained/pools/0x...",
  "note": "Description of the token"
}
```

## What Happens Automatically

Once you add a token to `tokens.json`:

✅ **Frontend**: Token appears in dropdown menus automatically  
✅ **Prices API**: Token prices are fetched automatically  
✅ **Quote API**: Token quotes are calculated automatically  
✅ **Tokens API**: Token lists are updated automatically  

## Example: Adding a New Token

Let's say you want to add a new token called "MOON":

1. **Find the GeckoTerminal path**: `networks/pepe-unchained/pools/0x1234...`
2. **Add to tokens.json**:

```json
{
  "symbol": "MOON",
  "path": "networks/pepe-unchained/pools/0x1234...",
  "note": "Moon token on Pepe Unchained"
}
```

3. **Save the file** - that's it!

The system will automatically:
- Show MOON in the "To" token dropdown
- Fetch MOON prices from GeckoTerminal
- Calculate quotes for MOON swaps
- Handle all API responses

## Finding Token Paths

### For L1 Tokens:
- Go to [GeckoTerminal](https://www.geckoterminal.com/)
- Search for your token
- Copy the path from the URL (e.g., `networks/eth/tokens/0x...`)

### For Pepe Unchained Tokens:
- Go to [GeckoTerminal Pepe Unchained](https://www.geckoterminal.com/pepe-unchained)
- Search for your token
- Copy the pool path from the URL (e.g., `networks/pepe-unchained/pools/0x...`)

## Benefits of This Approach

🎯 **Single Source of Truth**: All token data in one place  
🚀 **Zero Code Changes**: Add tokens without touching any code  
🔄 **Automatic Updates**: All systems update automatically  
📱 **Frontend Ready**: UI updates immediately  
🔌 **API Ready**: All endpoints work with new tokens  
🧪 **Tested**: Same logic for all tokens  

## Troubleshooting

If a new token doesn't work:

1. **Check the path**: Ensure the GeckoTerminal path is correct
2. **Verify the token exists**: Make sure the token is listed on GeckoTerminal
3. **Check the console**: Look for API errors in the browser console
4. **Restart the dev server**: Sometimes needed for file changes

## Notes

- Token symbols should be unique across all networks
- Paths must match exactly what GeckoTerminal uses
- The system automatically detects if a token is a pool or regular token
- All price calculations work the same way for any token 