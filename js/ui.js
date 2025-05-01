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
        // This ensures real-time updates while dragging the slider
        meshGradient.generate({ 
            cellCount: count,
            keepColors: false  // Force complete regeneration with new cells
        });
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
            // Update immediately on input
            sel.oninput=()=>{ 
                optsObj[key]=sel.value; 
                meshGradient.setDistortionStack([currentDistortion]); 
            };
            wrap.appendChild(sel);
        }else{
            const input=document.createElement('input');
            input.type='range'; input.className='form-range';
            input.id=id;
            input.min=cfg.min; input.max=cfg.max; input.step=cfg.step; input.value=cfg.val;
            const span=document.createElement('small'); span.textContent=cfg.val;
            // Update immediately on input
            input.oninput=()=>{ 
                span.textContent=input.value; 
                optsObj[key]=Number(input.value); 
                meshGradient.setDistortionStack([currentDistortion]); 
            };
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
            
            // Immediately render without regenerating colors
            meshGradient.render(null, true);
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

/**
 * Adds five random color swatches to the swatches container
 */
function addRandomColorSwatches() {
  const swatchContainer = document.getElementById('colorSwatches');
  if (!swatchContainer) return;
  
  // Clear existing swatches
  swatchContainer.innerHTML = '';
  
  // Add 5 random color swatches
  for (let i = 0; i < 5; i++) {
    const color = generateRandomColor();
    const swatch = document.createElement('div');
    swatch.className = 'random-swatch';
    swatch.style.width = '40px';
    swatch.style.height = '40px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid #ccc';
    swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    swatch.style.borderRadius = '4px';
    swatch.style.cursor = 'pointer';
    swatch.title = 'Click to use this color';
    
    // Add click event to use this color in the gradient
    swatch.addEventListener('click', () => {
      if (window.meshGradient) {
        // If in edit mode and a cell is selected, apply to that cell
        if (document.getElementById('editModeToggle').checked && 
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
    
    swatchContainer.appendChild(swatch);
  }
}

// Update the window.addEventListener('load') event to call our new function
window.addEventListener('load', () => {
  // Add random color swatches
  addRandomColorSwatches();
  
  // Initial swatch update
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
 * Function to create and dispatch a custom event for color changes
 * @param {Object} details - Additional information about the color change
 */
function notifyColorChange(details = {}) {
  console.log('Canvas colors updated:', details);
  
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
  console.log(`Cell colors updated from: ${source}`);
  
  // Ensure meshGradient exists
  if (!window.meshGradient) {
    console.log("meshGradient not available yet - initialization in progress");
    return;
  }
  
  try {
    // Use the new unified method for getting colors
    if (typeof meshGradient.getAllColors === 'function') {
      const allColors = meshGradient.getAllColors();
      console.log(`Found ${allColors.length} colors in gradient:`, allColors);
      
      // Also log the cell count for comparison
      const cellCount = typeof meshGradient.getCellCount === 'function' ? 
          meshGradient.getCellCount() : 'unknown';
      console.log(`Current cell count: ${cellCount}`);
      return;
    }
    
    // Use the new unified method for getting colors if available
    if (typeof window.getMeshGradientColors === 'function') {
      const allColors = window.getMeshGradientColors();
      console.log(`Found ${allColors.length} colors using getMeshGradientColors():`, allColors);
      return;
    }
    
    // Use the class method if available
    if (typeof meshGradient.getAllColors === 'function') {
      const allColors = meshGradient.getAllColors();
      console.log(`Found ${allColors.length} colors using getAllColors():`, allColors);
      return;
    }
    
    // Fallback to the original implementation
    // Safely log keys with null check
    if (meshGradient) {
      console.log("MeshGradient structure keys:", Object.keys(meshGradient));
    }
    
    // Directly check for data in known possible locations
    let cells = [];
    
    // Try to get cells from various possible locations in the object structure
    if (meshGradient.data && meshGradient.data.cells) {
      console.log("Found cells in meshGradient.data.cells", meshGradient.data.cells.length);
      cells = meshGradient.data.cells;
    } else if (meshGradient.cells) {
      console.log("Found cells in meshGradient.cells", meshGradient.cells.length);
      cells = meshGradient.cells;
    } else if (meshGradient.renderer && meshGradient.renderer.cells) {
      console.log("Found cells in meshGradient.renderer.cells", meshGradient.renderer.cells.length);
      cells = meshGradient.renderer.cells;
    } else if (meshGradient.data && meshGradient.data.voronoi && meshGradient.data.voronoi.cells) {
      console.log("Found cells in meshGradient.data.voronoi.cells", meshGradient.data.voronoi.cells.length);
      cells = meshGradient.data.voronoi.cells;
    } else if (meshGradient.voronoi && meshGradient.voronoi.cells) {
      console.log("Found cells in meshGradient.voronoi.cells", meshGradient.voronoi.cells.length);
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
          console.warn(`Error getting color for cell ${i}:`, err);
        }
      }
      
      console.log(`Canvas contains ${cellColors.length} cells with colors:`, cellColors);
    } else {
      // If there are no cells found in any of the expected locations, try more aggressive inspection
      console.log("No cells found in standard locations. Checking deeper...");
      
      // Directly inspect the meshGradient object for color properties
      let colorProperties = [];
      
      // Check for color arrays directly on meshGradient
      if (meshGradient.colors && Array.isArray(meshGradient.colors)) {
        console.log("Found meshGradient.colors:", meshGradient.colors);
        colorProperties.push({
          source: "meshGradient.colors",
          colors: meshGradient.colors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
        });
      }
      
      if (meshGradient.currentColors && Array.isArray(meshGradient.currentColors)) {
        console.log("Found meshGradient.currentColors:", meshGradient.currentColors);
        colorProperties.push({
          source: "meshGradient.currentColors",
          colors: meshGradient.currentColors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
        });
      }
      
      // Check in data object
      if (meshGradient.data) {
        if (meshGradient.data.colors && Array.isArray(meshGradient.data.colors)) {
          console.log("Found meshGradient.data.colors:", meshGradient.data.colors);
          colorProperties.push({
            source: "meshGradient.data.colors",
            colors: meshGradient.data.colors.map(c => typeof c === 'string' ? c : (c && c.hex) || c)
          });
        }
        
        if (meshGradient.data.colorPalette) {
          console.log("Found meshGradient.data.colorPalette:", meshGradient.data.colorPalette);
          
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
        console.log("Found color collections:", colorProperties);
      } else {
        console.log("No cells available yet in the gradient");
      }
    }
  } catch (err) {
    console.error("Error logging cell colors:", err);
  }
}

/**
 * Update the color swatches based on the current colors in the gradient
 * This is the main implementation that should be used
 */
function updateSwatches() {
  if (!window.meshGradient) return;
  
  // Get the swatches container
  const swatchContainer = document.getElementById('colorSwatches');
  if (!swatchContainer) return;
  
  // Get all unique colors from the gradient
  const uniqueColors = [];
  
  try {
    // Use getAllColors method to get all colors properly
    if (typeof meshGradient.getAllColors === 'function') {
      const allColors = meshGradient.getAllColors();
      console.log(`Update swatches: Found ${allColors.length} unique colors in gradient`, allColors);
      
      allColors.forEach(color => {
        const hexColor = typeof color === 'string' ? color : (color && color.hex);
        if (hexColor && !uniqueColors.includes(hexColor)) {
          uniqueColors.push(hexColor);
        }
      });
    } 
    // Fallback to direct access to cells if getAllColors doesn't work
    else if (typeof meshGradient.getCellCount === 'function') {
      const cellCount = meshGradient.getCellCount();
      console.log(`Update swatches: Getting colors from ${cellCount} cells`);
      
      for (let i = 0; i < cellCount; i++) {
        try {
          const color = meshGradient.getCellColor(i);
          if (color && color.hex && !uniqueColors.includes(color.hex)) {
            uniqueColors.push(color.hex);
          }
        } catch (err) {
          console.warn(`Error getting color for cell ${i}:`, err);
        }
      }
    }
    // Other fallbacks as needed
    else {
      // Try to determine where cells are stored
      let cells = null;
      
      if (meshGradient.data && meshGradient.data.cells) {
        cells = meshGradient.data.cells;
      } else if (meshGradient.cells) {
        cells = meshGradient.cells;
      } else if (meshGradient.renderer && meshGradient.renderer.cells) {
        cells = meshGradient.renderer.cells;
      } else if (meshGradient.data && meshGradient.data.voronoi && meshGradient.data.voronoi.cells) {
        cells = meshGradient.data.voronoi.cells;
      } else if (meshGradient.voronoi && meshGradient.voronoi.cells) {
        cells = meshGradient.voronoi.cells;
      }
      
      if (cells && cells.length > 0) {
        for (let i = 0; i < cells.length; i++) {
          try {
            // Try standard getter first
            let cellColor = null;
            
            if (typeof meshGradient.getCellColor === 'function') {
              cellColor = meshGradient.getCellColor(i);
            } else if (cells[i] && cells[i].color) {
              cellColor = cells[i].color;
            }
            
            if (cellColor) {
              const hexColor = typeof cellColor === 'string' ? cellColor : (cellColor.hex || null);
              if (hexColor && !uniqueColors.includes(hexColor)) {
                uniqueColors.push(hexColor);
              }
            }
          } catch (err) {
            console.warn(`Error getting color for cell ${i} in updateSwatches:`, err);
          }
        }
      }
    }
    
    console.log(`Update swatches: Found ${uniqueColors.length} unique colors to display:`, uniqueColors);
    
    // Clear existing swatches
    swatchContainer.innerHTML = '';
    
    // Create flex wrap container for all swatches
    const swatchesWrapper = document.createElement('div');
    swatchesWrapper.style.display = 'flex';
    swatchesWrapper.style.flexWrap = 'wrap';
    swatchesWrapper.style.gap = '5px';
    swatchesWrapper.style.justifyContent = 'center';
    swatchesWrapper.style.maxHeight = '200px'; // Add max height
    swatchesWrapper.style.overflowY = 'auto'; // Add scroll if too many swatches
    swatchesWrapper.style.padding = '5px';
    
    // Create swatches for ALL unique colors - NO LIMIT
    uniqueColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.width = '25px'; // Make them smaller to fit more
      swatch.style.height = '25px';
      swatch.style.backgroundColor = color;
      swatch.style.border = '1px solid #ccc'; // Just a solid border, no dashed
      swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      swatch.style.borderRadius = '4px';
      swatch.style.cursor = 'pointer';
      swatch.title = color; // Show hex color on hover
      
      // Add click event to use this color
      swatch.addEventListener('click', () => {
        if (window.meshGradient) {
          // If in edit mode and a cell is selected, apply to that cell
          if (document.getElementById('editModeToggle').checked && 
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
    
    // Add the wrapper to the main container
    swatchContainer.appendChild(swatchesWrapper);
    
  } catch (err) {
    console.warn("Error getting colors for swatches:", err);
  }
}

// Add a listener for our new custom event
document.addEventListener('meshColorsAvailable', function(event) {
  console.log('meshColorsAvailable event received:', event.detail);
  
  if (event.detail && Array.isArray(event.detail.colors)) {
    console.log(`Custom event provided ${event.detail.colors.length} colors:`, 
      event.detail.colors.map(c => typeof c === 'string' ? c : (c && c.hex)));
    setTimeout(updateSwatches, 100);
  }
});

// Listen for meshColorsChanged event too, for backward compatibility
document.addEventListener('meshColorsChanged', function() {
  console.log('meshColorsChanged event received - updating swatches');
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
  
  console.log('MeshGradient color tracking enabled');
}

// Call this function after meshGradient is initialized
window.addEventListener('load', () => {
  // Wait a bit to ensure meshGradient is fully loaded
  setTimeout(patchMeshGradientForColorTracking, 1000);
});
