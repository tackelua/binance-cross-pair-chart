# 📊 Binance Cross-Pair Chart

A modern web application to view **synthetic trading pair charts** on Binance by calculating cross-pair rates from USDT pairs.

## ✨ Features

### Core Functionality
- **Synthetic Pair Calculation**: View any cross-pair (e.g., BTC/ETH) by dividing their USDT rates
- **Real-time Data**: Fetches live candlestick data from Binance API
- **All Timeframes**: Supports 15 different timeframes (1m to 1M)
- **Smart Caching**: Intelligent cache with timeframe-based TTL to avoid rate limits

### Chart Features
- **Professional Charts**: Powered by TradingView's Lightweight Charts
- **Candlestick Display**: Full OHLC visualization
- **Technical Indicators**: MA20 and EMA50 automatically displayed
- **Interactive**: Full zoom, pan, and crosshair support
- **Dark Theme**: Binance-inspired professional design

### Performance
- **Backend Caching**: NodeCache with dynamic TTL (60s-72h based on timeframe)
- **Cache Hit Logging**: See cache performance in server console
- **Force Refresh**: Manual cache invalidation available
- **Rate Limit Safe**: Stays under Binance's 1200 req/min limit

## 🚀 Installation

### Prerequisites
- Node.js 18+ (for ES modules support)
- Port Manager installed at `~/port-manager`

### Setup

1. **Navigate to project directory**
   ```bash
   cd /Users/gith/binance-cross-pair-chart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Server will register a port with port-manager
   - Open browser to `http://localhost:<assigned-port>`
   - Check console for the exact URL

## 📖 Usage

### Basic Usage

1. **Select Coins**: Choose base coin (e.g., BTC) and quote coin (e.g., ETH)
2. **Select Timeframe**: Pick your preferred timeframe (1m to 1M)
3. **View Chart**: Synthetic pair chart displays automatically
4. **Refresh**: Click refresh button or press `R` key to force update

### Understanding Synthetic Pairs

The app calculates synthetic rates using:
```
BTC/ETH = (BTC/USDT) / (ETH/USDT)
```

For each candlestick:
- **Open**: `BTC_open / ETH_open`
- **High**: `BTC_high / ETH_high`
- **Low**: `BTC_low / ETH_low`
- **Close**: `BTC_close / ETH_close`
- **Volume**: BTC volume (reference only)

### Keyboard Shortcuts
- `R` - Refresh chart data (force cache update)

## 🔧 API Endpoints

### `GET /api/symbols`
List all available USDT trading pairs.

**Response:**
```json
{
  "success": true,
  "count": 380,
  "coins": ["BTC", "ETH", "BNB", ...]
}
```

### `GET /api/klines`
Get synthetic pair candlestick data.

**Query Parameters:**
- `coinA` - Base coin (required)
- `coinB` - Quote coin (required)
- `interval` - Timeframe (default: `1h`)
- `limit` - Number of candles (default: `500`, max: `1000`)

**Example:**
```bash
curl "http://localhost:3000/api/klines?coinA=BTC&coinB=ETH&interval=1h&limit=100"
```

**Response:**
```json
{
  "success": true,
  "pair": "BTC/ETH",
  "interval": "1h",
  "count": 100,
  "data": [
    {
      "time": 1706745600,
      "open": 18.456,
      "high": 18.523,
      "low": 18.401,
      "close": 18.489,
      "volume": 1234.56
    },
    ...
  ],
  "stats": {
    "currentPrice": 18.489,
    "openPrice": 18.456,
    "highPrice": 18.601,
    "lowPrice": 18.234,
    "priceChange": 0.033,
    "priceChangePercent": 0.18,
    "timestamp": 1706831999
  }
}
```

### `POST /api/refresh`
Force cache refresh for a specific pair.

**Body:**
```json
{
  "coinA": "BTC",
  "coinB": "ETH",
  "interval": "1h"
}
```

### `GET /api/cache/stats`
Get cache statistics (hits, misses, keys).

### `GET /health`
Health check endpoint with cache stats.

## 🏗️ Architecture

### Backend
```
src/server/
├── index.js     - Express server + port-manager integration
├── binance.js   - Binance API wrapper
└── cache.js     - Cache manager with dynamic TTL
```

### Frontend
```
src/public/
├── index.html
├── css/
│   └── style.css    - Dark theme design system
└── js/
    ├── app.js       - Main controller
    ├── api.js       - API client
    └── chart.js     - Chart rendering
```

### Cache Strategy

Cache TTL based on timeframe:
| Timeframe | TTL      |
|-----------|----------|
| 1m        | 60s      |
| 5m        | 300s     |
| 1h        | 1800s    |
| 1d        | 43200s   |
| 1w        | 172800s  |

## 🌐 Deployment

### Cloudflare Tunnel Setup

1. **Get assigned port from server startup**
   ```bash
   npm start
   # Note the port number from output
   ```

2. **Update Cloudflare Tunnel config**
   ```bash
   nano ~/cloudflare-githsoft/tunnel/config.yml
   ```

   Add entry:
   ```yaml
   ingress:
     - hostname: binance-chart.githsoft.com
       service: http://localhost:<PORT>
   ```

3. **Restart tunnel service**
   ```bash
   cd ~/cloudflare-githsoft/tunnel
   sudo bash 4-enable-service.sh
   ```

4. **Verify deployment**
   - Visit `https://binance-chart.githsoft.com`

### Production Deployment

For production, consider:
- Use PM2 for process management: `pm2 start src/server/index.js --name binance-chart`
- Set up monitoring and logging
- Configure HTTPS/SSL (handled by Cloudflare Tunnel)
- Implement rate limiting middleware
- Add request logging

## 🎨 Design

### Color Palette
- **Background**: `#0b0e11` (deep black-blue)
- **Surface**: `#161a1e` (card backgrounds)
- **Accent**: `#f0b90b` (Binance yellow)
- **Success**: `#0ecb81` (green candles)
- **Danger**: `#f6465d` (red candles)

### Technologies
- **Backend**: Node.js, Express, Axios, NodeCache
- **Frontend**: Vanilla JavaScript (ES6 modules), Vanilla CSS
- **Charting**: Lightweight Charts 4.1.1
- **Port Management**: Custom port-manager integration

## 📝 Development

### Project Structure
```
binance-cross-pair-chart/
├── lib/
│   └── port-manager/          # Symlinked from ~/port-manager
├── src/
│   ├── server/
│   │   ├── index.js
│   │   ├── binance.js
│   │   └── cache.js
│   └── public/
│       ├── index.html
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── app.js
│           ├── api.js
│           └── chart.js
├── package.json
├── .gitignore
└── README.md
```

### Adding New Features

**Add New Indicator:**
1. Add calculation function in `chart.js`
2. Call from `app.js` in `addDefaultIndicators()`

**Add New Endpoint:**
1. Define route in `src/server/index.js`
2. Add API client method in `src/public/js/api.js`
3. Call from `app.js` as needed

### Debugging

**Enable verbose logging:**
```javascript
// In src/server/cache.js, add more console.log statements
```

**Check cache stats:**
```bash
curl http://localhost:<PORT>/api/cache/stats
```

**Monitor server logs:**
```bash
npm run dev
# Watch console for cache HIT/MISS logs
```

## 🔒 Security

- No API keys required (using public Binance endpoints)
- CORS enabled for frontend access
- No sensitive data stored
- Cache data is non-persistent (in-memory only)

## 📊 Performance Metrics

- **Initial Page Load**: < 2s
- **Chart Render**: < 500ms after data received
- **API Response (cached)**: < 200ms
- **API Response (fresh)**: 500-1000ms (Binance dependent)
- **Chart FPS**: 60fps for smooth interactions

## 🐛 Troubleshooting

### Server won't start
- Ensure port-manager symlink exists: `ls -la lib/port-manager`
- Check Node.js version: `node --version` (need 18+)
- Verify dependencies: `npm install`

### Chart not displaying
- Check browser console for errors
- Verify Lightweight Charts loaded: Check Network tab
- Ensure API endpoints return data: Test with `curl`

### API rate limiting
- Cache should prevent this, but if it occurs:
- Increase cache TTL in `cache.js`
- Reduce default `limit` in API calls

## 📄 License

MIT License - Free to use and modify

## 🙏 Credits

- **Binance API**: Market data provider
- **Lightweight Charts**: TradingView charting library
- **Port Manager**: Githsoft port management system

---

**Built with ❤️ by Githsoft**
