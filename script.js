// State Management
let mediaItems = [];
let currentFilter = 'all';
let db;

// DOM Elements
const mediaInput = document.getElementById('mediaInput');
const galleryGrid = document.getElementById('galleryGrid');
const emptyState = document.getElementById('emptyState');
const totalCountEl = document.getElementById('totalCount');
const photoCountEl = document.getElementById('photoCount');
const videoCountEl = document.getElementById('videoCount');
const lightbox = document.getElementById('lightbox');
const lightboxContainer = document.getElementById('lightboxMediaContainer');
const lightboxCaption = document.getElementById('lightboxCaption');

// 1. Inisialisasi IndexedDB (Penyimpanan Besar)
const request = indexedDB.open('SMPMemoriesDB', 1);

request.onupgradeneeded = function(e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains('memories')) {
    db.createObjectStore('memories', { keyPath: 'id' });
  }
};

request.onsuccess = function(e) {
  db = e.target.result;
  loadFromIndexedDB();
};

request.onerror = function() {
  alert('Gagal membuka database penyimpanan browser.');
};

// 2. Fungsi Simpan & Ambil Data dari IndexedDB
function saveToIndexedDB(item) {
  const transaction = db.transaction(['memories'], 'readwrite');
  const store = transaction.objectStore('memories');
  store.put(item);
}

function removeFromIndexedDB(id) {
  const transaction = db.transaction(['memories'], 'readwrite');
  const store = transaction.objectStore('memories');
  store.delete(id);
}

function clearIndexedDB() {
  const transaction = db.transaction(['memories'], 'readwrite');
  const store = transaction.objectStore('memories');
  store.clear();
}

function loadFromIndexedDB() {
  const transaction = db.transaction(['memories'], 'readonly');
  const store = transaction.objectStore('memories');
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    mediaItems = getAll.result || [];
    renderGallery();
  };
}

// 3. Handle File Upload
mediaInput.addEventListener('change', function(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = function(event) {
      const mediaObj = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: isVideo ? 'video' : 'image',
        url: event.target.result,
        title: file.name.split('.')[0],
        description: '',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      mediaItems.unshift(mediaObj);
      saveToIndexedDB(mediaObj);
      renderGallery();
    };

    reader.readAsDataURL(file);
  });

  mediaInput.value = '';
});

// 4. Render Tampilan Galeri
function renderGallery() {
  const filtered = mediaItems.filter(item => {
    if (currentFilter === 'all') return true;
    return item.type === currentFilter;
  });

  totalCountEl.textContent = mediaItems.length;
  photoCountEl.textContent = mediaItems.filter(i => i.type === 'image').length;
  videoCountEl.textContent = mediaItems.filter(i => i.type === 'video').length;

  if (filtered.length === 0) {
    galleryGrid.innerHTML = '';
    galleryGrid.appendChild(emptyState);
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  galleryGrid.innerHTML = '';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.id = item.id;

    const mediaTagHtml = item.type === 'video' 
      ? `<div class="media-tag"><i class="fa-solid fa-video"></i> Video</div>`
      : `<div class="media-tag"><i class="fa-solid fa-camera"></i> Foto</div>`;

    const mediaElementHtml = item.type === 'video'
      ? `<video src="${item.url}" controls preload="metadata"></video>`
      : `<img src="${item.url}" alt="${item.title}" onclick="openLightbox('${item.url}', 'image', '${escapeHtml(item.title)}')">`;

    card.innerHTML = `
      <div class="media-wrapper">
        ${mediaTagHtml}
        ${mediaElementHtml}
      </div>
      <div class="card-content">
        <input type="text" class="card-title-input" value="${escapeHtml(item.title)}" placeholder="Judul kenangan..." onchange="updateItemTitle('${item.id}', this.value)">
        <textarea class="card-desc-input" placeholder="Tuliskan cerita menarik di balik foto/video ini..." onchange="updateItemDesc('${item.id}', this.value)">${escapeHtml(item.description)}</textarea>
        <div class="card-footer">
          <span class="date-stamp"><i class="fa-regular fa-calendar-days"></i> ${item.date}</span>
          <button class="action-icon-btn" onclick="deleteItem('${item.id}')" title="Hapus Media">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;

    galleryGrid.appendChild(card);
  });
}

// 5. Fitur Tambahan & Kontrol
function filterMedia(type) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (window.event) window.event.target.classList.add('active');
  renderGallery();
}

function updateItemTitle(id, newTitle) {
  const item = mediaItems.find(i => i.id === id);
  if (item) {
    item.title = newTitle;
    saveToIndexedDB(item);
  }
}

function updateItemDesc(id, newDesc) {
  const item = mediaItems.find(i => i.id === id);
  if (item) {
    item.description = newDesc;
    saveToIndexedDB(item);
  }
}

function deleteItem(id) {
  if (confirm('Apakah kamu yakin ingin menghapus kenangan ini?')) {
    mediaItems = mediaItems.filter(i => i.id !== id);
    removeFromIndexedDB(id);
    renderGallery();
  }
}

function clearAllMedia() {
  if (mediaItems.length === 0) return;
  if (confirm('Apakah kamu yakin ingin menghapus SELURUH kenangan di galeri?')) {
    mediaItems = [];
    clearIndexedDB();
    renderGallery();
  }
}

function openLightbox(url, type, caption) {
  lightboxContainer.innerHTML = '';
  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    lightboxContainer.appendChild(img);
  }
  lightboxCaption.textContent = caption;
  lightbox.classList.add('active');
}

function closeLightbox(e) {
  if (e.target === lightbox || e.target.closest('.lightbox-close')) {
    lightbox.classList.remove('active');
  }
}

function loadDemoData() {
  const demoData = [
    {
      id: 'demo_1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      title: 'Sahabat Seperjuangan Kelas 9B',
      description: 'Foto pas waktu syukuran kelulusan dan coret-coret kaos belakang sekolah.',
      date: '12 Jun 2024'
    }
  ];

  demoData.forEach(item => {
    mediaItems.unshift(item);
    saveToIndexedDB(item);
  });
  renderGallery();
}

function escapeHtml(text) {
  return text ? text.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : '';
}
