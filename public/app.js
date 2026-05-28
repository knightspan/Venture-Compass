document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initParticles();
  initTypewriter();
  initScrollReveal();
  initPlanner();
  initNav();
  initExplorer();
  
  // Remove loader
  setTimeout(() => {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
  }, 1200);
});

/* ==========================================================================
   GLOBAL UTILS & EFFECTS
   ========================================================================== */

function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if(!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  function render() {
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  const interactives = document.querySelectorAll('a, button, .option-card, select, input');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
        }, index * 80); // stagger
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(reveal => observer.observe(reveal));
}

function initTypewriter() {
  const text = "Answer seven questions. Receive an AI-crafted business model recommendation built on India's startup reality.";
  const el = document.getElementById('typewriter-text');
  let i = 0;
  
  function typeWriter() {
    if (i < text.length) {
      el.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, 40);
    } else {
      el.innerHTML += '<span class="cursor-blink">|</span>';
      // Add blink css dynamically
      const style = document.createElement('style');
      style.innerHTML = `@keyframes blink-caret { 50% { opacity: 0; } } .cursor-blink { animation: blink-caret 1s step-end infinite; color: var(--gold); }`;
      document.head.appendChild(style);
    }
  }
  
  setTimeout(typeWriter, 1500); // Wait for loader
}

/* ==========================================================================
   PARTICLE CANVAS
   ========================================================================== */

function initParticles() {
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  const maxParticles = window.innerWidth > 768 ? 120 : 50;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let mouse = { x: null, y: null };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.baseAlpha = Math.random() * 0.5 + 0.3;
      this.angle = Math.random() * Math.PI * 2;
    }
    update() {
      // Sine wave oscillation
      this.angle += 0.02;
      this.x += this.vx + Math.cos(this.angle) * 0.2;
      this.y += this.vy + Math.sin(this.angle) * 0.2;

      // Mouse interaction
      if (mouse.x != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          this.x -= dx * 0.02;
          this.y -= dy * 0.02;
        }
      }

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 168, 76, ${this.baseAlpha})`;
      ctx.fill();
    }
  }

  for(let i=0; i<maxParticles; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for(let i=0; i<particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      
      // Connections
      for(let j=i+1; j<particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          let opacity = 1 - (dist/120);
          ctx.strokeStyle = `rgba(201, 168, 76, ${opacity * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* ==========================================================================
   PLANNER LOGIC
   ========================================================================== */

const questions = [
  {
    id: "budget",
    text: "What war chest are you entering with?",
    options: [
      { id: "guerrilla", label: "Guerrilla", desc: "< ₹25K", icon: "🪙" },
      { id: "skirmish", label: "Skirmish", desc: "₹25K–₹2L", icon: "💰" },
      { id: "campaign", label: "Campaign", desc: "₹2L–₹10L", icon: "🏦" },
      { id: "conquest", label: "Conquest", desc: "₹10L+", icon: "💎" }
    ]
  },
  {
    id: "revenue",
    text: "How quickly must you generate your first rupee?",
    options: [
      { id: "immediate", label: "Immediately", desc: "Within weeks", icon: "⚡" },
      { id: "months_6", label: "6 Months", desc: "Can survive half a year", icon: "⏳" },
      { id: "year_1", label: "1 Year", desc: "Building foundation", icon: "🏗️" },
      { id: "long", label: "Long Game", desc: "Valuation over quick revenue", icon: "🏔️" }
    ]
  },
  {
    id: "tech",
    text: "Where does your technical power lie?",
    options: [
      { id: "none", label: "No Code", desc: "I outsource or use basic tools", icon: "🤷" },
      { id: "tools", label: "Tool Manager", desc: "Shopify, Zapier, WordPress", icon: "🔧" },
      { id: "builder", label: "Product Builder", desc: "I can build basic apps", icon: "💻" },
      { id: "architect", label: "Systems Architect", desc: "Complex software engineering", icon: "🧠" }
    ]
  },
  {
    id: "risk",
    text: "What is your relationship with risk?",
    options: [
      { id: "low", label: "Protect Everything", desc: "Minimal downside wanted", icon: "🛡️" },
      { id: "calculated", label: "Calculated Bets", desc: "Will risk for clear upside", icon: "⚖️" },
      { id: "high", label: "High Tolerance", desc: "Comfortable with failure", icon: "🎢" },
      { id: "all", label: "Bet It All", desc: "Go big or go home", icon: "🎲" }
    ]
  },
  {
    id: "product",
    text: "What are you actually selling?",
    options: [
      { id: "physical", label: "Physical Goods", desc: "Things you can touch", icon: "📦" },
      { id: "digital", label: "Digital Content", desc: "Media, info, courses", icon: "📱" },
      { id: "software", label: "Software/Tools", desc: "SaaS, utilities", icon: "⚙️" },
      { id: "service", label: "Services/Connections", desc: "Marketplaces, consulting", icon: "🤝" }
    ]
  },
  {
    id: "scale",
    text: "Where is your ambition pointed?",
    options: [
      { id: "city", label: "My City", desc: "Hyperlocal dominance", icon: "🏙️" },
      { id: "india", label: "All of India", desc: "National brand", icon: "🇮🇳" },
      { id: "global", label: "The World", desc: "Cross-border commerce", icon: "🌍" },
      { id: "cloud", label: "The Cloud", desc: "Geography doesn't matter", icon: "☁️" }
    ]
  },
  {
    id: "brand",
    text: "How sacred is your brand to you?",
    options: [
      { id: "low", label: "Revenue First", desc: "Brand is secondary to sales", icon: "📈" },
      { id: "medium", label: "Secondary", desc: "Nice to have, not essential", icon: "🏷️" },
      { id: "moat", label: "The Moat", desc: "Brand defends against rivals", icon: "🏰" },
      { id: "everything", label: "Everything", desc: "We are nothing without it", icon: "👑" }
    ]
  }
];

let currentStep = 0;
let userAnswers = {};

const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];

function initPlanner() {
  const progContainer = document.getElementById('progress-indicator');
  for(let i=0; i<7; i++) {
    const dot = document.createElement('div');
    dot.className = 'prog-dot' + (i===0 ? ' active' : '');
    dot.id = 'prog-dot-' + i;
    progContainer.appendChild(dot);
  }
  
  document.getElementById('btn-back').addEventListener('click', () => {
    if(currentStep > 0) renderStep(currentStep - 1, 'back');
  });
  
  document.getElementById('btn-submit').addEventListener('click', submitAssessment);
  
  renderStep(0, 'forward');
}

function renderStep(stepIdx, direction) {
  const container = document.getElementById('question-container');
  
  // Exit animation
  container.className = 'question-container exiting';
  if(direction === 'back') container.style.transform = 'translateX(40px)';
  
  setTimeout(() => {
    currentStep = stepIdx;
    const q = questions[stepIdx];
    
    // Update watermark and progress
    document.getElementById('question-watermark').innerText = `${numerals[stepIdx]} / VII`;
    document.querySelectorAll('.prog-dot').forEach((dot, idx) => {
      dot.className = 'prog-dot' + (idx <= stepIdx ? ' active' : '');
    });
    
    // Render Question
    document.getElementById('question-text').innerText = q.text;
    
    // Render Options
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    q.options.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'option-card' + (userAnswers[q.id] === opt.label ? ' selected' : '');
      card.innerHTML = `
        <span class="opt-icon">${opt.icon}</span>
        <span class="opt-label">${opt.label}</span>
        <span class="opt-desc">${opt.desc}</span>
      `;
      card.addEventListener('click', () => {
        userAnswers[q.id] = opt.label;
        // visual update
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        updateProfileTags();
        
        // Auto advance or show submit
        setTimeout(() => {
          if(currentStep < 6) renderStep(currentStep + 1, 'forward');
          else document.getElementById('btn-submit').style.display = 'block';
        }, 400);
      });
      grid.appendChild(card);
    });
    
    // Buttons visibility
    document.getElementById('btn-back').style.display = currentStep > 0 ? 'block' : 'none';
    document.getElementById('btn-submit').style.display = (currentStep === 6 && userAnswers[q.id]) ? 'block' : 'none';
    
    // Enter animation
    container.className = 'question-container entering';
    if(direction === 'back') {
      container.style.animation = 'none';
      // trigger reflow
      void container.offsetWidth; 
      container.style.animation = 'enterQuestion 0.4s ease forwards';
      container.style.transform = 'translateX(-40px)'; // start from left
    }
  }, 300);
}

function updateProfileTags() {
  const container = document.getElementById('session-profile');
  container.innerHTML = '';
  Object.values(userAnswers).forEach(val => {
    const tag = document.createElement('div');
    tag.className = 'profile-tag';
    tag.innerText = val;
    container.appendChild(tag);
  });
}

async function submitAssessment() {
  const loader = document.getElementById('consulting-loader');
  loader.style.display = 'flex';
  loader.innerHTML = `
    <div class="compass-spinner">
      <svg viewBox="0 0 100 100" width="80" height="80">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--gold-muted)" stroke-width="2"/>
        <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="var(--gold)" opacity="0.8"/>
        <circle cx="50" cy="50" r="5" fill="var(--void)"/>
      </svg>
    </div>
    <p class="consulting-text">Consulting the Oracle...</p>
    <p class="consulting-subtext">Analysing your profile against 8 business models...</p>
  `;

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: userAnswers })
    });
    const data = await res.json();

    if (!res.ok) {
      // API returned an error — show it clearly
      const errMsg = data.error || 'Unknown error from Oracle.';
      loader.innerHTML = `
        <div style="text-align:center; padding: 40px; max-width: 500px;">
          <div style="font-size:40px; margin-bottom:20px;">⚠</div>
          <p style="color:var(--gold); font-family:'Cinzel',serif; font-size:20px; margin-bottom:16px;">Oracle Error</p>
          <p style="color:var(--silver); font-family:'Space Mono',monospace; font-size:12px; margin-bottom:24px; line-height:1.8;">${errMsg}</p>
          ${data.fallback ? `<button class="btn-primary" onclick="useFallback()">USE FALLBACK RESULT →</button>` : `<button class="btn-ghost" onclick="document.getElementById('consulting-loader').style.display='none'">← GO BACK</button>`}
        </div>
      `;
      if (data.fallback) window._fallbackData = data.fallback;
      return;
    }

    const finalData = data.fallback ? data.fallback : data;
    renderResults(finalData);
    initCharts(finalData.primary.model);

    setTimeout(() => {
      loader.style.display = 'none';
      document.getElementById('planner').style.display = 'none';
      document.getElementById('results').style.display = 'block';
      document.getElementById('oracle').style.display = 'block';
      // Add restart button
      addRestartButton();
      window.scrollTo({ top: document.getElementById('results').offsetTop, behavior: 'smooth' });
    }, 1200);

  } catch(err) {
    console.error(err);
    loader.innerHTML = `
      <div style="text-align:center; padding: 40px;">
        <p style="color:var(--crimson); font-family:'Space Mono',monospace; font-size:13px; margin-bottom:20px;">Cannot reach server on port 3005.<br>Is the backend running?</p>
        <button class="btn-ghost" onclick="document.getElementById('consulting-loader').style.display='none'">← GO BACK</button>
      </div>
    `;
  }
}

window.useFallback = function() {
  const data = window._fallbackData;
  if (!data) return;
  renderResults(data);
  initCharts(data.primary.model);
  const loader = document.getElementById('consulting-loader');
  loader.style.display = 'none';
  document.getElementById('planner').style.display = 'none';
  document.getElementById('results').style.display = 'block';
  document.getElementById('oracle').style.display = 'block';
  addRestartButton();
  window.scrollTo({ top: document.getElementById('results').offsetTop, behavior: 'smooth' });
};

function addRestartButton() {
  const existing = document.getElementById('restart-btn');
  if (existing) return;
  const btn = document.createElement('button');
  btn.id = 'restart-btn';
  btn.className = 'btn-ghost-small';
  btn.innerHTML = '↺ RESTART';
  btn.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:500; background:var(--void); border:1px solid var(--gold); color:var(--gold);';
  btn.addEventListener('click', () => {
    location.reload();
  });
  document.body.appendChild(btn);
}

/* ==========================================================================
   RESULTS & ORACLE
   ========================================================================== */

let currentRecommendation = null;
let oracleChatHistory = []; // multi-turn memory

function renderResults(data) {
  currentRecommendation = data.primary.model;

  // Animate score
  animateCounter('res-score', data.primary.matchScore);
  document.getElementById('res-model').innerText = data.primary.model;
  document.getElementById('res-tagline').innerText = `"${data.primary.tagline}"`;

  // Rationale
  const ratContainer = document.getElementById('res-rationale');
  ratContainer.innerHTML = data.primary.rationale
    .split(/\n\n+/)
    .map(p => `<p>${p.trim()}</p>`)
    .filter(p => p !== '<p></p>')
    .join('');

  // Lists
  document.getElementById('res-actions').innerHTML =
    data.primary.immediateActions.map(a => `<li>${a}</li>`).join('');
  document.getElementById('res-flags').innerHTML =
    data.primary.redFlags.map(f => `<li>${f}</li>`).join('');

  // Examples
  document.getElementById('res-examples').innerHTML =
    data.primary.indianExamples.map(e => `<span class="example-chip">${e}</span>`).join('');

  // Metrics
  document.getElementById('res-timeline').innerText = data.primary.estimatedTimeline;
  document.getElementById('res-capital').innerText = data.primary.capitalRequired;

  // Alternatives
  document.getElementById('res-alternatives').innerHTML = data.alternatives.map(alt => `
    <div class="alt-card">
      <h4>${alt.model} <span class="alt-score">${alt.matchScore}% MATCH</span></h4>
      <p class="alt-why">${alt.why}</p>
    </div>
  `).join('');

  // Warning
  document.getElementById('res-warning').innerText = data.warningSign;

  // Summary bar
  const summaryEl = document.getElementById('res-summary');
  if (summaryEl) summaryEl.innerText = data.summary || '';

  // Copy button
  const copyBtn = document.getElementById('btn-copy-result');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyResultToClipboard(data));
  }

  // Oracle setup
  document.getElementById('oracle-model-name').innerText = data.primary.model;
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
  document.getElementById('oracle-time').innerText = timeStr + ' IST';

  const pTags = document.getElementById('oracle-profile');
  pTags.innerHTML = Object.entries(userAnswers)
    .map(([k,v]) => `<span class="tag">${v}</span>`).join('');

  // Seed oracle history with context
  oracleChatHistory = [];

  renderTable(data.primary.model);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  let start = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.innerText = start;
    if (start >= target) clearInterval(timer);
  }, 40);
}

function copyResultToClipboard(data) {
  const text = `VentureCompass Assessment Result

Recommendation: ${data.primary.model} (${data.primary.matchScore}% match)
Tagline: ${data.primary.tagline}

Rationale:
${data.primary.rationale}

Timeline: ${data.primary.estimatedTimeline}
Capital: ${data.primary.capitalRequired}

Immediate Actions:
${data.primary.immediateActions.map((a,i) => `${i+1}. ${a}`).join('\n')}

Red Flags:
${data.primary.redFlags.map(f => `• ${f}`).join('\n')}

Indian Examples: ${data.primary.indianExamples.join(', ')}

Oracle Warning: ${data.warningSign}

Generated by VentureCompass · venturecompass.app`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy-result');
    if (btn) { btn.innerText = 'COPIED ✓'; setTimeout(() => { btn.innerText = 'COPY RESULT'; }, 2000); }
  });
}

// Oracle Chat — set up after DOM ready
function initOracleChat() {
  const sendBtn = document.getElementById('btn-send-chat');
  const chatInput = document.getElementById('chat-input');
  if (!sendBtn || !chatInput) return;
  sendBtn.addEventListener('click', sendCustomMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendCustomMessage();
  });
}
initOracleChat();

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Simple markdown-to-HTML: bold, bullet points, line breaks
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--void-border);padding:1px 4px;font-family:monospace;font-size:0.9em;">$1</code>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function appendChatMsg(role, content, container) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'user' ? 'user-msg' : 'ai-msg'}`;
  if (role === 'model') {
    div.innerHTML = `<div class="msg-content"><p>${renderMarkdown(content)}</p></div>`;
  } else {
    div.innerHTML = `<div class="msg-content">${escapeHtml(content)}</div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function sendCustomMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || msg.length > 500) return;
  input.value = '';
  sendOracleMessage(msg);
}

async function sendOracleMessage(message) {
  const win = document.getElementById('chat-window');
  if (!win) return;

  // Disable input while processing
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send-chat');
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // Hide starter chips
  const chips = document.getElementById('starter-chips');
  if (chips) chips.style.display = 'none';

  appendChatMsg('user', message, win);

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg ai-msg';
  typingEl.id = 'typing-' + Date.now();
  typingEl.innerHTML = `<div class="msg-content typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  win.appendChild(typingEl);
  win.scrollTop = win.scrollHeight;

  try {
    const res = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: { model: currentRecommendation, userProfile: userAnswers },
        history: oracleChatHistory
      })
    });

    const data = await res.json();
    typingEl.remove();

    if (!res.ok) {
      appendChatMsg('model', `⚠ ${data.error || 'The Oracle failed to respond.'}`, win);
    } else {
      const reply = data.reply || 'The Oracle is silent.';
      appendChatMsg('model', reply, win);
      // Add to history for multi-turn
      oracleChatHistory.push({ role: 'user', content: message });
      oracleChatHistory.push({ role: 'model', content: reply });
      // Keep last 10 turns (20 messages) to avoid token overflow
      if (oracleChatHistory.length > 20) oracleChatHistory = oracleChatHistory.slice(-20);
    }

  } catch(err) {
    typingEl.remove();
    appendChatMsg('model', '⚠ Cannot reach the Oracle. Is the server running on port 3005?', win);
  } finally {
    if (input) { input.disabled = false; input.focus(); }
    if (sendBtn) sendBtn.disabled = false;
  }
}

/* ==========================================================================
   STATIC DATA (For tables, charts, explorer)
   ========================================================================== */

const modelsData = [
  { id: "d2c", name: "Direct-to-Consumer (D2C)", icon: "📦", tagline: "Brand equity over everything.", req: "HIGH", rev: "MED", tech: "MED", risk: "HIGH", scale: "HIGH", ltv: "HIGH", margin: "HIGH", capVal: 8, spdVal: 5, scores: [8,8,7,5,8,4] },
  { id: "dropshipping", name: "Dropshipping", icon: "✈️", tagline: "Test fast, scale winners.", req: "LOW", rev: "FAST", tech: "LOW", risk: "LOW", scale: "MED", ltv: "LOW", margin: "LOW", capVal: 2, spdVal: 9, scores: [5,3,3,2,4,9] },
  { id: "marketplace", name: "Marketplace", icon: "🏪", tagline: "Connect buyers and sellers.", req: "HIGH", rev: "SLOW", tech: "HIGH", risk: "HIGH", scale: "MAX", ltv: "HIGH", margin: "MED", capVal: 9, spdVal: 2, scores: [10,7,5,9,8,2] },
  { id: "subscription", name: "Subscription Commerce", icon: "🔁", tagline: "Predictable recurring revenue.", req: "MED", rev: "MED", tech: "MED", risk: "MED", scale: "HIGH", ltv: "MAX", margin: "HIGH", capVal: 6, spdVal: 4, scores: [7,10,8,6,7,4] },
  { id: "saas", name: "SaaS (E-com Tools)", icon: "⚙️", tagline: "Build the picks and shovels.", req: "MED", rev: "SLOW", tech: "MAX", risk: "MED", scale: "MAX", ltv: "HIGH", margin: "MAX", capVal: 5, spdVal: 3, scores: [9,8,10,10,6,3] },
  { id: "affiliate", name: "Affiliate Marketing", icon: "🔗", tagline: "Sell without inventory.", req: "MIN", rev: "FAST", tech: "LOW", risk: "LOW", scale: "MED", ltv: "MIN", margin: "MAX", capVal: 1, spdVal: 8, scores: [5,2,9,3,3,8] },
  { id: "whitelabel", name: "White Label", icon: "🏷️", tagline: "Your brand, their product.", req: "MED", rev: "FAST", tech: "LOW", risk: "MED", scale: "HIGH", ltv: "MED", margin: "MED", capVal: 5, spdVal: 7, scores: [7,5,6,4,6,7] },
  { id: "freemium", name: "Freemium", icon: "🔓", tagline: "Scale free users, monetize 5%.", req: "MAX", rev: "SLOW", tech: "HIGH", risk: "HIGH", scale: "MAX", ltv: "MED", margin: "HIGH", capVal: 10, spdVal: 1, scores: [10,6,8,8,7,2] }
];

/* ==========================================================================
   TABLE & CHARTS
   ========================================================================== */

function getScoreHtml(valStr) {
  let colorClass = valStr === 'HIGH' || valStr === 'MAX' || valStr === 'FAST' ? 'high' : 
                   valStr === 'MED' ? 'med' : 'low';
  let pct = valStr === 'MAX' ? 100 : valStr === 'HIGH' || valStr === 'FAST' ? 80 : 
            valStr === 'MED' ? 50 : 20;
            
  return `
    <div class="score-cell">
      <span class="score-label ${colorClass}">${valStr}</span>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:${pct}%; background: var(--${colorClass === 'high'?'green':colorClass==='med'?'amber':'crimson'})"></div></div>
    </div>
  `;
}

function renderTable(recModelName) {
  const tbody = document.getElementById('compare-body');
  tbody.innerHTML = '';
  
  modelsData.forEach(m => {
    const tr = document.createElement('tr');
    if(recModelName && m.name.toLowerCase().includes(recModelName.toLowerCase().split(' ')[0])) {
      tr.className = 'highlighted';
    }
    
    tr.innerHTML = `
      <td class="sticky-col">${m.name}</td>
      <td>${getScoreHtml(m.req)}</td>
      <td>${getScoreHtml(m.rev)}</td>
      <td>${getScoreHtml(m.tech)}</td>
      <td>${getScoreHtml(m.risk)}</td>
      <td>${getScoreHtml(m.scale)}</td>
      <td>${getScoreHtml(m.ltv)}</td>
      <td>${getScoreHtml(m.margin)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initCharts(recModelName) {
  // Scatter
  const ctxScatter = document.getElementById('scatterChart').getContext('2d');
  
  const scatterData = modelsData.map(m => {
    const isRec = recModelName && m.name.toLowerCase().includes(recModelName.toLowerCase().split(' ')[0]);
    return {
      x: m.capVal, // using cap as proxy for risk here for visual spread
      y: m.scores[2], // margin proxy
      r: isRec ? 16 : 8,
      label: m.name,
      isRec: isRec
    };
  });

  new Chart(ctxScatter, {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'Models',
        data: scatterData,
        backgroundColor: scatterData.map(d => d.isRec ? '#C9A84C' : 'rgba(201,168,76,0.2)'),
        borderColor: '#C9A84C',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.label}`
          }
        }
      },
      scales: {
        x: { grid: { color: '#1a1a1a' }, title: { display: true, text: 'RISK / CAPITAL', color: '#8A8A9A' } },
        y: { grid: { color: '#1a1a1a' }, title: { display: true, text: 'MARGIN POTENTIAL', color: '#8A8A9A' } }
      }
    }
  });

  // Velocity Matrix (Custom HTML bars)
  const vContainer = document.getElementById('velocity-matrix');
  vContainer.innerHTML = '';
  modelsData.forEach((m, idx) => {
    const isRec = recModelName && m.name.toLowerCase().includes(recModelName.toLowerCase().split(' ')[0]);
    const row = document.createElement('div');
    row.className = 'v-row' + (isRec ? ' highlighted' : '');
    row.innerHTML = `
      <div class="v-label">${m.name.substring(0,12)}..</div>
      <div class="v-bars">
        <div class="v-bar cap" style="width: ${m.capVal * 10}%; animation: slideInLeft 0.8s ${idx*0.1}s forwards;"></div>
        <div class="v-bar spd" style="width: ${m.spdVal * 10}%; animation: slideInLeft 0.8s ${0.4 + idx*0.1}s forwards;"></div>
      </div>
    `;
    vContainer.appendChild(row);
  });

  // Radar
  const ctxRadar = document.getElementById('radarChart').getContext('2d');
  const radarLabels = ['Scalability', 'Customer LTV', 'Margin', 'Tech Demand', 'Brand', 'Speed'];
  
  let recData = modelsData[0].scores;
  let recLabel = "Primary";
  modelsData.forEach(m => {
    if(recModelName && m.name.toLowerCase().includes(recModelName.toLowerCase().split(' ')[0])) {
      recData = m.scores;
      recLabel = m.name;
    }
  });

  const radarChart = new Chart(ctxRadar, {
    type: 'radar',
    data: {
      labels: radarLabels,
      datasets: [
        {
          label: recLabel + ' (Recommended)',
          data: recData,
          backgroundColor: 'rgba(201, 168, 76, 0.4)',
          borderColor: '#C9A84C',
          pointBackgroundColor: '#C9A84C',
          borderWidth: 2
        },
        {
          label: modelsData[1].name + ' (Comparison)',
          data: modelsData[1].scores,
          backgroundColor: 'rgba(138, 138, 154, 0.1)',
          borderColor: '#8A8A9A',
          pointBackgroundColor: '#8A8A9A',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: '#1a1a1a' },
          grid: { color: '#1a1a1a' },
          pointLabels: { color: '#8A8A9A', font: { family: 'Space Mono', size: 10 } },
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#D4C9B0' } }
      }
    }
  });

  // Populate Dropdown
  const select = document.getElementById('radar-model-2');
  select.innerHTML = '';
  modelsData.forEach((m, idx) => {
    select.innerHTML += `<option value="${idx}">${m.name}</option>`;
  });
  select.selectedIndex = 1;
  
  select.addEventListener('change', (e) => {
    const selModel = modelsData[e.target.value];
    radarChart.data.datasets[1].label = selModel.name + ' (Comparison)';
    radarChart.data.datasets[1].data = selModel.scores;
    radarChart.update();
  });
}

/* ==========================================================================
   MODEL EXPLORER
   ========================================================================== */

function initExplorer() {
  const grid = document.getElementById('explorer-grid');
  grid.innerHTML = '';
  
  modelsData.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.innerHTML = `
      <div class="model-numeral">${numerals[i]}</div>
      <div class="model-icon">${m.icon}</div>
      <h3 class="model-name cinzel">${m.name}</h3>
      <p class="model-tagline">"${m.tagline}"</p>
      <div class="model-metrics">
        <div>Capital: <span>${m.req}</span></div>
        <div>Velocity: <span>${m.rev}</span></div>
      </div>
      <button class="btn-ghost-small" onclick="loadInsights('${m.id}', this)">EXPLORE DEEP &rarr;</button>
      <div class="deep-insights" id="insights-${m.id}">
        <!-- Skeletons -->
        <div class="skeleton-line" style="width: 80%"></div>
        <div class="skeleton-line" style="width: 100%"></div>
        <div class="skeleton-line" style="width: 60%"></div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadInsights(modelId, btn) {
  const container = document.getElementById('insights-' + modelId);
  
  // Toggle off if already loaded
  if(container.classList.contains('loaded')) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    btn.innerHTML = container.style.display === 'none' ? 'EXPLORE DEEP &rarr;' : 'COLLAPSE &uarr;';
    return;
  }
  
  container.className = 'deep-insights loading';
  btn.innerText = 'ANALYSING...';
  
  const modelName = modelsData.find(m => m.id === modelId).name;
  
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelKey: modelName })
    });
    const data = await res.json();
    
    container.innerHTML = `
      <div class="insight-block">
        <h5>MARKET SIZE (INDIA)</h5>
        <p>${data.marketSize}</p>
      </div>
      <div class="insight-block">
        <h5>THE OPPORTUNITY</h5>
        <p>${data.indianOpportunity}</p>
      </div>
      <div class="insight-block">
        <h5>CORE CHALLENGES</h5>
        <ul>${data.challengesIndia.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
      <div class="insight-block">
        <h5>FOUNDER PITFALLS</h5>
        <ul>${data.topFounderMistakes.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
      <div class="insight-block">
        <h5>KEY RESOURCES</h5>
        <ul>${data.resources.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
    container.classList.remove('loading');
    container.classList.add('loaded');
    btn.innerHTML = 'COLLAPSE &uarr;';
  } catch(err) {
    container.innerHTML = `<p style="color:var(--crimson); font-size:14px;">Error fetching insights.</p>`;
    btn.innerHTML = 'RETRY';
  }
}

/* Utils */
window.scrollToPlanner = () => {
  document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
};
window.scrollToOracle = () => {
  document.getElementById('oracle').scrollIntoView({ behavior: 'smooth' });
};
window.scrollToExplorer = () => {
  document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
};
