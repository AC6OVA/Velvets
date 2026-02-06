// app.js - Final UI Logic

// Global State
let railProducts = [];
let cart = [];
let currentSpotlightProduct = null;
let currentSpotlightVariantIndex = 0;
let spotlightCycleTimeout;
// Dopamine State
const dopamineNodes = []; // Fixed pool of DOM elements

// --- 0. DATA HARMONIZATION REMOVED PER USER REQUEST ---
// Logic replaced by STRICT VARIANT ENFORCEMENT below.


// --- 0. STRICT VARIANT ENFORCEMENT (NEW RULE) ---
// The Variant corresponding to the Main Product Image MUST be Index 0.
// --- 0. STRICT VARIANT ENFORCEMENT (NEW RULE) ---
// The Variant corresponding to the Main Product Image MUST be Index 0.
function enforceMainVariantFirst() {
    console.log("[Enforcement] Starting Strict Variant Enforcement...");

    // Ensure we are operating on the source of truth
    const products = window.nastyProducts || window.products || (typeof nastyCollectionProducts !== 'undefined' ? nastyCollectionProducts : []);

    if (!products || products.length === 0) {
        console.log("[Enforcement] No products found yet.");
        return;
    }

    products.forEach(product => {
        if (!product.images || product.images.length === 0) return;
        if (!product.variants || product.variants.length === 0) return;

        let correctIndex = -1;

        // --- SPECIAL CASES FIRST ---

        // CASE 1: nc_004 (Sweetheart Beach Set)
        // Main Image: Blue. Default Data: Camel.
        // Target: "Blue" variant.
        if (product.id === 'nc_004') {
            correctIndex = product.variants.findIndex(v => v.option1 && v.option1.toLowerCase() === 'blue');
        }

        // CASE 2: nc_001 (Denim Shorts)
        // Main Image: Blue Denim. Default Data: Camel.
        // Target: "SKY BLUE" variant.
        else if (product.id === 'nc_001') {
            // Log for debugging
            console.log("[Enforcement] Checking nc_001...");
            correctIndex = product.variants.findIndex(v => v.option1 && (v.option1 === 'SKY BLUE' || v.option1.includes('BLUE')));
            console.log(`[Enforcement] nc_001 found 'BLUE' at index: ${correctIndex}`);
        }

        // CASE 3: General Rule (Image Match)
        else {
            const mainImageSrc = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src;
            const v0 = product.variants[0];
            const v0Image = v0.image || (v0.featured_image ? v0.featured_image.src : null);

            // Only search if V0 is WRONG
            if (v0Image !== mainImageSrc) {
                correctIndex = product.variants.findIndex(v => {
                    const vSrc = v.image || (v.featured_image ? v.featured_image.src : '');
                    return vSrc === mainImageSrc;
                });
            }
        }

        // --- PERFORM SWAP ---
        if (correctIndex > 0) {
            console.log(`[Enforcement] SWAPPING Variant 0 with Variant ${correctIndex} for Product ${product.id}`);

            const v0 = product.variants[0];
            const vTarget = product.variants[correctIndex];

            // 1. Swap in array
            product.variants[0] = vTarget;
            product.variants[correctIndex] = v0;

            // 2. FORCE Image Consistency (The Main Product Image MUST be the image of Variant 0)
            const mainImageSrc = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src;
            product.variants[0].image = mainImageSrc;
            if (product.variants[0].featured_image) {
                product.variants[0].featured_image.src = mainImageSrc;
            }
        }
    });
    console.log("[Enforcement] Completed.");
}

function initSystem() {
    console.log("Init: Starting System...");

    // Fallback: Handle variable mismatch
    if (!window.products && window.nastyProducts) {
        window.products = window.nastyProducts;
    }

    // STRICT DATA ENFORCEMENT BEFORE RENDER
    enforceMainVariantFirst();



    // Fallback: Handle variable mismatch (nastyProducts vs products)
    if (!window.products && window.nastyProducts) {
        window.products = window.nastyProducts;
    }

    // Retry logic for data loading
    if (!window.products || window.products.length === 0) {
        console.warn("Init: Products not ready, retrying in 500ms...");
        setTimeout(initSystem, 500);
        return;
    }

    ensureProductData();
    renderWheels();





    // Fix: Initialize Spotlight IMMEDIATELY (No Jump)
    if (window.railProducts && window.railProducts.length > 0) {
        updateSpotlightImageSrc();
        const imgEl = document.getElementById('spotlight-image');
        if (imgEl) imgEl.style.opacity = 1;
    }

    // Start Spotlight Loop (delayed to allow initial view)
    startSpotlightLoop();

    // Init UI Systems

    initModal();
    // initDopamine(); // New Atmospheric Logic (Disabled for Refinement)
    initParallax();
    initAtmosphere();
    initAtmosphere();
    initTilt();
    initGridReveal(); // New Scroll Reveal Logic
    initQuantityControl();

    // REBRAND: V-Mark Click Listener
    const vAnchor = document.getElementById('brand-anchor-v');
    if (vAnchor) {
        vAnchor.addEventListener('click', () => {
            // Scroll to grid
            const grid = document.getElementById('product-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // REBRAND: Try On Button Removed

    renderGrid(); // Render 2x2 Grid

    document.body.classList.remove('loading');

    // Spotlight Click Listener
    const spotImg = document.getElementById('spotlight-image');
    if (spotImg) {
        spotImg.addEventListener('click', () => {
            if (currentSpotlightProduct) {
                // STRICT RULE: Listings/Spotlights always open the Main Product (Variant 0)
                // and show the Main Product Image.
                const mainSrc = getProductImage(currentSpotlightProduct);
                openModal(currentSpotlightProduct, 0, mainSrc);
            }
        });
    }
}

// Tabs removed

function ensureProductData() {
    if (window.products) {
        window.railProducts = window.products;
    } else {
        console.error("No product data found!");
        window.railProducts = [];
    }
}

function switchCollection(collectionName) {
    if (!window.products) return;

    let filtered = [];
    const pStr = (p) => (p.title + " " + p.handle + " " + (p.body_html || "")).toLowerCase();

    if (collectionName === 'club') {
        filtered = window.products.filter(p => {
            const t = pStr(p);
            const isSleep = t.includes('sleep') || t.includes('nightgown') || t.includes('pajama');
            const isClub = t.includes('dress') || t.includes('jumpsuit') || t.includes('bodysuit') || t.includes('party') || t.includes('club') || t.includes('satin') || t.includes('velvet');
            return isClub && !isSleep;
        });
    } else if (collectionName === 'indulgence') {
        filtered = window.products.filter(p => {
            const t = pStr(p);
            return t.includes('sleep') || t.includes('night') || t.includes('lingerie') || t.includes('robe') || t.includes('underwear') || t.includes('lace') || t.includes('stocking');
        });
    } else {
        filtered = window.products;
    }

    if (filtered.length < 5) {
        const defaults = window.products.slice(0, 10);
        filtered = [...filtered, ...defaults];
        filtered = Array.from(new Map(filtered.map(item => [item.id, item])).values());
    }

    window.railProducts = filtered;
    renderWheels();
    if (spotlightCycleTimeout) clearTimeout(spotlightCycleTimeout);
    updateSpotlightImageSrc();
    const imgEl = document.getElementById('spotlight-image');
    if (imgEl) imgEl.style.opacity = 1;

    runSpotlightCycle();
}

// Helper: Get Product Image (Strictly Main Product Image)
function getProductImage(product) {
    // RULE: ALWAYS return the Main Product Image (product.images[0])
    // Variants must NEVER appear in the grid/listings.
    if (product.images && product.images.length > 0) {
        const img = product.images[0];
        return typeof img === 'string' ? img : (img.src || '');
    }
    return '';
}

// --- SPOTLIGHT LOGIC ---
function startSpotlightLoop() {
    runSpotlightCycle();
}

function runSpotlightCycle() {
    spotlightCycleTimeout = setTimeout(() => {
        const imgEl = document.getElementById('spotlight-image');
        if (imgEl) {
            triggerSpotlightGlitchSwap();
            runSpotlightCycle();
        }
    }, 4000); // 4s visible -> instant swap
}

function triggerSpotlightGlitchSwap(specificProduct = null) {
    const imgEl = document.getElementById('spotlight-image');
    if (!imgEl) return;

    if (specificProduct) {
        currentSpotlightProduct = specificProduct;
        currentSpotlightVariantIndex = 0;
        imgEl.src = getProductImage(specificProduct);
        applyDynamicTint(specificProduct);
    } else {
        updateSpotlightImageSrc();
    }

    // 1. Spotlight Glitch
    imgEl.classList.remove('glitch-active');
    void imgEl.offsetWidth;
    imgEl.classList.add('glitch-active');

    // 2. Dopamine Sync (Glitch + Swap Text)
    updateDopamineWordsOnGlitch();

    // cleanup
    setTimeout(() => {
        imgEl.classList.remove('glitch-active');
        // Clean dopamine glitch class
        dopamineNodes.forEach(node => node.classList.remove('glitch-sync'));
    }, 400);
}

// --- DYNAMIC COLOR EXTRACTION (MOCKED) ---
// In a real app, this would use ColorThief.js or similar on the image.
// Here we map dominant colors to collection keywords or fallback.
const PRODUCT_COLORS = [
    "#FFD700", // Gold
    "#FF69B4", // Hot Pink
    "#00FFFF", // Cyan
    "#FF4500", // Orange Red
    "#ADFF2F", // Green Yellow
    "#FFFFFF", // White
    "#C0C0C0", // Silver
    "#9370DB"  // Purple
];

function getProductColor(product) {
    if (product.color) return product.color;
    // Hash the ID to pick a stable color if not explicit
    const hash = product.id.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    return PRODUCT_COLORS[hash % PRODUCT_COLORS.length];
}

function updateSpotlightImageSrc() {
    if (!window.railProducts.length) return;
    const r = Math.floor(Math.random() * window.railProducts.length);
    const p = window.railProducts[r];
    if (!p) return;
    currentSpotlightProduct = p;
    currentSpotlightVariantIndex = 0;
    const imgEl = document.getElementById('spotlight-image');
    if (imgEl) {
        imgEl.src = getProductImage(p);
    }
    // Apply Dynamic Tint
    applyDynamicTint(p);
}

function applyDynamicTint(product) {
    const color = getProductColor(product);
    // Update CSS Variable for Dopamine Words
    document.documentElement.style.setProperty('--dopamine-tint', color);

    // Update Spotlight Glow Color
    const glow = document.getElementById('spotlight-glow');
    if (glow) {
        glow.style.background = `radial-gradient(circle, ${color}33 0%, rgba(0, 0, 0, 0) 70%)`; // 33 = 20% opacity hex
    }
}

// --- DOPAMINE LOGIC (ATMOSPHERIC) ---
const DOPAMINE_POOL = ["SILENCE", "ETHER", "VELVET", "BREATH", "SKIN", "ECHO", "VOID", "PULSE", "DRIFT", "SOFT", "DEEP"];

// Intelligent Anchors centered around the Spotlight (Right-heavy)
// Spotlight Center approx: X = WindowWidth - 215, Y = 390
// 2. Position Logic (Full Viewport Distribution)
// Coordinates relative to Window Center (0,0 is center screen)
// REFINED: Avoid Bottom Center (V-Mark Zone)
const ANCHOR_OFFSETS = [
    { x: -0.42, y: -0.35, r: -5, z: 2 },     // Top Left (Deep Background)
    { x: -0.38, y: 0.25, r: 5, z: 2 },      // Bottom Left (Safe from V)
    { x: 0.42, y: -0.30, r: 8, z: 2 },      // Top Right (Deep Background)
    { x: 0.38, y: 0.25, r: -4, z: 2 },       // Bottom Right (Safe from V)
    { x: -0.15, y: -0.40, r: 0, z: 2 },     // Top Center (High)
];

const MOBILE_ANCHOR_OFFSETS = [
    { x: -0.3, y: -0.35, r: -5, z: 2 },
    { x: 0.3, y: -0.35, r: 5, z: 2 },
    { x: -0.3, y: 0.20, r: 3, z: 2 }, // Avoid bottom center
    { x: 0.3, y: 0.20, r: -3, z: 2 },
];

// Special Anchor for "TRY ON" (Index 0) - REBRAND
// Must be BELOW the spotlight beam.
// Spotlight is approx at X = Width - 215, Y = 390.
// We want this well below Y=390.
// Let's use a fixed offset relative to spotlight center.
const TRY_ON_OFFSET = { x: -80, y: 350, r: 0, z: 50 }; // y: 350 pushes it down significantly

function initDopamine() {
    document.querySelectorAll('.dopamine-word').forEach(e => e.remove());
    dopamineNodes.length = 0;
    console.log("Dopamine: Init started (Atmospheric Mode).");

    // Create 6 nodes: Index 0 is "Try On" (Functional Prompt), 1-5 = Atmosphere
    for (let i = 0; i < 6; i++) {
        createDopamineNode(i);
    }
}

function createDopamineNode(index) {
    const el = document.createElement('div');
    const isAnchor = (index === 0);

    // Index 0 is special "Try On" prompt
    el.className = isAnchor ? 'dopamine-word interactive try-on-prompt' : 'dopamine-word';

    // Interactive logic for Try On prompt
    if (isAnchor) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            // Trigger Spotlight Click
            const spotImg = document.getElementById('spotlight-image');
            if (spotImg) spotImg.click();
        });
    }

    document.body.appendChild(el);
    dopamineNodes.push(el);

    // Initial Position (Pass index!)
    setDopamineContentPosition(el, true, isAnchor, index);
}

function setDopamineContentPosition(el, isInitial = false, isAnchor = false, index = 0) {
    // 1. Content
    if (isAnchor) {
        el.innerText = "Try On";
        // Specific style for the prompt (Gold, smaller) managed via CSS or here
        el.style.fontSize = "3rem";
        el.style.opacity = "0.8";
        el.style.zIndex = "100"; // Foreground
        el.style.color = "var(--gold-primary)";
        el.style.mixBlendMode = "normal";
        el.style.filter = "none";
    } else {
        el.innerText = DOPAMINE_POOL[Math.floor(Math.random() * DOPAMINE_POOL.length)];
        // Reset styles for decorative words
        el.style.fontSize = "";
        el.style.opacity = "";
        el.style.zIndex = "";
        el.style.color = "";
        el.style.mixBlendMode = "";
        el.style.filter = "";
    }

    // 2. Position Logic
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const isMobile = viewportW < 768;

    // Spotlight Center Reference
    const spotCX = isMobile ? viewportW / 2 : viewportW - 215;
    const spotCY = isMobile ? viewportH / 2 - 50 : 390;

    let targetX, targetY, targetR, targetZ;

    if (isAnchor) {
        // "Try On" Prompt Logic
        const tOff = isMobile ? { x: 0, y: 250, r: 0, z: 100 } : TRY_ON_OFFSET;
        targetX = spotCX + tOff.x;
        targetY = spotCY + tOff.y;
        targetR = tOff.r;
        targetZ = tOff.z;
    } else {
        const offsets = isMobile ? MOBILE_ANCHOR_OFFSETS : ANCHOR_OFFSETS;
        const offset = offsets[(index - 1) % offsets.length];

        targetX = (viewportW * 0.5) + (offset.x * viewportW);
        targetY = (viewportH * 0.5) + (offset.y * viewportH);

        targetR = offset.r;
        targetZ = offset.z;
    }

    // ... rest of applying styles


    // Apply
    el.style.left = `${targetX}px`;
    el.style.top = `${targetY}px`;
    el.style.transform = `rotate(${targetR}deg)`;
    el.style.zIndex = targetZ;

    // Store Rotation for Magnetic Recovery
    el.dataset.baseRotation = targetR;

    // Subtle drift jitter for "alive" feel without moving spots
    if (!isAnchor) {
        // Randomize slightly for variety on swap
        const limit = isMobile ? 10 : 30;
        const jitX = (Math.random() - 0.5) * limit;
        const jitY = (Math.random() - 0.5) * limit;
        el.style.left = `${targetX + jitX}px`;
        el.style.top = `${targetY + jitY}px`;
    }
}

function updateDopamineWordsOnGlitch() {
    dopamineNodes.forEach((node, index) => {
        // Trigger Glitch CSS
        node.classList.remove('glitch-sync');
        void node.offsetWidth;
        node.classList.add('glitch-sync');

        // Swap Text & Jitter Position (Always keeps same anchor slot)
        setDopamineContentPosition(node, false, (index === 0), index);

        // Decoding Animation
        scrambleText(node, node.innerText);
    });
}

// --- DECODING TEXT ANIMATION ---
function scrambleText(element, finalText) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let iterations = 0;
    const maxIterations = 10; // How many scrambles before settling

    // If it's the "Try On" button, don't scramble too hard or it might be confusing,
    // but a subtle effect is cool.

    const interval = setInterval(() => {
        element.innerText = finalText
            .split('')
            .map((char, index) => {
                if (index < iterations) {
                    return finalText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');

        if (iterations >= finalText.length) {
            clearInterval(interval);
            element.innerText = finalText; // Ensure cleanness
        }

        iterations += 1 / 2; // Speed control
    }, 30);
}


// --- PARALLAX EFFECT ---
function initParallax() {
    const bgFar = document.getElementById('bg-far');
    const bgMid = document.getElementById('bg-mid');
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const lerp = 0.05;
    let breathTime = 0;

    // Mouse Move Parallax
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX / window.innerWidth - 0.5;
        targetY = e.clientY / window.innerHeight - 0.5;

        // Spotlight Internal Pan (Fake Depth)
        const spotImg = document.getElementById('spotlight-image');
        if (spotImg) {
            const panX = targetX * -20; // Reverse pan for depth
            const panY = targetY * -20;
            spotImg.style.transform = `translate(${panX}px, ${panY}px)`;
        }

        // Magnetic Logic for "Try On" (Node 0)
        // Find Node 0 in dopamineNodes
        if (dopamineNodes.length > 0) {
            const tryOnNode = dopamineNodes[0];
            const rect = tryOnNode.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distX = e.clientX - centerX;
            const distY = e.clientY - centerY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            const MAGNET_RADIUS = 150;

            if (distance < MAGNET_RADIUS) {
                const pullX = (distX * 0.2); // 20% pull
                const pullY = (distY * 0.2);
                tryOnNode.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.1)`;
                tryOnNode.classList.add('magnetic-active');
            } else {
                // Reset to anchor if far (but preserve rotation from CSS/JS init?)
                // Actually, our init logic sets 'left/top' and 'transform: rotate'.
                // We should respect the base rotation. 
                // A better approach: applying translate via a wrapper or additive transform.
                // For simplicity: We will just clear the translate override and let CSS transition back.
                // But wait, the original style.transform has a rotation!
                // We need to re-apply the rotation.
                const originalRot = tryOnNode.dataset.baseRotation || -10; // fallback
                tryOnNode.style.transform = `rotate(${originalRot}deg)`;
                tryOnNode.classList.remove('magnetic-active');
            }
        }
    });

    // Scroll Logic: Header & Parallax
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Header Two-Tone Toggle
        const header = document.getElementById('main-header');
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Shift Dopamine Words vertically
        dopamineNodes.forEach((node, i) => {
            const speed = (i + 1) * 0.15; // Varying speeds
            const yOffset = scrollY * speed;
            node.style.marginTop = `${yOffset}px`; // Use margin to avoid conflict with top/left/transform
        });

        lastScrollY = scrollY;
    });

    function animateParallax() {
        currentX += (targetX - currentX) * lerp;
        currentY += (targetY - currentY) * lerp;
        breathTime += 0.002;

        const driftX = Math.sin(breathTime) * 15;
        const driftY = Math.cos(breathTime * 0.8) * 10;

        if (bgFar) {
            const x = (currentX * -25) + (driftX * 0.3);
            const y = (currentY * -15) + (driftY * 0.3);
            bgFar.style.transform = `scale(1.1) translate3d(${x}px, ${y}px, 0)`;
        }
        if (bgMid) {
            const x = (currentX * -50) + driftX;
            const y = (currentY * -30) + driftY;
            bgMid.style.transform = `scale(1.05) translate3d(${x}px, ${y}px, 0)`;
        }

        // Feature 4: Sync Spotlight Breathing
        const spotImg = document.getElementById('spotlight-image');
        if (spotImg && !spotImg.classList.contains('glitch-active')) {
            // Slight breath sync
            const breathScale = 1 + Math.sin(breathTime) * 0.015;
            // Preserving the pan transform from mouse move requires more state management.
            // Simplified: apply breath to wrapper or separate property?
            // Since mousemove sets 'transform' directly on spotImg, we have a conflict.
            // Better: Apply breath to #spotlightContainer and pan to #spotlight-image (or vice versa).
            // Actually, spotImg is inside dotContainer. Let's apply breath to Container.
            // But Container has 'pointer-events: none'.
            // Let's modify #spotlightContainer transform.
            const container = document.getElementById('spotlightContainer');
            if (container) {
                container.style.transform = `scale(${breathScale})`;
            }
        }

        requestAnimationFrame(animateParallax);
    }
    animateParallax();
}

// --- ATMOSPHERE ---
function initAtmosphere() {
    const container = document.getElementById('bg-foreground');
    if (!container) return;
    const MAX_PARTICLES = 15;

    setInterval(() => {
        if (document.hidden) return;
        if (container.children.length >= MAX_PARTICLES) return;
        createParticle(container);
    }, 600);
}

function createParticle(container) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 2 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 20;

    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${left}%`;
    p.style.opacity = (Math.random() * 0.3 + 0.1).toFixed(2);
    p.style.filter = `blur(${Math.random() * 2}px)`;
    p.style.animationDuration = `${duration}s`;

    container.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
}

// --- TILT ---
function initTilt() {
    const wrapper = document.getElementById('scene-wrapper') || document.body;
    let tX = 0, tY = 0, cX = 0, cY = 0;

    document.addEventListener('mousemove', (e) => {
        const nY = (e.clientY / window.innerHeight) * 2 - 1;
        const nX = (e.clientX / window.innerWidth) * 2 - 1;
        tX = nY * -2;
        tY = nX * 2;
    });

    function loopTilt() {
        cX += (tX - cX) * 0.1;
        cY += (tY - cY) * 0.1;
        if (wrapper.id === 'scene-wrapper') {
            wrapper.style.transform = `rotateX(${cX}deg) rotateY(${cY}deg)`;
        }
        requestAnimationFrame(loopTilt);
    }
    loopTilt();
}

// --- MODAL ---
function initModal() {
    const closeBtn = document.getElementById('closeModal');
    const backdrop = document.querySelector('.modal-backdrop');
    const addBtn = document.getElementById('addToBagBtn');

    closeBtn.onclick = closeModal;
    backdrop.onclick = closeModal;

    document.querySelectorAll('.v-btn').forEach(btn => {
        btn.onclick = (e) => {
            const group = e.target.parentElement;
            group.querySelectorAll('.v-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
        };
    });

    addBtn.onclick = addToBag;

    // CART BINDINGS
    const cartIcon = document.getElementById('cartIcon');
    const closeCartBtn = document.getElementById('closeCart');
    const overlay = document.getElementById('cart-overlay');
    const continueBtn = document.getElementById('continueShoppingBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartIcon) cartIcon.onclick = openCart;
    if (closeCartBtn) closeCartBtn.onclick = closeCart;
    if (overlay) overlay.onclick = closeCart;
    if (continueBtn) continueBtn.onclick = closeCart;

    // CHECKOUT BINDINGS
    if (checkoutBtn) checkoutBtn.onclick = openCheckout;

    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const payBtn = document.getElementById('completeOrderBtn');
    const successClose = document.getElementById('successCloseBtn');

    if (closeCheckoutBtn) closeCheckoutBtn.onclick = closeCheckout;
    if (payBtn) payBtn.onclick = processMockPayment; // Must prevent default in HTML or Logic
    if (successClose) successClose.onclick = closeCheckout;

    // BACKDROP CLICK TO CLOSE
    const checkoutOverlay = document.getElementById('checkout-overlay');
    if (checkoutOverlay) {
        checkoutOverlay.onclick = (e) => {
            if (e.target === checkoutOverlay) {
                closeCheckout();
            }
        };
    }

    // Init Checkout Inputs Logic (One-time bind)
    // initCheckoutInteractions(); // Replaced by Vue Card Logic

    // Close Cart on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeCheckout();
        }
    });
}

// --- CART LOGIC ---
function openCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
    renderCart();
}

function closeCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

function addToCart(product, variant, size, qty = 1) {
    const cartItem = {
        id: Date.now(), // Transient ID
        product: product,
        variant: variant,
        size: size,
        quantity: qty
    };
    cart.push(cartItem);
    updateCartDisplay();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    updateCartDisplay();
}

function updateCartDisplay() {
    // Header Count
    const countDisplay = document.getElementById('cart-count');
    const headerCount = document.getElementById('cart-count-header');

    const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

    if (countDisplay) countDisplay.innerText = count;
    if (headerCount) headerCount.innerText = count;

    // Subtotal
    const total = cart.reduce((acc, item) => {
        const price = item.variant && item.variant.price ? parseFloat(item.variant.price) : 0;
        return acc + (price * (item.quantity || 1));
    }, 0);
    const totalDisplay = document.getElementById('cart-total');
    if (totalDisplay) totalDisplay.innerText = `$${total.toFixed(2)}`;
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-message">Your bag is empty.</div>';
        return;
    }

    cart.slice().reverse().forEach(item => {
        const el = document.createElement('div');
        el.className = 'cart-item';

        const img = item.variant && item.variant.image ? item.variant.image : getProductImage(item.product);
        const title = cleanProductTitle(item.product.title);
        const color = item.variant ? item.variant.option1 : 'Default';
        const price = item.variant ? `$${item.variant.price}` : '$0.00';

        el.innerHTML = `
            <img src="${img}" alt="${title}">
            <div class="cart-item-details">
                <div>
                    <h4 class="cart-item-title">${title}</h4>
                    <p class="cart-item-variant">${color} / ${item.size} <span style="color:#FFD700; margin-left:5px;">x${item.quantity || 1}</span></p>
                    <p class="cart-item-price">${price}</p>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        container.appendChild(el);
    });
}

// --- CHECKOUT LOGIC ---
// --- SHOPIFY CHECKOUT LOGIC ---
// Redirects to Shopify Cart Permalink
function openCheckout() {
    console.log("[Checkout] Initiating Shopify Checkout Redirect...");

    if (cart.length === 0) {
        alert("Your bag is empty.");
        return;
    }

    // 1. Construct Permalinks
    // Format: https://{shop}.myshopify.com/cart/{variant_id}:{qty},{variant_id}:{qty}
    const shopUrl = "https://ova-26.myshopify.com";

    const lineItems = cart.map(item => {
        const variantId = item.variant ? item.variant.id : null;
        const qty = item.quantity || 1;

        if (!variantId) {
            console.error("[Checkout] Missing Variant ID for item:", item);
            return null;
        }
        return `${variantId}:${qty}`;
    }).filter(i => i !== null); // Remove invalids

    if (lineItems.length === 0) {
        alert("Unable to process checkout: No valid items found.");
        return;
    }

    const checkoutUrl = `${shopUrl}/cart/${lineItems.join(',')}`;

    // 2. Redirect
    console.log(`[Checkout] Redirecting to: ${checkoutUrl}`);
    window.location.href = checkoutUrl;
}

// REMOVED: Mock Checkout Overlay Logic
// REMOVED: closeCheckout()
// REMOVED: processMockPayment()


// --- CHECKOUT INTERACTIVITY ---
function initCheckoutInteractions() {
    // Inputs (Keep formatting logic for UX)
    const numInput = document.getElementById('chk-card-number');
    const expInput = document.getElementById('chk-expiry');

    if (numInput) {
        numInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').substring(0, 16);
            val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = val;
        });
    }

    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (val.length >= 2) {
                val = val.substring(0, 2) + '/' + val.substring(2);
            }
            e.target.value = val;
        });
    }
}


let currentModalProduct = null;
let selectedVariantId = null;


// Standard Brand Colors for Swatches
const COLOR_MAP = {
    'Black': '#000000',
    'White': '#ffffff',
    'Red': '#ff0000',
    'Blue': '#4A6984',
    'Gold': '#FFD700',
    'Silver': '#C0C0C0',
    'Grey': '#808080',
    'Purple': '#800080',
    'Pink': '#FFC0CB',
    'Beige': '#F5F5DC',
    'Nude': '#E3BC9A',
    'Brown': '#8B4513',
    'Green': '#008000'
};

function getSwatchColor(colorName) {
    if (!colorName) return '#4A6984';
    const clean = colorName.trim();
    // Check direct map or contains
    for (let key in COLOR_MAP) {
        if (clean.toLowerCase().includes(key.toLowerCase())) return COLOR_MAP[key];
    }
    // Fallback to dynamic extraction if needed, but for now:
    return '#4A6984';
}

// --- HELPER FUNCTIONS ---

/**
 * Clean up size labels.
 * Strips "OLD", "KG", "US", parentheses info, etc.
 */
function cleanSize(size) {
    if (!size) return "";
    let s = size.toUpperCase();

    // Remove specific unwanted keywords
    s = s.replace(/\(OLD\)/g, '')
        .replace(/OLD/g, '')
        .replace(/KG/g, '')
        .replace(/US/g, '')
        .replace(/UK/g, '')
        .replace(/EU/g, '');

    // Remove content in parentheses if it looks technical " (2.5g)"
    s = s.replace(/\s*\(.*?\)/g, '');

    // Trim
    s = s.trim();

    return s;
}

/**
 * Get valid, cleaned sizes for a product.
 * Handles "One Size" logic (hides it if other sizes exist).
 */
function getValidSizes(product) {
    const rawSizes = new Set();

    // Collect all option2 (size) values
    if (product.variants) {
        product.variants.forEach(v => {
            if (v.option2) rawSizes.add(v.option2);
        });
    }

    // Clean and filter
    let cleanedSizes = Array.from(rawSizes)
        .map(s => cleanSize(s))
        .filter(s => s && s.length > 0); // Remove empty strings

    // Deduplicate after cleaning
    cleanedSizes = [...new Set(cleanedSizes)];

    // Special Logic: "One Size" vs Multiple Sizes
    const hasOneSize = cleanedSizes.some(s => s === "ONE SIZE" || s === "ONESIZE");
    const otherSizes = cleanedSizes.filter(s => s !== "ONE SIZE" && s !== "ONESIZE");

    if (hasOneSize && otherSizes.length > 0) {
        // If we have actual sizes, hide "One Size"
        return otherSizes;
    }

    // NEW LOGIC: If the only size is "One Size" (common for toys), return EMPTY to hide selector completely.
    // User complaint: "It says Size when there is no size needed."
    if (cleanedSizes.length === 1 && (cleanedSizes[0] === "ONE SIZE" || cleanedSizes[0] === "ONESIZE")) {
        return [];
    }

    // Also filter out "Default Title" which comes from products with no variants
    return cleanedSizes.filter(s => s !== "DEFAULT TITLE");
}

function cleanProductTitle(title) {
    if (!title) return "Unknown Product";

    // 1. Remove Spam / Adult / Marketplace keywords & Gender / Marketing
    let clean = title.replace(/\b(sex doll|sex store|adult store|lingerie sex doll|store|marketplace|seller|external)\b/gi, '')
        .replace(/\b(women['’]s|women|woman|ladies|lady|female|girl|girls)\b/gi, '')
        .replace(/\b(sexy|porn|erotic|hot|fetish|sex|xxx|adult|crotchless|bodystockings|babydoll)\b/gi, '')
        .replace(/\b(fashion|new|arrival|best|selling|202[0-9])\b/gi, '')
        .replace(/\b(casual|summer|winter|spring|autumn)\b/gi, '')
        .replace(/\b(clothes|clothing|wear|apparel)\b/gi, '')
        .trim();

    // 2. Cleanup punctuation and spacing
    clean = clean.replace(/\s+/g, ' ')           // Collapse spaces
        .replace(/^\W+|\W+$/g, '')      // Trim leading/trailing non-word chars
        .trim();

    // 3. SEO Tail Removal
    clean = clean.split(' - ')[0].split(' | ')[0].trim();

    return clean || "Velvets Exclusive";
}

// ROBUST FIX: Accept initialImageSrc to enforce visual consistency
function openModal(product, initialVariantIndex = 0, initialImageSrc = null) {
    if (!product) return;
    currentModalProduct = product;

    // Reset State


    const img = document.getElementById('modal-img');
    const title = document.getElementById('modal-title');
    const price = document.getElementById('modal-price');

    // 0. Instant Visual Reset (Fix Flashing)
    if (img) img.src = ""; // Clear previous image instantly
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) qtyInput.value = 1; // Reset Quantity

    // 1. Basic Info - Load Image FIRST for speed
    // Use the initial variant's image if available, else product's main image
    const initialVar = product.variants[initialVariantIndex];
    if (initialVar) {
        selectedVariantId = initialVar.id; // CRITICAL: Sync State
    }

    // PRIORITY: If usage passed an explicit image (e.g. from Grid), use it.
    // Otherwise fallback to variant image -> product image.
    const resolvedSrc = initialImageSrc ||
        ((initialVar && initialVar.featured_image && initialVar.featured_image.src) ? initialVar.featured_image.src : getProductImage(product));

    img.src = resolvedSrc;
    title.innerText = cleanProductTitle(product.title);
    price.innerText = formatPrice(initialVar);

    // 2. Parse Variants & Sizes
    // Logic: Shopify options are usually [Color, Size]. We need to map them.
    // We will extract unique Colors (Option1) and Sizes (Option2).
    // Note: Adjust indices if data structure varies.
    const colors = getUniqueVariants(product, 1);
    const sizes = getValidSizes(product); // New Sanitized Logic

    // 3. Render Thumbnails (Colors)
    const thumbContainer = document.getElementById('variant-options');
    thumbContainer.innerHTML = '';

    if (colors.length > 0) {
        colors.forEach((color, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'variant-thumb';
            // Find an image associated with this color
            const variantImg = getVariantImage(product, color);
            thumb.style.backgroundImage = `url('${variantImg}')`;

            const updateColorUI = (c) => {
                document.getElementById('selected-color-name').innerText = c;
                const swatch = document.getElementById('active-swatch-indicator');
                if (swatch) swatch.style.backgroundColor = getSwatchColor(c);
            };

            const initialColor = product.variants[initialVariantIndex]?.option1;
            if (color === initialColor) {
                thumb.classList.add('selected');
                updateColorUI(color);
                if (!initialImageSrc) img.src = variantImg; // PROTECT VISUAL LOCK
            } else if (!initialColor && idx === 0) {
                // Fallback
                thumb.classList.add('selected');
                updateColorUI(color);
                if (!initialImageSrc) img.src = variantImg; // PROTECT VISUAL LOCK
            }

            thumb.onclick = () => {
                document.querySelectorAll('.variant-thumb').forEach(t => t.classList.remove('selected'));
                thumb.classList.add('selected');
                updateColorUI(color);
                img.src = variantImg;

                // Update Size Buttons for this color
                updateSizeAvailability(product, color);

                // Try to match current size
                const currentSize = document.getElementById('selected-size-name').innerText;
                let finalVar = product.variants.find(v => v.option1 === color && cleanSize(v.option2) === currentSize);

                if (!finalVar) {
                    // Fallback to first variant of this color if size mismatch
                    finalVar = product.variants.find(v => v.option1 === color);
                    // Optionally reset size UI here, but for now let's keep it simple
                }

                if (finalVar) {
                    selectedVariantId = finalVar.id;
                    price.innerText = formatPrice(finalVar);
                }

                updateAvailabilityUI(finalVar);
            };
            thumbContainer.appendChild(thumb);
        });
    }
    else {
        // Fallback for no variants
        thumbContainer.style.display = 'none';
    }

    // 4. Render Sizes
    const sizeContainer = document.getElementById('size-options');
    sizeContainer.innerHTML = '';

    if (sizes.length > 0) {
        // Part 1: Sanity Visuals - If only 1 size, auto-select and HIDE options
        if (sizes.length === 1) {
            sizeContainer.style.display = 'none';
            // Auto-select logic is handled below by matching initialClean
            // We ensure the label shows the single size
            document.getElementById('selected-size-name').innerText = sizes[0];

            // Set ID
            const activeColor = document.getElementById('selected-color-name').innerText;
            const finalVar = product.variants.find(v => v.option1 === activeColor && cleanSize(v.option2) === sizes[0]);
            if (finalVar) selectedVariantId = finalVar.id;
        } else {
            sizeContainer.style.display = 'flex';
        }

        const initialSize = product.variants[initialVariantIndex]?.option2;
        sizes.forEach((size, idx) => {
            const btn = document.createElement('div');
            btn.className = 'size-btn';
            btn.innerText = size;

            const selectSize = (s) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('selected-size-name').innerText = s;
                const activeColor = document.getElementById('selected-color-name').innerText;
                // Fuzzy Match with Clean Logic
                const finalVar = product.variants.find(v => v.option1 === activeColor && cleanSize(v.option2) === s);
                if (finalVar) {
                    selectedVariantId = finalVar.id;
                    // Update Image if this specific variant has one (rare for size, but good for safety)
                    if (finalVar.image) {
                        document.getElementById('modal-img').src = finalVar.image;
                    }
                }

                updateAvailabilityUI(finalVar);
            };

            // Compare Clean to Clean
            const initialClean = cleanSize(initialSize);
            // If single size, force selection
            if (sizes.length === 1 || size === initialClean) {
                btn.classList.add('selected');
                document.getElementById('selected-size-name').innerText = size;
                if (sizes.length === 1 && idx === 0) {
                    // Logic handled above for ID, but let's ensure visually correct
                } else {
                    selectedVariantId = product.variants[initialVariantIndex].id;
                }
            }

            btn.onclick = () => selectSize(size);
            sizeContainer.appendChild(btn);
        });

        // Initial Availability Check
        const startColor = document.getElementById('selected-color-name').innerText;
        updateSizeAvailability(product, startColor);

        // Initial Button State
        // Ensure selectedVariantId is set correctly above, then check it
        const initVar = product.variants.find(v => v.id === selectedVariantId);
        updateAvailabilityUI(initVar);
    }

    // Tabs removed

    const modal = document.getElementById('productModal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-glitch-entry');
    setTimeout(() => modal.classList.remove('modal-glitch-entry'), 500);
    modal.dataset.productId = product.id;
}

// Helper: Extract Unique Options
function getUniqueVariants(product, optionIndex) {
    // OptionIndex 1 = Option1 (Color usually), 2 = Size
    // Returns array of strings
    const set = new Set();
    product.variants.forEach(v => {
        const val = v[`option${optionIndex}`];
        if (val) set.add(val);
    });
    return Array.from(set);
}

// Helper: Get Image for Color
// Helper: Get Image for Color
function getVariantImage(product, colorName) {
    // 1. Find the variant for this color
    const v = product.variants.find(v => v.option1 === colorName);
    if (!v) return getProductImage(product);

    // 2. Strict Binding: Match ID
    if (v.image_id && product.images) {
        // Handle case where product.images are objects or strings
        const matchedImage = product.images.find(img =>
            (typeof img === 'object' && img.id === v.image_id)
        );

        if (matchedImage) {
            console.log(`[VariantBind] Resolved via ID: ${v.image_id}`);
            return matchedImage.src || matchedImage;
        }
    }

    // 3. Fallback: Use mapped 'image' property (URL)
    if (v.image && v.image !== "") {
        console.log(`[VariantBind] Fallback to mapped URL`);
        return v.image;
    }

    // 4. Final Fallback: Main product image
    console.log(`[VariantBind] No variant image found, using main.`);
    return getProductImage(product);
}

// Helper: Update Size Button Availability
function updateSizeAvailability(product, activeColor) {
    document.querySelectorAll('.size-btn').forEach(btn => {
        const size = btn.innerText;
        // Fuzzy Match with Clean Logic
        const variant = product.variants.find(v =>
            v.option1 === activeColor &&
            cleanSize(v.option2) === size
        );

        if (!variant || !variant.available) {
            btn.classList.add('disabled');
        } else {
            btn.classList.remove('disabled');
        }
    });
}

// Helper: Update Availability UI
function updateAvailabilityUI(variant) {
    const btn = document.getElementById('addToBagBtn');
    if (!btn) return;

    if (!variant || !variant.available) {
        btn.disabled = true;
        btn.innerText = "SOLD OUT";
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    } else {
        btn.disabled = false;
        btn.innerText = "ADD TO BAG";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
}


// Helper: Price Formatter
function formatPrice(variant) {
    return variant ? `$${variant.price}` : '$0.00';
}

// Helper: Size Sanitization
function cleanSize(size) {
    if (!size) return "";
    let s = size.toString().toUpperCase().trim();

    // 1. Remove Weight/Measurement Tokens (e.g. "40KG", "40 KG", "65KG", "KG")
    // Regex matches optional number prefix, optional space, then KG literal.
    s = s.replace(/\b[\d\-\.]*\s*KG\b/gi, '');

    // 2. Remove Country / Region / Vendor Tokens
    // Expanded blocklist based on requirements
    const blocklist = [
        "OLD", "NEW", "STORE", "VENDOR", "OFFICIAL", "ORIGINAL",
        "RUSSIAN FEDERATION", "RUSSIA", "CHINA", "USA", "UNITED STATES",
        "FRANCE", "UK", "UNITED KINGDOM", "GERMANY", "ITALY", "SPAIN",
        "CZECH REPUBLIC", "POLAND", "AUSTRALIA", "CANADA", "BRAZIL",
        "ZSEC", "REPUBLIC", "MAINLAND", "SHIPPING"
    ];
    // Create logic to remove these tokens
    const pattern = new RegExp(`\\b(${blocklist.join('|')})\\b`, 'gi');
    s = s.replace(pattern, '');

    // 3. Cleanup punctuation and spaces
    // Remove lingering hyphens or parens unless they look valid (like "S-M")
    // If it's just " - " floating, remove it.
    s = s.replace(/\s+-\s+/g, ' ');
    s = s.replace(/[\(\)\[\]]/g, ''); // Remove brackets

    // Collapse multiple spaces
    s = s.replace(/\s+/g, ' ').trim();

    // 4. One Size Repair
    // If the remaining string contains "ONE SIZE", strictly return "One Size" 
    // (ignoring other garbage that might have survived if it wasn't blocklisted)
    if (s.includes("ONE SIZE")) return "One Size";

    return s;
}

function getValidSizes(product) {
    // 1. Get raw sizes
    let rawSizes = getUniqueVariants(product, 2);
    // 2. Clean them
    let sizeMap = rawSizes.map(s => ({ original: s, clean: cleanSize(s) }));

    // 3. Check for One Size conflict
    // If we have "One Size" AND other sizes (S, M, L), remove "One Size"
    const hasOneSize = sizeMap.some(o => o.clean === "ONE SIZE");
    const hasMultiple = sizeMap.filter(o => o.clean !== "ONE SIZE" && o.clean !== "").length > 0;

    if (hasOneSize && hasMultiple) {
        sizeMap = sizeMap.filter(o => o.clean !== "ONE SIZE");
    }

    // 4. Return unique clean labels (deduped)
    const unique = new Set();
    const result = [];
    sizeMap.forEach(item => {
        if (!unique.has(item.clean) && item.clean !== "") {
            unique.add(item.clean);
            result.push(item.clean);
        }
    });
    return result;
}


function closeModal() {
    const modal = document.getElementById('productModal');
    modal.classList.add('hidden');
    document.querySelectorAll('.wheelItem.selected').forEach(el => el.classList.remove('selected'));
}

function addToBag() {
    const btn = document.getElementById('addToBagBtn');
    if (btn.disabled) return; // Prevent double clicks
    btn.disabled = true;

    // 1. Core Logic & Data Pack
    const modal = document.getElementById('productModal');
    // Find active states
    const activeColor = document.getElementById('selected-color-name').innerText;
    const activeSize = document.getElementById('selected-size-name').innerText;

    // Find real objects
    // State is global: currentModalProduct, selectedVariantId
    const product = currentModalProduct;
    const variant = product.variants.find(v => v.id === selectedVariantId);

    // Safety check for One Size logic
    let finalSize = activeSize;
    if (!finalSize || finalSize === "Select") {
        const validSizes = getValidSizes(product);
        if (validSizes.length === 1) finalSize = validSizes[0];
    }

    const qtyInput = document.getElementById('qty-input');
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    addToCart(product, variant, finalSize, qty);

    // 2. Visual Animation (Fly to Cart)
    const modalImg = document.getElementById('modal-img');
    const cartIcon = document.getElementById('cartIcon');

    if (modalImg && cartIcon) {
        // Create Clone
        const clone = modalImg.cloneNode(true);
        const rect = modalImg.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();

        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '10000';
        clone.style.borderRadius = '12px';
        clone.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
        clone.style.pointerEvents = 'none';
        clone.style.objectFit = 'cover';
        document.body.appendChild(clone);

        // Force Reflow
        void clone.offsetWidth;

        // Target Coordinates (Center of Cart Icon)
        const targetX = cartRect.left + (cartRect.width / 2) - (rect.width / 2);
        const targetY = cartRect.top + (cartRect.height / 2) - (rect.height / 2);

        // Scale Down Calculation
        const scale = 30 / rect.width; // Target size approx 30px

        clone.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px) scale(${scale})`;
        clone.style.opacity = '0.5';

        // Cleanup & Update
        setTimeout(() => {
            clone.remove();

            // Update Count
            const countEl = document.getElementById('cart-count'); // Assuming span exists inside
            // My previous view showed `CART <span id="cart-count">0</span>`? 
            // Let's check HTML. Yes: <div class="cart-icon" id="cartIcon">CART <span id="cart-count">0</span></div>
            // Wait, previous code used `document.getElementById('cartCount').innerText`. 
            // HTML shows `id="cartIcon"` and `id="cart-count"`.
            // The previous code had `document.getElementById('cartCount')` which might have been a typo if ID is cart-count?
            // Let's use `cart-count` ID from HTML view.

            const countDisplay = document.getElementById('cart-count');
            if (countDisplay) {
                countDisplay.innerText = cart.length;
                countDisplay.style.color = '#FFD700'; // Gold flash
                setTimeout(() => countDisplay.style.color = '', 500);
            }

            // Pulse Icon
            cartIcon.classList.remove('cart-pulse');
            void cartIcon.offsetWidth;
            cartIcon.classList.add('cart-pulse');

            // Close Modal
            closeModal();
            btn.disabled = false;
        }, 800);
    } else {
        // Fallback if elements missing
        document.getElementById('cart-count').innerText = cart.length;
        closeModal();
        btn.disabled = false;
    }
}

// --- PRELOADER LOGIC ---
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 500);
        }, 800); // Minimum view time
    }
});

// --- WHEELS ---
function renderWheels() {
    const container = document.getElementById('wheelClusterContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!window.railProducts || window.railProducts.length === 0) return;

    const CHUNK_SIZE = 10;
    const NUM_WHEELS = 3;

    for (let i = 0; i < NUM_WHEELS; i++) {
        // Safe Slicing with Fallback/Cycling
        let startIdx = (i * CHUNK_SIZE) % window.railProducts.length;
        let chunk = [];

        // Fill chunk intelligently
        for (let j = 0; j < CHUNK_SIZE; j++) {
            chunk.push(window.railProducts[(startIdx + j) % window.railProducts.length]);
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'wheelContainer';
        wrapper.id = `carousel-${i}`;

        const rotator = document.createElement('div');
        rotator.className = 'wheelInnerRotator';

        const RADIUS = 180;
        const angleStep = 360 / chunk.length;

        chunk.forEach((p, idx) => {
            const item = document.createElement('div');
            item.className = 'wheelItem';
            const src = getProductImage(p);
            item.style.backgroundImage = `url('${src}')`;
            const angle = idx * angleStep;
            const baseTransform = `rotateY(${angle}deg) translateZ(${RADIUS}px)`;
            item.style.setProperty('--base-transform', baseTransform);
            item.style.transform = `var(--base-transform) scale(var(--scale-factor, 1))`;

            item.onclick = (e) => {
                document.querySelectorAll('.wheelItem').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                openModal(p, 0, src); // Wheels show first variant, pass visual src
                if (spotlightCycleTimeout) clearTimeout(spotlightCycleTimeout);
                const spotImg = document.getElementById('spotlight-image');
                if (spotImg) spotImg.opacity = 1;
                triggerSpotlightGlitchSwap(p);
                setTimeout(() => {
                    if (spotlightCycleTimeout) clearTimeout(spotlightCycleTimeout);
                    runSpotlightCycle();
                }, 5000);
            };
            rotator.appendChild(item);
        });
        wrapper.appendChild(rotator);
        container.appendChild(wrapper);
    }
}

// --- PRODUCT GRID ---
function renderGrid() {
    const grid = document.getElementById('product-grid');
    if (!grid || !window.railProducts) return;
    grid.innerHTML = '';

    // Use all available products
    const products = window.railProducts;

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'grid-item';

        const src = getProductImage(p);
        const cleanTitle = cleanProductTitle(p.title);

        card.innerHTML = `
            <img src="${src}" loading="lazy" alt="${cleanTitle}">
            <div class="grid-info">
                <h3 class="grid-title">${cleanTitle}</h3>
                <p class="grid-price">$${p.variants && p.variants[0] ? p.variants[0].price : '0.00'}</p>
            </div>
        `;

        card.onclick = () => {
            // UX POLISH: We explicitly show Variant 0's image in the grid (via getProductImage).
            // Therefore, we MUST open the modal with Variant 0 selected.
            // This ensures perfect Visual <-> Logic alignment.
            openModal(p, 0, src);
        };
        grid.appendChild(card);
    });
}

// --- SCROLL REVEAL ---
function initGridReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe existing items
    document.querySelectorAll('.grid-item').forEach(item => {
        observer.observe(item);
    });

    // Hook into renderGrid to observe new items if re-rendered
    const originalRenderGrid = renderGrid;
    window.renderGrid = function () {
        originalRenderGrid();
        document.querySelectorAll('.grid-item').forEach(item => {
            observer.observe(item);
        });
    };
}

// --- QUANTITY LOGIC ---
function initQuantityControl() {
    const minus = document.getElementById('qty-minus');
    const plus = document.getElementById('qty-plus');
    const input = document.getElementById('qty-input');

    if (minus && plus && input) {
        minus.onclick = () => {
            let val = parseInt(input.value) || 1;
            if (val > 1) input.value = val - 1;
        };
        plus.onclick = () => {
            let val = parseInt(input.value) || 1;
            if (val < 20) input.value = val + 1;
        };
    }
}

window.onload = null;
window.addEventListener('DOMContentLoaded', initSystem);

// --- SPOTLIGHT DRAG ALIGNMENT TOOL REMOVED ---
// Fixed via CSS transform: translateX(-55vw)
