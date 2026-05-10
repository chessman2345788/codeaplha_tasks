const API = '/api';

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';
  toast.style.borderBottom = type === 'error' ? '3px solid #ef4444' : '3px solid #22c55e';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.borderBottom = '';
  }, 3000);
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  if (loading) {
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
  }
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  const btn = document.getElementById('register-btn');
  btn.dataset.label = 'Create Account';

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(btn, true);

    const username = document.getElementById('username').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message, 'error');
      } else {
        localStorage.setItem('userId',   data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('token',    data.token);
        showToast('Account created! Redirecting...');
        setTimeout(() => { window.location.href = 'feed.html'; }, 900);
      }
    } catch (err) {
      showToast('Cannot connect to server', 'error');
    }

    setLoading(btn, false);
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  const btn = document.getElementById('login-btn');
  btn.dataset.label = 'Sign In';

  if (localStorage.getItem('userId')) window.location.href = 'feed.html';

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(btn, true);

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message, 'error');
      } else {
        localStorage.setItem('userId',   data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('token',    data.token);
        showToast('Welcome back! 👋');
        setTimeout(() => { window.location.href = 'feed.html'; }, 800);
      }
    } catch (err) {
      showToast('Cannot connect to server', 'error');
    }

    setLoading(btn, false);
  });
}
