import browser from 'webextension-polyfill';

const scanStatusEl = document.getElementById('scan-status') as HTMLElement;
const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const statusDot = document.getElementById('status-dot') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;

function setStatus(active: boolean): void {
  statusDot.style.background = active ? '#22c55e' : '#ef4444';
  statusText.textContent = active ? 'Extension active' : 'Extension error';
}

async function getCurrentTab(): Promise<browser.Tabs.Tab | undefined> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function triggerScan(): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    scanStatusEl.textContent = 'No active tab found.';
    return;
  }

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning…';
  scanStatusEl.textContent = 'Requesting scan…';

  try {
    await browser.tabs.sendMessage(tab.id, { type: 'SCAN_REQUEST' });
    scanStatusEl.textContent = 'Scan triggered. Check buttons on the page.';
  } catch {
    scanStatusEl.textContent =
      'Could not reach content script. Try reloading the page.';
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan page again';
  }
}

async function init(): Promise<void> {
  try {
    const tab = await getCurrentTab();
    if (tab?.url) {
      const url = new URL(tab.url);
      scanStatusEl.textContent = `Current page: ${url.hostname}`;
    } else {
      scanStatusEl.textContent = 'Navigate to a page with comments to start.';
    }
    setStatus(true);
  } catch {
    setStatus(false);
    scanStatusEl.textContent = 'Unable to read tab info.';
  }
}

scanBtn.addEventListener('click', () => {
  void triggerScan();
});

void init();
