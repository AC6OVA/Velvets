
// --- SPOTLIGHT DRAG ALIGNMENT TOOL ---
function enableSpotlightDrag() {
    const spotlight = document.getElementById('spotlight-image');
    if (!spotlight) return;

    // Create Debug Overlay
    const overlay = document.createElement('div');
    overlay.id = 'align-debug';
    overlay.style.position = 'fixed';
    overlay.style.top = '100px';
    overlay.style.left = '20px';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.color = '#00FF00';
    overlay.style.padding = '10px';
    overlay.style.fontSize = '16px';
    overlay.style.zIndex = '10000';
    overlay.style.border = '1px solid #00FF00';
    overlay.style.fontFamily = 'monospace';
    overlay.innerText = 'Drag Image to Align';
    document.body.appendChild(overlay);

    let isDragging = false;
    let startX = 0;
    let currentVW = -40; // Start at current CSS value

    // Helper: Convert VW to Pixels and back
    const vwToPx = (vw) => (vw * window.innerWidth) / 100;
    const pxToVw = (px) => (px / window.innerWidth) * 100;

    let startTranslatePX = vwToPx(currentVW);

    spotlight.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startTranslatePX = vwToPx(currentVW);
        spotlight.style.cursor = 'grabbing';
        overlay.innerText = `Dragging...`;
    }, { passive: false });

    spotlight.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Stop scroll
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        const newTranslatePX = startTranslatePX + deltaX;
        const newVW = pxToVw(newTranslatePX);

        // Update Transform directly
        spotlight.style.cssText += `transform: translateX(${newVW}vw) !important;`;

        // Update Overlay
        overlay.innerText = `Offset: ${newVW.toFixed(1)}vw`;
    }, { passive: false });

    spotlight.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        spotlight.style.cursor = 'grab';
        // Finalize value
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(spotlight).transform);
        const finalPX = matrix.m41;
        currentVW = pxToVw(finalPX);
        overlay.innerText = `FINAL OFFSET: ${currentVW.toFixed(1)}vw`;
    });

    // MOUSE SUPPORT (For Desktop Simulator)
    spotlight.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startTranslatePX = vwToPx(currentVW);
        spotlight.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const newTranslatePX = startTranslatePX + deltaX;
        const newVW = pxToVw(newTranslatePX);
        spotlight.style.cssText += `transform: translateX(${newVW}vw) !important;`;
        overlay.innerText = `Offset: ${newVW.toFixed(1)}vw`;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            spotlight.style.cursor = 'grab';
            // Recalculate currentVW from actual style
            const style = spotlight.style.transform;
            // extract vw
            const match = style.match(/translateX\((-?\d+\.?\d*)vw\)/);
            if (match) currentVW = parseFloat(match[1]);
        }
    });
}

// Initialize logic
if (window.innerWidth < 769) {
    // Wait for DOM
    setTimeout(enableSpotlightDrag, 1000);
}
