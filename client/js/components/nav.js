function switchView(viewId) {
  document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  document.querySelectorAll('.nav-link').forEach((btn) => btn.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-link[data-view="${viewId}"]`);
  if (navBtn) navBtn.classList.add('active');

  window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: viewId } }));
}

document.querySelectorAll('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    if (view) switchView(view);
  });
});

document.querySelectorAll('.btn-back').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    if (view) switchView(view);
  });
});

const themeToggle = document.getElementById('btn-theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
  const saved = localStorage.getItem('theme');
  themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

window.switchView = switchView;
