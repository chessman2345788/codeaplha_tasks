/* ============================================================
   profile.js — SocialApp Profile Page
   ============================================================ */
'use strict';

var API        = '/api';
var myUserId   = localStorage.getItem('userId');
var myUsername = localStorage.getItem('username');
var token      = localStorage.getItem('token');

var params        = new URLSearchParams(window.location.search);
var profileUserId = params.get('id') || myUserId;
var isOwnProfile  = profileUserId === myUserId;

var currentUserData = null;

/* ── Helpers ──────────────────────────────────────────── */
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

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

/* ══════════════════════════════════════════════════════════
   LOAD PROFILE
   ══════════════════════════════════════════════════════ */
async function loadProfile() {
  try {
    var res  = await fetch(API + '/users/' + profileUserId);
    var user = await res.json();

    if (!res.ok) {
      document.getElementById('profile-card').innerHTML =
        '<div class="empty-state"><div class="empty-icon">❌</div><p class="empty-msg">User not found.</p></div>';
      return;
    }

    currentUserData = user;

    var isFollowing = (user.followers || []).some(function (f) {
      return (f._id || f).toString() === myUserId;
    });

    /* ── Action button ── */
    var actionBtn = '';
    if (isOwnProfile) {
      actionBtn = '<button id="edit-profile-btn" class="btn btn-outline"><i class="fa-solid fa-pen"></i> Edit Profile</button>';
    } else {
      actionBtn = isFollowing
        ? '<button id="follow-btn" class="btn btn-outline following"><i class="fa-solid fa-user-check"></i> Following</button>'
        : '<button id="follow-btn" class="btn btn-primary"><i class="fa-solid fa-user-plus"></i> Follow</button>';
    }

    document.getElementById('profile-card').innerHTML =
      '<div class="profile-cover"></div>' +
      '<div class="profile-body">' +
        '<div class="profile-top">' +
          '<div class="profile-avatar">' + avatarLetter(user.username) + '</div>' +
          '<div class="profile-actions">' + actionBtn + '</div>' +
        '</div>' +
        '<h2 class="profile-username">@' + escapeHTML(user.username) + '</h2>' +
        '<p class="profile-bio" id="profile-bio-text">' + escapeHTML(user.bio || 'No bio yet.') + '</p>' +
        '<div class="profile-stats">' +
          '<div class="stat"><span class="stat-num" id="posts-count">—</span><span class="stat-lbl">Posts</span></div>' +
          '<div class="stat"><span class="stat-num" id="followers-count">' + (user.followers || []).length + '</span><span class="stat-lbl">Followers</span></div>' +
          '<div class="stat"><span class="stat-num">' + (user.following || []).length + '</span><span class="stat-lbl">Following</span></div>' +
        '</div>' +
      '</div>';

    if (isOwnProfile) attachEditListener();
    else attachFollowListener();

    loadUserPosts();

  } catch (err) {
    console.error('loadProfile:', err);
    showToast('Could not load profile', 'error');
  }
}

/* ══════════════════════════════════════════════════════════
   FOLLOW / UNFOLLOW
   ══════════════════════════════════════════════════════ */
function attachFollowListener() {
  var btn = document.getElementById('follow-btn');
  if (!btn) return;

  btn.addEventListener('click', async function () {
    btn.disabled = true;
    try {
      var res  = await fetch(API + '/users/' + profileUserId + '/follow', {
        method: 'PUT', headers: authHeaders()
      });
      var data = await res.json();

      if (res.ok) {
        var isNowFollowing = !btn.classList.contains('following');
        var countEl = document.getElementById('followers-count');

        if (isNowFollowing) {
          btn.innerHTML = '<i class="fa-solid fa-user-check"></i> Following';
          btn.className = 'btn btn-outline following';
          if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
          showToast('Followed! 🎉');
        } else {
          btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
          btn.className = 'btn btn-primary';
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
          showToast('Unfollowed');
        }
      } else {
        showToast(data.message || 'Error', 'error');
      }
    } catch (err) {
      showToast('Error. Try again.', 'error');
    }
    btn.disabled = false;
  });
}

/* ══════════════════════════════════════════════════════════
   EDIT PROFILE MODAL
   ══════════════════════════════════════════════════════ */
function attachEditListener() {
  var btn          = document.getElementById('edit-profile-btn');
  var modal        = document.getElementById('edit-profile-modal');
  var closeBtn     = document.getElementById('close-modal-btn');
  var cancelBtn    = document.getElementById('cancel-edit-btn');
  var saveBtn      = document.getElementById('save-profile-btn');
  var bioInput     = document.getElementById('edit-bio');
  var bioCharCount = document.getElementById('bio-char-count');

  if (!btn || !modal) return;

  function openModal() {
    if (bioInput) bioInput.value = currentUserData.bio || '';
    if (bioCharCount) bioCharCount.textContent = (bioInput ? bioInput.value.length : 0) + ' / 160';
    modal.classList.remove('hidden');
    modal.classList.add('open');
  }
  function closeModal() { modal.classList.add('hidden'); modal.classList.remove('open'); }

  btn.addEventListener('click', openModal);
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (bioInput && bioCharCount) {
    bioInput.addEventListener('input', function () {
      bioCharCount.textContent = bioInput.value.length + ' / 160';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      var bioText = bioInput ? bioInput.value.trim() : '';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        var res  = await fetch(API + '/users/profile/update', {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify({ bio: bioText })
        });
        var data = await res.json();
        if (res.ok) {
          showToast('Profile updated!');
          currentUserData = data.user;
          var bioEl = document.getElementById('profile-bio-text');
          if (bioEl) bioEl.textContent = currentUserData.bio || 'No bio yet.';
          closeModal();
        } else {
          showToast(data.message || 'Failed to update', 'error');
        }
      } catch (err) {
        showToast('Failed to update profile', 'error');
      }
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    });
  }
}

/* ══════════════════════════════════════════════════════════
   LOAD USER POSTS
   BUG FIX: API now returns { posts:[...] } — was treating
   the object as an array causing crash on .length
   ══════════════════════════════════════════════════════ */
async function loadUserPosts() {
  var container = document.getElementById('user-posts-container');
  var heading   = document.getElementById('posts-heading');

  try {
    var res  = await fetch(API + '/posts?userId=' + profileUserId);
    var data = await res.json();

    // Handle both old (array) and new (paginated object) shapes
    var userPosts = Array.isArray(data) ? data : (data.posts || []);

    var countEl = document.getElementById('posts-count');
    if (countEl) countEl.textContent = userPosts.length;

    if (heading) heading.classList.remove('hidden');

    if (!userPosts.length) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📭</div><p class="empty-msg">No posts yet.</p></div>';
      return;
    }

    container.innerHTML = userPosts.map(function (post) {
      var author  = post.userId;
      var name    = (author && author.username) ? author.username : 'Unknown';
      var likes   = post.likes || [];
      var cArr    = post.comments || [];
      var isLiked = likes.some(function (id) { return (id._id || id).toString() === myUserId; });

      var commentsHTML = cArr.map(function (c) {
        var cu = (c.userId && c.userId.username) ? c.userId.username : 'User';
        return '<div class="comment-item">' +
          '<div class="comment-avatar">' + avatarLetter(cu) + '</div>' +
          '<div class="comment-bubble">' +
            '<span class="comment-name">' + escapeHTML(cu) + '</span>' +
            '<span class="comment-text">' + escapeHTML(c.text) + '</span>' +
          '</div></div>';
      }).join('');

      var deleteBtn = isOwnProfile
        ? '<button class="delete-post-btn icon-btn" data-id="' + post._id + '" title="Delete post"><i class="fa-solid fa-trash-can"></i></button>'
        : '';

      return (
        '<div class="post-card" data-id="' + post._id + '">' +
          '<div class="post-header">' +
            '<div class="post-avatar">' + avatarLetter(name) + '</div>' +
            '<div class="post-meta">' +
              '<span class="post-author">@' + escapeHTML(name) + '</span>' +
              '<span class="post-time">' + timeAgo(post.createdAt) + '</span>' +
            '</div>' +
            deleteBtn +
          '</div>' +
          '<div class="post-body">' + escapeHTML(post.content) + '</div>' +
          '<div class="post-actions">' +
            '<button class="action-btn like-btn' + (isLiked ? ' liked' : '') + '" data-id="' + post._id + '">' +
              '<i class="' + (isLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
              '<span class="like-count">' + likes.length + '</span>' +
            '</button>' +
            '<button class="action-btn comment-toggle-btn" data-id="' + post._id + '">' +
              '<i class="fa-regular fa-comment"></i>' +
              '<span class="comment-count">' + cArr.length + '</span>' +
            '</button>' +
          '</div>' +
          '<div class="comments-section" id="comments-' + post._id + '">' +
            '<div class="comment-input-row">' +
              '<div class="comment-avatar">' + avatarLetter(myUsername) + '</div>' +
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
    }).join('');

    attachPostListeners();

  } catch (err) {
    console.error('loadUserPosts:', err);
    if (container) container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div><p class="empty-msg">Could not load posts.</p></div>';
  }
}

/* ══════════════════════════════════════════════════════════
   POST LISTENERS (profile page)
   ══════════════════════════════════════════════════════ */
function attachPostListeners() {

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
        var res  = await fetch(API + '/posts/' + postId + '/like', { method: 'PUT', headers: authHeaders() });
        var data = await res.json();
        if (res.ok) {
          if (countEl) countEl.textContent = data.totalLikes;
        } else {
          btn.classList.toggle('liked');
          if (icon)    icon.className = wasLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
          if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + (wasLiked ? 1 : -1);
          showToast(data.message || 'Error', 'error');
        }
      } catch (e) { showToast('Error liking post', 'error'); }
    });
  });

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

  document.querySelectorAll('.submit-comment-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { submitComment(btn.dataset.id); });
  });

  document.querySelectorAll('.comment-input').forEach(function (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var postId = inp.id.replace('comment-input-', '');
      submitComment(postId);
    });
  });

  document.querySelectorAll('.delete-post-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!confirm('Delete this post? This cannot be undone.')) return;
      var postId = btn.dataset.id;
      try {
        var res  = await fetch(API + '/posts/' + postId, { method: 'DELETE', headers: authHeaders() });
        var data = await res.json();
        if (res.ok) {
          showToast('Post deleted');
          var card = document.querySelector('.post-card[data-id="' + postId + '"]');
          if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.95)'; setTimeout(function () { card.remove(); }, 200); }
          var countEl = document.getElementById('posts-count');
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
        } else {
          showToast(data.message || 'Could not delete post', 'error');
        }
      } catch (e) { showToast('Error deleting post', 'error'); }
    });
  });
}

/* ── In-place comment append ──────────────────────── */
async function submitComment(postId) {
  var inp  = document.getElementById('comment-input-' + postId);
  var btn  = document.querySelector('.submit-comment-btn[data-id="' + postId + '"]');
  var text = inp ? inp.value.trim() : '';
  if (!text) { showToast('Comment cannot be empty', 'error'); return; }

  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    var res  = await fetch(API + '/posts/' + postId + '/comment', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ text: text })
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
            '<div class="comment-avatar">' + avatarLetter(myUsername) + '</div>' +
            '<div class="comment-bubble">' +
              '<span class="comment-name">' + escapeHTML(myUsername) + '</span>' +
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
   INIT
   ══════════════════════════════════════════════════════ */
loadProfile();
