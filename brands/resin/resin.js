/**
 * RESIN COSMOS - BRAND LOGIC
 * Optimized for 33-column CSV structure
 */

const RESIN_CONFIG = {
    whatsapp: "919724362981",
    brandTag: "resin", // Matches 'tagweb' column in your Sheet
    containerId: "resin-grid",
    categoryId: "resin-categories"
};

// 1. MAIN INITIALIZER
function initResinPage() {
    // Check if data is already loaded in window.allProducts
    if (window.allProducts && window.allProducts.length > 0) {
        startWorkflow();
    } else {
        // Wait for the signal from script.js
        window.addEventListener('db_ready', () => {
            console.log("Database Ready Signal Received");
            startWorkflow();
        });
    }
}

// 2. COORDINATE FILTERING AND RENDERING
function startWorkflow() {
    // Filter master list by 'tagweb' keyword
    const resinData = window.allProducts.filter(p => 
        p.tagweb && p.tagweb.toLowerCase().includes(RESIN_CONFIG.brandTag)
    );

    if (resinData.length === 0) {
        document.getElementById(RESIN_CONFIG.containerId).innerHTML = 
            `<div style="text-align:center; padding:40px;">No products found for tag: ${RESIN_CONFIG.brandTag}</div>`;
        return;
    }

    renderResinCategories(resinData);
    renderResinGrid(resinData);
}

// 3. RENDER CATEGORY CHIPS
function renderResinCategories(data) {
    const catBox = document.getElementById(RESIN_CONFIG.categoryId);
    if (!catBox) return;

    // Get unique categories
    const categories = ["All", ...new Set(data.map(p => p.category))].filter(Boolean);

    catBox.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="filterByCat('${cat}')">
            ${cat}
        </button>
    `).join('');
}

// 4. RENDER PRODUCT GRID
function renderResinGrid(data) {
    const grid = document.getElementById(RESIN_CONFIG.containerId);
    if (!grid) return;

    // --- UNIQUE ID LOGIC ---
    // This creates a list where each ID only appears once
    const seenIds = new Set();
    const uniqueData = data.filter(item => {
        if (seenIds.has(item.id)) {
            return false;
        }
        seenIds.add(item.id);
        return true;
    });

    grid.innerHTML = uniqueData.map(p => {
        // Variant Logic: Check master list for any other rows with same ID
        const variants = window.allProducts.filter(item => item.id === p.id);
        const hasVariants = variants.length > 1 || p.hasOptions;

        return `
        <div class="product-card">
            <div class="card-img-container">
                <div class="share-btn-card" onclick="shareProduct(event, '${p.name}', '${p.id}')">
                    <i class="fas fa-share-alt"></i>
                </div>
                <div class="delivery-badge">Free <i class="fas fa-truck"></i></div>
                <img src="${p.images[0]}" class="card-img" loading="lazy" 
                     onclick="goToProduct('${p.id}')"
                     onerror="this.src='https://via.placeholder.com/400?text=Product'">
            </div>
            
            <div class="card-info" onclick="goToProduct('${p.id}')">
                <div class="tiny-meta">${p.category} > ${p.subcategory}</div>
                <h4 class="card-title">${p.name}</h4>
                <div class="brand-tag">By ${p.brand || 'Uttamhub'}</div>
                
                <div class="price-row">
                    <span class="sale-price">₹${p.sale}</span>
                    <span class="mrp-price">₹${p.mrp}</span>
                </div>

                ${hasVariants ? `
                    <div class="options-badge">Options Available</div>
                ` : '<div class="options-spacer"></div>'}
            </div>
        </div>
        `;
    }).join('');
}

// 5. INTERACTION LOGIC
function filterByCat(category) {
    const allResin = window.allProducts.filter(p => 
        p.tagweb && p.tagweb.toLowerCase().includes(RESIN_CONFIG.brandTag)
    );

    if (category === "All") {
        renderResinGrid(allResin);
    } else {
        const filtered = allResin.filter(p => p.category === category);
        renderResinGrid(filtered);
    }
}

function shareProduct(event, name, id) {
    event.stopPropagation();
    const shareUrl = `${window.location.origin}/product.html?id=${id}`;
    if (navigator.share) {
        navigator.share({ title: name, url: shareUrl });
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("Link Copied!");
    }
}


/**
 * Opens the product detail page in a new tab (Amazon style)
 * @param {string} id - The unique product ID
 */
function goToProduct(id) {
    // This moves the user to the next page and keeps the previous one in history
    window.location.href = `../../product.html?id=${id}`;
    
    // '_blank' ensures it opens in a new tab
    window.open(url, '_blank');
}



function orderWhatsApp(pName) {
    const msg = encodeURIComponent(`Hi Resin Cosmos, I want to order: ${pName}`);
    window.open(`https://wa.me/${RESIN_CONFIG.whatsapp}?text=${msg}`);
}

// Start the page logic
initResinPage();