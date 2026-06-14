(function(){
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function initNav(){
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if(!toggle || !nav) return;
    toggle.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  function initYear(){
    var y = document.getElementById('year');
    if(y) y.textContent = String(new Date().getFullYear());
  }
  function h(tag, attrs){
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function(key){
      if(key === 'class') node.className = attrs[key];
      else if(key === 'text') node.textContent = attrs[key];
      else if(key === 'html') node.innerHTML = attrs[key];
      else if(key === 'for') node.htmlFor = attrs[key];
      else if(key.indexOf('on') === 0 && typeof attrs[key] === 'function') node.addEventListener(key.slice(2), attrs[key]);
      else node.setAttribute(key, attrs[key]);
    });
    for(var i=2;i<arguments.length;i++){
      var child = arguments[i];
      if(child === null || child === undefined) continue;
      if(Array.isArray(child)) child.forEach(function(c){ if(c) node.appendChild(c); });
      else if(typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }
  function clear(root){ root.innerHTML = ''; }
  function field(labelText, control, help){
    var id = control.id || ('field-' + Math.random().toString(36).slice(2));
    control.id = id;
    var wrap = h('div', { class:'field' }, h('label', { for:id, text:labelText }), control);
    if(help) wrap.appendChild(h('small', { text:help }));
    return wrap;
  }
  function input(type, value, attrs){
    attrs = attrs || {};
    attrs.type = type;
    if(value !== undefined) attrs.value = value;
    return h('input', attrs);
  }
  function textarea(value, attrs){
    attrs = attrs || {};
    var t = h('textarea', attrs);
    if(value) t.value = value;
    return t;
  }
  function select(options, value){
    var s = h('select');
    options.forEach(function(opt){
      var val = Array.isArray(opt) ? opt[0] : opt;
      var label = Array.isArray(opt) ? opt[1] : opt;
      s.appendChild(h('option', { value:val, text:label }));
    });
    if(value !== undefined) s.value = value;
    return s;
  }
  function checkbox(labelText, checked){
    var box = input('checkbox');
    box.checked = !!checked;
    return { input: box, wrap: h('label', { class:'check-field' }, box, h('span', { text: labelText })) };
  }
  function resultBox(label){
    var box = h('div', { class:'output-box', role:'status', 'aria-live':'polite' });
    return { wrap: h('div', { class:'field' }, h('label', { text:label }), box), box: box };
  }
  function actions(){ return h('div', { class:'action-row' }); }
  function primary(text, fn){ return h('button', { type:'button', class:'primary-btn', onclick:fn, text:text }); }
  function secondary(text, fn){ return h('button', { type:'button', class:'secondary-btn', onclick:fn, text:text }); }
  function note(){ return h('span', { class:'copy-note', 'aria-live':'polite' }); }
  function setText(box, text, error){
    box.classList.toggle('error', !!error);
    box.textContent = text;
  }
  function copyToClipboard(text, target){
    if(!text) return;
    function done(){ if(target){ target.textContent = 'Copied'; window.setTimeout(function(){ target.textContent = ''; }, 1800); } }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done).catch(fallback); }
    else fallback();
    function fallback(){
      var t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly','');
      t.style.position = 'fixed';
      t.style.left = '-999px';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); done(); } catch(e) {}
      document.body.removeChild(t);
    }
  }
  function numberValue(el, fallback){
    var n = parseFloat(el.value);
    return Number.isFinite(n) ? n : fallback;
  }
  function formatNumber(n, max){
    if(!Number.isFinite(n)) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: max === undefined ? 4 : max }).format(n);
  }
  function fixed(n, places){ return Number.isFinite(n) ? n.toFixed(places === undefined ? 2 : places) : '0.00'; }
  function words(text){ return text.trim() ? text.trim().split(/\s+/).filter(Boolean) : []; }
  function statGrid(items){
    return h('div', { class:'stats-grid' }, items.map(function(item){ return h('div', { class:'stat-card' }, h('strong', { text:item.value }), h('span', { text:item.label })); }));
  }
  function textTool(root, label, placeholder, transform){
    clear(root);
    var src = textarea('', { placeholder: placeholder });
    var out = resultBox('Result');
    var n = note();
    function run(){ setText(out.box, transform(src.value)); }
    src.addEventListener('input', run);
    var row = actions();
    row.appendChild(secondary('Copy result', function(){ copyToClipboard(out.box.textContent, n); }));
    row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, field(label, src), out.wrap, row));
    run();
  }
  function wordCounter(root){
    clear(root);
    var src = textarea('', { placeholder:'Paste or type text to count words, characters, sentences, and paragraphs.' });
    var holder = h('div');
    function run(){
      var text = src.value;
      var w = words(text).length;
      var chars = text.length;
      var noSpaces = text.replace(/\s/g,'').length;
      var sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length : 0;
      var paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
      var read = w ? Math.max(1, Math.ceil(w / 200)) : 0;
      holder.innerHTML = '';
      holder.appendChild(statGrid([
        { label:'Words', value:formatNumber(w,0) }, { label:'Characters', value:formatNumber(chars,0) },
        { label:'No spaces', value:formatNumber(noSpaces,0) }, { label:'Sentences', value:formatNumber(sentences,0) },
        { label:'Paragraphs', value:formatNumber(paragraphs,0) }, { label:'Reading time', value:read + ' min' }
      ]));
    }
    src.addEventListener('input', run);
    root.appendChild(h('div', { class:'tool-form' }, field('Text', src), holder));
    run();
  }
  function characterCounter(root){
    clear(root);
    var src = textarea('', { placeholder:'Enter text to count characters.' });
    var holder = h('div');
    function run(){
      var t = src.value;
      holder.innerHTML = '';
      holder.appendChild(statGrid([
        { label:'Characters', value:formatNumber(t.length,0) },
        { label:'Without spaces', value:formatNumber(t.replace(/\s/g,'').length,0) },
        { label:'Spaces', value:formatNumber((t.match(/\s/g) || []).length,0) },
        { label:'Words', value:formatNumber(words(t).length,0) }
      ]));
    }
    src.addEventListener('input', run);
    root.appendChild(h('div', { class:'tool-form' }, field('Text', src), holder));
    run();
  }
  function titleCaseText(text){
    var small = ['a','an','and','as','at','but','by','for','in','nor','of','on','or','per','the','to','vs','via'];
    return text.toLowerCase().replace(/\b[\w'-]+\b/g, function(word, index){
      if(index !== 0 && small.indexOf(word) !== -1) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
  }
  function sentenceCaseText(text){
    var lower = text.toLowerCase();
    return lower.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, function(m){ return m.toUpperCase(); });
  }
  function removeExtraSpacesText(text){
    return text.split('\n').map(function(line){ return line.trim().replace(/[ \t]+/g, ' '); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function removeDuplicateLines(root){
    clear(root);
    var src = textarea('', { placeholder:'Paste lines here. Duplicate lines will be removed while preserving the first occurrence.' });
    var out = resultBox('Unique lines');
    var stats = h('div');
    var n = note();
    function run(){
      var seen = new Set();
      var lines = src.value.split(/\r?\n/);
      var unique = [];
      lines.forEach(function(line){
        if(!seen.has(line)){ seen.add(line); unique.push(line); }
      });
      setText(out.box, unique.join('\n'));
      stats.innerHTML = '';
      stats.appendChild(statGrid([{ label:'Original lines', value:formatNumber(lines.length,0) }, { label:'Unique lines', value:formatNumber(unique.length,0) }, { label:'Removed', value:formatNumber(lines.length - unique.length,0) }]));
    }
    src.addEventListener('input', run);
    var row = actions(); row.appendChild(secondary('Copy result', function(){ copyToClipboard(out.box.textContent, n); })); row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, field('Lines', src), stats, out.wrap, row));
    run();
  }
  function textReverser(root){
    clear(root);
    var src = textarea('', { placeholder:'Enter text to reverse.' });
    var mode = select([['chars','Characters'], ['words','Words'], ['lines','Lines']], 'chars');
    var out = resultBox('Result');
    var n = note();
    function run(){
      var t = src.value;
      var res = mode.value === 'words' ? words(t).reverse().join(' ') : mode.value === 'lines' ? t.split(/\r?\n/).reverse().join('\n') : Array.from(t).reverse().join('');
      setText(out.box, res);
    }
    [src, mode].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    var row = actions(); row.appendChild(secondary('Copy result', function(){ copyToClipboard(out.box.textContent, n); })); row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, field('Text', src), field('Reverse mode', mode), out.wrap, row));
    run();
  }
  function lineCounter(root){
    clear(root);
    var src = textarea('', { placeholder:'Paste text to count lines.' });
    var holder = h('div');
    function run(){
      var lines = src.value.length ? src.value.split(/\r?\n/) : [];
      var non = lines.filter(function(l){ return l.trim().length > 0; }).length;
      holder.innerHTML = '';
      holder.appendChild(statGrid([{ label:'Total lines', value:formatNumber(lines.length,0) }, { label:'Non-empty', value:formatNumber(non,0) }, { label:'Empty', value:formatNumber(lines.length - non,0) }]));
    }
    src.addEventListener('input', run);
    root.appendChild(h('div', { class:'tool-form' }, field('Text', src), holder));
    run();
  }
  function wordSorter(root){
    clear(root);
    var src = textarea('', { placeholder:'Paste words separated by spaces, commas, or new lines.' });
    var order = select([['asc','A to Z'], ['desc','Z to A']], 'asc');
    var unique = checkbox('Remove duplicate words', false);
    var out = resultBox('Sorted words');
    var n = note();
    function run(){
      var arr = src.value.split(/[\s,]+/).map(function(w){ return w.trim(); }).filter(Boolean);
      if(unique.input.checked){
        var seen = new Set();
        arr = arr.filter(function(w){ var key = w.toLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; });
      }
      arr.sort(function(a,b){ return a.localeCompare(b); });
      if(order.value === 'desc') arr.reverse();
      setText(out.box, arr.join('\n'));
    }
    [src, order, unique.input].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    var row = actions(); row.appendChild(secondary('Copy result', function(){ copyToClipboard(out.box.textContent, n); })); row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, field('Words', src), h('div', { class:'inline-grid' }, field('Order', order), h('div', { class:'field' }, h('label', { text:'Options' }), unique.wrap)), out.wrap, row));
    run();
  }
  function textCleaner(root){
    textTool(root, 'Text', 'Paste messy copied text.', function(text){
      return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').split('\n').map(function(line){ return line.trim().replace(/[ \t]+/g,' '); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    });
  }
  function ageCalculator(root){
    clear(root);
    var birth = input('date');
    var asof = input('date');
    asof.valueAsDate = new Date();
    var out = resultBox('Result');
    function run(){
      if(!birth.value){ setText(out.box, 'Choose a birth date.'); return; }
      var b = new Date(birth.value + 'T00:00:00');
      var a = new Date((asof.value || new Date().toISOString().slice(0,10)) + 'T00:00:00');
      if(a < b){ setText(out.box, 'The target date must be after the birth date.', true); return; }
      var y = a.getFullYear() - b.getFullYear();
      var m = a.getMonth() - b.getMonth();
      var d = a.getDate() - b.getDate();
      if(d < 0){ m -= 1; d += new Date(a.getFullYear(), a.getMonth(), 0).getDate(); }
      if(m < 0){ y -= 1; m += 12; }
      var days = Math.floor((a - b) / 86400000);
      setText(out.box, y + ' years, ' + m + ' months, ' + d + ' days\nTotal days: ' + formatNumber(days,0));
    }
    [birth, asof].forEach(function(el){ el.addEventListener('change', run); el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'inline-grid' }, field('Birth date', birth), field('Calculate age on', asof)), out.wrap));
    run();
  }
  function bmiCalculator(root){
    clear(root);
    var weight = input('number', '70', { min:'1', step:'0.1' });
    var height = input('number', '175', { min:'1', step:'0.1' });
    var out = resultBox('Result');
    function run(){
      var w = numberValue(weight, 0), hcm = numberValue(height, 0);
      if(w <= 0 || hcm <= 0){ setText(out.box, 'Enter height and weight.', true); return; }
      var bmi = w / Math.pow(hcm / 100, 2);
      var cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obesity range';
      setText(out.box, 'BMI: ' + fixed(bmi,1) + '\nCategory: ' + cat);
    }
    [weight,height].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'inline-grid' }, field('Weight (kg)', weight), field('Height (cm)', height)), out.wrap));
    run();
  }
  function percentageCalculator(root){
    clear(root);
    var mode = select([['of','What is A% of B?'], ['ratio','A is what percent of B?'], ['change','Percent change from A to B']], 'of');
    var a = input('number', '20', { step:'any' });
    var b = input('number', '150', { step:'any' });
    var la = h('label', { for:'pct-a', text:'A' }); a.id = 'pct-a';
    var lb = h('label', { for:'pct-b', text:'B' }); b.id = 'pct-b';
    var out = resultBox('Result');
    function updateLabels(){
      la.textContent = mode.value === 'of' ? 'Percent (A)' : mode.value === 'ratio' ? 'Part (A)' : 'Original value (A)';
      lb.textContent = mode.value === 'of' ? 'Total (B)' : mode.value === 'ratio' ? 'Whole (B)' : 'New value (B)';
    }
    function run(){
      updateLabels();
      var av = numberValue(a,0), bv = numberValue(b,0), res;
      if(mode.value === 'of') res = av + '% of ' + bv + ' = ' + formatNumber((av / 100) * bv, 6);
      else if(mode.value === 'ratio') res = bv === 0 ? 'Whole cannot be zero.' : av + ' is ' + formatNumber((av / bv) * 100, 6) + '% of ' + bv;
      else res = av === 0 ? 'Original value cannot be zero.' : 'Change: ' + formatNumber(((bv - av) / Math.abs(av)) * 100, 6) + '%';
      setText(out.box, res, res.indexOf('cannot') !== -1);
    }
    [mode,a,b].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    root.appendChild(h('div', { class:'tool-form' }, field('Calculation type', mode), h('div', { class:'inline-grid' }, h('div', { class:'field' }, la, a), h('div', { class:'field' }, lb, b)), out.wrap));
    run();
  }
  function discountCalculator(root){
    clear(root);
    var price = input('number', '100', { min:'0', step:'0.01' });
    var disc = input('number', '20', { min:'0', step:'0.01' });
    var tax = input('number', '0', { min:'0', step:'0.01' });
    var out = resultBox('Result');
    function run(){
      var p = numberValue(price,0), d = numberValue(disc,0), t = numberValue(tax,0);
      var saved = p * d / 100;
      var sale = p - saved;
      var taxAmount = sale * t / 100;
      setText(out.box, 'Discount amount: ' + fixed(saved) + '\nPrice after discount: ' + fixed(sale) + '\nTax amount: ' + fixed(taxAmount) + '\nFinal price: ' + fixed(sale + taxAmount));
    }
    [price,disc,tax].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Original price', price), field('Discount (%)', disc), field('Tax/VAT after discount (%)', tax)), out.wrap));
    run();
  }
  function tipCalculator(root){
    clear(root);
    var bill = input('number', '80', { min:'0', step:'0.01' });
    var tip = input('number', '15', { min:'0', step:'0.1' });
    var people = input('number', '2', { min:'1', step:'1' });
    var out = resultBox('Result');
    function run(){
      var b = numberValue(bill,0), tp = numberValue(tip,0), p = Math.max(1, Math.round(numberValue(people,1)));
      var tipAmount = b * tp / 100;
      var total = b + tipAmount;
      setText(out.box, 'Tip amount: ' + fixed(tipAmount) + '\nTotal bill: ' + fixed(total) + '\nPer person: ' + fixed(total / p));
    }
    [bill,tip,people].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Bill amount', bill), field('Tip (%)', tip), field('People', people)), out.wrap));
    run();
  }
  function loanCalculator(root){
    clear(root);
    var principal = input('number', '250000', { min:'0', step:'100' });
    var rate = input('number', '6.5', { min:'0', step:'0.01' });
    var years = input('number', '30', { min:'0', step:'1' });
    var out = resultBox('Result');
    function run(){
      var p = numberValue(principal,0), r = numberValue(rate,0) / 100 / 12, n = numberValue(years,0) * 12;
      if(p <= 0 || n <= 0){ setText(out.box, 'Enter a loan amount and term.', true); return; }
      var payment = r === 0 ? p / n : p * r / (1 - Math.pow(1 + r, -n));
      var total = payment * n;
      setText(out.box, 'Monthly payment: ' + fixed(payment) + '\nTotal payment: ' + fixed(total) + '\nTotal interest: ' + fixed(total - p));
    }
    [principal,rate,years].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Loan amount', principal), field('Annual interest rate (%)', rate), field('Term (years)', years)), out.wrap));
    run();
  }
  function simpleInterestCalculator(root){
    clear(root);
    var p = input('number','1000',{min:'0',step:'0.01'}), r = input('number','5',{step:'0.01'}), y = input('number','3',{min:'0',step:'0.1'});
    var out = resultBox('Result');
    function run(){ var principal = numberValue(p,0), interest = principal * numberValue(r,0) / 100 * numberValue(y,0); setText(out.box, 'Interest: ' + fixed(interest) + '\nFinal balance: ' + fixed(principal + interest)); }
    [p,r,y].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Principal', p), field('Annual rate (%)', r), field('Time (years)', y)), out.wrap)); run();
  }
  function compoundInterestCalculator(root){
    clear(root);
    var p = input('number','1000',{min:'0',step:'0.01'}), r = input('number','6',{step:'0.01'}), y = input('number','10',{min:'0',step:'0.1'});
    var freq = select([['1','Annually'],['2','Semiannually'],['4','Quarterly'],['12','Monthly'],['365','Daily']], '12');
    var out = resultBox('Result');
    function run(){ var principal = numberValue(p,0), n = parseInt(freq.value,10), amount = principal * Math.pow(1 + numberValue(r,0) / 100 / n, n * numberValue(y,0)); setText(out.box, 'Final balance: ' + fixed(amount) + '\nInterest earned: ' + fixed(amount - principal)); }
    [p,r,y,freq].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Principal', p), field('Annual rate (%)', r), field('Time (years)', y)), field('Compounding', freq), out.wrap)); run();
  }
  function vatCalculator(root){
    clear(root);
    var amount = input('number','100',{min:'0',step:'0.01'}), rate = input('number','20',{min:'0',step:'0.01'}), mode = select([['add','Add VAT'], ['remove','Remove VAT']], 'add');
    var out = resultBox('Result');
    function run(){
      var a = numberValue(amount,0), r = numberValue(rate,0) / 100;
      if(mode.value === 'add') setText(out.box, 'Net amount: ' + fixed(a) + '\nVAT: ' + fixed(a * r) + '\nGross amount: ' + fixed(a * (1 + r)));
      else { var net = a / (1 + r); setText(out.box, 'Gross amount: ' + fixed(a) + '\nVAT included: ' + fixed(a - net) + '\nNet amount: ' + fixed(net)); }
    }
    [amount,rate,mode].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Amount', amount), field('VAT rate (%)', rate), field('Mode', mode)), out.wrap)); run();
  }
  function salaryHourlyRateCalculator(root){
    clear(root);
    var salary = input('number','60000',{min:'0',step:'100'}), hours = input('number','40',{min:'1',step:'0.5'}), weeks = input('number','52',{min:'1',step:'1'});
    var out = resultBox('Result');
    function run(){
      var annual = numberValue(salary,0), hweek = numberValue(hours,40), wyear = numberValue(weeks,52);
      var hourly = annual / (hweek * wyear);
      setText(out.box, 'Hourly rate: ' + fixed(hourly) + '\nWeekly pay: ' + fixed(annual / wyear) + '\nMonthly pay: ' + fixed(annual / 12) + '\nDaily estimate: ' + fixed(hourly * (hweek / 5)));
    }
    [salary,hours,weeks].forEach(function(el){ el.addEventListener('input', run); });
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'three-grid' }, field('Annual salary', salary), field('Hours per week', hours), field('Paid weeks per year', weeks)), out.wrap)); run();
  }
  function randomInt(max){
    max = Math.max(1, max);
    if(window.crypto && crypto.getRandomValues){ var arr = new Uint32Array(1); crypto.getRandomValues(arr); return arr[0] % max; }
    return Math.floor(Math.random() * max);
  }
  function pick(arr){ return arr[randomInt(arr.length)]; }
  function passwordGenerator(root){
    clear(root);
    var len = input('number','16',{min:'4',max:'128',step:'1'});
    var upper = checkbox('Uppercase', true), lower = checkbox('Lowercase', true), nums = checkbox('Numbers', true), sym = checkbox('Symbols', true);
    var out = resultBox('Generated password');
    var n = note();
    function run(){
      var sets = [];
      if(upper.input.checked) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
      if(lower.input.checked) sets.push('abcdefghijkmnopqrstuvwxyz');
      if(nums.input.checked) sets.push('23456789');
      if(sym.input.checked) sets.push('!@#$%^&*()-_=+[]{};:,.?');
      if(!sets.length){ setText(out.box, 'Select at least one character set.', true); return; }
      var all = sets.join('');
      var size = Math.max(4, Math.min(128, Math.round(numberValue(len,16))));
      var chars = sets.map(function(set){ return set[randomInt(set.length)]; });
      while(chars.length < size) chars.push(all[randomInt(all.length)]);
      for(var i=chars.length-1;i>0;i--){ var j=randomInt(i+1); var tmp=chars[i]; chars[i]=chars[j]; chars[j]=tmp; }
      setText(out.box, chars.join(''));
    }
    [len,upper.input,lower.input,nums.input,sym.input].forEach(function(el){ el.addEventListener('input', run); el.addEventListener('change', run); });
    var row = actions(); row.appendChild(primary('Generate password', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, field('Length', len), h('div', { class:'check-grid' }, upper.wrap, lower.wrap, nums.wrap, sym.wrap), out.wrap, row)); run();
  }
  function randomNumberGenerator(root){
    clear(root);
    var min = input('number','1',{step:'any'}), max = input('number','100',{step:'any'}), count = input('number','5',{min:'1',max:'100',step:'1'}), decimals = input('number','0',{min:'0',max:'10',step:'1'});
    var out = resultBox('Random numbers'); var n = note();
    function run(){
      var lo = numberValue(min,0), hi = numberValue(max,1), c = Math.max(1, Math.min(100, Math.round(numberValue(count,1)))), d = Math.max(0, Math.min(10, Math.round(numberValue(decimals,0))));
      if(hi < lo){ var tmp=lo; lo=hi; hi=tmp; }
      var arr=[];
      for(var i=0;i<c;i++){ var val = lo + Math.random() * (hi - lo); arr.push(d === 0 ? String(Math.round(val)) : val.toFixed(d)); }
      setText(out.box, arr.join('\n'));
    }
    [min,max,count,decimals].forEach(function(el){ el.addEventListener('input', run); });
    var row = actions(); row.appendChild(primary('Generate numbers', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div', { class:'tool-form' }, h('div', { class:'inline-grid' }, field('Minimum', min), field('Maximum', max)), h('div', { class:'inline-grid' }, field('How many', count), field('Decimal places', decimals)), out.wrap, row)); run();
  }
  function uuidv4(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var bytes = new Uint8Array(16);
    if(window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes); else for(var i=0;i<16;i++) bytes[i] = Math.floor(Math.random()*256);
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  function uuidGenerator(root){
    clear(root);
    var count = input('number','5',{min:'1',max:'100',step:'1'}); var out = resultBox('UUIDs'); var n = note();
    function run(){ var c=Math.max(1,Math.min(100,Math.round(numberValue(count,5)))); var arr=[]; for(var i=0;i<c;i++) arr.push(uuidv4()); setText(out.box, arr.join('\n')); }
    count.addEventListener('input', run);
    var row=actions(); row.appendChild(primary('Generate UUIDs', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('How many UUIDs', count), out.wrap, row)); run();
  }
  var adjectives = ['bright','nova','prime','urban','swift','clear','bold','pixel','fresh','smart','craft','lunar','solar','true','vivid','next','daily','green','gold','clean'];
  var nouns = ['studio','hub','works','pilot','spark','forge','lane','flow','nest','signal','stack','scope','craft','market','media','labs','base','logic','pulse','field'];
  function cleanWords(text){ return text.toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/[\s-]+/).filter(Boolean); }
  function usernameGenerator(root){
    clear(root);
    var key = input('text','creator',{placeholder:'keyword or niche'}), style = select([['clean','Clean'],['brand','Brandable'],['short','Short']], 'clean'), count = input('number','10',{min:'1',max:'50'});
    var out=resultBox('Username ideas'); var n=note();
    function run(){
      var base = cleanWords(key.value)[0] || pick(nouns); var c=Math.max(1,Math.min(50,Math.round(numberValue(count,10)))); var arr=[];
      for(var i=0;i<c;i++){
        var item = style.value === 'short' ? base + pick(['hq','io','ly','up','go']) : style.value === 'brand' ? pick(adjectives) + base.charAt(0).toUpperCase() + base.slice(1) : base + pick(['','_','-']) + pick(nouns) + (randomInt(3) ? randomInt(99) : '');
        arr.push(item.replace(/[^a-zA-Z0-9_-]/g,''));
      }
      setText(out.box, Array.from(new Set(arr)).join('\n'));
    }
    [key,style,count].forEach(function(el){ el.addEventListener('input',run); el.addEventListener('change',run); });
    var row=actions(); row.appendChild(primary('Generate usernames', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class:'three-grid'}, field('Keyword',key), field('Style',style), field('Count',count)), out.wrap, row)); run();
  }
  function nameGenerator(root, kind){
    clear(root);
    var niche = input('text', kind === 'business' ? 'analytics' : 'travel', { placeholder:'topic, niche, or keyword' });
    var style = select([['modern','Modern'],['friendly','Friendly'],['premium','Premium']], 'modern');
    var count = input('number','12',{min:'1',max:'50'}); var out=resultBox('Ideas'); var n=note();
    var suffixBusiness = ['Labs','Studio','Works','Hub','Collective','Market','Logic','Craft','Flow','Point'];
    var suffixYoutube = ['Channel','Daily','Show','Stories','Lab','TV','Guide','Quest','Journal','Club'];
    function run(){
      var base = cleanWords(niche.value).map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1); }).join('') || 'Vanta';
      var suffix = kind === 'business' ? suffixBusiness : suffixYoutube; var c=Math.max(1,Math.min(50,Math.round(numberValue(count,12)))); var arr=[];
      for(var i=0;i<c;i++){
        var first = style.value === 'premium' ? pick(['Apex','Noble','Prime','Elevate','Sterling']) : style.value === 'friendly' ? pick(['Happy','Bright','Open','Kind','Local']) : pick(['Nova','Swift','Clear','Vivid','Urban']);
        arr.push(first + ' ' + base + ' ' + pick(suffix));
      }
      setText(out.box, Array.from(new Set(arr)).join('\n'));
    }
    [niche,style,count].forEach(function(el){ el.addEventListener('input',run); el.addEventListener('change',run); });
    var label = kind === 'business' ? 'Generate names' : 'Generate channel names';
    var row=actions(); row.appendChild(primary(label, run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class:'three-grid'}, field('Keyword or niche',niche), field('Style',style), field('Count',count)), out.wrap, row)); run();
  }
  function blogTitleGenerator(root){
    clear(root);
    var topic = input('text','remote work',{placeholder:'topic'}), tone=select([['how','How-to'],['list','Listicle'],['guide','Guide'],['question','Question']], 'how'), count=input('number','10',{min:'1',max:'50'});
    var out=resultBox('Blog title ideas'); var n=note();
    function run(){
      var t = topic.value.trim() || 'your topic'; var c=Math.max(1,Math.min(50,Math.round(numberValue(count,10)))); var arr=[];
      var templates = {
        how:['How to Improve '+t+' Without Overcomplicating It','How to Build a Better '+t+' Workflow','How to Get Started With '+t],
        list:['7 Practical '+t+' Tips You Can Use Today','10 '+t+' Mistakes and How to Avoid Them','15 Smart Ideas for Better '+t],
        guide:['The Complete Beginner Guide to '+t,'A Practical Guide to '+t+' for Busy Teams','The Essential '+t+' Checklist'],
        question:['What Is '+t+' and Why Does It Matter?','Is '+t+' Worth It? A Clear Breakdown','Which '+t+' Strategy Works Best?']
      };
      while(arr.length < c) arr.push(pick(templates[tone.value]));
      setText(out.box, Array.from(new Set(arr)).slice(0,c).join('\n'));
    }
    [topic,tone,count].forEach(function(el){ el.addEventListener('input',run); el.addEventListener('change',run); });
    var row=actions(); row.appendChild(primary('Generate titles', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class:'three-grid'}, field('Topic',topic), field('Title type',tone), field('Count',count)), out.wrap, row)); run();
  }
  function hashtagGenerator(root){
    clear(root);
    var src = textarea('digital marketing\nsmall business', { placeholder:'Enter topics or keywords.' }); var count=input('number','20',{min:'1',max:'80'}); var out=resultBox('Hashtags'); var n=note();
    function tagify(w){ return '#' + w.replace(/[^a-zA-Z0-9]/g,'').replace(/^./, function(c){ return c.toUpperCase(); }); }
    function run(){
      var parts = src.value.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(Boolean); var bases=[];
      parts.forEach(function(p){ bases.push(p); cleanWords(p).forEach(function(w){ bases.push(w); }); });
      var extras=['tips','ideas','daily','guide','growth','strategy','tools','online','creative','success'];
      var arr=[]; bases.forEach(function(b){ arr.push(tagify(b)); extras.forEach(function(e){ if(randomInt(3)===0) arr.push(tagify(b + ' ' + e)); }); });
      setText(out.box, Array.from(new Set(arr)).slice(0, Math.max(1,Math.min(80,Math.round(numberValue(count,20))))).join(' '));
    }
    [src,count].forEach(function(el){ el.addEventListener('input',run); });
    var row=actions(); row.appendChild(primary('Generate hashtags', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('Topics or keywords',src), field('Maximum hashtags',count), out.wrap, row)); run();
  }
  function randomQuoteGenerator(root){
    clear(root);
    var quotes = ['Small steps compound into serious progress.','Clarity is a productivity tool.','Make it useful, then make it beautiful.','A good system turns effort into momentum.','Focus is easier when the next action is clear.','Simple tools can carry ambitious work.','Consistency makes ordinary days powerful.','Better questions create better work.','Progress prefers motion over perfection.','Your future workflow is built by today\'s habits.'];
    var out=resultBox('Quote'); var n=note();
    function run(){ setText(out.box, pick(quotes)); }
    var row=actions(); row.appendChild(primary('New quote', run)); row.appendChild(secondary('Copy', function(){ copyToClipboard(out.box.textContent,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, out.wrap, row)); run();
  }
  function hexToRgb(hex){
    hex = (hex || '').replace('#','').trim();
    if(hex.length === 3) hex = hex.split('').map(function(c){ return c+c; }).join('');
    var n = parseInt(hex,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  function rgbToHex(r,g,b){ return '#' + [r,g,b].map(function(x){ return Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0'); }).join('').toUpperCase(); }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255; var max=Math.max(r,g,b), min=Math.min(r,g,b), h=0, s=0, l=(max+min)/2;
    if(max !== min){ var d=max-min; s=l>0.5 ? d/(2-max-min) : d/(max+min); if(max===r) h=(g-b)/d+(g<b?6:0); else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
    return { h:h, s:s*100, l:l*100 };
  }
  function hslToRgb(h,s,l){
    s/=100; l/=100; var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
    if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
    return { r:Math.round((r+m)*255), g:Math.round((g+m)*255), b:Math.round((b+m)*255) };
  }
  function paletteFrom(base){
    var rgb=hexToRgb(base), hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
    return [-35,-15,0,25,55].map(function(delta){ var rgb2=hslToRgb((hsl.h+delta+360)%360, Math.min(88, Math.max(34,hsl.s + (delta===0?0:6))), Math.min(78, Math.max(30,hsl.l + (delta<0?-4:delta>0?4:0)))); return rgbToHex(rgb2.r,rgb2.g,rgb2.b); });
  }
  function renderPalette(colors){ return h('div',{class:'palette'}, colors.map(function(color){ return h('div',{class:'swatch', style:'background:'+color, text:color}); })); }
  function colorPaletteGenerator(root){
    clear(root);
    var base=input('color','#0f766e'); var out=h('div'); var resultText=''; var n=note();
    function run(randomize){ if(randomize) base.value = rgbToHex(randomInt(256),randomInt(256),randomInt(256)); var colors=paletteFrom(base.value); resultText=colors.join('\n'); out.innerHTML=''; out.appendChild(renderPalette(colors)); }
    base.addEventListener('input', function(){ run(false); });
    var row=actions(); row.appendChild(primary('Random palette', function(){ run(true); })); row.appendChild(secondary('Copy HEX values', function(){ copyToClipboard(resultText,n); })); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('Base color',base), out, row)); run(false);
  }
  function jsonFormatter(root){
    clear(root); var src=textarea('',{placeholder:'Paste JSON here.'}); var indent=select([['2','2 spaces'],['4','4 spaces'],['tab','Tabs']], '2'); var out=resultBox('Formatted JSON'); var n=note();
    function run(){ try{ var obj=JSON.parse(src.value || 'null'); setText(out.box, JSON.stringify(obj,null,indent.value==='tab'?'\t':parseInt(indent.value,10))); } catch(e){ setText(out.box, e.message, true); } }
    [src,indent].forEach(function(el){ el.addEventListener('input',run); el.addEventListener('change',run); });
    var row=actions(); row.appendChild(primary('Format JSON',run)); row.appendChild(secondary('Copy',function(){copyToClipboard(out.box.textContent,n);})); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('JSON input',src), field('Indentation',indent), out.wrap, row)); run();
  }
  function jsonMinifier(root){
    clear(root); var src=textarea('',{placeholder:'Paste JSON here.'}); var out=resultBox('Minified JSON'); var n=note();
    function run(){ try{ setText(out.box, JSON.stringify(JSON.parse(src.value || 'null'))); } catch(e){ setText(out.box, e.message, true); } }
    src.addEventListener('input',run); var row=actions(); row.appendChild(primary('Minify JSON',run)); row.appendChild(secondary('Copy',function(){copyToClipboard(out.box.textContent,n);})); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('JSON input',src), out.wrap, row)); run();
  }
  function htmlFormatter(root){
    textTool(root, 'HTML input', '<main><h1>Hello</h1><p>World</p></main>', function(html){
      var voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
      var tokens = html.replace(/>\s*</g,'><').replace(/</g,'\n<').split('\n').map(function(t){return t.trim();}).filter(Boolean);
      var indent=0, lines=[];
      tokens.forEach(function(tok){
        var close=/^<\//.test(tok), match=tok.match(/^<\/?([a-zA-Z0-9-]+)/), name=match?match[1].toLowerCase():'';
        if(close) indent=Math.max(0,indent-1);
        lines.push('  '.repeat(indent)+tok);
        if(!close && /^</.test(tok) && !/\/\s*>$/.test(tok) && !voids.has(name) && !/^<!|^<\?/.test(tok)) indent++;
      });
      return lines.join('\n');
    });
  }
  function cssMinifier(root){ textTool(root, 'CSS input', 'body { color: #222; }', function(css){ return css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}:;,>+~])\s*/g,'$1').replace(/;}/g,'}').trim(); }); }
  function javascriptMinifier(root){ textTool(root, 'JavaScript input', 'function hello(name) { console.log(name); }', function(js){ return js.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1').replace(/\s+/g,' ').replace(/\s*([{}();,:=+\-*\/<>\[\]])\s*/g,'$1').trim(); }); }
  function base64EncodeText(text){ var bytes=new TextEncoder().encode(text); var bin=''; bytes.forEach(function(b){ bin+=String.fromCharCode(b); }); return btoa(bin); }
  function base64DecodeText(text){ var bin=atob(text.trim()); var bytes=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
  function base64Encoder(root){ textTool(root, 'Text input', 'Text to encode', function(t){ return base64EncodeText(t); }); }
  function base64Decoder(root){ textTool(root, 'Base64 input', 'SGVsbG8=', function(t){ try{return base64DecodeText(t);}catch(e){return 'Invalid Base64 input: '+e.message;} }); }
  function urlEncoder(root){ textTool(root, 'Text input', 'hello world & value=1', function(t){ return encodeURIComponent(t); }); }
  function urlDecoder(root){ textTool(root, 'URL encoded input', 'hello%20world', function(t){ try{return decodeURIComponent(t.replace(/\+/g,' '));}catch(e){return 'Invalid URL encoding: '+e.message;} }); }
  function htmlEntityEncoder(root){ textTool(root, 'HTML input', '<p class="note">Hello & welcome</p>', function(t){ return t.replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }); }
  function htmlEntityDecoder(root){ textTool(root, 'Entity input', '&lt;p&gt;Hello &amp; welcome&lt;/p&gt;', function(t){ var area=document.createElement('textarea'); area.innerHTML=t; return area.value; }); }
  function unixTimestampConverter(root){
    clear(root); var ts=input('number', String(Math.floor(Date.now()/1000)), {step:'1'}); var dt=input('datetime-local'); var out=resultBox('Result');
    function fillDate(){ var d=new Date(); d.setSeconds(0,0); dt.value = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
    function fromTs(){ var raw=numberValue(ts,0); var ms = raw > 9999999999 ? raw : raw*1000; var d=new Date(ms); setText(out.box, 'UTC: '+d.toISOString()+'\nLocal: '+d.toString()+'\nUnix seconds: '+Math.floor(d.getTime()/1000)+'\nUnix milliseconds: '+d.getTime()); }
    function fromDate(){ if(!dt.value) return; var d=new Date(dt.value); ts.value=String(Math.floor(d.getTime()/1000)); fromTs(); }
    fillDate(); ts.addEventListener('input',fromTs); dt.addEventListener('input',fromDate);
    var row=actions(); row.appendChild(primary('Use current time', function(){ ts.value=String(Math.floor(Date.now()/1000)); fillDate(); fromTs(); }));
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class:'inline-grid'}, field('Unix timestamp',ts), field('Date and time',dt)), out.wrap, row)); fromTs();
  }
  var units = {
    length: { label:'Length', base:'meter', items:{ meter:1, kilometer:1000, centimeter:0.01, millimeter:0.001, inch:0.0254, foot:0.3048, yard:0.9144, mile:1609.344 } },
    weight: { label:'Weight', base:'kilogram', items:{ kilogram:1, gram:0.001, milligram:0.000001, pound:0.45359237, ounce:0.028349523125, stone:6.35029318, tonne:1000 } },
    volume: { label:'Volume', base:'liter', items:{ liter:1, milliliter:0.001, 'cubic meter':1000, 'US gallon':3.785411784, 'US quart':0.946352946, 'US pint':0.473176473, 'US cup':0.2365882365, 'fluid ounce':0.02957352956 } },
    time: { label:'Time', base:'second', items:{ second:1, minute:60, hour:3600, day:86400, week:604800, month:2629800, year:31557600 } },
    area: { label:'Area', base:'square meter', items:{ 'square meter':1, 'square kilometer':1000000, 'square centimeter':0.0001, 'square foot':0.09290304, acre:4046.8564224, hectare:10000 } },
    speed: { label:'Speed', base:'meter per second', items:{ 'meter per second':1, 'kilometer per hour':0.2777777778, 'mile per hour':0.44704, knot:0.5144444444, 'foot per second':0.3048 } }
  };
  function unitOptions(group){ return Object.keys(units[group].items).map(function(k){ return [k, k.charAt(0).toUpperCase()+k.slice(1)]; }); }
  function converter(root, fixedGroup){
    clear(root);
    var amount=input('number','1',{step:'any'}), category=select(Object.keys(units).map(function(k){ return [k, units[k].label]; }), fixedGroup || 'length'), from=select([]), to=select([]), out=resultBox('Result');
    if(fixedGroup) category.disabled = true;
    function refresh(){ from.innerHTML=''; to.innerHTML=''; unitOptions(category.value).forEach(function(opt){ from.appendChild(h('option',{value:opt[0],text:opt[1]})); to.appendChild(h('option',{value:opt[0],text:opt[1]})); }); to.selectedIndex = Math.min(1, to.options.length-1); }
    function run(){ var group=units[category.value], a=numberValue(amount,0), res=a*group.items[from.value]/group.items[to.value]; setText(out.box, formatNumber(a,8)+' '+from.value+' = '+formatNumber(res,8)+' '+to.value); }
    refresh(); [amount,category,from,to].forEach(function(el){ el.addEventListener('input',function(){ if(el===category) refresh(); run(); }); el.addEventListener('change',function(){ if(el===category) refresh(); run(); }); });
    var pieces = fixedGroup ? [field('Amount',amount), field('From',from), field('To',to)] : [field('Amount',amount), field('Category',category), field('From',from), field('To',to)];
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class: fixedGroup ? 'three-grid' : 'inline-grid'}, pieces), out.wrap)); run();
  }
  function temperatureConverter(root){
    clear(root); var amount=input('number','25',{step:'any'}), from=select(['Celsius','Fahrenheit','Kelvin'],'Celsius'), to=select(['Celsius','Fahrenheit','Kelvin'],'Fahrenheit'), out=resultBox('Result');
    function toC(v,u){ return u==='Celsius'?v:u==='Fahrenheit'?(v-32)*5/9:v-273.15; }
    function fromC(c,u){ return u==='Celsius'?c:u==='Fahrenheit'?c*9/5+32:c+273.15; }
    function run(){ var c=toC(numberValue(amount,0),from.value); var res=fromC(c,to.value); setText(out.box, formatNumber(numberValue(amount,0),4)+' '+from.value+' = '+formatNumber(res,4)+' '+to.value); }
    [amount,from,to].forEach(function(el){ el.addEventListener('input',run); el.addEventListener('change',run); });
    root.appendChild(h('div',{class:'tool-form'}, h('div',{class:'three-grid'}, field('Temperature',amount), field('From',from), field('To',to)), out.wrap)); run();
  }
  var QR_INFO = {1:{size:21,data:19,ecc:7,align:[]},2:{size:25,data:34,ecc:10,align:[6,18]},3:{size:29,data:55,ecc:15,align:[6,22]},4:{size:33,data:80,ecc:20,align:[6,26]},5:{size:37,data:108,ecc:26,align:[6,30]}};
  var gfExp=null, gfLog=null;
  function initGf(){
    if(gfExp) return;
    gfExp=new Array(512); gfLog=new Array(256); var x=1;
    for(var i=0;i<255;i++){ gfExp[i]=x; gfLog[x]=i; x<<=1; if(x & 256) x ^= 0x11d; }
    for(var j=255;j<512;j++) gfExp[j]=gfExp[j-255];
  }
  function gfMul(a,b){ initGf(); return (a===0 || b===0) ? 0 : gfExp[gfLog[a] + gfLog[b]]; }
  function rsGenerator(degree){
    initGf(); var poly=[1];
    for(var i=0;i<degree;i++){ var next=new Array(poly.length+1).fill(0); for(var j=0;j<poly.length;j++){ next[j] ^= poly[j]; next[j+1] ^= gfMul(poly[j], gfExp[i]); } poly=next; }
    return poly;
  }
  function rsCompute(data, degree){
    var gen=rsGenerator(degree); var rem=data.slice().concat(new Array(degree).fill(0));
    for(var i=0;i<data.length;i++){ var factor=rem[i]; if(factor!==0){ for(var j=0;j<gen.length;j++) rem[i+j] ^= gfMul(gen[j], factor); } }
    return rem.slice(data.length);
  }
  function bitsPush(arr, val, len){ for(var i=len-1;i>=0;i--) arr.push((val>>>i)&1); }
  function qrSvg(text){
    var bytes=Array.from(new TextEncoder().encode(text)); var version=0, info=null;
    for(var v=1;v<=5;v++){ if(4+8+bytes.length*8 <= QR_INFO[v].data*8){ version=v; info=QR_INFO[v]; break; } }
    if(!info) throw new Error('This generator supports up to 106 UTF-8 bytes. Shorten the text and try again.');
    var bits=[]; bitsPush(bits,4,4); bitsPush(bits,bytes.length,8); bytes.forEach(function(b){ bitsPush(bits,b,8); });
    var cap=info.data*8; var terminator=Math.min(4, cap-bits.length); for(var i=0;i<terminator;i++) bits.push(0); while(bits.length%8) bits.push(0);
    var data=[]; for(var bi=0;bi<bits.length;bi+=8){ var val=0; for(var bj=0;bj<8;bj++) val=(val<<1)|bits[bi+bj]; data.push(val); }
    var pads=[0xec,0x11]; var pi=0; while(data.length<info.data){ data.push(pads[pi%2]); pi++; }
    var codewords=data.concat(rsCompute(data, info.ecc)); var allBits=[]; codewords.forEach(function(b){ bitsPush(allBits,b,8); });
    var size=info.size; var m=Array.from({length:size}, function(){ return new Array(size).fill(false); }); var func=Array.from({length:size}, function(){ return new Array(size).fill(false); });
    function set(r,c,val,isFunc){ if(r<0||c<0||r>=size||c>=size) return; m[r][c]=!!val; if(isFunc) func[r][c]=true; }
    function finder(r,c){ for(var dr=-1;dr<=7;dr++){ for(var dc=-1;dc<=7;dc++){ var rr=r+dr, cc=c+dc; var black=dr>=0&&dr<=6&&dc>=0&&dc<=6&&(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4)); set(rr,cc,black,true); } } }
    finder(0,0); finder(0,size-7); finder(size-7,0);
    for(var t=8;t<size-8;t++){ set(6,t,t%2===0,true); set(t,6,t%2===0,true); }
    info.align.forEach(function(r){ info.align.forEach(function(c){ if((r<9&&c<9)||(r<9&&c>size-10)||(r>size-10&&c<9)) return; for(var dr=-2;dr<=2;dr++){ for(var dc=-2;dc<=2;dc++){ set(r+dr,c+dc,Math.max(Math.abs(dr),Math.abs(dc))!==1,true); } } }); });
    for(var f=0;f<9;f++){ if(f!==6){ set(8,f,false,true); set(f,8,false,true); } }
    for(var f2=0;f2<8;f2++){ set(size-1-f2,8,false,true); set(8,size-1-f2,false,true); }
    set(size-8,8,true,true);
    var bit=0;
    for(var col=size-1;col>0;col-=2){ if(col===6) col--; for(var rowStep=0;rowStep<size;rowStep++){ var row = ((col+1)&2) ? size-1-rowStep : rowStep; for(var c=col;c>=col-1;c--){ if(!func[row][c]){ var value = bit<allBits.length ? allBits[bit++] : 0; if((row+c)%2===0) value ^= 1; m[row][c]=!!value; } } } }
    var format = formatBits(1,0);
    function fb(i){ return ((format>>>i)&1)!==0; }
    for(var a=0;a<=5;a++) set(8,a,fb(a),true); set(8,7,fb(6),true); set(8,8,fb(7),true); set(7,8,fb(8),true); for(var b=9;b<15;b++) set(14-b,8,fb(b),true);
    for(var c2=0;c2<8;c2++) set(size-1-c2,8,fb(c2),true); for(var c3=8;c3<15;c3++) set(8,size-15+c3,fb(c3),true); set(size-8,8,true,true);
    var border=4, total=size+border*2; var rects=[];
    for(var r=0;r<size;r++){ for(var cc=0;cc<size;cc++){ if(m[r][cc]) rects.push('<rect x="'+(cc+border)+'" y="'+(r+border)+'" width="1" height="1"/>'); } }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+total+' '+total+'" shape-rendering="crispEdges"><rect width="'+total+'" height="'+total+'" fill="#fff"/><g fill="#111827">'+rects.join('')+'</g></svg>';
  }
  function formatBits(ecl, mask){
    var data=(ecl<<3)|mask; var bits=data<<10; for(var i=14;i>=10;i--){ if(((bits>>>i)&1)!==0) bits ^= 0x537 << (i-10); } return ((data<<10)|bits) ^ 0x5412;
  }
  function qrCodeGenerator(root){
    clear(root); var src=textarea('https://toolvanta.space',{maxlength:'106'}); var output=h('div',{class:'qr-box'}); var status=resultBox('Status'); var currentSvg='';
    function run(){ try{ currentSvg=qrSvg(src.value || ' '); output.innerHTML=currentSvg; setText(status.box, 'QR code generated. Maximum input for this lightweight static generator is 106 UTF-8 bytes.'); } catch(e){ output.innerHTML=''; currentSvg=''; setText(status.box,e.message,true); } }
    src.addEventListener('input',run);
    var row=actions(); row.appendChild(primary('Generate QR code',run)); row.appendChild(secondary('Download SVG',function(){ if(!currentSvg) return; var blob=new Blob([currentSvg],{type:'image/svg+xml'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='toolvanta-qr-code.svg'; a.click(); URL.revokeObjectURL(a.href); }));
    root.appendChild(h('div',{class:'tool-form'}, field('Text or URL',src,'Supports short text and URLs up to 106 UTF-8 bytes.'), output, status.wrap, row)); run();
  }
  function colorPicker(root){
    clear(root); var color=input('color','#0f766e'); var preview=h('div',{class:'color-preview'}); var out=resultBox('Color values'); var n=note();
    function run(){ var rgb=hexToRgb(color.value), hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); preview.style.background=color.value; setText(out.box, 'HEX: '+color.value.toUpperCase()+'\nRGB: rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')\nHSL: hsl('+Math.round(hsl.h)+', '+Math.round(hsl.s)+'%, '+Math.round(hsl.l)+'%)'); }
    color.addEventListener('input',run); var row=actions(); row.appendChild(secondary('Copy values',function(){copyToClipboard(out.box.textContent,n);})); row.appendChild(n);
    root.appendChild(h('div',{class:'tool-form'}, field('Pick a color',color), preview, out.wrap, row)); run();
  }
  var renderers = {
    'word-counter': wordCounter,
    'character-counter': characterCounter,
    'uppercase-converter': function(root){ textTool(root,'Text','Enter text to convert to uppercase.',function(t){return t.toUpperCase();}); },
    'lowercase-converter': function(root){ textTool(root,'Text','Enter text to convert to lowercase.',function(t){return t.toLowerCase();}); },
    'title-case-converter': function(root){ textTool(root,'Text','Enter a title or headline.',titleCaseText); },
    'sentence-case-converter': function(root){ textTool(root,'Text','Enter text to convert to sentence case.',sentenceCaseText); },
    'remove-extra-spaces': function(root){ textTool(root,'Text','Paste text with extra spaces.',removeExtraSpacesText); },
    'remove-duplicate-lines': removeDuplicateLines,
    'text-reverser': textReverser,
    'line-counter': lineCounter,
    'word-sorter': wordSorter,
    'text-cleaner': textCleaner,
    'age-calculator': ageCalculator,
    'bmi-calculator': bmiCalculator,
    'percentage-calculator': percentageCalculator,
    'discount-calculator': discountCalculator,
    'tip-calculator': tipCalculator,
    'loan-calculator': loanCalculator,
    'simple-interest-calculator': simpleInterestCalculator,
    'compound-interest-calculator': compoundInterestCalculator,
    'vat-calculator': vatCalculator,
    'salary-hourly-rate-calculator': salaryHourlyRateCalculator,
    'password-generator': passwordGenerator,
    'random-number-generator': randomNumberGenerator,
    'uuid-generator': uuidGenerator,
    'username-generator': usernameGenerator,
    'business-name-generator': function(root){ nameGenerator(root,'business'); },
    'youtube-channel-name-generator': function(root){ nameGenerator(root,'youtube'); },
    'blog-title-generator': blogTitleGenerator,
    'hashtag-generator': hashtagGenerator,
    'random-quote-generator': randomQuoteGenerator,
    'color-palette-generator': colorPaletteGenerator,
    'json-formatter': jsonFormatter,
    'json-minifier': jsonMinifier,
    'html-formatter': htmlFormatter,
    'css-minifier': cssMinifier,
    'javascript-minifier': javascriptMinifier,
    'base64-encoder': base64Encoder,
    'base64-decoder': base64Decoder,
    'url-encoder': urlEncoder,
    'url-decoder': urlDecoder,
    'html-entity-encoder': htmlEntityEncoder,
    'html-entity-decoder': htmlEntityDecoder,
    'unix-timestamp-converter': unixTimestampConverter,
    'unit-converter': function(root){ converter(root); },
    'length-converter': function(root){ converter(root,'length'); },
    'weight-converter': function(root){ converter(root,'weight'); },
    'temperature-converter': temperatureConverter,
    'qr-code-generator': qrCodeGenerator,
    'color-picker': colorPicker
  };
  ready(function(){
    initNav(); initYear();
    var root = document.getElementById('tool-root');
    if(!root) return;
    var id = root.getAttribute('data-tool-id');
    if(renderers[id]) renderers[id](root);
    else root.textContent = 'Tool not found.';
  });
})();

/* ToolVanta universal quick actions */
(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function fire(node){ node.dispatchEvent(new Event('input', { bubbles:true })); node.dispatchEvent(new Event('change', { bubbles:true })); }
  function sampleValue(node, tool){
    var tag = node.tagName.toLowerCase();
    var type = (node.getAttribute('type') || '').toLowerCase();
    var id = (tool && tool.id) || '';
    var category = (tool && tool.category) || '';
    if(tag === 'select') return null;
    if(type === 'date') return node.name && node.name.indexOf('end') !== -1 ? '2026-12-31' : '2026-01-01';
    if(type === 'time') return node.value && node.value !== '09:00' ? node.value : '09:00';
    if(type === 'color') return '#0f766e';
    if(type === 'url') return 'https://toolvanta.space/tools/';
    if(type === 'number') return node.value || '100';
    if(type === 'file') return null;
    if(id.indexOf('json') !== -1) return '{\"site\":\"ToolVanta\",\"tools\":150,\"static\":true}';
    if(id.indexOf('jwt') !== -1) return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0b29sdmFudGEiLCJyb2xlIjoiZGVtbyIsImlhdCI6MTcxMDAwMDAwMH0.signature';
    if(id.indexOf('regex') !== -1) return '\\\\btool\\\\w*\\\\b';
    if(id.indexOf('utm') !== -1) return 'https://toolvanta.space/';
    if(category === 'seo') return 'ToolVanta free online tools help users complete SEO, text, developer, image, and productivity tasks directly in the browser.';
    if(category === 'social-media') return 'Launch day: free browser tools for creators, marketers, and developers. #tools #seo';
    if(category === 'ai' || category === 'marketing') return 'browser based productivity tools for global users';
    return 'ToolVanta helps people use fast browser-based tools for SEO, text, development, marketing, images, and productivity.';
  }
  function getTool(root){
    var id = root.getAttribute('data-tool-id');
    var list = window.TOOLVANTA_TOOLS || [];
    for(var i=0;i<list.length;i++) if(list[i].id === id) return list[i];
    return { id:id, category:'' };
  }
  function copyText(text, note){
    if(!text) return;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ if(note){ note.textContent='Copied'; setTimeout(function(){ note.textContent=''; }, 1400); } });
    }
  }
  function enhance(){
    var root = document.getElementById('tool-root');
    if(!root || root.dataset.quickActions === 'ready') return;
    var form = root.querySelector('.tool-form');
    if(!form) return;
    root.dataset.quickActions = 'ready';
    var tool = getTool(root);
    var bar = document.createElement('div');
    bar.className = 'tool-quickbar';
    var label = document.createElement('span');
    label.className = 'quickbar-label';
    label.textContent = 'Quick actions';
    var load = document.createElement('button');
    load.type = 'button';
    load.className = 'secondary-btn';
    load.textContent = 'Load sample';
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'secondary-btn';
    clear.textContent = 'Clear';
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'secondary-btn';
    copy.textContent = 'Copy result';
    var note = document.createElement('span');
    note.className = 'copy-note';
    load.addEventListener('click', function(){
      root.querySelectorAll('input, textarea').forEach(function(node){
        var value = sampleValue(node, tool);
        if(value === null) return;
        node.value = value;
        fire(node);
      });
      root.querySelectorAll('select').forEach(function(node){ if(node.options.length) node.selectedIndex = 0; fire(node); });
    });
    clear.addEventListener('click', function(){
      root.querySelectorAll('input, textarea').forEach(function(node){
        var type = (node.getAttribute('type') || '').toLowerCase();
        if(type === 'file') return;
        if(type === 'color') node.value = '#0f766e';
        else if(type === 'number') node.value = '';
        else node.value = '';
        fire(node);
      });
    });
    copy.addEventListener('click', function(){
      var out = root.querySelector('.output-box, .stats-grid, .palette, .image-preview');
      copyText(out ? out.textContent.trim() : '', note);
    });
    bar.appendChild(label);
    bar.appendChild(load);
    bar.appendChild(clear);
    bar.appendChild(copy);
    bar.appendChild(note);
    form.insertBefore(bar, form.firstChild);
  }
  ready(function(){
    setTimeout(enhance, 80);
    setTimeout(enhance, 350);
  });
})();

/* ToolVanta premium tool fixes */
(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function el(tag, attrs){
    var n=document.createElement(tag); attrs=attrs||{};
    Object.keys(attrs).forEach(function(k){
      if(k==='class') n.className=attrs[k];
      else if(k==='text') n.textContent=attrs[k];
      else if(k==='html') n.innerHTML=attrs[k];
      else if(k==='for') n.htmlFor=attrs[k];
      else if(k.indexOf('on')===0 && typeof attrs[k]==='function') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    for(var i=2;i<arguments.length;i++){ var c=arguments[i]; if(c==null) continue; if(Array.isArray(c)) c.forEach(function(x){ if(x) n.appendChild(x); }); else if(typeof c==='string') n.appendChild(document.createTextNode(c)); else n.appendChild(c); }
    return n;
  }
  function input(type,value,attrs){ attrs=attrs||{}; attrs.type=type; var n=el('input',attrs); if(value!=null) n.value=value; return n; }
  function textarea(value,attrs){ var n=el('textarea',attrs||{}); if(value!=null) n.value=value; return n; }
  function select(items,value){ var s=el('select'); items.forEach(function(x){ s.appendChild(el('option',{value:x[0],text:x[1]})); }); if(value!=null) s.value=value; return s; }
  function field(label,node,help){ var id=node.id||('tvp-'+Math.random().toString(36).slice(2)); node.id=id; var f=el('div',{class:'field'},el('label',{for:id,text:label}),node); if(help) f.appendChild(el('small',{text:help})); return f; }
  function box(label){ var b=el('div',{class:'output-box premium-output',role:'status','aria-live':'polite'}); return {box:b,wrap:el('div',{class:'field'},el('label',{text:label}),b)}; }
  function button(text,fn,kind){ return el('button',{type:'button',class:kind||'primary-btn',onclick:fn,text:text}); }
  function row(){ return el('div',{class:'action-row'}); }
  function lines(t){ return String(t||'').split(/\r?\n/); }
  function words(t){ return String(t||'').trim()?String(t).trim().split(/\s+/).filter(Boolean):[]; }
  function fmt(n,d){ return Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:d==null?2:d}).format(n):'0'; }
  function copy(text,note){ if(!text) return; if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){ if(note){ note.textContent='Copied'; setTimeout(function(){note.textContent='';},1500); } }); }
  function hex2rgb(hex){ hex=String(hex).trim().replace('#',''); if(hex.length===3) hex=hex.split('').map(function(c){return c+c;}).join(''); var n=parseInt(hex,16); return isNaN(n)?null:{r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  function rgb2hex(r,g,b){ return '#'+[r,g,b].map(function(x){ return Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0'); }).join('').toUpperCase(); }
  function rgb2hsl(r,g,b){ r/=255; g/=255; b/=255; var max=Math.max(r,g,b), min=Math.min(r,g,b), h=0, s=0, l=(max+min)/2; if(max!==min){ var d=max-min; s=l>.5?d/(2-max-min):d/(max+min); switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;} h*=60; } return {h:Math.round(h),s:Math.round(s*100),l:Math.round(l*100)}; }
  function renderRegex(root){
    root.innerHTML='';
    var pattern=input('text','\\btool\\w*\\b'), flags=input('text','gi'), sample=textarea('ToolVanta includes useful tools for SEO, text, developers, and marketing.'), out=box('Matches'), note=el('span',{class:'copy-note'});
    function run(){ try{ var re=new RegExp(pattern.value, flags.value.replace(/[^gimsuy]/g,'')); var matches=sample.value.match(re)||[]; out.box.classList.remove('error'); out.box.textContent='Matches: '+matches.length+'\n\n'+(matches.join('\n')||'No matches found.'); }catch(e){ out.box.classList.add('error'); out.box.textContent=e.message; } }
    [pattern,flags,sample].forEach(function(x){x.addEventListener('input',run);});
    root.appendChild(el('div',{class:'tool-form'},el('div',{class:'inline-grid'},field('Regular expression',pattern),field('Flags',flags,'Use JavaScript flags such as g, i, m, s.')),field('Test text',sample),out.wrap,el('div',{class:'action-row'},button('Test regex',run),button('Copy matches',function(){copy(out.box.textContent,note);},'secondary-btn'),note)));
    run();
  }
  function renderJwt(root){
    root.innerHTML='';
    var token=textarea('',{placeholder:'Paste a JWT token with header.payload.signature'}), out=box('Decoded JWT');
    function decodePart(part){ part=part.replace(/-/g,'+').replace(/_/g,'/'); while(part.length%4) part+='='; return decodeURIComponent(Array.prototype.map.call(atob(part),function(c){ return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2); }).join('')); }
    function run(){ try{ var p=token.value.trim().split('.'); if(p.length<2){ out.box.textContent='Paste a JWT token to decode its header and payload.'; out.box.classList.remove('error'); return; } var header=JSON.parse(decodePart(p[0])); var payload=JSON.parse(decodePart(p[1])); out.box.classList.remove('error'); out.box.textContent='Header\n'+JSON.stringify(header,null,2)+'\n\nPayload\n'+JSON.stringify(payload,null,2)+'\n\nSignature present: '+(p[2]?'Yes':'No'); }catch(e){ out.box.classList.add('error'); out.box.textContent='Invalid JWT: '+e.message; } }
    token.addEventListener('input',run);
    root.appendChild(el('div',{class:'tool-form'},field('JWT token',token),out.wrap,el('div',{class:'action-row'},button('Decode JWT',run))));
    run();
  }
  function renderColorConverter(root){
    root.innerHTML='';
    var color=input('color','#0f766e'), text=input('text','#0f766e'), preview=el('div',{class:'color-preview'}), out=box('Color values'), note=el('span',{class:'copy-note'});
    function run(fromText){ var rgb=hex2rgb(fromText?text.value:color.value); if(!rgb){ out.box.classList.add('error'); out.box.textContent='Enter a valid HEX color, for example #0F766E.'; return; } var hex=rgb2hex(rgb.r,rgb.g,rgb.b), hsl=rgb2hsl(rgb.r,rgb.g,rgb.b); color.value=hex; text.value=hex; preview.style.background=hex; out.box.classList.remove('error'); out.box.textContent='HEX: '+hex+'\nRGB: rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')\nHSL: hsl('+hsl.h+', '+hsl.s+'%, '+hsl.l+'%)'; }
    color.addEventListener('input',function(){run(false);}); text.addEventListener('input',function(){run(true);});
    root.appendChild(el('div',{class:'tool-form'},el('div',{class:'inline-grid'},field('Pick color',color),field('HEX value',text)),preview,out.wrap,el('div',{class:'action-row'},button('Convert color',function(){run(true);}),button('Copy values',function(){copy(out.box.textContent,note);},'secondary-btn'),note)));
    run(false);
  }
  function renderUtm(root){
    root.innerHTML='';
    var url=input('url','https://toolvanta.space/'), source=input('text','google'), medium=input('text','organic'), campaign=input('text','tool-launch'), term=input('text','free tools'), content=input('text','hero-link'), out=box('Campaign URL'), note=el('span',{class:'copy-note'});
    function run(){ try{ var u=new URL(url.value); [['utm_source',source.value],['utm_medium',medium.value],['utm_campaign',campaign.value],['utm_term',term.value],['utm_content',content.value]].forEach(function(pair){ if(pair[1]) u.searchParams.set(pair[0],pair[1]); }); out.box.classList.remove('error'); out.box.textContent=u.toString(); }catch(e){ out.box.classList.add('error'); out.box.textContent='Enter a full URL such as https://example.com/page'; } }
    [url,source,medium,campaign,term,content].forEach(function(x){x.addEventListener('input',run);});
    root.appendChild(el('div',{class:'tool-form'},field('Landing page URL',url),el('div',{class:'three-grid'},field('Source',source),field('Medium',medium),field('Campaign',campaign)),el('div',{class:'inline-grid'},field('Term',term),field('Content',content)),out.wrap,el('div',{class:'action-row'},button('Build URL',run),button('Copy URL',function(){copy(out.box.textContent,note);},'secondary-btn'),note)));
    run();
  }
  function renderDateDuration(root){
    root.innerHTML='';
    var a=input('date','2026-01-01'), b=input('date','2026-12-31'), out=box('Date duration');
    function run(){ var A=new Date(a.value+'T00:00:00'), B=new Date(b.value+'T00:00:00'), days=Math.round((B-A)/86400000); out.box.textContent='Days: '+fmt(Math.abs(days),0)+'\nWeeks: '+fmt(Math.abs(days)/7,2)+'\nApprox. months: '+fmt(Math.abs(days)/30.4375,2)+'\nDirection: '+(days>=0?'Forward':'Backward'); }
    [a,b].forEach(function(x){x.addEventListener('input',run);});
    root.appendChild(el('div',{class:'tool-form'},el('div',{class:'inline-grid'},field('Start date',a),field('End date',b)),out.wrap));
    run();
  }
  function renderTimeDuration(root){
    root.innerHTML='';
    var a=input('time','09:00'), b=input('time','17:30'), out=box('Time duration');
    function minutes(v){ var p=v.split(':'); return (+p[0]||0)*60+(+p[1]||0); }
    function run(){ var diff=minutes(b.value)-minutes(a.value); if(diff<0) diff+=1440; out.box.textContent='Minutes: '+diff+'\nHours: '+fmt(diff/60,2)+'\nDecimal workday: '+fmt(diff/480,2)+' days'; }
    [a,b].forEach(function(x){x.addEventListener('input',run);});
    root.appendChild(el('div',{class:'tool-form'},el('div',{class:'inline-grid'},field('Start time',a),field('End time',b)),out.wrap));
    run();
  }
  function renderImageRatio(root){
    root.innerHTML='';
    var w=input('number','1920'), h=input('number','1080'), target=select([['1.7777777778','16:9'],['1.3333333333','4:3'],['1','1:1'],['0.8','4:5'],['0.5625','9:16']], '1.7777777778'), out=box('Crop guidance');
    function gcd(a,b){ return b?gcd(b,a%b):a; }
    function run(){ var W=Math.max(1,+w.value||1), H=Math.max(1,+h.value||1), g=gcd(Math.round(W),Math.round(H)), r=+target.value, cropW=Math.min(W,H*r), cropH=Math.min(H,W/r); out.box.textContent='Current ratio: '+Math.round(W/g)+':'+Math.round(H/g)+'\nTarget ratio: '+target.options[target.selectedIndex].text+'\nRecommended crop: '+Math.round(cropW)+' x '+Math.round(cropH)+' px\nTrim width: '+Math.round(W-cropW)+' px\nTrim height: '+Math.round(H-cropH)+' px'; }
    [w,h,target].forEach(function(x){x.addEventListener('input',run);x.addEventListener('change',run);});
    root.appendChild(el('div',{class:'tool-form'},el('div',{class:'three-grid'},field('Image width',w),field('Image height',h),field('Target ratio',target)),out.wrap));
    run();
  }
  function renderImageColors(root){
    root.innerHTML='';
    var file=input('file',null,{accept:'image/*'}), preview=el('div',{class:'image-preview'}), palette=el('div',{class:'palette'}), out=box('Extracted colors');
    function swatch(hex){ return el('button',{type:'button',class:'swatch',style:'background:'+hex,onclick:function(){copy(hex);},text:hex}); }
    function run(){ var f=file.files&&file.files[0]; if(!f){ out.box.textContent='Upload an image to extract a small browser-side color palette.'; return; } var fr=new FileReader(); fr.onload=function(){ var img=new Image(); img.onload=function(){ var c=document.createElement('canvas'), ctx=c.getContext('2d'), size=80; c.width=size; c.height=size; ctx.drawImage(img,0,0,size,size); var data=ctx.getImageData(0,0,size,size).data, buckets={}; for(var i=0;i<data.length;i+=64){ var r=Math.round(data[i]/32)*32, g=Math.round(data[i+1]/32)*32, b=Math.round(data[i+2]/32)*32, key=rgb2hex(r,g,b); buckets[key]=(buckets[key]||0)+1; } var colors=Object.keys(buckets).sort(function(a,b){return buckets[b]-buckets[a];}).slice(0,8); preview.innerHTML=''; preview.appendChild(img); palette.innerHTML=''; colors.forEach(function(hex){ palette.appendChild(swatch(hex)); }); out.box.textContent=colors.join('\n'); }; img.src=fr.result; }; fr.readAsDataURL(f); }
    file.addEventListener('change',run);
    root.appendChild(el('div',{class:'tool-form'},field('Image file',file),preview,palette,out.wrap));
    run();
  }
  function renderSocialCount(root,kind){
    root.innerHTML='';
    var text=textarea('Launch day: free online tools for creators, marketers, and developers. #tools #seo'), out=box('Social analysis');
    function run(){ var hashtags=(text.value.match(/#[\w]+/g)||[]), emoji=(text.value.match(/[\u{1F300}-\u{1FAFF}]/gu)||[]), chars=text.value.length; if(kind==='emoji') out.box.textContent='Emoji count: '+emoji.length+'\nCharacters: '+chars; else if(kind==='hashtag') out.box.textContent='Hashtags: '+hashtags.length+'\n\n'+(hashtags.join('\n')||'No hashtags found.'); else out.box.textContent='Characters: '+chars+'\nX remaining: '+(280-chars)+'\nInstagram caption remaining: '+(2200-chars)+'\nLinkedIn post remaining: '+(3000-chars); }
    text.addEventListener('input',run);
    root.appendChild(el('div',{class:'tool-form'},field('Post text',text),out.wrap));
    run();
  }
  function renderKeywordCluster(root){
    root.innerHTML='';
    var src=textarea('free online tools\nonline tools for SEO\nfree SEO tools\nAI prompt generator\nAI writing prompt tool'), out=box('Keyword clusters'), note=el('span',{class:'copy-note'});
    function run(){ var groups={}; lines(src.value).map(function(x){return x.trim();}).filter(Boolean).forEach(function(k){ var head=(k.toLowerCase().match(/[a-z0-9]+/)||['other'])[0]; (groups[head]=groups[head]||[]).push(k); }); out.box.textContent=Object.keys(groups).sort().map(function(g){ return g.toUpperCase()+':\n- '+groups[g].join('\n- '); }).join('\n\n'); }
    src.addEventListener('input',run);
    root.appendChild(el('div',{class:'tool-form'},field('Keywords, one per line',src),out.wrap,el('div',{class:'action-row'},button('Cluster keywords',run),button('Copy clusters',function(){copy(out.box.textContent,note);},'secondary-btn'),note)));
    run();
  }
  function renderTodoSorter(root){
    root.innerHTML='';
    var src=textarea('High | Fix broken tool\nMedium | Improve footer links\nLow | Draft social post'), out=box('Sorted task list');
    function score(line){ var l=line.toLowerCase(); return l.indexOf('high')!==-1?0:l.indexOf('medium')!==-1?1:l.indexOf('low')!==-1?2:3; }
    function run(){ out.box.textContent=lines(src.value).filter(Boolean).sort(function(a,b){return score(a)-score(b)||a.localeCompare(b);}).join('\n'); }
    src.addEventListener('input',run);
    root.appendChild(el('div',{class:'tool-form'},field('Tasks with priority',src,'Use lines like High | Task name.'),out.wrap));
    run();
  }
  var premium = {
    'regex-tester': renderRegex,
    'jwt-decoder': renderJwt,
    'color-converter': renderColorConverter,
    'utm-url-builder': renderUtm,
    'date-duration-calculator': renderDateDuration,
    'time-duration-calculator': renderTimeDuration,
    'image-crop-ratio-calculator': renderImageRatio,
    'image-color-extractor': renderImageColors,
    'emoji-counter': function(root){renderSocialCount(root,'emoji');},
    'hashtag-counter': function(root){renderSocialCount(root,'hashtag');},
    'social-character-limit-checker': function(root){renderSocialCount(root,'limit');},
    'keyword-cluster-generator': renderKeywordCluster,
    'to-do-list-sorter': renderTodoSorter
  };
  ready(function(){
    var root=document.getElementById('tool-root');
    if(!root) return;
    var id=root.getAttribute('data-tool-id');
    if(premium[id]) premium[id](root);
  });
})();

/* ToolVanta compact SEO expansion renderers */
(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function el(tag, attrs){ var n=document.createElement(tag); attrs=attrs||{}; Object.keys(attrs).forEach(function(k){ if(k==='class') n.className=attrs[k]; else if(k==='text') n.textContent=attrs[k]; else if(k==='html') n.innerHTML=attrs[k]; else if(k==='for') n.htmlFor=attrs[k]; else if(k.indexOf('on')===0) n.addEventListener(k.slice(2),attrs[k]); else n.setAttribute(k,attrs[k]); }); for(var i=2;i<arguments.length;i++){ var c=arguments[i]; if(c==null) continue; if(typeof c==='string') n.appendChild(document.createTextNode(c)); else n.appendChild(c); } return n; }
  function input(type,value){ var n=el('input',{type:type}); if(value!=null) n.value=value; return n; }
  function textarea(value){ var n=el('textarea'); if(value!=null) n.value=value; return n; }
  function field(label,node){ var id=node.id || ('tv-'+Math.random().toString(36).slice(2)); node.id=id; return el('div',{class:'field'},el('label',{for:id,text:label}),node); }
  function box(label){ var b=el('div',{class:'output-box',role:'status','aria-live':'polite'}); return {box:b,wrap:el('div',{class:'field'},el('label',{text:label}),b)}; }
  function button(text,fn,kind){ return el('button',{type:'button',class:kind||'primary-btn',onclick:fn,text:text}); }
  function words(t){ return t.trim()?t.trim().split(/\s+/).filter(Boolean):[]; }
  function lines(t){ return t.split(/\r?\n/); }
  function slug(t){ return t.toLowerCase().trim().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function title(t){ return t.toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function num(n,d){ var x=parseFloat(n.value); return Number.isFinite(x)?x:d; }
  function fmt(n){ return Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(n):'0'; }
  function copyText(t,n){ if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){n.textContent='Copied'; setTimeout(function(){n.textContent='';},1500);}); }
  function textTool(root, label, placeholder, fn){ root.innerHTML=''; var src=textarea(''), out=box('Result'), note=el('span',{class:'copy-note'}); function run(){ try{ out.box.textContent=fn(src.value); out.box.classList.remove('error'); }catch(e){ out.box.textContent=e.message; out.box.classList.add('error'); } } src.placeholder=placeholder; src.addEventListener('input',run); root.appendChild(el('div',{class:'tool-form'},field(label,src),out.wrap,el('div',{class:'action-row'},button('Copy result',function(){copyText(out.box.textContent,note);},'secondary-btn'),note))); run(); }
  function renderText(root,tool){ var type=tool.type, tr=tool.transform; if(type==='word-frequency') return textTool(root,'Text','Paste text to find repeated words.',function(t){ var map={}; words(t.toLowerCase().replace(/[^a-z0-9 ]/g,' ')).forEach(function(w){map[w]=(map[w]||0)+1;}); return Object.keys(map).sort(function(x,y){return map[y]-map[x];}).slice(0,25).map(function(w){return w+': '+map[w];}).join(String.fromCharCode(10))||'No words found.'; }); if(type==='duplicate-word-finder') return textTool(root,'Text','Paste text to detect repeated words.',function(t){ var m={}; words(t.toLowerCase().replace(/[^a-z0-9 ]/g,' ')).forEach(function(w){m[w]=(m[w]||0)+1;}); return Object.keys(m).filter(function(w){return m[w]>1;}).map(function(w){return w+': '+m[w];}).join(String.fromCharCode(10))||'No duplicate words found.'; }); if(type==='text-compare') return compareTool(root); if(type==='readability-checker') return readability(root); if(type==='paragraph-counter') return countStats(root,'paragraph'); if(type==='sentence-counter') return countStats(root,'sentence'); if(type==='text-splitter') return textTool(root,'Text','Paste text to split.',function(t){return t.split(/[,.\n]+/).map(function(x){return x.trim();}).filter(Boolean).join(String.fromCharCode(10));}); if(type==='text-joiner') return textTool(root,'Items','Paste one item per line.',function(t){return lines(t).map(function(x){return x.trim();}).filter(Boolean).join(', ');}); if(type==='line-sorter') return textTool(root,'Lines','Paste one item per line.',function(t){return lines(t).map(function(x){return x.trim();}).filter(Boolean).sort().join(String.fromCharCode(10));}); if(type==='csv-cleaner') return textTool(root,'CSV text','name, email',function(t){return lines(t).map(function(row){return row.split(',').map(function(c){return c.trim();}).join(',');}).join(String.fromCharCode(10));}); if(type==='morse-code') return morse(root); return textTool(root,'Text','Enter text.',function(t){ if(tr==='slug') return slug(t); if(tr==='markdown-plain') return t.replace(/[#*_>\[\]()!-]/g,' ').replace(/\s+/g,' ').trim(); return t; }); }
  function compareTool(root){ root.innerHTML=''; var a=textarea(''), b=textarea(''), out=box('Line comparison'); function run(){ out.box.textContent='Added or changed lines:'+String.fromCharCode(10)+lines(b.value).filter(function(x){return lines(a.value).indexOf(x)===-1;}).join(String.fromCharCode(10)); } [a,b].forEach(function(x){x.addEventListener('input',run);}); root.appendChild(el('div',{class:'tool-form'},field('Original text',a),field('Updated text',b),out.wrap)); run(); }
  function countStats(root, mode){ root.innerHTML=''; var src=textarea(''), holder=el('div'); function run(){ var w=words(src.value).length, s=(src.value.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).length, p=src.value.trim()?src.value.trim().split(/\n\s*\n/).length:0; holder.innerHTML=''; holder.appendChild(el('div',{class:'stats-grid'},el('div',{class:'stat-card'},el('strong',{text:mode==='paragraph'?p:s}),el('span',{text:mode==='paragraph'?'Paragraphs':'Sentences'})),el('div',{class:'stat-card'},el('strong',{text:w}),el('span',{text:'Words'})),el('div',{class:'stat-card'},el('strong',{text:fmt(w/Math.max(1,mode==='paragraph'?p:s))}),el('span',{text:'Average words'})))); } src.placeholder='Paste text'; src.addEventListener('input',run); root.appendChild(el('div',{class:'tool-form'},field('Text',src),holder)); run(); }
  function readability(root){ root.innerHTML=''; var src=textarea(''), holder=el('div'); function run(){ var w=words(src.value).length, s=Math.max(1,(src.value.match(/[.!?]/g)||[]).length), score=206.835-1.015*(w/s); holder.innerHTML=''; holder.appendChild(el('div',{class:'stats-grid'},el('div',{class:'stat-card'},el('strong',{text:w}),el('span',{text:'Words'})),el('div',{class:'stat-card'},el('strong',{text:s}),el('span',{text:'Sentences'})),el('div',{class:'stat-card'},el('strong',{text:fmt(w/s)}),el('span',{text:'Avg words/sentence'})),el('div',{class:'stat-card'},el('strong',{text:fmt(score)}),el('span',{text:'Reading estimate'})))); } src.placeholder='Paste content'; src.addEventListener('input',run); root.appendChild(el('div',{class:'tool-form'},field('Text',src),holder)); run(); }
  function morse(root){ var map={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'}; textTool(root,'Text','SOS ToolVanta',function(t){return t.toLowerCase().split('').map(function(ch){return ch===' '?' / ':(map[ch]||ch);}).join(' ');}); }
  function renderTemplate(root,tool){ root.innerHTML=''; var topic=input('text','ToolVanta growth'), audience=input('text','online users'), out=box('Generated draft'), note=el('span',{class:'copy-note'}); function run(){ var t=topic.value||'your topic', a=audience.value||'your audience'; out.box.textContent=tool.name+' for '+a+String.fromCharCode(10,10)+'Hook: A clearer way to handle '+t+String.fromCharCode(10)+'Body: '+title(t)+' helps '+a+' move from idea to practical action.'+String.fromCharCode(10)+'Checklist:'+String.fromCharCode(10)+'- Be specific'+String.fromCharCode(10)+'- Add one example'+String.fromCharCode(10)+'- Include a clear next step'; } [topic,audience].forEach(function(x){x.addEventListener('input',run);}); root.appendChild(el('div',{class:'tool-form'},el('div',{class:'inline-grid'},field('Topic or product',topic),field('Audience',audience)),out.wrap,el('div',{class:'action-row'},button('Generate draft',run),button('Copy',function(){copyText(out.box.textContent,note);},'secondary-btn'),note))); run(); }
  function renderCalc(root,tool){ root.innerHTML=''; var a=input('number','1000'), b=input('number','50'), c=input('number','10'), out=box('Result'); function run(){ var A=num(a,0), B=num(b,1), C=num(c,1), calc=tool.calc, r=''; if(calc==='margin') r='Profit: '+fmt(B-A)+String.fromCharCode(10)+'Margin: '+fmt((B-A)/B*100)+'%'; else if(calc==='roi') r='ROI: '+fmt((B-A)/A*100)+'%'; else if(calc==='breakeven') r='Break-even units: '+fmt(A/Math.max(0.0001,B-C)); else if(calc==='fuel') r='Fuel needed: '+fmt(A/B)+String.fromCharCode(10)+'Cost: '+fmt(A/B*C); else if(tool.type==='gpa-calculator') r='Weighted GPA estimate: '+fmt((A+B+C)/3); else if(tool.type==='calorie-calculator') r='Daily calorie estimate: '+fmt(10*B+6.25*A-5*C); else if(calc==='ctr'||calc==='conversion') r='Rate: '+fmt(B/A*100)+'%'; else if(calc==='cpc'||calc==='cpa'||calc==='cac') r='Cost: '+fmt(A/B); else if(calc==='cpm') r='CPM: '+fmt(A/B*1000); else if(calc==='roas') r='ROAS: '+fmt(A/B)+'x'; else if(calc==='ltv') r='LTV estimate: '+fmt(A*(B/100)*C); else r='Result: '+fmt(A+B+C); out.box.textContent=r; } [a,b,c].forEach(function(x){x.addEventListener('input',run);}); root.appendChild(el('div',{class:'tool-form'},el('div',{class:'three-grid'},field('Value A',a),field('Value B',b),field('Value C',c)),out.wrap)); run(); }
  function renderSeo(root,tool){ var type=tool.type; if(type==='readability-checker') return readability(root); root.innerHTML=''; var titleInput=input('text','ToolVanta Free Online Tools'), desc=textarea('Use free online tools for AI, SEO, text, developers, marketing, and productivity.'), out=box('Result'); function run(){ var r=''; if(type==='keyword-density'){ var k=titleInput.value.toLowerCase().trim(), all=words(desc.value.toLowerCase()), hits=all.filter(function(w){return w===k;}).length; r='Keyword: '+k+String.fromCharCode(10)+'Occurrences: '+hits+String.fromCharCode(10)+'Density: '+fmt(hits/Math.max(1,all.length)*100)+'%'; } else if(type==='robots-generator') r='User-agent: *'+String.fromCharCode(10)+'Allow: /'+String.fromCharCode(10,10)+'Sitemap: '+titleInput.value; else if(type==='sitemap-builder') r='<?xml version="1.0" encoding="UTF-8"?>'+String.fromCharCode(10)+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+String.fromCharCode(10)+lines(desc.value).filter(Boolean).map(function(u){return '  <url><loc>'+u+'</loc></url>';}).join(String.fromCharCode(10))+String.fromCharCode(10)+'</urlset>'; else if(type==='schema-generator') r=JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:titleInput.value},null,2); else if(type==='heading-checker') r='H1 count: '+((desc.value.match(/<h1/gi)||[]).length)+String.fromCharCode(10)+'Headings found: '+((desc.value.match(/<h[1-6]/gi)||[]).length); else if(type==='canonical-checker') r='Canonical candidate: '+titleInput.value.split('?')[0].split('#')[0]; else if(type==='hreflang-generator') r='<link rel="alternate" hreflang="en" href="'+titleInput.value+'">'; else r='Title length: '+titleInput.value.length+String.fromCharCode(10)+'Description length: '+desc.value.length+String.fromCharCode(10)+'Recommended title: 30-60 characters'+String.fromCharCode(10)+'Recommended description: 120-160 characters'; out.box.textContent=r; } [titleInput,desc].forEach(function(x){x.addEventListener('input',run);}); root.appendChild(el('div',{class:'tool-form'},field('Title, URL, or keyword',titleInput),field('Text, URL list, or description',desc),out.wrap)); run(); }
  function renderDev(root,tool){ textTool(root,'Input','Paste input',function(v){ var type=tool.type; try{ if(type==='regex-tester') return (v.match(new RegExp('tool','gi'))||[]).join(String.fromCharCode(10))||'No matches for default pattern: tool'; if(type==='jwt-decoder'){ var p=v.split('.'); return p.length>1?atob(p[1].replace(/-/g,'+').replace(/_/g,'/')):'Paste a JWT token.'; } if(type==='csv-to-json'){ var rows=lines(v).filter(Boolean), heads=(rows.shift()||'').split(','); return JSON.stringify(rows.map(function(row){var cells=row.split(','),o={};heads.forEach(function(h,i){o[h.trim()]=(cells[i]||'').trim();});return o;}),null,2); } if(type==='json-to-csv'){ var arr=JSON.parse(v||'[]'); if(!Array.isArray(arr)) arr=[arr]; var keys=Object.keys(arr[0]||{}); return keys.join(',')+String.fromCharCode(10)+arr.map(function(o){return keys.map(function(k){return o[k];}).join(',');}).join(String.fromCharCode(10)); } if(type==='hash-generator'){ var h=5381; for(var i=0;i<v.length;i++) h=((h<<5)+h)+v.charCodeAt(i); return 'Fast hash: '+(h>>>0).toString(16); } return v.replace(/>\s*</g,'>'+String.fromCharCode(10)+'<').replace(/[{;]/g,function(m){return m+String.fromCharCode(10);}); }catch(e){ return e.message; } }); }
  function renderImage(root,tool){ root.innerHTML=''; var file=input('file'), a=input('number','1200'), b=input('number','630'), color=input('color','#0f766e'), preview=el('div',{class:'image-preview'}), out=box('Result'), note=el('span',{class:'copy-note'}); file.accept='image/*'; function imageResult(src,name){ out.box.innerHTML=''; var img=el('img',{alt:'Generated image',src:src}); out.box.appendChild(img); if(name){ var link=el('a',{class:'download-link',href:src,download:name,text:'Download image'}); out.box.appendChild(link); } } function showSvg(){ var w=Math.max(1,parseInt(a.value,10)||1200), h=Math.max(1,parseInt(b.value,10)||630); var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="'+color.value+'"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="48" fill="#fff">ToolVanta</text></svg>'; preview.innerHTML=svg; imageResult('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),'toolvanta.svg'); } function canvasOutput(src){ var img=new Image(); img.onload=function(){ var w=Math.max(1,parseInt(a.value,10)||img.naturalWidth), h=Math.max(1,parseInt(b.value,10)||img.naturalHeight), canvas=document.createElement('canvas'), ctx=canvas.getContext('2d'); canvas.width=w; canvas.height=h; ctx.drawImage(img,0,0,w,h); var mime=tool.type==='image-compressor'?'image/jpeg':'image/png'; var data=canvas.toDataURL(mime,0.82); preview.innerHTML=''; preview.appendChild(canvas); imageResult(data, tool.type==='image-compressor'?'compressed.jpg':'resized.png'); }; img.onerror=function(){ out.box.textContent='Image could not be loaded.'; }; img.src=src; } function runFile(){ if(!file.files[0]){showSvg();return;} var fr=new FileReader(); fr.onload=function(){ if(tool.type==='image-base64'){ preview.innerHTML='<img alt="Preview" src="'+fr.result+'">'; out.box.textContent=fr.result; return; } canvasOutput(fr.result); }; fr.readAsDataURL(file.files[0]); } [file,a,b,color].forEach(function(x){x.addEventListener('input',runFile);x.addEventListener('change',runFile);}); if(tool.type==='svg-optimizer') return renderDev(root,tool); if(tool.type==='gradient-generator'){ preview.className='gradient-preview'; function grad(){ var css='linear-gradient(135deg, '+color.value+', #8a1538)'; preview.style.background=css; out.box.textContent='background: '+css+';'; } color.addEventListener('input',grad); root.appendChild(el('div',{class:'tool-form'},field('First color',color),preview,out.wrap)); grad(); return; } root.appendChild(el('div',{class:'tool-form'},field('Image file',file),el('div',{class:'inline-grid'},field('Width',a),field('Height',b)),field('Color',color),preview,out.wrap,el('div',{class:'action-row'},button('Copy result',function(){copyText(out.box.textContent,note);},'secondary-btn'),note))); showSvg(); }
  function renderProductivity(root,tool){ if(tool.type==='pomodoro-timer'){ root.innerHTML=''; var minutes=input('number','25'), out=box('Timer'), left=1500,timer=null; function paint(){out.box.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');} function reset(){clearInterval(timer);timer=null;left=parseInt(minutes.value,10)*60;paint();} function start(){if(timer)return;timer=setInterval(function(){left=Math.max(0,left-1);paint();if(left===0)clearInterval(timer);},1000);} minutes.addEventListener('input',reset); root.appendChild(el('div',{class:'tool-form'},field('Focus minutes',minutes),out.wrap,el('div',{class:'action-row'},button('Start',start),button('Reset',reset,'secondary-btn')))); reset(); return; } return renderTemplate(root,tool); }
  ready(function(){ var root=document.getElementById('tool-root'); if(!root) return; var id=root.getAttribute('data-tool-id'), tool=(window.TOOLVANTA_TOOLS||[]).find(function(t){return t.id===id;}); if(!tool) return; try{ var recent=JSON.parse(localStorage.getItem('toolvanta_recent')||'[]').filter(function(x){return x!==id;}); recent.unshift(id); localStorage.setItem('toolvanta_recent',JSON.stringify(recent.slice(0,12))); }catch(e){} if(root.querySelector('.tool-form') && root.textContent.indexOf('Tool not found')===-1) return; if(tool.category==='text') return renderText(root,tool); if(tool.category==='seo') return renderSeo(root,tool); if(tool.category==='developer') return renderDev(root,tool); if(tool.category==='calculator'||tool.category==='marketing') return tool.type==='template'?renderTemplate(root,tool):renderCalc(root,tool); if(tool.category==='social-media'||tool.category==='ai') return renderTemplate(root,tool); if(tool.category==='image') return renderImage(root,tool); if(tool.category==='productivity') return renderProductivity(root,tool); renderTemplate(root,tool); });
})();
