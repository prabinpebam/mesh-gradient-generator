/**
 * Hue Animation Controls for MeshGradient
 * Adds UI controls for the hue animation feature
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for meshGradient to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    function initHueAnimationControls() {
        if (attempts >= maxAttempts) {
            console.warn('Failed to initialize hue animation controls - too many attempts');
            return;
        }
        
        if (!window.meshGradient) {
            attempts++;
            setTimeout(initHueAnimationControls, 100);
            return;
        }
        
        console.log('Initializing hue animation controls...');
        
        // Setup UI controls
        setupControls();
    }
    
    function setupControls() {
        // Get hue animation parameters div
        const hueAnimParams = document.getElementById('hueAnimationParameters');
        
        // Initially hide animation parameters
        if (hueAnimParams) {
            hueAnimParams.style.display = 'none';
        }
        
        // Animation toggle
        const hueAnimToggle = document.getElementById('hueAnimationToggle');
        if (hueAnimToggle) {
            // Ensure correct initial state
            hueAnimToggle.checked = false;
            
            hueAnimToggle.addEventListener('change', (e) => {
                console.log(`[DEBUG] Hue animation toggle changed: ${e.target.checked}`);
                
                // Show/hide parameters based on toggle state
                if (hueAnimParams) {
                    hueAnimParams.style.display = e.target.checked ? 'block' : 'none';
                    
                    // Add smooth transition for better UX
                    if (e.target.checked) {
                        hueAnimParams.classList.add('animation-params-visible');
                    } else {
                        hueAnimParams.classList.remove('animation-params-visible');
                    }
                }
                
                // Check if required methods exist
                if (typeof meshGradient.toggleHueAnimation !== 'function') {
                    console.error('[ERROR] meshGradient.toggleHueAnimation function not found!');
                    return;
                }
                
                // Call animation toggle method
                try {
                    const result = meshGradient.toggleHueAnimation(e.target.checked);
                    console.log(`[DEBUG] toggleHueAnimation returned: ${result}`);
                } catch (err) {
                    console.error('[ERROR] Error calling toggleHueAnimation:', err);
                }
            });
        } else {
            console.error('[ERROR] Hue animation toggle element not found in DOM!');
        }
        
        // Setup speed slider
        const speedSlider = document.getElementById('hueSpeed');
        const speedValueDisplay = document.getElementById('hueSpeedValue');
        
        if (speedSlider && speedValueDisplay) {
            // Set initial value
            speedValueDisplay.textContent = speedSlider.value;
            
            // Add event listener
            speedSlider.addEventListener('input', () => {
                const speed = parseInt(speedSlider.value, 10);
                speedValueDisplay.textContent = speed;
                
                if (meshGradient && typeof meshGradient.setHueAnimationParams === 'function') {
                    meshGradient.setHueAnimationParams({ speed });
                }
            });
        }
        
        // Setup direction radio buttons
        const clockwiseRadio = document.getElementById('hueDirectionClockwise');
        const counterClockwiseRadio = document.getElementById('hueDirectionCounter');
        
        if (clockwiseRadio && counterClockwiseRadio) {
            // Set default direction
            counterClockwiseRadio.checked = true;
            
            const handleDirectionChange = () => {
                const direction = clockwiseRadio.checked;
                
                if (meshGradient && typeof meshGradient.setHueAnimationParams === 'function') {
                    meshGradient.setHueAnimationParams({ direction });
                }
            };
            
            clockwiseRadio.addEventListener('change', handleDirectionChange);
            counterClockwiseRadio.addEventListener('change', handleDirectionChange);
        }
        
        console.log('Hue animation controls initialized');
    }
    
    // Start initialization after DOM loaded
    setTimeout(initHueAnimationControls, 300);
});
