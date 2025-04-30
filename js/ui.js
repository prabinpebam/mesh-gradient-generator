/**
 * UI Controller for the Mesh Gradient Generator
 */
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initialize gradient generator
    const meshGradient = new MeshGradient();
    
    // Initial UI setup
    function initUI() {
        // Get initial constraints
        const constraints = meshGradient.getConstraints();
        
        // Update cell count slider
        cellCountSlider.min = constraints.cells.min;
        cellCountSlider.max = constraints.cells.max;
        cellCountSlider.value = constraints.cells.current;
        cellCountValue.textContent = constraints.cells.current;
        minCellCount.textContent = constraints.cells.min;
        maxCellCount.textContent = constraints.cells.max;
        
        // Update blur amount slider - make sure we're using the actual calculated value
        const actualBlurValue = meshGradient.calculateDefaultBlurAmount();
        blurAmountSlider.min = 0;
        blurAmountSlider.max = constraints.blur.max;
        blurAmountSlider.value = actualBlurValue;
        blurAmountValue.textContent = actualBlurValue;
        maxBlurValue.textContent = constraints.blur.max;
        
        // Apply the correct blur amount to the gradient
        meshGradient.setBlurAmount(actualBlurValue);
        
        // Generate initial gradient
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
    resizeCanvasBtn.addEventListener('click', function() {
        const width = parseInt(canvasWidthInput.value);
        const height = parseInt(canvasHeightInput.value);
        
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            return;
        }
        
        // Resize and get updated constraints
        const newConstraints = meshGradient.resizeCanvas(width, height);
        
        // Get the updated constraints for the UI
        const constraints = meshGradient.getConstraints();
        
        // Update blur slider with new max and current values
        blurAmountSlider.min = constraints.blur.min;
        blurAmountSlider.max = constraints.blur.max;
        blurAmountSlider.value = constraints.blur.current;
        blurAmountValue.textContent = constraints.blur.current;
        maxBlurValue.textContent = constraints.blur.max;
        
        // Re-render gradient with new size
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
    
    // Initialize UI
    initUI();
});
