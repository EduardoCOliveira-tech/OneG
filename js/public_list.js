/* === IMPORTAÇÕES DO FIREBASE === */
import { db } from './firebase-config.js';
import { 
    collection, getDocs, query, where, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// URL Segura para Avatar Padrão
const DEFAULT_PROFILE_PIC = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=128";

// Variáveis globais
let items = [];
let originalItems = []; 

// Elementos DOM
const itemsContainer = document.getElementById('itemsContainer');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const mangaFilterContainer = document.getElementById('mangaFilterContainer');
const mangaFilter = document.getElementById('mangaFilter');
const listTitle = document.getElementById('public-list-title');
const publicProfilePic = document.getElementById('public-profile-pic');
const totalValueSpan = document.getElementById('totalValue');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    categoryFilter.addEventListener('change', handleCategoryFilterChange);
    statusFilter.addEventListener('change', renderItems);
    searchInput.addEventListener('input', renderItems);
    mangaFilter.addEventListener('change', renderItems);
});

async function initializeApp() {
    try {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');
        
        if (!username) {
            itemsContainer.innerHTML = '<p style="color:white; text-align:center;">Erro: Nenhum usuário especificado na URL.</p>';
            listTitle.textContent = 'Usuário não encontrado';
            return;
        }

        // Busca o usuário
        const usersRef = collection(db, "users");
        const qUser = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(qUser);

        if (userSnapshot.empty) {
            itemsContainer.innerHTML = '<p style="color:white; text-align:center;">Este usuário não existe ou não tem uma lista pública.</p>';
            listTitle.textContent = 'Usuário não encontrado';
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const targetUid = userDoc.id; // UID real do usuário (ou userDoc.data().uid)

        // Verifica privacidade
        if (userData.isPublic === false) {
            itemsContainer.innerHTML = '<p style="color:white; text-align:center;">Esta lista é privada.</p>';
            listTitle.textContent = 'Lista Privada';
            return;
        }

        // --- CORREÇÃO DA IMAGEM ---
        let pic = userData.profilePicture;
        
        // Verifica se a imagem do banco é a "quebrada" ou inválida
        const isInvalid = !pic || 
                          pic.includes("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+") || 
                          pic.length > 1000000;

        if (isInvalid) {
            // Gera avatar com a inicial do nome do usuário da lista
            pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || 'User')}&background=0D8ABC&color=fff&size=128`;
        }

        publicProfilePic.src = pic;
        listTitle.textContent = userData.listTitle || `Lista de ${userData.username}`;

        // Busca Itens
        const itemsRef = collection(db, "items");
        const qItems = query(itemsRef, where("userId", "==", targetUid)); // Usa o ID do documento encontrado
        const itemsSnapshot = await getDocs(qItems);

        items = [];
        itemsSnapshot.forEach((doc) => {
            items.push({ _id: doc.id, ...doc.data() });
        });
        originalItems = [...items];

        if (items.length === 0) {
            itemsContainer.innerHTML = '<p style="color:white; text-align:center;">Esta lista está vazia.</p>';
        } else {
            populateFiltersFromItems(items);
            renderItems();
        }

    } catch (error) {
        console.error('Erro:', error);
        itemsContainer.innerHTML = `<p style="color:white; text-align:center;">Erro ao carregar lista: ${error.message}</p>`;
    }
}

function populateFiltersFromItems(itemsList) {
    const categories = new Set();
    const mangas = new Set();

    itemsList.forEach(item => {
        if(item.category) categories.add(item.category);
        if(item.work) mangas.add(item.work);
    });

    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    categories.forEach(cat => {
        categoryFilter.add(new Option(cat, cat));
    });

    mangaFilter.innerHTML = '<option value="">Todos os mangás</option>';
    mangas.forEach(m => {
        mangaFilter.add(new Option(m, m));
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
    
    let total = 0;

    filteredItems.forEach(item => {
        if (!item.purchased) {
            total += parseFloat(item.price || 0);
        }

        const itemCard = document.createElement('div');
        itemCard.className = `item-card ${item.purchased ? 'comprado' : ''}`;
        
        const imgHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="item-image">`
            : `<div class="item-image" style="background-color: #ecf0f1; display: flex; align-items: center; justify-content: center;"><span>Sem imagem</span></div>`;

        itemCard.innerHTML = `
            ${imgHtml}
            <div class="item-details">
                <h3 class="item-title">${item.name}</h3>
                <div class="item-price">R$ ${parseFloat(item.price || 0).toFixed(2)}</div>
                <div>
                    <span class="item-category">${item.category}</span>
                    ${item.work ? `<span class="item-work">${item.work}</span>` : ''}
                </div>
                <p>${item.platform ? `Plataforma: ${item.platform}` : ''}</p>
                ${item.notes ? `<p style="font-size:0.9em; margin-top:5px; color:#666;">📝 ${item.notes}</p>` : ''}
                
                <div class="item-actions">
                    <div class="item-link-container">
                        ${item.link ? `<a href="${item.link}" target="_blank" class="item-link">Ver produto</a>` : `<span>Sem link</span>`}
                    </div>
                </div>
            </div>
        `;
        itemsContainer.appendChild(itemCard);
    });

    if (totalValueSpan) {
        totalValueSpan.textContent = total.toFixed(2);
    }
}