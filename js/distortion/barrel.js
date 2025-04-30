const DistortionBarrel = {
	/**
	 * opts: {barrelPower}
	 */
	apply(src, dstCtx, opts = {}) {
		const w=src.width, h=src.height;
		const pw=opts.barrelPower??0.6;             // 0..1

		const srcData=src.getContext('2d').getImageData(0,0,w,h).data;
		const out=dstCtx.createImageData(w,h);

		for(let y=0;y<h;y++){
			for(let x=0;x<w;x++){
				const nx=(x/w-0.5)*2, ny=(y/h-0.5)*2;        // -1..1
				const r=Math.sqrt(nx*nx+ny*ny);
				const factor = 1 + pw*r*r;
				const sx=((nx/factor)*0.5+0.5)*w;
				const sy=((ny/factor)*0.5+0.5)*h;
				const ix=Math.max(0,Math.min(w-1,sx|0));
				const iy=Math.max(0,Math.min(h-1,sy|0));
				const si=(iy*w+ix)*4, di=(y*w+x)*4;
				out.data.set(srcData.subarray(si,si+4), di);
			}
		}
		dstCtx.putImageData(out,0,0);
	}
};
