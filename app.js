// State Management
const state = {
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'light',
    filters: {
        search: '',
        category: '',
        condition: '',
        maxPrice: 5000
    },
    sort: 'name'
};

// Translations
const translations = {
    en: {
        heroTitle: 'Premium Electronics Components',
        heroSubtitle: 'Discover quality components for your projects',
        searchPlaceholder: 'Search components...',
        categoryLabel: 'Category:',
        conditionLabel: 'Condition:',
        sortLabel: 'Sort by:',
        priceRangeLabel: 'Max Price:',
        resetBtn: 'Reset Filters',
        productsTitle: 'Components Catalog',
        viewBtn: 'View Details',
        contactBtn: 'Contact on Telegram',
        servicesTitle: 'Our Components Service',
        service1Title: 'Quality Components',
        service1Desc: 'Verified and tested components',
        service2Title: 'Fast Delivery',
        service2Desc: 'Only to Saad Dahleb University Pv1',
        service3Title: 'Return',
        service3Desc: '1 day garenty to return B or less rating items',
        service4Title: 'Payment',
        service4Desc: 'Hande to hand transactions',

        servicesTitle2: 'Our Services',
        service1Title2: 'Circuit',
        service1Desc2: 'Custom circuit diagrams for your projects.',
        service2Title2: 'Robots & Machines',
        service2Desc2: 'Assistance with PFE projects, small robots, and simple machines.',
        service3Title2: 'Research',
        service3Desc2: 'Detailed research on components or machines you need.',
        service4Title2: 'Confidentiality',
        service4Desc2: 'Your information stays private at all times.',

        footerCopyright: '© 2025 EK Electro. All rights reserved.',
        stockLabel: 'Stock:',
        priceLabel: 'Price:',
        categoryLabel2: 'Category:',
        conditionLabel2: 'Condition:',
        datasheetsLabel: 'Datasheets:',
        contactVia: 'Contact via Telegram',
        noResults: 'No products found'
    },
    fr: {
        heroTitle: 'Composants Électroniques Premium',
        heroSubtitle: 'Découvrez des composants de qualité pour vos projets',
        searchPlaceholder: 'Rechercher des composants...',
        categoryLabel: 'Catégorie :',
        conditionLabel: 'État :',
        sortLabel: 'Trier par :',
        priceRangeLabel: 'Prix Maximum :',
        resetBtn: 'Réinitialiser les filtres',
        productsTitle: 'Catalogue des Composants',
        viewBtn: 'Voir les détails',
        contactBtn: 'Contacter sur Telegram',
        servicesTitle: 'Notre service de composants',
        service1Title: 'Composants de Qualité',
        service1Desc: 'Composants vérifiés et testés',
        service2Title: 'Livraison Rapide',
        service2Desc: 'Expédition rapide dans la région',
        service3Title: 'Support Expert',
        service3Desc: 'Consultation technique disponible',
        service4Title: 'Paiement Sécurisé',
        service4Desc: 'Transactions sûres et fiables',

        servicesTitle2: 'Nos Services',
        service1Title2: 'Circuit',
        service1Desc2: 'Schémas électroniques personnalisés pour vos projets.',
        service2Title2: 'Robots & Machines',
        service2Desc2: 'Assistance pour les projets de fin d’études, petits robots et machines simples.',
        service3Title2: 'Recherche',
        service3Desc2: 'Recherche détaillée sur les composants ou machines dont vous avez besoin.',
        service4Title2: 'Confidentialité',
        service4Desc2: 'Vos informations restent privées en toutes circonstances.',



        footerAboutTitle: 'À Propos d\'EK Electro',
        footerAboutText: 'Votre source de confiance pour les composants électroniques de qualité',
        footerContactTitle: 'Contact',
        footerFollowTitle: 'Nous Suivre',
        footerCopyright: '© 2025 EK Electro. Tous droits réservés.',
        stockLabel: 'Stock :',
        priceLabel: 'Prix :',
        categoryLabel2: 'Catégorie :',
        conditionLabel2: 'État :',
        datasheetsLabel: 'Fiches techniques :',
        contactVia: 'Contacter via Telegram',
        noResults: 'Aucun produit trouvé'
    },
    ar: {
        heroTitle: 'مكونات إلكترونية فاخرة',
        heroSubtitle: 'اكتشف المكونات عالية الجودة لمشاريعك',
        searchPlaceholder: 'ابحث عن المكونات...',
        categoryLabel: 'الفئة:',
        conditionLabel: 'الحالة:',
        sortLabel: 'ترتيب حسب:',
        priceRangeLabel: 'السعر الأقصى:',
        resetBtn: 'إعادة تعيين المرشحات',
        productsTitle: 'كتالوج المكونات',
        viewBtn: 'عرض التفاصيل',
        contactBtn: 'التواصل عبر Telegram',
        servicesTitle: 'خدمة المكوّنات لدينا',
        service1Title: 'مكونات عالية الجودة',
        service1Desc: 'مكونات موثوقة واختبارية',
        service2Title: 'توصيل سريع',
        service2Desc: 'شحن سريع عبر المنطقة',
        service3Title: 'دعم الخبراء',
        service3Desc: 'استشارة فنية متاحة',
        service4Title: 'دفع آمن',
        service4Desc: 'معاملات آمنة وموثوقة',

        servicesTitle2: 'خدماتنا',
        service1Title2: 'الدارات',
        service1Desc2: 'مخططات دارات مخصّصة لمشاريعك.',
        service2Title2: 'الروبوتات والآلات',
        service2Desc2: 'مساعدة في مشاريع التخرج والروبوتات الصغيرة والآلات البسيطة.',
        service3Title2: 'البحث',
        service3Desc2: 'بحث مفصّل حول المكوّنات أو الآلات التي تحتاجها.',
        service4Title2: 'السرية',
        service4Desc2: 'معلوماتك تبقى خاصة في جميع الأوقات.',


        footerAboutTitle: 'حول EK Electro',
        footerAboutText: 'مصدرك الموثوق لمكونات إلكترونية عالية الجودة',
        footerContactTitle: 'اتصل',
        footerFollowTitle: 'تابعنا',
        footerCopyright: '© 2025 EK Electro. جميع الحقوق محفوظة.',
        stockLabel: 'المخزون:',
        priceLabel: 'السعر:',
        categoryLabel2: 'الفئة:',
        conditionLabel2: 'الحالة:',
        datasheetsLabel: 'ورقات البيانات:',
        contactVia: 'التواصل عبر Telegram',
        noResults: 'لم يتم العثور على منتجات'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeLanguage();
    renderProducts(components);
    setupEventListeners();
    populateFilters();
});

// Theme Management
function initializeTheme() {
    const isDark = state.theme === 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// Language Management
function initializeLanguage() {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    updateTranslations();
    updateLanguageButton();
}

function switchLanguage() {
    const languages = ['en', 'fr', 'ar'];
    const currentIndex = languages.indexOf(state.language);
    state.language = languages[(currentIndex + 1) % languages.length];
    localStorage.setItem('language', state.language);
    initializeLanguage();
}

function updateTranslations() {
    const trans = translations[state.language];
    
    document.getElementById('heroTitle').textContent = trans.heroTitle;
    document.getElementById('heroSubtitle').textContent = trans.heroSubtitle;
    document.getElementById('searchInput').placeholder = trans.searchPlaceholder;
    document.getElementById('categoryLabel').textContent = trans.categoryLabel;
    document.getElementById('conditionLabel').textContent = trans.conditionLabel;
    document.getElementById('sortLabel').textContent = trans.sortLabel;
    document.getElementById('priceRangeLabel').textContent = trans.priceRangeLabel;
    document.getElementById('resetBtn').textContent = trans.resetBtn;
    document.getElementById('productsTitle').textContent = trans.productsTitle;
    document.getElementById('servicesTitle').textContent = trans.servicesTitle;
    document.getElementById('service1Title').textContent = trans.service1Title;
    document.getElementById('service1Desc').textContent = trans.service1Desc;
    document.getElementById('service2Title').textContent = trans.service2Title;
    document.getElementById('service2Desc').textContent = trans.service2Desc;
    document.getElementById('service3Title').textContent = trans.service3Title;
    document.getElementById('service3Desc').textContent = trans.service3Desc;
    document.getElementById('service4Title').textContent = trans.service4Title;
    document.getElementById('service4Desc').textContent = trans.service4Desc;

    document.getElementById('servicesTitle2').textContent = trans.servicesTitle2;
    document.getElementById('service1Title2').textContent = trans.service1Title2;
    document.getElementById('service1Desc2').textContent = trans.service1Desc2;
    document.getElementById('service2Title2').textContent = trans.service2Title2;
    document.getElementById('service2Desc2').textContent = trans.service2Desc2;
    document.getElementById('service3Title2').textContent = trans.service3Title2;
    document.getElementById('service3Desc2').textContent = trans.service3Desc2;
    document.getElementById('service4Title2').textContent = trans.service4Title2;
    document.getElementById('service4Desc2').textContent = trans.service4Desc2;

    document.getElementById('footerAboutTitle').textContent = trans.footerAboutTitle;
    document.getElementById('footerAboutText').textContent = trans.footerAboutText;
    document.getElementById('footerContactTitle').textContent = trans.footerContactTitle;
    document.getElementById('footerFollowTitle').textContent = trans.footerFollowTitle;
    document.getElementById('footerCopyright').textContent = trans.footerCopyright;
}

function updateLanguageButton() {
    const btn = document.getElementById('langBtn');
    const langs = { en: 'EN', fr: 'FR', ar: 'AR' };
    btn.textContent = `🌐 ${langs[state.language]}`;
}

// Populate Filters
function populateFilters() {
    const categories = [...new Set(components.map(c => c.category))].sort();
    const categorySelect = document.getElementById('categoryFilter');
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categorySelect.appendChild(option);
    });
}

// Render Products
function renderProducts(productsList) {
    const grid = document.getElementById('productsGrid');
    const count = document.getElementById('productCount');
    
    const conditionColors = {
    'A': '#007bff',   // Blue
    'B': '#28a745',   // Green
    'C': '#dc3545',   // Red
    'D': '#9b59b6'    // Violet
    };

    if (productsList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">${translations[state.language].noResults}</div>`;
        count.textContent = '0';
        return;
    }
    
    grid.innerHTML = productsList.map(product => `
        <div class="product-card" onclick="openModal('${product.id}')">
            <div class="product-image">
                <img src="Images/${product.image}" alt="${product.name}" onerror="this.style.display='none'">
                <div class="product-image-placeholder" style="display: ${product.image ? 'none' : 'block'}">📦</div>
                <div class="product-badge" 
                style="background-color: ${conditionColors[product.condition] || '#444'};">
                ${product.condition}
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-short">${product.short}</p>
                <div class="product-meta">
                    <span class="meta-item">Stock: ${product.stock}</span>
                    <span class="meta-item">${product.category}</span>
                </div>
                <div class="product-price">${product.price} ${product.currency}</div>
                <div class="product-footer">
                </div>
            </div>
        </div>
    `).join('');
    
    count.textContent = productsList.length;
}

// Filter and Sort Logic
function applyFilters() {
    let filtered = components.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                             product.short.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                             product.tags.some(tag => tag.toLowerCase().includes(state.filters.search.toLowerCase()));
        
        const matchesCategory = !state.filters.category || product.category === state.filters.category;
        const matchesCondition = !state.filters.condition || product.condition === state.filters.condition;
        const matchesPrice = product.price <= state.filters.maxPrice;
        
        return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
    });
    
    // Apply sorting
    filtered = sortProducts(filtered);
    renderProducts(filtered);
}

function sortProducts(products) {
    const sorted = [...products];
    
    switch(state.sort) {
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'stock':
            return sorted.sort((a, b) => b.stock - a.stock);
        default:
            return sorted;
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('langBtn').addEventListener('click', switchLanguage);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        applyFilters();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        applyFilters();
    });
    
    document.getElementById('conditionFilter').addEventListener('change', (e) => {
        state.filters.condition = e.target.value;
        applyFilters();
    });
    
    document.getElementById('sortFilter').addEventListener('change', (e) => {
        state.sort = e.target.value;
        applyFilters();
    });
    
    document.getElementById('priceRange').addEventListener('input', (e) => {
        state.filters.maxPrice = parseInt(e.target.value);
        applyFilters();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        state.filters = { search: '', category: '', condition: '', maxPrice: 5000 };
        state.sort = 'name';
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('conditionFilter').value = '';
        document.getElementById('sortFilter').value = 'name';
        document.getElementById('priceRange').value = '5000';
        applyFilters();
    });
    
    // Modal controls
    const modal = document.getElementById('productModal');
    document.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

// Modal Management
function openModal(productId) {
    const product = components.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const trans = translations[state.language];
    
    document.getElementById('modalImage').src = `Images/${product.image}`;
    document.getElementById('modalImage').onerror = function() { this.style.display = 'none'; };
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalDescription').textContent = product.short;
    document.getElementById('modalPrice').textContent = `${product.price} ${product.currency}`;
    document.getElementById('modalStock').textContent = `${product.stock} units`;
    document.getElementById('modalCondition').textContent = `Condition ${product.condition}`;
    document.getElementById('modalCategory').textContent = product.category;
    
    document.getElementById('priceLabel').textContent = trans.priceLabel;
    document.getElementById('stockLabel').textContent = trans.stockLabel;
    document.getElementById('conditionLabel2').textContent = trans.conditionLabel2;
    document.getElementById('categoryLabel2').textContent = trans.categoryLabel2;
    
    const datasheetsContainer = document.getElementById('datasheetsContainer');
    if (product.datasheets && product.datasheets.length > 0 && product.datasheets[0] !== 'link') {
        datasheetsContainer.innerHTML = `
            <div class="datasheets-title">${trans.datasheetsLabel}</div>
            ${product.datasheets.map(ds => `<a href="${ds}" target="_blank" class="datasheet-link">📄 Datasheet</a>`).join('')}
        `;
    } else {
        datasheetsContainer.innerHTML = '';
    }
    
    document.getElementById('contactBtn').textContent = trans.contactVia;
    document.getElementById('contactBtn').href = 'https://t.me/Ik_electro';
    
    modal.classList.add('active');
}
