(function(){
  var STORAGE_THEME = 'toolvanta_theme';
  var STORAGE_FAVORITES = 'toolvanta_favorites';
  var STORAGE_TOOLKIT = 'toolvanta_toolkit';

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

  function closeMobileMenu(toggle, nav){
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function initMobileMenu(){
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if(!toggle || !nav) return;
    if(toggle.dataset.mobileMenuInitialized !== 'true'){
      toggle.dataset.mobileMenuInitialized = 'true';
      toggle.addEventListener('click', function(event){
        event.stopPropagation();
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    if(document.documentElement.dataset.mobileMenuCloseInitialized !== 'true'){
      document.documentElement.dataset.mobileMenuCloseInitialized = 'true';
      document.addEventListener('keydown', function(event){
        if(event.key !== 'Escape') return;
        var currentToggle = document.querySelector('.nav-toggle');
        var currentNav = document.querySelector('.main-nav');
        if(currentToggle && currentNav && currentNav.classList.contains('open')) closeMobileMenu(currentToggle, currentNav);
      });
      document.addEventListener('click', function(event){
        var currentToggle = document.querySelector('.nav-toggle');
        var currentNav = document.querySelector('.main-nav');
        if(!currentToggle || !currentNav || !currentNav.classList.contains('open')) return;
        if(currentNav.contains(event.target) || currentToggle.contains(event.target)) return;
        closeMobileMenu(currentToggle, currentNav);
      });
    }
  }
  function initNav(){
    initMobileMenu();
    var nav = document.querySelector('.main-nav');
    if(nav && !nav.querySelector('a[href*="use-cases"]')){
      var use = document.createElement('a');
      use.href = pathToRoot() + 'use-cases/index.html';
      use.textContent = 'Use Cases';
      var about = nav.querySelector('a[href*="about"]');
      nav.insertBefore(use, about || null);
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
  function toolkit(){
    return safeJson(STORAGE_TOOLKIT, []);
  }
  function isInToolkit(id){
    return toolkit().indexOf(id) !== -1;
  }
  function setToolkit(id, value){
    if(!id) return;
    var list = toolkit().filter(function(x){ return x !== id; });
    if(value) list.unshift(id);
    saveJson(STORAGE_TOOLKIT, list.slice(0, 40));
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
      var kit = document.createElement('button');
      kit.type = 'button';
      kit.className = 'favorite-btn toolkit-btn';
      kit.setAttribute('aria-label', 'Add tool to toolkit');
      function paintKit(){
        var saved = isInToolkit(id);
        kit.textContent = saved ? 'In Toolkit' : 'Toolkit';
        kit.classList.toggle('saved', saved);
        kit.setAttribute('aria-pressed', saved ? 'true' : 'false');
      }
      kit.addEventListener('click', function(event){
        event.preventDefault();
        event.stopPropagation();
        setToolkit(id, !isInToolkit(id));
        paintKit();
        renderToolkitPanel();
        renderHomeDashboard();
      });
      top.appendChild(kit);
      paintKit();
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
  function renderToolkitPanel(){
    var box = document.getElementById('toolkit-tools');
    if(!box) return;
    var list = toolkit().map(toolById).filter(Boolean).slice(0, 10);
    box.innerHTML = list.length ? list.map(miniLink).join('') : '<p class="muted">Add tools with the Toolkit button to build your personal workflow.</p>';
  }
  function favoriteCategory(){
    var counts = {};
    safeJson('toolvanta_recent', []).map(toolById).filter(Boolean).forEach(function(t){ counts[t.category] = (counts[t.category] || 0) + 1; });
    var best = Object.keys(counts).sort(function(a,b){ return counts[b] - counts[a]; })[0];
    return best ? categoryName(best) : 'None yet';
  }
  function renderHomeDashboard(){
    var box = document.getElementById('toolvanta-dashboard');
    if(!box) return;
    var recent = safeJson('toolvanta_recent', []);
    box.innerHTML = '<div><strong>'+recent.length+'</strong><span>Recently used</span></div><div><strong>'+favorites().length+'</strong><span>Favorites</span></div><div><strong>'+toolkit().length+'</strong><span>Toolkit tools</span></div><div><strong>'+favoriteCategory()+'</strong><span>Top category</span></div>';
  }
  function insertHomeAppPanels(){
    if(!document.getElementById('recent-tools') || document.getElementById('toolvanta-dashboard')) return;
    var anchor = document.querySelector('.trust-strip') || document.querySelector('.workflow-band');
    if(anchor && anchor.parentNode){
      var dash = document.createElement('section');
      dash.className = 'container app-dashboard';
      dash.innerHTML = '<div class="section-head"><div><p class="eyebrow">Your local workspace</p><h2>Continue where you left off</h2></div><button class="secondary-btn command-open" type="button">Open Command Palette</button></div><div class="dashboard-grid" id="toolvanta-dashboard"></div>';
      anchor.parentNode.insertBefore(dash, anchor.nextSibling);
    }
    var recent = document.querySelector('.recent-section');
    if(recent && recent.parentNode && !document.getElementById('toolkit-tools')){
      var kit = document.createElement('section');
      kit.className = 'container section toolkit-section';
      kit.innerHTML = '<div class="section-head"><div><h2>My Toolkit</h2><p class="muted">A browser-only toolkit saved locally on this device.</p></div><a class="text-link" href="tools/index.html">Add more tools</a></div><div class="mini-link-grid" id="toolkit-tools"></div>';
      recent.parentNode.insertBefore(kit, recent);
    }
    renderHomeDashboard();
    renderToolkitPanel();
  }
  function initRecent(){
    var box = document.getElementById('recent-tools');
    if(box && window.TOOLVANTA_TOOLS){
      var ids = safeJson('toolvanta_recent', []);
      var recentTools = ids.map(toolById).filter(Boolean).slice(0, 8);
      if(recentTools.length) box.innerHTML = recentTools.map(miniLink).join('');
    }
    insertHomeFavoritePanel();
    insertHomeAppPanels();
    renderFavoritesPanel();
    renderToolkitPanel();
    renderHomeDashboard();
  }

  function commandItems(){
    var domCards = Array.prototype.slice.call(document.querySelectorAll('.tool-card h2 a')).map(function(link){
      var card = link.closest('.tool-card');
      return {
        name: link.textContent.trim(),
        category: card ? categoryName(card.dataset.category || '') : 'Tool',
        path: link.getAttribute('href'),
        keywords: card ? (card.dataset.keywords || card.textContent || '') : ''
      };
    });
    var staticItems = [
      { name:'All Tools', category:'Navigation', path:pathToRoot() + 'tools/index.html', keywords:'browse tools search' },
      { name:'Resources', category:'Navigation', path:pathToRoot() + 'resources/index.html', keywords:'guides workflows' },
      { name:'Use Cases', category:'Navigation', path:pathToRoot() + 'use-cases/index.html', keywords:'toolkits personas' },
      { name:'Changelog', category:'Navigation', path:pathToRoot() + 'changelog.html', keywords:'updates product history' },
      { name:'SEO Toolkit', category:'Use Case', path:pathToRoot() + 'resources/best-free-seo-tools/', keywords:'seo workflow' },
      { name:'Developer Toolkit', category:'Use Case', path:pathToRoot() + 'use-cases/developers/', keywords:'json encoding developer' }
    ];
    function keywordText(value){
      if(Array.isArray(value)) return value.join(' ');
      return String(value || '');
    }
    var dataItems = tools().map(function(t){ return { name:t.name, category:categoryName(t.category), path:pathToRoot() + t.path, keywords:keywordText(t.keywords) }; });
    return (dataItems.length ? dataItems : domCards).concat(staticItems);
  }
  function pathToRoot(){
    var path = location.pathname;
    var parts = path.split('/').filter(Boolean);
    if(!parts.length || /index\.html$/.test(path) && parts.length === 1) return '';
    var depth = /\/$/.test(path) ? parts.length : Math.max(0, parts.length - 1);
    return new Array(depth + 1).join('../');
  }
  function initCommandPalette(){
    if(document.getElementById('command-palette')) return;
    var shell = document.createElement('div');
    shell.id = 'command-palette';
    shell.className = 'command-palette hidden';
    shell.innerHTML = '<div class="command-dialog" role="dialog" aria-modal="true" aria-label="Command palette"><div class="command-head"><strong>Search ToolVanta</strong><span>Ctrl K</span></div><input id="command-search" type="search" aria-label="Search tools" placeholder="Search tools, resources, use cases..." autocomplete="off"><div class="command-results" id="command-results"><a class="command-item" href="'+pathToRoot()+'tools/index.html"><span>All Tools</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'resources/index.html"><span>Resources</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'use-cases/index.html"><span>Use Cases</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'tools/word-counter/"><span>Word Counter</span><small>Text</small></a><a class="command-item" href="'+pathToRoot()+'tools/json-formatter/"><span>JSON Formatter</span><small>Developer</small></a></div></div>';
    document.body.appendChild(shell);
    var input = document.getElementById('command-search');
    var results = document.getElementById('command-results');
    function close(){ shell.classList.add('hidden'); }
    function open(){
      shell.classList.remove('hidden');
      input.value = '';
      render('');
      setTimeout(function(){ input.focus(); }, 20);
    }
    function render(q){
      q = (q || '').toLowerCase().trim();
      var list = commandItems().filter(function(item){
        var hay = (item.name + ' ' + item.category + ' ' + (item.keywords || '')).toLowerCase();
        return !q || hay.indexOf(q) !== -1;
      }).slice(0, 9);
      if(!list.length){
        list = [
          { name:'All Tools', category:'Navigation', path:pathToRoot() + 'tools/index.html' },
          { name:'Resources', category:'Navigation', path:pathToRoot() + 'resources/index.html' },
          { name:'Use Cases', category:'Navigation', path:pathToRoot() + 'use-cases/index.html' },
          { name:'Word Counter', category:'Text', path:pathToRoot() + 'tools/word-counter/' },
          { name:'JSON Formatter', category:'Developer', path:pathToRoot() + 'tools/json-formatter/' }
        ];
      }
      results.innerHTML = list.length ? list.map(function(item){
        return '<a class="command-item" href="'+item.path+'"><span>'+item.name+'</span><small>'+item.category+'</small></a>';
      }).join('') : '<p class="muted">No match. Try a category, tool name, or workflow.</p>';
    }
    input.addEventListener('input', function(){ render(input.value); });
    shell.addEventListener('click', function(event){ if(event.target === shell) close(); });
    document.addEventListener('keydown', function(event){
      if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'){ event.preventDefault(); open(); }
      else if(event.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)){ event.preventDefault(); open(); }
      else if(event.key === 'Escape' && !shell.classList.contains('hidden')) close();
    });
    document.querySelectorAll('.command-open').forEach(function(btn){ btn.addEventListener('click', open); });
    window.ToolVantaCommand = { open: open };
    render('');
    setTimeout(function(){
      if(results && !results.querySelector('.command-item')){
        results.innerHTML = '<a class="command-item" href="'+pathToRoot()+'tools/index.html"><span>All Tools</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'resources/index.html"><span>Resources</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'use-cases/index.html"><span>Use Cases</span><small>Navigation</small></a><a class="command-item" href="'+pathToRoot()+'tools/word-counter/"><span>Word Counter</span><small>Text</small></a><a class="command-item" href="'+pathToRoot()+'tools/json-formatter/"><span>JSON Formatter</span><small>Developer</small></a>';
      }
    }, 120);
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
    initCommandPalette();
    registerServiceWorker();
  });
})();
