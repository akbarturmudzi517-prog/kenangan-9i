// State Management
let mediaItems = JSON.parse(localStorage.getItem('smp_memories')) || [];
let currentFilter = 'all';

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

// Simpan data ke LocalStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem('smp_memories', JSON.stringify(mediaItems));
  } catch (e) {
    alert('Penyimpanan penuh! Gunakan foto/video dengan ukuran yang lebih kecil.');
  }
}

// Handle File Upload & Konversi ke Base64 (agar bisa disimpan)
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
        url: event.target.result, // Mengubah file jadi string Base64
        title: file.name.split('.')[0],
        description: '',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      mediaItems.unshift(mediaObj);
      saveToLocalStorage();
      renderGallery();
    };

    reader.readAsDataURL(file);
  });

  mediaInput.value = '';
});

// Render Gallery Elements
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

// Filter Media Function
function filterMedia(type) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event) event.target.classList.add('active');
  renderGallery();
}

function updateItemTitle(id, newTitle) {
  const item = mediaItems.find(i => i.id === id);
  if (item) {
    item.title = newTitle;
    saveToLocalStorage();
  }
}

function updateItemDesc(id, newDesc) {
  const item = mediaItems.find(i => i.id === id);
  if (item) {
    item.description = newDesc;
    saveToLocalStorage();
  }
}

function deleteItem(id) {
  if (confirm('Apakah kamu yakin ingin menghapus kenangan ini?')) {
    mediaItems = mediaItems.filter(i => i.id !== id);
    saveToLocalStorage();
    renderGallery();
  }
}

function clearAllMedia() {
  if (mediaItems.length === 0) return;
  if (confirm('Apakah kamu yakin ingin menghapus SELURUH kenangan di galeri?')) {
    mediaItems = [];
    localStorage.removeItem('smp_memories');
    renderGallery();
  }
}

// Lightbox Handler
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

// Load Demo Preset Data
function loadDemoData() {
  const demoData = [
    {
      id: 'demo_1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      title: 'Sahabat Seperjuangan Kelas 9B',
      description: 'Foto pas waktu syukuran kelulusan dan coret-coret kaos belakang sekolah. Momen paling nggak bisa dilupain!',
      date: '12 Jun 2024'
    },
    {
      id: 'demo_2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      title: 'Kantin Mbok Sri Pas Istirahat',
      description: 'Jam istirahat kedua rebutan gorengan hangat sama es teh manis bareng geng cowok.',
      date: '18 Jan 2024'
    }
  ];

  mediaItems = [...demoData, ...mediaItems];
  saveToLocalStorage();
  renderGallery();
}

function escapeHtml(text) {
  return text ? text.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : '';
}

// Initialize Gallery
renderGallery();
