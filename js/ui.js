// Global meshGradient variable
let meshGradient;

/**
 * UI Controller for the Mesh Gradient Generator
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('UI initializing...');
    
    // Add a small delay to ensure MeshGradient is fully initialized
    setTimeout(() => {
        if (typeof MeshGradient === 'undefined') {
            console.error("MeshGradient not found. Check script loading order.");
            return;
        }
        
        console.log("MeshGradient found, continuing with UI initialization");
        
        // Create the MeshGradient instance first
        try {
            meshGradient = new MeshGradient();
            initializeUI();
        } catch (error) {
            console.error('MeshGradient not found. Check script loading order.', error);
        }
    }, 100);
});

// Add this helper function near the top of your file
function getDistortions() {
    if (!window.meshGradient) return null;
    
    // Handle both the old and new structure
    if (meshGradient.distortions) {
        return meshGradient.distortions;
    } else if (meshGradient.data && meshGradient.data.distortions) {
        return meshGradient.data.distortions;
    }
    
    return null;
}

function hasActiveDistortion() {
    const distortions = getDistortions();
    return distortions && typeof distortions.hasActive === 'function' 
        ? distortions.hasActive() 
        : false;
}

// Move all UI initialization to a separate function
function initializeUI() {
    if (!meshGradient) return;
    
    // Get DOM elements
    const canvas = document.getElementById('gradientCanvas');
    const colorPicker = document.getElementById('cellColorPicker');
    const generateBtn = document.getElementById('generateBtn');
    const exportPngBtn = document.getElementById('exportPngBtn');
    const editModeToggle = document.getElementById('editModeToggle');
    const cellCountSlider = document.getElementById('cellCount');
    const cellCountValue = document.getElementById('cellCountValue');
    const blurAmountSlider = document.getElementById('blurAmount');
    const blurAmountValue = document.getElementById('blurAmountValue');
    const colorHarmonySelect = document.getElementById('colorHarmony');
    const colorThemeSelect = document.getElementById('colorTheme');
    const distortionTypeSelect = document.getElementById('distortionType');
    const distortionParams = document.getElementById('distortionParams');
    const minCellCount = document.getElementById('minCellCount');
    const maxCellCount = document.getElementById('maxCellCount');
    const maxBlurValue = document.getElementById('maxBlurValue');
    const canvasWidthInput = document.getElementById('canvasWidth');
    const canvasHeightInput = document.getElementById('canvasHeight');
    const resizeCanvasBtn = document.getElementById('resizeCanvas');
    
    // Initialize the mesh gradient
    meshGradient.generate();
    
    // Initial UI setup
    function initUI() {
        console.log("initUI called");
        const constraints = meshGradient.getConstraints();

        // Cell slider ------------------------
        cellCountSlider.min  = constraints.cells.min;
        cellCountSlider.max  = constraints.cells.max;
        cellCountSlider.value = constraints.cells.current;
        cellCountValue.textContent = constraints.cells.current;
        minCellCount.textContent   = constraints.cells.min;
        maxCellCount.textContent   = constraints.cells.max;

        // Blur slider ------------------------
        blurAmountSlider.min  = constraints.blur.min;
        blurAmountSlider.max  = constraints.blur.max;
        blurAmountSlider.value = constraints.blur.current;
        blurAmountValue.textContent = constraints.blur.current;
        maxBlurValue.textContent    = constraints.blur.max;

        // Initial render ---------------------
        meshGradient.generate();          // first render uses default theme
        meshGradient.setColorTheme(colorThemeSelect.value); // ensure synced

        // Make sure we're using the toolbar edit mode toggle
        document.getElementById('editModeToggle').addEventListener('change', function() {
            meshGradient.setEditMode(this.checked);
        });
    }
    
    // Generate button click
    generateBtn.addEventListener('click', function() {
        meshGradient.generate();
    });
    
    // Cell count slider change
    cellCountSlider.addEventListener('input', function() {
        const count = parseInt(this.value);
        cellCountValue.textContent = count;
        meshGradient.setCellCount(count);
    });
    
    // Blur amount slider change
    blurAmountSlider.addEventListener('input', function() {
        const amount = parseInt(this.value);
        blurAmountValue.textContent = amount;
        meshGradient.setBlurAmount(amount);
    });
    
    // Color harmony select change
    colorHarmonySelect.addEventListener('change', function() {
        meshGradient.setColorHarmony(this.value);
    });
    
    // Color theme select change
    colorThemeSelect.addEventListener('change',()=>meshGradient.setColorTheme(colorThemeSelect.value));
    
    // HSL Adjustment Buttons
    document.getElementById('hueDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ hue: -10 }); // Decrease hue by 10 degrees
    });
    
    document.getElementById('hueIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ hue: 10 }); // Increase hue by 10 degrees
    });
    
    document.getElementById('satDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ saturation: -5 }); // Decrease saturation by 5%
    });
    
    document.getElementById('satIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ saturation: 5 }); // Increase saturation by 5%
    });
    
    document.getElementById('lightDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ lightness: -5 }); // Decrease lightness by 5%
    });
    
    document.getElementById('lightIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ lightness: 5 }); // Increase lightness by 5%
    });
    
    // Edit mode toggle
    editModeToggle.addEventListener('change', function() {
        meshGradient.setEditMode(this.checked);
    });
    
    // Export PNG button click
    exportPngBtn.addEventListener('click', function() {
        meshGradient.exportAsPNG();
    });
    
    // Canvas resize
    resizeCanvasBtn.addEventListener('click', () => {
        const width  = parseInt(canvasWidthInput.value);
        const height = parseInt(canvasHeightInput.value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            return;
        }

        const constraints = meshGradient.resizeCanvas(width, height); // fresh values

        // Reflect new blur limits
        blurAmountSlider.min  = constraints.minBlurAmount ?? 0; // always 0
        blurAmountSlider.max  = constraints.maxBlurAmount;
        blurAmountSlider.value = constraints.currentBlurAmount;
        blurAmountValue.textContent = constraints.currentBlurAmount;
        maxBlurValue.textContent    = constraints.maxBlurAmount;

        // Re‑render with updated canvas
        meshGradient.render();

        // If Twist is selected, rebuild its slider limits
        if (distortionTypeSelect.value === 'twist'){
            rebuildDistortionParams('twist');
        }
    });
    
    // Mouse events for cell manipulation
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        meshGradient.startDrag(x, y);
    });
    
    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // For dragging in edit mode
        meshGradient.drag(x, y);
        
        // For hover highlighting
        meshGradient.setHoverPosition(x, y);
        
        // Update button hover state
        meshGradient.updateButtonHover(x, y);
    });
    
    canvas.addEventListener('mouseup', function() {
        meshGradient.endDrag();
    });
    
    canvas.addEventListener('mouseleave', function() {
        meshGradient.endDrag();
        meshGradient.clearHover();
    });
    
    // Touch events for mobile devices
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            meshGradient.startDrag(x, y);
        }
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            meshGradient.drag(x, y);
        }
    });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        meshGradient.endDrag();
    });
    
    // Distortion type change
    distortionTypeSelect.addEventListener('change', function() {
        const type = distortionTypeSelect.value;
        console.log("Distortion selected:", type);
        
        if (type === 'none') {
            console.log("Disabling distortion");
            distortionParams.classList.add('d-none');
            const distortions = getDistortions();
            if (distortions && typeof distortions.setStack === 'function') {
                distortions.setStack([]);
            }
            editModeToggle.disabled = false;
        } else {
            console.log("Enabling distortion:", type);
            distortionParams.classList.remove('d-none');
            
            // Create distortion options object
            const distortionOpts = {}; // defaults are inside each apply fn
            
            if (type === 'polar') {
                // Will extend with UI controls later
                distortionOpts.centerX = 0.5;
                distortionOpts.centerY = 0.5;
                distortionOpts.angleOffset = 0;
                distortionOpts.zoom = 1.0;
                console.log("Polar distortion options:", distortionOpts);
            }
            
            const distortions = getDistortions();
            if (distortions && typeof distortions.setStack === 'function') {
                distortions.setStack([{ 
                    type: type, 
                    opts: distortionOpts 
                }]);
            }
            
            // Disable edit mode when distortion active
            editModeToggle.checked = false;
            editModeToggle.disabled = true;
        }
    });
    
    // Cell color selection handling
    let selectedCellIndex = -1;
    let colorPickerPosition = { x: 0, y: 0 };
    
    // Click on canvas to interact with hovered or edited cells
    canvas.addEventListener('click', function(e) {
        if (hasActiveDistortion()) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (meshGradient.editMode) {
            // In edit mode, check if any button was clicked
            if (meshGradient.hoveredButton && meshGradient.hoveredCellIndex >= 0) {
                const cellIndex = meshGradient.hoveredCellIndex;
                
                if (meshGradient.hoveredButton === 'colorBtn') {
                    // Color button was clicked
                    selectedCellIndex = cellIndex;
                    
                    // Get current color and set it as the color picker value
                    const currentColor = meshGradient.getCellColor(selectedCellIndex);
                    colorPicker.value = currentColor.hex;
                    
                    // Store position for color picker
                    colorPickerPosition = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    
                    // Open the color picker
                    colorPicker.click();
                } else if (meshGradient.hoveredButton === 'lockBtn') {
                    // Lock button was clicked
                    const isLocked = meshGradient.isCellColorLocked(cellIndex);
                    
                    if (isLocked) {
                        meshGradient.unlockCellColor(cellIndex);
                    } else {
                        meshGradient.lockCellColor(cellIndex);
                    }
                }
            }
        } else {
            // Original hover mode behavior
            if (meshGradient.hoverControls) {
                // Check if click is on the color picker button
                if (meshGradient.isPointInControl(x, y, 'colorBtn')) {
                    selectedCellIndex = meshGradient.hoverControls.cell;
                    
                    // Get current color and set it as the color picker value
                    const currentColor = meshGradient.getCellColor(selectedCellIndex);
                    colorPicker.value = currentColor.hex;
                    
                    // Store button position for color picker placement
                    colorPickerPosition = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    
                    // Open the color picker
                    colorPicker.click();
                } 
                // Check if click is on the lock/unlock button
                else if (meshGradient.isPointInControl(x, y, 'lockBtn')) {
                    const cellIndex = meshGradient.hoverControls.cell;
                    const isLocked = meshGradient.isCellColorLocked(cellIndex);
                    
                    if (isLocked) {
                        meshGradient.unlockCellColor(cellIndex);
                    } else {
                        meshGradient.lockCellColor(cellIndex);
                    }
                }
            }
        }
    });
    
    // Position and handle color picker
    colorPicker.addEventListener('click', function(e) {
        // Prevent the click from bubbling up
        e.stopPropagation();
    });
    
    // Handle color picker change
    colorPicker.addEventListener('input', function(e) {
        if (selectedCellIndex >= 0) {
            // Live preview as user selects color (temporary override)
            meshGradient.setCellColor(selectedCellIndex, e.target.value, false);
        }
    });
    
    colorPicker.addEventListener('change', function(e) {
        if (selectedCellIndex >= 0) {
            // Final color selection - check if we should lock this color
            const isLocked = meshGradient.isCellColorLocked(selectedCellIndex);
            meshGradient.setCellColor(selectedCellIndex, e.target.value, isLocked);
            selectedCellIndex = -1; // Reset selection
        }
    });
    
    // Style the color picker to position it near the clicked button
    // This is necessary because some browsers don't allow full custom positioning of color pickers
    document.addEventListener('click', function(e) {
        if (e.target === colorPicker) {
            // Attempt to position via CSS custom properties
            document.documentElement.style.setProperty('--color-picker-top', `${colorPickerPosition.y}px`);
            document.documentElement.style.setProperty('--color-picker-left', `${colorPickerPosition.x}px`);
        }
    });
    
    initUI();
    console.log("UI initialization complete");
    
    /* ------------------------------------------------------------------ */
    /* Distortion parameter meta‑table                                     */
    /* ------------------------------------------------------------------ */
    const DISTORTION_META = {
        ripple : {
            centerX   : {lbl:'Center X', min:0 , max:1 , step:0.01, val:0.5},
            centerY   : {lbl:'Center Y', min:0 , max:1 , step:0.01, val:0.5},
            amplitude : {lbl:'Amplitude', min:0 , max:100, step:1   , val:10 },
            frequency : {lbl:'Frequency', min:1 , max:30 , step:1   , val:12 },
            speed     : {lbl:'Speed'    , min:0 , max:10 , step:0.1 , val:1  }
        },
        polar  : {
            centerX    : {lbl:'Center X', min:0 , max:1 , step:0.01, val:0.5},
            centerY    : {lbl:'Center Y', min:0 , max:1 , step:0.01, val:0.5},
            scale      : {lbl:'Scale'   , min:0.1, max:3, step:0.1 , val:1  },
            angleOffset: {lbl:'Angle °' , min:0 , max:360, step:1  , val:0  },
            zoom       : {lbl:'Zoom'    , min:0.5, max:4, step:0.1 , val:1  }
        },
        wave   : {
            direction : {lbl:'Direction', type:'select', options:['horizontal','vertical'], val:'horizontal'},
            amplitude : {lbl:'Amplitude', min:0 , max:100, step:1 , val:20},
            frequency : {lbl:'Frequency', min:1 , max:10 , step:1 , val:3 },
            speed     : {lbl:'Speed'    , min:0 , max:10 , step:0.1, val:1 },
            time      : {lbl:'Time'     , min:0 , max:100, step:0.1, val:0 }
        },
        twist  : buildTwistMeta,              // <-- now a function
        bulge  : {
            centerX : {lbl:'Center X', min:0 , max:1, step:0.01, val:0.5},
            centerY : {lbl:'Center Y', min:0 , max:1, step:0.01, val:0.5},
            radius  : {lbl:'Radius px',  min:10, max:600, step:1 , val:150},
            strength: {lbl:'Strength',  min:-1, max:1 , step:0.05, val:0.5}
        },
        barrel : {
            barrelPower : {lbl:'Power', min:0 , max:2 , step:0.05, val:0.6}
        }
    };

    /* helper – create DOM for a single control */
    function createControl(key, cfg, optsObj){
        const wrap = document.createElement('div');
        wrap.className = 'mb-2';

        const id = `d-${key}`;
        const label = document.createElement('label');
        label.className = 'form-label small';
        label.textContent = cfg.lbl;
        label.setAttribute('for', id);
        wrap.appendChild(label);

        if(cfg.type==='select'){
            const sel=document.createElement('select');
            sel.id=id; sel.className='form-select form-select-sm';
            cfg.options.forEach(v=>{
                const o=document.createElement('option');
                o.value=v; o.textContent=v; sel.appendChild(o);
            });
            sel.value=cfg.val;
            sel.oninput=()=>{ optsObj[key]=sel.value; meshGradient.setDistortionStack([currentDistortion]); };
            wrap.appendChild(sel);
        }else{
            const input=document.createElement('input');
            input.type='range'; input.className='form-range';
            input.id=id;
            input.min=cfg.min; input.max=cfg.max; input.step=cfg.step; input.value=cfg.val;
            const span=document.createElement('small'); span.textContent=cfg.val;
            input.oninput=()=>{ span.textContent=input.value; optsObj[key]=Number(input.value); meshGradient.setDistortionStack([currentDistortion]); };
            wrap.appendChild(input); wrap.appendChild(span);
        }
        return wrap;
    }

    /* ------------------------------------------------------------------ */
    /* UI distortion section build logic                                  */
    /* ------------------------------------------------------------------ */
    let currentDistortion = {type:'none', opts:{}};

    function rebuildDistortionParams(type){
        distortionParams.innerHTML='';                          // clear
        distortionParams.classList.toggle('d-none', type==='none');

        currentDistortion = {type, opts:{}};

        if(type==='none'){ 
            const distortions = getDistortions();
            if (distortions && typeof distortions.setStack === 'function') {
                distortions.setStack([]);
            }
            return; 
        }

        /* get meta (object or factory) */
        const meta = typeof DISTORTION_META[type]==='function'
            ? DISTORTION_META[type]()          // dynamic
            : DISTORTION_META[type];

        Object.keys(meta).forEach(k=>{
            currentDistortion.opts[k]=meta[k].val;
            distortionParams.appendChild(createControl(k, meta[k], currentDistortion.opts));
        });

        const distortions = getDistortions();
        if (distortions && typeof distortions.setStack === 'function') {
            distortions.setStack([currentDistortion]);
        }
        editModeToggle.checked=false;
        editModeToggle.disabled=true;
    }

    /* ------------------------------------------------------------------ */
    /* hook select change                                                 */
    /* ------------------------------------------------------------------ */
    distortionTypeSelect.addEventListener('change', ()=> rebuildDistortionParams(distortionTypeSelect.value));

    /* ────────────────────────────────────────────────────────────── *
     *  Dynamic helpers for Twist – must be recomputed on resize     *
     * ────────────────────────────────────────────────────────────── */
    function buildTwistMeta() {
        const maxRad = Math.max(meshGradient.width, meshGradient.height);
        return {
            centerX  : {lbl:'Center X', min:0, max:1,  step:0.01, val:0.5},
            centerY  : {lbl:'Center Y', min:0, max:1,  step:0.01, val:0.5},
            /* Max‑angle slider in *turns* 0‑5 (step .1) */
            maxAngle : {lbl:'Max Angle (turns)', min:0, max:5,  step:0.1,  val:1},
            radius   : {lbl:'Radius px',         min:10, max:maxRad, step:1, val:Math.round(maxRad/2)}
        };
    }
}
