(() => {
    const container   = document.querySelector('.canvas-container');
    const mainArea    = document.querySelector('.main-area');
    const toolbar     = mainArea.querySelector('.toolbar');
    const swatches    = document.getElementById('colorSwatches');
    const gradientCv  = document.getElementById('gradientCanvas');
    const swatchBar  = document.querySelector('.swatches-container');

    if (!container || !mainArea || !gradientCv) return;

    const GAP          = 12;                        // canvas ↔ swatches
    const TOOLBAR_GAP  = 12;                        // extra gap below toolbar
    container.style.transformOrigin = 'top left';   // ensure scale works

    const updatePos = () => {
        const w = gradientCv.width;
        const h = gradientCv.height;

        const isMobile = window.innerWidth < 1200;

        /* robust toolbar offset: distance from top of .main-area to bottom of toolbar,
           automatically includes padding & margins that may be introduced later */
        let toolbarOffset = 0;
        if (isMobile && toolbar) {
            const tRect = toolbar.getBoundingClientRect();
            const mRect = mainArea.getBoundingClientRect();
            toolbarOffset = tRect.bottom - mRect.top;    // includes margin-bottom & paddings
        }

        /* dynamic swatch height */
        const swH = swatchBar.offsetHeight || 0;

        /* free area inside column */
        const freeW = mainArea.clientWidth;
        const freeH = mainArea.clientHeight
                    - toolbarOffset - TOOLBAR_GAP     // new gap
                    - swH - GAP;

        /* scale so both width & height fit */
        const scale   = Math.min(1, freeW / w, freeH / h);
        const scaledW = w * scale;
        const scaledH = h * scale;

        /* centred coordinates */
        const left = Math.max(0, (freeW - scaledW) / 2);
        const top  = toolbarOffset + TOOLBAR_GAP      // new gap
                   + Math.max(0, (freeH - scaledH) / 2);

        /* apply */
        container.style.width     = `${w}px`;
        container.style.height    = `${h}px`;
        container.style.left      = `${left}px`;
        container.style.top       = `${top}px`;
        container.style.transform = `scale(${scale})`;

        swatchBar.style.width = `${scaledW}px`;
        swatchBar.style.left  = `${left}px`;
        swatchBar.style.top   = `${top + scaledH + GAP}px`;

        /* column min-height uses un-scaled canvas height + both gaps */
        const blockHeight = toolbarOffset + TOOLBAR_GAP + h + GAP + swH;
        mainArea.style.minHeight = `${blockHeight}px`;
    };

    /* --- events --- */
    window.addEventListener('resize', updatePos);

    /* toolbar button */
    document.getElementById('resizeCanvas')?.addEventListener('click', () =>
        requestAnimationFrame(updatePos));

    /* react to direct edits in the number inputs */
    ['canvasWidth','canvasHeight'].forEach(id=>{
        document.getElementById(id)?.addEventListener('change', ()=>
            requestAnimationFrame(updatePos));
    });

    /* observe attribute mutations on the canvas element */
    new MutationObserver(updatePos)
        .observe(gradientCv, { attributes:true, attributeFilter:['width','height','style'] });

    /* initial run */
    window.addEventListener('load', updatePos);
})();
