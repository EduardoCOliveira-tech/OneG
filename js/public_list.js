// js/public_list.js

// URL da API (deve ser o caminho completo)
const API_URL = 'https://oneg-6x4j.onrender.com'; 

// Variáveis globais
let items = [];
let mangas = [];
let categories = [];

// Elementos DOM
const itemsContainer = document.getElementById('itemsContainer');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const mangaFilterContainer = document.getElementById('mangaFilterContainer');
const mangaFilter = document.getElementById('mangaFilter');
const listTitle = document.getElementById('public-list-title');
const publicProfilePic = document.getElementById('public-profile-pic'); // <-- NOVO SELETOR

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    if (itemsContainer) {
        initializeApp();
        
        // Listeners dos filtros
        categoryFilter.addEventListener('change', handleCategoryFilterChange);
        statusFilter.addEventListener('change', renderItems);
        searchInput.addEventListener('input', renderItems);
        mangaFilter.addEventListener('change', renderItems);
    }
});

// Função principal de carregamento
async function initializeApp() {
    try {
        // Pega o nome de usuário da URL (ex: ?user=eduardo)
        const username = new URLSearchParams(window.location.search).get('user');
        
        if (!username) {
            listTitle.textContent = 'Erro: Nenhum perfil especificado.';
            return;
        }

        // Busca os dados públicos do usuário
        const data = await fetch(`${API_URL}/users/public-list/${username}`);
        const publicData = await data.json();

        if (!data.ok) {
            throw new Error(publicData.message);
        }

        // Preenche as variáveis globais
        listTitle.textContent = `Lista de Presentes de ${publicData.user.username}`;
        publicProfilePic.src = publicData.user.profilePicture; // <-- NOVA LINHA
        items = publicData.items || [];
        categories = publicData.categories || [];
        mangas = publicData.mangas || [];

        // Renderiza tudo
        populateCategoryFilters();
        populateMangaFilters();
        renderItems();

    } catch (error) {
        console.error('Erro ao inicializar a aplicação:', error);
        listTitle.textContent = `Erro: ${error.message}`;
    }
}

// Filtro de Categoria (igual ao script_homepage)
function handleCategoryFilterChange() {
    if (this.value === 'Mangás') {
        mangaFilterContainer.classList.remove('hidden');
    } else {
        mangaFilterContainer.classList.add('hidden');
        mangaFilter.value = '';
    }
    renderItems();
}

// *** FUNÇÃO RENDERITEMS (SOMENTE LEITURA) ***
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
                </div>
            </div>
        `;
        
        itemsContainer.appendChild(itemCard);
    });
}

// Popula Filtros de Categoria
function populateCategoryFilters() {
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        categoryFilter.appendChild(option1);
    });
}

// Popula Filtros de Mangá
function populateMangaFilters() {
    mangaFilter.innerHTML = '<option value="">Todos os mangás</option>';
    mangas.forEach(manga => {
        const option1 = document.createElement('option');
        option1.value = manga;
        option1.textContent = manga;
        mangaFilter.appendChild(option1);
    });

}
