(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function initNav(){ var toggle=document.querySelector('.nav-toggle'); var nav=document.querySelector('.main-nav'); if(!toggle||!nav) return; toggle.addEventListener('click', function(){ var open=nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open?'true':'false'); }); }
  function initYear(){ var y=document.getElementById('year'); if(y) y.textContent=String(new Date().getFullYear()); }
  function initFinder(){
    var search=document.getElementById('tool-search'); var grid=document.getElementById('tools-grid'); var count=document.getElementById('tool-count'); if(!search||!grid) return;
    var cards=Array.prototype.slice.call(grid.querySelectorAll('.tool-card')); var active='all';
    function apply(){ var q=search.value.trim().toLowerCase(); var visible=0; cards.forEach(function(card){ var hay=(card.dataset.name+' '+card.dataset.keywords).toLowerCase(); var show=(active==='all'||card.dataset.category===active) && (!q||hay.indexOf(q)!==-1); card.classList.toggle('hidden', !show); if(show) visible++; }); if(count) count.textContent=visible+' tool'+(visible===1?'':'s')+' shown'; }
    document.querySelectorAll('[data-filter]').forEach(function(btn){ btn.addEventListener('click', function(){ document.querySelectorAll('[data-filter]').forEach(function(b){ b.classList.remove('active'); }); btn.classList.add('active'); active=btn.dataset.filter||'all'; apply(); }); });
    search.addEventListener('input', apply); apply();
  }
  function initRecent(){
    var box=document.getElementById('recent-tools'); if(!box || !window.TOOLVANTA_TOOLS) return;
    var ids=[]; try{ ids=JSON.parse(localStorage.getItem('toolvanta_recent')||'[]'); }catch(e){ ids=[]; }
    var byId={}; window.TOOLVANTA_TOOLS.forEach(function(t){ byId[t.id]=t; });
    var tools=ids.map(function(id){ return byId[id]; }).filter(Boolean).slice(0,8);
    if(!tools.length) return;
    box.innerHTML=tools.map(function(t){ var cat=(window.TOOLVANTA_CATEGORIES||[]).find(function(c){return c.id===t.category;}); return '<a class="mini-tool-link" href="'+t.path+'"><span>'+t.name+'</span><small>'+(cat?cat.name.replace(' Tools',''):'Tool')+'</small></a>'; }).join('');
  }
  ready(function(){ initNav(); initYear(); initFinder(); initRecent(); });
})();
