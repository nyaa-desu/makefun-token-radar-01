/* Token Radar's page: the board, the detail view and the live view, rendered from window.RADAR.
   No network, no framework. The farm plan is generated here, from the row's own record, by the
   same rules the board's farm_steps were written with (lib/model.ts): the capital follows the
   protocol's TVL, the hold follows its age, the gas follows its chain, and the action follows its
   category. A row's plan in the page and its plan in board.json are the same plan. */
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA || !Array.isArray(DATA.rows)) {
    document.getElementById('rows').innerHTML = '<tr><td colspan="8">No radar data: data.js did not load.</td></tr>';
    return;
  }

  var rows = DATA.rows;
  var live = DATA.live || [];
  var MODEL = DATA.model;

  var state = { q: '', category: '', chain: '', watchlist: false, sort: 'rank', detail: null };

  // ---------------------------------------------------------------- helpers

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function money(n) {
    if (n == null || !isFinite(n)) return '—';
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function moneyShort(n) {
    if (n == null || !isFinite(n)) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }

  function pct(n) {
    if (n == null || !isFinite(n)) return '—';
    var s = (n > 0 ? '+' : '') + n.toFixed(2) + '%';
    var cls = n > 0 ? 'pos' : n < 0 ? 'neg' : '';
    return '<span class="' + cls + '">' + s + '</span>';
  }

  function ageText(days) {
    if (days == null) return '—';
    if (days < 365) return days + 'd';
    return (days / 365).toFixed(1) + 'y';
  }

  function chainOf(row) { return row.chains && row.chains.length > 0 ? row.chains[0] : 'its main chain'; }

  // ---------------------------------------------------------------- the model, in the page

  /** The TVL scale of the value model: (TVL / $1M) ^ 0.75. */
  function tvlScale(row) {
    return Math.pow(Math.max(row.tvl_usd, 1) / MODEL.scale_unit_usd, MODEL.tvl_exponent);
  }

  /** What one transaction costs on a chain, as the farm plan states it. */
  function gasFor(chain) {
    var c = String(chain).toLowerCase();
    if (c === 'ethereum') return { tx: '$4 to $12 of gas', weekly: '$3 to $8 of gas a week' };
    if (c === 'solana') return { tx: 'under $0.10 of fees', weekly: 'under $0.10 of fees a week' };
    if (c === 'base' || c === 'arbitrum' || c === 'optimism' || c === 'polygon' || c === 'bnb chain' || c === 'binance') {
      return { tx: 'under $0.50 of gas', weekly: 'under $0.50 of gas a week' };
    }
    return { tx: 'about $1 to $3 of gas', weekly: 'about $1 of gas a week' };
  }

  /** How much capital one farm position needs, from the protocol's own TVL. */
  function capitalFor(row) {
    if (row.tvl_usd >= 5e9) return 250;
    if (row.tvl_usd >= 1e9) return 150;
    if (row.tvl_usd >= 1e8) return 100;
    return 50;
  }

  /** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
  function holdDaysFor(age) {
    if (age == null) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }

  /** The category's one action, in the words a farmer can follow. */
  function actionFor(row, capital, chain) {
    var c = (row.category || '').toLowerCase();
    var name = row.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) {
      return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' as a lender and keep the position open.';
    }
    if (c.indexOf('dex') >= 0 || c.indexOf('leveraged farm') >= 0) {
      return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    }
    if (c.indexOf('yield') >= 0 || c.indexOf('vault') >= 0 || c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('onchain capital') >= 0) {
      return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the shares.';
    }
    if (c.indexOf('bridge') >= 0) {
      return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    }
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) {
      return 'Stake $' + capital + " of the chain's staking asset through " + name + ' and keep the receipt.';
    }
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) {
      return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedged position.';
    }
    if (c.indexOf('prediction') >= 0) {
      return 'Fund $' + capital + ' and place one market position on ' + name + '.';
    }
    if (c.indexOf('stable') >= 0) {
      return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    }
    if (c.indexOf('rwa') >= 0) {
      return "Mint $" + capital + " of the protocol's yield-bearing asset on " + chain + ' and hold it.';
    }
    if (c.indexOf('insurance') >= 0) {
      return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy.';
    }
    if (c.indexOf('liquid') >= 0) {
      return 'Deposit $' + capital + ' of the liquid asset through ' + name + ' on ' + chain + ' and keep the receipt.';
    }
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }

  /**
   * A protocol's farm plan: six steps, seven when it runs on three or more chains. Each step is
   * an action with what it costs and how long it takes, derived from the row's own record.
   */
  function farmSteps(row) {
    var chain = chainOf(row);
    var capital = capitalFor(row);
    var hold = holdDaysFor(row.age_days);
    var gas = gasFor(chain);
    var steps = [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'nothing to set up', time: '5 minutes' },
      { text: actionFor(row, capital, chain), cost: '$' + capital + ' of capital and ' + gas.tx, time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: gas.weekly, time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' },
    ];
    if (row.chains && row.chains.length >= 3) {
      var second = row.chains[1];
      steps.push({
        text: 'Repeat the core action once on ' + second + ' with half the capital, so the position is counted on two chains.',
        cost: '$' + Math.floor(capital / 2) + ' of capital and ' + gasFor(second).tx,
        time: '15 minutes',
      });
    }
    return steps;
  }

  // ---------------------------------------------------------------- filtering and sorting

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var out = rows.filter(function (r) {
      if (state.watchlist && !r.on_watchlist) return false;
      if (state.category && r.category !== state.category) return false;
      if (state.chain && (!r.chains || r.chains.indexOf(state.chain) < 0)) return false;
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var key = state.sort;
    var cmp = {
      rank: function (a, b) { return a.rank - b.rank; },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd || a.rank - b.rank; },
      growth: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0) || a.rank - b.rank; },
      age: function (a, b) { return (b.age_days == null ? -1 : b.age_days) - (a.age_days == null ? -1 : a.age_days) || a.rank - b.rank; },
      name: function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : a.rank - b.rank; },
      category: function (a, b) { return (a.category || '') < (b.category || '') ? -1 : (a.category || '') > (b.category || '') ? 1 : a.rank - b.rank; },
      implied: function (a, b) { return b.implied_value_usd - a.implied_value_usd || a.rank - b.rank; },
    }[key] || function (a, b) { return a.rank - b.rank; };
    return out.sort(cmp);
  }

  // ---------------------------------------------------------------- rendering

  function renderStats() {
    var top = rows.length > 0 ? rows[0] : null;
    $('stats').innerHTML =
      '<div><dt>Ranked</dt><dd>' + rows.length + '</dd></div>' +
      '<div><dt>Watchlist</dt><dd>' + DATA.watchlist_size + '</dd></div>' +
      '<div><dt>Early finds</dt><dd>' + DATA.early_size + '</dd></div>' +
      '<div><dt>Live set aside</dt><dd>' + DATA.live_size + '</dd></div>' +
      '<div><dt>Top implied value</dt><dd>' + (top ? moneyShort(top.implied_value_usd) : '—') + '</dd></div>' +
      '<div><dt>Snapshot</dt><dd>' + esc(DATA.as_of) + '</dd></div>';
  }

  function renderFilters() {
    var cats = [];
    var chains = [];
    rows.forEach(function (r) {
      if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
      (r.chains || []).forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
    });
    cats.sort();
    chains.sort();
    $('category').innerHTML = '<option value="">All categories</option>' + cats.map(function (c) {
      return '<option value="' + esc(c) + '"' + (state.category === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
    $('chain').innerHTML = '<option value="">All chains</option>' + chains.map(function (c) {
      return '<option value="' + esc(c) + '"' + (state.chain === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
  }

  function renderBoard() {
    var list = filtered();
    var html = list.map(function (r) {
      return '<tr data-slug="' + esc(r.slug) + '" tabindex="0"' + (state.detail === r.slug ? ' class="selected"' : '') + '>' +
        '<td class="num">' + r.rank + '</td>' +
        '<td><strong>' + esc(r.name) + '</strong>' + (r.on_watchlist ? '<span class="badge">Watchlist</span>' : '') +
        '<br><span class="tag">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc((r.chains || []).join(', ') || '—') + '</td>' +
        '<td class="num">' + moneyShort(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + ageText(r.age_days) + '</td>' +
        '<td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td>' +
        '</tr>';
    }).join('');
    $('rows').innerHTML = html || '<tr><td colspan="8">Nothing matches these filters.</td></tr>';
    $('count').textContent = list.length + ' of ' + rows.length + ' protocols';
    $('boardNote').textContent = 'Implied value is the radar’s own claim for a token that does not exist yet, from the protocol’s TVL, its seven-day growth, how long it has run with no token, and how many chains it runs on. Ranks are 1 to ' + rows.length + ', rank 1 the most valuable.';
  }

  function renderDetail() {
    var panel = $('detail');
    var row = null;
    if (state.detail) {
      for (var i = 0; i < rows.length; i++) if (rows[i].slug === state.detail) { row = rows[i]; break; }
    }
    if (!row) { panel.hidden = true; $('detailBody').innerHTML = ''; return; }
    panel.hidden = false;
    var scale = tvlScale(row);
    var base = MODEL.scale_unit_usd * scale;
    var steps = farmSteps(row).map(function (s) {
      return '<li>' + esc(s.text) + ' <span class="tag">Cost: ' + esc(s.cost) + '. Time: ' + esc(s.time) + '.</span></li>';
    }).join('');
    $('detailBody').innerHTML =
      '<h2>#' + row.rank + ' ' + esc(row.name) + (row.on_watchlist ? '<span class="badge">Watchlist</span>' : '') + '</h2>' +
      '<p class="tag">' + esc(row.slug) + ' · ' + esc(row.category || 'no category') + ' · ' + esc((row.chains || []).join(', ') || 'no chain') +
      ' · tracked since ' + esc(row.listed_at || 'unknown') + ' · records no token</p>' +
      '<dl class="kv">' +
      '<div><dt>Implied value</dt><dd>' + money(row.implied_value_usd) + '</dd></div>' +
      '<div><dt>TVL</dt><dd>' + money(row.tvl_usd) + '</dd></div>' +
      '<div><dt>7-day growth</dt><dd>' + (row.change_7d == null ? '—' : (row.change_7d > 0 ? '+' : '') + row.change_7d.toFixed(2) + '%') + '</dd></div>' +
      '<div><dt>Age</dt><dd>' + ageText(row.age_days) + '</dd></div>' +
      '<div><dt>Chains</dt><dd>' + (row.chains ? row.chains.length : 0) + '</dd></div>' +
      '</dl>' +
      '<h3>How the value is built</h3>' +
      '<p class="model-line">implied = $1,000,000 × TVL scale ' + scale.toFixed(2) + ' × growth ' + row.growth_multiplier.toFixed(2) +
      ' × maturity ' + row.maturity_multiplier.toFixed(2) + ' × chains ' + row.chain_multiplier.toFixed(2) +
      ' = ' + money(row.implied_value_usd) + '</p>' +
      '<p>TVL scale is (TVL / $1M) ^ 0.75, so a protocol ten times as large is worth about 5.6 times as much, not ten. ' +
      'Growth is the seven-day TVL change, clamped to −60%…+120%, weighted 0.8. Maturity rises with the days the protocol has run with no token, from 0.70 to 1.00 over three years. ' +
      'Each chain past the first adds 3%, up to five. Base value before the multipliers: ' + money(base) + '.</p>' +
      '<h3>How to farm it</h3>' +
      '<ol class="steps">' + steps + '</ol>' +
      '<p class="note">Farm with money you can afford to leave in the position, and claim only from links the protocol itself publishes. A snapshot of activity is no promise of a token.</p>';
  }

  function renderLive() {
    $('liveRows').innerHTML = live.map(function (r) {
      return '<tr>' +
        '<td><strong>' + esc(r.name) + '</strong><br><span class="tag">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc((r.chains || []).join(', ') || '—') + '</td>' +
        '<td class="num">' + moneyShort(r.tvl_usd) + '</td>' +
        '<td class="num">' + (r.mcap_usd == null ? '—' : moneyShort(r.mcap_usd)) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderModel() {
    $('modelText').textContent =
      'Model ' + DATA.model_version + ': implied = $1,000,000 × (TVL / $1M) ^ ' + MODEL.tvl_exponent +
      ' × (1 + clamped 7-day growth × ' + MODEL.growth_weight + ') × (0.70 + age up to 3 years × 0.30)' +
      ' × (1 + 3% per extra chain, up to 5). Age unknown counts as 365 days; growth with no report counts as 0%. ' +
      'The watchlist floor is $' + Number(DATA.floor_usd).toLocaleString('en-US') + ' of TVL. The board ranks ' +
      DATA.board_size + ' protocols: all ' + DATA.watchlist_size + ' on the watchlist and ' + DATA.early_size +
      ' early finds below the floor.';
    $('sourceLine').textContent = 'Source: ' + DATA.source + '. Snapshot as of ' + DATA.as_of + '.';
  }

  function renderAll() {
    renderStats();
    renderFilters();
    renderBoard();
    renderDetail();
    renderLive();
    renderModel();
  }

  // ---------------------------------------------------------------- state and hash

  function readHash() {
    var h = location.hash.replace(/^#/, '');
    var parts = h ? h.split('&') : [];
    var next = { q: '', category: '', chain: '', watchlist: false, sort: 'rank', detail: null };
    parts.forEach(function (part) {
      var kv = part.split('=');
      var k = kv[0];
      var v = decodeURIComponent(kv[1] || '');
      if (k === 'q') next.q = v;
      if (k === 'category') next.category = v;
      if (k === 'chain') next.chain = v;
      if (k === 'watchlist') next.watchlist = v === '1';
      if (k === 'sort') next.sort = v;
      if (k === 'detail') next.detail = v;
    });
    state = next;
  }

  function writeHash() {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.category) parts.push('category=' + encodeURIComponent(state.category));
    if (state.chain) parts.push('chain=' + encodeURIComponent(state.chain));
    if (state.watchlist) parts.push('watchlist=1');
    if (state.sort !== 'rank') parts.push('sort=' + encodeURIComponent(state.sort));
    if (state.detail) parts.push('detail=' + encodeURIComponent(state.detail));
    var h = parts.length > 0 ? '#' + parts.join('&') : '';
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
  }

  function syncInputs() {
    $('q').value = state.q;
    $('watchlistOnly').checked = state.watchlist;
    $('sort').value = state.sort;
    $('category').value = state.category;
    $('chain').value = state.chain;
  }

  function apply() {
    writeHash();
    syncInputs();
    renderBoard();
    renderDetail();
  }

  // ---------------------------------------------------------------- events

  $('q').addEventListener('input', function (e) { state.q = e.target.value; state.detail = null; apply(); });
  $('category').addEventListener('change', function (e) { state.category = e.target.value; state.detail = null; apply(); });
  $('chain').addEventListener('change', function (e) { state.chain = e.target.value; state.detail = null; apply(); });
  $('watchlistOnly').addEventListener('change', function (e) { state.watchlist = e.target.checked; state.detail = null; apply(); });
  $('sort').addEventListener('change', function (e) { state.sort = e.target.value; apply(); });
  $('closeDetail').addEventListener('click', function () { state.detail = null; apply(); });

  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (!tr) return;
    state.detail = tr.getAttribute('data-slug');
    apply();
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Keyboard: Enter or Space on a focused row opens its detail, like a click.
  $('rows').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var tr = e.target.closest('tr[data-slug]');
    if (!tr) return;
    e.preventDefault();
    state.detail = tr.getAttribute('data-slug');
    apply();
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.querySelectorAll('#board thead th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-sort');
      state.sort = key === 'implied' ? 'implied' : key;
      apply();
    });
  });

  window.addEventListener('hashchange', function () { readHash(); syncInputs(); renderBoard(); renderDetail(); });

  readHash();
  renderAll();
  syncInputs();
})();
