
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyhRUS6VfWR-5OMp07wLXBKSXWF_ojrrKBBo8HCek_6qgX9zC4bkklflC-vegUp0xC8zGZlvzsVh7I/pub?gid=1029231511&single=true&output=csv';

let allProducts = [];
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
    // 1. Handle tagweb as a list for internal processing
    const rawTagweb = clean(cols[col.tagweb - 1]);
    
    // 2. Handle paired attributes (e.g., Names: "width,size" | Values: "4_mm,8_inch")
    const rawNames = clean(cols[col.attrName - 1]);
    const rawValues = clean(cols[col.attrValue - 1]);
    
    const namesArr = rawNames ? rawNames.split(',').map(s => s.trim()) : [];
    const valuesArr = rawValues ? rawValues.split(',').map(s => s.trim()) : [];

    // Creating the attributes array for "hasOptions" logic
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
        tagweb: rawTagweb, // Raw string for the split logic in renderSidePanelData
        brand: clean(cols[col.brand - 1]),
        // Paired Attributes for use in Cards and Popups
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
            allProducts = JSON.parse(cachedData);
            renderSidePanelData(); 
            return;
        }

        const response = await fetch(CSV_URL);
        const data = await response.text();
        const rows = data.split(/\r?\n/).filter(row => row.trim() !== "");

        allProducts = []; 
        rows.slice(1).forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length > 1) {
                allProducts.push(mapRowToProduct(cols));
            }
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(allProducts));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        
        renderSidePanelData(); 

    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

function renderSidePanelData() {
    const partnersList = document.getElementById('side-partners-list');
    const categoryList = document.getElementById('side-category-list');

    if (!allProducts || allProducts.length === 0) return;

    // 1. Business Partners (tagweb) - Splitting by comma
    let allTags = [];
    allProducts.forEach(p => {
        if (p.tagweb) {
            const splitTags = p.tagweb.split(',').map(tag => tag.trim());
            allTags = allTags.concat(splitTags);
        }
    });
    const uniquePartners = [...new Set(allTags)].filter(Boolean).sort();

    if (partnersList) {
        partnersList.innerHTML = uniquePartners.map(name => `
            <a href="#" class="side-partner-link" onclick="filterView('${name}', this); toggleMenu();">
                <i class="fas fa-handshake"></i> ${name}
            </a>
        `).join('');
    }

    // 2. Categories - Splitting by comma
    let allCats = [];
    allProducts.forEach(p => {
        if (p.category) {
            const splitCats = p.category.split(',').map(cat => cat.trim());
            allCats = allCats.concat(splitCats);
        }
    });
    const uniqueCats = [...new Set(allCats)].filter(Boolean).sort();

    if (categoryList) {
        categoryList.innerHTML = `<a href="javascript:void(0)" class="side-cat-item active" onclick="filterView('all', this)">All Category</a>`;
        categoryList.innerHTML += uniqueCats.map(cat => `
            <a href="#" onclick="filterView('${cat}', this); toggleMenu();">${cat}</a>
        `).join('');
    }
}

function togglePartnersList() {
    const container = document.getElementById('partners-container');
    const btn = document.getElementById('view-all-partners');
    if (!container || !btn) return;
    
    const isExpanded = container.classList.toggle('show-all');
    btn.innerText = isExpanded ? "Show Less" : "View All";
}

// Initial Load
loadProducts();



//let selectedAttrs = {}; // Stores user selection for the popup


//-------------search and main manu ------------------------------------------

    //----search ------------------
function handleSearch() {
    const query = document.getElementById('db-search').value.toLowerCase();
    const filtered = allProducts.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.brand.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.subcategory.toLowerCase().includes(query) ||
        item.keyword.toLowerCase().includes(query)
    );
    renderProducts(filtered); // Or whichever display function you use
}

//------------------mainmanu-------------------------------------
     // -----------------------------------------------nevgation panel icon---------------------------------
// Function to toggle Menu
function toggleMenu() {
    document.getElementById('side-panel').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
}

// Function to sync links from navigation.html to Side Panel
function syncSideMenu() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    const sidePanelLinks = document.getElementById('side-panel-links');
    
    // Wait for navigation.html to be loaded
    const checkNav = setInterval(() => {
        const links = navPlaceholder.querySelectorAll('.card');
        if (links.length > 0) {
            sidePanelLinks.innerHTML = ""; // Clear loader
            links.forEach(card => {
                const originalLink = card.querySelector('a');
                const title = card.querySelector('h3').innerText;
                const iconClass = card.querySelector('i').className;
                
                const newLink = document.createElement('a');
                newLink.href = originalLink.getAttribute('href');
                newLink.innerHTML = `<i class="${iconClass}"></i> ${title}`;
                sidePanelLinks.appendChild(newLink);
            });
            clearInterval(checkNav);
        }
    }, 500);
}

// Start syncing when site loads
document.addEventListener('DOMContentLoaded', syncSideMenu);


function togglePartnersList() {
    const container = document.getElementById('partners-container');
    const btn = document.getElementById('view-all-partners');
    container.classList.toggle('show-all');
    btn.innerText = container.classList.contains('show-all') ? "Show Less" : "View All";
}

   // -----------------------------------------------nevgation panel icon---------------------------------
//------------------mainmanu-------------------------------------


// slider 1-----------------------------------------------------------

let heroIndex = 0;
const heroSlides = document.querySelectorAll('.hero-ms-slide');
const heroDots = document.querySelectorAll('.hero-ms-dot');

function showHeroSlide(index) {
    if (index >= heroSlides.length) heroIndex = 0;
    else if (index < 0) heroIndex = heroSlides.length - 1;
    else heroIndex = index;

    // Fade logic: Remove active class from all, add to current
    heroSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === heroIndex);
    });

    // Update Dots
    heroDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === heroIndex);
    });
}

function autoScrollHero() {
    heroIndex++;
    showHeroSlide(heroIndex);
}

let heroTimer = setInterval(autoScrollHero, 5000);

function currentHeroSlide(n) {
    clearInterval(heroTimer);
    showHeroSlide(n);
    heroTimer = setInterval(autoScrollHero, 5000);
}

// Swipe support for Fade
let heroTouchStart = 0;
const heroContainer = document.querySelector('.hero-ms-container');

heroContainer.addEventListener('touchstart', e => heroTouchStart = e.changedTouches[0].screenX);
heroContainer.addEventListener('touchend', e => {
    let heroTouchEnd = e.changedTouches[0].screenX;
    if (heroTouchStart - heroTouchEnd > 50) currentHeroSlide(heroIndex + 1);
    if (heroTouchEnd - heroTouchStart > 50) currentHeroSlide(heroIndex - 1);
});

function handleHeroClick(destination) {
    console.log("Navigating to:", destination);
    // Add your filterView or navigation logic here
    if(typeof filterView === "function") filterView(destination);
}





// slider 1-----------------------------------------------------------


// --- 4. CATEGORY FILTER & CARD RENDERING ---
function filterView(categoryTag, btn) {
    if (btn) {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const container = document.getElementById('product-grid');
    if (!container) return;
    container.innerHTML = ""; 

    let filtered = (categoryTag === 'all') ? allProducts : 
        allProducts.filter(p => p.tagweb.toLowerCase().includes(categoryTag.toLowerCase()));

    // GROUP BY ID: One card per unique ID
    const grouped = filtered.reduce((acc, p) => {
        if (!acc[p.id]) acc[p.id] = [];
        acc[p.id].push(p);
        return acc;
    }, {});

    Object.values(grouped).forEach(variants => {
    const initial = variants[0];
        const hasVariants = variants.length > 1;
        const isKit = variants.some(v => v.isKit);

        // Show the default attributes on the card immediately
        const defaultText = [initial.attr1, initial.attr2, initial.attr3].filter(v => v).join(' / ');
        const defaultSpecs = hasVariants ? 
            `<div class="variant-specs" id="specs-${initial.id}">
                Default: ${defaultText}
            </div>` : "";

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${initial.id}`; 

        let buttonsHtml = "";
        if (isKit) buttonsHtml += `<button class="btn-kit" onclick="openKitModal('${initial.id}')">Buy Kit</button>`;
        if (hasVariants) {
            buttonsHtml += `<button class="btn-cart" style="background:#2d3436" onclick="openVariantSheet('${initial.id}')">Choose Options</button>`;
        } else {
            buttonsHtml += `<button class="btn-cart" onclick="addToCart('${initial.id}')">Add to Cart</button>`;
        }

        card.innerHTML = `
            <img src="${initial.img1}" alt="${initial.name}" loading="lazy">
            <div class="card-content">
                <span class="category">${initial.category}</span> 
                <h3>${initial.name}</h3>
                ${defaultSpecs}
                <div class="price-row">
                    <span class="sell-price" id="price-${initial.id}">₹${initial.sale}</span>
                    <span class="mrp" id="mrp-${initial.id}">₹${initial.mrp}</span>
                </div>
                <div class="card-buttons">${buttonsHtml}</div>
            </div>
        `;
        container.appendChild(card);
});
}

// --- VARIANT POPUP LOGIC ---
function openVariantSheet(productId) {
    const variants = allProducts.filter(p => p.id === productId);
    selectedAttrs = {}; 
    const sheet = document.getElementById('variant-bottom-sheet');
    document.getElementById('sheet-product-name').innerText = variants[0].name;
    
    renderSheetControls(variants);
    sheet.classList.add('open');
    document.getElementById('variant-sheet-overlay').classList.add('open');
    updateSheetUI(variants);
}

function renderSheetControls(variants) {
    const content = document.getElementById('sheet-content');
    content.innerHTML = "";
    const keys = ['attr1', 'attr2', 'attr3'];
    const labels = ['Size', 'Width', 'Shape'];

    keys.forEach((key, i) => {
        const values = [...new Set(variants.map(v => v[key]))].filter(v => v !== "");
        if (values.length === 0) return;

        const group = document.createElement('div');
        group.className = 'attr-group';
        group.innerHTML = `<small>${labels[i]}:</small><div class="btn-group-variants" id="group-${key}"></div>`;
        content.appendChild(group);

        values.forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerText = val;
            btn.onclick = () => { selectedAttrs[key] = (selectedAttrs[key] === val) ? null : val; updateSheetUI(variants); };
            btn.dataset.key = key;
            btn.dataset.val = val;
            group.querySelector('.btn-group-variants').appendChild(btn);
        });
    });
}

// --- UPDATED VARIANT UI LOGIC ---
function updateSheetUI(variants) {
    const keys = ['attr1', 'attr2', 'attr3'];
    const productId = variants[0].id;
    
    // 1. Handle Button Highlighting & Availability
    document.querySelectorAll('.opt-btn').forEach(btn => {
        const key = btn.dataset.key;
        const val = btn.dataset.val;
        btn.classList.toggle('active', selectedAttrs[key] === val);
        
        const tempSelection = {...selectedAttrs};
        delete tempSelection[key];
        const possible = variants.some(v => v[key] === val && Object.entries(tempSelection).every(([k, vVal]) => !vVal || v[k] === vVal));
        btn.disabled = !possible;
    });

    // 2. Find Best Match
    const match = variants.find(v => keys.every(k => !selectedAttrs[k] || v[k] === selectedAttrs[k]));
    const addBtn = document.getElementById('sheet-add-btn');

    if (match) {
        // Update Popup Price
        document.getElementById('sheet-price').innerText = `₹${match.sale}`;
        
        // LIVE SYNC WITH THE CARD IN BACKGROUND
        const cardPrice = document.getElementById(`price-${productId}`);
        const cardMrp = document.getElementById(`mrp-${productId}`);
        const cardSpecs = document.getElementById(`specs-${productId}`);
        
        if (cardPrice) cardPrice.innerText = `₹${match.sale}`;
        if (cardMrp) cardMrp.innerText = `₹${match.mrp}`;
        if (cardSpecs) {
            const currentStr = [match.attr1, match.attr2, match.attr3].filter(v => v).join(' / ');
            cardSpecs.innerHTML = `Selected: <strong>${currentStr}</strong>`;
            cardSpecs.style.borderColor = "var(--accent)"; // Change color to show activity
            cardSpecs.style.color = "#2d3436";
        }
    }

    // 3. Handle Add to Cart Button State
    const allPicked = keys.every(k => !variants.some(v => v[k] !== "") || selectedAttrs[k]);
    if (allPicked && match) {
        addBtn.disabled = false;
        addBtn.innerText = "Confirm Selection";
        addBtn.onclick = () => { addToCart(match.id, match); closeVariantSheet(); };
    } else {
        addBtn.disabled = true;
        addBtn.innerText = "Select All Options";
    }
}

function closeVariantSheet() {
    document.getElementById('variant-bottom-sheet').classList.remove('open');
    document.getElementById('variant-sheet-overlay').classList.remove('open');
}

// Update addToCart to handle variants
function addToCart(id, specificProduct = null) {
    const product = specificProduct || allProducts.find(p => String(p.id) === String(id));
    // Unique ID based on attributes to separate variants in cart
    const uniqueId = `${product.id}_${product.attr1}_${product.attr2}_${product.attr3}`;
    
    const existing = cart.find(item => item.uniqueId === uniqueId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            uniqueId, id: product.id, name: product.name,
            variant: [product.attr1, product.attr2, product.attr3].filter(v => v).join(' / '),
            image: product.img1, sellPrice: Number(product.sale), quantity: 1 
        });
    }
    saveCart();
}


// --- 5. CART CORE LOGIC ---
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}

function saveCart() {
    localStorage.setItem('SHOP_CART', JSON.stringify(cart));
    renderCartUI();
    animateCartAction();
}

// --- UPDATED CART CORE LOGIC ---
// REMOVE the second addToCart(id) function from your file and use this single one:
function addToCart(id, specificProduct = null) {
    // If no specificProduct is passed, find the first one (for non-variant items)
    const product = specificProduct || allProducts.find(p => String(p.id) === String(id));
    if (!product) return;

    // Create a unique ID for the cart to distinguish variants
    const uniqueId = `${product.id}_${product.attr1}_${product.attr2}_${product.attr3}`;
    
    const existing = cart.find(item => item.uniqueId === uniqueId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            uniqueId: uniqueId,
            id: product.id, 
            name: product.name,
            variant: [product.attr1, product.attr2, product.attr3].filter(v => v).join(' / '),
            image: product.img1, 
            sellPrice: Number(product.sale) || 0, 
            quantity: 1 
        });
    }
    saveCart();
}





function addKitToCart(id) {
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product || !product.kitComponents) return;

    const componentIDs = product.kitComponents.split(',').map(cid => cid.trim());
    const components = allProducts.filter(p => componentIDs.includes(String(p.id)));
    
    // Use Number(item.sale) to match your mapping
    let kitTotal = components.reduce((sum, item) => sum + (Number(item.sale) || 0), 0);
    
    const kitBundleId = `kit_${id}`; 
    const existingKit = cart.find(item => item.id === kitBundleId);

    if (existingKit) {
        existingKit.quantity += 1;
    } else {
        cart.push({
            id: kitBundleId,
            name: `${product.kitName || product.name} Bundle`,
            image: product.img1, // Use img1
            sellPrice: kitTotal, 
            quantity: 1
        });
    }
    saveCart();
}




function updateQuantity(uniqueId, change) {
    const item = cart.find(p => p.uniqueId === uniqueId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.uniqueId !== uniqueId);
        }
        saveCart();
    }
}

function clearCart() {
    if(confirm("Clear your cart?")) {
        cart = [];
        saveCart();
    }
}

// --- 6. UI RENDERING ---
function renderCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-amount');
    const countBadge = document.getElementById('cart-count');

    if (!container || !totalDisplay || !countBadge) return;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    countBadge.innerText = totalQty;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Cart is empty</p>';
        totalDisplay.innerText = "0";
        return;
    }

    let grandTotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = (Number(item.sellPrice) || 0) * item.quantity;
        grandTotal += itemTotal;
        return `
            <div class="cart-row">
                <img src="${item.image}" alt="">
                <div class="cart-item-info">
                    <p style="margin:0; font-weight:600; font-size:14px;">${item.name}</p>
                    <small style="color:#777">${item.variant || ''}</small>
                    <div class="qty-controls" style="margin-top:5px;">
                        <button onclick="updateQuantity('${item.uniqueId}', -1)">-</button>
                        <span style="margin:0 10px;">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.uniqueId}', 1)">+</button>
                    </div>
                </div>
                <div style="font-weight:bold; color:#27ae60;">₹${itemTotal.toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
    totalDisplay.innerText = grandTotal.toLocaleString('en-IN');
}

// --- 7. KIT MODAL ---
function openKitModal(productId) {
    const product = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return;

    const modal = document.getElementById('kit-modal');
    const kitContent = document.getElementById('kit-items-list');
    const footerLogic = document.getElementById('modal-footer-logic');
    
    const componentIDs = product.kitComponents.split(',').map(id => id.trim());
    const components = allProducts.filter(p => componentIDs.includes(String(p.id)));

    let totalMRP = 0;
    let totalSell = 0;

    kitContent.innerHTML = components.map((item) => {
        totalMRP += Number(item.mrp) || 0;
        totalSell += Number(item.sale) || 0;
        return `
            <div class="kit-item">
                <img src="${item.image}" class="kit-item-img">
                <div class="kit-item-details">
                    <div class="kit-item-name">${item.name}</div>
                    <div class="kit-item-price">
                        <span class="sell">₹${item.sale}</span>
                        <span class="mrp">₹${item.mrp}</span>
                    </div>
                </div>
            </div>`;
    }).join('');

    footerLogic.innerHTML = `
        <div class="kit-total-display">
            <p>Total Bundle MRP: <span class="mrp-total">₹${totalMRP}</span></p>
            <p class="final-price">Kit Price: ₹${totalSell}</p>
        </div>
        <button class="btn-buy-bundle" onclick="addKitToCart('${product.id}'); closeModal();">
            ADD FULL BUNDLE TO CART
        </button>
    `;
    modal.style.display = 'flex';
}



function closeModal() { document.getElementById('kit-modal').style.display = 'none'; }

// --- 8. ANIMATION & CHECKOUT ---
function animateCartAction() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.classList.remove('cart-bounce');
    void badge.offsetWidth; 
    badge.classList.add('cart-bounce');
}

// Update WhatsApp message to include variant info
function checkoutWhatsApp() {
    if (cart.length === 0) return;

    let message = "*📦 NEW ORDER - UTTAM HUB*%0A--------------------------%0A";
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}* ${item.variant ? '('+item.variant+')' : ''}%0A`;
        message += `Qty: ${item.quantity} | Price: ₹${(item.sellPrice * item.quantity).toLocaleString('en-IN')}%0A%0A`;
    });

    const total = document.getElementById('cart-total-amount').innerText;
    message += `*TOTAL PAYABLE: ₹${total}*%0A--------------------------%0APlease confirm my order.`;

    window.open(`https://wa.me/919724362981?text=${message}`, '_blank');
}



// cart div genaret everywhere
// with using place this into html file <div id="cart-placeholder"></div> 
//where you want cart
async function injectGlobalCart() {
    const placeholder = document.getElementById('cart-placeholder');
    if (!placeholder) return;

    // 1. Get the current depth of the file
    // index.html = 0 or 1
    // /divisions/gift art.html = 2
    // /divisions/css/rate.html = 3
    const pathSegments = window.location.pathname.split('/').filter(p => p).length;
    
    let prefix = "";
    if (pathSegments > 1) {
        // Adds "../" for every level deeper than root
        prefix = "../".repeat(pathSegments - 1);
    }

    try {
        // Fetch the component from the root using the prefix
        const response = await fetch(prefix + 'cart-component.html');
        const html = await response.text();
        placeholder.innerHTML = html;
        
        // Sync the cart data immediately
        renderCartUI(); 
    } catch (err) {
        console.error("Cart injection failed. Check if cart-component.html is in root.", err);
    }
}




// Modify your existing DOMContentLoaded listener:
document.addEventListener('DOMContentLoaded', () => {
    // This loads the HTML AND then calls renderCartUI() automatically
    injectGlobalCart();

    // Load products only if a grid exists on the page
    if (document.getElementById('product-grid')) {
        loadProducts();
    }
});





/* =========================================
   CART & KIT LOGIC (CORE)
   ========================================= */

// Initialize Cart from LocalStorage or empty array
let cart = JSON.parse(localStorage.getItem('SHOP_CART')) || [];

/**
 * ADD TO CART 
 * Handles both regular items and items with variants
 */
function addToCart(id, specificProduct = null) {
    // If no specificProduct is passed, find it in the global array
    const product = specificProduct || allProducts.find(p => String(p.id) === String(id));
    if (!product) return;

    // Create a unique ID for the cart row to separate different variants of the same item
    const uniqueId = `${product.id}_${product.attr1 || ''}_${product.attr2 || ''}_${product.attr3 || ''}`;
    
    const existing = cart.find(item => item.uniqueId === uniqueId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        // Respect Minimum Order Quantity if it exists in the CSV
        const startQty = parseInt(product.minOrder) || 1;
        
        cart.push({ 
            uniqueId: uniqueId,
            id: product.id, 
            name: product.name,
            variant: [product.attr1, product.attr2, product.attr3].filter(v => v).join(' / '),
            image: product.img1, 
            sellPrice: Number(product.sale) || 0, 
            quantity: startQty 
        });
    }
    saveCart();
    
    // Optional: Open cart sidebar automatically when item is added
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar && !sidebar.classList.contains('open')) {
        toggleCart();
    }
}

/**
 * PERSISTENCE & UI UPDATE
 */
function saveCart() {
    localStorage.setItem('SHOP_CART', JSON.stringify(cart));
    renderCartUI();
    animateCartAction(); // Bounces the cart icon
}

function updateQuantity(uniqueId, change) {
    const item = cart.find(p => p.uniqueId === uniqueId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.uniqueId !== uniqueId);
        }
        saveCart();
    }
}

function clearCart() {
    if(confirm("Are you sure you want to clear your cart?")) {
        cart = [];
        saveCart();
    }
}

/* =========================================
   UI RENDERING (THE SIDEBAR)
   ========================================= */
function renderCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-amount');
    const countBadge = document.getElementById('cart-count');

    if (!container || !totalDisplay || !countBadge) return;

    // Update Badge Count
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    countBadge.innerText = totalQty;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <p style="color:#999; margin-bottom:10px;">Your cart is empty</p>
                <button onclick="toggleCart()" style="padding:8px 15px; border-radius:20px; border:1px solid #ddd; background:none;">Continue Shopping</button>
            </div>`;
        totalDisplay.innerText = "0";
        return;
    }

    let grandTotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = (Number(item.sellPrice) || 0) * item.quantity;
        grandTotal += itemTotal;
        return `
            <div class="cart-row" style="display:flex; align-items:center; gap:10px; padding:12px; border-bottom:1px solid #eee;">
                <img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div class="cart-item-info" style="flex:1;">
                    <p style="margin:0; font-weight:600; font-size:0.9rem;">${item.name}</p>
                    <small style="color:#777; display:block;">${item.variant || 'Standard'}</small>
                    <div class="qty-controls" style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                        <button onclick="updateQuantity('${item.uniqueId}', -1)" style="width:24px; height:24px; border:1px solid #ddd; background:#f9f9f9; cursor:pointer;">-</button>
                        <span style="font-weight:bold;">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.uniqueId}', 1)" style="width:24px; height:24px; border:1px solid #ddd; background:#f9f9f9; cursor:pointer;">+</button>
                    </div>
                </div>
                <div style="font-weight:bold; color:#B12704;">₹${itemTotal.toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
    
    totalDisplay.innerText = grandTotal.toLocaleString('en-IN');
}

/* =========================================
   CHECKOUT & NAVIGATION
   ========================================= */
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

function checkoutWhatsApp() {
    if (cart.length === 0) return;

    let message = "*📦 NEW ORDER FROM UTTAM HUB*%0A--------------------------%0A";
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*%0A`;
        if(item.variant) message += `_Options: ${item.variant}_%0A`;
        message += `Qty: ${item.quantity} | Price: ₹${(item.sellPrice * item.quantity).toLocaleString('en-IN')}%0A%0A`;
    });

    const total = document.getElementById('cart-total-amount').innerText;
    message += `*TOTAL PAYABLE: ₹${total}*%0A--------------------------%0APlease process my order.`;

    // Opens WhatsApp with your specific number
    window.open(`https://wa.me/919724362981?text=${message}`, '_blank');
}

function animateCartAction() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.classList.remove('cart-bounce');
    void badge.offsetWidth; // Trigger reflow
    badge.classList.add('cart-bounce');
}