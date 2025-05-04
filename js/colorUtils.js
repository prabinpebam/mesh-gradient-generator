/**
 * Color utility functions
 */
(function() {
    /**
     * Convert HSL color values to a hex string
     */
    window.HSLToHex = function(h, s, l) {
        // Ensure parameters are numbers
        h = Number(h);
        s = Number(s);
        l = Number(l);
        
        // Convert s and l to the 0-1 range
        s /= 100;
        l /= 100;
        
        // Algorithm to convert HSL to RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (h >= 0 && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        // Convert RGB to hex
        const toHex = (value) => {
            const hex = Math.round((value + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    
    /**
     * Convert hex color to HSL values
     */
    window.hexToHSL = function(hex) {
        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        // Parse the hex value
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
        } else {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
        }
        
        // Find min and max RGB values
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Calculate HSL values
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            // Achromatic (grey)
            h = 0;
            s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            // Calculate hue
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            
            h *= 60;
        }
        
        // Convert to format used by MeshGradient
        return {
            h: Math.round(h),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };
    
    console.log("Color utility functions loaded");
})();
