// ============================================================
// IK ELECTRO — app.js v6
// Clean rewrite · No Discord · Scroll-spy · Auto year · No flash on lang switch
// ============================================================

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const TELEGRAM_USERNAME = 'Ik_electro';
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;

// ============================================================
// STATE
// ============================================================
const state = {
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'light',
    filters: { search: '', category: '', condition: '', maxPrice: 5000 },
    sort: 'name',
    cart: (() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    })()
};

// Tracks the last-rendered cart count so the badge only bumps on real changes
let lastCartCount = null;

// ============================================================
// PAGINATION
// ============================================================
const PAGE_SIZE = 12;
let currentPage = 1;
let currentFilteredList = [];   // last filtered + sorted list (pre-pagination)

// ============================================================
// CONDITION SYSTEM
// ============================================================
const CONDITIONS = {
    A: { color: '#16a34a', key: 'condNew' },
    B: { color: '#2563eb', key: 'condWorking' },
    C: { color: '#dc2626', key: 'condIssue' },
    D: { color: '#9333ea', key: 'condMixed' }
};

// ============================================================
// TRANSLATIONS
// ============================================================
const translations = {
    en: {
        heroTitle: 'Premium Electronics Components',
        heroSubtitle: 'Discover quality components for your projects',
        searchPlaceholder: 'Search components...',
        searchBtn: 'Search',
        categoryLabel: 'Category:', conditionLabel: 'Condition:',
        sortLabel: 'Sort by:', priceRangeLabel: 'Max Price:',
        resetBtn: 'Reset Filters',
        allCategories: 'All Categories', allConditions: 'All Conditions',
        sortName: 'Name', sortPriceLow: 'Price: Low to High',
        sortPriceHigh: 'Price: High to Low', sortStock: 'Stock Available',
        conditionA: 'A - New', conditionB: 'B - Used (100% working)',
        conditionC: 'C - Has Problem', conditionD: 'D - Mixed Components',
        productsTitle: 'Components Catalog', viewBtn: 'Details',
        addToCart: 'Add', noResults: 'No products found',
        condNew: 'New', condWorking: 'Working',
        condIssue: 'Has Issue', condMixed: 'Mixed',
        inStock: 'in stock', lowStock: 'left', outOfStock: 'Out of stock',
        priceLabel: 'Price:', stockLabel: 'Stock:',
        categoryLabel2: 'Category:', conditionLabel2: 'Condition:',
        datasheetsLabel: 'Datasheets', specsTitle: 'Specifications',
        compatTitle: 'Compatibility', contactVia: 'Contact',
        modalAddCart: 'Add to Cart', contactBtnLabel: 'Contact',
        cartTitle: 'Your Cart', cartEmpty: 'Your cart is empty',
        cartEmptyHint: 'Add some components to get started',
        cartTotalLabel: 'Total:', checkoutLabel: 'Order via Telegram',
        cartNote: 'Hand to hand payment only',
        addedToCart: 'Added to cart', removedFromCart: 'Removed',
        cartCleared: 'Cart cleared',
        headerTelegramLabel: 'Telegram',
        navCatalog: 'Catalog', navServices: 'Services', navAbout: 'About',
        servicesTitle: 'Our Components Service',
        service1Title: 'Quality Components', service1Desc: 'Verified and tested components',
        service2Title: 'Fast Delivery', service2Desc: 'Only delivered to PV1 club members',
        service3Title: 'Component Revival', service3Desc: 'I try to bring dead components back to life',
        service4Title: 'Payment', service4Desc: 'Hand to hand only',
        servicesTitle2: 'Our Services',
        service1Title2: 'Circuit Design', service1Desc2: 'Custom circuit diagrams for your projects.',
        service2Title2: 'Robots & Machines', service2Desc2: 'Assistance with PFE projects, small robots, and simple machines.',
        service3Title2: 'Research', service3Desc2: 'Detailed research on components or machines you need.',
        service4Title2: 'Confidentiality', service4Desc2: 'Your information stays private at all times.',
        footerTagline: 'Electronics & Robotics components for makers, students, and engineers in Algeria.',
        footerLocation: 'Saad Dahleb University — Blida, Algeria',
        footerContactTitle: 'Contact',
        footerDelivery: 'Delivery to PV1 club members only',
        footerPayment: 'Cash — Hand to hand',
        footerServicesTitle: 'Services',
        footerService1: 'Component Revival',
        footerService2: 'Robots & Machines',
        footerService3: 'Research & Consulting',
        footerFollowTitle: 'Follow',
        footerLangs: 'Available in: EN / FR / AR',
        footerCopyright: '© {year} IK Electro. All rights reserved.'
    },
    fr: {
        heroTitle: 'Composants Électroniques Premium',
        heroSubtitle: 'Découvrez des composants de qualité pour vos projets',
        searchPlaceholder: 'Rechercher des composants...',
        searchBtn: 'Chercher',
        categoryLabel: 'Catégorie :', conditionLabel: 'État :',
        sortLabel: 'Trier par :', priceRangeLabel: 'Prix Maximum :',
        resetBtn: 'Réinitialiser',
        allCategories: 'Toutes les catégories', allConditions: 'Tous les états',
        sortName: 'Nom', sortPriceLow: 'Prix : croissant',
        sortPriceHigh: 'Prix : décroissant', sortStock: 'Stock disponible',
        conditionA: 'A - Neuf', conditionB: 'B - Utilisé (100% fonctionnel)',
        conditionC: 'C - Problème', conditionD: 'D - Composants mélangés',
        productsTitle: 'Catalogue des Composants', viewBtn: 'Détails',
        addToCart: 'Ajouter', noResults: 'Aucun produit trouvé',
        condNew: 'Neuf', condWorking: 'Fonctionnel',
        condIssue: 'Problème', condMixed: 'Mélangé',
        inStock: 'en stock', lowStock: 'restants', outOfStock: 'Rupture',
        priceLabel: 'Prix :', stockLabel: 'Stock :',
        categoryLabel2: 'Catégorie :', conditionLabel2: 'État :',
        datasheetsLabel: 'Fiches techniques', specsTitle: 'Spécifications',
        compatTitle: 'Compatibilité', contactVia: 'Contacter',
        modalAddCart: 'Ajouter au panier', contactBtnLabel: 'Contacter',
        cartTitle: 'Votre Panier', cartEmpty: 'Votre panier est vide',
        cartEmptyHint: 'Ajoutez des composants pour commencer',
        cartTotalLabel: 'Total :', checkoutLabel: 'Commander via Telegram',
        cartNote: 'Paiement en main propre uniquement',
        addedToCart: 'Ajouté au panier', removedFromCart: 'Retiré',
        cartCleared: 'Panier vidé',
        headerTelegramLabel: 'Telegram',
        navCatalog: 'Catalogue', navServices: 'Services', navAbout: 'À propos',
        servicesTitle: 'Notre service de composants',
        service1Title: 'Composants de Qualité', service1Desc: 'Composants vérifiés et testés',
        service2Title: 'Livraison Rapide', service2Desc: 'Livraison uniquement aux membres du club PV1',
        service3Title: 'Réparation de Composants', service3Desc: "J'essaie de redonner vie aux composants défectueux",
        service4Title: 'Paiement', service4Desc: 'En main propre uniquement',
        servicesTitle2: 'Nos Services',
        service1Title2: 'Conception de Circuits', service1Desc2: 'Schémas électroniques personnalisés.',
        service2Title2: 'Robots & Machines', service2Desc2: "Assistance pour les projets de fin d'études.",
        service3Title2: 'Recherche', service3Desc2: 'Recherche détaillée sur les composants.',
        service4Title2: 'Confidentialité', service4Desc2: 'Vos informations restent privées.',
        footerTagline: 'Composants électroniques et robotiques pour makers et étudiants en Algérie.',
        footerLocation: 'Université Saad Dahleb — Blida, Algérie',
        footerContactTitle: 'Contact',
        footerDelivery: 'Livraison aux membres du club PV1 uniquement',
        footerPayment: 'Espèces — en main propre',
        footerServicesTitle: 'Services',
        footerService1: 'Réparation de composants',
        footerService2: 'Robots & Machines',
        footerService3: 'Recherche & Conseil',
        footerFollowTitle: 'Suivre',
        footerLangs: 'Disponible en : EN / FR / AR',
        footerCopyright: '© {year} IK Electro. Tous droits réservés.'
    },
    ar: {
        heroTitle: 'مكونات إلكترونية فاخرة',
        heroSubtitle: 'اكتشف المكونات عالية الجودة لمشاريعك',
        searchPlaceholder: 'ابحث عن المكونات...',
        searchBtn: 'بحث',
        categoryLabel: 'الفئة:', conditionLabel: 'الحالة:',
        sortLabel: 'ترتيب حسب:', priceRangeLabel: 'السعر الأقصى:',
        resetBtn: 'إعادة تعيين',
        allCategories: 'كل الفئات', allConditions: 'كل الحالات',
        sortName: 'الاسم', sortPriceLow: 'السعر: من الأقل',
        sortPriceHigh: 'السعر: من الأعلى', sortStock: 'المخزون',
        conditionA: 'أ - جديد', conditionB: 'ب - مستعمل (يعمل 100%)',
        conditionC: 'ج - به مشكلة', conditionD: 'د - مكونات متنوعة',
        productsTitle: 'كتالوج المكونات', viewBtn: 'التفاصيل',
        addToCart: 'أضف', noResults: 'لم يتم العثور على منتجات',
        condNew: 'جديد', condWorking: 'يعمل',
        condIssue: 'به مشكلة', condMixed: 'متنوع',
        inStock: 'متوفر', lowStock: 'متبقي', outOfStock: 'غير متوفر',
        priceLabel: 'السعر:', stockLabel: 'المخزون:',
        categoryLabel2: 'الفئة:', conditionLabel2: 'الحالة:',
        datasheetsLabel: 'ورقات البيانات', specsTitle: 'المواصفات',
        compatTitle: 'التوافق', contactVia: 'تواصل',
        modalAddCart: 'أضف للسلة', contactBtnLabel: 'تواصل',
        cartTitle: 'سلتك', cartEmpty: 'سلتك فارغة',
        cartEmptyHint: 'أضف بعض المكونات للبدء',
        cartTotalLabel: 'المجموع:', checkoutLabel: 'اطلب عبر Telegram',
        cartNote: 'الدفع يد بيد فقط',
        addedToCart: 'أُضيف للسلة', removedFromCart: 'أُزيل',
        cartCleared: 'أُفرغت السلة',
        headerTelegramLabel: 'تيليجرام',
        navCatalog: 'الكتالوج', navServices: 'الخدمات', navAbout: 'حول',
        servicesTitle: 'خدمة المكوّنات لدينا',
        service1Title: 'مكونات عالية الجودة', service1Desc: 'مكونات موثوقة واختبارية',
        service2Title: 'توصيل سريع', service2Desc: 'التوصيل فقط لأعضاء نادي PV1',
        service3Title: 'إحياء المكوّنات', service3Desc: 'أحاول إعادة المكوّنات المعطّلة إلى الحياة',
        service4Title: 'دفع', service4Desc: 'يد بيد فقط',
        servicesTitle2: 'خدماتنا',
        service1Title2: 'تصميم الدارات', service1Desc2: 'مخططات دارات مخصّصة لمشاريعك.',
        service2Title2: 'الروبوتات والآلات', service2Desc2: 'مساعدة في مشاريع التخرج والروبوتات الصغيرة.',
        service3Title2: 'البحث', service3Desc2: 'بحث مفصّل حول المكوّنات.',
        service4Title2: 'السرية', service4Desc2: 'معلوماتك تبقى خاصة في جميع الأوقات.',
        footerTagline: 'مكونات إلكترونية وروبوتية للصناع والطلاب والمهندسين في الجزائر.',
        footerLocation: 'جامعة سعد دحلب — البليدة، الجزائر',
        footerContactTitle: 'التواصل',
        footerDelivery: 'التوصيل لأعضاء نادي PV1 فقط',
        footerPayment: 'نقداً — يد بيد',
        footerServicesTitle: 'الخدمات',
        footerService1: 'إحياء المكونات',
        footerService2: 'الروبوتات والآلات',
        footerService3: 'البحث والاستشارات',
        footerFollowTitle: 'تابعنا',
        footerLangs: 'متوفر بـ: EN / FR / AR',
        footerCopyright: '© {year} IK Electro. جميع الحقوق محفوظة.'
    }
};

// ============================================================
// HELPERS
// ============================================================
function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function getStockStatus(product) {
    if (product.stock <= 0) return 'out';
    if (product.stock <= 3) return 'low';
    return 'in';
}

// Out-of-stock products are hidden from the catalog.
function isAvailable(product) {
    return product && product.stock > 0;
}

function getStockLabel(product) {
    const t = translations[state.language];
    const s = getStockStatus(product);
    if (s === 'out') return t.outOfStock;
    if (s === 'low') return `${product.stock} ${t.lowStock}`;
    return `${product.stock} ${t.inStock}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function $(id) { return document.getElementById(id); }

// Inline SVG helper — references sprite symbols in index.html
function icon(name, extraClass = '') {
    const cls = extraClass ? ` class="${extraClass}"` : '';
    return `<svg${cls} aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
    const container = $('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconName = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
    toast.innerHTML = `${icon(iconName)}<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}

// ============================================================
// COPYRIGHT YEAR (auto-updates every January 1st)
// ============================================================
function updateCopyrightYear() {
    const year = new Date().getFullYear();
    const yearEl = $('footerYear');
    const copyrightEl = $('footerCopyright');

    if (yearEl) yearEl.textContent = year;

    if (copyrightEl) {
        const t = translations[state.language];
        const template = (t.footerCopyright || '© {year} IK Electro. All rights reserved.')
            .replace('{year}', year);
        copyrightEl.textContent = template;
    }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof components === 'undefined') {
        console.error('❌ components.js not loaded');
        return;
    }

    try {
        initializeTheme();
        initializeLanguage();
        populateFilters();
        const available = components.filter(isAvailable);
        renderProducts(available);
        setupEventListeners();
        setupScrollSpy();
        updateCartUI();
        updateCopyrightYear();

        console.log(
            '✅ IK Electro ready —',
            available.length, 'of', components.length, 'components available'
        );
    } catch (err) {
        console.error('❌ Init failed:', err);
    }
});

// ============================================================
// THEME
// ============================================================
function initializeTheme() {
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
    const lightIcon = $('themeIconLight');
    const darkIcon = $('themeIconDark');
    if (!lightIcon || !darkIcon) return;
    const isDark = state.theme === 'dark';
    lightIcon.style.display = isDark ? 'none' : '';
    darkIcon.style.display = isDark ? '' : 'none';
}

// ============================================================
// LANGUAGE
// ============================================================
function initializeLanguage() {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

    // Header and footer stay LTR in every language, including Arabic.
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    if (header) header.setAttribute('dir', 'ltr');
    if (footer) footer.setAttribute('dir', 'ltr');

    updateTranslations();
    updateLanguageButton();
    updateFooterLangButtons();
}

function switchLanguage() {
    const langs = ['en', 'fr', 'ar'];
    const idx = langs.indexOf(state.language);
    setLanguage(langs[(idx + 1) % langs.length]);
}

function setLanguage(lang) {
    if (!translations[lang] || lang === state.language) return;

    // Suppress cart drawer transition while we flip document direction
    const root = document.documentElement;
    root.classList.add('lang-switching');

    state.language = lang;
    localStorage.setItem('language', lang);

    const scrollY = window.scrollY;
    initializeLanguage();
    currentPage = 1;                // reset pagination when language changes
    applyFilters();
    updateCartUI();
    updateCopyrightYear();

    requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });

        // Re-enable transitions after the browser has settled
        requestAnimationFrame(() => {
            root.classList.remove('lang-switching');
        });
    }));
}

function updateTranslations() {
    const t = translations[state.language];
    const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
    const setPH = (id, text) => { const el = $(id); if (el) el.placeholder = text; };

    // Header
    set('headerTelegramLabel', t.headerTelegramLabel);

    // Hero
    set('heroTitle', t.heroTitle);
    set('heroSubtitle', t.heroSubtitle);
    setPH('searchInput', t.searchPlaceholder);
    set('searchBtnLabel', t.searchBtn);

    // Filters
    set('categoryLabel', t.categoryLabel);
    set('conditionLabel', t.conditionLabel);
    set('sortLabel', t.sortLabel);
    set('priceRangeLabel', t.priceRangeLabel);
    set('resetBtn', t.resetBtn);
    set('categoryAllOption', t.allCategories);
    set('conditionAllOption', t.allConditions);
    set('conditionA', t.conditionA);
    set('conditionB', t.conditionB);
    set('conditionC', t.conditionC);
    set('conditionD', t.conditionD);
    set('sortName', t.sortName);
    set('sortPriceLow', t.sortPriceLow);
    set('sortPriceHigh', t.sortPriceHigh);
    set('sortStock', t.sortStock);

    // Products
    set('productsTitle', t.productsTitle);

    // Nav
    set('navCatalog', t.navCatalog);
    set('navServices', t.navServices);
    set('navAbout', t.navAbout);

    // Services (2 groups)
    set('servicesTitle2', t.servicesTitle2);
    set('service1Title2', t.service1Title2);
    set('service1Desc2', t.service1Desc2);
    set('service2Title2', t.service2Title2);
    set('service2Desc2', t.service2Desc2);
    set('service3Title2', t.service3Title2);
    set('service3Desc2', t.service3Desc2);
    set('service4Title2', t.service4Title2);
    set('service4Desc2', t.service4Desc2);

    set('servicesTitle', t.servicesTitle);
    set('service1Title', t.service1Title);
    set('service1Desc', t.service1Desc);
    set('service2Title', t.service2Title);
    set('service2Desc', t.service2Desc);
    set('service3Title', t.service3Title);
    set('service3Desc', t.service3Desc);
    set('service4Title', t.service4Title);
    set('service4Desc', t.service4Desc);

    // Footer
    set('footerTagline', t.footerTagline);
    set('footerLocation', t.footerLocation);
    set('footerContactTitle', t.footerContactTitle);
    set('footerDelivery', t.footerDelivery);
    set('footerPayment', t.footerPayment);
    set('footerServicesTitle', t.footerServicesTitle);
    set('footerService1', t.footerService1);
    set('footerService2', t.footerService2);
    set('footerService3', t.footerService3);
    set('footerFollowTitle', t.footerFollowTitle);
    set('footerLangs', t.footerLangs);
    // Note: footerCopyright handled by updateCopyrightYear()

    // Cart
    set('cartTitle', t.cartTitle);
    set('cartTotalLabel', t.cartTotalLabel);
    set('checkoutLabel', t.checkoutLabel);
    set('cartNote', t.cartNote);

    // Modal
    set('priceLabel', t.priceLabel);
    set('stockLabel', t.stockLabel);
    set('conditionLabel2', t.conditionLabel2);
    set('categoryLabel2', t.categoryLabel2);
    set('specsTitle', t.specsTitle);
    set('compatTitle', t.compatTitle);
    set('contactBtnLabel', t.contactBtnLabel);
    set('modalAddCartLabel', t.modalAddCart);

    document.title = state.language === 'ar'
        ? 'IK Electro — مكونات روبوتية فاخرة'
        : state.language === 'fr'
        ? 'IK Electro — Composants Robotiques Premium'
        : 'IK Electro — Premium Robotics Components';
}

function updateLanguageButton() {
    const langs = { en: 'EN', fr: 'FR', ar: 'AR' };
    const label = $('langLabel');
    if (label) label.textContent = langs[state.language];
}

function updateFooterLangButtons() {
    document.querySelectorAll('.footer-bottom-langs button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.setlang === state.language);
    });
}

// ============================================================
// FILTERS POPULATE
// ============================================================
function populateFilters() {
    const categories = [...new Set(
        components.filter(isAvailable).map(c => c.category)
    )].sort();

    const sel = $('categoryFilter');
    if (!sel) return;

    // Remove any options beyond the "All Categories" placeholder
    while (sel.options.length > 1) sel.remove(1);

    const frag = document.createDocumentFragment();
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        frag.appendChild(opt);
    });
    sel.appendChild(frag);

    const maxPrice = Math.max(...components.map(c => c.price), 5000);
    const pr = $('priceRange');
    if (pr) {
        pr.setAttribute('max', maxPrice);
        pr.value = maxPrice;
        state.filters.maxPrice = maxPrice;
    }
}

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts(list) {
    const grid = $('productsGrid');
    const count = $('productCount');
    if (!grid) return;

    const t = translations[state.language];

    // Store the full filtered+sorted list, then slice for the current page
    currentFilteredList = list;
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // Clamp current page if filters shrank the list
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = list.slice(startIdx, endIdx);

    if (totalItems === 0) {
        grid.innerHTML = `<div class="no-results">${escapeHtml(t.noResults)}</div>`;
        if (count) count.textContent = '0';
        renderPagination(0, 1);
        return;
    }

    grid.innerHTML = pageItems.map(product => {
        const cond = CONDITIONS[product.condition] || { color: '#444', key: 'condMixed' };
        const condLabel = t[cond.key] || product.condition;
        const stockStatus = getStockStatus(product);
        const stockLabel = getStockLabel(product);
        const stockClass = stockStatus === 'out' ? 'out-of-stock'
                          : stockStatus === 'low' ? 'low-stock'
                          : 'in-stock';
        const isOut = product.stock <= 0;

        return `
            <div class="product-card ${isOut ? 'out-of-stock' : ''}" data-id="${product.id}">
                <div class="product-image">
                    <img src="Images/${escapeHtml(product.image)}"
                         alt="${escapeHtml(product.name)}"
                         loading="lazy" decoding="async"
                         width="280" height="180"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="product-image-placeholder" style="display:${product.image ? 'none' : 'flex'}">
                        ${icon('package')}
                    </div>
                    <div class="product-badge" style="background-color:${cond.color};">
                        ${escapeHtml(condLabel)}
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <p class="product-short">${escapeHtml(product.short)}</p>
                    <div class="product-meta">
                        <span class="stock-pill ${stockClass}">${escapeHtml(stockLabel)}</span>
                        <span class="meta-item">${escapeHtml(product.category)}</span>
                    </div>
                    <div class="product-price">${product.price} ${escapeHtml(product.currency)}</div>
                    <div class="product-footer">
                        <button class="btn-view" data-action="view" type="button">${escapeHtml(t.viewBtn)}</button>
                        <button class="btn-add-cart" data-action="add" type="button" ${isOut ? 'disabled' : ''}>
                            ${icon('cart')}
                            <span>${escapeHtml(t.addToCart)}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (count) count.textContent = totalItems;

    renderPagination(totalPages, currentPage);
}

// ============================================================
// PAGINATION RENDER
// ============================================================
function renderPagination(totalPages, activePage) {
    const nav = $('pagination');
    if (!nav) return;

    // Nothing to render if only one page or empty
    if (totalPages <= 1) {
        nav.innerHTML = '';
        nav.style.display = 'none';
        return;
    }
    nav.style.display = 'flex';

    const t = translations[state.language];
    const labels = {
        en: { prev: 'Previous', next: 'Next', page: 'Page' },
        fr: { prev: 'Précédent', next: 'Suivant', page: 'Page' },
        ar: { prev: 'السابق', next: 'التالي', page: 'صفحة' }
    }[state.language] || { prev: 'Previous', next: 'Next', page: 'Page' };

    const pageNumbers = buildPageNumbers(activePage, totalPages);

    const html = `
        <button class="page-btn page-prev" data-page="${activePage - 1}"
                type="button" ${activePage === 1 ? 'disabled' : ''}
                aria-label="${labels.prev}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span class="page-label">${escapeHtml(labels.prev)}</span>
        </button>

        ${pageNumbers.map(p => {
            if (p === '…') {
                return `<span class="page-ellipsis" aria-hidden="true">…</span>`;
            }
            const isActive = p === activePage;
            return `
                <button class="page-btn page-number ${isActive ? 'active' : ''}"
                        data-page="${p}" type="button"
                        ${isActive ? 'aria-current="page"' : ''}>
                    ${p}
                </button>
            `;
        }).join('')}

        <button class="page-btn page-next" data-page="${activePage + 1}"
                type="button" ${activePage === totalPages ? 'disabled' : ''}
                aria-label="${labels.next}">
            <span class="page-label">${escapeHtml(labels.next)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </button>
    `;

    nav.innerHTML = html;
}

// Builds the compact list of page numbers, e.g. [1, '…', 4, 5, 6, '…', 20]
function buildPageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [1];

    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);

    if (left > 2) pages.push('…');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('…');

    pages.push(total);
    return pages;
}

// Called when user clicks a pagination control
function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(currentFilteredList.length / PAGE_SIZE));
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;

    // Re-render only the products grid + pagination (not the entire filter pipeline)
    renderProducts(currentFilteredList);

    // Smoothly scroll to the top of the products section
    const section = $('catalog');
    if (section) {
        const y = section.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

// ============================================================
// FILTER + SORT
// ============================================================
function applyFilters() {
    const q = state.filters.search.toLowerCase().trim();

    let filtered = components.filter(product => {
        if (!isAvailable(product)) return false;

        const matchesSearch = !q || (
            product.name.toLowerCase().includes(q) ||
            product.short.toLowerCase().includes(q) ||
            product.category.toLowerCase().includes(q) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(q)))
        );
        const matchesCat = !state.filters.category || product.category === state.filters.category;
        const matchesCond = !state.filters.condition || product.condition === state.filters.condition;
        const matchesPrice = product.price <= state.filters.maxPrice;
        return matchesSearch && matchesCat && matchesCond && matchesPrice;
    });

    filtered = sortProducts(filtered);

    // Reset to page 1 whenever the filter set changes
    currentPage = 1;

    renderProducts(filtered);
}

function sortProducts(products) {
    const sorted = [...products];
    switch (state.sort) {
        case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'price-low': return sorted.sort((a, b) => a.price - b.price);
        case 'price-high': return sorted.sort((a, b) => b.price - a.price);
        case 'stock': return sorted.sort((a, b) => b.stock - a.stock);
        default: return sorted;
    }
}

// ============================================================
// CART
// ============================================================
function saveCart() {
    try { localStorage.setItem('cart', JSON.stringify(state.cart)); } catch (e) {}
}

function getCartCount() {
    return Object.values(state.cart).reduce((s, q) => s + q, 0);
}

function getCartTotal() {
    let total = 0;
    for (const [id, qty] of Object.entries(state.cart)) {
        const p = components.find(c => c.id === id);
        if (p) total += p.price * qty;
    }
    return total;
}

function addToCart(productId) {
    const product = components.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
        showToast(translations[state.language].outOfStock, 'error');
        return;
    }
    const current = state.cart[productId] || 0;
    if (current >= product.stock) {
        showToast(translations[state.language].outOfStock, 'error');
        return;
    }
    state.cart[productId] = current + 1;
    saveCart();
    updateCartUI();
    showToast(`${product.name} — ${translations[state.language].addedToCart}`, 'success');
}

function removeFromCart(productId) {
    if (!state.cart[productId]) return;
    delete state.cart[productId];
    saveCart();
    updateCartUI();
    showToast(translations[state.language].removedFromCart);
}

function updateCartQty(productId, delta) {
    const product = components.find(p => p.id === productId);
    if (!product) return;

    const current = state.cart[productId] || 0;
    const next = current + delta;

    if (next <= 0) { removeFromCart(productId); return; }
    if (next > product.stock) {
        showToast(translations[state.language].outOfStock, 'error');
        return;
    }
    state.cart[productId] = next;
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const badge = $('cartBadge');
    const itemsContainer = $('cartItems');
    const totalEl = $('cartTotal');
    const checkoutBtn = $('checkoutBtn');
    const t = translations[state.language];

    const count = getCartCount();
    if (badge) {
        // Only bump when the number actually changed (not on language swap)
        const countChanged = lastCartCount !== null && count !== lastCartCount;

        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';

        if (countChanged) {
            badge.classList.remove('bump');
            void badge.offsetWidth;
            badge.classList.add('bump');
            setTimeout(() => badge.classList.remove('bump'), 320);
        }
    }
    lastCartCount = count;

    if (!itemsContainer) return;

    const entries = Object.entries(state.cart);

    if (entries.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">${icon('cart')}</div>
                <p style="font-weight:700;margin-bottom:0.5rem;">${escapeHtml(t.cartEmpty)}</p>
                <p style="font-size:0.85rem;">${escapeHtml(t.cartEmptyHint)}</p>
            </div>
        `;
    } else {
        itemsContainer.innerHTML = entries.map(([id, qty]) => {
            const product = components.find(p => p.id === id);
            if (!product) return '';

            const imgHtml = product.image
                ? `<img src="Images/${escapeHtml(product.image)}"
                        alt="${escapeHtml(product.name)}"
                        onerror="this.parentElement.innerHTML='${icon('package').replace(/'/g, "\\'")}'">`
                : icon('package');

            return `
                <div class="cart-item" data-id="${id}">
                    <div class="cart-item-image">${imgHtml}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</div>
                        <div class="cart-item-price">${product.price} ${escapeHtml(product.currency)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn" data-action="dec" type="button">−</button>
                            <span class="qty-value">${qty}</span>
                            <button class="qty-btn" data-action="inc" type="button">+</button>
                        </div>
                    </div>
                    <button class="cart-remove" data-action="remove" type="button" aria-label="Remove">
                        ${icon('trash')}
                    </button>
                </div>
            `;
        }).join('');
    }

    if (totalEl) totalEl.textContent = `${getCartTotal().toLocaleString()} DZD`;
    if (checkoutBtn) checkoutBtn.disabled = entries.length === 0;
}

function openCart() {
    const drawer = $('cartDrawer');
    const overlay = $('cartOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const drawer = $('cartDrawer');
    const overlay = $('cartOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================================
// ORDER MESSAGE + TELEGRAM CHECKOUT
// ============================================================
function buildOrderMessage(entries, extraNote) {
    const header = {
        en: 'IK ELECTRO — ORDER REQUEST',
        fr: 'IK ELECTRO — DEMANDE DE COMMANDE',
        ar: 'IK ELECTRO — طلب شراء'
    }[state.language];

    const labels = {
        en: {
            name: 'Name',
            studentId: 'Student ID',
            phone: 'Phone',
            items: 'Items requested',
            total: 'Total',
            delivery: 'Delivery',
            deliveryValue: 'PV1 Club — Hand to hand',
            payment: 'Payment',
            paymentValue: 'Cash on delivery',
            notes: 'Notes',
            footer: 'Sent from IK Electro catalog'
        },
        fr: {
            name: 'Nom',
            studentId: 'Numéro étudiant',
            phone: 'Téléphone',
            items: 'Articles demandés',
            total: 'Total',
            delivery: 'Livraison',
            deliveryValue: 'Club PV1 — En main propre',
            payment: 'Paiement',
            paymentValue: 'Espèces à la livraison',
            notes: 'Remarques',
            footer: 'Envoyé depuis le catalogue IK Electro'
        },
        ar: {
            name: 'الاسم',
            studentId: 'رقم الطالب',
            phone: 'الهاتف',
            items: 'العناصر المطلوبة',
            total: 'المجموع',
            delivery: 'التسليم',
            deliveryValue: 'نادي PV1 — يد بيد',
            payment: 'الدفع',
            paymentValue: 'نقداً عند التسليم',
            notes: 'ملاحظات',
            footer: 'أُرسلت من كتالوج IK Electro'
        }
    }[state.language];

    const lines = [];
    lines.push(header);
    lines.push('');
    lines.push(`${labels.name}: ______`);
    lines.push(`${labels.studentId}: ______`);
    lines.push(`${labels.phone}: ______`);
    lines.push('');
    lines.push(labels.items + ':');

    let total = 0;
    entries.forEach(([id, qty], idx) => {
        const p = components.find(c => c.id === id);
        if (!p) return;
        const subtotal = p.price * qty;
        total += subtotal;
        lines.push(`${idx + 1}. ${p.name} × ${qty} — ${subtotal} ${p.currency}`);
    });

    lines.push('');
    lines.push(`${labels.total}: ${total} DZD`);
    lines.push(`${labels.delivery}: ${labels.deliveryValue}`);
    lines.push(`${labels.payment}: ${labels.paymentValue}`);
    lines.push('');
    lines.push(`${labels.notes}: ${extraNote || '______'}`);
    lines.push('');
    lines.push(labels.footer);

    return lines.join('\n');
}

function checkoutViaTelegram() {
    const entries = Object.entries(state.cart);
    if (entries.length === 0) return;

    const msg = buildOrderMessage(entries, '');
    const url = `${TELEGRAM_URL}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
}

// ============================================================
// SCROLL-SPY (highlights nav link matching current section)
// ============================================================
function setupScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-link[data-nav]');
    const sectionIds = ['catalog', 'services', 'about'];

    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.nav === id);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
            setActive(visible[0].target.id);
        }
    }, {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    const on = (id, event, fn) => {
        const el = $(id);
        if (el) el.addEventListener(event, fn);
    };

    on('themeToggle', 'click', toggleTheme);
    on('langBtn', 'click', switchLanguage);

    // Search
    const onSearch = debounce((v) => {
        state.filters.search = v;
        applyFilters();
    }, 200);

    const searchInput = $('searchInput');
    if (searchInput) searchInput.addEventListener('input', e => onSearch(e.target.value));

    on('searchBtn', 'click', () => {
        if (searchInput) {
            state.filters.search = searchInput.value;
            applyFilters();
        }
    });

    on('categoryFilter', 'change', e => {
        state.filters.category = e.target.value;
        applyFilters();
    });

    on('conditionFilter', 'change', e => {
        state.filters.condition = e.target.value;
        applyFilters();
    });

    on('sortFilter', 'change', e => {
        state.sort = e.target.value;
        applyFilters();
    });

    const onPrice = debounce((v) => {
        state.filters.maxPrice = parseInt(v, 10) || 0;
        applyFilters();
    }, 250);

    const priceRange = $('priceRange');
    if (priceRange) priceRange.addEventListener('input', e => onPrice(e.target.value));

    on('resetBtn', 'click', () => {
        const maxPrice = parseInt(priceRange?.getAttribute('max') || '5000', 10);
        state.filters = { search: '', category: '', condition: '', maxPrice };
        state.sort = 'name';
        if (searchInput) searchInput.value = '';
        const cf = $('categoryFilter'); if (cf) cf.value = '';
        const cnf = $('conditionFilter'); if (cnf) cnf.value = '';
        const sf = $('sortFilter'); if (sf) sf.value = 'name';
        if (priceRange) priceRange.value = maxPrice;
        applyFilters();
    });

    // Product grid delegation
    const grid = $('productsGrid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            const id = card.dataset.id;
            const actionBtn = e.target.closest('[data-action]');

            if (actionBtn && actionBtn.dataset.action === 'add') {
                e.stopPropagation();
                addToCart(id);
                return;
            }
            openModal(id);
        });
    }

    // Pagination delegation
    const pagination = $('pagination');
    if (pagination) {
        pagination.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;
            const page = parseInt(btn.dataset.page, 10);
            if (!isNaN(page)) goToPage(page);
        });
    }

    // Cart
    on('cartToggle', 'click', openCart);
    on('cartClose', 'click', closeCart);
    on('cartOverlay', 'click', closeCart);
    on('checkoutBtn', 'click', checkoutViaTelegram);

    const cartItems = $('cartItems');
    if (cartItems) {
        cartItems.addEventListener('click', (e) => {
            const item = e.target.closest('.cart-item');
            if (!item) return;
            const id = item.dataset.id;
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            if (action === 'inc') updateCartQty(id, 1);
            else if (action === 'dec') updateCartQty(id, -1);
            else if (action === 'remove') removeFromCart(id);
        });
    }

    // Product modal
    const modal = $('productModal');
    const modalClose = modal ? modal.querySelector('.modal-close') : null;

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Esc key closes modal or cart
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (modal && modal.classList.contains('active')) closeModal();
        const drawer = $('cartDrawer');
        if (drawer && drawer.classList.contains('open')) closeCart();
    });

    // Modal add-to-cart
    const modalAdd = $('modalAddCartBtn');
    if (modalAdd) {
        modalAdd.addEventListener('click', () => {
            const id = modalAdd.dataset.productId;
            if (id) addToCart(id);
        });
    }

    // Footer language buttons
    document.querySelectorAll('.footer-bottom-langs button').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.setlang));
    });
}

// ============================================================
// MODAL
// ============================================================
function openModal(productId) {
    const product = components.find(p => p.id === productId);
    if (!product) {
        console.warn('Product not found:', productId);
        return;
    }

    const modal = $('productModal');
    if (!modal) {
        console.error('❌ #productModal missing');
        return;
    }

    const t = translations[state.language];

    const setT = (id, text) => { const el = $(id); if (el) el.textContent = text; };
    const setD = (id, disp) => { const el = $(id); if (el) el.style.display = disp; };
    const setH = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };

    // Image
    const img = $('modalImage');
    if (img) {
        if (product.image) {
            img.style.display = '';
            img.src = `Images/${product.image}`;
            img.alt = product.name;
            img.onerror = function () { this.style.display = 'none'; };
        } else {
            img.style.display = 'none';
        }
    }

    // Text
    setT('modalTitle', product.name);
    setT('modalDescription', product.short);
    setT('modalPrice', `${product.price} ${product.currency}`);
    setT('modalStock', getStockLabel(product));

    const cond = CONDITIONS[product.condition];
    const condLabel = cond ? t[cond.key] : product.condition;
    setT('modalCondition', condLabel);
    setT('modalCategory', product.category);

    // Labels
    setT('priceLabel', t.priceLabel);
    setT('stockLabel', t.stockLabel);
    setT('conditionLabel2', t.conditionLabel2);
    setT('categoryLabel2', t.categoryLabel2);
    setT('specsTitle', t.specsTitle);
    setT('compatTitle', t.compatTitle);
    setT('contactBtnLabel', t.contactBtnLabel);
    setT('modalAddCartLabel', t.modalAddCart);

    // Specs
    if (product.specs && Object.keys(product.specs).length > 0) {
        setD('specsSection', 'block');
        setH('specsGrid', Object.entries(product.specs).map(([k, v]) => `
            <div class="spec-item">
                <span class="spec-key">${escapeHtml(k)}</span>
                <span class="spec-val">${escapeHtml(v)}</span>
            </div>
        `).join(''));
    } else {
        setD('specsSection', 'none');
    }

    // Compatibility
    if (product.compatibility && product.compatibility.length > 0) {
        setD('compatSection', 'block');
        setH('compatTags', product.compatibility.map(c =>
            `<span class="compat-tag">${escapeHtml(c)}</span>`
        ).join(''));
    } else {
        setD('compatSection', 'none');
    }

    // Datasheets
    if (product.datasheets && product.datasheets.length > 0 && product.datasheets[0] !== 'link') {
        setH('datasheetsContainer', `
            <div class="datasheets-title">${escapeHtml(t.datasheetsLabel)}</div>
            ${product.datasheets.map(ds =>
                `<a href="${escapeHtml(ds)}" target="_blank" rel="noopener" class="datasheet-link">
                    ${icon('file')} Datasheet
                </a>`
            ).join('')}
        `);
    } else {
        setH('datasheetsContainer', '');
    }

    // Contact
    const contactBtn = $('contactBtn');
    if (contactBtn) contactBtn.href = TELEGRAM_URL;

    // Add to cart
    const modalAdd = $('modalAddCartBtn');
    if (modalAdd) {
        modalAdd.dataset.productId = product.id;
        modalAdd.disabled = product.stock <= 0;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}