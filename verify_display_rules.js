
// Verification Script for Product Display Rules
async function verifyDisplayRules() {
    const results = {
        harmonization: false,
        gridPurity: false,
        modalBehavior: false,
        details: []
    };

    function log(msg) {
        console.log(`[VERIFY] ${msg}`);
        results.details.push(msg);
    }

    try {
        // 1. Verify Data Harmonization in Memory
        // Wait for products to load
        if (!window.nastyProducts || window.nastyProducts.length === 0) {
            log("Waiting for products...");
            await new Promise(r => setTimeout(r, 1000));
        }

        const nc004 = window.nastyProducts.find(p => p.id === 'nc_004');
        const nc001 = window.nastyProducts.find(p => p.id === 'nc_001');

        if (nc004) {
            const mainImg = typeof nc004.images[0] === 'string' ? nc004.images[0] : nc004.images[0].src;
            const var0Img = nc004.variants[0].image;

            // Check if harmonization worked (in memory)
            // harmonizeProductVariants sets: product.variants[0].image = mainImageSrc
            if (var0Img === mainImg) {
                log("SUCCESS: nc_004 variant[0].image matches main image.");
                results.harmonization = true;
            } else {
                log(`FAILURE: nc_004 mismatch. Main: ${mainImg.substring(0, 30)}... Var0: ${var0Img.substring(0, 30)}...`);
            }
        } else {
            log("FAILURE: nc_004 not found in memory.");
        }

        // 2. Verify Grid Purity (Visual)
        // Check if grid images match the main product images
        const gridItems = document.querySelectorAll('.product-card');
        let gridErrors = 0;

        // Find nc_004 visually
        const card004 = Array.from(gridItems).find(el => el.innerText.includes(nc004.title) || el.innerHTML.includes(nc004.title));

        if (card004) {
            const imgEl = card004.querySelector('img');
            const mainImg = typeof nc004.images[0] === 'string' ? nc004.images[0] : nc004.images[0].src;

            // Normalize urls for comparison (remove query params)
            const cleanSrc = imgEl.src.split('?')[0];
            const cleanMain = mainImg.split('?')[0];

            if (cleanSrc.includes(cleanMain.split('/').pop())) { // Compare filenames
                log("SUCCESS: Grid card for nc_004 shows main image.");
                results.gridPurity = true;
            } else {
                log(`FAILURE: Grid card image mismatch.\nExpected: ${cleanMain}\nFound: ${cleanSrc}`);
                gridErrors++;
            }
        } else {
            log("WARNING: nc_004 card not found in grid (might be lazy loaded or further down).");
        }

        // 3. Verify Modal Behavior
        if (card004) {
            log("Clicking nc_004 card...");
            card004.click();
            await new Promise(r => setTimeout(r, 1000)); // Wait for modal animation

            const modalImg = document.getElementById('modal-img');

            const mainImg = typeof nc004.images[0] === 'string' ? nc004.images[0] : nc004.images[0].src;
            const cleanSrc = modalImg.src.split('?')[0];
            const cleanMain = mainImg.split('?')[0];

            if (cleanSrc.includes(cleanMain.split('/').pop())) {
                log("SUCCESS: Modal opened with main image.");
                results.modalBehavior = true;
            } else {
                log(`FAILURE: Modal opened with wrong image: ${modalImg.src}`);
            }

            // Close modal
            const closeBtn = document.querySelector('.close');
            if (closeBtn) closeBtn.click();
        }

    } catch (e) {
        log(`ERROR: Script crashed - ${e.message} \n ${e.stack}`);
    }

    return results;
}

verifyDisplayRules().then(r => {
    console.log("JSON_RESULT:" + JSON.stringify(r));
    window.verificationResults = r;
});
