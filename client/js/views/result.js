import { getExtraction, showToast } from '../api.js';

const resultContent = document.getElementById('result-content');
let pollInterval = null;

function formatSocialLinks(socialLinks) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return '<p class="empty">No social links found.</p>';
  }
  return Object.entries(socialLinks)
    .map(([platform, links]) => {
      const list = links.map((url) => `<li><a href="${url}" target="_blank" rel="noopener">${url}</a></li>`).join('');
      return `
        <div class="social-group">
          <strong class="platform">${platform}</strong>
          <ul class="link-list">${list}</ul>
        </div>
      `;
    })
    .join('');
}

function renderResult(job) {
  if (!resultContent) return;

  if (job.status === 'running' || job.status === 'pending') {
    resultContent.innerHTML = `<div class="loading">Running extraction… <span class="spinner"></span></div>`;
    return;
  }

  if (job.status === 'failed') {
    resultContent.innerHTML = `<div class="error-state">Extraction failed. Please try again.</div>`;
    return;
  }

  const cards = job.results.map((r) => `
    <div class="result-card ${r.status === 'error' ? 'error' : ''}">
      <div class="result-header">
        <h3>${r.url}</h3>
        <span class="badge ${r.status}">${r.status}</span>
      </div>
      ${r.error ? `<p class="error-msg">${r.error}</p>` : ''}

      <div class="result-section">
        <h4>Emails (${r.emails.length})</h4>
        ${r.emails.length ? `<ul class="tag-list">${r.emails.map((e) => `<li><code>${e}</code></li>`).join('')}</ul>` : '<p class="empty">No emails found.</p>'}
      </div>

      <div class="result-section">
        <h4>Phone Numbers (${r.phoneNumbers.length})</h4>
        ${r.phoneNumbers.length ? `<ul class="tag-list">${r.phoneNumbers.map((p) => `<li><code>${p}</code></li>`).join('')}</ul>` : '<p class="empty">No phone numbers found.</p>'}
      </div>

      <div class="result-section">
        <h4>Social Links</h4>
        ${formatSocialLinks(r.socialLinks)}
      </div>

      <div class="result-section">
        <h4>Scanned Pages (${r.scannedPages.length})</h4>
        ${r.scannedPages.length ? `<ul class="page-list">${r.scannedPages.map((p) => `<li><a href="${p}" target="_blank" rel="noopener">${p}</a></li>`).join('')}</ul>` : '<p class="empty">No pages scanned.</p>'}
      </div>
    </div>
  `).join('');

  resultContent.innerHTML = `
    <div class="result-meta">
      <p>Job ID: <code>${job.id}</code></p>
      <p>Created: ${new Date(job.createdAt).toLocaleString()}</p>
      ${job.completedAt ? `<p>Completed: ${new Date(job.completedAt).toLocaleString()}</p>` : ''}
    </div>
    <div class="results-grid">${cards}</div>
  `;
}

async function pollJob(id) {
  try {
    const { data } = await getExtraction(id);
    renderResult(data);
    if (data.status === 'completed' || data.status === 'failed') {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } catch (err) {
    showToast(err.message, 'error');
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

window.addEventListener('extraction-started', (e) => {
  const job = e.detail.job;
  renderResult(job);
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => pollJob(job.id), 3000);
});

window.addEventListener('viewchange', (e) => {
  if (e.detail.view !== 'result' && pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});
