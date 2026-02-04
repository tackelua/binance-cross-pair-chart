/**
 * API Client Module
 * Handles all HTTP requests to the backend API
 */

const API_BASE = window.location.origin;

/**
 * Fetch all available trading symbols (coins)
 * @returns {Promise<Array<string>>} Array of coin symbols
 */
export async function fetchSymbols() {
    try {
        const response = await fetch(`${API_BASE}/api/symbols`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch symbols');
        }

        return data.coins;
    } catch (error) {
        console.error('Error fetching symbols:', error);
        throw error;
    }
}

/**
 * Fetch synthetic pair kline data
 * @param {string} coinA - Base coin (e.g., 'BTC')
 * @param {string} coinB - Quote coin (e.g., 'ETH')
 * @param {string} interval - Timeframe (e.g., '1h')
 * @param {number} limit - Number of candles to fetch
 * @returns {Promise<Object>} Kline data and statistics
 */
export async function fetchKlines(coinA, coinB, interval = '1h', limit = 500) {
    try {
        const params = new URLSearchParams({
            coinA,
            coinB,
            interval,
            limit: limit.toString()
        });

        const response = await fetch(`${API_BASE}/api/klines?${params}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch klines');
        }

        return data;
    } catch (error) {
        console.error('Error fetching klines:', error);
        throw error;
    }
}

/**
 * Force refresh cache for a specific pair
 * @param {string} coinA - Base coin
 * @param {string} coinB - Quote coin
 * @param {string} interval - Timeframe
 * @returns {Promise<Object>} Refresh confirmation
 */
export async function refreshCache(coinA, coinB, interval = '1h') {
    try {
        const response = await fetch(`${API_BASE}/api/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coinA, coinB, interval })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to refresh cache');
        }

        return data;
    } catch (error) {
        console.error('Error refreshing cache:', error);
        throw error;
    }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
    try {
        const response = await fetch(`${API_BASE}/api/cache/stats`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch cache stats');
        }

        return data.stats;
    } catch (error) {
        console.error('Error fetching cache stats:', error);
        throw error;
    }
}
