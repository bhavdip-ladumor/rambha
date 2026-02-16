/* =========================================
   1. INITIALIZE & CACHING
   ========================================= */
async function initResin() {
    const loader = document.getElementById('loader-wrapper');
    
    try {
        // 1. Check LocalStorage Cache (Expires in 1 hour)
        const cachedData = localStorage.getItem('uttamhub_data');
        const cacheTime = localStorage.getItem('uttamhub_time');
        const now = new Date().getTime();

        if (cachedData && cacheTime && (now - cacheTime < 3600000)) {
            allProducts = JSON.parse(cachedData);
            console.log("⚡ Loaded from Cache");
        } else {
            // Ensure loadProducts() is called if data isn't in global memory
            if (typeof loadProducts === 'function') {
                await loadProducts(); 
                localStorage.setItem('uttamhub_data', JSON.stringify(allProducts));
                localStorage.setItem('uttamhub_time', now.toString());
                console.log("📡 Fresh Fetch from Google Sheets");
            }
        }
        
        // 2. Data Processing: Ensure 'images' array exists for UI logic
        allProducts.forEach(p => {
            if (!p.images) {
                p.images = [p.img1, p.img2, p.img3, p.img4].filter(img => img && img.trim() !== "");
            }
        });

        // 3. Filter and Render Grid
        const resinData = allProducts.filter(p => p.tagweb && p.tagweb.toLowerCase().includes('resin'));
        const uniqueProducts = Array.from(new Map(resinData.map(p => [p.id, p])).values());
        
        renderBrandGrid(uniqueProducts);

        // Check for Shared Product Link
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) showProduct(productId);

        if (loader) loader.classList.add('fade-out');

    } catch (error) {
        console.error("Loading error:", error);
    }
}

/* =========================================
   2. GRID RENDERING (WITH BADGES & SHARING)
   ========================================= */
function renderBrandGrid(data, targetId = "brand-grid") {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    grid.innerHTML = data.map(p => {
        const variants = allProducts.filter(item => item.id === p.id);
        const hasVariants = variants.length > 1;

        return `
        <div class="product-card">
            <div class="card-img-container">
                <div class="share-btn-card" onclick="shareProduct(event, '${p.name}', '${p.id}')">
                    <i class="fas fa-share-nodes"></i>
                </div>
                <div class="delivery-badge">Free <i class="fas fa-truck"></i></div>
                <img src="${p.images[0]}" class="card-img" loading="lazy" onclick="showProduct('${p.id}')">
            </div>
            
            <div class="card-info" onclick="showProduct('${p.id}')">
                <div class="tiny-meta">${p.category} > ${p.subcategory}</div>
                <h4 class="card-title">${p.name}</h4>
                <div class="brand-tag">By ${p.brandname || 'Uttamhub'}</div>
                <div class="price-row">
                    <span class="sale-price">₹${p.sale}</span>
                    <span class="mrp-price">₹${p.mrp}</span>
                </div>
                ${hasVariants ? `<div class="variant-tag">Options Available</div>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

/* =========================================
   3. SHARING LOGIC
   ========================================= */
function shareProduct(event, name, id) {
    event.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;

    if (navigator.share) {
        navigator.share({ title: name, text: `Check this out: ${name}`, url: shareUrl });
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
    }
}

/* =========================================
   4. PRODUCT PAGE (TOP MAIN / BOTTOM THUMBS)
   ========================================= */
function showProduct(id) {
    const variants = allProducts.filter(item => item.id === id);
    if (variants.length === 0) return;
    const p = variants[0];

    document.getElementById('main-view').style.display = 'none';
    const page = document.getElementById('product-page');
    page.style.display = 'block';
    window.scrollTo(0, 0);

    page.innerHTML = `
        <div class="detail-container">
            <button onclick="location.reload()" class="back-btn">← Back to Collection</button>
            
            <div class="product-main-layout">
                <div class="gallery-section">
                    <div class="main-photo-container">
                        <img src="${p.images[0]}" id="main-active-img" class="responsive-photo">
                    </div>
                    <div class="thumbnail-list">
                        ${p.images.map((img, i) => `
                            <div class="thumb-wrapper ${i === 0 ? 'active' : ''}" onclick="updateMainPhoto(this, '${img}')">
                                <img src="${img}" class="thumb-img">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="info-section">
                    <div class="brand-line">By ${p.brandname || 'Uttamhub'}</div>
                    <h1 class="product-title">${p.name}</h1>
                    <div class="price-box">
                        <span class="sale-price" id="det-sale">₹${p.sale}</span>
                        <span class="mrp-price" id="det-mrp">M.R.P: ₹${p.mrp}</span>
                    </div>
                    <div class="moq-tag"><i class="fas fa-box-open"></i> Min. Order: ${p.minOrder || '1'}</div>
                    <div class="variant-area">${generateVariantSelectors(variants)}</div>
                    <div class="description-area">
                        <h3>Product Details</h3>
                        <p>${p.des1 || p.description}</p>
                    </div>
                    <button class="buy-btn" onclick="addSelectedVariantToCart('${p.id}')">Add to Cart</button>
                </div>
            </div>
            <hr class="section-divider">
            <h3 class="similar-heading">Similar Masterpieces</h3>
            <div class="product-grid" id="similar-resin-grid"></div>
        </div>
    `;
    renderSimilar(p);
}

function updateMainPhoto(el, url) {
    document.getElementById('main-active-img').src = url;
    document.querySelectorAll('.thumb-wrapper').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

/* =========================================
   5. VARIANT & SIMILAR LOGIC
   ========================================= */
function generateVariantSelectors(variants) {
    // Uses attributes defined in your script.js mapping
    const labels = ["Size", "Color", "Material"];
    const keys = ["attr1", "attr2", "attr3"];
    
    let html = "";
    keys.forEach((key, i) => {
        const values = [...new Set(variants.map(v => v[key]))].filter(v => v !== "");
        if (values.length > 0) {
            html += `
                <div class="selector-group">
                    <label>${labels[i]}</label>
                    <select class="variant-select" onchange="updateVariantSelection('${variants[0].id}')">
                        ${values.map(val => `<option value="${val}">${val}</option>`).join('')}
                    </select>
                </div>`;
        }
    });
    return html;
}

function updateVariantSelection(id) {
    const variants = allProducts.filter(item => item.id === id);
    const selects = document.querySelectorAll('.variant-select');
    const currentSelections = Array.from(selects).map(s => s.value);

    const match = variants.find(v => {
        const vVals = [v.attr1, v.attr2, v.attr3].filter(val => val !== "");
        return currentSelections.every((val, idx) => vVals[idx] === val);
    }) || variants[0];

    document.getElementById('det-sale').innerText = `₹${match.sale}`;
    document.getElementById('det-mrp').innerText = `₹${match.mrp}`;
    document.getElementById('main-active-img').src = match.images[0];
}

function renderSimilar(p) {
    const currentTags = p.tagweb ? p.tagweb.split(',').map(t => t.trim().toLowerCase()) : [];
    const similar = allProducts.filter(item => {
        if (item.id === p.id) return false;
        const itemTags = item.tagweb ? item.tagweb.split(',').map(t => t.trim().toLowerCase()) : [];
        return currentTags.some(tag => itemTags.includes(tag));
    }).slice(0, 4);
    
    renderBrandGrid(similar, "similar-resin-grid");
}

function addSelectedVariantToCart(id) {
    const variants = allProducts.filter(item => item.id === id);
    const selects = document.querySelectorAll('.variant-select');
    const currentSelections = Array.from(selects).map(s => s.value);
    
    const match = variants.find(v => {
        const vVals = [v.attr1, v.attr2, v.attr3].filter(val => val !== "");
        return currentSelections.every((val, idx) => vVals[idx] === val);
    }) || variants[0];

    if (typeof addToCart === 'function') {
        addToCart(match.id, match);
    }
}

document.addEventListener('DOMContentLoaded', initResin);