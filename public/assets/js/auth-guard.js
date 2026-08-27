(() => {
  const AUTH_KEY = 'sessionAuthN';

  function getBasePath() {
    const pathName = window.location.pathname;
    const pagesSegment = '/pages/';
    const pagesIndex = pathName.indexOf(pagesSegment);

    if (pagesIndex >= 0) {
      return pathName.slice(0, pagesIndex);
    }

    if (/\/[^/]+\.[^/]+$/.test(pathName)) {
      return pathName.slice(0, pathName.lastIndexOf('/'));
    }

    return pathName.endsWith('/') ? pathName.slice(0, -1) : pathName;
  }

  function buildAppUrl(relativePath) {
    const basePath = getBasePath();
    const normalizedRelativePath = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;

    return `${window.location.origin}${basePath}${normalizedRelativePath}`;
  }

  function getAuthUrl() {
    return buildAppUrl('pages/auth.html');
  }

  function getHomeUrl() {
    return buildAppUrl('index.html');
  }

  function getContentUrl() {
    return buildAppUrl('pages/content.html');
  }

  function getAdminUrl() {
    return buildAppUrl('pages/admin.html');
  }

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function getSessionUser() {
    return sessionStorage.getItem('sessionUser') || '';
  }

  function clearSession() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('sessionUser');
    sessionStorage.removeItem('sessionToken');
  }

  function isAuthPage() {
    return /\/pages\/auth\.html$/.test(window.location.pathname);
  }

  function requireAuth() {
    if (isAuthPage()) {
      return true;
    }

    if (!isAuthenticated()) {
      window.location.replace(getAuthUrl());
      return false;
    }

    return true;
  }

  window.brainBucketAuth = {
    AUTH_KEY,
    buildAppUrl,
    getAuthUrl,
    getHomeUrl,
    getContentUrl,
    getAdminUrl,
    isAuthenticated,
    isAuthPage,
    getSessionUser,
    clearSession,
    requireAuth,
  };
})();
