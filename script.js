// Initialize variables
let pairings = [];
let editingId = null;
let deletingId = null;
let currentFilter = 'all';
let currentSearch = '';
let uploadMethod = 'file'; // 'file' or 'url'
let selectedFile = null;
let selectedImageUrl = '';
let currentFandomFilter = ''; // New variable for fandom filtering

// Add this after your existing variable declarations
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f5f5f5'/%3E%3Ctext x='200' y='200' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='20'%3E📷 No Image%3C/text%3E%3C/svg%3E";

// DOM Elements
const pairingsGrid = document.getElementById('pairings-grid');
const searchInput = document.getElementById('search-input');
const addModal = document.getElementById('add-modal');
const exportModal = document.getElementById('export-modal');
const importModal = document.getElementById('import-modal');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const pairingForm = document.getElementById('pairing-form');
const fandomList = document.getElementById('fandom-list');

// Load initial data
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromStorage();
    
    // Initialize upload method toggle
    setUploadMethod('file');
    
    // URL input listener
    const imageUrlInput = document.getElementById('input-image-url');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', function() {
            selectedImageUrl = this.value;
            previewImageUrl(this.value);
        });
    }
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        });
    }
});

// Render Fandom Sidebar
function renderFandoms() {
    if (!fandomList) return;
    
    // Get unique fandoms from pairings
    const fandoms = [...new Set(pairings.map(p => p.fandom))].filter(f => f && f.trim() !== '').sort();
    
    let html = `<li class="fandom-item ${currentFandomFilter === '' ? 'active' : ''}" onclick="filterByFandom('')">
        <i class="fas fa-globe"></i> All Fandoms (${pairings.length})
    </li>`;
    
    fandoms.forEach(f => {
        const count = pairings.filter(p => p.fandom === f).length;
        html += `<li class="fandom-item ${currentFandomFilter === f ? 'active' : ''}" onclick="filterByFandom('${escapeString(f)}')">
            <i class="fas fa-tag"></i> ${escapeHtml(f)} (${count})
        </li>`;
    });
    
    fandomList.innerHTML = html;
}

// Filter by fandom
function filterByFandom(fandom) {
    currentFandomFilter = fandom;
    renderFandoms();
    applyFilters();
    
    // Update search input to show filter
    if (searchInput && fandom) {
        searchInput.value = fandom;
        currentSearch = fandom.toLowerCase();
    } else if (searchInput && !fandom) {
        searchInput.value = '';
        currentSearch = '';
    }
}

// Get filtered pairings with fandom filter
function getFilteredPairings() {
    let filtered = [...pairings];
    
    // Apply fandom filter
    if (currentFandomFilter && currentFandomFilter !== '') {
        filtered = filtered.filter(p => p.fandom === currentFandomFilter);
    }
    
    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(currentSearch)) ||
            (p.characters && p.characters.toLowerCase().includes(currentSearch)) ||
            (p.fandom && p.fandom.toLowerCase().includes(currentSearch))
        );
    }

    // Sort alphabetically by Ship Name
    filtered.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    return filtered;
}

function applyFilters() {
    renderPairings(getFilteredPairings());
}

// Load from GitHub/WordPress JSON file
async function loadFromStorage() {
    try {
        const response = await fetch('pairings.json');
        if (response.ok) {
            pairings = await response.json();
            console.log('Loaded from pairings.json:', pairings.length, 'ships');
        } else {
            throw new Error('Failed to fetch pairings.json');
        }
    } catch (e) {
        console.error('Error loading data:', e);
        const saved = localStorage.getItem('fandomShips');
        if (saved) {
            pairings = JSON.parse(saved);
            console.log('Loaded from localStorage:', pairings.length, 'ships');
        } else {
            addSampleData();
        }
    }
    
    // Process images - set image path from ship name if no image exists
    pairings.forEach(p => {
        // Only set auto image if there's NO existing image
        const hasNoImage = !p.image || 
                          p.image === null || 
                          (Array.isArray(p.image) && p.image.length === 0) ||
                          (typeof p.image === 'string' && p.image === '');
        
        if (hasNoImage) {
            // Generate image path from ship name (lowercase)
            const imagePath = `images/${sanitizeFileName(p.name)}.jpg`;
            p.image = [imagePath];
            console.log(`Auto-assigned image for "${p.name}": ${imagePath}`);
        } else if (typeof p.image === 'string' && p.image !== 'null' && p.image !== '') {
            p.image = [p.image];
        } else if (!Array.isArray(p.image)) {
            p.image = [];
        }
    });
    
    renderFandoms();
    renderPairings(getFilteredPairings());
    updateStats();
}

// Helper function to sanitize filename (add this function if not present)
function sanitizeFileName(name) {
    if (!name) return 'default';
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Save to localStorage (Temporary save)
function saveToStorage() {
    localStorage.setItem('fandomShips', JSON.stringify(pairings));
}

// Add sample ships data
function addSampleData() {
    const sampleShips = [
        {
            id: 1,
            name: "Stony",
            characters: "Steve Rogers x Tony Stark",
            fandom: "Marvel Cinematic Universe",
            universe: "From universe",
            status: "Fanon",
            relationship: "Romantic",
            media: "Film Series",
            dynamic: "Opposing Energies",
            trope: "Enemies to Lovers",
            notes: "The loyalty and history between them gets me every time",
            favorite: true,
            image: null,
            addedDate: "2024-01-15"
        },
        {
            id: 2,
            name: "Shinoi",
            characters: "Shin/Noi",
            fandom: "Dorohedoro",
            universe: "From universe",
            status: "Fanon",
            relationship: "Romantic",
            media: "Mixed",
            dynamic: "Similar Energies",
            trope: "Friends to Lovers",
            notes: "☆ power couple yas.",
            favorite: false,
            image: null,
            addedDate: "2026-02-25"
        }
    ];
    
    pairings = sampleShips;
    saveToStorage();
    renderFandoms();
    renderPairings(getFilteredPairings());
    updateStats();
}

// Render pairings
function renderPairings(pairingsToRender = getFilteredPairings()) {
    if (!pairingsGrid) return;
    pairingsGrid.innerHTML = '';
    
    if (pairingsToRender.length === 0) {
        pairingsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-heart-broken" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No ships found</h3>
                <p>Try a different search or add a new ship!</p>
            </div>
        `;
        return;
    }
    
    pairingsToRender.forEach(ship => {
        const card = createShipCard(ship);
        card.style.cursor = 'pointer';
        card.onclick = (e) => { e.stopPropagation(); openShipLightbox(ship); };
        pairingsGrid.appendChild(card);
    });
}

// Create ship card element
function createShipCard(ship) {
    const card = document.createElement('div');
    card.className = 'pairing-card';
    
    // Determine which image to use
    let imageUrl = null;
    if (ship.image && Array.isArray(ship.image)) {
        // Find first existing image
        for (let img of ship.image) {
            if (img && img !== 'null' && img !== '') {
                imageUrl = img;
                break;
            }
        }
    } else if (ship.image && typeof ship.image === 'string' && ship.image !== 'null' && ship.image !== '') {
        imageUrl = ship.image;
    }

// If still no image URL, generate from ship name
if (!imageUrl) {
    imageUrl = `images/${sanitizeFileName(ship.name)}.jpg`;
    console.log(`Using auto-generated image path for ${ship.name}: ${imageUrl}`);
}
    
    let cardHTML = '';
    
    if (ship.favorite) {
        cardHTML += `<div class="favorite-star" style="position:absolute; top:10px; left:10px; color:gold; z-index:5; background: rgba(0,0,0,0.5); padding: 5px 8px; border-radius: 20px;"><i class="fas fa-star"></i> Active</div>`;
    }

if (imageUrl && imageUrl !== 'null' && imageUrl.trim() !== '') {
        cardHTML += `
        <div class="image-container">
            <div class="card-actions">
                <button class="action-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <img src="${imageUrl}" alt="${ship.name}" class="ship-image" onerror="this.style.display='none'">
            <div class="image-overlay">
                <h3 class="pairing-name">${escapeHtml(ship.name)}</h3>
                <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
            </div>
        </div>`;
    } else {
       cardHTML += `
        <div class="image-container">
            <div class="card-actions">
                <button class="action-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${ship.id})">
                    <i class="${ship.favorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openEditModal(${ship.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); openDeleteModal(${ship.id}, '${escapeString(ship.name)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="image-overlay">
                 <i class="fas fa-file"></i>
                <h3 class="pairing-name">${escapeHtml(ship.name)}</h3>
                <p class="pairing-characters">${escapeHtml(ship.characters)}</p>
            </div>
        </div>`;
    }

    if (ship.artist) {
    cardHTML += `
    <div class="artist-credit">
        Art by <i>${escapeHtml(ship.artist)}</i>
    </div>`;
}
    
    cardHTML += `
    <div class="card-body">
        <div class="info-row"><span class="info-label">Fandom:</span><span class="info-value">${escapeHtml(ship.fandom)}</span></div>
        ${ship.media ? `<div class="info-row"><span class="info-label">Media:</span><span class="info-value">${escapeHtml(ship.media)}</span></div>` : ''}
        ${ship.dynamic && ship.dynamic !== 'NA' ? `<div class="info-row"><span class="info-label">Dynamic:</span><span class="info-value">${escapeHtml(ship.dynamic)}</span></div>` : ''}
        ${ship.notes ? `<div class="info-row"><span class="info-label">Notes:</span><span class="info-value">${escapeHtml(ship.notes)}</span></div>` : ''}
        
        <div class="tags-container" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
            <span class="tag"><i class="fas fa-info-circle"></i>${escapeHtml(ship.status || 'Fanon')}</span>
            <span class="tag"><i class="fas fa-heart"></i>${escapeHtml(ship.relationship || 'Romantic')}</span>
            <span class="tag tag-red"><i class="fas fa-calendar-alt"></i>${escapeHtml(ship.yearStarted || '????')}</span>
        </div>
    </div>`;
    
    card.innerHTML = cardHTML;
    return card;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function toggleFavorite(id) {
    const index = pairings.findIndex(p => p.id === id);
    if (index !== -1) {
        pairings[index].favorite = !pairings[index].favorite;
        saveToStorage();
        applyFilters();
        updateStats();
        renderFandoms();
    }
}

function updateStats() {
    const totalCountElem = document.getElementById('total-count');
    const favoriteCountElem = document.getElementById('favorite-count');
    const canonCountElem = document.getElementById('canon-count');
    
    if (totalCountElem) totalCountElem.textContent = pairings.length;
    if (favoriteCountElem) favoriteCountElem.textContent = pairings.filter(p => p.favorite).length;
    if (canonCountElem) canonCountElem.textContent = pairings.filter(p => p.status === 'Canon').length;
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openAddModal() { if (addModal) addModal.style.display = 'flex'; }
function closeAddModal() { if (addModal) addModal.style.display = 'none'; resetForm(); }

function openEditModal(id) {
    const pairing = pairings.find(p => p.id === id);
    if (!pairing) return;
    editingId = id;
    document.getElementById('input-name').value = pairing.name || '';
    document.getElementById('input-characters').value = pairing.characters || '';
    document.getElementById('input-fandom').value = pairing.fandom || '';
    document.getElementById('input-universe').value = pairing.universe || 'From universe';
    document.getElementById('input-status').value = pairing.status || 'Fanon';
    document.getElementById('input-relationship').value = pairing.relationship || 'Romantic';
    document.getElementById('input-year').value = pairing.yearStarted || '';
    document.getElementById('input-artist').value = pairing.artist || '';
    document.getElementById('input-media').value = pairing.media || 'Literature/Books';
    document.getElementById('input-dynamic').value = pairing.dynamic || 'NA';
    document.getElementById('input-trope').value = pairing.trope || 'NA';
    document.getElementById('input-notes').value = pairing.notes || '';
    document.getElementById('input-favorite').checked = pairing.favorite || false;
    
    if (pairing.image && pairing.image !== null) {
        if (Array.isArray(pairing.image) && pairing.image[0]) {
            setUploadMethod('url');
            document.getElementById('input-image-url').value = pairing.image[0];
            previewImageUrl(pairing.image[0]);
        } else if (typeof pairing.image === 'string') {
            setUploadMethod('url');
            document.getElementById('input-image-url').value = pairing.image;
            previewImageUrl(pairing.image);
        }
    }
    openAddModal();
}

function resetForm() {
    editingId = null; selectedFile = null; selectedImageUrl = '';
    if (pairingForm) pairingForm.reset();
    clearImagePreview();
}

function setUploadMethod(method) {
    uploadMethod = method;
    
    const fileOption = document.getElementById('upload-option-file');
    const urlOption = document.getElementById('upload-option-url');
    const fileContainer = document.getElementById('file-upload-container');
    const urlContainer = document.getElementById('url-upload-container');
    
    if (fileOption) fileOption.classList.toggle('active', method === 'file');
    if (urlOption) urlOption.classList.toggle('active', method === 'url');
    if (fileContainer) fileContainer.style.display = method === 'file' ? 'block' : 'none';
    if (urlContainer) urlContainer.style.display = method === 'url' ? 'block' : 'none';
    
    clearImagePreview();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPG, PNG, GIF, WebP)', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    previewImageFile(file);
}

function previewImageFile(file) {
    const reader = new FileReader();
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (previewImg) previewImg.style.display = 'none';
    
    reader.onload = function(e) {
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        }
        if (loadingEl) loadingEl.style.display = 'none';
    };
    
    reader.onerror = function() {
        if (loadingEl) loadingEl.style.display = 'none';
        showToast('Error loading image file', 'error');
    };
    
    reader.readAsDataURL(file);
}

function previewImageUrl(url) {
    if (!url) {
        clearImagePreview();
        return;
    }
    
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (previewImg) previewImg.style.display = 'none';
    
    const testImg = new Image();
    testImg.onload = function() {
        if (previewImg) {
            previewImg.src = url;
            previewImg.style.display = 'block';
        }
        if (loadingEl) loadingEl.style.display = 'none';
    };
    
    testImg.onerror = function() {
        if (loadingEl) loadingEl.style.display = 'none';
        if (previewImg) previewImg.style.display = 'none';
    };
    
    testImg.src = url;
}

function clearImagePreview() {
    const previewImg = document.getElementById('preview-img');
    const loadingEl = document.getElementById('image-loading');
    
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (loadingEl) loadingEl.style.display = 'none';
    selectedFile = null;
    selectedImageUrl = '';
    const fileInput = document.getElementById('input-file');
    const urlInput = document.getElementById('input-image-url');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

function addNewPairing() {
    if (uploadMethod === 'file' && selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => completeSubmission(e.target.result);
        reader.readAsDataURL(selectedFile);
        return;
    } 
    const imageData = uploadMethod === 'url' ? document.getElementById('input-image-url').value : null;
    completeSubmission(imageData || (editingId ? pairings.find(p => p.id === editingId).image : null));
}

function completeSubmission(imageData) {
    const pairingData = {
        id: editingId || Date.now(),
        name: document.getElementById('input-name').value,
        characters: document.getElementById('input-characters').value,
        fandom: document.getElementById('input-fandom').value,
        universe: document.getElementById('input-universe').value,
        status: document.getElementById('input-status').value,
        relationship: document.getElementById('input-relationship').value,
        yearStarted: document.getElementById('input-year').value,
        media: document.getElementById('input-media').value,
        dynamic: document.getElementById('input-dynamic').value,
        trope: document.getElementById('input-trope').value,
        notes: document.getElementById('input-notes').value,
        favorite: document.getElementById('input-favorite').checked,
        image: imageData ? (Array.isArray(imageData) ? imageData : [imageData]) : null,
        artist: document.getElementById('input-artist').value,
        addedDate: new Date().toISOString().split('T')[0]
    };
    
    if (editingId) {
        const index = pairings.findIndex(p => p.id === editingId);
        if (index !== -1) pairings[index] = pairingData;
    } else {
        pairings.unshift(pairingData);
    }
    
    saveToStorage();
    renderFandoms();
    applyFilters();
    updateStats();
    closeAddModal();
    showToast('Ship saved successfully!', 'success');
}

function openDeleteModal(id, name) {
    deletingId = id;
    if (confirmMessage) confirmMessage.textContent = `Delete "${name}"?`;
    if (confirmModal) confirmModal.style.display = 'flex';
}
function closeConfirmModal() { if (confirmModal) confirmModal.style.display = 'none'; }
function confirmDelete() {
    pairings = pairings.filter(p => p.id !== deletingId);
    saveToStorage();
    renderFandoms();
    applyFilters();
    updateStats();
    closeConfirmModal();
    showToast('Ship deleted successfully', 'success');
}

function openExportModal() { 
    const exportText = document.getElementById('export-text');
    if (exportText) {
        exportText.value = JSON.stringify(pairings, null, 2);
    }
    if (exportModal) exportModal.style.display = 'flex';
}

function closeExportModal() { if (exportModal) exportModal.style.display = 'none'; }
function openImportModal() { if (importModal) importModal.style.display = 'flex'; }
function closeImportModal() { if (importModal) importModal.style.display = 'none'; }

function exportData() {
    const dataStr = JSON.stringify(pairings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'pairings.json');
    linkElement.click();
    closeExportModal();
    showToast('Data exported successfully!', 'success');
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            pairings = JSON.parse(e.target.result);
            saveToStorage();
            renderFandoms();
            applyFilters();
            updateStats();
            closeImportModal();
            showToast('Data imported successfully!', 'success');
        } catch (err) {
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

// Close modals when clicking outside
window.onclick = (event) => {
    // Check for existing modals
    if (event.target.classList && event.target.classList.contains('modal')) {
        closeAddModal();
        closeExportModal();
        closeImportModal();
        closeConfirmModal();
    }
    
    // Check for the Lightbox specifically
    const lightbox = document.getElementById('ship-lightbox');
    if (event.target === lightbox) {
        closeShipLightbox();
    }
};

function openShipLightbox(ship) {
    // Get the image URL properly
    let imageUrl = null;
    if (ship.image && Array.isArray(ship.image)) {
        for (let img of ship.image) {
            if (img && img !== 'null' && img !== '') {
                imageUrl = img;
                break;
            }
        }
    } else if (ship.image && typeof ship.image === 'string' && ship.image !== 'null') {
        imageUrl = ship.image;
    }
    
    // Set all the content first
    document.getElementById('pop-name').innerText = ship.name;
    document.getElementById('pop-chars').innerText = ship.characters;
    
    const popImage = document.getElementById('pop-image');
    if (imageUrl) {
        popImage.src = imageUrl;
        popImage.onerror = function() {
            this.onerror = null;
            this.src = PLACEHOLDER_IMAGE;
        };
    } else {
        popImage.src = PLACEHOLDER_IMAGE;
    }
    
    document.getElementById('pop-notes').innerText = ship.notes || "No notes added yet.";
    
    document.getElementById('pop-tags').innerHTML = `
        <span class="tag"><i class="fas fa-info-circle"></i>${ship.status || 'Fanon'}</span>
        <span class="tag"><i class="fas fa-heart"></i>${ship.relationship || 'Romantic'}</span>
        <span class="tag"><i class="fas fa-calendar-alt"></i>${ship.yearStarted || '????'}</span>
    `;
    
    // Show the lightbox
    const lightbox = document.getElementById('ship-lightbox');
    lightbox.style.display = 'flex';
    
    // Prevent the click from bubbling up to the window onclick handler
    event.stopPropagation();
}

function closeShipLightbox() {
    const lightbox = document.getElementById('ship-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
    }
}
