/* Sine wave distortion */
const DistortionWave = {
	/**
	 * opts: {direction:'horizontal'|'vertical', amplitude, frequency, time}
	 */
	apply(src, dstCtx, opts = {}) {
		const dir  = opts.direction ?? 'horizontal';
		const amp  = opts.amplitude ?? 20;          // px
		const freq = opts.frequency ?? 3;           // cycles over full canvas
		const t    = opts.time ?? 0;

		const w = src.width, h = src.height;
		const ctxSrc = src.getContext('2d');

		dstCtx.clearRect(0,0,w,h);

		if (dir === 'horizontal'){
			for(let y=0; y<h; y++){
				const offset = Math.sin(2*Math.PI*freq*y/h + t)*amp;
				dstCtx.drawImage(src,
					0, y, w, 1,                         // src 1‑pixel row
					offset, y, w, 1);                   // dest shifted
				// wrap right/left
				if (offset>0){
					dstCtx.drawImage(src, w-offset, y, offset, 1, 0, y, offset,1);
				}else if(offset<0){
					dstCtx.drawImage(src, 0, y, -offset,1, w+offset, y,-offset,1);
				}
			}
		}else{ // vertical
			for(let x=0; x<w; x++){
				const offset = Math.sin(2*Math.PI*freq*x/w + t)*amp;
				dstCtx.drawImage(src,
					x, 0, 1, h,
					x, offset, 1, h);
				if (offset>0){
					dstCtx.drawImage(src, x, h-offset, 1, offset, x, 0,1, offset);
				}else if(offset<0){
					dstCtx.drawImage(src, x, 0, 1, -offset, x, h+offset,1, -offset);
				}
			}
		}
	}
};
