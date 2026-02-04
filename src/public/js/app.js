/**
 * Main Application Controller
 * Coordinates between UI, API, and Chart modules
 */

import { fetchSymbols, fetchKlines, refreshCache } from './api.js';
import { initChart, updateData, clearChart, addMovingAverage, addExponentialMovingAverage, removeSeries } from './chart.js';

// DOM Elements
const coinASelect = document.getElementById('coinA');
const coinBSelect = document.getElementById('coinB');
const intervalSelect = document.getElementById('interval');
const refreshBtn = document.getElementById('refreshBtn');
const chartContainer = document.getElementById('chartContainer');
const loadingOverlay = document.getElementById('loadingOverlay');

// Stats elements
const statPair = document.getElementById('statPair');
const statPrice = document.getElementById('statPrice');
const statChange = document.getElementById('statChange');
const statHigh = document.getElementById('statHigh');
const statLow = document.getElementById('statLow');
const statTime = document.getElementById('statTime');

// State
let currentData = null;
let indicators = [];

/**
 * Initialize the application
 */
async function init() {
    try {
        // Initialize chart
        initChart(chartContainer);

        // Load available symbols
        await loadSymbols();

        // Set default selections
        setDefaultSelections();

        // Load initial chart data
        await loadChartData();

        // Setup event listeners
        setupEventListeners();

        console.log('✓ Application initialized successfully');
    } catch (error) {
        console.error('✗ Initialization failed:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Load symbols and populate dropdowns
 */
async function loadSymbols() {
    try {
        const symbols = await fetchSymbols();

        // Populate both dropdowns
        populateDropdown(coinASelect, symbols);
        populateDropdown(coinBSelect, symbols);

        console.log(`✓ Loaded ${symbols.length} symbols`);
    } catch (error) {
        console.error('Error loading symbols:', error);
        throw error;
    }
}

/**
 * Populate a dropdown with options
 * @param {HTMLSelectElement} select - Select element
 * @param {Array<string>} options - Option values
 */
function populateDropdown(select, options) {
    select.innerHTML = options.map(option =>
        `<option value="${option}">${option}</option>`
    ).join('');
}

/**
 * Set default coin selections
 */
function setDefaultSelections() {
    // Default to BTC/ETH if available
    if (coinASelect.querySelector('option[value="BTC"]')) {
        coinASelect.value = 'BTC';
    }

    if (coinBSelect.querySelector('option[value="ETH"]')) {
        coinBSelect.value = 'ETH';
    }
}

/**
 * Load and display chart data
 */
async function loadChartData(forceRefresh = false) {
    const coinA = coinASelect.value;
    const coinB = coinBSelect.value;
    const interval = intervalSelect.value;

    // Validation
    if (!coinA || !coinB) {
        showError('Please select both coins');
        return;
    }

    if (coinA === coinB) {
        showError('Please select different coins');
        return;
    }

    try {
        showLoading(true);
        clearIndicators();

        // Refresh cache if requested
        if (forceRefresh) {
            await refreshCache(coinA, coinB, interval);
            console.log('✓ Cache refreshed');
        }

        // Fetch data
        const response = await fetchKlines(coinA, coinB, interval);
        currentData = response;

        // Update chart
        updateData(response.data);

        // Update stats
        updateStats(response);

        // Add default indicators
        addDefaultIndicators(response.data);

        console.log(`✓ Loaded ${response.count} candles for ${response.pair}`);
    } catch (error) {
        console.error('Error loading chart data:', error);
        showError(`Failed to load data: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Update statistics display
 * @param {Object} data - Response data with stats
 */
function updateStats(data) {
    const { pair, stats } = data;

    statPair.textContent = pair;
    statPrice.textContent = formatNumber(stats.currentPrice, 6);

    // Price change with color
    const changeText = `${stats.priceChange >= 0 ? '+' : ''}${formatNumber(stats.priceChange, 6)} (${stats.priceChangePercent >= 0 ? '+' : ''}${stats.priceChangePercent}%)`;
    statChange.textContent = changeText;
    statChange.className = `stat-value ${stats.priceChangePercent >= 0 ? 'positive' : 'negative'}`;

    statHigh.textContent = formatNumber(stats.highPrice, 6);
    statLow.textContent = formatNumber(stats.lowPrice, 6);

    // Format timestamp
    const date = new Date(stats.timestamp * 1000);
    statTime.textContent = date.toLocaleTimeString();
}

/**
 * Add default indicators to chart  
 */
function addDefaultIndicators(klines) {
    if (klines.length < 50) return; // Need enough data

    // Add MA20 and EMA50
    indicators.push(addMovingAverage(klines, 20, '#f0b90b'));
    indicators.push(addExponentialMovingAverage(klines, 50, '#3861fb'));
}

/**
 * Clear all indicators from chart
 */
function clearIndicators() {
    indicators.forEach(indicator => {
        if (indicator) {
            removeSeries(indicator);
        }
    });
    indicators = [];
}

/**
 * Show/hide loading overlay
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    alert(message); // Simple alert for now
    console.error(message);
}

/**
 * Format number with fixed decimals
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Coin selection changes
    coinASelect.addEventListener('change', () => loadChartData());
    coinBSelect.addEventListener('change', () => loadChartData());

    // Interval changes
    intervalSelect.addEventListener('change', () => loadChartData());

    // Refresh button
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Refreshing...</span>';

        await loadChartData(true);

        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Refresh</span>';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // R key to refresh
        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                refreshBtn.click();
            }
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
