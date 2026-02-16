 function loadSection(file, elementId) {
            fetch(file)
                .then(response => response.text())
                .then(data => { document.getElementById(elementId).innerHTML = data; })
                .catch(err => console.log("Missing file: " + file));
        }

        // LOAD EVERYTHING IN ORDER
        

        // 1. Core Layout
        loadSection('components/header.html', 'header-placeholder');
        loadSection('components/navigation.html', 'nav-placeholder');
        loadSection('components/hero-section.html', 'hero-placeholder');
        loadSection('components/hiring-bar.html', 'hiring-placeholder');

        // 2. The 4 Main Business Areas

        loadSection('divisions/art-skill.html', 'art-placeholder');
        loadSection('divisions/divisions-section.html', 'divisions-placeholder');
        loadSection('divisions/machine-works.html', 'machine-placeholder');
        loadSection('divisions/home-essentials.html', 'home-essentials-placeholder');
        loadSection('divisions/retail-section.html', 'retail-placeholder');
        
        // 3. Footer 
        loadSection('components/about-us.html', 'about-placeholder');
        loadSection('components/contact-footer.html', 'footer-placeholder');

        // Add this line to your existing script in the.js
        

        // float whatsappp
        loadSection('components/float-whatsapp.html', 'whatsapp-placeholder');

        // for cart
       
        // Put this at the very bottom of index.html


        window.addEventListener('load', () => {
    setup();
});




   // -----------------------------------------------nevgation panel icon---------------------------------
// Function to toggle Menu
