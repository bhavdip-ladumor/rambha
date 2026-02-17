function initPromoSlider() {
    const track = document.getElementById('promo-track');
    const viewport = document.querySelector('.promo-viewport');
    
    // Safety check: Prevent building twice and stopping refresh loops
    if (!track || !viewport || track.dataset.loaded === "true") return;

    // Use the IDs from your Column 1
    const promoIDs = ["1", "2", "3", "4", "5", "6"]; 

    const buildSlider = () => {
    const products = promoIDs
        .map(id => window.getProductById(id))
        .filter(p => p !== undefined);

    if (products.length === 0) return;

    track.innerHTML = products.map(product => `
        <div class="promo-card">
            <a href="product.html?id=${product.id}" class="promo-image-wrapper">
                <img src="${product.img1 || 'assets/broken-image.png'}" 
                     alt="${product.name}" 
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=Broken+Link';">
            </a>
            <div class="promo-info">
                <h5 class="promo-title">${product.name}</h5>
            </div>
        </div>
    `).join('').repeat(3); 
    
    track.dataset.loaded = "true"; 
    setupInteractions(track, viewport);
};

   window.addEventListener('db_ready', () => {
        // Force reset the lock so buildSlider() doesn't exit early
        track.dataset.loaded = "false"; 
        buildSlider();
    }, { once: false });

    // Initial check: if data is already there on first load, trigger it
    if (window.allProducts && window.allProducts.length > 0) {
        window.dispatchEvent(new Event('db_ready'));
    }
}

function setupInteractions(el, view) {
    let isDown = false;
    let startX;
    let scrollLeft;

    const pause = () => el.style.animationPlayState = 'paused';
    const resume = () => setTimeout(() => el.style.animationPlayState = 'running', 2000);

    view.addEventListener('mousedown', (e) => {
        isDown = true;
        pause();
        startX = e.pageX - view.offsetLeft;
        scrollLeft = view.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
        isDown = false;
        resume();
    });

    view.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - view.offsetLeft;
        const walk = (x - startX) * 2;
        view.scrollLeft = scrollLeft - walk;
    });

    view.addEventListener('touchstart', pause, {passive: true});
    view.addEventListener('touchend', resume, {passive: true});
}

initPromoSlider();