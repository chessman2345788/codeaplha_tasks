/* ============================================================
   feed.js — SocialApp Feed
   Features: create post (text+media), like, comment, bookmark
   ============================================================ */
'use strict';

var API           = '/api';
var userId        = localStorage.getItem('userId');
var username      = localStorage.getItem('username');
var token         = localStorage.getItem('token');
var avatarInitial = username ? username[0].toUpperCase() : '?';
var allPostsData  = [];

/* ── Saved posts set (IDs the user has bookmarked) ─────── */
var savedPostIds  = new Set();

/* ── Auth headers ─────────────────────────────────────── */
function authHeaders() {
  return { 'Authorization': 'Bearer ' + token };
}
function jsonHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

/* ── Utilities ────────────────────────────────────────── */
function showToast(msg, type) {
  type = type || 'success';
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast-visible toast-' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.className = ''; }, 3200);
}

function timeAgo(d) {
  var s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function avatarLetter(name) { return name ? name[0].toUpperCase() : '?'; }

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

/* ── Populate nav chrome ──────────────────────────────── */
var navAvatar = document.getElementById('nav-avatar');
if (navAvatar) navAvatar.textContent = avatarInitial;
var createAvatar = document.getElementById('create-avatar');
if (createAvatar) createAvatar.textContent = avatarInitial;

/* ── Char counter ─────────────────────────────────────── */
var postTextarea = document.getElementById('post-content');
var charCount    = document.getElementById('char-count');
if (postTextarea) {
  postTextarea.addEventListener('input', function () {
    var len = postTextarea.value.length;
    if (charCount) charCount.textContent = len + ' / 500';
    autoResize(postTextarea);
  });
}

/* ══════════════════════════════════════════════════════════
   MEDIA PREVIEW in create-post box
   ══════════════════════════════════════════════════════ */
var mediaInput   = document.getElementById('media-input');
var mediaPreview = document.getElementById('media-preview');
var removeMedia  = document.getElementById('remove-media');

if (mediaInput) {
  mediaInput.addEventListener('change', function () {
    var file = mediaInput.files[0];
    if (!file) return;

    var url = URL.createObjectURL(file);
    var isVideo = file.type.startsWith('video/');

    mediaPreview.innerHTML = isVideo
      ? '<video src="' + url + '" class="media-preview-el" controls muted playsinline></video>'
      : '<img src="' + url + '" class="media-preview-el" alt="preview"/>';

    mediaPreview.classList.remove('hidden');
    if (removeMedia) removeMedia.classList.remove('hidden');
  });
}

if (removeMedia) {
  removeMedia.addEventListener('click', function () {
    mediaInput.value = '';
    mediaPreview.innerHTML = '';
    mediaPreview.classList.add('hidden');
    removeMedia.classList.add('hidden');
  });
}

/* ══════════════════════════════════════════════════════════
   LOAD POSTS
   ══════════════════════════════════════════════════════ */
function loadPosts() {
  var container = document.getElementById('posts-container');
  if (!container) return;
  container.innerHTML = skeletonHTML(3);

  /* Load saved post IDs alongside feed */
  var postsP = fetch(API + '/posts').then(function (r) { return r.json(); });
  var savedP = token
    ? fetch(API + '/posts/saved', { headers: authHeaders() }).then(function (r) { return r.json(); }).catch(function () { return []; })
    : Promise.resolve([]);

  Promise.all([postsP, savedP])
    .then(function (results) {
      var data  = results[0];
      var saved = results[1];

      var posts = Array.isArray(data) ? data : (data.posts || []);
      allPostsData = posts;

      // Build saved-id set
      savedPostIds = new Set();
      (Array.isArray(saved) ? saved : []).forEach(function (p) {
        savedPostIds.add((p._id || p).toString());
      });

      if (!posts.length) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-icon">🌱</div>' +
            '<p class="empty-msg">No posts yet — be the first to share something!</p>' +
          '</div>';
        return;
      }

      renderFeed(posts);

      var myCount = posts.filter(function (p) {
        var uid = (p.userId && p.userId._id) ? p.userId._id : p.userId;
        return uid && uid.toString() === userId;
      }).length;
      var el = document.getElementById('sidebar-posts');
      if (el) el.textContent = myCount;
    })
    .catch(function (err) {
      console.error('loadPosts error:', err);
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">⚠️</div>' +
          '<p class="empty-msg">Could not load posts. Is the server running?</p>' +
        '</div>';
    });
}

/* ── Skeleton cards ───────────────────────────────────── */
function skeletonHTML(n) {
  var html = '';
  for (var i = 0; i < n; i++) {
    html +=
      '<div class="post-card sk-card">' +
        '<div class="post-header">' +
          '<div class="sk-circle"></div>' +
          '<div class="sk-lines"><div class="sk-line" style="width:55%"></div><div class="sk-line" style="width:35%"></div></div>' +
        '</div>' +
        '<div class="sk-block"></div>' +
        '<div class="sk-block" style="width:70%"></div>' +
      '</div>';
  }
  return html;
}

/* ══════════════════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════════════ */
function renderFeed(posts) {
  var container = document.getElementById('posts-container');
  if (!container) return;
  if (!posts.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p class="empty-msg">No posts found.</p></div>';
    return;
  }
  container.innerHTML = posts.map(renderPost).join('');
  attachPostListeners();
}

function renderPost(post) {
  var author   = post.userId;
  var name     = (author && author.username) ? author.username : 'Unknown';
  var authorId = (author && author._id) ? author._id : post.userId;
  var likes    = post.likes || [];
  var comments = post.comments || [];
  var isLiked  = likes.some(function (id) { return (id._id || id).toString() === userId; });
  var isOwner  = authorId && authorId.toString() === userId;
  var isSaved  = savedPostIds.has(post._id.toString());

  /* ── Comments HTML ── */
  var commentsHTML = comments.map(function (c) {
    var cu = (c.userId && c.userId.username) ? c.userId.username : 'User';
    return '<div class="comment-item">' +
      '<div class="comment-avatar">' + avatarLetter(cu) + '</div>' +
      '<div class="comment-bubble">' +
        '<span class="comment-name">' + escapeHTML(cu) + '</span>' +
        '<span class="comment-text">' + escapeHTML(c.text) + '</span>' +
      '</div></div>';
  }).join('');

  /* ── Media HTML ── */
  var mediaHTML = '';
  if (post.mediaUrl) {
    if (post.mediaType === 'video') {
      mediaHTML =
        '<div class="post-media">' +
          '<video src="' + post.mediaUrl + '" class="post-media-el" controls playsinline preload="metadata"></video>' +
        '</div>';
    } else {
      mediaHTML =
        '<div class="post-media">' +
          '<img src="' + post.mediaUrl + '" class="post-media-el" alt="Post image" loading="lazy"/>' +
        '</div>';
    }
  }

  var deleteBtn = isOwner
    ? '<button class="delete-post-btn icon-btn" data-id="' + post._id + '" title="Delete post"><i class="fa-solid fa-trash-can"></i></button>'
    : '';

  return (
    '<div class="post-card" data-id="' + post._id + '">' +
      /* ── Header ── */
      '<div class="post-header">' +
        '<div class="post-avatar">' + avatarLetter(name) + '</div>' +
        '<div class="post-meta">' +
          '<a class="post-author" href="profile.html?id=' + authorId + '">' + escapeHTML(name) + '</a>' +
          '<span class="post-time">' + timeAgo(post.createdAt) + '</span>' +
        '</div>' +
        deleteBtn +
      '</div>' +
      /* ── Body ── */
      (post.content ? '<div class="post-body">' + escapeHTML(post.content) + '</div>' : '') +
      /* ── Media ── */
      mediaHTML +
      /* ── Actions ── */
      '<div class="post-actions">' +
        '<button class="action-btn like-btn' + (isLiked ? ' liked' : '') + '" data-id="' + post._id + '">' +
          '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
          '<span class="like-count">' + likes.length + '</span>' +
        '</button>' +
        '<button class="action-btn comment-toggle-btn" data-id="' + post._id + '">' +
          '<i class="fa-regular fa-comment"></i>' +
          '<span class="comment-count">' + comments.length + '</span>' +
        '</button>' +
        '<button class="action-btn save-btn' + (isSaved ? ' saved' : '') + '" data-id="' + post._id + '" title="' + (isSaved ? 'Unsave' : 'Save') + '">' +
          '<i class="' + (isSaved ? 'fa-solid' : 'fa-regular') + ' fa-bookmark"></i>' +
        '</button>' +
      '</div>' +
      /* ── Comments Section ── */
      '<div class="comments-section" id="comments-' + post._id + '">' +
        '<div class="comment-input-row">' +
          '<div class="comment-avatar">' + avatarInitial + '</div>' +
          '<div class="comment-input-wrap">' +
            '<input type="text" id="comment-input-' + post._id + '" class="comment-input" placeholder="Add a comment…" maxlength="300" />' +
            '<button class="submit-comment-btn" data-id="' + post._id + '">Post</button>' +
          '</div>' +
        '</div>' +
        '<div class="comment-list" id="comment-list-' + post._id + '">' +
          (commentsHTML || '<p class="no-comments">Be the first to comment!</p>') +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/* ══════════════════════════════════════════════════════════
   LISTENERS
   ══════════════════════════════════════════════════════ */
function attachPostListeners() {

  /* ── Like ── */
  document.querySelectorAll('.like-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var postId  = btn.dataset.id;
      var wasLiked = btn.classList.contains('liked');
      var icon    = btn.querySelector('i');
      var countEl = btn.querySelector('.like-count');

      btn.classList.toggle('liked');
      if (icon)    icon.className = btn.classList.contains('liked') ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + (wasLiked ? -1 : 1);

      try {
        var res  = await fetch(API + '/posts/' + postId + '/like', { method: 'PUT', headers: jsonHeaders() });
        var data = await res.json();
        if (res.ok) {
          if (countEl) countEl.textContent = data.totalLikes;
        } else {
          btn.classList.toggle('liked');
          if (icon)    icon.className = wasLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
          if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + (wasLiked ? 1 : -1);
          showToast(data.message || 'Error liking post', 'error');
        }
      } catch (e) { showToast('Error liking post', 'error'); }
    });
  });

  /* ── Save/Bookmark ── */
  document.querySelectorAll('.save-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var postId  = btn.dataset.id;
      var wasSaved = btn.classList.contains('saved');
      var icon    = btn.querySelector('i');

      btn.classList.toggle('saved');
      if (icon) icon.className = btn.classList.contains('saved') ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
      btn.title = btn.classList.contains('saved') ? 'Unsave' : 'Save';

      try {
        var res  = await fetch(API + '/posts/' + postId + '/save', { method: 'PUT', headers: jsonHeaders() });
        var data = await res.json();
        if (res.ok) {
          if (data.saved) savedPostIds.add(postId); else savedPostIds.delete(postId);
          showToast(data.message || (data.saved ? 'Saved!' : 'Removed from saved'));
        } else {
          btn.classList.toggle('saved');
          if (icon) icon.className = wasSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
          showToast(data.message || 'Error', 'error');
        }
      } catch (e) { showToast('Error', 'error'); }
    });
  });

  /* ── Comment toggle ── */
  document.querySelectorAll('.comment-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = document.getElementById('comments-' + btn.dataset.id);
      if (!section) return;
      section.classList.toggle('open');
      if (section.classList.contains('open')) {
        var inp = document.getElementById('comment-input-' + btn.dataset.id);
        if (inp) setTimeout(function () { inp.focus(); }, 60);
      }
    });
  });

  /* ── Submit comment buttons ── */
  document.querySelectorAll('.submit-comment-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { submitComment(btn.dataset.id); });
  });

  /* ── Enter key on comment inputs ── */
  document.querySelectorAll('.comment-input').forEach(function (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      submitComment(inp.id.replace('comment-input-', ''));
    });
  });

  /* ── Delete post ── */
  document.querySelectorAll('.delete-post-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!confirm('Delete this post? This cannot be undone.')) return;
      var postId = btn.dataset.id;
      try {
        var res  = await fetch(API + '/posts/' + postId, { method: 'DELETE', headers: jsonHeaders() });
        var data = await res.json();
        if (res.ok) {
          showToast('Post deleted');
          var card = document.querySelector('.post-card[data-id="' + postId + '"]');
          if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.95)'; setTimeout(function () { card.remove(); }, 200); }
        } else {
          showToast(data.message || 'Could not delete post', 'error');
        }
      } catch (e) { showToast('Error deleting post', 'error'); }
    });
  });
}

/* ── Submit comment (in-place) ────────────────────────── */
async function submitComment(postId) {
  var inp  = document.getElementById('comment-input-' + postId);
  var btn  = document.querySelector('.submit-comment-btn[data-id="' + postId + '"]');
  var text = inp ? inp.value.trim() : '';
  if (!text) { showToast('Comment cannot be empty', 'error'); return; }

  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    var res  = await fetch(API + '/posts/' + postId + '/comment', {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ text: text })
    });
    var data = await res.json();
    if (res.ok) {
      if (inp) inp.value = '';
      if (btn) { btn.disabled = false; btn.textContent = 'Post'; }
      showToast('Comment added!');

      var list = document.getElementById('comment-list-' + postId);
      if (list) {
        var noMsg = list.querySelector('.no-comments');
        if (noMsg) noMsg.remove();
        list.insertAdjacentHTML('beforeend',
          '<div class="comment-item">' +
            '<div class="comment-avatar">' + avatarInitial + '</div>' +
            '<div class="comment-bubble">' +
              '<span class="comment-name">' + escapeHTML(username) + '</span>' +
              '<span class="comment-text">' + escapeHTML(text) + '</span>' +
            '</div>' +
          '</div>'
        );
      }

      var toggleBtn = document.querySelector('.comment-toggle-btn[data-id="' + postId + '"]');
      if (toggleBtn) {
        var cEl = toggleBtn.querySelector('.comment-count');
        if (cEl) cEl.textContent = parseInt(cEl.textContent || 0) + 1;
      }
    } else {
      showToast(data.message || 'Error posting comment', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Post'; }
    }
  } catch (e) {
    showToast('Error posting comment', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Post'; }
  }
}

/* ══════════════════════════════════════════════════════════
   CREATE POST  (supports text + optional media)
   ══════════════════════════════════════════════════════ */
var postBtn = document.getElementById('post-btn');
if (postBtn) {
  postBtn.addEventListener('click', async function () {
    var content = postTextarea ? postTextarea.value.trim() : '';
    var file    = mediaInput  ? mediaInput.files[0] : null;

    if (!content && !file) {
      showToast('Add some text or a photo/video', 'error');
      return;
    }

    postBtn.disabled  = true;
    postBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Posting…';

    try {
      var formData = new FormData();
      if (content) formData.append('content', content);
      if (file)    formData.append('media',   file);

      var res  = await fetch(API + '/posts', {
        method:  'POST',
        headers: authHeaders(),   // NO Content-Type — let browser set multipart boundary
        body:    formData,
      });
      var data = await res.json();

      if (res.ok) {
        if (postTextarea) { postTextarea.value = ''; autoResize(postTextarea); }
        if (charCount)    charCount.textContent = '0 / 500';
        if (removeMedia)  removeMedia.click();    // reset media preview
        showToast('Posted! 🎉');
        loadPosts();
      } else {
        showToast(data.message || 'Error creating post', 'error');
      }
    } catch (e) { showToast('Error creating post', 'error'); }

    postBtn.disabled  = false;
    postBtn.innerHTML = 'Post';
  });
}

/* ══════════════════════════════════════════════════════════
   SEARCH
   ══════════════════════════════════════════════════════ */
var searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', function (e) {
    var term = e.target.value.toLowerCase().trim();
    if (!term) { renderFeed(allPostsData); return; }
    renderFeed(allPostsData.filter(function (p) {
      return (p.content && p.content.toLowerCase().includes(term)) ||
             (p.userId && p.userId.username && p.userId.username.toLowerCase().includes(term));
    }));
  });
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════ */
function loadSidebar() {
  if (!userId) return;
  fetch(API + '/users/' + userId)
    .then(function (r) { return r.json(); })
    .then(function (user) {
      function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
      set('sidebar-avatar',    avatarInitial);
      set('sidebar-username',  user.username || '');
      set('sidebar-handle',    '@' + (user.username || ''));
      set('sidebar-followers', (user.followers || []).length);
      set('sidebar-following', (user.following || []).length);

      function renderList(id, arr, emptyMsg) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!arr || !arr.length) { el.innerHTML = '<div class="sidebar-empty">' + emptyMsg + '</div>'; return; }
        el.innerHTML = arr.map(function (f) {
          return '<div class="sidebar-user">' +
            '<div class="su-avatar">' + (f.username ? f.username[0].toUpperCase() : '?') + '</div>' +
            '<a class="su-name" href="profile.html?id=' + f._id + '">@' + escapeHTML(f.username) + '</a>' +
          '</div>';
        }).join('');
      }
      renderList('followers-list', user.followers, 'No followers yet');
      renderList('following-list', user.following, 'Not following anyone');
    })
    .catch(function (e) { console.error('loadSidebar:', e); });
}

/* ══════════════════════════════════════════════════════════
   NOTIFICATION BADGE POLLING
   ══════════════════════════════════════════════════════ */
function pollNotifications() {
  if (!token) return;
  fetch(API + '/notifications/unread-count', { headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var badge = document.getElementById('notif-badge');
      var count = data.count || 0;
      if (!badge) return;
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    })
    .catch(function () { /* silent */ });
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
loadPosts();
loadSidebar();
pollNotifications();
setInterval(pollNotifications, 45000);
