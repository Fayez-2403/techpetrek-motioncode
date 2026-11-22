// The selection sweep reconstructs the courier from a scan of the original portrait.
(() => {
  const W = 1080, H = 1920;
  const portrait = new Image();
  const fromScript = document.currentScript?.src;
  portrait.src = fromScript
    ? new URL('../public/driver/courier.webp', fromScript).href
    : 'public/driver/courier.webp';

  const dots = document.createElement('canvas');
  dots.width = W;
  dots.height = H;
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = x => { const u = clamp(x); return u * u * (3 - 2 * u); };

  function bakeScan() {
    const sample = document.createElement('canvas');
    sample.width = 216;
    sample.height = 384;
    const pixelContext = sample.getContext('2d', {willReadFrequently:true});
    pixelContext.drawImage(portrait, 0, 0, sample.width, sample.height);
    const rgba = pixelContext.getImageData(0, 0, sample.width, sample.height).data;
    const pen = dots.getContext('2d');
    const luminosity = i => (rgba[i] * .27 + rgba[i + 1] * .59 + rgba[i + 2] * .14) / 255;
    pen.fillStyle = '#041115';
    pen.fillRect(0, 0, W, H);
    for (let y = 1; y < sample.height - 1; y += 1) {
      for (let x = (y % 2) + 1; x < sample.width - 1; x += 2) {
        const i = (y * sample.width + x) * 4;
        const lum = luminosity(i);
        const edge = Math.abs(lum - luminosity(i - 4)) + Math.abs(lum - luminosity(i - sample.width * 4));
        if (lum < .035 && edge < .018) continue;
        const intensity = Math.min(1, .12 + 1.45 * lum + 2 * edge);
        const hot = rgba[i] - rgba[i + 2] > 43 && lum > .38;
        pen.fillStyle = hot ? 'rgba(255,180,88,' + intensity + ')' : 'rgba(151,234,219,' + intensity + ')';
        const radius = .55 + .9 * lum + Math.min(1.2, edge * 3);
        const dither = Math.sin(x * 125.31 + y * 11.31) * .9;
        pen.fillRect(x * 5 + dither, y * 5, radius * 1.7, radius * 1.3);
      }
    }
  }

  window.driverReady = portrait.decode().then(bakeScan);

  function rain(ctx,t) {
    ctx.save();
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 63; i++) {
      const x = (i * 139.51 + t * (12 + i % 23)) % (W + 40) - 20;
      const y = (i * 237.21 + t * (420 + (i * 43) % 530)) % (H + 90) - 90;
      ctx.strokeStyle = 'rgba(207,240,226,' + (.09 + .028 * (i % 5)) + ')';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12 + i % 19);
      ctx.stroke();
    }
    ctx.restore();
  }

  function trackHelmet(ctx,t) {
    const lock = smooth((t - .5) / .86);
    const alpha = smooth(t / .26) * (1 - .72 * smooth((t - 2.1) / .8));
    ctx.strokeStyle = 'rgba(245,193,99,' + alpha + ')';
    ctx.lineWidth = 2;
    const left = 231 + 24 * lock, top = 254 + 18 * lock;
    const right = 839 - 24 * lock, bottom = 874 - 18 * lock;
    for (const [x,y,sx,sy] of [[left,top,1,1],[right,top,-1,1],[right,bottom,-1,-1],[left,bottom,1,-1]]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * 26,y);
      ctx.lineTo(x,y);
      ctx.lineTo(x,y + sy * 26);
      ctx.stroke();
    }
  }

  window.paintDriver = function paintDriver(canvas,t) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = '#061316';
    ctx.fillRect(0, 0, W, H);
    if (!portrait.complete || !portrait.naturalWidth) { ctx.restore(); return; }
    const time = Math.max(0,t);
    const push = .995 + .053 * smooth(time / 4.5);
    ctx.translate(535, 610);
    ctx.scale(push,push);
    ctx.translate(-535,-610);
    ctx.drawImage(portrait, -5, -8, W + 10, H + 16);
    if (time < 1.43) {
      const y = -30 + (H + 100) * smooth(time / 1.43);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-10, y, W + 20, H + 20 - y);
      ctx.clip();
      ctx.globalAlpha = .84;
      ctx.drawImage(dots, -5, -8, W + 10, H + 16);
      ctx.restore();
      const band = ctx.createLinearGradient(0,y-23,0,y+53);
      band.addColorStop(0,'rgba(140,245,221,0)');
      band.addColorStop(.3,'rgba(171,255,220,.36)');
      band.addColorStop(.32,'rgba(143,249,218,.08)');
      band.addColorStop(1,'rgba(140,245,221,0)');
      ctx.fillStyle = band;
      ctx.fillRect(-10, y - 23, W + 20, 76);
    }
    trackHelmet(ctx,time);
    rain(ctx,time);
    ctx.restore();
  };
})();
