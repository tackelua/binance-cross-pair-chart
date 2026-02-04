/**
 * Chart Module
 * Handles chart rendering and updates using Lightweight Charts
 */

let chart = null;
let candlestickSeries = null;

/**
 * Initialize the chart with dark theme
 * @param {HTMLElement} container - Chart container element
 * @returns {Object} Chart instance
 */
export function initChart(container) {
    // Clear existing chart if any
    if (chart) {
        chart.remove();
    }

    // Create chart with dark theme configuration
    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
            background: {
                type: 'solid',
                color: '#161a1e'
            },
            textColor: '#b7bdc6'
        },
        grid: {
            vertLines: {
                color: '#2b3139'
            },
            horzLines: {
                color: '#2b3139'
            }
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: {
                color: '#f0b90b',
                width: 1,
                style: LightweightCharts.LineStyle.Dashed,
                labelBackgroundColor: '#f0b90b'
            },
            horzLine: {
                color: '#f0b90b',
                width: 1,
                style: LightweightCharts.LineStyle.Dashed,
                labelBackgroundColor: '#f0b90b'
            }
        },
        rightPriceScale: {
            borderColor: '#2b3139',
            scaleMargins: {
                top: 0.1,
                bottom: 0.1
            }
        },
        timeScale: {
            borderColor: '#2b3139',
            timeVisible: true,
            secondsVisible: false
        }
    });

    // Create candlestick series
    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderUpColor: '#0ecb81',
        borderDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
        wickDownColor: '#f6465d'
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (chart && container) {
            chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        }
    });

    return chart;
}

/**
 * Update chart data with new klines
 * @param {Array} klines - Array of kline objects with OHLC data
 */
export function updateData(klines) {
    if (!candlestickSeries) {
        console.error('Chart not initialized');
        return;
    }

    // Determine appropriate precision based on latest price
    if (klines.length > 0) {
        const lastClose = klines[klines.length - 1].close;
        let precision = 2;
        let minMove = 0.01;

        if (lastClose >= 1000) {
            precision = 2;
            minMove = 0.01;
        } else if (lastClose >= 1) {
            precision = 4;
            minMove = 0.0001;
        } else if (lastClose >= 0.01) {
            precision = 6;
            minMove = 0.000001;
        } else if (lastClose >= 0.0001) {
            precision = 8;
            minMove = 0.00000001;
        } else {
            precision = 10;
            minMove = 0.0000000001;
        }

        candlestickSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: minMove,
            },
        });

        // Update chart's right price scale to match
        chart.applyOptions({
            rightPriceScale: {
                autoScale: true,
                entireTextOnly: true,
            }
        });
    }

    // Set the data
    candlestickSeries.setData(klines);

    // Fit content to view
    chart.timeScale().fitContent();
}

/**
 * Clear all chart data
 */
export function clearChart() {
    if (candlestickSeries) {
        candlestickSeries.setData([]);
    }
}

/**
 * Add a simple moving average indicator
 * @param {Array} klines - Kline data
 * @param {number} period - MA period (e.g., 20, 50, 200)
 * @param {string} color - Line color
 * @returns {Object} Line series
 */
export function addMovingAverage(klines, period = 20, color = '#f0b90b') {
    if (!chart) {
        console.error('Chart not initialized');
        return null;
    }

    // Calculate SMA
    const maData = [];

    for (let i = period - 1; i < klines.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += klines[i - j].close;
        }
        const avg = sum / period;

        maData.push({
            time: klines[i].time,
            value: avg
        });
    }

    // Add line series
    const lineSeries = chart.addLineSeries({
        color: color,
        lineWidth: 2,
        title: `MA${period}`
    });

    lineSeries.setData(maData);

    return lineSeries;
}

/**
 * Add exponential moving average
 * @param {Array} klines - Kline data
 * @param {number} period - EMA period
 * @param {string} color - Line color
 * @returns {Object} Line series
 */
export function addExponentialMovingAverage(klines, period = 20, color = '#3861fb') {
    if (!chart) {
        console.error('Chart not initialized');
        return null;
    }

    // Calculate EMA
    const multiplier = 2 / (period + 1);
    const emaData = [];

    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += klines[i].close;
    }
    let ema = sum / period;

    emaData.push({
        time: klines[period - 1].time,
        value: ema
    });

    // Calculate EMA for remaining values
    for (let i = period; i < klines.length; i++) {
        ema = (klines[i].close - ema) * multiplier + ema;
        emaData.push({
            time: klines[i].time,
            value: ema
        });
    }

    // Add line series
    const lineSeries = chart.addLineSeries({
        color: color,
        lineWidth: 2,
        title: `EMA${period}`
    });

    lineSeries.setData(emaData);

    return lineSeries;
}

/**
 * Remove a series from the chart
 * @param {Object} series - Series to remove
 */
export function removeSeries(series) {
    if (chart && series) {
        chart.removeSeries(series);
    }
}

/**
 * Get the chart instance
 * @returns {Object} Chart instance
 */
export function getChart() {
    return chart;
}

/**
 * Get the candlestick series
 * @returns {Object} Candlestick series
 */
export function getCandlestickSeries() {
    return candlestickSeries;
}
