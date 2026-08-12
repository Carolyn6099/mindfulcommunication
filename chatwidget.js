/* ============================================================
   Mindful Communication — Bespoke Training Enquiry Widget
   Self-contained: no dependencies, no external libraries.
   Submits to Formspree (same endpoint as the enquiry form).
   Include with: <script src="chatwidget.js"></script>
   ============================================================ */

(function () {

  /* ── Brand & config ──────────────────────────────────────── */
  var NAVY   = '#071E43';
  var ORANGE = '#E8751A';
  var CREAM  = '#FAF8F4';
  var FORMSPREE = 'https://formspree.io/f/xnjkyokb';

  /* ── Conversation steps ──────────────────────────────────── */
  var steps = [
    {
      id: 'welcome',
      msg: "Hi! 👋 I'm here to help you explore bespoke NVC training for your organisation. It'll only take a minute — shall we get started?",
      type: 'options',
      options: ["Yes, let's go!", 'Maybe later'],
      field: null,
      next: ['org_type', 'close']
    },
    {
      id: 'org_type',
      msg: "Great! What type of organisation are you with?",
      type: 'options',
      options: ['Charity / Non-profit', 'NHS / Public sector', 'Private company', 'Education / University', 'Other'],
      field: 'Organisation type',
      next: 'group_size'
    },
    {
      id: 'group_size',
      msg: "How many people are you thinking of training?",
      type: 'options',
      options: ['Up to 12', '12–20', 'More than 20', 'Not sure yet'],
      field: 'Group size',
      next: 'focus'
    },
    {
      id: 'focus',
      msg: "What's the main focus you're hoping to achieve?",
      type: 'options',
      options: ['Team communication', 'Conflict resolution', 'Leadership & management', 'Staff wellbeing & resilience', 'Something else'],
      field: 'Main focus',
      next: 'timescale'
    },
    {
      id: 'timescale',
      msg: "And what's your rough timescale?",
      type: 'options',
      options: ['Within 3 months', '3–6 months', '6–12 months', 'Just exploring for now'],
      field: 'Timescale',
      next: 'name'
    },
    {
      id: 'name',
      msg: "Nearly there! What's your name?",
      type: 'text',
      placeholder: 'Your name',
      field: 'Name',
      next: 'email'
    },
    {
      id: 'email',
      msg: "And your email address — so Carolyn can get back to you?",
      type: 'email',
      placeholder: 'your@email.com',
      field: 'Email',
      next: 'done'
    }
  ];

  /* Answers collected during conversation */
  var answers = {};
  var currentStep = 0;
  var userName = '';

  /* ── Inject CSS ──────────────────────────────────────────── */
  var css = `
    #mc-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${NAVY};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(7,30,67,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #mc-chat-btn:hover { transform: scale(1.07); box-shadow: 0 6px 28px rgba(7,30,67,0.45); }
    #mc-chat-btn svg { width: 28px; height: 28px; fill: white; }
    #mc-chat-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: ${ORANGE};
      border-radius: 50%;
      border: 2px solid white;
      animation: mc-pulse 2s infinite;
    }
    @keyframes mc-pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.25); opacity: 0.8; }
    }
    #mc-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 340px;
      max-height: 540px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 8px 40px rgba(7,30,67,0.22);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      transform: scale(0.92) translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.2s;
      font-family: 'Inter', sans-serif;
    }
    #mc-chat-panel.mc-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    @media (max-width: 420px) {
      #mc-chat-panel {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 84px;
        max-height: 80vh;
      }
      #mc-chat-btn { bottom: 16px; right: 16px; }
    }
    #mc-chat-header {
      background: ${NAVY};
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #mc-chat-header-text { display: flex; flex-direction: column; }
    #mc-chat-title { color: white; font-weight: 700; font-size: 0.95rem; margin: 0; }
    #mc-chat-subtitle { color: rgba(255,255,255,0.65); font-size: 0.75rem; margin: 2px 0 0; }
    #mc-chat-close {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      font-size: 1.4rem;
      line-height: 1;
      padding: 0 0 2px 0;
      transition: color 0.15s;
    }
    #mc-chat-close:hover { color: white; }
    #mc-chat-progress-bar {
      height: 3px;
      background: rgba(232,117,26,0.25);
      flex-shrink: 0;
    }
    #mc-chat-progress-fill {
      height: 100%;
      background: ${ORANGE};
      width: 0%;
      transition: width 0.4s ease;
    }
    #mc-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #mc-chat-messages::-webkit-scrollbar { width: 4px; }
    #mc-chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
    .mc-bot-msg {
      align-self: flex-start;
      background: ${CREAM};
      color: ${NAVY};
      border-radius: 12px 12px 12px 3px;
      padding: 10px 13px;
      font-size: 0.875rem;
      line-height: 1.5;
      max-width: 88%;
      animation: mc-fadein 0.25s ease;
    }
    .mc-user-msg {
      align-self: flex-end;
      background: ${NAVY};
      color: white;
      border-radius: 12px 12px 3px 12px;
      padding: 9px 13px;
      font-size: 0.875rem;
      line-height: 1.5;
      max-width: 80%;
      animation: mc-fadein 0.25s ease;
    }
    @keyframes mc-fadein {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mc-typing {
      align-self: flex-start;
      background: ${CREAM};
      border-radius: 12px 12px 12px 3px;
      padding: 12px 16px;
      display: flex;
      gap: 5px;
      align-items: center;
    }
    .mc-typing span {
      width: 7px; height: 7px;
      background: rgba(7,30,67,0.35);
      border-radius: 50%;
      animation: mc-bounce 1.2s infinite ease-in-out;
    }
    .mc-typing span:nth-child(2) { animation-delay: 0.2s; }
    .mc-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes mc-bounce {
      0%,80%,100% { transform: scale(0.7); opacity: 0.5; }
      40%          { transform: scale(1);   opacity: 1; }
    }
    #mc-chat-options {
      padding: 8px 14px 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      flex-shrink: 0;
    }
    .mc-opt-btn {
      background: white;
      border: 1.5px solid ${NAVY};
      color: ${NAVY};
      border-radius: 20px;
      padding: 6px 13px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .mc-opt-btn:hover {
      background: ${NAVY};
      color: white;
    }
    #mc-chat-input-area {
      padding: 10px 14px 14px;
      display: none;
      flex-shrink: 0;
    }
    #mc-chat-input-area.mc-visible { display: flex; gap: 8px; }
    #mc-chat-input {
      flex: 1;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      padding: 9px 11px;
      font-size: 0.875rem;
      font-family: inherit;
      color: ${NAVY};
      outline: none;
      transition: border-color 0.15s;
    }
    #mc-chat-input:focus { border-color: ${ORANGE}; }
    #mc-chat-send {
      background: ${ORANGE};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    #mc-chat-send:hover { background: #d0660f; }
    #mc-chat-send:disabled { background: #ccc; cursor: default; }
    .mc-success-msg {
      text-align: center;
      padding: 24px 16px;
      color: ${NAVY};
    }
    .mc-success-msg .mc-tick {
      font-size: 2rem;
      margin-bottom: 8px;
    }
    .mc-success-msg p { font-size: 0.9rem; line-height: 1.5; margin: 0; }
    .mc-success-msg strong { color: ${ORANGE}; }
  `;

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Build DOM ───────────────────────────────────────────── */
  /* Floating button */
  var btn = document.createElement('button');
  btn.id = 'mc-chat-btn';
  btn.setAttribute('aria-label', 'Chat with us about bespoke training');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/>
    </svg>
    <span id="mc-chat-badge"></span>
  `;

  /* Panel */
  var panel = document.createElement('div');
  panel.id = 'mc-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Bespoke training enquiry chat');
  panel.innerHTML = `
    <div id="mc-chat-header">
      <div id="mc-chat-header-text">
        <span id="mc-chat-title">Enquire about Training</span>
        <span id="mc-chat-subtitle">Bespoke NVC for organisations</span>
      </div>
      <button id="mc-chat-close" aria-label="Close chat">&times;</button>
    </div>
    <div id="mc-chat-progress-bar"><div id="mc-chat-progress-fill"></div></div>
    <div id="mc-chat-messages"></div>
    <div id="mc-chat-options"></div>
    <div id="mc-chat-input-area">
      <input id="mc-chat-input" type="text" />
      <button id="mc-chat-send">Send</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  /* ── Refs ────────────────────────────────────────────────── */
  var msgs      = document.getElementById('mc-chat-messages');
  var optArea   = document.getElementById('mc-chat-options');
  var inputArea = document.getElementById('mc-chat-input-area');
  var inputEl   = document.getElementById('mc-chat-input');
  var sendBtn   = document.getElementById('mc-chat-send');
  var progFill  = document.getElementById('mc-chat-progress-fill');
  var isOpen    = false;

  /* ── Toggle open / close ─────────────────────────────────── */
  function openChat() {
    isOpen = true;
    panel.classList.add('mc-open');
    btn.querySelector('#mc-chat-badge').style.display = 'none';
    if (msgs.childElementCount === 0) startConversation();
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('mc-open');
  }

  btn.addEventListener('click', function () { isOpen ? closeChat() : openChat(); });
  document.getElementById('mc-chat-close').addEventListener('click', closeChat);

  /* ── Helpers ─────────────────────────────────────────────── */
  function scrollBottom() {
    setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 50);
  }

  function addBotMsg(text) {
    var el = document.createElement('div');
    el.className = 'mc-bot-msg';
    el.textContent = text;
    msgs.appendChild(el);
    scrollBottom();
    return el;
  }

  function addUserMsg(text) {
    var el = document.createElement('div');
    el.className = 'mc-user-msg';
    el.textContent = text;
    msgs.appendChild(el);
    scrollBottom();
  }

  function showTyping(cb, delay) {
    var t = document.createElement('div');
    t.className = 'mc-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    scrollBottom();
    setTimeout(function () {
      msgs.removeChild(t);
      cb();
    }, delay || 700);
  }

  function clearOptions() {
    optArea.innerHTML = '';
    inputArea.classList.remove('mc-visible');
    inputEl.value = '';
    inputEl.type = 'text';
    inputEl.placeholder = '';
  }

  function updateProgress() {
    /* 7 steps total (0-indexed: welcome + 6 others) */
    var pct = Math.round((currentStep / (steps.length - 1)) * 100);
    progFill.style.width = pct + '%';
  }

  /* ── Main flow ───────────────────────────────────────────── */
  function startConversation() {
    currentStep = 0;
    updateProgress();
    showTyping(function () {
      showStep(steps[0]);
    }, 500);
  }

  function showStep(step) {
    addBotMsg(step.msg);
    clearOptions();
    updateProgress();

    if (step.type === 'options') {
      step.options.forEach(function (opt, i) {
        var b = document.createElement('button');
        b.className = 'mc-opt-btn';
        b.textContent = opt;
        b.addEventListener('click', function () {
          handleOptionChoice(step, opt, i);
        });
        optArea.appendChild(b);
      });
    } else {
      /* text or email input */
      inputArea.classList.add('mc-visible');
      inputEl.type  = step.type;
      inputEl.placeholder = step.placeholder || '';
      inputEl.focus();
    }
  }

  function handleOptionChoice(step, choice, index) {
    /* "Maybe later" / close special case */
    if (step.next === 'close' || (Array.isArray(step.next) && step.next[index] === 'close')) {
      addUserMsg(choice);
      clearOptions();
      showTyping(function () {
        addBotMsg("No problem at all! You can always enquire via the form below, or email carolyn@mindfulcommunication.co.uk directly. 🌿");
      }, 500);
      return;
    }

    if (step.field) answers[step.field] = choice;
    addUserMsg(choice);
    clearOptions();

    var nextId = Array.isArray(step.next) ? step.next[index] : step.next;
    if (nextId === 'done') { submitAndFinish(); return; }

    var nextStep = steps.find(function (s) { return s.id === nextId; });
    currentStep++;
    updateProgress();

    showTyping(function () {
      showStep(nextStep);
    }, 650);
  }

  /* Text / email input submission */
  function handleTextInput() {
    var val = inputEl.value.trim();
    if (!val) return;

    var step = steps[currentStep];

    /* Basic email validation */
    if (step.type === 'email' && !/\S+@\S+\.\S+/.test(val)) {
      inputEl.style.borderColor = '#c0392b';
      inputEl.placeholder = 'Please enter a valid email';
      inputEl.value = '';
      return;
    }
    inputEl.style.borderColor = '';

    if (step.id === 'name') userName = val;
    if (step.field) answers[step.field] = val;

    addUserMsg(val);
    clearOptions();

    var nextId = step.next;
    if (nextId === 'done') { submitAndFinish(); return; }

    var nextStep = steps.find(function (s) { return s.id === nextId; });
    currentStep++;
    updateProgress();

    showTyping(function () {
      showStep(nextStep);
    }, 650);
  }

  sendBtn.addEventListener('click', handleTextInput);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleTextInput();
  });

  /* ── Submit to Formspree ─────────────────────────────────── */
  function submitAndFinish() {
    progFill.style.width = '100%';
    clearOptions();

    /* Build JSON payload */
    var payload = {
      '_subject': 'Bespoke training enquiry — ' + (answers['Name'] || 'website visitor'),
      '_replyto': answers['Email'] || ''
    };
    Object.keys(answers).forEach(function (key) {
      payload[key] = answers[key];
    });

    /* Show sending state */
    showTyping(function () {
      addBotMsg("Sending your details to Carolyn…");
    }, 600);

    fetch(FORMSPREE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (data.ok) {
        showSuccess();
      } else {
        showError();
      }
    })
    .catch(function () { showError(); });
  }

  function showSuccess() {
    msgs.innerHTML = '';
    optArea.innerHTML = '';
    var name = userName ? ', ' + userName : '';
    msgs.innerHTML = `
      <div class="mc-success-msg">
        <div class="mc-tick">🌿</div>
        <p>Thank you${name}!<br><br>
        <strong>Carolyn will be in touch within two working days</strong> to find out more about your organisation and discuss how she can help.<br><br>
        In the meantime, feel free to email her directly at carolyn@mindfulcommunication.co.uk</p>
      </div>
    `;
    progFill.style.width = '100%';
  }

  function showError() {
    clearOptions();
    addBotMsg("Sorry, something went wrong sending your message. Please email Carolyn directly at carolyn@mindfulcommunication.co.uk — she'd love to hear from you!");
  }

  /* ── Auto-nudge after 20 seconds ─────────────────────────── */
  /* Only fires once, only if panel hasn't been opened */
  setTimeout(function () {
    if (!isOpen && msgs.childElementCount === 0) {
      var badge = btn.querySelector('#mc-chat-badge');
      if (badge) badge.style.display = 'block';
    }
  }, 20000);

})();
