const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyhRUS6VfWR-5OMp07wLXBKSXWF_ojrrKBBo8HCek_6qgX9zC4bkklflC-vegUp0xC8zGZlvzsVh7I/pub?gid=1029231511&single=true&output=csv';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('SHOP_CART')) || [];
const clean = (val) => val ? val.replace(/"/g, '').trim() : "";

// Your updated 33-column configuration
const col = {
    id: 1, skuId: 2, name: 3, category: 4, subcategory: 5,
    tagweb: 6, brand: 7, attrName: 8, attrValue: 9, tagline: 10,
    description: 11, otherDetails: 12, mrp: 13, sellingPrice: 14,
    stock: 15, minOrder: 16, isKit: 17, kitName: 18, kitComponents: 19,
    keyword: 20, trending: 21, delivery: 22, 
    img1: 23, img2: 24, img3: 25, img4: 26, img5: 27,
    img6: 28, img7: 29, img8: 30, img9: 31, img10: 32, vid: 33
};

function mapRowToProduct(cols) {
    const rawTagweb = clean(cols[col.tagweb - 1]);
    const rawNames = clean(cols[col.attrName - 1]);
    const rawValues = clean(cols[col.attrValue - 1]);
    
    const namesArr = rawNames ? rawNames.split(',').map(s => s.trim()) : [];
    const valuesArr = rawValues ? rawValues.split(',').map(s => s.trim()) : [];

    const attributes = namesArr.map((name, index) => ({
        name: name,
        value: valuesArr[index] || "" 
    }));

    return {
        id: clean(cols[col.id - 1]),
        sku: clean(cols[col.skuId - 1]),
        name: clean(cols[col.name - 1]),
        category: clean(cols[col.category - 1]),
        subcategory: clean(cols[col.subcategory - 1]),
        tagweb: rawTagweb,
        brand: clean(cols[col.brand - 1]),
        attr1: namesArr[0] ? `${namesArr[0]}: ${valuesArr[0] || ''}` : "",
        attr2: namesArr[1] ? `${namesArr[1]}: ${valuesArr[1] || ''}` : "",
        attr3: namesArr[2] ? `${namesArr[2]}: ${valuesArr[2] || ''}` : "",
        tagline: clean(cols[col.tagline - 1]),
        description: clean(cols[col.description - 1]),
        details: clean(cols[col.otherDetails - 1]),
        mrp: clean(cols[col.mrp - 1]) || "0",
        sale: clean(cols[col.sellingPrice - 1]) || "0",
        stock: clean(cols[col.stock - 1]),
        minOrder: clean(cols[col.minOrder - 1]),
        isKit: clean(cols[col.isKit - 1]).toLowerCase() === 'true',
        kitName: clean(cols[col.kitName - 1]),
        kitComponents: clean(cols[col.kitComponents - 1]),
        keywords: clean(cols[col.keyword - 1]),
        trending: clean(cols[col.trending - 1]),
        delivery: clean(cols[col.delivery - 1]),
        images: [
            clean(cols[col.img1 - 1]), clean(cols[col.img2 - 1]), 
            clean(cols[col.img3 - 1]), clean(cols[col.img4 - 1]),
            clean(cols[col.img5 - 1]), clean(cols[col.img6 - 1]),
            clean(cols[col.img7 - 1]), clean(cols[col.img8 - 1]),
            clean(cols[col.img9 - 1]), clean(cols[col.img10 - 1])
        ].filter(img => img !== ""),
        vid: clean(cols[col.vid - 1]),
        hasOptions: attributes.length > 0
    };
}

async function loadProducts() {
    const CACHE_KEY = 'UTTAM_HUB_PRODUCTS';
    const CACHE_TIME_KEY = 'UTTAM_HUB_TIMESTAMP';
    const EXPIRE_TIME = 20 * 1000; 

    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (cachedData && cachedTime && (now - cachedTime < EXPIRE_TIME)) {
            window.allProducts = JSON.parse(cachedData); // Store in window for global access
            window.dispatchEvent(new Event('db_ready')); // Signal that data is ready
            return;
        }

        const response = await fetch(CSV_URL);
        const data = await response.text();
        const rows = data.split(/\r?\n/).filter(row => row.trim() !== "");

        window.allProducts = []; 
        rows.slice(1).forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length > 1) {
                window.allProducts.push(mapRowToProduct(cols));
            }
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(window.allProducts));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        
        // Final signal for brand pages like resin.js
        window.dispatchEvent(new Event('db_ready'));

    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

// Global helper
window.getProductById = function(id) {
    return (window.allProducts || []).find(product => product.id === id);
};

// Start the engine
loadProducts();

// Sidebar and Menu Sync logic
function toggleMenu() {
    const side = document.getElementById('side-panel');
    const overlay = document.getElementById('menu-overlay');
    if(side) side.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
    document.body.style.overflow = side.classList.contains('active') ? 'hidden' : 'auto';
}

function syncSideMenu() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    const sidePanelLinks = document.getElementById('side-panel-links');
    if(!navPlaceholder || !sidePanelLinks) return;
    
    const checkNav = setInterval(() => {
        const cards = navPlaceholder.querySelectorAll('.card');
        if (cards.length > 0) {
            sidePanelLinks.innerHTML = "";
            cards.forEach(card => {
                const originalLink = card.querySelector('a');
                const title = card.querySelector('h3').innerText;
                const iconClass = card.querySelector('i').className;
                const newLink = document.createElement('a');
                newLink.href = originalLink.getAttribute('href');
                newLink.innerHTML = `<i class="${iconClass}"></i> ${title}`;
                newLink.onclick = () => toggleMenu();
                sidePanelLinks.appendChild(newLink);
            });
            clearInterval(checkNav);
        }
    }, 500);
}

window.addEventListener('DOMContentLoaded', syncSideMenu);