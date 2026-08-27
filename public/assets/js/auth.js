(() => {
  const AUTH_API_URL = 'https://authn.barrycumbie.com/api/authn/login';
  const FALLBACK_PASSWORD = 'cat';

  console.info('[auth] Fallback mode available via configured fallback password.');

  if (window.brainBucketAuth && window.brainBucketAuth.isAuthenticated()) {
    window.location.replace(window.brainBucketAuth.getHomeUrl());
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginBtn');
  const userBox = document.getElementById('userBox');
  const passBox = document.getElementById('passBox');
  const authMessage = document.getElementById('authMsg');

  if (!loginForm || !loginButton || !userBox || !passBox || !authMessage) {
    return;
  }

  function setAuthMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle('text-danger', isError);
    authMessage.classList.toggle('text-secondary', !isError);
  }

  function setAuthenticatedSession(username, token) {
    sessionStorage.setItem('sessionAuthN', 'true');
    sessionStorage.setItem('sessionUser', username);

    if (token) {
      sessionStorage.setItem('sessionToken', token);
    }
  }

  function normalizeUsername(rawValue) {
    return String(rawValue || '').trim() || 'guest';
  }

  async function authenticateWithApi(username, password) {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    return response.json();
  }

  async function handleLogin() {
    const username = normalizeUsername(userBox.value);
    const enteredPassword = String(passBox.value || '').trim();
    const selectedPassword = enteredPassword || FALLBACK_PASSWORD;

    setAuthMessage('Authenticating...');

    try {
      const data = await authenticateWithApi(username, selectedPassword);
      setAuthenticatedSession(username, data && data.token ? data.token : '');
      setAuthMessage('Success. Redirecting...');
      window.location.assign(window.brainBucketAuth.getHomeUrl());
      return;
    } catch (error) {
      if (selectedPassword === FALLBACK_PASSWORD) {
        setAuthenticatedSession(username, 'fallback-mode');
        console.warn('[auth] API login failed. Using fallback mode.', error);
        setAuthMessage('Success. Redirecting...');
        window.location.assign(window.brainBucketAuth.getHomeUrl());
        return;
      }

      sessionStorage.setItem('sessionAuthN', 'false');
      setAuthMessage('Login failed. Check credentials and try again.', true);
    }
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleLogin();
  });
})();
