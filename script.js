/**
 * CryptoBroker Pro — Complete JavaScript
 * Handles auth, market data, dashboard interactivity, and UI controls
 */

(function() {
  'use strict';

  // ===================== UTILITY FUNCTIONS =====================

  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function $$(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function formatCurrency(num, decimals) {
    decimals = decimals != null ? decimals : 2;
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function formatLarge(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  }

  // Simple localStorage-based session
  var session = {
    isLoggedIn: function() { return !!localStorage.getItem('cbp_user'); },
    getUser: function() {
      try { return JSON.parse(localStorage.getItem('cbp_user')); } catch(e) { return null; }
    },
    setUser: function(user) { localStorage.setItem('cbp_user', JSON.stringify(user)); },
    logout: function() { localStorage.removeItem('cbp_user'); }
  };

  // ===================== MOBILE MENU =====================

  var mobileToggle = $('.mobile-menu-toggle');
  var nav = $('nav');
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && e.target !== mobileToggle) {
        nav.classList.remove('open');
      }
    });
  }

  // ===================== PASSWORD TOGGLE =====================

  $$('.toggle-password').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var input = btn.parentElement.querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // ===================== REGISTRATION =====================

  var regForm = $('#registrationForm');
  if (regForm) {
    var passwordInput = $('#password');
    var strengthBar = $('.strength-bar');
    var strengthText = $('.strength-text');

    passwordInput.addEventListener('input', function() {
      var val = passwordInput.value;
      var score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      if (val.length >= 12) score++;

      var strength = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][Math.min(score, 4)];
      var width = Math.min((score / 5) * 100, 100);
      var color = ['#ff4757', '#ff6b6b', '#fbbf24', '#00c897', '#00c897'][Math.min(score, 4)];

      strengthBar.style.width = width + '%';
      strengthBar.style.background = color;
      strengthText.textContent = strength;
    });

    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = $('#name').value.trim();
      var email = $('#email').value.trim();
      var password = passwordInput.value;
      var confirm = $('#confirmPassword').value;
      var terms = $('#terms').checked;
      var errorEl = $('#registerError');

      if (!name || !email || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields.';
        show(errorEl);
        return;
      }
      if (password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters.';
        show(errorEl);
        return;
      }
      if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match.';
        show(errorEl);
        return;
      }
      if (!terms) {
        errorEl.textContent = 'You must agree to the Terms of Service.';
        show(errorEl);
        return;
      }

      // Simulate account creation
      var user = { name: name, email: email, createdAt: new Date().toISOString() };
      session.setUser(user);
      hide(errorEl);

      // Show success animation
      var btn = regForm.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.textContent = '✓ Account Created!';
      btn.style.background = 'linear-gradient(135deg, #00c897, #00d2a0)';
      btn.disabled = true;

      setTimeout(function() {
        window.location.href = 'dashboard.html';
      }, 1000);
    });
  }

  // ===================== LOGIN =====================

  var loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = $('#email').value.trim();
      var password = $('#password').value;
      var errorEl = $('#loginError');

      if (!email || !password) {
        errorEl.textContent = 'Please enter your email and password.';
        show(errorEl);
        return;
      }

      // Simulate login
      var user = { name: email.split('@')[0], email: email, createdAt: new Date().toISOString() };
      session.setUser(user);
      hide(errorEl);

      var btn = loginForm.querySelector('button[type="submit"]');
      btn.textContent = '✓ Logged In!';
      btn.style.background = 'linear-gradient(135deg, #00c897, #00d2a0)';
      btn.disabled = true;

      setTimeout(function() {
        window.location.href = 'dashboard.html';
      }, 800);
    });
  }

  // ===================== MARKET PAGE =====================

  var marketBody = $('#marketTableBody');
  if (marketBody) {
    var coins = [
      { rank: 1, name: 'Bitcoin', symbol: 'BTC', icon: '₿', iconClass: 'btc', price: 67234.18, change: 4.21, volume: 28500000000, marketCap: 1320000000000, color: '#f7931a' },
      { rank: 2, name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', iconClass: 'eth', price: 3447.92, change: 2.83, volume: 14200000000, marketCap: 414000000000, color: '#627eea' },
      { rank: 3, name: 'Solana', symbol: 'SOL', icon: '◎', iconClass: 'sol', price: 187.56, change: 6.14, volume: 3800000000, marketCap: 89000000000, color: '#14f195' },
      { rank: 4, name: 'Cardano', symbol: 'ADA', icon: '₳', iconClass: 'ada', price: 0.65, change: -1.52, volume: 1200000000, marketCap: 23000000000, color: '#0033ad' },
      { rank: 5, name: 'Polkadot', symbol: 'DOT', icon: '●', iconClass: 'dot', price: 8.92, change: 3.45, volume: 890000000, marketCap: 12500000000, color: '#e6007a' },
      { rank: 6, name: 'Avalanche', symbol: 'AVAX', icon: '🔺', iconClass: 'avax', price: 42.30, change: 5.67, volume: 750000000, marketCap: 15500000000, color: '#e84142' },
      { rank: 7, name: 'Chainlink', symbol: 'LINK', icon: '🔗', iconClass: 'link', price: 15.78, change: -0.89, volume: 520000000, marketCap: 9200000000, color: '#2a5ada' },
      { rank: 8, name: 'Polygon', symbol: 'MATIC', icon: '🔷', iconClass: 'matic', price: 0.92, change: 1.23, volume: 410000000, marketCap: 8500000000, color: '#8247e5' },
      { rank: 9, name: 'Uniswap', symbol: 'UNI', icon: '🦄', iconClass: 'uni', price: 8.45, change: -2.14, volume: 280000000, marketCap: 5100000000, color: '#ff007a' },
      { rank: 10, name: 'Dogecoin', symbol: 'DOGE', icon: '🐕', iconClass: 'doge', price: 0.12, change: 8.92, volume: 1800000000, marketCap: 17000000000, color: '#c2a633' },
      { rank: 11, name: 'Shiba Inu', symbol: 'SHIB', icon: '🐶', iconClass: 'shib', price: 0.000025, change: 12.45, volume: 950000000, marketCap: 14700000000, color: '#ff5722' },
      { rank: 12, name: 'Litecoin', symbol: 'LTC', icon: 'Ł', iconClass: 'ltc', price: 84.67, change: -0.34, volume: 340000000, marketCap: 6300000000, color: '#345d9d' },
      { rank: 13, name: 'Cosmos', symbol: 'ATOM', icon: '⚛', iconClass: 'atom', price: 11.23, change: 1.89, volume: 210000000, marketCap: 4300000000, color: '#2e3148' },
      { rank: 14, name: 'Monero', symbol: 'XMR', icon: '🔐', iconClass: 'xmr', price: 178.45, change: 2.11, volume: 98000000, marketCap: 3200000000, color: '#ff6600' },
      { rank: 15, name: 'NEAR Protocol', symbol: 'NEAR', icon: '📡', iconClass: 'near', price: 5.67, change: 7.34, volume: 180000000, marketCap: 5700000000, color: '#000000' }
    ];

    function sparklineSVG(changes) {
      if (!changes || !changes.length) return '';
      var w = 80, h = 30, pad = 2;
      var min = Math.min.apply(null, changes);
      var max = Math.max.apply(null, changes);
      var range = max - min || 1;
      var points = changes.map(function(v, i) {
        var x = pad + (i / (changes.length - 1)) * (w - 2 * pad);
        var y = pad + (1 - (v - min) / range) * (h - 2 * pad);
        return x + ',' + y;
      }).join(' ');
      var color = changes[changes.length - 1] >= changes[0] ? '#00c897' : '#ff4757';
      return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><polyline points="' + points + '" fill="none" stroke="' + color + '" stroke-width="1.5"/></svg>';
    }

    function renderMarket(data) {
      var html = '';
      data.forEach(function(c) {
        var changes = [];
        for (var i = 0; i < 12; i++) {
          changes.push(c.price * (1 + (Math.random() - 0.45) * 0.08 * c.change / Math.abs(c.change || 1)));
        }
        html += '<tr data-symbol="' + c.symbol + '">' +
          '<td>' + c.rank + '</td>' +
          '<td><div class="coin-info"><div class="coin-icon ' + c.iconClass + '" style="background:' + c.color + '20;color:' + c.color + '">' + c.icon + '</div><div><span class="coin-name">' + c.name + '</span><span class="coin-symbol">' + c.symbol + '</span></div></div></td>' +
          '<td class="price-cell">' + (c.price < 0.01 ? '$' + c.price.toFixed(6) : '$' + c.price.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})) + '</td>' +
          '<td class="change-cell ' + (c.change >= 0 ? 'up' : 'down') + '">' + (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%</td>' +
          '<td class="volume-cell">' + formatLarge(c.volume) + '</td>' +
          '<td class="mcap-cell">' + formatLarge(c.marketCap) + '</td>' +
          '<td><div class="mini-sparkline">' + sparklineSVG(changes) + '</div></td>' +
          '<td class="action-cell"><button onclick="alert(\'Trade feature coming soon!\')">Trade</button></td>' +
          '</tr>';
      });
      marketBody.innerHTML = html;
    }

    renderMarket(coins);

    // Search functionality
    var searchInput = $('#marketSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase();
        var filtered = coins.filter(function(c) {
          return c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query);
        });
        renderMarket(filtered);
      });
    }

    // Filter buttons
    $$('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        $$('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        var filter = this.textContent.trim();

        var sorted;
        if (filter === 'Top Gainers') {
          sorted = coins.slice().sort(function(a, b) { return b.change - a.change; });
        } else if (filter === 'Top Losers') {
          sorted = coins.slice().sort(function(a, b) { return a.change - b.change; });
        } else {
          sorted = coins.slice().sort(function(a, b) { return a.rank - b.rank; });
        }
        renderMarket(sorted);
      });
    });
  }

  // ===================== DASHBOARD =====================

  var timeframeButtons = $$('.timeframe-buttons button');
  timeframeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      timeframeButtons.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      // In a real app, this would update the chart data
    });
  });

  // ===================== PROTECT DASHBOARD =====================

  if (window.location.pathname.includes('dashboard.html') && !session.isLoggedIn()) {
    // Show an unauthenticated state or redirect
    var dashboardEl = $('.dashboard');
    if (dashboardEl) {
      dashboardEl.innerHTML = '<div style="text-align:center;padding:80px 24px"><h2 style="margin-bottom:16px">🔒 Access Restricted</h2><p style="color:var(--text-secondary);margin-bottom:24px">Please log in to view your dashboard.</p><a href="login.html" class="btn-primary btn-lg">Log In</a></div>';
    }
  }

  // ===================== CONSOLE BRANDING =====================

  console.log('%c₿ CryptoBroker Pro %cv1.0',
    'font-size:20px;font-weight:800;color:#6c5ce7;',
    'font-size:12px;color:#8b8fa8;');
  console.log('%cInvest Smart. Trade Confident. Grow Wealth.',
    'font-size:14px;color:#00c897;font-style:italic;');

  // ===================== WALLET PAGE =====================

  if (window.location.pathname.includes('wallet.html')) {
    initWallet();
  }

  function initWallet() {
    // --- Assets Data ---
    var assets = [
      { name: 'Bitcoin', symbol: 'BTC', icon: '₿', iconClass: 'btc', balance: 1.42, usdValue: 47896.20, change: 4.21 },
      { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', iconClass: 'eth', balance: 8.75, usdValue: 30169.30, change: 2.83 },
      { name: 'Solana', symbol: 'SOL', icon: '◎', iconClass: 'sol', balance: 124.5, usdValue: 23351.13, change: 6.14 },
      { name: 'Cardano', symbol: 'ADA', icon: '₳', iconClass: 'ada', balance: 15000, usdValue: 9750.00, change: -1.52 },
      { name: 'Tether', symbol: 'USDT', icon: '₮', iconClass: 'usdt', balance: 12450, usdValue: 12450.00, change: 0.01 },
      { name: 'USD Coin', symbol: 'USDC', icon: '◎', iconClass: 'usdc', balance: 2951.26, usdValue: 2951.26, change: 0.00 }
    ];

    // --- Transactions Data (stored in localStorage for persistence) ---
    var storedTxs = localStorage.getItem('cbp_transactions');
    var transactions = storedTxs ? JSON.parse(storedTxs) : generateSeedTransactions();

    function generateSeedTransactions() {
      var now = Date.now();
      var seed = [
        { id: 'tx-01', type: 'deposit', coin: 'BTC', amount: 0.5, usdAmount: 33500.00, status: 'completed', date: now - 86400000 * 14, address: 'bc1q…f5mdq' },
        { id: 'tx-02', type: 'deposit', coin: 'ETH', amount: 5.0, usdAmount: 17250.00, status: 'completed', date: now - 86400000 * 12, address: '0x742…a3b2' },
        { id: 'tx-03', type: 'trade', coin: 'SOL', amount: 50, usdAmount: 9250.00, status: 'completed', date: now - 86400000 * 7, address: 'SOL/USD' },
        { id: 'tx-04', type: 'withdraw', coin: 'USDT', amount: -2000, usdAmount: -2000.00, status: 'completed', date: now - 86400000 * 5, address: '0xabc…1234' },
        { id: 'tx-05', type: 'deposit', coin: 'BTC', amount: 0.25, usdAmount: 16800.00, status: 'completed', date: now - 86400000 * 3, address: 'bc1q…f5mdq' },
        { id: 'tx-06', type: 'staking', coin: 'ADA', amount: 5000, usdAmount: 3250.00, status: 'completed', date: now - 86400000 * 2, address: 'Staking Pool #42' },
        { id: 'tx-07', type: 'withdraw', coin: 'BTC', amount: -0.1, usdAmount: -6723.00, status: 'pending', date: now - 3600000, address: 'bc1q…xyz99' },
        { id: 'tx-08', type: 'trade', coin: 'ETH', amount: 2.0, usdAmount: 6900.00, status: 'completed', date: now - 7200000, address: 'ETH/USD' },
        { id: 'tx-09', type: 'deposit', coin: 'USDC', amount: 2951.26, usdAmount: 2951.26, status: 'completed', date: now - 86400000, address: '0xdef…5678' },
        { id: 'tx-10', type: 'trade', coin: 'SOL', amount: -20, usdAmount: -3750.00, status: 'completed', date: now - 18000000, address: 'SOL/BTC' },
        { id: 'tx-11', type: 'deposit', coin: 'BTC', amount: 0.77, usdAmount: 51800.00, status: 'completed', date: now - 86400000 * 30, address: 'bc1q…f5mdq' },
        { id: 'tx-12', type: 'staking', coin: 'ETH', amount: 1.75, usdAmount: 6033.86, status: 'completed', date: now - 86400000 * 10, address: 'Lido Staking' }
      ];
      localStorage.setItem('cbp_transactions', JSON.stringify(seed));
      return seed;
    }

    function saveTransactions() {
      localStorage.setItem('cbp_transactions', JSON.stringify(transactions));
    }

    // --- Render Assets Table ---
    var assetsBody = $('#assetsTableBody');
    function renderAssets() {
      if (!assetsBody) return;
      var html = '';
      assets.forEach(function(a) {
        html += '<tr>' +
          '<td><div class="asset-info"><div class="asset-icon ' + a.iconClass + '">' + a.icon + '</div><div><strong>' + a.name + '</strong><span style="display:block;font-size:11px;color:var(--text-muted)">' + a.symbol + '</span></div></div></td>' +
          '<td class="asset-balance">' + a.balance.toLocaleString() + ' ' + a.symbol + '</td>' +
          '<td class="asset-usd">' + formatCurrency(a.usdValue) + '</td>' +
          '<td class="asset-change ' + (a.change >= 0 ? 'up' : 'down') + '">' + (a.change >= 0 ? '+' : '') + a.change.toFixed(2) + '%</td>' +
          '<td class="asset-actions"><button class="btn-outline btn-sm asset-deposit" data-coin="' + a.symbol + '">Deposit</button><button class="btn-outline btn-sm asset-withdraw" data-coin="' + a.symbol + '">Withdraw</button></td>' +
          '</tr>';
      });
      assetsBody.innerHTML = html;

      // Bind per-asset buttons
      $$('.asset-deposit', assetsBody).forEach(function(btn) {
        btn.addEventListener('click', function() {
          openDepositModal(this.dataset.coin);
        });
      });
      $$('.asset-withdraw', assetsBody).forEach(function(btn) {
        btn.addEventListener('click', function() {
          openWithdrawModal(this.dataset.coin);
        });
      });
    }

    // --- Render Transactions ---
    var txList = $('#txList');
    var txFilterType = $('#txFilterType');
    var txSearch = $('#txSearch');
    var currentTxPage = 1;
    var perPage = 8;

    function getFilteredTxs() {
      var filtered = transactions.slice();
      var type = txFilterType ? txFilterType.value : 'all';
      var query = txSearch ? txSearch.value.toLowerCase() : '';
      if (type !== 'all') {
        filtered = filtered.filter(function(t) { return t.type === type; });
      }
      if (query) {
        filtered = filtered.filter(function(t) {
          return t.coin.toLowerCase().includes(query) || String(t.usdAmount).includes(query) || t.address.toLowerCase().includes(query);
        });
      }
      filtered.sort(function(a, b) { return b.date - a.date; });
      return filtered;
    }

    function renderTransactions(page) {
      if (!txList) return;
      currentTxPage = page || 1;
      var filtered = getFilteredTxs();
      var totalPages = Math.ceil(filtered.length / perPage) || 1;
      if (currentTxPage > totalPages) currentTxPage = totalPages;
      var start = (currentTxPage - 1) * perPage;
      var pageItems = filtered.slice(start, start + perPage);

      var html = '';
      pageItems.forEach(function(tx) {
        var typeLabel = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
        var amountClass = tx.amount >= 0 ? 'positive' : 'negative';
        var amountPrefix = tx.amount >= 0 ? '+' : '';
        var dateStr = new Date(tx.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
        var timeStr = new Date(tx.date).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

        var icon = '';
        if (tx.type === 'deposit') icon = '⬇';
        else if (tx.type === 'withdraw') icon = '⬆';
        else if (tx.type === 'trade') icon = '🔄';
        else if (tx.type === 'staking') icon = '🥩';

        html += '<div class="tx-item">' +
          '<div class="tx-type"><div class="tx-type-icon ' + tx.type + '">' + icon + '</div><div class="tx-type-text"><strong>' + typeLabel + '</strong><span>' + tx.coin + '</span></div></div>' +
          '<div class="tx-amount ' + amountClass + '">' + amountPrefix + tx.amount + ' ' + tx.coin + '<span style="display:block;font-size:11px;color:var(--text-muted)">' + (tx.usdAmount >= 0 ? '+' : '') + formatCurrency(tx.usdAmount) + '</span></div>' +
          '<div><span class="tx-status ' + tx.status + '">' + tx.status.charAt(0).toUpperCase() + tx.status.slice(1) + '</span></div>' +
          '<div class="tx-date">' + dateStr + '<span style="display:block;font-size:10px">' + timeStr + '</span></div>' +
          '<div style="font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + tx.address + '">' + tx.address + '</div>' +
          '</div>';
      });

      if (!pageItems.length) {
        html = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No transactions found</div>';
      }
      txList.innerHTML = html;

      // Pagination
      var pagEl = $('#txPagination');
      if (pagEl && totalPages > 1) {
        var pagHTML = '<button class="tx-page-btn" ' + (currentTxPage <= 1 ? 'disabled' : '') + ' data-page="' + (currentTxPage - 1) + '">‹</button>';
        for (var p = 1; p <= totalPages; p++) {
          pagHTML += '<button class="tx-page-btn' + (p === currentTxPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        pagHTML += '<button class="tx-page-btn" ' + (currentTxPage >= totalPages ? 'disabled' : '') + ' data-page="' + (currentTxPage + 1) + '">›</button>';
        pagEl.innerHTML = pagHTML;
        $$('.tx-page-btn', pagEl).forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (!this.disabled) renderTransactions(parseInt(this.dataset.page));
          });
        });
      } else if (pagEl) {
        pagEl.innerHTML = '';
      }
    }

    if (txFilterType) {
      txFilterType.addEventListener('change', function() { renderTransactions(1); });
    }
    if (txSearch) {
      txSearch.addEventListener('input', function() { renderTransactions(1); });
    }

    // --- Deposit Modal ---
    var depositModal = $('#depositModal');
    var withdrawModal = $('#withdrawModal');

    function openDepositModal(coin) {
      if (!depositModal) return;
      var coinSelect = $('#depositCoin');
      if (coin && coinSelect) {
        var opts = coinSelect.options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === coin) { coinSelect.value = coin; break; }
        }
      }
      hide(depositModal);
      depositModal.classList.remove('hidden');
      // Reset to crypto tab
      $$('.deposit-tab').forEach(function(t) { t.classList.remove('active'); });
      var cryptoTab = $('.deposit-tab[data-tab="crypto"]');
      if (cryptoTab) cryptoTab.classList.add('active');
      $$('.deposit-panel').forEach(function(p) { p.classList.remove('active'); });
      var cryptoPanel = $('#panelCrypto');
      if (cryptoPanel) cryptoPanel.classList.add('active');
    }

    function openWithdrawModal(coin) {
      if (!withdrawModal) return;
      var coinSelect = $('#withdrawCoin');
      if (coin && coinSelect) {
        var opts = coinSelect.options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === coin) { coinSelect.value = coin; break; }
        }
      }
      hide(withdrawModal);
      withdrawModal.classList.remove('hidden');
      $('#withdrawAmount').value = '';
      $('#withdrawAddress').value = '';
      $('#withdrawConfirm').checked = false;
      hide($('#withdrawError'));
      updateFeeHint();
    }

    // Deposit tabs
    $$('.deposit-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        $$('.deposit-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        var panelName = 'panel' + this.dataset.tab.charAt(0).toUpperCase() + this.dataset.tab.slice(1);
        $$('.deposit-panel').forEach(function(p) { p.classList.remove('active'); });
        var panel = $('#' + panelName);
        if (panel) panel.classList.add('active');
      });
    });

    // Coin selection changes
    var depositCoin = $('#depositCoin');
    var depositNetwork = $('#depositNetwork');
    var depositNetworkName = $('#depositNetworkName');
    if (depositCoin && depositNetworkName) {
      depositCoin.addEventListener('change', function() {
        depositNetworkName.textContent = this.value;
      });
    }

    // Copy address
    var copyBtn = $('#copyAddress');
    var depositAddr = $('#depositAddress');
    if (copyBtn && depositAddr) {
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(depositAddr.value).then(function() {
          copyBtn.textContent = '✓ Copied!';
          setTimeout(function() { copyBtn.textContent = '📋 Copy'; }, 2000);
        }).catch(function() {
          depositAddr.select();
          document.execCommand('copy');
          copyBtn.textContent = '✓ Copied!';
          setTimeout(function() { copyBtn.textContent = '📋 Copy'; }, 2000);
        });
      });
    }

    // Submit Fiat Deposit
    var submitFiat = $('#submitFiat');
    if (submitFiat) {
      submitFiat.addEventListener('click', function() {
        var amount = parseFloat($('#fiatAmount').value);
        if (!amount || amount < 100) {
          showToast('⚠️ Minimum deposit is $100', '#fbbf24');
          return;
        }
        addTransaction('deposit', 'USD', amount, amount);
        closeAllModals();
        showToast('✅ Deposit of ' + formatCurrency(amount) + ' initiated!');
      });
    }

    // Submit Card Deposit
    var submitCard = $('#submitCard');
    if (submitCard) {
      submitCard.addEventListener('click', function() {
        var amount = parseFloat($('#cardAmount').value);
        if (!amount || amount < 50) {
          showToast('⚠️ Minimum deposit is $50', '#fbbf24');
          return;
        }
        var fee = amount * 0.035;
        var net = amount - fee;
        addTransaction('deposit', 'USD', net, net);
        closeAllModals();
        showToast('✅ $' + amount.toFixed(2) + ' deposited! Fee: $' + fee.toFixed(2));
      });
    }

    // Withdraw flow
    var submitWithdraw = $('#submitWithdraw');
    var withdrawCoin = $('#withdrawCoin');
    var withdrawAmount = $('#withdrawAmount');
    var withdrawAddress = $('#withdrawAddress');

    if (withdrawAmount) {
      withdrawAmount.addEventListener('input', updateFeeHint);
    }
    if (withdrawCoin) {
      withdrawCoin.addEventListener('change', updateFeeHint);
    }

    function updateFeeHint() {
      var coin = withdrawCoin ? withdrawCoin.value : 'BTC';
      var amount = parseFloat(withdrawAmount ? withdrawAmount.value : 0) || 0;
      var feeMap = { BTC: 0.0005, ETH: 0.002, SOL: 0.01, USDT: 3.0, USD: 0 };
      var fee = feeMap[coin] || 0;
      var feeHint = $('#feeHint');
      if (feeHint) {
        if (coin === 'USD') {
          feeHint.textContent = 'No network fee • Will arrive in 1-3 business days';
        } else {
          feeHint.textContent = 'Network fee: ~' + fee + ' ' + coin + ' • You\'ll receive: ' + (amount - fee).toFixed(6) + ' ' + coin;
        }
      }
    }

    var maxBtn = $('#maxBtn');
    if (maxBtn) {
      maxBtn.addEventListener('click', function() {
        var coin = withdrawCoin ? withdrawCoin.value : 'BTC';
        var maxMap = { BTC: 1.42, ETH: 8.75, SOL: 124.5, USDT: 12450, USD: 98234.50 };
        var max = maxMap[coin] || 0;
        if (withdrawAmount) withdrawAmount.value = max;
        updateFeeHint();
      });
    }

    if (submitWithdraw) {
      submitWithdraw.addEventListener('click', function() {
        var coin = withdrawCoin ? withdrawCoin.value : 'BTC';
        var amount = parseFloat(withdrawAmount ? withdrawAmount.value : 0);
        var address = withdrawAddress ? withdrawAddress.value.trim() : '';
        var confirmed = $('#withdrawConfirm');
        var errorEl = $('#withdrawError');

        if (!amount || amount <= 0) {
          if (errorEl) { errorEl.textContent = 'Please enter a valid amount.'; show(errorEl); }
          return;
        }
        if (!address) {
          if (errorEl) { errorEl.textContent = 'Please enter a destination address or account.'; show(errorEl); }
          return;
        }
        if (confirmed && !confirmed.checked) {
          if (errorEl) { errorEl.textContent = 'Please confirm the withdrawal address is correct.'; show(errorEl); }
          return;
        }
        hide(errorEl);

        // Simulate withdrawal with conversion to USD
        var priceMap = { BTC: 67234, ETH: 3448, SOL: 187.56, USDT: 1, USD: 1 };
        var usdAmount = -(amount * (priceMap[coin] || 1));
        addTransaction('withdraw', coin, -amount, usdAmount, address);
        closeAllModals();
        showToast('✅ Withdrawal of ' + amount + ' ' + coin + ' submitted!');
      });
    }

    function addTransaction(type, coin, amount, usdAmount, address) {
      var tx = {
        id: 'tx-' + Date.now(),
        type: type,
        coin: coin,
        amount: amount,
        usdAmount: usdAmount,
        status: type === 'deposit' ? 'pending' : 'pending',
        date: Date.now(),
        address: address || 'Processing...'
      };
      transactions.unshift(tx);
      saveTransactions();
      renderTransactions(1);

      // Simulate pending transactions resolving
      setTimeout(function() {
        tx.status = 'completed';
        saveTransactions();
        renderTransactions(currentTxPage);
      }, 8000);
    }

    // --- Modal Controls ---
    var btnDeposit = $('#btnDeposit');
    var btnWithdraw = $('#btnWithdraw');
    var closeDeposit = $('#closeDeposit');
    var closeWithdraw = $('#closeWithdraw');

    if (btnDeposit) btnDeposit.addEventListener('click', function() { openDepositModal(); });
    if (btnWithdraw) btnWithdraw.addEventListener('click', function() { openWithdrawModal(); });
    if (closeDeposit) closeDeposit.addEventListener('click', closeAllModals);
    if (closeWithdraw) closeWithdraw.addEventListener('click', closeAllModals);

    function closeAllModals() {
      if (depositModal) depositModal.classList.add('hidden');
      if (withdrawModal) withdrawModal.classList.add('hidden');
    }

    // Close modals on overlay click
    $$('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeAllModals();
      });
    });

    // ESC key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeAllModals();
    });

    // --- Init ---
    renderAssets();
    renderTransactions(1);
  }

  // ===================== SETTINGS PAGE =====================

  if (window.location.pathname.includes('settings.html')) {
    initSettings();
  }

  function initSettings() {
    // --- Section Navigation ---
    var navItems = $$('.settings-nav-item');
    var sections = $$('.settings-section');

    navItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        var sectionId = this.dataset.section;

        navItems.forEach(function(n) { n.classList.remove('active'); });
        this.classList.add('active');

        sections.forEach(function(s) { s.classList.remove('active'); });
        var targetSection = $('#section' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
        if (targetSection) targetSection.classList.add('active');

        // Update URL hash
        history.replaceState(null, null, '#' + sectionId);
      });
    });

    // Load section from URL hash
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var hashNav = $('.settings-nav-item[data-section="' + hash + '"]');
      if (hashNav) hashNav.click();
    }

    // --- Profile Form ---
    var profileForm = $('#profileForm');
    if (profileForm) {
      var bioInput = $('#bio');
      var bioCount = $('#bioCount');
      if (bioInput && bioCount) {
        bioInput.addEventListener('input', function() {
          bioCount.textContent = this.value.length;
        });
      }

      profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var firstName = $('#firstName').value.trim();
        var lastName = $('#lastName').value.trim();

        if (firstName && lastName) {
          var initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
          var avatarEl = $('#profileAvatar');
          var navAvatar = $('#navAvatar');
          var navName = $('#navName');
          if (avatarEl) avatarEl.textContent = initials;
          if (navAvatar) navAvatar.textContent = initials;
          if (navName) navName.textContent = firstName + ' ' + lastName;
        }

        showToast('✅ Profile updated successfully!');
      });
    }

    // --- Security: Change Password ---
    var btnChangePassword = $('#btnChangePassword');
    var passwordModal = $('#passwordModal');
    var closePassword = $('#closePassword');

    if (btnChangePassword && passwordModal) {
      btnChangePassword.addEventListener('click', function() {
        passwordModal.classList.remove('hidden');
      });
    }
    if (closePassword && passwordModal) {
      closePassword.addEventListener('click', function() {
        passwordModal.classList.add('hidden');
      });
    }

    var submitPassword = $('#submitPassword');
    if (submitPassword) {
      submitPassword.addEventListener('click', function() {
        var current = $('#currentPassword').value;
        var newPass = $('#newPassword').value;
        var confirm = $('#confirmNewPassword').value;
        var errorEl = $('#passwordError');

        if (!current) { show(errorEl); errorEl.textContent = 'Please enter your current password.'; return; }
        if (newPass.length < 8) { show(errorEl); errorEl.textContent = 'New password must be at least 8 characters.'; return; }
        if (newPass !== confirm) { show(errorEl); errorEl.textContent = 'Passwords do not match.'; return; }
        if (current === newPass) { show(errorEl); errorEl.textContent = 'New password must be different from current.'; return; }

        hide(errorEl);
        if (passwordModal) passwordModal.classList.add('hidden');
        $('#currentPassword').value = '';
        $('#newPassword').value = '';
        $('#confirmNewPassword').value = '';
        showToast('🔒 Password changed successfully!');
      });
    }

    // --- Security: 2FA Modal ---
    var btnManage2FA = $('#btnManage2FA');
    var twoFAModal = $('#twoFAModal');
    var close2FA = $('#close2FA');
    if (btnManage2FA && twoFAModal) {
      btnManage2FA.addEventListener('click', function() { twoFAModal.classList.remove('hidden'); });
    }
    if (close2FA && twoFAModal) {
      close2FA.addEventListener('click', function() { twoFAModal.classList.add('hidden'); });
    }

    // --- Security: Backup Codes ---
    var btnBackupCodes = $('#btnBackupCodes');
    if (btnBackupCodes) {
      btnBackupCodes.addEventListener('click', function() {
        var codes = [];
        for (var i = 0; i < 8; i++) {
          codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        showToast('🔑 Backup codes generated! Check your email.');
      });
    }

    // --- Security: Manage Passkey ---
    var btnManagePasskey = $('#btnManagePasskey');
    if (btnManagePasskey) {
      btnManagePasskey.addEventListener('click', function() {
        showToast('🔐 Passkey management coming soon!');
      });
    }

    // --- Security: Trusted Devices ---
    var btnDevices = $('#btnDevices');
    if (btnDevices) {
      btnDevices.addEventListener('click', function() {
        showToast('📱 Device management coming soon!');
      });
    }

    // --- Notifications: Save ---
    var saveNotif = $('#saveNotifications');
    if (saveNotif) {
      saveNotif.addEventListener('click', function() {
        showToast('🔔 Notification preferences saved!');
      });
    }

    // --- API Keys: Create ---
    var btnCreateApiKey = $('#btnCreateApiKey');
    var apiKeyModal = $('#apiKeyModal');
    var closeApiKey = $('#closeApiKey');
    if (btnCreateApiKey && apiKeyModal) {
      btnCreateApiKey.addEventListener('click', function() { apiKeyModal.classList.remove('hidden'); });
    }
    if (closeApiKey && apiKeyModal) {
      closeApiKey.addEventListener('click', function() { apiKeyModal.classList.add('hidden'); });
    }

    var submitApiKey = $('#submitApiKey');
    if (submitApiKey) {
      submitApiKey.addEventListener('click', function() {
        var name = $('#apiKeyName').value.trim();
        if (!name) { showToast('⚠️ Please enter a key name.', '#fbbf24'); return; }
        apiKeyModal.classList.add('hidden');
        $('#apiKeyName').value = '';
        showToast('🔑 API key "' + name + '" generated!');
      });
    }

    // --- Appearance: Theme selection ---
    $$('.theme-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        $$('.theme-option').forEach(function(o) { o.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // --- Appearance: Color scheme ---
    $$('.color-scheme').forEach(function(cs) {
      cs.addEventListener('click', function() {
        $$('.color-scheme').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // --- Appearance: Save ---
    var saveAppearance = $('#saveAppearance');
    if (saveAppearance) {
      saveAppearance.addEventListener('click', function() {
        showToast('🎨 Appearance preferences saved!');
      });
    }

    // --- Close modals on overlay ---
    $$('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });

    // --- ESC to close modals ---
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        $$('.modal-overlay').forEach(function(o) { o.classList.add('hidden'); });
      }
    });
  }

  // ===================== SHARED TOAST =====================
  function showToast(msg, bg) {
    var toast = $('#toast');
    var toastMsg = $('#toastMsg');
    if (!toast) return;
    toast.style.background = bg || 'var(--green)';
    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(function() { toast.classList.add('hidden'); }, 3500);
  }

})();
