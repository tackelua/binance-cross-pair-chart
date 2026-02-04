import NodeCache from 'node-cache';

/**
 * Cache Manager
 * Implements intelligent caching with timeframe-based TTL
 */
class CacheManager {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, // Default 5 minutes
            checkperiod: 60, // Check for expired keys every 60s
            useClones: false // Return references for better performance
        });
    }

    /**
     * Calculate appropriate TTL based on timeframe
     * Shorter timeframes = shorter cache duration
     * @param {string} interval - Kline interval (e.g., '1m', '1h', '1d')
     * @returns {number} TTL in seconds
     */
    getTTL(interval) {
        const ttlMap = {
            '1m': 60,        // 1 minute
            '3m': 180,       // 3 minutes
            '5m': 300,       // 5 minutes
            '15m': 600,      // 10 minutes
            '30m': 900,      // 15 minutes
            '1h': 1800,      // 30 minutes
            '2h': 3600,      // 1 hour
            '4h': 7200,      // 2 hours
            '6h': 10800,     // 3 hours
            '8h': 14400,     // 4 hours
            '12h': 21600,    // 6 hours
            '1d': 43200,     // 12 hours
            '3d': 86400,     // 24 hours
            '1w': 172800,    // 48 hours
            '1M': 259200     // 72 hours
        };

        return ttlMap[interval] || 300; // Default 5 minutes
    }

    /**
     * Generate cache key from parameters
     * @param {string} coinA - Base coin
     * @param {string} coinB - Quote coin
     * @param {string} interval - Timeframe
     * @returns {string} Cache key
     */
    generateKey(coinA, coinB, interval) {
        return `${coinA}_${coinB}_${interval}`;
    }

    /**
     * Get cached data
     * @param {string} coinA - Base coin
     * @param {string} coinB - Quote coin
     * @param {string} interval - Timeframe
     * @returns {Array|undefined} Cached kline data or undefined
     */
    get(coinA, coinB, interval) {
        const key = this.generateKey(coinA, coinB, interval);
        const data = this.cache.get(key);

        if (data) {
            console.log(`✓ Cache HIT: ${key}`);
        } else {
            console.log(`✗ Cache MISS: ${key}`);
        }

        return data;
    }

    /**
     * Store data in cache with dynamic TTL
     * @param {string} coinA - Base coin
     * @param {string} coinB - Quote coin
     * @param {string} interval - Timeframe
     * @param {Array} data - Kline data to cache
     * @returns {boolean} Success status
     */
    set(coinA, coinB, interval, data) {
        const key = this.generateKey(coinA, coinB, interval);
        const ttl = this.getTTL(interval);

        const success = this.cache.set(key, data, ttl);

        if (success) {
            console.log(`✓ Cached: ${key} (TTL: ${ttl}s)`);
        }

        return success;
    }

    /**
     * Manually delete cached data
     * @param {string} coinA - Base coin
     * @param {string} coinB - Quote coin
     * @param {string} interval - Timeframe
     * @returns {number} Number of deleted entries
     */
    delete(coinA, coinB, interval) {
        const key = this.generateKey(coinA, coinB, interval);
        const deleted = this.cache.del(key);

        if (deleted > 0) {
            console.log(`✓ Deleted cache: ${key}`);
        }

        return deleted;
    }

    /**
     * Clear all cached data
     */
    flush() {
        this.cache.flushAll();
        console.log('✓ Cache flushed');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return this.cache.getStats();
    }
}

export default new CacheManager();
