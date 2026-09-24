/* ═══════════════════════════════════════════
   BOZDEMIR TASARIM — js/admin.js
   ═══════════════════════════════════════════ */
'use strict';

/* ── State ──────────────────────────────────── */
const state = {
  projects:      [],
  config:        { passwordHash: '', contact: {} },
  editingId:     null,
  // Her eleman: { path: string } (mevcut) veya { file: File, preview: string } (bekleyen)
  editingImages: [],
};

/* ── DOM helpers ─────────────────────────────── */
const $ = id => document.getElementById(id);

/* ── API ─────────────────────────────────────── */
async function apiFetch(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

/* ── Toast ───────────────────────────────────── */
let toastTimer;
function toast(msg, type = 'success') {
  const el = $('toast');
  el.textContent = msg;
  el.className   = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

/* ── Normalize project: images[] ─────────────── */
function normalizeProject(p) {
  if (!p.images) {
    p.images = p.image ? [p.image] : [];
    delete p.image;
  }
  return p;
}

/* ── Tab switching ───────────────────────────── */
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-pane').forEach(el => {
    const isActive = el.id === `tab-${tab}`;
    el.classList.toggle('hidden', !isActive);
  });
  if (tab === 'contact') fillContactForm();
}

/* ── Auth ────────────────────────────────────── */
function checkSession() { return sessionStorage.getItem('bdAdmin') === 'ok'; }
function startSession()  { sessionStorage.setItem('bdAdmin', 'ok'); }
function endSession()    {
  sessionStorage.removeItem('bdAdmin');
  fetch('api/logout.php', { method: 'POST' }).finally(() => location.reload());
}

async function handleLogin() {
  const input = $('passwordInput').value.trim();
  if (!input) return;
  try {
    const res = await apiFetch('POST', 'api/login.php', { password: input });
    if (res.ok) {
      startSession();
      showPanel();
    } else {
      $('loginError').textContent = res.error || 'Hatalı şifre.';
    }
  } catch {
    $('loginError').textContent = 'Sunucuya bağlanılamadı.';
  }
}

/* ── Load data ───────────────────────────────── */
async function loadData() {
  const [projRes, cfgRes] = await Promise.all([
    fetch('api/projects.php'),
    fetch('api/config.php'),
  ]);
  if (projRes.status === 401 || cfgRes.status === 401) { endSession(); return; }
  const projData = await projRes.json();
  const cfgData  = await cfgRes.json();
  state.projects = (projData.projects || []).map(normalizeProject);
  state.config   = cfgData;
}

/* ── Save projects ───────────────────────────── */
async function saveProjects() {
  await apiFetch('POST', 'api/projects.php', { projects: state.projects });
}

/* ── Render project list ─────────────────────── */
function renderProjects() {
  const list  = $('projectsList');
  const count = state.projects.length;
  $('projectCount').textContent = `${count} proje`;

  if (count === 0) {
    list.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text-3);font-size:0.85rem">
      Henüz proje eklenmemiş. "Yeni Proje" butonuna tıklayarak başla.
    </div>`;
    return;
  }

  list.innerHTML = state.projects.map(p => {
    const cover  = p.images[0] || '';
    const count  = p.images.length;
    const badge  = { 'dis-mekan': 'Dış Mekan', 'ic-mekan': 'İç Mekan', 'konsept': 'Konsept' }[p.category] || p.category;
    const thumb  = cover
      ? `<img class="project-thumb" src="${cover}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const ph     = `<div class="project-thumb-placeholder" ${cover ? 'style="display:none"' : ''}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>`;

    return `<div class="project-row" data-id="${p.id}">
      <span class="drag-handle" title="Sürükle">
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none"><circle cx="3" cy="2" r="1.5" fill="currentColor"/><circle cx="9" cy="2" r="1.5" fill="currentColor"/><circle cx="3" cy="8" r="1.5" fill="currentColor"/><circle cx="9" cy="8" r="1.5" fill="currentColor"/><circle cx="3" cy="14" r="1.5" fill="currentColor"/><circle cx="9" cy="14" r="1.5" fill="currentColor"/></svg>
      </span>
      ${thumb}${ph}
      <div class="project-info">
        <div class="project-info-name">${p.name}</div>
        <div class="project-info-meta">${p.location} · ${p.year} · ${count} görsel</div>
      </div>
      <span class="project-badge badge-${p.category}">${badge}</span>
      <div class="project-actions">
        <button class="icon-btn edit-btn" data-id="${p.id}" title="Düzenle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn delete delete-btn" data-id="${p.id}" title="Sil">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => openModal(state.projects.find(p => p.id === btn.dataset.id)))
  );
  list.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => openConfirmDelete(btn.dataset.id))
  );

  if (window.Sortable && count > 1) {
    Sortable.create(list, {
      animation: 150,
      handle: '.drag-handle',
      onEnd() {
        const rows     = list.querySelectorAll('.project-row');
        const newOrder = Array.from(rows)
          .map(row => state.projects.find(p => p.id === row.dataset.id))
          .filter(Boolean);
        state.projects = newOrder;
        saveProjects();
      },
    });
  }
}

/* ── Image grid (modal) ──────────────────────── */
function renderImagesGrid() {
  const grid = $('imagesGrid');
  grid.innerHTML = state.editingImages.map((item, i) => {
    const src     = item.preview || `${item.path}`;
    const isCover = i === 0;
    return `<div class="image-thumb-wrap${isCover ? ' is-cover' : ''}" data-index="${i}">
      <img src="${src}" alt="Görsel ${i + 1}" />
      ${isCover ? '<span class="image-cover-badge">Kapak</span>' : ''}
      <button class="image-thumb-remove" data-index="${i}" title="Kaldır">×</button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.image-thumb-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      state.editingImages.splice(idx, 1);
      renderImagesGrid();
    });
  });

  if (window.Sortable && state.editingImages.length > 1) {
    Sortable.create(grid, {
      animation: 150,
      filter: '.image-thumb-remove',
      preventOnFilter: false,
      onEnd() {
        const wraps    = grid.querySelectorAll('.image-thumb-wrap');
        const newOrder = Array.from(wraps)
          .map(w => state.editingImages[parseInt(w.dataset.index)])
          .filter(Boolean);
        state.editingImages = newOrder;
        renderImagesGrid();
      },
    });
  }
}

/* ── Handle file selection ───────────────────── */
function addImageFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      state.editingImages.push({ file, preview: e.target.result });
      renderImagesGrid();
    };
    reader.readAsDataURL(file);
  });
}

/* ── Upload one pending image ────────────────── */
async function uploadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const ext      = file.name.split('.').pop().toLowerCase();
      const filename = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      try {
        const res = await apiFetch('POST', 'api/upload.php', { filename, data: e.target.result });
        if (res.ok) resolve(res.path);
        else reject(new Error('Yükleme başarısız'));
      } catch (err) { reject(err); }
    };
    reader.readAsDataURL(file);
  });
}

/* ── Modal open/close ────────────────────────── */
function openModal(project = null) {
  state.editingId = project ? project.id : null;

  state.editingImages = project
    ? project.images.map(path => ({ path }))
    : [];

  $('modalTitle').textContent  = project ? 'Projeyi Düzenle' : 'Yeni Proje';
  $('modalName').value         = project?.name        || '';
  $('modalLocation').value     = project?.location    || '';
  $('modalYear').value         = project?.year        || new Date().getFullYear();
  $('modalDescription').value  = project?.description || '';
  $('modalCategory').value     = project?.category    || 'dis-mekan';
  $('saveBtnText').textContent = 'Kaydet';

  renderImagesGrid();
  $('projectModal').classList.remove('hidden');
  $('modalName').focus();
}

function closeModal() {
  $('projectModal').classList.add('hidden');
  $('imageInput').value = '';
}

/* ── Save project ────────────────────────────── */
async function handleSaveProject() {
  const name = $('modalName').value.trim();
  if (!name) { toast('Proje adı zorunludur.', 'error'); return; }

  const btn = $('saveProjectBtn');
  btn.disabled = true;
  $('saveBtnText').textContent = 'Kaydediliyor…';

  try {
    // Upload any pending files, keep existing paths
    const imagePaths = await Promise.all(
      state.editingImages.map(item =>
        item.file ? uploadImageFile(item.file) : Promise.resolve(item.path)
      )
    );

    const project = {
      id:          state.editingId || `proj-${Date.now()}`,
      name,
      location:    $('modalLocation').value.trim(),
      year:        $('modalYear').value.trim(),
      category:    $('modalCategory').value,
      description: $('modalDescription').value.trim(),
      images:      imagePaths,
    };

    if (state.editingId) {
      const idx = state.projects.findIndex(p => p.id === state.editingId);
      if (idx !== -1) state.projects[idx] = project;
    } else {
      state.projects.push(project);
    }

    await saveProjects();
    closeModal();
    renderProjects();
    toast(state.editingId ? 'Proje güncellendi.' : 'Proje eklendi.');
  } catch (err) {
    toast('Hata: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    $('saveBtnText').textContent = 'Kaydet';
  }
}

/* ── Delete project ──────────────────────────── */
let deletingId = null;

function openConfirmDelete(id) {
  deletingId = id;
  const p = state.projects.find(p => p.id === id);
  $('deleteProjectName').textContent = p ? p.name : '';
  $('confirmModal').classList.remove('hidden');
}

async function handleConfirmDelete() {
  const project = state.projects.find(p => p.id === deletingId);
  state.projects = state.projects.filter(p => p.id !== deletingId);
  await saveProjects();
  if (project && project.images && project.images.length > 0) {
    try { await apiFetch('POST', 'api/delete.php', { images: project.images }); } catch {}
  }
  $('confirmModal').classList.add('hidden');
  renderProjects();
  toast('Proje silindi.');
  deletingId = null;
}

/* ── Contact form ────────────────────────────── */
function fillContactForm() {
  const c = state.config.contact || {};
  $('contactEmail').value     = c.email     || '';
  $('contactPhone').value     = c.phone     || '';
  $('contactLocation').value  = c.location  || '';
  $('contactInstagram').value = c.instagram || '';
  $('contactLinkedin').value  = c.linkedin  || '';
  $('contactBehance').value   = c.behance   || '';
}

async function handleSaveContact() {
  state.config.contact = {
    email:     $('contactEmail').value.trim(),
    phone:     $('contactPhone').value.trim(),
    location:  $('contactLocation').value.trim(),
    instagram: $('contactInstagram').value.trim(),
    linkedin:  $('contactLinkedin').value.trim(),
    behance:   $('contactBehance').value.trim(),
  };
  try {
    await apiFetch('POST', 'api/config.php', { contact: state.config.contact });
    toast('İletişim bilgileri kaydedildi.');
  } catch {
    toast('Kaydetme başarısız.', 'error');
  }
}

/* ── Password change ─────────────────────────── */
async function handleSavePassword() {
  const current = $('currentPassword').value;
  const next    = $('newPassword').value;
  const next2   = $('newPassword2').value;
  const msg     = $('passwordSaveMsg');

  if (!current)                 { msg.style.color = 'var(--danger)'; msg.textContent = 'Mevcut şifreyi girin.'; return; }
  if (!next || next.length < 4) { msg.style.color = 'var(--danger)'; msg.textContent = 'En az 4 karakter.'; return; }
  if (next !== next2)           { msg.style.color = 'var(--danger)'; msg.textContent = 'Şifreler eşleşmiyor.'; return; }

  try {
    const res = await apiFetch('POST', 'api/password.php', { currentPassword: current, newPassword: next });
    if (res.ok) {
      msg.style.color = 'var(--success)';
      msg.textContent = 'Şifre güncellendi.';
      ['currentPassword', 'newPassword', 'newPassword2'].forEach(id => $(id).value = '');
      setTimeout(() => { msg.textContent = ''; }, 3000);
    } else {
      msg.style.color = 'var(--danger)';
      msg.textContent = res.error || 'Hata oluştu.';
    }
  } catch {
    msg.style.color = 'var(--danger)';
    msg.textContent = 'Sunucuya bağlanılamadı.';
  }
}

/* ── Show panel ──────────────────────────────── */
async function showPanel() {
  $('loginScreen').classList.add('hidden');
  await loadData();
  $('adminPanel').classList.remove('hidden');
  renderProjects();
}

/* ── Event bindings ──────────────────────────── */
function bindEvents() {
  $('loginBtn').addEventListener('click', handleLogin);
  $('passwordInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  document.querySelectorAll('.nav-item').forEach(el =>
    el.addEventListener('click', () => switchTab(el.dataset.tab))
  );

  $('logoutBtn').addEventListener('click', endSession);
  $('addProjectBtn').addEventListener('click', () => openModal());

  // Görsel seçimi
  $('imageInput').addEventListener('change', e => {
    addImageFiles(e.target.files);
    e.target.value = '';
  });

  // Drag & drop görseller grid üzerine
  const grid = $('imagesGrid');
  grid.addEventListener('dragover', e => e.preventDefault());
  grid.addEventListener('drop', e => {
    e.preventDefault();
    addImageFiles(e.dataTransfer.files);
  });

  // Modal
  $('closeModalBtn').addEventListener('click', closeModal);
  $('cancelModalBtn').addEventListener('click', closeModal);
  $('saveProjectBtn').addEventListener('click', handleSaveProject);
  $('projectModal').addEventListener('click', e => { if (e.target === $('projectModal')) closeModal(); });

  // Delete confirm
  $('cancelDeleteBtn').addEventListener('click', () => $('confirmModal').classList.add('hidden'));
  $('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);
  $('confirmModal').addEventListener('click', e => { if (e.target === $('confirmModal')) $('confirmModal').classList.add('hidden'); });

  // Contact & settings
  $('saveContactBtn').addEventListener('click', handleSaveContact);
  $('savePasswordBtn').addEventListener('click', handleSavePassword);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); $('confirmModal').classList.add('hidden'); }
  });
}

/* ── Init ────────────────────────────────────── */
async function init() {
  bindEvents();
  if (checkSession()) await showPanel();
}

init();
