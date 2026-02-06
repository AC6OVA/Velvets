
/* --- CARD BEAM & ASCII FX --- */
// Adapted for Velvets Checkout

class CardScannerFX {
    constructor(containerId, canvasId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.getElementById(canvasId);
        if (!this.container || !this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.w = this.container.offsetWidth;
        this.h = this.container.offsetHeight;

        // Config
        this.particles = [];
        this.count = 0;
        this.maxParticles = 100; // Reduced for small area
        this.intensity = 0.8;

        this.lightBarX = this.w / 2;
        this.lightBarWidth = 2; // Thin concise beam
        this.fadeZone = 20;

        // Resize observer
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);

        this.initParticles();
        this.createGradientCache();

        this.active = false;
        this.animationId = null;
    }

    start() {
        if (!this.active) {
            this.active = true;
            this.animate();
        }
    }

    stop() {
        this.active = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.ctx.clearRect(0, 0, this.w, this.h);
    }

    onResize() {
        this.w = this.container.offsetWidth;
        this.h = this.container.offsetHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.lightBarX = this.w / 2;
    }

    // --- PARTICLE LOGIC (Simplified) ---
    createGradientCache() {
        this.gradientCanvas = document.createElement('canvas');
        this.gradientCtx = this.gradientCanvas.getContext('2d');
        this.gradientCanvas.width = 16;
        this.gradientCanvas.height = 16;

        const half = 8;
        const g = this.gradientCtx.createRadialGradient(half, half, 0, half, half, half);
        g.addColorStop(0, "rgba(255, 255, 255, 1)");
        g.addColorStop(0.4, "rgba(0, 255, 255, 0.6)");
        g.addColorStop(1, "transparent");

        this.gradientCtx.fillStyle = g;
        this.gradientCtx.fillRect(0, 0, 16, 16); // Fill logic was circular but rect is faster to render
    }

    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.resetParticle({}));
        }
    }

    resetParticle(p) {
        p.x = this.lightBarX + (Math.random() - 0.5) * 10;
        p.y = Math.random() * this.h;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 2.0; // Vertical drift
        p.life = Math.random();
        p.decay = 0.01 + Math.random() * 0.03;
        p.size = 1 + Math.random() * 2;
        return p;
    }

    update() {
        // 1. Oscillate Beam
        const time = performance.now() * 0.001;
        // Move beam largely across the container
        // Center is w/2. Range is w/2 * 0.8
        this.lightBarX = (this.w / 2) + Math.sin(time) * (this.w * 0.45);

        // 2. Update Clipping on Card
        const wrapper = document.querySelector('.card-wrapper');
        if (wrapper) {
            const normalCard = wrapper.querySelector('.card-normal');
            const asciiCard = wrapper.querySelector('.card-ascii');

            // Map beam position relative to card
            // We need card rect relative to container
            // Since card is centered in container, valid intersection is:
            // Beam > CardLeft && Beam < CardRight

            // Simplified: Card is 320px wide centered.
            const cardW = 320;
            const cardLeft = (this.w - cardW) / 2;
            const cardRight = cardLeft + cardW;

            const scannerWidth = 40; // The glow area
            const scannerLeft = this.lightBarX - scannerWidth / 2;
            const scannerRight = this.lightBarX + scannerWidth / 2;

            if (scannerRight > cardLeft && scannerLeft < cardRight) {
                // Intersection!
                const relX = this.lightBarX - cardLeft;
                const progress = relX / cardW;

                // We want: 
                // Left of beam = Normal? Or Right of beam = Normal?
                // User demo: "normalCard clip-right" -> Normal is visible on LEFT if clip-right is used?
                // No, inset(top right bottom left).
                // inset(0 0 0 0) = full visible.
                // inset(0 0 0 50%) = left half hidden (right half visible).
                // var(--clip-right, 0%) usually implies masking from right?
                // User code: inset(0 0 0 var(--clip-right)) -> masking LEFT? No, 4th arg is left.
                // Wait. CSS `inset` syntax: inset(top right bottom left).
                // User code: `inset(0 0 0 var(--clip-right))` -> masking LEFT edge by X%?
                // Actually, let's stick to standard "Reveal" logic.
                // Let's say: Beam reveals ASCII. Normal is default.
                // If Beam is at 50%:
                // Normal should be masked around the beam?
                // User snippet: "scan-effect".

                // Let's implement a simpler "Swipe" for clarity if the specific overlapping logic is complex to port 1:1 without the full environment.
                // ACTUALLY, let's replicate the user's math:

                /*
                const normalClipRight = (scannerIntersectLeft / cardWidth) * 100;
                const asciiClipLeft = (scannerIntersectRight / cardWidth) * 100;
                */

                // Let's apply a focused logic:
                // Beam is at `relX`.
                // ASCII is visible 'inside' the beam or behind it?
                // User effect: "Scanner Reveal".
                // Let's make ASCII visible ONLY to the Left of beam (as if beam is writing it) 
                // OR make ASCII visible INSIDE the beam. 

                // Let's try: Beam acts as a wiper.
                // Left of beam = Normal. Right of beam = ASCII.
                // Or vice versa.

                // User code implies:
                // normalCard bounds defined by clip-right.
                // asciiCard bounds defined by clip-left.

                // Let's just push percentages:
                const pct = Math.max(0, Math.min(100, progress * 100));

                // Reveal ASCII on the right side of the beam
                if (normalCard) normalCard.style.setProperty('--clip-right', `${pct}%`);  // inset(0 0 0 pct) -> Mask left
                // Wait, inset(T R B L).
                // If I want to show Normal on the Right: inset(0 0 0 pct%).
                // If I want to show Normal on the Left: inset(0 pct% 0 0).

                // Let's assume standard wiper:
                // Beam moves Left -> Right.
                // Left side becomes ASCII. Right side stays Normal.
                if (normalCard) normalCard.style.clipPath = `inset(0 0 0 ${pct}%)`; // Hide Left part
                if (asciiCard) asciiCard.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; // Hide Right part

                // This makes:
                // Normal: Visible [Pct -> 100]
                // ASCII: Visible [0 -> Pct]
                // Result: ASCII is on Left, Normal is on Right. Beam wipes Normal away.
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.globalCompositeOperation = "lighter"; // Glow

        // Draw Beam
        const beamW = this.lightBarWidth;
        const g = this.ctx.createLinearGradient(this.lightBarX - 20, 0, this.lightBarX + 20, 0);
        g.addColorStop(0, "transparent");
        g.addColorStop(0.5, "rgba(0, 255, 255, 0.5)");
        g.addColorStop(1, "transparent");

        this.ctx.fillStyle = g;
        this.ctx.fillRect(this.lightBarX - 20, 0, 40, this.h);

        this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.fillRect(this.lightBarX - 1, 0, 2, this.h); // Core

        // Particles
        this.particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.life -= p.decay;

            if (p.life <= 0) this.resetParticle(p);

            this.ctx.globalAlpha = p.life;
            this.ctx.drawImage(this.gradientCanvas, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        });
    }

    animate() {
        if (!this.active) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// ASCII Generator
function generateAscii(w, h) {
    const chars = "XYZ010101_.:!/|\\";
    let txt = "";
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            txt += chars[Math.floor(Math.random() * chars.length)];
        }
        txt += "\n";
    }
    return txt;
}
