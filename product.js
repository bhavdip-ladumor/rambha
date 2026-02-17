/**
 * PRODUCT PAGE ENGINE - product.js
 * Handles 33-column mapping, Variant switching, and Tagweb-based discovery loop.
 */

let currentProduct = null;
let allVariants = [];

async function initProductPage() {
    // 1. Get IDs from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const skuId = params.get('sku');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Wait for Master Data (script.js)
    if (window.allProducts && window.allProducts.length > 0) {
        renderProductDetails(productId, skuId);
    } else {
        window.addEventListener('db_ready', () => {
            renderProductDetails(productId, skuId);
        });
    }
}

function renderProductDetails(id, skuId) {
    // Find all rows with the same ID (the variants)
    allVariants = window.allProducts.filter(p => p.id === id);
    
    if (allVariants.length === 0) {
        document.body.innerHTML = `<div style="text-align:center; padding:100px;"><h2>Product Not Found</h2><a href="index.html">Back to Home</a></div>`;
        return;
    }

    // Select the variant (either matching SKU or the first row)
    currentProduct = skuId ? allVariants.find(v => v.sku === skuId) : allVariants[0];
    if (!currentProduct) currentProduct = allVariants[0];

    // --- 1. UPDATE BASIC INFO ---
    document.title = `${currentProduct.name} | Uttamhub`;
    document.getElementById('product-brand').innerText = `By ${currentProduct.brand || 'Uttamhub'}`;
    document.getElementById('product-name').innerText = currentProduct.name;
    document.getElementById('product-description').innerText = currentProduct.description;
    
    // Price Update
    document.getElementById('product-sale').innerText = `₹${currentProduct.sale}`;
    document.getElementById('product-mrp').innerText = `₹${currentProduct.mrp}`;
    
    const discElement = document.getElementById('product-discount');
    const s = parseFloat(currentProduct.sale);
    const m = parseFloat(currentProduct.mrp);
    if (m > s) {
        const disc = Math.round(((m - s) / m) * 100);
        discElement.innerText = `${disc}% OFF`;
        discElement.style.display = 'inline';
    } else {
        discElement.style.display = 'none';
    }

    // --- 2. IMAGE GALLERY ---
    const mainImg = document.getElementById('main-display-img');
    mainImg.src = currentProduct.images[0];
    
    const thumbList = document.getElementById('thumb-list');
    thumbList.innerHTML = currentProduct.images.map((img, idx) => `
        <img src="${img}" class="${img === currentProduct.images[0] ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
    `).join('');

    // --- 3. VARIANT PILLS (The "Option Switch") ---
    const attrBox = document.getElementById('attributes-container');
    if (allVariants.length > 1) {
        attrBox.innerHTML = `<h4>Select Option:</h4><div class="pill-flex">` + allVariants.map(v => {
            const isActive = v.sku === currentProduct.sku ? 'active-pill' : '';
            return `<span class="attr-pill ${isActive}" onclick="changeVariant('${v.id}', '${v.sku}')">
                ${v.attr1 || v.sku}
            </span>`;
        }).join('') + `</div>`;
    } else {
        attrBox.innerHTML = currentProduct.attr1 ? `<span class="attr-pill">${currentProduct.attr1}</span>` : '';
    }

    // --- 4. BREADCRUMBS ---
    const bc = document.getElementById('breadcrumb');
    if(bc) bc.innerHTML = `<a href="index.html">Home</a> / <span>${currentProduct.category}</span>`;

    // --- 5. SIMILAR PRODUCTS (Tagweb Loop) ---
    renderSimilarByTag(currentProduct.tagweb, currentProduct.id, currentProduct.category);
}

// SWITCH VARIANT: replaceState ensures "Back" button ignores this specific click
function changeVariant(id, sku) {
    const newUrl = `${window.location.pathname}?id=${id}&sku=${sku}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
    renderProductDetails(id, sku);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeMainImage(el, src) {
    document.getElementById('main-display-img').src = src;
    document.querySelectorAll('#thumb-list img').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function renderSimilarByTag(tag, currentId) {
    const grid = document.getElementById('similar-products-grid');
    if (!grid) return;

    // 1. Clean the tag (handle spaces and case)
    const targetTag = (tag || "").toLowerCase().trim();
    console.log("Searching for similar products with tag:", targetTag);

    // 2. Filter logic
    const seenIds = new Set();
    const similar = window.allProducts.filter(p => {
        // Ensure p.tagweb exists before checking
        const pTag = (p.tagweb || "").toLowerCase().trim();
        
        // Match if tags are the same AND it's not the current product
        const isMatch = pTag === targetTag && String(p.id) !== String(currentId);
        
        // Only return true if we haven't added this ID yet (to handle variants)
        if (isMatch && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            return true;
        }
        return false;
    });

    console.log("Total unique similar products found:", similar.length);

    // 3. If none found, don't hide yet—try a "Partial Match" (e.g., 'resin' inside 'resin clock')
    if (similar.length === 0) {
        const fallback = window.allProducts.filter(p => {
            const pTag = (p.tagweb || "").toLowerCase().trim();
            return pTag.includes(targetTag) && String(p.id) !== String(currentId) && !seenIds.has(p.id);
        });
        similar.push(...fallback);
    }

    // 4. Render up to 10 items
    if (similar.length === 0) {
        document.querySelector('.similar-products-container').style.display = 'none';
        return;
    }

    grid.innerHTML = similar.slice(0, 10).map(p => `
        <div class="product-card" onclick="goToProduct('${p.id}')">
            <div class="card-img-container">
                <div class="delivery-badge">Free <i class="fas fa-truck"></i></div>
                <img src="${p.images[0]}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <h4 class="card-title">${p.name}</h4>
                <div class="price-row">
                    <span class="sale-price">₹${p.sale}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function goToProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

function handleWhatsAppOrder() {
    const text = `Hi Uttamhub! I want to order:
Product: ${currentProduct.name}
ID: ${currentProduct.id}
Variant: ${currentProduct.attr1 || 'Default'}
Price: ₹${currentProduct.sale}
Link: ${window.location.href}`;
    window.open(`https://wa.me/919724362981?text=${encodeURIComponent(text)}`, '_blank');
}

initProductPage();