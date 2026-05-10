const SocialRouter = (() => {
  const userId   = () => localStorage.getItem('userId');
  const username = () => localStorage.getItem('username');

  function guard() {
    const body = document.body;
    if (body.dataset.requireAuth !== undefined && !userId()) { navigate('index.html'); return false; }
    if (body.dataset.requireGuest !== undefined && userId()) { navigate('feed.html');  return false; }
    return true;
  }

  function getOverlay() {
    let el = document.getElementById('page-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'page-overlay';
      el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg,#fafafa);opacity:0;pointer-events:none;transition:opacity 0.25s ease;';
      document.body.appendChild(el);
    }
    return el;
  }

  async function navigate(url, updateHistory = true) {
    if (!url || url === '#' || url.startsWith('javascript')) return;
    const overlay = getOverlay();
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    try {
      await new Promise(r => setTimeout(r, 200));
      const res = await fetch(url);
      if (!res.ok) throw new Error('Page not found');
      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      if (updateHistory) window.history.pushState({ url }, '', url);
      const newBody = doc.body;
      document.body.className = newBody.className;
      if (newBody.hasAttribute('data-require-auth'))  document.body.setAttribute('data-require-auth', '');
      else document.body.removeAttribute('data-require-auth');
      if (newBody.hasAttribute('data-require-guest')) document.body.setAttribute('data-require-guest', '');
      else document.body.removeAttribute('data-require-guest');
      document.body.innerHTML = '';
      Array.from(newBody.childNodes).forEach(node => document.body.appendChild(node.cloneNode(true)));
      document.body.appendChild(overlay);
      runInlineScripts(document.body);
      if (!guard()) return;
      window.scrollTo(0, 0);
      setupGlobalListeners();
      requestAnimationFrame(() => { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; });
    } catch (err) {
      console.error('Routing failed:', err);
      window.location.href = url;
    }
  }

  function runInlineScripts(element) {
    element.querySelectorAll('script').forEach(old => {
      if (old.src && old.src.includes('router.js')) return;
      const s = document.createElement('script');
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      document.body.appendChild(s);
      old.remove();
    });
  }

  function setupGlobalListeners() {
    document.removeEventListener('click', linkInterceptor);
    document.addEventListener('click', linkInterceptor);
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); logout(); });
    });
  }

  function linkInterceptor(e) {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    e.preventDefault();
    navigate(href);
  }

  window.addEventListener('popstate', e => {
    navigate(e.state?.url || window.location.pathname, false);
  });

  function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    navigate('index.html');
  }

  function init() {
    if (window._routerInitialized) return;
    window._routerInitialized = true;
    document.addEventListener('DOMContentLoaded', () => {
      window.history.replaceState({ url: window.location.pathname + window.location.search }, '', window.location.href);
      const overlay = getOverlay();
      overlay.style.opacity = '1';
      if (!guard()) return;
      setupGlobalListeners();
      requestAnimationFrame(() => { overlay.style.opacity = '0'; });
    });
  }

  init();
  return { navigate, logout, userId, username };
})();

window.SocialRouter = SocialRouter;
