import { startExtraction, showToast } from '../api.js';

const urlInput = document.getElementById('url-input');
const extractBtn = document.getElementById('btn-extract');
const recentChips = document.getElementById('recent-chips');
const recentSection = document.getElementById('recent-extractions');

let recentUrls = JSON.parse(localStorage.getItem('recentUrls') ?? '[]');

function renderRecent() {
  if (!recentChips || !recentSection) return;
  recentChips.innerHTML = '';
  if (recentUrls.length === 0) {
    recentSection.classList.add('hidden');
    return;
  }
  recentSection.classList.remove('hidden');
  recentUrls.slice(0, 5).forEach((url) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = url;
    chip.addEventListener('click', () => {
      if (urlInput) urlInput.value = url;
    });
    recentChips.appendChild(chip);
  });
}

renderRecent();

extractBtn?.addEventListener('click', async () => {
  const raw = urlInput?.value ?? '';
  const urls = raw.split('\n').map((u) => u.trim()).filter(Boolean);
  if (urls.length === 0) {
    showToast('Please enter at least one URL.', 'error');
    return;
  }
  if (urls.length > 20) {
    showToast('Maximum 20 URLs allowed.', 'error');
    return;
  }

  try {
    extractBtn.disabled = true;
    extractBtn.textContent = 'Starting…';
    const { data } = await startExtraction(urls);

    recentUrls = [urls[0], ...recentUrls.filter((u) => u !== urls[0])].slice(0, 10);
    localStorage.setItem('recentUrls', JSON.stringify(recentUrls));
    renderRecent();

    window.dispatchEvent(new CustomEvent('extraction-started', { detail: { job: data } }));
    window.switchView('result');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = 'Start Extraction';
  }
});
