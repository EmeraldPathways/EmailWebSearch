import { getHistory, showToast } from '../api.js';

const historyContent = document.getElementById('history-content');

function renderHistory(jobs) {
  if (!historyContent) return;
  if (jobs.length === 0) {
    historyContent.innerHTML = '<p class="empty-state">No extractions yet.</p>';
    return;
  }

  const rows = jobs.map((job) => {
    const totalEmails = job.results.reduce((sum, r) => sum + r.emails.length, 0);
    const totalPhones = job.results.reduce((sum, r) => sum + r.phoneNumbers.length, 0);
    return `
      <div class="history-row" data-id="${job.id}">
        <div class="history-info">
          <strong>${job.urls.length} URL(s)</strong>
          <span class="status-badge ${job.status}">${job.status}</span>
          <span class="meta">${new Date(job.createdAt).toLocaleString()}</span>
        </div>
        <div class="history-stats">
          <span class="stat">${totalEmails} emails</span>
          <span class="stat">${totalPhones} phones</span>
        </div>
      </div>
    `;
  }).join('');

  historyContent.innerHTML = `<div class="history-list">${rows}</div>`;

  historyContent.querySelectorAll('.history-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      window.dispatchEvent(new CustomEvent('load-history-item', { detail: { id } }));
      window.switchView('result');
    });
  });
}

async function loadHistory() {
  if (!historyContent) return;
  historyContent.innerHTML = '<div class="loading">Loading history…</div>';
  try {
    const { data } = await getHistory();
    renderHistory(data);
  } catch (err) {
    showToast(err.message, 'error');
    historyContent.innerHTML = '<p class="error-state">Failed to load history.</p>';
  }
}

window.addEventListener('viewchange', (e) => {
  if (e.detail.view === 'history') {
    loadHistory();
  }
});

window.addEventListener('load-history-item', async (e) => {
  const id = e.detail.id;
  if (!resultContent) return;
  resultContent.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const { data } = await import('../api.js').then((m) => m.getExtraction(id));
    await import('./result.js');
    window.dispatchEvent(new CustomEvent('extraction-started', { detail: { job: data } }));
  } catch (err) {
    showToast(err.message, 'error');
  }
});

const resultContent = document.getElementById('result-content');
