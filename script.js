let P0,P1,searchIndex=[],currentPage='';

function makeUrl(l){if(!l)return '#';l=l.trim();if(l.startsWith('http'))return l;return 'https://'+l;}
function esc(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function resLink(r){const url=makeUrl(r.link);const isReal=url.startsWith('http');return isReal?`<a href="${url}" target="_blank" rel="noopener noreferrer" class="resource-link">${r.name}</a>`:`<span class="resource-link" title="${r.link||r.covers||''}">${r.name}</span>`;}

async function loadData(){
  try{
    const [r0,r1]=await Promise.all([fetch('p0.json'),fetch('p1.json')]);
    P0=await r0.json();P1=await r1.json();
    buildLanding();buildPhase0();buildPath1();handleRoute();initParticles();loadProgress();
  }catch(e){document.body.innerHTML='<div style="padding:100px;text-align:center;color:#fff"><h1>Error</h1><p>'+e.message+'</p></div>';}
}

// === NAVIGATION ===
function navigate(hash){window.location.hash=hash;}
window.addEventListener('hashchange',handleRoute);

function handleRoute(){
  const h=window.location.hash.replace('#','');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  if(h==='phase0'){document.getElementById('page-phase0').classList.add('active');currentPage='phase0';updateNav('phase0');window.scrollTo(0,0);}
  else if(h==='path1'){document.getElementById('page-path1').classList.add('active');currentPage='path1';updateNav('path1');window.scrollTo(0,0);}
  else{document.getElementById('page-landing').classList.add('active');currentPage='';updateNav('');window.scrollTo(0,0);}
  // Show/hide progress FAB on landing
  document.getElementById('progress-fab').style.display=currentPage?'flex':'none';
  updateProgress();
}

function updateNav(page){
  const nl=document.getElementById('nav-links');
  let html='';
  if(page==='phase0'&&P0){
    html='<a href="javascript:void(0)" onclick="navigate(\'\'\);return false;">Home</a>';
    P0.weeks.forEach(w=>{html+=`<a href="javascript:void(0)" onclick="scrollToEl(\'p0w${w.week-1}\');return false;" class="nav-week-link">W${w.week}</a>`;});
    html+=`<button class="nav-search-btn" onclick="openSearch()">Search <kbd>⌘K</kbd></button>`;
  }else if(page==='path1'&&P1){
    html='<a href="javascript:void(0)" onclick="navigate(\'\'\);return false;">Home</a>';
    P1.months.forEach(m=>{html+=`<a href="javascript:void(0)" onclick="scrollToEl(\'p1m${m.month}\');return false;" class="nav-month-link">Month ${m.month}</a>`;});
    html+=`<button class="nav-search-btn" onclick="openSearch()">Search <kbd>⌘K</kbd></button>`;
  }else{
    html='<button class="nav-search-btn" onclick="openSearch()">Search <kbd>⌘K</kbd></button>';
  }
  nl.innerHTML=html;
}

// === LANDING ===
function buildLanding(){
  const h1=document.getElementById('hero-title');
  ['Jarvis','AI','Project'].forEach((w,i)=>{const s=document.createElement('span');s.className='word';s.textContent=w+' ';s.style.animationDelay=`${.2+i*.15}s`;h1.appendChild(s);});
  document.getElementById('hero-subtitle').textContent=`Built by ${P0.created_by} and team`;
  document.getElementById('landing-cards').innerHTML=`
    <div class="landing-card green" onclick="navigate('phase0')">
      <div class="landing-card-badge badge-green">Phase 0</div>
      <h3>${P0.document.replace('Phase 0 — ','')}</h3>
      <p>${P0.duration} · ${P0.weeks.length} Weeks · ${P0.goal}</p>
      <div class="arrow">→</div>
    </div>
    <div class="landing-card blue" onclick="navigate('path1')">
      <div class="landing-card-badge badge-blue">Path 1</div>
      <h3>${P1.document.replace('Path 1 — ','')}</h3>
      <p>${P1.duration} · ${P1.friday_features.length} Features · ${P1.end_goal}</p>
      <div class="arrow">→</div>
    </div>`;
}

// === PHASE 0 ===
function buildPhase0(){
  const c=document.getElementById('phase0-content');
  let h='<div class="back-btn" onclick="navigate(\'\'\)">← Back to Home</div>';
  h+=`<div class="section-header"><div class="section-badge badge-green">Phase 0</div><h2 class="section-title">${P0.document}</h2><p class="section-subtitle">${P0.goal}</p></div>`;
  // Setup
  h+=`<div class="glass-card green-glow" style="margin-bottom:48px"><h3 style="font-size:18px;font-weight:700;margin-bottom:12px">${P0.setup.title}</h3><ol style="padding-left:18px">${P0.setup.steps.map(s=>`<li style="margin-bottom:8px;font-size:13px;color:rgba(255,255,255,.55)">${s}</li>`).join('')}</ol></div>`;
  // C vs Python
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin-bottom:16px">${P0.c_vs_python.title}</h3>`;
  h+=`<div class="glass-card green-glow" style="overflow-x:auto;margin-bottom:48px"><table class="premium-table"><thead><tr><th>Concept</th><th>C</th><th>Python</th></tr></thead><tbody>${P0.c_vs_python.comparison.map(r=>`<tr><td style="font-weight:600;color:rgba(255,255,255,.8)">${r.concept}</td><td><code>${esc(r.c)}</code></td><td><code>${esc(r.python)}</code></td></tr>`).join('')}</tbody></table></div>`;
  // Weeks
  h+='<div class="weeks-grid">';
  P0.weeks.forEach((week,wi)=>{
    const id=`p0w${wi}`;
    searchIndex.push({type:'Phase 0',title:`Week ${week.week}: ${week.title}`,id,detail:week.goal||'',page:'phase0'});
    let days='';
    if(week.days){week.days.forEach(d=>{
      let inner='';
      if(d.concepts)inner+=d.concepts.map(c=>`<div style="font-size:13px;color:rgba(255,255,255,.45);padding:2px 0">• ${c}</div>`).join('');
      if(d.practice)inner+=`<div style="margin-top:6px;font-size:13px;color:rgba(34,197,94,.7)">Practice: ${d.practice}</div>`;
      if(d.project&&typeof d.project==='object'&&d.project.requirements)inner+=`<div style="margin-top:6px"><div style="font-size:13px;font-weight:600;color:rgba(34,197,94,.8);margin-bottom:3px">Project:</div>${d.project.requirements.map(r=>`<div style="font-size:13px;color:rgba(255,255,255,.45);padding:2px 0">✦ ${r}</div>`).join('')}</div>`;
      else if(d.project&&typeof d.project==='string')inner+=`<div style="margin-top:6px;font-size:13px;color:rgba(34,197,94,.7)">Project: ${d.project}</div>`;
      if(d.key_concepts)inner+=`<div style="font-size:13px;color:rgba(255,255,255,.45)">${d.key_concepts}</div>`;
      days+=`<div class="day-item"><div class="day-label">Day ${d.day}</div><div class="day-topic">${d.topic}</div>${inner}</div>`;
      searchIndex.push({type:'Phase 0',title:`W${week.week} D${d.day}: ${d.topic}`,id,detail:d.practice||d.key_concepts||'',page:'phase0'});
    });}
    if(week.readiness_test_requirements){days+=`<div style="margin-top:12px"><div style="font-size:13px;font-weight:700;margin-bottom:6px;color:rgba(34,197,94,.8)">Readiness Test</div>${week.readiness_test_requirements.map(r=>`<div style="font-size:13px;color:rgba(255,255,255,.45);padding:2px 0">✦ ${r}</div>`).join('')}</div>`;}
    // Week resource link
    let weekRes='';
    if(week.resource)weekRes=`<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.3)">📖 ${week.resource}</div>`;
    h+=`<div class="glass-card green-glow" id="${id}"><div class="week-card-header" onclick="toggleWeek('${id}')"><div><div class="week-num">Week ${week.week}</div><div class="week-title">${week.title}</div>${week.goal?`<div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:3px">${week.goal}</div>`:''}${weekRes}</div><div style="display:flex;align-items:center;gap:10px"><label class="week-check" onclick="event.stopPropagation()"><input type="checkbox" data-week="${id}" onchange="updateProgress()"></label><div class="week-toggle">+</div></div></div><div class="week-body" id="${id}-body">${days}</div></div>`;
  });
  h+='</div>';
  // Mistakes
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin:48px 0 16px">Common Mistakes</h3>`;
  h+=`<div class="glass-card green-glow" style="overflow-x:auto;margin-bottom:48px"><table class="premium-table"><thead><tr><th>Mistake</th><th>Wrong</th><th>Correct</th></tr></thead><tbody>${P0.common_mistakes.map(m=>`<tr><td style="color:rgba(255,255,255,.7)">${m.mistake}</td><td><code style="color:rgba(239,68,68,.7)">${esc(m.wrong)}</code></td><td><code style="color:rgba(34,197,94,.7)">${esc(m.correct)}</code></td></tr>`).join('')}</tbody></table></div>`;
  // Resources (clickable links)
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin:48px 0 16px">Resources</h3><div class="resource-chips">${P0.resources.map(r=>resLink(r)).join('')}</div>`;
  // Study structure
  if(P0.daily_study_structure){h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin:48px 0 16px">Daily Study Structure (${P0.daily_study_structure.total_minutes} min)</h3><div class="glass-card green-glow">${P0.daily_study_structure.blocks.map(b=>`<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="font-weight:700;color:rgba(34,197,94,.7)">${b.duration}</span> — <span style="color:rgba(255,255,255,.55)">${b.activity}</span></div>`).join('')}</div>`;}
  c.innerHTML=h;
  document.getElementById('footer-p0').textContent=`${P0.project} · ${P0.created_by}, ${P0.role}`;
}

// === PATH 1 ===
function buildPath1(){
  const c=document.getElementById('path1-content');
  let h='<div class="back-btn" onclick="navigate(\'\'\)">← Back to Home</div>';
  h+=`<div class="section-header"><div class="section-badge badge-blue">Path 1</div><h2 class="section-title">${P1.document}</h2><p class="section-subtitle">${P1.end_goal}</p></div>`;
  // Features
  const fi=['💬','🧠','🗂️','🎤','🔊','🔍','📄','🎭','🌐','🚀'];
  h+='<div class="features-grid">';
  P1.friday_features.forEach((f,i)=>{h+=`<div class="glass-card blue-glow feature-card"><div class="feature-icon">${fi[i]||'✦'}</div><div class="feature-title">${f.feature}</div><div class="feature-desc">${f.description}</div><span class="feature-month-badge">${f.built_in}</span></div>`;searchIndex.push({type:'Feature',title:f.feature,id:'p1-features',detail:f.description,page:'path1'});});
  h+='</div>';
  // Tech Stack
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin-bottom:16px">Tech Stack</h3><div class="chip-row">${P1.tech_stack.map(t=>`<div class="chip" title="${t.purpose} — ${t.used_by}">${t.technology}</div>`).join('')}</div>`;
  // Team
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin-bottom:16px">Team <button onclick="openEditTeam()" style="font-size:12px;font-weight:500;color:rgba(99,102,241,.7);margin-left:8px;cursor:pointer;background:none;border:none">✏️ Edit Names</button></h3><div class="team-grid" id="team-grid-container">`;
  const savedNames=JSON.parse(localStorage.getItem('jarvis_team_names')||'{}');
  P1.team_roles.forEach((t,i)=>{const name=savedNames[i]||t.member;const ini=name.replace(/Member \d+ — ?/,'').slice(0,2).toUpperCase()||name.charAt(name.length-1);h+=`<div class="glass-card blue-glow team-card"><div class="team-avatar">${ini}</div><div class="team-name" data-member-idx="${i}">${name}</div><div class="team-role">${t.role}</div><div class="team-resp">${t.responsibility}</div></div>`;});
  h+='</div>';
  // Months
  P1.months.forEach(month=>{
    h+=`<div class="month-section" id="p1m${month.month}"><div class="month-dot"></div><h3 class="month-title">Month ${month.month}: ${month.title}</h3><p class="month-goal">${month.goal}</p>`;
    month.weeks.forEach((week,wi)=>{
      const id=`p1m${month.month}w${wi}`;
      searchIndex.push({type:'Path 1',title:`Week ${week.week}: ${week.title}`,id,detail:'',page:'path1'});
      let tasks='';
      if(week.tasks){tasks=week.tasks.map(t=>{searchIndex.push({type:'Path 1 Task',title:t.task,id,detail:t.detail,page:'path1'});return `<div class="day-item"><div class="day-topic">${t.task}</div><div class="day-detail">${t.detail}</div></div>`;}).join('');}
      let cp='';
      if(week.checkpoint){cp=`<div class="checkpoint-list"><div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(59,130,246,.6);margin-bottom:10px">Checkpoint</div>${week.checkpoint.map(c=>`<div class="checkpoint-item"><div class="checkpoint-dot"></div>${c}</div>`).join('')}</div>`;}
      h+=`<div class="glass-card blue-glow" id="${id}" style="margin-bottom:16px"><div class="week-card-header" onclick="toggleWeek('${id}')"><div><div class="week-num">Week ${week.week}</div><div class="week-title">${week.title}</div></div><div style="display:flex;align-items:center;gap:10px"><label class="week-check" onclick="event.stopPropagation()"><input type="checkbox" data-week="${id}" onchange="updateProgress()"></label><div class="week-toggle">+</div></div></div><div class="week-body" id="${id}-body">${tasks}${cp}</div></div>`;
    });
    h+='</div>';
  });
  // Resources (clickable)
  h+=`<h3 style="font-size:22px;font-weight:700;letter-spacing:-.5px;margin:48px 0 16px">Resources</h3>`;
  for(const cat in P1.resources){
    h+=`<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:8px">${cat.replace(/_/g,' ')}</div><div class="resource-chips">${P1.resources[cat].map(r=>resLink(r)).join('')}</div></div>`;
  }
  c.innerHTML=h;
  document.getElementById('footer-p1').textContent=`${P1.project} · ${P1.created_by}, ${P1.role}`;
}

// === SCROLL TO ELEMENT (for nav links) ===
function scrollToEl(id){const el=document.getElementById(id);if(el){const y=el.getBoundingClientRect().top+window.pageYOffset-80;window.scrollTo({top:y,behavior:'smooth'});}}

// === EDIT TEAM NAMES ===
function openEditTeam(){
  let modal=document.getElementById('edit-team-modal');
  if(!modal){modal=document.createElement('div');modal.id='edit-team-modal';modal.className='edit-modal-bg';document.body.appendChild(modal);}
  const savedNames=JSON.parse(localStorage.getItem('jarvis_team_names')||'{}');
  let fields='';
  P1.team_roles.forEach((t,i)=>{fields+=`<label>${t.role}</label><input id="team-name-${i}" value="${(savedNames[i]||t.member).replace(/"/g,'&quot;')}" placeholder="${t.member}">`;});
  modal.innerHTML=`<div class="edit-modal"><h3>✏️ Edit Team Names</h3><p style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:8px">Changes are saved locally and will persist across visits.</p>${fields}<div class="edit-modal-actions"><button class="edit-btn secondary" onclick="closeEditTeam()">Cancel</button><button class="edit-btn primary" onclick="saveTeamNames()">Save</button></div></div>`;
  modal.classList.add('open');
}
function closeEditTeam(){const m=document.getElementById('edit-team-modal');if(m)m.classList.remove('open');}
function saveTeamNames(){
  const names={};
  P1.team_roles.forEach((t,i)=>{const v=document.getElementById('team-name-'+i).value.trim();if(v)names[i]=v;});
  localStorage.setItem('jarvis_team_names',JSON.stringify(names));
  closeEditTeam();
  // Rebuild Path 1 to reflect changes
  searchIndex=searchIndex.filter(s=>s.page!=='path1');
  buildPath1();
  loadProgress();
}

// === SHARED ===
function toggleWeek(id){const b=document.getElementById(id+'-body');const t=document.getElementById(id).querySelector('.week-toggle');if(b.classList.contains('open')){b.style.maxHeight='0';b.classList.remove('open');t.textContent='+';}else{b.classList.add('open');b.style.maxHeight=b.scrollHeight+200+'px';t.textContent='−';}}

function updateProgress(){
  const cbs=document.querySelectorAll('[data-week]');
  const state={};
  cbs.forEach(cb=>{state[cb.dataset.week]=cb.checked;const card=document.getElementById(cb.dataset.week);if(card)card.classList.toggle('completed',cb.checked);});
  localStorage.setItem('jarvis_progress',JSON.stringify(state));
  // Per-page progress
  const prefix=currentPage==='phase0'?'p0w':currentPage==='path1'?'p1m':'';
  let total=0,done=0;
  cbs.forEach(cb=>{if(!prefix||cb.dataset.week.startsWith(prefix)){total++;if(cb.checked)done++;}});
  if(total>0){document.getElementById('progress-circle').style.strokeDashoffset=87.96*(1-done/total);}
  document.getElementById('progress-text').textContent=`${done} / ${total} weeks`;
}

function loadProgress(){try{const st=JSON.parse(localStorage.getItem('jarvis_progress')||'{}');Object.entries(st).forEach(([id,checked])=>{const cb=document.querySelector(\`[data-week="${id}"]\`);if(cb)cb.checked=checked;});}catch(e){}updateProgress();}

// === PARTICLES ===
function initParticles(){const cv=document.getElementById('particles-canvas');if(!cv)return;const ctx=cv.getContext('2d');let w,h,pts=[];function resize(){w=cv.width=window.innerWidth;h=cv.height=window.innerHeight;}resize();window.addEventListener('resize',resize);for(let i=0;i<35;i++)pts.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.5,dx:(Math.random()-.5)*.3,dy:(Math.random()-.5)*.3,o:Math.random()*.3+.1});function draw(){ctx.clearRect(0,0,w,h);pts.forEach(p=>{p.x+=p.dx;p.y+=p.dy;if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=\`rgba(255,255,255,${p.o})\`;ctx.fill();});requestAnimationFrame(draw);}draw();}

// === CURSOR GLOW ===
document.addEventListener('mousemove',e=>{const g=document.getElementById('cursor-glow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';});

// === SEARCH ===
function openSearch(){document.getElementById('search-overlay').classList.add('open');document.getElementById('search-input').focus();}
function closeSearch(){document.getElementById('search-overlay').classList.remove('open');document.getElementById('search-input').value='';document.getElementById('search-results').innerHTML='';}
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openSearch();}if(e.key==='Escape')closeSearch();});
document.getElementById('search-overlay').addEventListener('click',e=>{if(e.target.id==='search-overlay')closeSearch();});
document.getElementById('search-input').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();const res=document.getElementById('search-results');
  if(!q){res.innerHTML='';return;}
  const matches=searchIndex.filter(s=>s.title.toLowerCase().includes(q)||s.detail.toLowerCase().includes(q)).slice(0,12);
  res.innerHTML=matches.map(m=>`<div class="search-result-item" onclick="goTo(\'${m.page||''}\',\'${m.id}\')"><div class="search-result-type">${m.type}</div><div class="search-result-title">${hl(m.title,q)}</div>${m.detail?`<div class="search-result-detail">${hl(m.detail,q)}</div>`:''}</div>`).join('')||'<div style="padding:20px;font-size:14px;color:rgba(255,255,255,.3);text-align:center">No results</div>';
});
function hl(t,q){if(!q)return t;return t.replace(new RegExp(\`(${q.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')})\`,'gi'),'<mark>$1</mark>');}
function goTo(page,id){closeSearch();if(page)navigate(page);setTimeout(()=>{const el=document.getElementById(id);if(el){const y=el.getBoundingClientRect().top+window.pageYOffset-80;window.scrollTo({top:y,behavior:'smooth'});toggleWeek(id);}},200);}

loadData();
