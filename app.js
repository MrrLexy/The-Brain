async function main(){
  const app = document.getElementById('app');
  const res = await fetch('data/manifest.json');
  const items = await res.json();

  const id = new URLSearchParams(location.search).get('id');

  if (id) {
    const item = items.find(i => i.id === id);
    if (item) {
      location.replace(item.url);
      return;
    }
    app.innerHTML = `<div class="error">No item found for "${id}".</div>`;
    return;
  }

  if (!items.length) {
    app.innerHTML = `<div class="empty">Nothing here yet.</div>`;
    return;
  }

  app.innerHTML = items.map(item => `
    <a class="card" href="${item.url}">
      <span class="emoji">${item.emoji || '🔗'}</span>
      <span class="text">
        <h2>${item.title}</h2>
        <p>${item.description || ''}</p>
      </span>
    </a>
  `).join('');
}

main();
