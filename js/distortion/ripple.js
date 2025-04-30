/* Radial ripple distortion */
const DistortionRipple = {
	/**
	 * opts: {centerX, centerY, amplitude, frequency, time}
	 * centre coords in 0‑1 space
	 */
	apply(src, dstCtx, opts = {}) {
		const w = src.width, h = src.height;
		const cx = (opts.centerX ?? 0.5) * w;
		const cy = (opts.centerY ?? 0.5) * h;
		const amp = opts.amplitude ?? 10;          // px
		const freq = opts.frequency ?? 12;         // waves per 1000px
		const t = opts.time ?? 0;

		const srcData = src.getContext('2d').getImageData(0,0,w,h).data;
		const outImg  = dstCtx.createImageData(w,h);

		const k = (2*Math.PI*freq)/1000;

		for (let y=0; y<h; y++){
			for (let x=0; x<w; x++){
				const dx = x-cx,  dy = y-cy;
				const r  = Math.sqrt(dx*dx+dy*dy);
				const disp = Math.sin(k*r - t)*amp;   // radial offset
				const nx = x + (dx/r||0)*disp;
				const ny = y + (dy/r||0)*disp;

				// clamp
				const ix = Math.max(0,Math.min(w-1, nx|0));
				const iy = Math.max(0,Math.min(h-1, ny|0));
				const si = (iy*w+ix)*4;
				const di = (y*w+x)*4;
				outImg.data[di]   = srcData[si];
				outImg.data[di+1] = srcData[si+1];
				outImg.data[di+2] = srcData[si+2];
				outImg.data[di+3] = 255;
			}
		}
		dstCtx.putImageData(outImg,0,0);
	}
};
