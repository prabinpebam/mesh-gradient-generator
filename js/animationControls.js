/**
 * Animation Controls for MeshGradient
 * Adds UI controls for the cell animation feature
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for meshGradient to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    function initAnimationControls() {
        if (attempts >= maxAttempts) {
            console.warn('Failed to initialize animation controls - too many attempts');
            return;
        }
        
        if (!window.meshGradient) {
            attempts++;
            setTimeout(initAnimationControls, 100);
            return;
        }
        
        console.log('Initializing Voronoi cell animation controls...');
        
        // Ensure animation object exists
        if (!meshGradient.animation) {
            console.warn('Animation object missing - adding basic structure');
            meshGradient.animation = {
                active: false,
                frameId: null,
                params: {
                    forceStrength: 0.12,
                    damping: 0.92,
                    maxSpeed: 3,
                    wanderJitter: 0.3,
                    wanderWeight: 0.25,
                    arrivalThres: 30,
                    minTurnAngle: 45 * Math.PI/180
                }
            };
        }
        
        // Ensure animation methods exist
        if (typeof meshGradient.initAnimation !== 'function' && 
            typeof meshGradient.initAnimationProperties === 'function') {
            // Fix: Add fallback initAnimation method
            meshGradient.initAnimation = function() {
                console.log("[ANIMATION] Fallback initAnimation called");
                // Basic initialization using the existing initAnimationProperties
                this.initAnimationProperties();
                return this.animation;
            };
        }
        
        // Setup UI controls
        setupControls();
    }
    
    function setupControls() {
        // Animation toggle
        const animationToggle = document.getElementById('animationToggle');
        if (animationToggle) {
            animationToggle.addEventListener('change', (e) => {
                console.log(`[DEBUG] Animation toggle changed: ${e.target.checked}`);
                
                // Check if required methods exist
                if (typeof meshGradient.toggleCellAnimation !== 'function') {
                    console.error('[ERROR] meshGradient.toggleCellAnimation function not found!');
                    return;
                }
                
                // Call animation toggle method
                try {
                    // Fix: Ensure animation sites are initialized first
                    if (e.target.checked && 
                        (!meshGradient.animation.sites || meshGradient.animation.sites.length === 0) && 
                        typeof meshGradient.initAnimationProperties === 'function') {
                        console.log('[DEBUG] Initializing animation properties before toggle');
                        meshGradient.initAnimationProperties();
                    }
                    
                    const result = meshGradient.toggleCellAnimation(e.target.checked);
                    console.log(`[DEBUG] toggleCellAnimation returned: ${result}`);
                } catch (err) {
                    console.error('[ERROR] Error calling toggleCellAnimation:', err);
                }
            });
        } else {
            console.error('[ERROR] Animation toggle element not found in DOM!');
        }
        
        // Setup parameter sliders
        setupSlider('forceStrength', 'forceStrengthValue', v => v.toFixed(2));
        setupSlider('damping', 'dampingValue', v => v.toFixed(2));
        setupSlider('maxSpeed', 'maxSpeedValue', v => v.toFixed(1));
        setupSlider('wanderJitter', 'wanderJitterValue', v => v.toFixed(2));
        setupSlider('wanderWeight', 'wanderWeightValue', v => v.toFixed(2));
        setupSlider('arrivalThres', 'arrivalThresValue', v => v.toFixed(0));
        setupSlider('minTurnAngle', 'minTurnAngleValue', v => v.toFixed(0));
        
        console.log('Animation controls initialized successfully');
    }
    
    function setupSlider(sliderId, valueId, formatter = (v => v.toString())) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (slider && valueDisplay) {
            // Set initial value
            valueDisplay.textContent = formatter(parseFloat(slider.value));
            
            // Add event listener
            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                valueDisplay.textContent = formatter(value);
                
                // Update animation parameter if method exists
                if (meshGradient && typeof meshGradient.setAnimationParam === 'function') {
                    try {
                        meshGradient.setAnimationParam(sliderId, value);
                    } catch (err) {
                        console.error(`[ERROR] Error setting animation param ${sliderId}:`, err);
                    }
                } else if (meshGradient && meshGradient.animation && meshGradient.animation.params) {
                    // Fix: Direct update of parameters if method doesn't exist
                    meshGradient.animation.params[sliderId] = 
                        sliderId === 'minTurnAngle' ? value * Math.PI/180 : value;
                    console.log(`[DEBUG] Directly set ${sliderId} = ${value}`);
                } else {
                    console.warn(`[WARNING] Cannot update parameter: ${sliderId}`);
                }
            });
        } else {
            console.warn(`[WARNING] Could not find UI elements for slider: ${sliderId}`);
        }
    }
    
    // Start initialization after DOM loaded
    setTimeout(initAnimationControls, 300);
});
