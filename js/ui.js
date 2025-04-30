/**
 * UI Controller for the Mesh Gradient Generator
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("UI initializing...");
    
    // Elements
    const canvas = document.getElementById('gradientCanvas');
    const generateBtn = document.getElementById('generateBtn');
    const cellCountSlider = document.getElementById('cellCount');
    const cellCountValue = document.getElementById('cellCountValue');
    const minCellCount = document.getElementById('minCellCount');
    const maxCellCount = document.getElementById('maxCellCount');
    const blurAmountSlider = document.getElementById('blurAmount');
    const blurAmountValue = document.getElementById('blurAmountValue');
    const maxBlurValue = document.getElementById('maxBlurValue');
    const colorHarmonySelect = document.getElementById('colorHarmony');
    const editModeToggle = document.getElementById('editModeToggle');
    const exportPngBtn = document.getElementById('exportPngBtn');
    const canvasWidthInput = document.getElementById('canvasWidth');
    const canvasHeightInput = document.getElementById('canvasHeight');
    const resizeCanvasBtn = document.getElementById('resizeCanvas');
    const distortionSelect = document.getElementById('distortionType');
    const distortionParams = document.getElementById('distortionParams');
    
    // Initialize gradient generator
    const meshGradient = new MeshGradient();
    
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
        meshGradient.generate();
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
        meshGradient.drag(x, y);
    });
    
    canvas.addEventListener('mouseup', function() {
        meshGradient.endDrag();
    });
    
    canvas.addEventListener('mouseleave', function() {
        meshGradient.endDrag();
    });
    
    // Distortion type change
    distortionSelect.addEventListener('change', function() {
        const type = distortionSelect.value;
        console.log("Distortion selected:", type);
        
        if (type === 'none') {
            console.log("Disabling distortion");
            distortionParams.classList.add('d-none');
            meshGradient.setDistortionStack([]);
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
            
            meshGradient.setDistortionStack([{ 
                type: type, 
                opts: distortionOpts 
            }]);
            
            // Disable edit mode when distortion active
            editModeToggle.checked = false;
            editModeToggle.disabled = true;
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
        twist  : {
            centerX : {lbl:'Center X', min:0 , max:1, step:0.01, val:0.5},
            centerY : {lbl:'Center Y', min:0 , max:1, step:0.01, val:0.5},
            maxAngle: {lbl:'Max Angle °', min:0 , max:720, step:1, val:180},
            radius  : {lbl:'Radius px',  min:10, max:600, step:1, val:200}
        },
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

        if(type==='none'){ meshGradient.setDistortionStack([]); return; }

        const meta=DISTORTION_META[type];
        Object.keys(meta).forEach(k=>{
            currentDistortion.opts[k]=meta[k].val;
            distortionParams.appendChild(createControl(k, meta[k], currentDistortion.opts));
        });

        meshGradient.setDistortionStack([currentDistortion]);
        editModeToggle.checked=false;
        editModeToggle.disabled=true;
    }

    /* ------------------------------------------------------------------ */
    /* hook select change                                                 */
    /* ------------------------------------------------------------------ */
    distortionSelect.addEventListener('change', ()=> rebuildDistortionParams(distortionSelect.value));
});
