(() => {
  if (!window.brainBucketAuth || !window.brainBucketAuth.requireAuth()) {
    return;
  }

  const STORAGE_KEY = 'contentRecords';
  const INTERNAL_DATA_PATH = 'assets/data/ideas.json';
  const navProfileName = document.getElementById('navProfileName');
  const logoutBtn = document.getElementById('logoutBtn');
  const derivedInfo = document.getElementById('derivedInfo');
  const localStorageList = document.getElementById('localStorageList');
  const sessionStorageList = document.getElementById('sessionStorageList');
  const clearLocalAllBtn = document.getElementById('clearLocalAllBtn');
  const clearSessionAllBtn = document.getElementById('clearSessionAllBtn');
  const resetFromJsonBtn = document.getElementById('resetFromJsonBtn');
  const contentRecordsPreview = document.getElementById('contentRecordsPreview');
  const sessionUser = window.brainBucketAuth.getSessionUser() || 'Guest';

  if (!derivedInfo || !localStorageList || !sessionStorageList || !contentRecordsPreview) {
    return;
  }

  if (navProfileName) {
    navProfileName.textContent = sessionUser;
  }

  function formatValue(rawValue) {
    const asString = String(rawValue || '');

    try {
      const parsed = JSON.parse(asString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return asString;
    }
  }

  function buildStorageCard(scopeName, key, rawValue) {
    const wrapper = document.createElement('article');
    wrapper.className = 'border rounded p-2 bg-body-tertiary';

    const head = document.createElement('div');
    head.className = 'd-flex justify-content-between align-items-center gap-2 mb-2';

    const keyEl = document.createElement('strong');
    keyEl.className = 'small';
    keyEl.textContent = key;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-outline-danger py-0 px-2';
    removeBtn.textContent = 'Clear';
    removeBtn.dataset.scope = scopeName;
    removeBtn.dataset.key = key;

    head.append(keyEl, removeBtn);

    const pre = document.createElement('pre');
    pre.className = 'bb-admin-pre mb-0';
    pre.textContent = formatValue(rawValue);

    wrapper.append(head, pre);
    return wrapper;
  }

  function renderStorageScope(scopeName, storageObject, container) {
    container.innerHTML = '';

    if (!storageObject.length) {
      const empty = document.createElement('p');
      empty.className = 'text-muted small mb-0';
      empty.textContent = 'No keys saved.';
      container.appendChild(empty);
      return;
    }

    const keys = Object.keys(storageObject).sort((a, b) => a.localeCompare(b));
    keys.forEach((key) => {
      const rawValue = storageObject.getItem(key);
      container.appendChild(buildStorageCard(scopeName, key, rawValue));
    });
  }

  function buildDerivedInfoItems(ipAddress) {
    const date = new Date();
    return [
      { label: 'Date/Time', value: date.toLocaleString() },
      { label: 'User', value: sessionUser },
      { label: 'Browser', value: navigator.userAgent },
      { label: 'Platform', value: navigator.platform || 'unknown' },
      { label: 'Language', value: navigator.language || 'unknown' },
      { label: 'Time Zone', value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown' },
      { label: 'IP', value: ipAddress || 'Unavailable' },
    ];
  }

  function renderDerivedInfo(ipAddress) {
    derivedInfo.innerHTML = '';
    buildDerivedInfoItems(ipAddress).forEach((item) => {
      const tile = document.createElement('article');
      tile.className = 'bb-admin-tile border rounded p-2 bg-body-tertiary';

      const label = document.createElement('div');
      label.className = 'small text-muted text-uppercase';
      label.textContent = item.label;

      const value = document.createElement('div');
      value.className = 'small';
      value.textContent = item.value;

      tile.append(label, value);
      derivedInfo.appendChild(tile);
    });
  }

  function renderContentPreview() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      contentRecordsPreview.textContent = 'No content records found.';
      return;
    }

    contentRecordsPreview.textContent = formatValue(raw);
  }

  function refreshAll(ipAddress) {
    renderStorageScope('local', localStorage, localStorageList);
    renderStorageScope('session', sessionStorage, sessionStorageList);
    renderContentPreview();
    renderDerivedInfo(ipAddress);
  }

  async function loadIpAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
      if (!response.ok) {
        return '';
      }

      const data = await response.json();
      return String(data && data.ip ? data.ip : '');
    } catch (error) {
      return '';
    }
  }

  async function resetFromInternalJson() {
    try {
      const dataUrl = window.brainBucketAuth && typeof window.brainBucketAuth.buildAppUrl === 'function'
        ? window.brainBucketAuth.buildAppUrl(INTERNAL_DATA_PATH)
        : `../${INTERNAL_DATA_PATH}`;
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) {
        return false;
      }

      const records = await response.json();
      if (!Array.isArray(records)) {
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeKey(scopeName, key) {
    if (scopeName === 'local') {
      localStorage.removeItem(key);
      return;
    }

    sessionStorage.removeItem(key);
  }

  localStorageList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest('button[data-scope="local"][data-key]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const key = button.dataset.key || '';
    if (!key) {
      return;
    }

    removeKey('local', key);
    refreshAll(cachedIpAddress);
  });

  sessionStorageList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest('button[data-scope="session"][data-key]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const key = button.dataset.key || '';
    if (!key) {
      return;
    }

    removeKey('session', key);
    if (key === 'sessionAuthN' || key === 'sessionToken' || key === 'sessionUser') {
      window.location.assign(window.brainBucketAuth.getAuthUrl());
      return;
    }

    refreshAll(cachedIpAddress);
  });

  if (clearLocalAllBtn) {
    clearLocalAllBtn.addEventListener('click', () => {
      localStorage.clear();
      refreshAll(cachedIpAddress);
    });
  }

  if (clearSessionAllBtn) {
    clearSessionAllBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.assign(window.brainBucketAuth.getAuthUrl());
    });
  }

  if (resetFromJsonBtn) {
    resetFromJsonBtn.addEventListener('click', async () => {
      resetFromJsonBtn.setAttribute('disabled', 'true');
      const didReset = await resetFromInternalJson();
      resetFromJsonBtn.removeAttribute('disabled');
      if (didReset) {
        refreshAll(cachedIpAddress);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.brainBucketAuth.clearSession();
      window.location.assign(window.brainBucketAuth.getAuthUrl());
    });
  }

  let cachedIpAddress = '';
  loadIpAddress().then((ipAddress) => {
    cachedIpAddress = ipAddress;
    refreshAll(cachedIpAddress);
  });

  refreshAll(cachedIpAddress);

  window.setInterval(() => {
    renderDerivedInfo(cachedIpAddress);
  }, 30000);
})();
