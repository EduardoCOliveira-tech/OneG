/* === IMPORTAÇÕES DO FIREBASE === */
import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut, 
    updatePassword, 
    deleteUser, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, setDoc, writeBatch, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* === PARTE 1: LÓGICA DA SIDEBAR (Visual) === */
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

/* === PARTE 2: LÓGICA DO APP (Firebase) === */

// Imagem limpa sem quebras de linha
const DEFAULT_PROFILE_PIC = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=128";
let items = [];
let mangas = [];
let categories = []; 
let editingItemId = null;
let currentUser = null; 
let userProfile = null; 

// --- Seletores DOM ---
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

// Modais
const itemModal = document.getElementById('itemModal');
const editProfileModal = document.getElementById('editProfileModal');
const changePasswordModal = document.getElementById('changePasswordModal'); 

// Links
const editProfileLink = document.getElementById('editProfileLink');
const changePasswordLink = document.getElementById('changePasswordLink');
const cancelBtn = document.getElementById('cancelBtn');
const cancelModalBtns = document.querySelectorAll('.cancel-modal-btn');

// Placeholders
const notificationsLink = document.getElementById('notificationsLink');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const supportLink = document.getElementById('supportLink');

// Forms e Inputs
const modalTitle = document.getElementById('modalTitle');
const itemForm = document.getElementById('itemForm');
const itemCategory = document.getElementById('itemCategory');
const workGroup = document.getElementById('workGroup');
const itemWork = document.getElementById('itemWork');

const addCategoryBtn = document.getElementById('addCategoryBtn');
const addMangaBtn = document.getElementById('addMangaBtn');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
const categoryPopup = document.getElementById('categoryPopup');
const mangaPopup = document.getElementById('mangaPopup');
const newCategoryName = document.getElementById('newCategoryName');
const newMangaName = document.getElementById('newMangaName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const cancelMangaBtn = document.getElementById('cancelMangaBtn');
const saveMangaBtn = document.getElementById('saveMangaBtn');

const editProfileForm = document.getElementById('editProfileForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const profilePicPreview = document.getElementById('profilePicPreview');
const profilePictureFile = document.getElementById('profilePictureFile'); 
const profilePictureStringInput = document.getElementById('profilePictureString'); 
const uploadStatus = document.getElementById('upload-status'); 
const editUsernameInput = document.getElementById('editUsername');
const editEmailInput = document.getElementById('editEmail');
const isPublicToggle = document.getElementById('isPublicToggle');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', function() {
    if (itemsContainer) {
        initFirebaseApp();
    }
});

function initFirebaseApp() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            
            applyTheme();
            setupEventListeners();
            
            try {
                // Carrega o perfil PRIMEIRO
                await loadUserProfile();
                
                await Promise.all([
                    loadCategories(),
                    loadMangas(),
                    loadItems()
                ]);
                checkFirstLogin();
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }

        } else {
            window.location.href = 'login.html';
        }
    });
}

// --- Funções Auxiliares ---

function checkFirstLogin() {
    setTimeout(() => {
        if (userProfile && userProfile.listTitle === 'Minha Lista de Presentes' && items.length === 0) {
             const isFirst = localStorage.getItem('firstLogin');
             if(isFirst === 'true') {
                 const newTitle = prompt(
                    'Bem-vindo! Que nome você gostaria de dar para a sua lista?',
                    `Lista de ${userProfile.username}`
                );
                if (newTitle && newTitle.trim() !== '') {
                    listTitleElement.textContent = newTitle.trim();
                    saveListTitle();
                }
                localStorage.removeItem('firstLogin');
             }
        }
    }, 1000);
}

// --- Funções de Carregamento ---

async function loadUserProfile() {
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            userProfile = docSnap.data();
            userProfile.id = docSnap.id;
        } else {
            userProfile = { 
                username: currentUser.displayName || 'Usuário', 
                email: currentUser.email, 
                profilePicture: DEFAULT_PROFILE_PIC,
                listTitle: 'Minha Lista de Presentes',
                isPublic: true
            };
        }
        populateUI();
    } catch (e) {
        console.error("Erro profile:", e);
    }
}

async function loadItems() {
    const q = query(collection(db, "items"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    items = [];
    querySnapshot.forEach((doc) => {
        items.push({ _id: doc.id, ...doc.data() });
    });
    renderItems();
    updateTotalValue();
}

async function loadCategories() {
    const q = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    categories = [];
    querySnapshot.forEach((doc) => {
        categories.push({ _id: doc.id, ...doc.data() });
    });
    // CHAMADA DA FUNÇÃO QUE DAVA ERRO (Agora ela existe abaixo)
    populateCategoryFilters();
}

async function loadMangas() {
    const q = query(collection(db, "mangas"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    mangas = [];
    querySnapshot.forEach((doc) => {
        mangas.push(doc.data().name);
    });
    // CHAMADA DA FUNÇÃO
    populateMangaFilters();
}

// --- Renderização da UI ---

function populateUI() {
    sidebarUsername.textContent = userProfile.username || "Usuário";
    sidebarEmail.textContent = currentUser.email;
    
    // --- CORREÇÃO DE IMAGEM ---
    let pic = userProfile.profilePicture;
    
    // URL segura (Avatar com iniciais)
    const safeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.username || 'User')}&background=0D8ABC&color=fff&size=128`;

    // Verifica se a imagem é inválida, vazia, ou se é a string base64 quebrada antiga
    const isInvalid = !pic || 
                      pic.includes("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+") || 
                      pic.length > 1000000; // Proteção contra strings gigantes

    if (isInvalid) {
        pic = safeAvatar;
    }
    
    sidebarProfilePic.src = pic;
    listTitleElement.textContent = userProfile.listTitle || "Minha Lista de Presentes";
    viewPublicListLink.href = `public_list.html?user=${userProfile.username}`;
    
    // Preencher Modal
    editUsernameInput.value = userProfile.username;
    editEmailInput.value = currentUser.email;
    isPublicToggle.checked = userProfile.isPublic;
    
    // Preview no modal também recebe a correção
    profilePicPreview.src = pic;
    // Se a imagem era inválida, atualiza o input string com a nova segura para salvar no próximo update
    profilePictureStringInput.value = pic;
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
            (item.category && item.category.toLowerCase().includes(searchTerm));
        const matchesManga = manga === '' || item.work === manga;
        
        return matchesCategory && matchesStatus && matchesSearch && matchesManga;
    });
    
    itemsContainer.innerHTML = '';
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = `item-card ${item.purchased ? 'comprado' : ''}`;
        
        const imgHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="item-image">`
            : `<div class="item-image" style="background-color: #ecf0f1; display: flex; align-items: center; justify-content: center;"><span>Sem imagem</span></div>`;

        itemCard.innerHTML = `
            ${imgHtml}
            <div class="item-details">
                <h3 class="item-title">${item.name}</h3>
                <div class="item-price">R$ ${parseFloat(item.price).toFixed(2)}</div>
                <div>
                    <span class="item-category">${item.category}</span>
                    ${item.work ? `<span class="item-work">${item.work}</span>` : ''}
                </div>
                <p>${item.platform ? `Plataforma: ${item.platform}` : ''}</p>
                
                ${item.notes ? `<p class="item-notes">📝 ${item.notes}</p>` : ''}

                <div class="item-actions">
                    <div class="item-link-container">
                        ${item.link ? `<a href="${item.link}" target="_blank" class="item-link">Ver produto</a>` : `<span>Sem link</span>`}
                    </div>
                    <div class="action-buttons">
                        <button onclick="window.togglePurchase('${item._id}')" class="purchase-btn">
                            ${item.purchased ? 'Desmarcar' : 'Comprado'}
                        </button>
                        <button onclick="window.editItem('${item._id}')" class="edit-btn">Editar</button>
                        <button onclick="window.deleteItem('${item._id}')" class="delete-btn">Excluir</button>
                    </div>
                </div>
            </div>
        `;
        itemsContainer.appendChild(itemCard);
    });
}

function updateTotalValue() {
    const total = items
        .filter(item => !item.purchased)
        .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    totalValue.textContent = total.toFixed(2);
}

// --- FUNÇÕES DE PREENCHIMENTO DE FILTROS (AS QUE FALTAVAM) ---

function populateCategoryFilters() {
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    itemCategory.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories.forEach(c => {
        const opt1 = new Option(c.name, c.name);
        categoryFilter.add(opt1);
        const opt2 = new Option(c.name, c.name);
        itemCategory.add(opt2);
    });
}

function populateMangaFilters() {
    mangaFilter.innerHTML = '<option value="">Todos os mangás</option>';
    itemWork.innerHTML = '<option value="">Selecione um mangá</option>';
    mangas.forEach(m => {
        mangaFilter.add(new Option(m, m));
        itemWork.add(new Option(m, m));
    });
}

// --- SALVAMENTO ---

async function saveListTitle() {
    const newTitle = listTitleElement.textContent.trim();
    if (userProfile && newTitle === userProfile.listTitle) return;

    try {
        const userRef = doc(db, "users", currentUser.uid);
        
        const payload = {
            listTitle: newTitle,
            username: userProfile?.username || currentUser.displayName || "Usuário",
            email: userProfile?.email || currentUser.email,
            uid: currentUser.uid, 
            isPublic: userProfile?.isPublic !== undefined ? userProfile.isPublic : true
        };
        
        if (userProfile?.profilePicture) payload.profilePicture = userProfile.profilePicture;

        await setDoc(userRef, payload, { merge: true }); 
        
        if (!userProfile) userProfile = {};
        userProfile.listTitle = newTitle;
        userProfile.username = payload.username; 
        
        listTitleElement.style.borderBottom = "2px solid #00bba5";
        setTimeout(() => listTitleElement.style.borderBottom = "none", 1500);

    } catch (error) {
        console.error("Erro ao salvar título:", error);
    }
}

async function handleEditProfile(e) {
    e.preventDefault();
    const saveBtn = editProfileForm.querySelector('button[type="submit"]');
    saveBtn.textContent = 'Salvando...';
    saveBtn.disabled = true;

    try {
        const userRef = doc(db, "users", currentUser.uid);
        const updateData = {
            uid: currentUser.uid,
            username: editUsernameInput.value,
            email: editEmailInput.value,
            isPublic: isPublicToggle.checked,
            profilePicture: profilePictureStringInput.value,
            listTitle: userProfile?.listTitle || "Minha Lista de Presentes"
        };

        await setDoc(userRef, updateData, { merge: true });

        userProfile = updateData;
        populateUI();
        closeModal();
        alert('Perfil atualizado com sucesso!');
    } catch (error) {
        console.error(error);
        alert('Erro ao atualizar perfil: ' + error.message);
    } finally {
        saveBtn.textContent = 'Salvar Alterações';
        saveBtn.disabled = false;
    }
}

// --- Outras Funções ---

async function saveItem(e) {
    e.preventDefault();
    const submitBtn = itemForm.querySelector('button[type="submit"]');
    submitBtn.textContent = "Salvando...";
    submitBtn.disabled = true;

    try {
        const itemData = {
            userId: currentUser.uid,
            name: document.getElementById('itemName').value,
            price: parseFloat(document.getElementById('itemPrice').value) || 0,
            category: document.getElementById('itemCategory').value,
            work: document.getElementById('itemCategory').value === 'Mangás' ? document.getElementById('itemWork').value : '',
            platform: document.getElementById('itemPlatform').value,
            link: document.getElementById('itemLink').value,
            image: document.getElementById('itemImage').value,
            notes: document.getElementById('itemNotes').value,
        };

        if (editingItemId) {
            const itemRef = doc(db, "items", editingItemId);
            const originalItem = items.find(i => i._id === editingItemId);
            await updateDoc(itemRef, { ...itemData, purchased: originalItem.purchased });
        } else {
            itemData.purchased = false;
            await addDoc(collection(db, "items"), itemData);
        }

        closeModal();
        await loadItems(); 
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    } finally {
        submitBtn.textContent = "Salvar";
        submitBtn.disabled = false;
    }
}

window.editItem = (id) => {
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
};

window.deleteItem = async (id) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        try {
            await deleteDoc(doc(db, "items", id));
            loadItems();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
};

window.togglePurchase = async (id) => {
    const item = items.find(item => item._id === id);
    if (!item) return;
    try {
        const itemRef = doc(db, "items", id);
        await updateDoc(itemRef, { purchased: !item.purchased });
        loadItems();
    } catch (error) {
        alert('Erro ao atualizar: ' + error.message);
    }
};

function openCategoryPopup() { categoryPopup.style.display = 'flex'; }
function closeCategoryPopup() { categoryPopup.style.display = 'none'; }
function openMangaPopup() { mangaPopup.style.display = 'flex'; }
function closeMangaPopup() { mangaPopup.style.display = 'none'; }

async function saveNewCategory() {
    const name = newCategoryName.value.trim();
    if (!name) return;
    try {
        await addDoc(collection(db, "categories"), { userId: currentUser.uid, name: name });
        closeCategoryPopup();
        loadCategories();
        itemCategory.value = name; 
    } catch (error) { alert(error.message); }
}

async function handleDeleteCategory() {
    const categoryName = itemCategory.value;
    if (!categoryName) return alert('Selecione uma categoria.');
    if (confirm(`Excluir categoria "${categoryName}" e TODOS os itens dela?`)) {
        try {
            const catDoc = categories.find(c => c.name === categoryName);
            if(catDoc) await deleteDoc(doc(db, "categories", catDoc._id));
            const batch = writeBatch(db);
            const itemsToDelete = items.filter(i => i.category === categoryName);
            itemsToDelete.forEach(item => batch.delete(doc(db, "items", item._id)));
            await batch.commit();
            alert('Categoria excluída.');
            loadCategories();
            loadItems();
        } catch (error) { alert(error.message); }
    }
}

async function saveNewManga() {
    const name = newMangaName.value.trim();
    if (!name) return;
    try {
        await addDoc(collection(db, "mangas"), { userId: currentUser.uid, name: name });
        closeMangaPopup();
        loadMangas();
        itemWork.value = name;
    } catch (e) { alert(e.message); }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    if (newPassword !== confirmNewPassword) return alert('Senhas não coincidem.');
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        alert("Senha alterada com sucesso!");
        closeModal();
    } catch (error) { alert("Erro: " + error.message); }
}

async function handleDeleteAccount() {
    const confirmation = prompt(`ATENÇÃO: Excluirá tudo. Digite: ${userProfile.username}`);
    if (confirmation !== userProfile.username) return alert("Nome incorreto.");
    try {
        const batch = writeBatch(db);
        items.forEach(item => batch.delete(doc(db, "items", item._id)));
        categories.forEach(cat => batch.delete(doc(db, "categories", cat._id)));
        batch.delete(doc(db, "users", currentUser.uid));
        await batch.commit();
        await deleteUser(currentUser);
        alert("Conta excluída.");
        window.location.href = 'index.html';
    } catch (error) { alert(error.message); }
}

function handleLogout(e) {
    if(e) e.preventDefault();
    signOut(auth).then(() => { window.location.href = 'index.html'; });
}

function handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    uploadStatus.textContent = 'Processando...';
    uploadStatus.classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const MAX_SIZE = 500; 
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
            else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
            profilePicPreview.src = dataUrl;
            profilePictureStringInput.value = dataUrl;
            uploadStatus.classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function setupEventListeners() {
    addItemBtn.addEventListener('click', () => { 
        editingItemId = null; modalTitle.textContent = 'Novo Item'; itemForm.reset(); workGroup.classList.add('hidden'); itemModal.style.display = 'flex'; 
    });
    logoutLink.addEventListener('click', handleLogout);
    itemForm.addEventListener('submit', saveItem);
    categoryFilter.addEventListener('change', () => { 
        if(categoryFilter.value === 'Mangás') mangaFilterContainer.classList.remove('hidden'); else mangaFilterContainer.classList.add('hidden'); 
        renderItems(); 
    });
    statusFilter.addEventListener('change', renderItems);
    searchInput.addEventListener('input', renderItems);
    addCategoryBtn.addEventListener('click', openCategoryPopup);
    saveCategoryBtn.addEventListener('click', saveNewCategory);
    deleteCategoryBtn.addEventListener('click', handleDeleteCategory);
    cancelCategoryBtn.addEventListener('click', closeCategoryPopup);
    addMangaBtn.addEventListener('click', openMangaPopup);
    saveMangaBtn.addEventListener('click', saveNewManga);
    cancelMangaBtn.addEventListener('click', closeMangaPopup);
    cancelBtn.addEventListener('click', closeModal);
    cancelModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.onclick = (e) => { if (e.target.classList.contains('modal') || e.target.classList.contains('popup')) closeModal(); };
    editProfileLink.addEventListener('click', (e) => { e.preventDefault(); populateUI(); editProfileModal.style.display = 'flex'; });
    editProfileForm.addEventListener('submit', handleEditProfile);
    profilePictureFile.addEventListener('change', handleImageFileSelect);
    changePasswordLink.addEventListener('click', (e) => { e.preventDefault(); changePasswordForm.reset(); changePasswordModal.style.display = 'flex'; });
    changePasswordForm.addEventListener('submit', handleChangePassword);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    listTitleElement.addEventListener('blur', saveListTitle);
    listTitleElement.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); listTitleElement.blur(); }});
    darkModeToggle.addEventListener('change', toggleTheme);
    [notificationsLink, termsLink, privacyLink, supportLink].forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); alert('Em breve.'); }));
}

function closeModal() {
    itemModal.style.display = 'none';
    editProfileModal.style.display = 'none';
    changePasswordModal.style.display = 'none';
    categoryPopup.style.display = 'none';
    mangaPopup.style.display = 'none';
}

function applyTheme() {
    if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); darkModeToggle.checked = true; }
}
function toggleTheme() {
    if (darkModeToggle.checked) { document.body.classList.add('dark-mode'); localStorage.setItem('theme', 'dark'); } 
    else { document.body.classList.remove('dark-mode'); localStorage.setItem('theme', 'light'); }
}