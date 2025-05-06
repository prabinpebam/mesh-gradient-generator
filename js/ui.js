/**
 * Legacy UI controller - this will gradually be replaced by the modular UI system
 * For now, it initializes the modular system alongside the legacy code
 */

// Global meshGradient variable
let meshGradient;

/**
 * UI Controller for the Mesh Gradient Generator
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure MeshGradient is fully initialized
    setTimeout(() => {
        if (typeof MeshGradient === 'undefined') {
            // console.error("MeshGradient not found. Check script loading order.");
            return;
        }
        
        // Create the MeshGradient instance first
        try {
            meshGradient = new MeshGradient();
            
            // Initialize the modular UI system if the file is loaded
            if (typeof window.meshGradientUI !== 'undefined') {
                window.meshGradientUI.meshGradient = meshGradient;
                window.meshGradientUI.initialize();
            } else {
                initializeUI();
            }
        } catch (error) {
            // console.error('MeshGradient not found. Check script loading order.', error);
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

// Add this near the top of the file, after existing imports/setup

/**
 * Safe version of isPointInControl that works with both old and new APIs
 */
function safeIsPointInControl(x, y, control) {
    if (!window.meshGradient) return false;
    
    // First try renderer method (new API)
    if (meshGradient.renderer && typeof meshGradient.renderer.isPointInControl === 'function') {
        return meshGradient.renderer.isPointInControl(x, y, control, meshGradient.hoverControls);
    }
    
    // Then try direct method (current API)
    if (typeof meshGradient.isPointInControl === 'function') {
        return meshGradient.isPointInControl(x, y, control);
    }
    
    // Last resort - basic implementation
    if (!meshGradient.hoverControls) return false;
    const btn = meshGradient.hoverControls[control];
    if (!btn) return false;
    const dx = x - btn.x;
    const dy = y - btn.y;
    return (dx * dx + dy * dy) <= (btn.radius * btn.radius);
}

// Make it available globally just in case
window.safeIsPointInControl = safeIsPointInControl;

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

        // Select random color harmony on initial load
        selectRandomColorHarmony();

        // Initial render ---------------------
        meshGradient.generate();          // first render uses random harmony selected above
        meshGradient.setColorTheme(colorThemeSelect.value); // ensure synced

        // Make sure we're using the toolbar edit mode toggle
        document.getElementById('editModeToggle').addEventListener('change', function() {
            meshGradient.setEditMode(this.checked);
        });
    }

    // Helper function to select a random color harmony
    function selectRandomColorHarmony() {
        const harmonies = colorHarmonySelect.options;
        if (harmonies.length > 0) {
            const randomIndex = Math.floor(Math.random() * harmonies.length);
            colorHarmonySelect.selectedIndex = randomIndex;
            
            // Update the mesh gradient with the selected harmony
            const selectedHarmony = harmonies[randomIndex].value;
            meshGradient.setColorHarmony(selectedHarmony);
        }
    }
    
    // Generate button click - keep for compatibility but not needed for normal use
    generateBtn.addEventListener('click', function() {
        meshGradient.generate();
        notifyColorChange({ source: 'generate-button' });
    });
    
    // Cell count slider change - update immediately on input
    cellCountSlider.addEventListener('input', function() {
        const count = parseInt(this.value);
        cellCountValue.textContent = count;
        
        // Immediately generate new gradient with new cell count
        meshGradient.generate({ 
            cellCount: count,
            keepColors: false  // Force complete regeneration with new cells
        });
        
        // Use a short timeout to ensure colors are fully generated before updating swatches
        setTimeout(() => {
            // Force update swatches with latest colors from canvas
            updateSwatches();
            
            // Also notify about color change (for other components that might listen)
            notifyColorChange({ source: 'cell-count-change', cellCount: count });
        }, 10);
    });
    
    // Blur amount slider change - update immediately on input
    blurAmountSlider.addEventListener('input', function() {
        const amount = parseInt(this.value);
        blurAmountValue.textContent = amount;
        meshGradient.setBlurAmount(amount);
    });
    
    // Color harmony select change - update immediately
    colorHarmonySelect.addEventListener('change', function() {
        meshGradient.setColorHarmony(this.value);
        notifyColorChange({ source: 'harmony-change', harmony: this.value });
    });
    
    // Color theme select change - update immediately
    colorThemeSelect.addEventListener('change',()=>{
        meshGradient.setColorTheme(colorThemeSelect.value);
        notifyColorChange({ source: 'theme-change', theme: colorThemeSelect.value });
    });
    
    // HSL Adjustment Buttons - all update immediately
    document.getElementById('hueDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ hue: -10 }); // Decrease hue by 10 degrees
        notifyColorChange({ source: 'hue-decrease', adjustment: -10 });
    });
    
    document.getElementById('hueIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ hue: 10 }); // Increase hue by 10 degrees
        notifyColorChange({ source: 'hue-increase', adjustment: 10 });
    });
    
    document.getElementById('satDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ saturation: -5 }); // Decrease saturation by 5%
        notifyColorChange({ source: 'saturation-decrease', adjustment: -5 });
    });
    
    document.getElementById('satIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ saturation: 5 }); // Increase saturation by 5%
        notifyColorChange({ source: 'saturation-increase', adjustment: 5 });
    });
    
    document.getElementById('lightDecrease').addEventListener('click', function() {
        meshGradient.adjustColors({ lightness: -5 }); // Decrease lightness by 5%
        notifyColorChange({ source: 'lightness-decrease', adjustment: -5 });
    });
    
    document.getElementById('lightIncrease').addEventListener('click', function() {
        meshGradient.adjustColors({ lightness: 5 }); // Increase lightness by 5%
        notifyColorChange({ source: 'lightness-increase', adjustment: 5 });
    });
    
    // Edit mode toggle - updates immediately
    editModeToggle.addEventListener('change', function() {
        meshGradient.setEditMode(this.checked);
    });
    
    // Canvas resize - updates immediately
    canvasWidthInput.addEventListener('change', function() {
        applyCanvasResize();
    });
    
    canvasHeightInput.addEventListener('change', function() {
        applyCanvasResize();
    });
    
    // Keep the button for large changes, but also allow direct input changes
    resizeCanvasBtn.addEventListener('click', function() {
        applyCanvasResize();
    });
    
    // Helper function for consistent canvas resize behavior
    function applyCanvasResize() {
        const width = parseInt(canvasWidthInput.value);
        const height = parseInt(canvasHeightInput.value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            return;
        }

        const constraints = meshGradient.resizeCanvas(width, height); // fresh values

        // Reflect new blur limits
        blurAmountSlider.min = constraints.minBlurAmount ?? 0; // always 0
        blurAmountSlider.max = constraints.maxBlurAmount;
        blurAmountSlider.value = constraints.currentBlurAmount;
        blurAmountValue.textContent = constraints.currentBlurAmount;
        maxBlurValue.textContent = constraints.maxBlurAmount;

        // Re-render with updated canvas
        meshGradient.render();

        // If Twist is selected, rebuild its slider limits
        if (distortionTypeSelect.value === 'twist') {
            rebuildDistortionParams('twist');
        }
    }
    
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
        
        // For hover highlighting - this should not affect colors
        meshGradient.setHoverPosition(x, y);
        
        // Update button hover state
        meshGradient.updateButtonHover(x, y);
    });
    
    canvas.addEventListener('mouseup', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (!window.meshGradient) return;
        
        // Use the safe version for robust error handling
        if (safeIsPointInControl(x, y, 'colorBtn')) {
            // Color button was clicked
            const colorPicker = document.getElementById('cellColorPicker');
            if (colorPicker && meshGradient.hoverCellIndex >= 0) {
                const currentColor = meshGradient.getCellColor(meshGradient.hoverCellIndex);
                colorPicker.value = currentColor.hex;
                colorPicker.dataset.cellIndex = meshGradient.hoverCellIndex;
                colorPicker.click();
            }
        } else if (safeIsPointInControl(x, y, 'lockBtn')) {
            // Lock button was clicked
            if (meshGradient.hoverCellIndex >= 0) {
                const isLocked = meshGradient.isCellColorLocked(meshGradient.hoverCellIndex);
                if (isLocked) {
                    meshGradient.unlockCellColor(meshGradient.hoverCellIndex);
                } else {
                    meshGradient.lockCellColor(meshGradient.hoverCellIndex);
                }
            }
        } else if (meshGradient.dragSiteIndex !== -1) {
            // End drag operation
            meshGradient.endDrag();
        }
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
        
        if (type === 'none') {
            distortionParams.classList.add('d-none');
            const distortions = getDistortions();
            if (distortions && typeof distortions.setStack === 'function') {
                distortions.setStack([]);
            }
            editModeToggle.disabled = false;
        } else {
            distortionParams.classList.remove('d-none');
            
            // Create distortion options object
            const distortionOpts = {}; // defaults are inside each apply fn
            
            if (type === 'polar') {
                // Will extend with UI controls later
                distortionOpts.centerX = 0.5;
                distortionOpts.centerY = 0.5;
                distortionOpts.angleOffset = 0;
                distortionOpts.zoom = 1.0;
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
                if (safeIsPointInControl(x, y, 'colorBtn')) {
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
                else if (safeIsPointInControl(x, y, 'lockBtn')) {
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
            const isLocked = meshGradient.isCellColorLocked(selectedCellIndex);
            // Important: Pass true as third parameter to avoid color regeneration
            meshGradient.setCellColor(selectedCellIndex, e.target.value, isLocked);
        }
    });
    
    colorPicker.addEventListener('change', function(e) {
        if (selectedCellIndex >= 0) {
            // Final color selection - check if we should lock this color
            const isLocked = meshGradient.isCellColorLocked(selectedCellIndex);
            // Important: Pass true as third parameter to avoid color regeneration
            meshGradient.setCellColor(selectedCellIndex, e.target.value, isLocked);
            notifyColorChange({ 
                source: 'color-picker', 
                cellIndex: selectedCellIndex, 
                newColor: e.target.value,
                locked: isLocked
            });
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
            // Update immediately on input
            sel.oninput=()=>{ 
                optsObj[key]=sel.value; 
                // Update the distortion without regenerating colors
                applyDistortionNoColorChange(currentDistortion);
            };
            wrap.appendChild(sel);
        } else {
            const input=document.createElement('input');
            input.type='range'; input.className='form-range';
            input.id=id;
            input.min=cfg.min; input.max=cfg.max; input.step=cfg.step; input.value=cfg.val;
            const span=document.createElement('small'); span.textContent=cfg.val;
            // Update immediately on input
            input.oninput=()=>{ 
                span.textContent=input.value; 
                optsObj[key]=Number(input.value); 
                // Update the distortion without regenerating colors
                applyDistortionNoColorChange(currentDistortion);
            };
            wrap.appendChild(input); wrap.appendChild(span);
        }
        return wrap;
    }

    /* Helper function to apply distortion without regenerating colors */
    function applyDistortionNoColorChange(distortionConfig) {
        const distortions = getDistortions();
        if (distortions) {
            if (typeof distortions.setStack === 'function') {
                distortions.setStack([distortionConfig]);
            }
            // Use the preserveColors flag (true) to prevent color regeneration
            if (typeof meshGradient.render === 'function') {
                meshGradient.render(null, true);
            }
        }
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

        // Apply the initial distortion without regenerating colors
        applyDistortionNoColorChange(currentDistortion);
        
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

/**
 * Generates a random hex color
 * @returns {string} A random hex color code
 */
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Update the window.addEventListener('load') event to call our new function
window.addEventListener('load', () => {
  // Initial swatch update - only need this now
  setTimeout(updateSwatches, 500);
  
  // Add event listener to the "Generate new gradient" button to update swatches
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
        // This should trigger a full regeneration, no preserveColors
        meshGradient.generate();
        // Allow time for gradient to render
        setTimeout(updateSwatches, 100);
    });
  }
  
  // Update after color adjustment controls are used
  const adjustmentButtons = document.querySelectorAll('#hueIncrease, #hueDecrease, #satIncrease, #satDecrease, #lightIncrease, #lightDecrease');
  adjustmentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(updateSwatches, 100);
    });
  });
  
  // Update after theme or harmony changes
  document.getElementById('colorTheme')?.addEventListener('change', () => setTimeout(updateSwatches, 100));
  document.getElementById('colorHarmony')?.addEventListener('change', () => setTimeout(updateSwatches, 100));
});

/**
 * Update the color swatches based on the current colors in the gradient
 */
function updateSwatches() {
  try {
    // Defensive check - ensure meshGradient is available before proceeding
    if (!window.meshGradient) {
      // console.log("meshGradient not available yet, skipping swatch update");
      return;
    }
    
    // Get the swatches container
    const swatchContainer = document.getElementById('colorSwatches');
    if (!swatchContainer) return;
    
    /**
     * Custom function to style the color picker hover controls
     * This should be called after meshGradient is initialized
     */
    function setupColorPickerStyles() {
      // Check if meshGradient exposes a method for styling hover controls
      if (meshGradient && typeof meshGradient.setHoverControlStyles === 'function') {
        // Apply styles through the API (handles all modes)
        meshGradient.setHoverControlStyles({
          buttonBgOpacity: 0.3,      // 30% opacity for background
          pillBgOpacity: 0.3,        // 30% opacity for pill background
          borderWidth: 2,            // 2px border width
          useAdaptiveColor: true,    // Use white/black based on contrast
          pillBgColor: '#FFFFFF',    // Force white background for pill
          darkModePillBgColor: '#000000'  // Force black background for dark mode
        });
        
        // Also set edit mode styles if it has a separate API
        if (typeof meshGradient.setEditModeControlStyles === 'function') {
          meshGradient.setEditModeControlStyles({
            buttonBgOpacity: 0.3, 
            pillBgOpacity: 0.3,
            borderWidth: 2,
            useAdaptiveColor: true,
            pillBgColor: '#FFFFFF',    // Force white background for pill
            darkModePillBgColor: '#000000'  // Force black background for dark mode
          });
        }
        // console.log('Applied color picker styles via API for both hover and edit modes');
      } else {
        // Skip styling if the API doesn't exist - this is safer
        // console.log('Color picker styling API not available, using default styles');
      }
    }

    // Safely try to set up color picker styles
    try {
      setupColorPickerStyles();
    } catch (err) {
      // console.warn("Could not set up color picker styles:", err);
    }
    
    // Get all unique colors from the gradient
    const uniqueColors = [];
    
    try {
      // Try multiple approaches to get colors in order of reliability
      
      // Approach 1: Use getAllColors if available
      if (typeof meshGradient.getAllColors === 'function') {
        try {
          const allColors = meshGradient.getAllColors();
          if (allColors && allColors.length > 0) {
            allColors.forEach(color => {
              const hexColor = typeof color === 'string' ? color : (color && color.hex);
              if (hexColor && !uniqueColors.includes(hexColor)) {
                uniqueColors.push(hexColor);
              }
            });
          }
        } catch (err) {
          // console.warn("Error using getAllColors:", err);
        }
      }
      
      // Approach 2: Use data.currentColors directly if available
      if (uniqueColors.length === 0 && meshGradient.data && meshGradient.data.currentColors) {
        try {
          meshGradient.data.currentColors.forEach(color => {
            const hexColor = typeof color === 'string' ? color : (color && color.hex);
            if (hexColor && !uniqueColors.includes(hexColor)) {
              uniqueColors.push(hexColor);
            }
          });
        } catch (err) {
          // console.warn("Error using currentColors:", err);
        }
      }
      
      // Approach 3: Use getCellColor for each cell if available
      if (uniqueColors.length === 0 && typeof meshGradient.getCellColor === 'function') {
        try {
          // Get cell count first
          const cellCount = typeof meshGradient.getCellCount === 'function' ? 
              meshGradient.getCellCount() : 
              (meshGradient.data && meshGradient.data.cellCount ? meshGradient.data.cellCount : 5);
              
          for (let i = 0; i < cellCount; i++) {
            const color = meshGradient.getCellColor(i);
            if (color && color.hex && !uniqueColors.includes(color.hex)) {
              uniqueColors.push(color.hex);
            }
          }
        } catch (err) {
          // console.warn("Error using getCellColor:", err);
        }
      }
      
      // Approach 4: Last resort - use colorPalette's lastGeneratedColors
      if (uniqueColors.length === 0 && meshGradient.data && meshGradient.data.colorPalette && 
          meshGradient.data.colorPalette.lastGeneratedColors) {
        try {
          meshGradient.data.colorPalette.lastGeneratedColors.forEach(color => {
            const hexColor = typeof color === 'string' ? color : (color && color.hex);
            if (hexColor && !uniqueColors.includes(hexColor)) {
              uniqueColors.push(hexColor);
            }
          });
        } catch (err) {
          // console.warn("Error using lastGeneratedColors:", err);
        }
      }
      
      // If we still have no colors, use defaults
      if (uniqueColors.length === 0) {
        // Create some default colors so something is shown
        uniqueColors.push('#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6');
      }
      
      // Create a new wrapper element off-DOM to avoid reflows during construction
      const swatchesWrapper = document.createElement('div');
      swatchesWrapper.className = 'swatches-wrapper';
      
      // Create swatches for ALL unique colors
      uniqueColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color; // Keep this inline - it's dynamic
        swatch.title = color;
        
        // Add click event to use this color
        swatch.addEventListener('click', () => {
          if (window.meshGradient) {
            // If in edit mode and a cell is selected, apply to that cell
            if (document.getElementById('editModeToggle')?.checked && 
                meshGradient.hoverCellIndex >= 0) {
              meshGradient.setCellColor(meshGradient.hoverCellIndex, color);
            } else {
              // Otherwise use as base color for new gradient
              if (typeof meshGradient.setBaseColor === 'function') {
                meshGradient.setBaseColor(color);
                meshGradient.generate();
              }
            }
          }
        });
        
        swatchesWrapper.appendChild(swatch);
      });
      
      // Replace content in one operation to avoid multiple reflows
      swatchContainer.innerHTML = '';
      swatchContainer.appendChild(swatchesWrapper);
      
    } catch (err) {
      // console.warn("Error getting colors for swatches:", err);
    }
  } catch (outerErr) {
    // console.error("Critical error in updateSwatches:", outerErr);
  }
}

/**
 * Function to create and dispatch a custom event for color changes
 * @param {Object} details - Additional information about the color change
 */
function notifyColorChange(details = {}) {
  // console.log('Canvas colors updated:', details);
  
  // Create and dispatch a custom event
  const event = new CustomEvent('meshColorsChanged', { 
    detail: {
      timestamp: new Date().toISOString(),
      source: details.source || 'unknown',
      ...details
    }
  });
  document.dispatchEvent(event);
}

/**
 * Log all current cell colors to the console
 * @param {string} source - The source of the color change
 */
function logAllCellColors(source = 'unknown') {
  // console.log(`Cell colors updated from: ${source}`);
  
  // Ensure meshGradient exists
  if (!window.meshGradient) {
    // console.log("meshGradient not available yet - initialization in progress");
    return;
  }
  
  try {
    // Use the new unified method for getting colors
    if (typeof meshGradient.getAllColors === 'function') {
      const allColors = meshGradient.getAllColors();
      // console.log(`Found ${allColors.length} colors in gradient:`, allColors);
      
      // Also log the cell count for comparison
      const cellCount = typeof meshGradient.getCellCount === 'function' ? 
          meshGradient.getCellCount() : 'unknown';
      // console.log(`Current cell count: ${cellCount}`);
      return;
    }
    
    // Use the new unified method for getting colors if available
    if (typeof window.getMeshGradientColors === 'function') {
      const allColors = window.getMeshGradientColors();
      // console.log(`Found ${allColors.length} colors using getMeshGradientColors():`, allColors);
      return;
    }
    
    // Use the class method if available
    if (typeof meshGradient.getAllColors === 'function') {
      const allColors = meshGradient.getAllColors();
      // console.log(`Found ${allColors.length} colors using getAllColors():`, allColors);
      return;
    }
    
    // Fallback to the original implementation
    // Safely log keys with null check
    if (meshGradient) {
      // console.log("MeshGradient structure keys:", Object.keys(meshGradient));
    }
    
    // Directly check for data in known possible locations
    let cells = [];
    
    // Try to get cells from various possible locations in the object structure
    if (meshGradient.data && meshGradient.data.cells) {
      // console.log("Found cells in meshGradient.data.cells", meshGradient.data.cells.length);
      cells = meshGradient.data.cells;
    } else if (meshGradient.cells) {
      // console.log("Found cells in meshGradient.cells", meshGradient.cells.length);
      cells = meshGradient.cells;
    } else if (meshGradient.renderer && meshGradient.renderer.cells) {
      // console.log("Found cells in meshGradient.renderer.cells", meshGradient.renderer.cells.length);
      cells = meshGradient.renderer.cells;
    } else if (meshGradient.data && meshGradient.data.voronoi && meshGradient.data.voronoi.cells) {
      // console.log("Found cells in meshGradient.data.voronoi.cells", meshGradient.data.voronoi.cells.length);
      cells = meshGradient.data.voronoi.cells;
    } else if (meshGradient.voronoi && meshGradient.voronoi.cells) {
      // console.log("Found cells in meshGradient.voronoi.cells", meshGradient.voronoi.cells.length);
      cells = meshGradient.voronoi.cells;
    }
    
    // If we found cells, process them
    if (cells.length > 0) {
      const cellColors = [];
      
      for (let i = 0; i < cells.length; i++) {
        try {
          // Try the standard getter first
          let cellColor;
          if (typeof meshGradient.getCellColor === 'function') {
            cellColor = meshGradient.getCellColor(i);
          } else if (cells[i] && cells[i].color) {
            // Direct access if color is a property of the cell
            cellColor = cells[i].color;
          }
          
          if (cellColor) {
            cellColors.push({
              cellIndex: i,
              color: cellColor.hex || cellColor,
              hsl: cellColor.h !== undefined ? 
                `h:${Math.round(cellColor.h || 0)}, s:${Math.round(cellColor.s || 0)}%, l:${Math.round(cellColor.l || 0)}%` : 
                'N/A'
            });
          }
        } catch (err) {
          // console.warn(`Error getting color for cell ${i}:`, err);
        }
      }
      
      // console.log(`Canvas contains ${cellColors.length} cells with colors:`, cellColors);
    } else {
      // If there are no cells found in any of the expected locations, try more aggressive inspection
      // console.log("No cells found in standard locations. Checking deeper...");
      
      // Directly inspect the meshGradient object for color properties
      let colorProperties = [];
      
      // Check for color arrays directly on meshGradient
      if (meshGradient.colors && Array.isArray(meshGradient.colors)) {
        // console.log("Found meshGradient.colors:", meshGradient.colors);
        colorProperties.push({
          source: "meshGradient.colors",
          colors: meshGradient.colors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
        });
      }
      
      if (meshGradient.currentColors && Array.isArray(meshGradient.currentColors)) {
        // console.log("Found meshGradient.currentColors:", meshGradient.currentColors);
        colorProperties.push({
          source: "meshGradient.currentColors",
          colors: meshGradient.currentColors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
        });
      }
      
      // Check in data object
      if (meshGradient.data) {
        if (meshGradient.data.colors && Array.isArray(meshGradient.data.colors)) {
          // console.log("Found meshGradient.data.colors:", meshGradient.data.colors);
          colorProperties.push({
            source: "meshGradient.data.colors",
            colors: meshGradient.data.colors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
          });
        }
        if (meshGradient.data.colorPalette) {
          // console.log("Found meshGradient.data.colorPalette:", meshGradient.data.colorPalette);
          
          // Extract colors from the colorPalette object if it has lastGeneratedColors
          if (meshGradient.data.colorPalette.lastGeneratedColors && 
              Array.isArray(meshGradient.data.colorPalette.lastGeneratedColors)) {
            colorProperties.push({
              source: "meshGradient.data.colorPalette.lastGeneratedColors",
              colors: meshGradient.data.colorPalette.lastGeneratedColors.map(c => 
                typeof c === 'string' ? c : (c && c.hex) || c)
            });
          } else {
            // Otherwise just log the colorPalette as an object
            colorProperties.push({
              source: "meshGradient.data.colorPalette",
              colors: Array.isArray(meshGradient.data.colorPalette) ? 
                meshGradient.data.colorPalette.map(c => typeof c === 'string' ? c : (c && c.hex) || c) : 
                [meshGradient.data.colorPalette]
            });
          }
        }
      }
      
      if (colorProperties.length > 0) {
        // console.log("Found color collections:", colorProperties);
      } else {
        // console.log("No cells available yet in the gradient");
      }
    }
  } catch (err) {
    // console.error("Error logging cell colors:", err);
  }
}

// Add a listener for our new custom event
document.addEventListener('meshColorsAvailable', function(event) {
  // console.log('meshColorsAvailable event received:', event.detail);
  if (event.detail && Array.isArray(event.detail.colors)) {
    // console.log(`Custom event provided ${event.detail.colors.length} colors:`, 
    //   event.detail.colors.map(c => typeof c === 'string' ? c : (c && c.hex)));
    setTimeout(updateSwatches, 100);
  }
});

// Listen for meshColorsChanged event too, for backward compatibility
document.addEventListener('meshColorsChanged', function() {
  // console.log('meshColorsChanged event received - updating swatches');
  updateSwatches();
});

// Patch MeshGradient to hook into global color changes
function patchMeshGradientForColorTracking() {
  if (!window.meshGradient) return;
  
  // Save original methods
  const originalGenerate = meshGradient.generate;
  const originalSetCellColor = meshGradient.setCellColor;
  const originalAdjustColors = meshGradient.adjustColors;
  
  // Override generate method
  meshGradient.generate = function(...args) {
    const result = originalGenerate.apply(this, args);
    notifyColorChange({ source: 'generate-method' });
    return result;
  };
  
  // Override setCellColor method
  meshGradient.setCellColor = function(cellIndex, color, locked, ...rest) {
    const result = originalSetCellColor.apply(this, [cellIndex, color, locked, ...rest]);
    notifyColorChange({ 
      source: 'set-cell-color', 
      cellIndex: cellIndex,
      newColor: color,
      locked: locked
    });
    return result;
  };
  
  // Override adjustColors method
  meshGradient.adjustColors = function(adjustments, ...rest) {
    const result = originalAdjustColors.apply(this, [adjustments, ...rest]);
    notifyColorChange({ 
      source: 'adjust-colors', 
      adjustments: adjustments 
    });
    return result;
  };
  
  // console.log('MeshGradient color tracking enabled');
}

// Call this function after meshGradient is initialized
window.addEventListener('load', () => {
  // Wait a bit to ensure meshGradient is fully loaded
  setTimeout(patchMeshGradientForColorTracking, 1000);
});
