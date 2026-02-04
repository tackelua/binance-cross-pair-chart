import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerPort } from '../../lib/port-manager/src/index.js';
import binanceAPI from './binance.js';
import cache from './cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: cache.getStats()
    });
});

/**
 * Get all available USDT trading pairs
 */
app.get('/api/symbols', async (req, res) => {
    try {
        const symbols = await binanceAPI.getExchangeInfo();

        // Extract unique base assets (coins)
        const coins = [...new Set(symbols.map(s => s.baseAsset))];
        coins.push('USDT');
        coins.sort();

        res.json({
            success: true,
            count: coins.length,
            coins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get synthetic pair kline data
 * Query params: coinA, coinB, interval, limit
 */
app.get('/api/klines', async (req, res) => {
    try {
        const { coinA, coinB, interval = '1h', limit = 500 } = req.query;

        // Validation
        if (!coinA || !coinB) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: coinA and coinB'
            });
        }

        if (coinA === coinB) {
            return res.status(400).json({
                success: false,
                error: 'coinA and coinB must be different'
            });
        }

        // Check cache first
        let klines = cache.get(coinA, coinB, interval);

        if (!klines) {
            // Fetch from Binance API
            klines = await binanceAPI.getSyntheticPair(
                coinA.toUpperCase(),
                coinB.toUpperCase(),
                interval,
                parseInt(limit)
            );

            // Store in cache
            cache.set(coinA, coinB, interval, klines);
        }

        // Calculate statistics
        const latestCandle = klines[klines.length - 1];
        const firstCandle = klines[0];
        const priceChange = latestCandle.close - firstCandle.close;
        const priceChangePercent = ((priceChange / firstCandle.close) * 100).toFixed(2);

        res.json({
            success: true,
            pair: `${coinA}/${coinB}`,
            interval,
            count: klines.length,
            data: klines,
            stats: {
                currentPrice: latestCandle.close,
                openPrice: firstCandle.open,
                highPrice: Math.max(...klines.map(k => k.high)),
                lowPrice: Math.min(...klines.map(k => k.low)),
                priceChange,
                priceChangePercent: parseFloat(priceChangePercent),
                timestamp: latestCandle.time
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Force refresh cache for a specific pair
 */
app.post('/api/refresh', async (req, res) => {
    try {
        const { coinA, coinB, interval = '1h' } = req.body;

        if (!coinA || !coinB) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: coinA and coinB'
            });
        }

        // Delete from cache
        cache.delete(coinA, coinB, interval);

        // Fetch fresh data
        const klines = await binanceAPI.getSyntheticPair(
            coinA.toUpperCase(),
            coinB.toUpperCase(),
            interval
        );

        // Store in cache
        cache.set(coinA, coinB, interval, klines);

        res.json({
            success: true,
            message: 'Cache refreshed',
            pair: `${coinA}/${coinB}`,
            count: klines.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get cache statistics
 */
app.get('/api/cache/stats', (req, res) => {
    res.json({
        success: true,
        stats: cache.getStats()
    });
});

/**
 * Start server with port-manager integration
 */
async function startServer() {
    try {
        // Register with port manager
        const port = await registerPort('binance-cross-pair-chart', 'binance-cross-pair-chart');

        app.listen(port, () => {
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║   Binance Cross-Pair Chart - Server Running           ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log(`\n🚀 Server: http://localhost:${port}`);
            console.log(`📊 Health: http://localhost:${port}/health`);
            console.log(`🔧 Port Manager: Registered on port ${port}\n`);
            console.log('Endpoints:');
            console.log('  GET  /api/symbols       - List available coins');
            console.log('  GET  /api/klines        - Get synthetic pair data');
            console.log('  POST /api/refresh       - Force cache refresh');
            console.log('  GET  /api/cache/stats   - Cache statistics');
            console.log('  GET  /health            - Health check\n');
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
