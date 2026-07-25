const REPO = 'MrrLexy/The-Brain';
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

document.getElementById('captureForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const text = document.getElementById('captureText').value.trim();
  if (!text) return;
  const title = `[${category}] ${text}`;
  const url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}`;
  window.open(url, '_blank');
  document.getElementById('captureText').value = '';
});

load();
