import axios from 'axios';

const BINANCE_API_BASE = 'https://api.binance.com';

/**
 * Binance API Client
 * Handles all interactions with Binance REST API
 */
class BinanceAPI {
  /**
   * Fetch exchange information including all available symbols
   * @returns {Promise<Array>} Array of symbol objects
   */
  async getExchangeInfo() {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/exchangeInfo`);
      
      // Filter for USDT pairs only
      const usdtPairs = response.data.symbols.filter(symbol => 
        symbol.symbol.endsWith('USDT') && 
        symbol.status === 'TRADING'
      );
      
      // Extract base assets (coins)
      const coins = usdtPairs.map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset
      }));
      
      return coins;
    } catch (error) {
      console.error('Error fetching exchange info:', error.message);
      throw new Error(`Failed to fetch symbols: ${error.message}`);
    }
  }

  /**
   * Fetch kline/candlestick data for a symbol
   * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
   * @param {string} interval - Kline interval (e.g., '1h', '1d')
   * @param {number} limit - Number of candles to fetch (default: 500, max: 1000)
   * @returns {Promise<Array>} Array of kline data
   */
  async getKlines(symbol, interval = '1h', limit = 500) {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit: Math.min(limit, 1000) // Binance max is 1000
        }
      });

      // Transform Binance kline format to a more usable structure
      // [openTime, open, high, low, close, volume, closeTime, ...]
      const klines = response.data.map(k => ({
        time: Math.floor(k[0] / 1000), // Convert to seconds for Lightweight Charts
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));

      return klines;
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error.message);
      
      // Handle specific Binance API errors
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.data?.msg) {
        throw new Error(`Binance API error: ${error.response.data.msg}`);
      }
      
      throw new Error(`Failed to fetch klines: ${error.message}`);
    }
  }

  /**
   * Calculate synthetic pair klines from two USDT pairs
   * @param {string} coinA - Base coin (e.g., 'BTC')
   * @param {string} coinB - Quote coin (e.g., 'ETH')
   * @param {string} interval - Kline interval
   * @param {number} limit - Number of candles
   * @returns {Promise<Array>} Synthetic kline data
   */
  async getSyntheticPair(coinA, coinB, interval = '1h', limit = 500) {
    try {
      // Fetch both pairs in parallel
      const [klinesA, klinesB] = await Promise.all([
        this.getKlines(`${coinA}USDT`, interval, limit),
        this.getKlines(`${coinB}USDT`, interval, limit)
      ]);

      // Create a map of coinB klines by timestamp for fast lookup
      const klinesBMap = new Map(klinesB.map(k => [k.time, k]));

      // Calculate synthetic pair by dividing coinA by coinB
      const syntheticKlines = klinesA
        .map(klineA => {
          const klineB = klinesBMap.get(klineA.time);
          
          // Skip if we don't have matching timestamp in coinB
          if (!klineB) return null;

          // Calculate OHLC ratios
          return {
            time: klineA.time,
            open: klineA.open / klineB.open,
            high: klineA.high / klineB.high,
            low: klineA.low / klineB.low,
            close: klineA.close / klineB.close,
            volume: klineA.volume // Keep coinA volume for reference
          };
        })
        .filter(k => k !== null); // Remove null entries

      return syntheticKlines;
    } catch (error) {
      console.error(`Error calculating synthetic pair ${coinA}/${coinB}:`, error.message);
      throw error;
    }
  }
}

export default new BinanceAPI();
