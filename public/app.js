const LOGO_SRC = "1024_x_1024.png";

// Logos
document.addEventListener('DOMContentLoaded', () => {
  ['navLogo','heroLogo','loginLogo','ctaLogo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = LOGO_SRC;
  });
});

// Routing
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const nl = document.getElementById('nav-' + name);
  if (nl) nl.classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'admin') renderAdmin();
}

// Char counter
document.addEventListener('DOMContentLoaded', () => {
  const msgEl = document.getElementById('c_msg');
  const cc = document.getElementById('charCount');
  if (msgEl) {
    msgEl.addEventListener('input', () => {
      const n = msgEl.value.length;
      cc.textContent = `${n} / 2000`;
      cc.className = 'char-count' + (n > 1800 ? ' warn' : '');
    });
  }

  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('c_name').value.trim();
      const email   = document.getElementById('c_email').value.trim();
      const subject = document.getElementById('c_subject').value.trim();
      const message = document.getElementById('c_msg').value.trim();
      const btn     = document.getElementById('submitBtn');
      const status  = document.getElementById('statusMsg');

      ['c_name','c_email','c_subject','c_msg'].forEach(id => document.getElementById(id).classList.remove('err'));
      status.className = 'status-msg';

      let err = false;
      if (name.length < 2)   { document.getElementById('c_name').classList.add('err'); err = true; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('c_email').classList.add('err'); err = true; }
      if (subject.length < 3) { document.getElementById('c_subject').classList.add('err'); err = true; }
      if (message.length < 10) { document.getElementById('c_msg').classList.add('err'); err = true; }
      if (err) { status.textContent = '⚠️  Please fill in all fields correctly.'; status.className = 'status-msg error show'; return; }

      btn.disabled = true;
      btn.innerHTML = '<span>Sending...</span><div class="spinner"></div>';

      try {
        const res = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,email,subject,message}) });
        const data = await res.json();
        if (data.success) {
          document.getElementById('formArea').style.display = 'none';
          document.getElementById('successView').classList.add('show');
        } else {
          status.textContent = '❌ ' + data.message;
          status.className = 'status-msg error show';
          btn.disabled = false;
          btn.innerHTML = '<span>Send Message</span><span>→</span>';
        }
      } catch {
        document.getElementById('formArea').style.display = 'none';
        document.getElementById('successView').classList.add('show');
      }
    });
  }

  // Login events
  const lUser = document.getElementById('l_user');
  const lPass = document.getElementById('l_pass');
  if (lUser) lUser.addEventListener('keydown', e => { if(e.key==='Enter') lPass.focus(); });
  if (lPass) lPass.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
});

function resetForm() {
  document.getElementById('contactForm').reset();
  document.getElementById('charCount').textContent = '0 / 2000';
  document.getElementById('formArea').style.display = 'block';
  document.getElementById('successView').classList.remove('show');
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submitBtn').innerHTML = '<span>Send Message</span><span>→</span>';
  document.getElementById('statusMsg').className = 'status-msg';
}

// Admin
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'sportbuddy2026';

function doLogin() {
  const u = document.getElementById('l_user').value;
  const p = document.getElementById('l_pass').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.remove('show');
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    sessionStorage.setItem('sb_admin','1');
    document.getElementById('adminNavBtn').style.display = 'none';
    showPage('admin');
  } else {
    errEl.classList.add('show');
    document.getElementById('l_pass').value = '';
    document.getElementById('l_pass').classList.add('err');
    setTimeout(() => document.getElementById('l_pass').classList.remove('err'), 1500);
  }
}

function doLogout() {
  sessionStorage.removeItem('sb_admin');
  document.getElementById('adminNavBtn').style.display = '';
  showPage('home');
}

function renderAdmin() {
  if (!sessionStorage.getItem('sb_admin')) { showPage('login'); return; }
  const msgs = JSON.parse(localStorage.getItem('sb_msgs') || '[]');
  document.getElementById('totalCount').textContent = msgs.length;
  const today = new Date().toDateString();
  document.getElementById('todayCount').textContent = msgs.filter(m => new Date(m.time).toDateString() === today).length;
  const list = document.getElementById('msgList');
  if (!msgs.length) { list.innerHTML = '<div class="admin-empty">📭 No messages yet.</div>'; return; }
  list.innerHTML = msgs.map(m => `
    <div class="msg-item">
      <div class="msg-head">
        <div><div class="msg-from">${m.name}</div><div class="msg-email">${m.email}</div></div>
        <div class="msg-time">${new Date(m.time).toLocaleString('en-GB')}</div>
      </div>
      <div class="msg-subject">Subject: ${m.subject}</div>
      <div class="msg-body">${m.message}</div>
    </div>
  `).join('');
}
