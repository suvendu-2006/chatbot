let P0, P1, searchIndex = [], currentPage = '';

function makeUrl(l) {
  if (!l) return '#';
  l = l.trim();
  if (l.startsWith('http')) return l;
  return 'https://' + l;
}

const el = (tag, attrs={}, children=[]) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.substring(2).toLowerCase(), v);
    else if (k === 'className') e.className = v;
    else if (k === 'textContent') e.textContent = v;
    else if (k === 'innerHTML') e.innerHTML = v;
    else if (k === 'style') Object.assign(e.style, v);
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => e.dataset[dk] = dv);
    else if (v !== false && v !== null && v !== undefined) e.setAttribute(k, v === true ? '' : String(v));
  });
  children.flat().forEach(c => {
    if (c instanceof Node) e.appendChild(c);
    else if (c !== null && c !== undefined) e.appendChild(document.createTextNode(String(c)));
  });
  return e;
};

function resLink(r) {
  if (r.link) {
    return el('a', { href: makeUrl(r.link), target: '_blank', rel: 'noopener noreferrer', className: 'resource-link', textContent: r.name });
  } else if (r.search_hint || r.notes) {
    return el('span', { className: 'resource-link', title: r.covers || '', tabIndex: "0" }, [
      r.name, el('span', { style: { opacity: '0.6', fontSize: '11px', marginLeft: '4px' }, textContent: `(${r.search_hint || r.notes})` })
    ]);
  }
  return el('span', { className: 'resource-link', title: r.covers || '', tabIndex: "0", textContent: r.name });
}

async function loadData() {
  try {
    const [r0, r1] = await Promise.all([fetch('p0.json'), fetch('p1.json')]);
    if (!r0.ok) throw new Error(`p0.json failed: ${r0.statusText}`);
    if (!r1.ok) throw new Error(`p1.json failed: ${r1.statusText}`);
    P0 = await r0.json(); P1 = await r1.json();
    buildLanding(); buildPhase0(); buildPath1(); handleRoute(); initParticles(); loadProgress();
  } catch (e) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const hero = document.getElementById('page-landing');
    hero.classList.add('active');
    document.getElementById('hero-title').textContent = "Connection Error";
    document.getElementById('hero-subtitle').textContent = "Failed to load roadmap data. Please try again.";
    const cards = document.getElementById('landing-cards');
    cards.innerHTML = '';
    cards.appendChild(el('div', { className: 'glass-card' }, [
      el('p', { textContent: e.message, style: { color: '#ef4444' } })
    ]));
  }
}

function navigate(hash) { window.location.hash = hash; }
window.addEventListener('hashchange', handleRoute);

function handleRoute() {
  const h = window.location.hash.replace('#', '');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  ['phase0', 'path1'].includes(h) ? document.getElementById(`page-${h}`).classList.add('active') : document.getElementById('page-landing').classList.add('active');
  currentPage = ['phase0', 'path1'].includes(h) ? h : '';
  updateNav(currentPage);
  window.scrollTo(0, 0);
  const fab = document.getElementById('progress-fab');
  if(fab) fab.style.display = currentPage ? 'flex' : 'none';
  updateProgress();
}

function updateNav(page) {
  const nl = document.getElementById('nav-links');
  nl.innerHTML = '';
  if (page === 'phase0' && P0) {
    nl.appendChild(el('a', { href: '#', textContent: 'Home' }));
    P0.weeks.forEach(w => nl.appendChild(el('button', { className: 'nav-week-link', textContent: `W${w.week}`, onClick: () => scrollToEl(`p0w${w.week-1}`) })));
  } else if (page === 'path1' && P1) {
    nl.appendChild(el('a', { href: '#', textContent: 'Home' }));
    P1.months.forEach(m => nl.appendChild(el('button', { className: 'nav-month-link', textContent: `Month ${m.month}`, onClick: () => scrollToEl(`p1m${m.month}`) })));
  }
  nl.appendChild(el('button', { className: 'nav-search-btn', onClick: openSearch, 'aria-label': 'Search' }, ['Search ', el('kbd', { textContent: '⌘K' })]));
}

function buildLanding() {
  if(!P0 || !P1) return;
  const h1 = document.getElementById('hero-title');
  h1.innerHTML = '';
  ['Jarvis', 'AI', 'Project'].forEach((w, i) => h1.appendChild(el('span', { className: 'word', textContent: w + ' ', style: { animationDelay: `${0.2 + i*0.15}s` } })));
  document.getElementById('hero-subtitle').textContent = `Built by ${P0.created_by} and team`;
  
  const cards = document.getElementById('landing-cards');
  cards.innerHTML = '';
  cards.appendChild(el('a', { href: '#phase0', className: 'landing-card green', role: 'button' }, [
    el('div', { className: 'landing-card-badge badge-green', textContent: 'Phase 0' }),
    el('h3', { textContent: P0.document.replace('Phase 0 — ', '') }),
    el('p', { textContent: `${P0.duration} · ${P0.weeks.length} Weeks · ${P0.goal}` }),
    el('div', { className: 'arrow', 'aria-hidden': 'true', textContent: '→' })
  ]));
  cards.appendChild(el('a', { href: '#path1', className: 'landing-card blue', role: 'button' }, [
    el('div', { className: 'landing-card-badge badge-blue', textContent: 'Path 1' }),
    el('h3', { textContent: P1.document.replace('Path 1 — ', '') }),
    el('p', { textContent: `${P1.duration} · ${P1.friday_features.length} Features · ${P1.end_goal}` }),
    el('div', { className: 'arrow', 'aria-hidden': 'true', textContent: '→' })
  ]));
}

function buildPhase0() {
  const c = document.getElementById('phase0-content');
  c.innerHTML = '';
  c.appendChild(el('a', { className: 'back-btn', href: '#', textContent: '← Back to Home' }));
  c.appendChild(el('div', { className: 'section-header' }, [
    el('div', { className: 'section-badge badge-green', textContent: 'Phase 0' }),
    el('h2', { className: 'section-title', textContent: P0.document }),
    el('p', { className: 'section-subtitle', textContent: P0.goal })
  ]));
  c.appendChild(el('div', { className: 'glass-card green-glow', style: { marginBottom: '48px' } }, [
    el('h3', { style: { fontSize: '18px', fontWeight: '700', marginBottom: '12px' }, textContent: P0.setup.title }),
    el('ol', { style: { paddingLeft: '18px' } }, P0.setup.steps.map(s => el('li', { style: { marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,.55)' }, textContent: s })))
  ]));
  
  c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', marginBottom: '16px' }, textContent: P0.c_vs_python.title }));
  const tbody = el('tbody');
  P0.c_vs_python.comparison.forEach(r => {
    tbody.appendChild(el('tr', {}, [
      el('td', { style: { fontWeight: '600', color: 'rgba(255,255,255,.8)' }, textContent: r.concept }),
      el('td', {}, [el('code', { textContent: r.c })]),
      el('td', {}, [el('code', { textContent: r.python })])
    ]));
  });
  const thead = el('thead', {}, [el('tr', {}, [el('th', {textContent:'Concept'}), el('th', {textContent:'C'}), el('th', {textContent:'Python'})])]);
  c.appendChild(el('div', { className: 'glass-card green-glow', style: { overflowX: 'auto', marginBottom: '48px' } }, [
    el('table', { className: 'premium-table' }, [thead, tbody])
  ]));

  const weeksGrid = el('div', { className: 'weeks-grid' });
  P0.weeks.forEach((week, wi) => {
    const id = `p0w${wi}`;
    searchIndex.push({ type: 'Phase 0', title: `W${week.week}: ${week.title}`, id, detail: week.goal || '', page: 'phase0' });
    
    const wBody = el('div', { className: 'week-body', id: `${id}-body` });
    if(week.days) week.days.forEach(d => {
      searchIndex.push({ type: 'Phase 0', title: `W${week.week} D${d.day}: ${d.topic}`, id, detail: d.practice || d.key_concepts || '', page: 'phase0' });
      const dayInner = [];
      if(d.concepts) d.concepts.forEach(con => dayInner.push(el('div', { style: { fontSize: '13px', color: 'rgba(255,255,255,.7)', padding: '2px 0' }, textContent: `• ${con}` })));
      if(d.practice) dayInner.push(el('div', { style: { marginTop: '6px', fontSize: '13px', color: 'rgba(34,197,94,.7)' }, textContent: `Practice: ${d.practice}` }));
      if(d.project && d.project.requirements) {
        dayInner.push(el('div', { style: { marginTop: '6px' } }, [
          el('div', { style: { fontSize: '13px', fontWeight: '600', color: 'rgba(34,197,94,.8)', marginBottom: '3px' }, textContent: 'Project:' }),
          ...d.project.requirements.map(req => el('div', { style: { fontSize: '13px', color: 'rgba(255,255,255,.7)', padding: '2px 0' }, textContent: `✦ ${req}` }))
        ]));
      } else if(d.project) {
        dayInner.push(el('div', { style: { marginTop: '6px', fontSize: '13px', color: 'rgba(34,197,94,.7)' }, textContent: `Project: ${d.project}` }));
      }
      if(d.key_concepts) dayInner.push(el('div', { style: { fontSize: '13px', color: 'rgba(255,255,255,.7)' }, textContent: d.key_concepts }));
      
      wBody.appendChild(el('div', { className: 'day-item' }, [
        el('div', { className: 'day-label', textContent: `Day ${d.day}` }),
        el('div', { className: 'day-topic', textContent: d.topic }),
        ...dayInner
      ]));
    });
    if(week.readiness_test_requirements) {
      wBody.appendChild(el('div', { style: { marginTop: '12px' } }, [
        el('div', { style: { fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'rgba(34,197,94,.8)' }, textContent: 'Readiness Test' }),
        ...week.readiness_test_requirements.map(req => el('div', { style: { fontSize: '13px', color: 'rgba(255,255,255,.7)', padding: '2px 0' }, textContent: `✦ ${req}` }))
      ]));
    }
    
    const weekHeadStr = el('div', {}, [
      el('div', { className: 'week-num', textContent: `Week ${week.week}` }),
      el('div', { className: 'week-title', textContent: week.title }),
      ...(week.goal ? [el('div', { style: { fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '3px' }, textContent: week.goal })] : []),
      ...(week.resource ? [el('div', { style: { marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,.5)' }, textContent: `📖 ${week.resource}` })] : [])
    ]);

    const checkbox = el('input', { type: 'checkbox', dataset: { week: id }, onChange: updateProgress });
    const toggleBtn = el('button', { className: 'week-toggle', textContent: '+', 'aria-expanded': 'false', 'aria-controls': `${id}-body` });
    
    weeksGrid.appendChild(el('div', { className: 'glass-card green-glow', id }, [
      el('div', { 
        className: 'week-card-header', 
        role: 'button',
        tabIndex: '0',
        onKeyDown: e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleWeek(id); } },
        onClick: () => toggleWeek(id) 
      }, [
        weekHeadStr,
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
          el('label', { className: 'week-check', onClick: e => e.stopPropagation() }, [checkbox]),
          toggleBtn
        ])
      ]),
      wBody
    ]));
  });
  c.appendChild(weeksGrid);

  c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', margin: '48px 0 16px' }, textContent: 'Common Mistakes' }));
  const mBody = el('tbody');
  P0.common_mistakes.forEach(m => {
    mBody.appendChild(el('tr', {}, [
      el('td', { style: { color: 'rgba(255,255,255,.7)' }, textContent: m.mistake }),
      el('td', {}, [el('code', { style: { color: 'rgba(239,68,68,.7)' }, textContent: m.wrong })]),
      el('td', {}, [el('code', { style: { color: 'rgba(34,197,94,.7)' }, textContent: m.correct })])
    ]));
  });
  c.appendChild(el('div', { className: 'glass-card green-glow', style: { overflowX: 'auto', marginBottom: '48px' } }, [
    el('table', { className: 'premium-table' }, [
      el('thead', {}, [el('tr', {}, [el('th', {textContent:'Mistake'}), el('th', {textContent:'Wrong'}), el('th', {textContent:'Correct'})])]),
      mBody
    ])
  ]));

  c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', margin: '48px 0 16px' }, textContent: 'Resources' }));
  c.appendChild(el('div', { className: 'resource-chips' }, P0.resources.map(resLink)));

  if (P0.daily_study_structure) {
    c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', margin: '48px 0 16px' }, textContent: `Daily Study Structure (${P0.daily_study_structure.total_minutes} min)` }));
    c.appendChild(el('div', { className: 'glass-card green-glow' }, P0.daily_study_structure.blocks.map(b => 
      el('div', { style: { padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)' } }, [
        el('span', { style: { fontWeight: '700', color: 'rgba(34,197,94,.7)' }, textContent: `${b.duration} ` }),
        el('span', { style: { color: 'rgba(255,255,255,.7)' }, textContent: ` — ${b.activity}` })
      ])
    )));
  }
  document.getElementById('footer-p0').textContent = `${P0.project} · ${P0.created_by}, ${P0.role}`;
}

function buildPath1() {
  const c = document.getElementById('path1-content');
  c.innerHTML = '';
  c.appendChild(el('a', { className: 'back-btn', href: '#', textContent: '← Back to Home' }));
  c.appendChild(el('div', { className: 'section-header' }, [
    el('div', { className: 'section-badge badge-blue', textContent: 'Path 1' }),
    el('h2', { className: 'section-title', textContent: P1.document }),
    el('p', { className: 'section-subtitle', textContent: P1.end_goal })
  ]));

  const fi = ['💬','🧠','🗂️','🎤','🔊','🔍','📄','🎭','🌐','🚀'];
  const featGrid = el('div', { className: 'features-grid' });
  P1.friday_features.forEach((f, i) => {
    featGrid.appendChild(el('div', { className: 'glass-card blue-glow feature-card' }, [
      el('div', { className: 'feature-icon', textContent: fi[i] || '✦' }),
      el('div', { className: 'feature-title', textContent: f.feature }),
      el('div', { className: 'feature-desc', textContent: f.description }),
      el('span', { className: 'feature-month-badge', textContent: f.built_in })
    ]));
    searchIndex.push({ type: 'Feature', title: f.feature, id: 'p1-features', detail: f.description, page: 'path1' });
  });
  c.appendChild(featGrid);

  c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', marginBottom: '16px' }, textContent: 'Tech Stack' }));
  c.appendChild(el('div', { className: 'chip-row' }, P1.tech_stack.map(t => 
    el('div', { className: 'chip', title: `${t.purpose} — ${t.used_by}`, textContent: t.technology })
  )));

  const teamTitle = el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', marginBottom: '16px' }, textContent: 'Team ' });
  teamTitle.appendChild(el('button', { style: { fontSize: '12px', fontWeight: '500', color: 'rgba(99,102,241,.7)', marginLeft: '8px' }, onClick: openEditTeam, textContent: '✏️ Edit Names' }));
  c.appendChild(teamTitle);

  const savedNames = JSON.parse(localStorage.getItem('jarvis_team_names') || '{}');
  const teamGrid = el('div', { className: 'team-grid', id: 'team-grid-container' });
  P1.team_roles.forEach((t, i) => {
    const name = savedNames[i] || t.member;
    const ini = name.replace(/Member \d+ — ?/, '').slice(0, 2).toUpperCase() || name.charAt(name.length - 1);
    teamGrid.appendChild(el('div', { className: 'glass-card blue-glow team-card' }, [
      el('div', { className: 'team-avatar', textContent: ini }),
      el('div', { className: 'team-name', dataset: { memberIdx: String(i) }, textContent: name }),
      el('div', { className: 'team-role', textContent: t.role }),
      el('div', { className: 'team-resp', textContent: t.responsibility })
    ]));
  });
  c.appendChild(teamGrid);

  P1.months.forEach(month => {
    const mSec = el('div', { className: 'month-section', id: `p1m${month.month}` }, [
      el('div', { className: 'month-dot' }),
      el('h3', { className: 'month-title', textContent: `Month ${month.month}: ${month.title}` }),
      el('p', { className: 'month-goal', textContent: month.goal })
    ]);
    
    month.weeks.forEach((week, wi) => {
      const id = `p1m${month.month}w${wi}`;
      searchIndex.push({ type: 'Path 1', title: `W${week.week}: ${week.title}`, id, detail: '', page: 'path1' });
      
      const wBody = el('div', { className: 'week-body', id: `${id}-body` });
      if(week.tasks) week.tasks.forEach(t => {
        searchIndex.push({ type: 'Path 1 Task', title: t.task, id, detail: t.detail, page: 'path1' });
        wBody.appendChild(el('div', { className: 'day-item' }, [
          el('div', { className: 'day-topic', textContent: t.task }),
          el('div', { className: 'day-detail', textContent: t.detail })
        ]));
      });
      if(week.checkpoint) {
        wBody.appendChild(el('div', { className: 'checkpoint-list' }, [
          el('div', { style: { fontSize: '12px', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase', color: 'rgba(59,130,246,.6)', marginBottom: '10px' }, textContent: 'Checkpoint' }),
          ...week.checkpoint.map(cp => el('div', { className: 'checkpoint-item' }, [
            el('div', { className: 'checkpoint-dot' }), el('span', { textContent: cp })
          ]))
        ]));
      }

      const checkbox = el('input', { type: 'checkbox', dataset: { week: id }, onChange: updateProgress });
      const toggleBtn = el('button', { className: 'week-toggle', textContent: '+', 'aria-expanded': 'false', 'aria-controls': `${id}-body` });

      mSec.appendChild(el('div', { className: 'glass-card blue-glow', style: { marginBottom: '16px' }, id }, [
        el('div', { className: 'week-card-header', role: 'button', tabIndex: '0', 
            onKeyDown: e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleWeek(id); } },
            onClick: () => toggleWeek(id) 
        }, [
          el('div', {}, [
            el('div', { className: 'week-num', textContent: `Week ${week.week}` }),
            el('div', { className: 'week-title', textContent: week.title })
          ]),
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
            el('label', { className: 'week-check', onClick: e => e.stopPropagation() }, [checkbox]),
            toggleBtn
          ])
        ]),
        wBody
      ]));
    });
    c.appendChild(mSec);
  });

  c.appendChild(el('h3', { style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.5px', margin: '48px 0 16px' }, textContent: 'Resources' }));
  for(const cat in P1.resources) {
    c.appendChild(el('div', { style: { marginBottom: '16px' } }, [
      el('div', { style: { fontSize: '12px', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }, textContent: cat.replace(/_/g, ' ') }),
      el('div', { className: 'resource-chips' }, P1.resources[cat].map(resLink))
    ]));
  }
  document.getElementById('footer-p1').textContent = `${P1.project} · ${P1.created_by}, ${P1.role}`;
}

// === SHARED + UTILS ===
function scrollToEl(id) {
  const elDOM = document.getElementById(id);
  if(elDOM) {
    const y = elDOM.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    elDOM.focus();
  }
}

function openEditTeam() {
  let modal = document.getElementById('edit-team-modal');
  if(!modal) {
    modal = el('div', { id: 'edit-team-modal', className: 'edit-modal-bg', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Edit Team' });
    document.body.appendChild(modal);
  }
  const savedNames = JSON.parse(localStorage.getItem('jarvis_team_names') || '{}');
  
  const fields = P1.team_roles.map((t, i) => el('div', {}, [
    el('label', { textContent: t.role, htmlFor: `team-name-${i}` }),
    el('input', { id: `team-name-${i}`, value: savedNames[i] || t.member, placeholder: t.member })
  ]));

  modal.innerHTML = '';
  modal.appendChild(el('div', { className: 'edit-modal' }, [
    el('h3', { textContent: '✏️ Edit Team Names' }),
    el('p', { style: { fontSize: '13px', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }, textContent: 'Changes are saved locally and will persist across visits.' }),
    ...fields,
    el('div', { className: 'edit-modal-actions' }, [
      el('button', { className: 'edit-btn secondary', onClick: closeEditTeam, textContent: 'Cancel' }),
      el('button', { className: 'edit-btn primary', onClick: saveTeamNames, textContent: 'Save' })
    ])
  ]));
  modal.classList.add('open');
  modal.removeAttribute('hidden');
  const firstInput = document.getElementById('team-name-0');
  if(firstInput) firstInput.focus();
}

function closeEditTeam() {
  const m = document.getElementById('edit-team-modal');
  if(m) {
    m.classList.remove('open');
    m.setAttribute('hidden', 'true');
  }
}

function saveTeamNames() {
  const names = {};
  P1.team_roles.forEach((t, i) => {
    const v = document.getElementById('team-name-'+i).value.trim();
    if(v) names[i] = v;
  });
  localStorage.setItem('jarvis_team_names', JSON.stringify(names));
  closeEditTeam();
  searchIndex = searchIndex.filter(s => s.page !== 'path1');
  buildPath1();
  loadProgress();
}

function toggleWeek(id) {
  const b = document.getElementById(id+'-body');
  const t = document.getElementById(id).querySelector('.week-toggle');
  if(b.classList.contains('open')) {
    b.style.maxHeight = '0';
    b.classList.remove('open');
    t.textContent = '+';
    t.setAttribute('aria-expanded', 'false');
  } else {
    b.classList.add('open');
    b.style.maxHeight = b.scrollHeight + 200 + 'px';
    t.textContent = '−';
    t.setAttribute('aria-expanded', 'true');
  }
}

function updateProgress() {
  const cbs = document.querySelectorAll('[data-week]');
  const state = {};
  cbs.forEach(cb => {
    state[cb.dataset.week] = cb.checked;
    const card = document.getElementById(cb.dataset.week);
    if(card) card.classList.toggle('completed', cb.checked);
  });
  localStorage.setItem('jarvis_progress', JSON.stringify(state));
  
  const prefix = currentPage === 'phase0' ? 'p0w' : currentPage === 'path1' ? 'p1m' : '';
  let total = 0, done = 0;
  cbs.forEach(cb => {
    if(!prefix || cb.dataset.week.startsWith(prefix)) {
      total++;
      if(cb.checked) done++;
    }
  });
  if(total > 0) {
    document.getElementById('progress-circle').style.strokeDashoffset = 87.96 * (1 - done/total);
  }
  document.getElementById('progress-text').textContent = `${done} / ${total} weeks`;
}

function loadProgress() {
  try {
    const st = JSON.parse(localStorage.getItem('jarvis_progress') || '{}');
    Object.entries(st).forEach(([id, checked]) => {
      const cb = document.querySelector(`[data-week="${id}"]`);
      if(cb) cb.checked = checked;
    });
  } catch(e) {}
  updateProgress();
}

// === PARTICLES ===
function initParticles() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
  const cv = document.getElementById('particles-canvas');
  if(!cv) return;
  const ctx = cv.getContext('2d');
  let w, h, pts = [];
  function resize() { w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for(let i=0; i<35; i++) pts.push({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.5+.5, dx: (Math.random()-.5)*.3, dy: (Math.random()-.5)*.3, o: Math.random()*.3+.1 });
  let req;
  function draw() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) {
      ctx.clearRect(0,0,w,h);
      return;
    }
    ctx.clearRect(0,0,w,h);
    pts.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if(p.x<0) p.x=w; if(p.x>w) p.x=0; if(p.y<0) p.y=h; if(p.y>h) p.y=0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill();
    });
    req = requestAnimationFrame(draw);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(req);
    else draw();
  });
  draw();
}

// === CURSOR GLOW ===
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  if(cursorGlow && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cursorGlow.style.setProperty('--x', e.clientX + 'px');
    cursorGlow.style.setProperty('--y', e.clientY + 'px');
  }
});

// === SEARCH ===
let lastFocus = null;
function openSearch() {
  lastFocus = document.activeElement;
  const overlay = document.getElementById('search-overlay');
  overlay.classList.add('open');
  overlay.removeAttribute('hidden');
  document.getElementById('search-input').focus();
  document.getElementById('search-input').setAttribute('aria-expanded', 'true');
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('hidden', 'true');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-input').setAttribute('aria-expanded', 'false');
  if (lastFocus) lastFocus.focus();
}

document.addEventListener('keydown', e => {
  if((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if(e.key === 'Escape') closeSearch();
});
document.getElementById('search-overlay').addEventListener('click', e => {
  if(e.target.id === 'search-overlay') closeSearch();
});

document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const res = document.getElementById('search-results');
  res.innerHTML = '';
  if(!q) return;
  const matches = searchIndex.filter(s => s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)).slice(0, 12);
  if(matches.length === 0) {
    res.appendChild(el('div', { style: { padding: '20px', fontSize: '14px', color: 'rgba(255,255,255,.5)', textAlign: 'center' }, textContent: 'No results' }));
    return;
  }
  matches.forEach(m => {
    const btn = el('button', { 
      className: 'search-result-item', 
      onClick: () => goTo(m.page || '', m.id),
      role: 'option',
      style: { display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', color: 'inherit' }
    }, [
      el('div', { className: 'search-result-type', textContent: m.type })
    ]);
    
    const hTitle = el('div', { className: 'search-result-title' });
    appendHighlighted(hTitle, m.title, q);
    btn.appendChild(hTitle);

    if (m.detail) {
      const hDetail = el('div', { className: 'search-result-detail' });
      appendHighlighted(hDetail, m.detail, q);
      btn.appendChild(hDetail);
    }
    
    res.appendChild(btn);
  });
});

function appendHighlighted(parent, text, query) {
  if(!query) { parent.textContent = text; return; }
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  parts.forEach(p => {
    if (p.toLowerCase() === query) parent.appendChild(el('mark', { textContent: p }));
    else if (p) parent.appendChild(document.createTextNode(p));
  });
}

function goTo(page, id) {
  closeSearch();
  if(page) navigate(page);
  setTimeout(() => {
    scrollToEl(id);
    const b = document.getElementById(id+'-body');
    if (b && !b.classList.contains('open')) toggleWeek(id);
  }, 200);
}

loadData();
