(function(){
  var STORAGE_THEME = 'toolvanta_theme';
  var STORAGE_FAVORITES = 'toolvanta_favorites';

  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function safeJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }
  function saveJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
  }
  function getTheme(){
    var saved = localStorage.getItem(STORAGE_THEME);
    if(saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#0f766e');
  }
  applyTheme(getTheme());

  function initNav(){
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if(toggle && nav){
      toggle.addEventListener('click', function(){
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var header = document.querySelector('.header-inner');
    if(!header || document.querySelector('.theme-toggle')) return;
    var themeButton = document.createElement('button');
    themeButton.type = 'button';
    themeButton.className = 'theme-toggle';
    themeButton.setAttribute('aria-label', 'Toggle dark mode');
    function paint(){
      var theme = getTheme();
      themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
      themeButton.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    themeButton.addEventListener('click', function(){
      var next = getTheme() === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_THEME, next);
      applyTheme(next);
      paint();
    });
    header.appendChild(themeButton);
    paint();
  }

  function initYear(){
    var y = document.getElementById('year');
    if(y) y.textContent = String(new Date().getFullYear());
  }

  function categories(){
    return window.TOOLVANTA_CATEGORIES || [];
  }
  function tools(){
    return window.TOOLVANTA_TOOLS || [];
  }
  function categoryName(id){
    var cat = categories().find(function(c){ return c.id === id; });
    return cat ? cat.name.replace(' Tools','') : 'Tool';
  }
  function idFromHref(href){
    var match = String(href || '').match(/tools\/([^\/#?]+)/);
    return match ? match[1] : '';
  }
  function toolById(id){
    return tools().find(function(t){ return t.id === id; });
  }
  function favorites(){
    return safeJson(STORAGE_FAVORITES, []);
  }
  function isFavorite(id){
    return favorites().indexOf(id) !== -1;
  }
  function setFavorite(id, value){
    if(!id) return;
    var list = favorites().filter(function(x){ return x !== id; });
    if(value) list.unshift(id);
    saveJson(STORAGE_FAVORITES, list.slice(0, 80));
  }
  function miniLink(t){
    return '<a class="mini-tool-link" href="'+t.path+'"><span>'+t.name+'</span><small>'+categoryName(t.category)+'</small></a>';
  }

  function enhanceCards(){
    document.querySelectorAll('.tool-card').forEach(function(card){
      if(card.dataset.enhanced === 'true') return;
      var link = card.querySelector('h2 a, a');
      var id = idFromHref(link ? link.getAttribute('href') : '');
      if(!id) return;
      card.dataset.toolId = id;
      card.dataset.enhanced = 'true';
      var top = card.querySelector('.card-top') || card;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'favorite-btn';
      btn.setAttribute('aria-label', 'Save tool to favorites');
      function paint(){
        var saved = isFavorite(id);
        btn.textContent = saved ? 'Saved' : 'Save';
        btn.classList.toggle('saved', saved);
        btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      }
      btn.addEventListener('click', function(event){
        event.preventDefault();
        event.stopPropagation();
        setFavorite(id, !isFavorite(id));
        paint();
        renderFavoritesPanel();
      });
      top.appendChild(btn);
      paint();
    });
  }

  function insertFinderControls(finder){
    if(!finder || finder.querySelector('.finder-options')) return;
    var options = document.createElement('div');
    options.className = 'finder-options';
    options.innerHTML = '<label>Sort <select id="tool-sort"><option value="popular">Popular first</option><option value="az">A-Z</option><option value="category">Category</option><option value="favorites">Favorites first</option><option value="recent">Recently used first</option></select></label><label class="toggle-line"><input type="checkbox" id="favorites-only"> Favorites only</label>';
    var count = finder.querySelector('#tool-count');
    finder.insertBefore(options, count || null);
  }

  function initFinder(){
    var search = document.getElementById('tool-search');
    var grid = document.getElementById('tools-grid');
    var count = document.getElementById('tool-count');
    if(!search || !grid) return;

    enhanceCards();
    var finder = search.closest('.tool-finder');
    insertFinderControls(finder);
    var sort = document.getElementById('tool-sort');
    var favOnly = document.getElementById('favorites-only');
    var empty = document.createElement('div');
    empty.className = 'empty-state hidden';
    empty.innerHTML = '<strong>No tools found</strong><span>Try another keyword, clear filters, or browse all categories.</span>';
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.tool-card'));
    var original = cards.slice();
    var active = 'all';
    var popularOrder = ['word-counter','json-formatter','password-generator','ai-prompt-generator','serp-snippet-preview','utm-url-builder','qr-code-generator','image-resizer','bmi-calculator','hashtag-generator'];

    function scoreRecent(id){
      var recent = safeJson('toolvanta_recent', []);
      var index = recent.indexOf(id);
      return index === -1 ? 999 : index;
    }
    function sortCards(list){
      var mode = sort ? sort.value : 'popular';
      var favs = favorites();
      return list.slice().sort(function(a,b){
        var aid = a.dataset.toolId || '';
        var bid = b.dataset.toolId || '';
        var at = toolById(aid) || {};
        var bt = toolById(bid) || {};
        if(mode === 'az') return (at.name || a.dataset.name || '').localeCompare(bt.name || b.dataset.name || '');
        if(mode === 'category') return ((at.category || '') + (at.name || '')).localeCompare((bt.category || '') + (bt.name || ''));
        if(mode === 'favorites') return (favs.indexOf(bid) !== -1) - (favs.indexOf(aid) !== -1) || original.indexOf(a) - original.indexOf(b);
        if(mode === 'recent') return scoreRecent(aid) - scoreRecent(bid) || original.indexOf(a) - original.indexOf(b);
        return (popularOrder.indexOf(aid) === -1 ? 999 : popularOrder.indexOf(aid)) - (popularOrder.indexOf(bid) === -1 ? 999 : popularOrder.indexOf(bid)) || original.indexOf(a) - original.indexOf(b);
      });
    }
    function apply(){
      var q = search.value.trim().toLowerCase();
      var favs = favorites();
      var visible = 0;
      var ordered = sortCards(cards);
      ordered.forEach(function(card){ grid.appendChild(card); });
      ordered.forEach(function(card){
        var id = card.dataset.toolId || '';
        var hay = ((card.dataset.name || '') + ' ' + (card.dataset.keywords || '') + ' ' + card.textContent).toLowerCase();
        var show = (active === 'all' || card.dataset.category === active) && (!q || hay.indexOf(q) !== -1) && (!favOnly || !favOnly.checked || favs.indexOf(id) !== -1);
        card.classList.toggle('hidden', !show);
        if(show) visible++;
      });
      empty.classList.toggle('hidden', visible !== 0);
      if(count) count.textContent = visible + ' tool' + (visible === 1 ? '' : 's') + ' shown';
    }
    document.querySelectorAll('[data-filter]').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('[data-filter]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        active = btn.dataset.filter || 'all';
        apply();
      });
    });
    search.addEventListener('input', apply);
    if(sort) sort.addEventListener('change', apply);
    if(favOnly) favOnly.addEventListener('change', apply);
    apply();
  }

  function renderFavoritesPanel(){
    var box = document.getElementById('favorite-tools');
    if(!box) return;
    var list = favorites().map(toolById).filter(Boolean).slice(0, 8);
    box.innerHTML = list.length ? list.map(miniLink).join('') : '<p class="muted">Save tools with the Save button to keep them here.</p>';
    enhanceCards();
  }
  function insertHomeFavoritePanel(){
    if(document.getElementById('favorite-tools') || !document.getElementById('recent-tools')) return;
    var recent = document.querySelector('.recent-section');
    if(!recent || !recent.parentNode) return;
    var section = document.createElement('section');
    section.className = 'container section favorite-section';
    section.innerHTML = '<div class="section-head"><h2>Favorite Tools</h2><p class="muted">Saved locally in your browser.</p></div><div class="mini-link-grid" id="favorite-tools"></div>';
    recent.parentNode.insertBefore(section, recent);
  }
  function initRecent(){
    var box = document.getElementById('recent-tools');
    if(box && window.TOOLVANTA_TOOLS){
      var ids = safeJson('toolvanta_recent', []);
      var recentTools = ids.map(toolById).filter(Boolean).slice(0, 8);
      if(recentTools.length) box.innerHTML = recentTools.map(miniLink).join('');
    }
    insertHomeFavoritePanel();
    renderFavoritesPanel();
  }

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    var manifest = document.querySelector('link[rel="manifest"]');
    var base = manifest ? manifest.href : new URL('manifest.json', location.href).href;
    var sw = new URL('service-worker.js', base).href;
    navigator.serviceWorker.register(sw).catch(function(){});
  }

  ready(function(){
    initNav();
    initYear();
    initFinder();
    initRecent();
    registerServiceWorker();
  });
})();
