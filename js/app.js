/* ====== CLOCK ====== */
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

/* ====== TABS ====== */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
}

/* ====== CRYPTO DATA ====== */
const coins = [
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', color: '#f7931a', cap: 1.38 },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', color: '#627eea', cap: 0.42 },
  { id: 'solana', sym: 'SOL', name: 'Solana', color: '#9945ff', cap: 0.09 },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB', color: '#f3ba2f', cap: 0.08 },
  { id: 'ripple', sym: 'XRP', name: 'XRP', color: '#00aae4', cap: 0.06 },
  { id: 'cardano', sym: 'ADA', name: 'Cardano', color: '#0033ad', cap: 0.04 },
  { id: 'dogecoin', sym: 'DOGE', name: 'Dogecoin', color: '#c2a633', cap: 0.03 },
  { id: 'polkadot', sym: 'DOT', name: 'Polkadot', color: '#e6007a', cap: 0.02 }
];

let prices = {};

async function fetchCryptoData() {
  try {
    const ids = coins.map(c => c.id).join(',');
    const cacheKey = 'crypto_data_cache';
    const cacheTimeKey = 'crypto_data_cache_time';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    
    let data;
    if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < 120000)) {
      data = JSON.parse(cachedData);
    } else {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);
      if (!res.ok) throw new Error('API error');
      data = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
    }
    prices = data;
    renderCrypto(data);
    document.getElementById('last-updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (e) {
    // fallback with simulated data
    const fallback = {
      bitcoin: { usd: 67420 + Math.random()*500, usd_24h_change: (Math.random()-0.4)*6, usd_24h_vol: 32e9 },
      ethereum: { usd: 3240 + Math.random()*80, usd_24h_change: (Math.random()-0.45)*8, usd_24h_vol: 18e9 },
      solana: { usd: 148 + Math.random()*10, usd_24h_change: (Math.random()-0.4)*12, usd_24h_vol: 4e9 },
      binancecoin: { usd: 410 + Math.random()*15, usd_24h_change: (Math.random()-0.45)*5, usd_24h_vol: 1.8e9 },
      ripple: { usd: 0.52 + Math.random()*0.04, usd_24h_change: (Math.random()-0.5)*10, usd_24h_vol: 1.2e9 },
      cardano: { usd: 0.48 + Math.random()*0.04, usd_24h_change: (Math.random()-0.5)*8, usd_24h_vol: 0.5e9 },
      dogecoin: { usd: 0.12 + Math.random()*0.01, usd_24h_change: (Math.random()-0.5)*15, usd_24h_vol: 0.8e9 },
      polkadot: { usd: 7.4 + Math.random()*0.5, usd_24h_change: (Math.random()-0.5)*9, usd_24h_vol: 0.3e9 }
    };
    prices = fallback;
    renderCrypto(fallback);
    document.getElementById('last-updated').textContent = 'Simulated (API offline)';
  }
}

function fmt(n) {
  if (n >= 1e12) return '$' + (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
  if (n >= 1) return '$' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  return '$' + n.toFixed(4);
}

function renderCrypto(data) {
  // Ticker
  const tickerItems = coins.map(c => {
    const d = data[c.id];
    if (!d) return '';
    const chg = d.usd_24h_change;
    return `<div class="ticker-item"><span class="ticker-sym">${c.sym}</span><span class="ticker-price">${fmt(d.usd)}</span><span class="${chg>=0?'pos':'neg'}">${chg>=0?'+':''}${chg.toFixed(2)}%</span></div>`;
  }).join('');
  document.getElementById('ticker-inner').innerHTML = tickerItems + tickerItems;

  // Cards
  const top4 = coins.slice(0, 4);
  document.getElementById('crypto-cards').innerHTML = top4.map(c => {
    const d = data[c.id];
    if (!d) return '';
    const chg = d.usd_24h_change;
    const isUp = chg >= 0;
    return `
      <div class="stat-card" style="--accent:${c.color}">
        <div class="stat-symbol">${c.sym} / USD</div>
        <div class="stat-price">${fmt(d.usd)}</div>
        <div class="stat-row">
          <span class="stat-change ${isUp?'pos':'neg'}">${isUp?'up':'down'} ${Math.abs(chg).toFixed(2)}%</span>
          <span class="stat-vol">Vol: ${fmt(d.usd_24h_vol||0)}</span>
        </div>
        <div class="sparkline">${generateSparkline(isUp, c.color)}</div>
      </div>`;
  }).join('');

  // Table
  document.getElementById('market-tbody').innerHTML = coins.map((c, i) => {
    const d = data[c.id];
    if (!d) return '';
    const chg = d.usd_24h_change;
    const isUp = chg >= 0;
    return `<tr>
      <td class="mini-num" style="color:var(--muted)">${i+1}</td>
      <td><div class="coin-info">
        <div class="coin-icon" style="background:${c.color}22;color:${c.color}">${c.sym.slice(0,2)}</div>
        <div><div class="coin-name">${c.name}</div><div class="coin-sym">${c.sym}</div></div>
      </div></td>
      <td class="td-price">${fmt(d.usd)}</td>
      <td><span class="${isUp?'badge-up':'badge-dn'}">${isUp?'+':''}${chg.toFixed(2)}%</span></td>
      <td class="mini-num">$${(d.usd * c.cap * 1e12 / 1e12).toFixed(0)}B</td>
    </tr>`;
  }).join('');

  // Volume bars
  const maxVol = Math.max(...coins.map(c => data[c.id]?.usd_24h_vol || 0));
  document.getElementById('vol-bars').innerHTML = coins.slice(0,6).map(c => {
    const d = data[c.id];
    if (!d) return '';
    const pct = ((d.usd_24h_vol||0) / maxVol * 100).toFixed(1);
    return `<div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-family:var(--mono);font-size:0.7rem;">
        <span style="color:var(--muted2)">${c.sym}</span>
        <span style="color:var(--muted)">${fmt(d.usd_24h_vol||0)}</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${c.color};border-radius:3px;transition:width 0.5s ease;"></div>
      </div>
    </div>`;
  }).join('');

  renderChart();
  renderSentiment(data);
}

function generateSparkline(isUp, color) {
  const pts = Array.from({length: 20}, (_, i) => {
    const trend = isUp ? i * 1.5 : -i * 1.5;
    return 40 - trend/3 + (Math.random() - 0.5) * 15;
  });
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map(p => ((p - min) / (max - min)) * 35 + 5);
  const path = norm.map((p, i) => `${i===0?'M':'L'}${i*4.2},${40-p}`).join(' ');
  return `<svg viewBox="0 0 80 40" style="width:100%;height:35px;"><path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.8"/></svg>`;
}

/* ====== CHART ====== */
let currentPeriod = '1D';
function setPeriod(p, btn) {
  currentPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderChart();
}

function renderChart() {
  const pts = currentPeriod === '1D' ? 48 : currentPeriod === '7D' ? 84 : currentPeriod === '1M' ? 120 : 200;
  const basePrice = prices.bitcoin?.usd || 67000;
  const data = [];
  let p = basePrice * 0.85;
  for (let i = 0; i < pts; i++) {
    p = p * (1 + (Math.random() - 0.485) * 0.02);
    data.push(p);
  }
  data[data.length - 1] = basePrice;

  const min = Math.min(...data), max = Math.max(...data);
  const pad = (max - min) * 0.1;
  const w = 800, h = 200;
  const x = (i) => (i / (data.length - 1)) * w;
  const y = (v) => h - ((v - (min-pad)) / ((max+pad) - (min-pad))) * h;

  const area = `M0,${h} ` + data.map((v,i) => `L${x(i)},${y(v)}`).join(' ') + ` L${w},${h} Z`;
  const line = data.map((v,i) => `${i===0?'M':'L'}${x(i)},${y(v)}`).join(' ');
  const isUp = data[data.length-1] > data[0];
  const col = isUp ? '#00ff88' : '#ff4466';

  document.getElementById('price-chart').innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#grad)"/>
    <path d="${line}" fill="none" stroke="${col}" stroke-width="1.5"/>
    <circle cx="${x(data.length-1)}" cy="${y(data[data.length-1])}" r="4" fill="${col}" stroke="var(--bg)" stroke-width="2"/>
  `;
}

/* ====== WEATHER ====== */
const weatherSVGs = {
  clear: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  partlyCloudy: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41"/><path d="M15.3 10.3A5 5 0 0 0 14 7h-1.26A8 8 0 1 0 4 15.25c0 .3.03.6.09.9M22 19a3 3 0 0 0-3-3h-1.3c-.2-2.5-2.2-4.5-4.7-4.5s-4.5 2-4.7 4.5H7A3 3 0 0 0 7 22h12a3 3 0 0 0 3-3z"/></svg>`,
  cloudy: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-3.41-3.21-6-6.5-6a6.5 6.5 0 0 0-6.5 6.5C3 11.5 5 13.5 5 15.5A3.5 3.5 0 0 0 8.5 19Z"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M5 8h14M3 12h18M5 16h14M8 20h8"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-3.41-3.21-6-6.5-6a6.5 6.5 0 0 0-6.5 6.5C3 11.5 5 13.5 5 15.5A3.5 3.5 0 0 0 8.5 19Z"/><path d="M8 21v2M12 21v2M16 21v2"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M2 12h20M12 2v20M5 5l14 14M19 5L5 19"/></svg>`,
  thunderstorm: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-3.41-3.21-6-6.5-6a6.5 6.5 0 0 0-6.5 6.5C3 11.5 5 13.5 5 15.5A3.5 3.5 0 0 0 8.5 19Z"/><path d="M13 18l-3 4v-4H8l5-6v5h3z"/></svg>`,
  fallback: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};
const weatherCodes = {
  0:'clear',1:'clear',2:'partlyCloudy',3:'cloudy',45:'fog',48:'fog',
  51:'partlyCloudy',53:'rain',55:'rain',61:'rain',63:'rain',65:'rain',
  71:'snow',73:'snow',75:'snow',80:'partlyCloudy',81:'rain',82:'thunderstorm',
  85:'snow',86:'snow',95:'thunderstorm',96:'thunderstorm',99:'thunderstorm'
};
const weatherDescs = {
  0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Depositing rime fog',
  51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',
  71:'Slight snowfall',73:'Moderate snowfall',75:'Heavy snowfall',80:'Slight showers',81:'Moderate showers',82:'Violent showers',
  85:'Slight snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Heavy thunderstorm with hail'
};
const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

async function fetchWeather() {
  const city = document.getElementById('city-input').value.trim();
  if (!city) return;

  document.getElementById('weather-loading').classList.add('show');
  document.getElementById('weather-error').classList.remove('show');
  document.getElementById('weather-main').classList.remove('loaded');
  document.getElementById('search-btn').disabled = true;
  document.getElementById('search-text').innerHTML = '<span class="loader"></span>';

  try {
    // Geocode
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results?.length) throw new Error('City not found');

    const loc = geoData.results[0];
    const { latitude, longitude, name, country } = loc;

    // Weather
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
    const wxData = await wxRes.json();

    const cur = wxData.current_weather;
    const code = cur.weathercode;
    const key = weatherCodes[code] || 'fallback';
    const iconSVG = weatherSVGs[key] || weatherSVGs.fallback;
    const desc = weatherDescs[code] || 'Unknown';
    const temp = Math.round(cur.temperature);
    const windspeed = cur.windspeed;

    // Feels like (approx wind chill)
    const feelsLike = Math.round(temp - (windspeed * 0.05));
    const hourIdx = 12;
    const humid = wxData.hourly.relativehumidity_2m[hourIdx] || '...';
    const vis = wxData.hourly.visibility[hourIdx];

    document.getElementById('w-city').textContent = name;
    document.getElementById('w-country').textContent = country;
    document.getElementById('w-temp').textContent = `${temp}°C`;
    document.getElementById('w-icon').innerHTML = iconSVG;
    document.getElementById('w-desc').textContent = desc;
    document.getElementById('w-feels').textContent = `${feelsLike}°C`;
    document.getElementById('w-humid').textContent = `${humid}%`;
    document.getElementById('w-wind').textContent = `${Math.round(windspeed)} km/h`;
    document.getElementById('w-vis').textContent = vis ? `${(vis/1000).toFixed(1)} km` : '...';

    // Forecast
    document.getElementById('forecast-row').innerHTML = wxData.daily.time.map((t, i) => {
      const d = new Date(t);
      const dayName = i === 0 ? 'TODAY' : days[d.getDay()];
      const fc_code = wxData.daily.weathercode[i];
      const fc_key = weatherCodes[fc_code] || 'fallback';
      const fc_svg = weatherSVGs[fc_key] || weatherSVGs.fallback;
      return `<div class="forecast-day">
        <div class="fc-day">${dayName}</div>
        <div class="fc-icon" style="display:flex; justify-content:center; margin-bottom:6px;">${fc_svg}</div>
        <div class="fc-high">${Math.round(wxData.daily.temperature_2m_max[i])}°</div>
        <div class="fc-low">${Math.round(wxData.daily.temperature_2m_min[i])}°</div>
      </div>`;
    }).join('');

    document.getElementById('weather-main').classList.add('loaded');
  } catch (e) {
    document.getElementById('weather-error').classList.add('show');
  } finally {
    document.getElementById('weather-loading').classList.remove('show');
    document.getElementById('search-btn').disabled = false;
    document.getElementById('search-text').textContent = 'Search';
  }
}

/* ====== SENTIMENT ====== */
async function fetchSentiment() {
  try {
    const res = await fetch('https://api.alternative.me/fng/');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data && data.data && data.data[0]) {
      const val = parseInt(data.data[0].value);
      const label = data.data[0].value_classification;
      renderSentimentUI(val, label);
    } else {
      throw new Error('Invalid data format');
    }
  } catch (e) {
    // Fallback to neutral/simulated values
    const val = 55;
    const label = 'Neutral';
    renderSentimentUI(val, label);
  }
}

function renderSentimentUI(fgi, label) {
  const color = fgi < 30 ? 'var(--red)' : fgi < 50 ? 'var(--yellow)' : fgi < 75 ? 'var(--green)' : 'var(--green)';
  document.getElementById('gauge-val').textContent = fgi;
  document.getElementById('gauge-val').style.color = color;
  document.getElementById('gauge-ring').style.borderColor = color;
  document.getElementById('gauge-status').textContent = label;
  document.getElementById('gauge-status').style.color = color;
}

function renderSentiment(data) {
  fetchSentiment();

  const domCoins = ['BTC','ETH','SOL','BNB','Other'];
  const domPcts = [42, 18, 8, 6, 26];
  const domColors = ['#f7931a','#627eea','#9945ff','#f3ba2f','#444'];
  document.getElementById('dominance-chart').innerHTML = domCoins.map((c, i) => `
    <div>
      <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:0.7rem;margin-bottom:4px;">
        <span style="color:var(--muted2)">${c}</span><span style="color:var(--muted)">${domPcts[i]}%</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${domPcts[i]}%;background:${domColors[i]};border-radius:3px;"></div>
      </div>
    </div>`).join('');

  document.getElementById('global-stats').innerHTML = [
    { label: 'Total Mkt Cap', val: '$2.34T' },
    { label: '24h Volume', val: '$98.4B' },
    { label: 'BTC Dominance', val: '42.1%' },
    { label: 'Active Coins', val: '14,802' },
    { label: 'Exchanges', val: '614' }
  ].map(s => `
    <div style="display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--border);">
      <span style="font-size:0.75rem;color:var(--muted2);font-family:var(--mono)">${s.label}</span>
      <span style="font-family:var(--mono);font-size:0.8rem;font-weight:600;color:var(--text)">${s.val}</span>
    </div>`).join('');

  const headlines = [
    { title: 'Bitcoin eyes $70K as ETF inflows accelerate', time: '12m ago', src: 'CoinDesk', tag: '+BTC' },
    { title: 'Ethereum Layer-2 volume hits all-time high', time: '38m ago', src: 'The Block', tag: '+ETH' },
    { title: 'Fed signals patience on rate cuts, crypto steady', time: '1h ago', src: 'Reuters', tag: '⚡MACRO' },
    { title: 'Solana DeFi TVL surpasses $6B milestone', time: '2h ago', src: 'Decrypt', tag: '+SOL' },
    { title: 'BlackRock BTC ETF sets new daily inflow record', time: '3h ago', src: 'Bloomberg', tag: '+BTC' },
  ];
  document.getElementById('news-feed').innerHTML = headlines.map(n => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04);gap:16px;">
      <div style="flex:1;">
        <div style="font-size:0.875rem;color:var(--text);font-weight:500;line-height:1.5;">${n.title}</div>
        <div style="display:flex;gap:12px;margin-top:5px;align-items:center;">
          <span style="font-size:0.68rem;font-family:var(--mono);color:var(--muted)">${n.src}</span>
          <span style="font-size:0.68rem;font-family:var(--mono);color:var(--muted2)">${n.time}</span>
        </div>
      </div>
      <span style="font-family:var(--mono);font-size:0.68rem;background:rgba(0,255,136,0.07);color:var(--green);padding:3px 8px;border-radius:4px;white-space:nowrap;">${n.tag}</span>
    </div>`).join('');
}

/* ====== INIT ====== */
fetchCryptoData();
setInterval(fetchCryptoData, 30000);

// Load Lagos weather by default
document.getElementById('city-input').value = 'Lagos';
setTimeout(fetchWeather, 500);

// Initialize weather icon with clean clear SVG
document.getElementById('w-icon').innerHTML = weatherSVGs.clear;
