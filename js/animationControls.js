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
        
        // Setup UI controls
        setupControls();
    }
    
    function setupControls() {
        // Get animation parameters div
        const animationParams = document.getElementById('animationParameters');
        
        // Initially hide animation parameters
        if (animationParams) {
            animationParams.style.display = 'none';
        }
        
        // Animation toggle
        const animationToggle = document.getElementById('animationToggle');
        if (animationToggle) {
            // Ensure correct initial state
            animationToggle.checked = false;
            
            animationToggle.addEventListener('change', (e) => {
                console.log(`[DEBUG] Animation toggle changed: ${e.target.checked}`);
                
                // Show/hide parameters based on toggle state
                if (animationParams) {
                    animationParams.style.display = e.target.checked ? 'block' : 'none';
                    
                    // Add smooth transition for better UX
                    if (e.target.checked) {
                        animationParams.classList.add('animation-params-visible');
                    } else {
                        animationParams.classList.remove('animation-params-visible');
                    }
                }
                
                // Check if required methods exist
                if (typeof meshGradient.toggleCellAnimation !== 'function') {
                    console.error('[ERROR] meshGradient.toggleCellAnimation function not found!');
                    return;
                }
                
                // Call animation toggle method
                try {
                    const result = meshGradient.toggleCellAnimation(e.target.checked);
                    console.log(`[DEBUG] toggleCellAnimation returned: ${result}`);
                } catch (err) {
                    console.error('[ERROR] Error calling toggleCellAnimation:', err);
                }
            });
        } else {
            console.error('[ERROR] Animation toggle element not found in DOM!');
        }
        
        // Setup parameter sliders that are still in the UI
        setupSlider('forceStrength', 'forceStrengthValue', v => v.toFixed(2));
        setupSlider('damping', 'dampingValue', v => v.toFixed(2));
        setupSlider('maxSpeed', 'maxSpeedValue', v => v.toFixed(1));
        
        // Set default values for removed sliders
        setDefaultAnimationParam('wanderJitter', 0.3);
        setDefaultAnimationParam('wanderWeight', 0.25);
        setDefaultAnimationParam('arrivalThres', 30);
        setDefaultAnimationParam('minTurnAngle', 45, true); // true = convert to radians
        
        console.log('Animation controls initialized with simplified UI');
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
    
    /**
     * Set default value for animation parameter that's no longer in UI
     */
    function setDefaultAnimationParam(paramName, value, convertToRadians = false) {
        if (meshGradient && typeof meshGradient.setAnimationParam === 'function') {
            try {
                const finalValue = convertToRadians ? value * Math.PI/180 : value;
                meshGradient.setAnimationParam(paramName, finalValue);
                console.log(`[DEBUG] Set default ${paramName} = ${finalValue}`);
            } catch (err) {
                console.error(`[ERROR] Error setting default for ${paramName}:`, err);
            }
        } else if (meshGradient && meshGradient.animation && meshGradient.animation.params) {
            // Direct update of parameters if method doesn't exist
            meshGradient.animation.params[paramName] = 
                convertToRadians ? value * Math.PI/180 : value;
            console.log(`[DEBUG] Directly set default ${paramName} = ${value}`);
        } else {
            console.warn(`[WARNING] Cannot set default for parameter: ${paramName}`);
        }
    }
    
    // Start initialization after DOM loaded
    setTimeout(initAnimationControls, 300);
});
