/* === PARTE 1: SUA LÓGICA ORIGINAL DA SIDEBAR === */
// (O código da sua sidebar para os dropdowns permanece o mesmo)
const toggleDropdown = (dropdown, menu, isOpen) => {
    dropdown.classList.toggle("open", isOpen);
    menu.style.height = isOpen ? `${menu.scrollHeight}px` : 0;
  };
  const closeAllDropdowns = () => {
    document.querySelectorAll(".dropdown-container.open").forEach((openDropdown) => {
      toggleDropdown(openDropdown, openDropdown.querySelector(".dropdown-menu"), false);
    });
  };
  document.querySelectorAll(".dropdown-toggle").forEach((dropdownToggle) => {
    dropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const dropdown = dropdownToggle.closest(".dropdown-container");
      const menu = dropdown.querySelector(".dropdown-menu");
      const isOpen = dropdown.classList.contains("open");
      closeAllDropdowns();
      toggleDropdown(dropdown, menu, !isOpen);
    });
  });
  document.querySelectorAll(".sidebar-toggler, .sidebar-menu-button").forEach((button) => {
    button.addEventListener("click", () => {
      closeAllDropdowns();
      document.querySelector(".sidebar").classList.toggle("collapsed");
    });
  });
  if (window.innerWidth <= 1024) document.querySelector(".sidebar").classList.add("collapsed");


/* === PARTE 2: NOVA LÓGICA DE FUNCIONALIDADES (Lista de Presentes, Perfil, etc.) === */

const API_URL = 'https://oneg-6x4j.onrender.com/api';
const DEFAULT_PROFILE_PIC = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDEyYy0yLjc2IDAtNSA-Mi4yNCAtNSA-NXMvMi4yNCAtNSA1IC01IDUgMi4yNCA1IDUgLTIuMjQgNSAtNSA1em0wIDJjMi42NyAwIDggMS4zNCA4IDR2Mkg0di0yYzAtMi42NiA1LjMzIC00IDggLTR6Ii8+PC9zdmc+';

let items = [];
let mangas = [];
let categories = [];
let editingItemId = null;
let userData = null; 

// --- Seletores de Elementos DOM ---
const itemsContainer = document.getElementById('itemsContainer');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const mangaFilterContainer = document.getElementById('mangaFilterContainer');
const mangaFilter = document.getElementById('mangaFilter');
const addItemBtn = document.getElementById('addItemBtn');
const totalValue = document.getElementById('totalValue');
const listTitleElement = document.getElementById('list-title'); 

const sidebarUsername = document.getElementById('sidebar-username');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarProfilePic = document.getElementById('sidebar-profile-pic');
const viewPublicListLink = document.getElementById('viewPublicListLink');
const logoutLink = document.getElementById('logoutLink');

const itemModal = document.getElementById('itemModal');
const changePasswordModal = document.getElementById('changePasswordModal');
const editProfileModal = document.getElementById('editProfileModal');

const changePasswordLink = document.getElementById('changePasswordLink');
const editProfileLink = document.getElementById('editProfileLink');
const editProfilePicLink = document.getElementById('editProfilePicLink'); 

const cancelBtn = document.getElementById('cancelBtn');
const cancelModalBtns = document.querySelectorAll('.cancel-modal-btn');

const modalTitle = document.getElementById('modalTitle');
const itemForm = document.getElementById('itemForm');
const itemCategory = document.getElementById('itemCategory');
const workGroup = document.getElementById('workGroup');
const itemWork = document.getElementById('itemWork');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addMangaBtn = document.getElementById('addMangaBtn');
const categoryPopup = document.getElementById('categoryPopup');
const mangaPopup = document.getElementById('mangaPopup');
const newCategoryName = document.getElementById('newCategoryName');
const newMangaName = document.getElementById('newMangaName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const cancelMangaBtn = document.getElementById('cancelMangaBtn');
const saveMangaBtn = document.getElementById('saveMangaBtn');

const changePasswordForm = document.getElementById('changePasswordForm');

const editProfileForm = document.getElementById('editProfileForm');
const profilePicPreview = document.getElementById('profilePicPreview');
const profilePictureFile = document.getElementById('profilePictureFile'); 
const profilePictureStringInput = document.getElementById('profilePictureString'); 
const uploadStatus = document.getElementById('upload-status'); 
const editUsernameInput = document.getElementById('editUsername');
const editEmailInput = document.getElementById('editEmail');
const isPublicToggle = document.getElementById('isPublicToggle');

// Links Estáticos
const notificationsLink = document.getElementById('notificationsLink');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const supportLink = document.getElementById('supportLink');

// NOVO: Seletor do Modo Escuro
const darkModeToggle = document.getElementById('darkModeToggle');

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', function() {
    if (itemsContainer) {
        initializeApp();
    }
});

async function initializeApp() {
    // 1. Verificar Autenticação
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');
    
    if (!token || !storedUser) {
        alert('Sessão não encontrada. Por favor, faça login.');
        logout();
        return;
    }

    // 2. Carregar dados do usuário (do cache)
    userData = JSON.parse(storedUser);
    
    // 3. Preencher a UI imediatamente com dados do cache
    populateUIWithUserData();

    // 4. Verificar se é o primeiro login (para o prompt do título)
    checkFirstLogin();

    // 5. Adicionar todos os event listeners
    setupEventListeners();

    // 6. NOVO: Aplicar tema (modo escuro/claro)
    applyTheme();

    // 7. Buscar dados da API (itens, categorias, mangás)
    try {
        await Promise.all([
            loadCategories(),
            loadMangas(),
            loadItems()
        ]);
        renderItems();
        updateTotalValue();
    } catch (error) {
        console.error('Erro ao carregar dados da lista:', error);
        alert('Erro ao carregar seus itens: ' + error.message);
    }
    
    // 8. (Opcional) Buscar dados atualizados do perfil em segundo plano
    refreshUserProfile();
}

function setupEventListeners() {
    // Lista de Presentes
    addItemBtn.addEventListener('click', openAddModal);
    cancelBtn.addEventListener('click', closeModal);
    itemForm.addEventListener('submit', saveItem);
    categoryFilter.addEventListener('change', handleCategoryFilterChange);
    statusFilter.addEventListener('change', renderItems);
    searchInput.addEventListener('input', renderItems);
    
    // Título da Lista Editável
    listTitleElement.addEventListener('blur', saveListTitle); 
    listTitleElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            listTitleElement.blur(); 
        }
    });

    // Popups de Categoria/Mangá
    addCategoryBtn.addEventListener('click', openCategoryPopup);
    addMangaBtn.addEventListener('click', openMangaPopup);
    cancelCategoryBtn.addEventListener('click', closeCategoryPopup);
    saveCategoryBtn.addEventListener('click', saveNewCategory);
    cancelMangaBtn.addEventListener('click', closeMangaPopup);
    saveMangaBtn.addEventListener('click', saveNewManga);

    // Sidebar e Modais
    logoutLink.addEventListener('click', logout);
    changePasswordLink.addEventListener('click', openChangePasswordModal);
    editProfileLink.addEventListener('click', openEditProfileModal);
    editProfilePicLink.addEventListener('click', openEditProfileModal); 
    
    // Fechar modais
    cancelModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Forms dos Modais
    changePasswordForm.addEventListener('submit', handleChangePassword);
    editProfileForm.addEventListener('submit', handleEditProfile);
    
    // Evento de Upload de Imagem
    profilePictureFile.addEventListener('change', handleImageFileSelect);
    
    // NOVO: Listener do Modo Escuro
    darkModeToggle.addEventListener('change', toggleTheme);
    
    // Links Estáticos (Placeholders)
    notificationsLink.addEventListener('click', (e) => { e.preventDefault(); alert('Funcionalidade de Notificações em desenvolvimento.'); });
    termsLink.addEventListener('click', (e) => { e.preventDefault(); alert('Página de Termos e Condições em desenvolvimento.'); });
    privacyLink.addEventListener('click', (e) => { e.preventDefault(); alert('Página de Política e Privacidade em desenvolvimento.'); });
    supportLink.addEventListener('click', (e) => { e.preventDefault(); alert('Página de Suporte em desenvolvimento.'); });
    
    viewPublicListLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(`public_list.html?user=${userData.username}`, '_blank');
    });
}

// --- Funções de Perfil e Usuário ---

function populateUIWithUserData() {
    if (!userData) return;
    sidebarUsername.textContent = userData.username;
    sidebarEmail.textContent = userData.email;
    sidebarProfilePic.src = userData.profilePicture || DEFAULT_PROFILE_PIC;
    listTitleElement.textContent = userData.listTitle || `Lista de ${userData.username}`;
    viewPublicListLink.href = `public_list.html?user=${userData.username}`;
}

async function refreshUserProfile() {
    try {
        const freshUser = await fetchWithAuth(`${API_URL}/profile`);
        localStorage.setItem('userData', JSON.stringify(freshUser));
        userData = freshUser;
        populateUIWithUserData();
    } catch (error) {
        console.warn('Não foi possível atualizar os dados do perfil em segundo plano:', error.message);
    }
}

function checkFirstLogin() {
    if (localStorage.getItem('firstLogin') === 'true') {
        setTimeout(() => {
            const newTitle = prompt(
                'Bem-vindo! Parece que é seu primeiro acesso. Que nome você gostaria de dar para a sua lista de presentes?',
                `Lista de Presentes de ${userData.username}`
            );
            
            if (newTitle && newTitle.trim() !== '') {
                listTitleElement.textContent = newTitle.trim();
                saveListTitle(); 
            }
            localStorage.removeItem('firstLogin');
        }, 1000);
    }
}

async function saveListTitle() {
    const newTitle = listTitleElement.textContent.trim();
    if (newTitle === userData.listTitle || newTitle === '') {
        listTitleElement.textContent = userData.listTitle; 
        return;
    }

    try {
        const updatedUser = await fetchWithAuth(`${API_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listTitle: newTitle })
        });
        
        userData.listTitle = updatedUser.listTitle;
        localStorage.setItem('userData', JSON.stringify(userData));
        alert('Título da lista atualizado!');

    } catch (error) {
        alert('Erro ao salvar o título: ' + error.message);
        listTitleElement.textContent = userData.listTitle; 
    }
}

function logout(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('firstLogin');
    localStorage.removeItem('theme'); // Limpa a preferência de tema
    window.location.href = 'index.html'; // Redireciona para o index
}

// --- NOVAS FUNÇÕES DE TEMA (MODO ESCURO) ---

function applyTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }
}

function toggleTheme() {
    if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

// --- Funções dos Modais (Abrir/Fechar) ---

function openAddModal() {
    editingItemId = null;
    modalTitle.textContent = 'Adicionar Novo Item';
    itemForm.reset();
    workGroup.classList.add('hidden');
    itemModal.style.display = 'flex';
}

function openChangePasswordModal(e) {
    e.preventDefault();
    changePasswordForm.reset();
    changePasswordModal.style.display = 'flex';
}

function openEditProfileModal(e) {
    e.preventDefault();
    
    profilePicPreview.src = userData.profilePicture || DEFAULT_PROFILE_PIC;
    profilePictureStringInput.value = userData.profilePicture; 
    profilePictureFile.value = null; 
    uploadStatus.classList.add('hidden'); 
    
    editUsernameInput.value = userData.username;
    editEmailInput.value = userData.email;
    isPublicToggle.checked = userData.isPublic;
    
    editProfileModal.style.display = 'flex';
}

function closeModal() {
    itemModal.style.display = 'none';
    changePasswordModal.style.display = 'none';
    editProfileModal.style.display = 'none';
}

// --- Funções dos Modais (Submissão de Forms) ---

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        return alert('A nova senha e a confirmação não coincidem.');
    }
    if (newPassword.length < 6) {
        return alert('A nova senha deve ter no mínimo 6 caracteres.');
    }

    try {
        const data = await fetchWithAuth(`${API_URL}/profile/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        alert(data.message); // "Senha alterada com sucesso."
        closeModal();
    } catch (error) {
        alert('Erro ao mudar senha: ' + error.message);
    }
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    const updatedProfile = {
        username: editUsernameInput.value,
        email: editEmailInput.value,
        profilePicture: profilePictureStringInput.value || DEFAULT_PROFILE_PIC,
        isPublic: isPublicToggle.checked
    };

    try {
        const updatedUser = await fetchWithAuth(`${API_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile)
        });
        
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        userData = updatedUser;
        populateUIWithUserData();
        
        alert('Perfil atualizado com sucesso!');
        closeModal();
    } catch (error) {
        alert('Erro ao salvar perfil: ' + error.message);
    }
}

function handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Mostrar feedback
    uploadStatus.textContent = 'Processando imagem...';
    uploadStatus.classList.remove('hidden');

    // 2. Criar um leitor de arquivo
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function() {
            // 3. Imagem carregada, vamos redimensioná-la
            const MAX_WIDTH = 800; 
            const MAX_HEIGHT = 800; 

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = width * (MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 

            profilePicPreview.src = dataUrl;
            profilePictureStringInput.value = dataUrl; 
            
            uploadStatus.classList.add('hidden');
        }
    };
    
    reader.onerror = function(error) {
        console.error('Erro ao ler o arquivo:', error);
        alert('Erro ao processar a imagem.');
        uploadStatus.classList.add('hidden');
    };

    reader.readAsDataURL(file);
}


// --- Funções de Requisição (Fetch) ---

// ******* FUNÇÃO CORRIGIDA *******
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        logout(); 
        return Promise.reject(new Error('Token não encontrado.'));
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });

        // --- INÍCIO DA CORREÇÃO ---
        // Verifica o status ANTES de tentar ler o JSON.
        // O status 204 (No Content) é um sucesso, mas não tem corpo.
        if (response.status === 204) {
            return null; // Retorna nulo, que é um sucesso "vazio"
        }

        // Agora é seguro ler o JSON
        const data = await response.json();
        // --- FIM DA CORREÇÃO ---

        if (!response.ok) {
            if (response.status === 401) {
                logout(); 
            }
            throw new Error(data.message || 'Erro de servidor');
        }
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
             // Este erro agora só deve acontecer se o servidor enviar um 500 com HTML
             throw new Error("Erro de comunicação com o servidor.");
        }
        throw error;
    }
}
// ******* FIM DA FUNÇÃO CORRIGIDA *******


// --- Funções da Lista (CRUD, Render, Filtros) ---
// (O restante do seu código JS continua aqui, sem alterações)

async function loadItems() {
    items = await fetchWithAuth(`${API_URL}/items`);
}
async function loadCategories() {
    categories = (await fetchWithAuth(`${API_URL}/categories`)).map(c => c.name);
    populateCategoryFilters();
}
async function loadMangas() {
    mangas = (await fetchWithAuth(`${API_URL}/mangas`)).map(m => m.name);
    populateMangaFilters();
}

function renderItems() {
    const category = categoryFilter.value;
    const status = statusFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    const manga = mangaFilter.value;
    
    let filteredItems = items.filter(item => {
        const matchesCategory = category === '' || item.category === category;
        const matchesStatus = 
            status === 'todos' || 
            (status === 'disponiveis' && !item.purchased) ||
            (status === 'comprados' && item.purchased);
        const matchesSearch = 
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.work && item.work.toLowerCase().includes(searchTerm)) ||
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm));
        const matchesManga = manga === '' || item.work === manga;
        
        return matchesCategory && matchesStatus && matchesSearch && matchesManga;
    });
    
    itemsContainer.innerHTML = '';
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        const itemId = item._id; 
        itemCard.className = `item-card ${item.purchased ? 'comprado' : ''}`;
        
        itemCard.innerHTML = `
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : 
              `<div class="item-image" style="background-color: #ecf0f1; display: flex; align-items: center; justify-content: center;">
                 <span>Sem imagem</span>
               </div>`}
            <div class="item-details">
                <h3 class="item-title">${item.name}</h3>
                <div class="item-price">R$ ${item.price ? item.price.toFixed(2) : '0.00'}</div>
                <div>
                    <span class="item-category">${item.category}</span>
                    ${item.work ? `<span class="item-work">${item.work}</span>` : ''}
                </div>
                <p>${item.platform ? `Plataforma: ${item.platform}` : ''}</p>
                ${item.notes ? `<p>${item.notes}</p>` : ''}
                <div class="item-actions">
                    <div class="item-link-container">
                        ${item.link ? `<a href="${item.link}" target="_blank" class="item-link">Ver produto</a>` : 
                                      `<span>Sem link</span>`}
                    </div>
                    <div class="action-buttons">
                        <button onclick="togglePurchase('${itemId}')" class="purchase-btn">
                            ${item.purchased ? 'Desmarcar' : 'Marcar como comprado'}
                        </button>
                        <button onclick="editItem('${itemId}')" class="edit-btn">Editar</button>
                        <button onclick="deleteItem('${itemId}')" class="delete-btn">Excluir</button>
                    </div>
                </div>
            </div>
        `;
        
        itemsContainer.appendChild(itemCard);
    });
}

function handleCategoryFilterChange() {
    if (this.value === 'Mangás') {
        mangaFilterContainer.classList.remove('hidden');
    } else {
        mangaFilterContainer.classList.add('hidden');
        mangaFilter.value = '';
    }
    renderItems();
}

function populateCategoryFilters() {
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    itemCategory.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        categoryFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category;
        itemCategory.appendChild(option2);
    });
}

function populateMangaFilters() {
    mangaFilter.innerHTML = '<option value="">Todos os mangás</option>';
    itemWork.innerHTML = '<option value="">Selecione um mangá</option>';
    
    mangas.forEach(manga => {
        const option1 = document.createElement('option');
        option1.value = manga;
        option1.textContent = manga;
        mangaFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = manga;
        option2.textContent = manga;
        itemWork.appendChild(option2);
    });
}

async function saveItem(e) {
    e.preventDefault();
    
    const itemData = {
        name: document.getElementById('itemName').value,
        price: parseFloat(document.getElementById('itemPrice').value) || 0,
        category: document.getElementById('itemCategory').value,
        work: document.getElementById('itemCategory').value === 'Mangás' ? document.getElementById('itemWork').value : '',
        platform: document.getElementById('itemPlatform').value,
        link: document.getElementById('itemLink').value,
        image: document.getElementById('itemImage').value,
        notes: document.getElementById('itemNotes').value,
    };
    
    const method = editingItemId ? 'PUT' : 'POST';
    const url = editingItemId ? `${API_URL}/items/${editingItemId}` : `${API_URL}/items`;

    try {
        const savedItem = await fetchWithAuth(url, {
            method: method,
            body: JSON.stringify(itemData),
        });
        
        if (editingItemId) {
            const index = items.findIndex(item => item._id === editingItemId);
            if (index !== -1) items[index] = savedItem;
        } else {
            items.push(savedItem);
        }
        
        renderItems();
        updateTotalValue();
        closeModal();
    } catch (error) {
        alert('Erro ao salvar item: ' + error.message);
    }
}

function editItem(id) {
    const item = items.find(item => item._id === id);
    if (!item) return;
    
    editingItemId = id;
    modalTitle.textContent = 'Editar Item';
    
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPlatform').value = item.platform || '';
    document.getElementById('itemLink').value = item.link || '';
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemNotes').value = item.notes || '';
    
    if (item.category === 'Mangás') {
        workGroup.classList.remove('hidden');
        document.getElementById('itemWork').value = item.work || '';
    } else {
        workGroup.classList.add('hidden');
    }
    
    itemModal.style.display = 'flex';
}

async function deleteItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        try {
            await fetchWithAuth(`${API_URL}/items/${id}`, { method: 'DELETE' });
            items = items.filter(item => item._id !== id);
            renderItems();
            updateTotalValue();
        } catch (error) {
            alert('Erro ao excluir item: ' + error.message);
        }
    }
}

async function togglePurchase(id) {
    const item = items.find(item => item._id === id);
    if (!item) return;

    const newPurchasedStatus = !item.purchased;

    try {
        const updatedItem = await fetchWithAuth(`${API_URL}/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ purchased: newPurchasedStatus }),
        });

        item.purchased = updatedItem.purchased;
        renderItems();
        updateTotalValue();
    } catch (error) {
        alert('Erro ao atualizar status de compra: ' + error.message);
    }
}

function updateTotalValue() {
    const total = items
        .filter(item => !item.purchased)
        .reduce((sum, item) => sum + (item.price || 0), 0);
    
    totalValue.textContent = total.toFixed(2);
}

function openCategoryPopup() {
    categoryPopup.style.display = 'flex';
}
function closeCategoryPopup() {
    categoryPopup.style.display = 'none';
}
async function saveNewCategory() {
    const categoryName = newCategoryName.value.trim();
    if (categoryName && !categories.includes(categoryName)) {
        try {
            const newCategory = await fetchWithAuth(`${API_URL}/categories`, {
                method: 'POST',
                body: JSON.stringify({ name: categoryName })
            });
            categories.push(newCategory.name);
            populateCategoryFilters();
            itemCategory.value = categoryName;
            closeCategoryPopup();
        } catch (error) {
            alert('Erro ao salvar categoria: ' + error.message);
        }
    } else if (categories.includes(categoryName)) {
        alert('Esta categoria já existe!');
    }
}

function openMangaPopup() {
    mangaPopup.style.display = 'flex';
}
function closeMangaPopup() {
    mangaPopup.style.display = 'none';
}
async function saveNewManga() {
    const mangaName = newMangaName.value.trim();
    if (mangaName && !mangas.includes(mangaName)) {
        try {
            const newManga = await fetchWithAuth(`${API_URL}/mangas`, {
                method: 'POST',
                body: JSON.stringify({ name: mangaName })
            });
            mangas.push(newManga.name);
            populateMangaFilters();
            itemWork.value = mangaName;
            closeMangaPopup();
        } catch (error) {
            alert('Erro ao salvar mangá: ' + error.message);
        }
    } else if (mangas.includes(mangaName)) {
        alert('Este mangá já existe!');
    }
}
