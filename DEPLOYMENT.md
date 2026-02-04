## Adding Binance Cross-Pair Chart to Cloudflare Tunnel

### Current Status
- ✅ Server running on **port 4001**
- ✅ Port registered with port-manager
- ⏳ Cloudflare Tunnel config needs update

### Steps to Deploy

1. **Open Cloudflare Tunnel config**
   ```bash
   nano ~/cloudflare-githsoft/tunnel/config.yml
   ```

2. **Add new ingress entry** (before the catch-all rule)
   ```yaml
   ingress:
     # ... existing entries ...
     
     - hostname: binance-chart.githsoft.com
       service: http://localhost:4001
     
     # ... catch-all rule at the end ...
   ```

3. **Restart Cloudflare Tunnel service**
   ```bash
   cd ~/cloudflare-githsoft/tunnel
   sudo bash 4-enable-service.sh
   ```

4. **Verify deployment**
   - Visit: `https://binance-chart.githsoft.com`
   - Should see the Binance Cross-Pair Chart interface

### Alternative Subdomain Names
If `binance-chart` is too long, consider:
- `chart.githsoft.com`
- `pairs.githsoft.com`
- `btceth.githsoft.com`
- `crypto-chart.githsoft.com`

### Local Testing
Server is currently running at:
- `http://localhost:4001`

To stop the server, use `Ctrl+C` in the terminal where it's running.

### Production Management

**Using PM2 (recommended)**:
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start with PM2
cd /Users/gith/binance-cross-pair-chart
pm2 start src/server/index.js --name binance-chart

# Other PM2 commands
pm2 status           # View status
pm2 logs binance-chart   # View logs
pm2 restart binance-chart  # Restart after code changes
pm2 stop binance-chart     # Stop the app
pm2 save           # Save PM2 process list
pm2 startup         # Configure PM2 to start on boot
```
