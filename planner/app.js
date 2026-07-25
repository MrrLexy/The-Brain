const REPO = 'MrrLexy/The-Brain';
const WORKER_URL = 'https://the-brain-planner.a96velazquez.workers.dev';
const CATEGORIES = ['Task', 'Idea', 'Goal', 'Skill'];

const state = { filter: 'all', showDone: false, items: [] };

function parseItem(issue) {
  const match = issue.title.match(/^\[(\w+)\]\s*(.*)$/);
  const category = match && CATEGORIES.includes(match[1]) ? match[1] : 'Note';
  const title = match ? match[2] : issue.title;
  return {
    category,
    title,
    done: issue.state === 'closed',
    date: issue.created_at,
    url: issue.html_url,
  };
}

async function load() {
  const list = document.getElementById('list');
  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/issues?state=all&per_page=100`);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const issues = await resp.json();
    state.items = issues
      .filter(i => !i.pull_request)
      .map(parseItem)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    render();
  } catch (e) {
    list.innerHTML = `<p class="error">Couldn't load from GitHub (${e.message}).</p>`;
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function render() {
  const list = document.getElementById('list');
  const items = state.items.filter(i => {
    if (!state.showDone && i.done) return false;
    if (state.filter !== 'all' && i.category !== state.filter) return false;
    return true;
  });
  if (!items.length) {
    list.innerHTML = `<p class="empty">Nothing here yet.</p>`;
    return;
  }
  list.innerHTML = items.map(i => `
    <a class="item${i.done ? ' done' : ''}" href="${i.url}" target="_blank" rel="noopener noreferrer">
      <span class="dot"></span>
      <span class="body">
        <span class="cat">${escapeHtml(i.category)}</span>
        <div class="title">${escapeHtml(i.title)}</div>
        <div class="date">${fmtDate(i.date)}</div>
      </span>
    </a>
  `).join('');
}

document.getElementById('filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.filter = chip.dataset.filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
  render();
});

document.getElementById('showDone').addEventListener('change', (e) => {
  state.showDone = e.target.checked;
  render();
});

function getPin() {
  let pin = localStorage.getItem('planner_pin');
  if (!pin) {
    pin = prompt('Set a PIN to protect your planner (only asked once on this device):');
    if (pin) localStorage.setItem('planner_pin', pin);
  }
  return pin;
}

document.getElementById('captureForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const text = document.getElementById('captureText').value.trim();
  if (!text) return;
  const pin = getPin();
  if (!pin) return;

  const btn = document.getElementById('captureBtn');
  const status = document.getElementById('captureStatus');
  btn.disabled = true;
  status.textContent = 'Saving…';
  status.classList.remove('error');

  try {
    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, text, pin }),
    });
    const result = await resp.json();
    if (!resp.ok) {
      if (resp.status === 401) localStorage.removeItem('planner_pin');
      throw new Error(result.error || `HTTP ${resp.status}`);
    }
    document.getElementById('captureText').value = '';
    status.textContent = 'Saved ✓';
    state.items.unshift({ category, title: text, done: false, date: new Date().toISOString(), url: result.url });
    render();
    setTimeout(() => { status.textContent = 'Saves straight to your tracker — no extra tap.'; }, 2000);
  } catch (err) {
    status.textContent = `Couldn't save (${err.message}). Try again.`;
    status.classList.add('error');
  } finally {
    btn.disabled = false;
  }
});

load();
