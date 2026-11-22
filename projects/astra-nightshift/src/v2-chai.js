(() => {
  // Measured against the 478 × 850 framing guide of the generated stall plate.
  const W = 478, H = 850;
  const still = new Image();
  still.src = 'public/v2-chai/stall.webp';
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { const u = clamp(x); return u * u * (3 - 2 * u); };
  const TAU = Math.PI * 2;

  function hash(x, y) {
    const z = Math.sin(x * 43.87 + y * 97.13) * 27471.29;
    return z - Math.floor(z);
  }
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const u = ease(x - ix), v = ease(y - iy);
    const a = hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u;
    const b = hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u;
    return a * (1 - v) + b * v;
  }

  // An asymmetric, seamless-edged puff used at different phases and scales.
  const vapour = document.createElement('canvas');
  vapour.width = vapour.height = 120;
  function bakeVapour() {
    const c = vapour.getContext('2d');
    const pixels = c.createImageData(120, 120);
    for (let y = 0; y < 120; y++) {
      for (let x = 0; x < 120; x++) {
        const u = (x - 60) / 60, v = (y - 60) / 60;
        const radius = Math.hypot(u, v);
        const s = noise(4 * u + 12.1, 4 * v + 8.9);
        const billow = noise(6 * u + 2 * s, 6 * v + 2.6 * s);
        const detail = billow * 0.75 + noise(13 * u, 13 * v) * 0.25;
        const i = (y * 120 + x) * 4;
        pixels.data[i] = 242;
        pixels.data[i + 1] = 214;
        pixels.data[i + 2] = 177;
        pixels.data[i + 3] = 155 * (1 - ease((radius - 0.17) / 0.8)) * clamp((detail - 0.29) * 2.4);
      }
    }
    c.putImageData(pixels, 0, 0);
  }
  window.chaiV2Ready = still.decode().then(bakeVapour);

  function drawVapour(g, t) {
    g.save();
    g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
      const seed = hash(i, 84);
      const life = (i * 0.168 + t * (0.28 + seed * 0.06)) % 1;
      const x = 265 + (seed - 0.5) * (19 + life * 33)
        + 12 * Math.sin(life * 9.4 + seed * 2.4) * life;
      const y = 536 - life * (145 + seed * 21);
      g.save();
      g.globalAlpha = 0.48 * Math.sin(Math.PI * life);
      g.translate(x, y);
      g.rotate(Math.sin(life * 5.1 + i) * 0.6);
      const w = 13 + 34 * life;
      g.drawImage(vapour, -w / 2, -w * 0.68, w, w * 1.36);
      g.restore();
    }
    g.restore();
  }

  function fillGlass(g, progress) {
    // Move the photographed foam and meniscus; the glass walls stay in place.
    const lift = 12.5 * progress;
    const sx = still.naturalWidth / W, sy = still.naturalHeight / H;
    g.save();
    g.beginPath();
    g.moveTo(202.5, 532);
    g.lineTo(324.5, 532);
    g.lineTo(319.5, 582);
    g.lineTo(207.5, 582);
    g.closePath();
    g.clip();
    const strip = (sourceY, sourceHeight, y, height) => g.drawImage(
      still, 201 * sx, sourceY * sy, 126 * sx, sourceHeight * sy, 201, y, 126, height);
    strip(532, 11, 532, Math.max(0.2, 11 - lift * 0.75));
    strip(543, 29, 543 - lift * 0.75, 29 - lift * 0.25);
    strip(572, 10, 572 - lift, 10 + lift);
    g.restore();
  }

  // A falling fluid parcel traces a shallow ballistic arc as the kettle pours.
  const transit = 0.345;
  function strand(age, t, yEnd) {
    const time = t - age * transit;
    const ripple = Math.sin(time * 21.5) + 0.42 * Math.sin(time * 40.9 + 1.4);
    const pressure = Math.sqrt(ease((time - 0.14) / 0.32) * (1 - ease((time - 3.42) / 0.44)));
    const x = 275.3 + 20 * age + 3.1 * Math.sin(Math.PI * age) + age * ripple * 0.49;
    const y = 376 + (yEnd - 376) * (0.278 * age + 0.722 * age * age);
    const w = (2.7 + 1.6 * Math.sin(Math.PI * age) - 0.7 * age + 0.36 * ripple) * pressure;
    return {x, y, w};
  }
  function drawPour(g, t, level) {
    const low = clamp((t - 3.86) / transit);
    const high = clamp((t - 0.14) / transit);
    if (high <= low) return;
    const yEnd = 555 - 11 * level;
    const points = [];
    for (let i = 0; i <= 64; i++) points.push(strand(low + (high - low) * i / 64, t, yEnd));
    const band = (left, right, color) => {
      g.fillStyle = color;
      g.beginPath();
      points.forEach(({x, y, w}, i) => i ? g.lineTo(x + left * w, y) : g.moveTo(x + left * w, y));
      for (let i = points.length - 1; i >= 0; i--) {
        const {x, y, w} = points[i];
        g.lineTo(x + right * w, y);
      }
      g.closePath(); g.fill();
    };
    band(-1, 1, '#674021');
    band(-0.86, 0.77, '#b67743');
    band(-0.64, 0.46, '#ce9156');
    band(-0.30, 0.17, '#dfa874');
    band(0.62, 0.83, '#a36436');
    // Small bright folds travel with the liquid instead of sticking to the jet.
    g.save();
    g.lineCap = 'round';
    for (let i = 0; i < 17; i++) {
      const age = (i / 17 + t / transit) % 1;
      if (age < low || age + 0.018 > high) continue;
      const p = strand(age, t, yEnd);
      const q = strand(age + 0.018, t, yEnd);
      const offset = Math.sin(age * 20 + i) * 0.47;
      g.lineWidth = 0.43 + hash(i, 31) * 0.36;
      g.strokeStyle = 'rgba(255,215,156,' + (0.2 + 0.15 * Math.sin(age * Math.PI)) + ')';
      g.beginPath(); g.moveTo(p.x + p.w * offset, p.y);
      g.lineTo(q.x + q.w * offset, q.y); g.stroke();
    }
    g.restore();
    const impact = ease((t - 0.49) / 0.13) * (1 - ease((t - 3.94) / 0.29));
    if (impact <= 0) return;
    g.save();
    g.globalAlpha = impact;
    const at = points[points.length - 1].x;
    for (let i = 0; i < 4; i++) {
      const age = (t * 2.8 + i / 4) % 1;
      g.strokeStyle = 'rgba(245,195,131,' + (0.61 * (1 - age)) + ')';
      g.lineWidth = 0.61;
      g.beginPath(); g.ellipse(at - 2 * age, yEnd - 0.6, 2 + 15 * age, 0.6 + 1.6 * age, 0, 0, TAU); g.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const seed = hash(17, i), age = (t * (2.2 + seed) + i / 7) % 1;
      const spread = (seed - 0.5) * 19;
      g.fillStyle = 'rgba(238,177,110,' + 0.81 * Math.sin(Math.PI * age) + ')';
      g.beginPath();
      g.ellipse(at + spread * age, yEnd - (3.9 + seed * 5.5) * 4 * age * (1 - age), 0.55 + seed * 0.35, 0.7, 0, 0, TAU);
      g.fill();
    }
    g.restore();
  }

  function drawLaneRain(g, t) {
    g.save();
    g.beginPath(); g.rect(309, 155, 169, 294); g.clip();
    g.lineWidth = 0.6;
    for (let i = 0; i < 58; i++) {
      const seed = hash(i, 0.9);
      const x = 309 + 167 * hash(i, 0.4);
      const y = 140 + ((seed * 350 + t * (230 + 170 * seed)) % 340);
      g.strokeStyle = 'rgba(174,223,216,' + (0.10 + seed * 0.15) + ')';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y + 3 + 5 * seed); g.stroke();
    }
    g.restore();
  }
  window.paintChaiV2 = function paintChaiV2(canvas, seconds) {
    const g = canvas.getContext('2d'), t = Math.max(0, seconds);
    const zoom = 1.013 + ease(t / 4.4) * 0.047;
    const anchorX = 268, anchorY = 499;
    g.save();
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    g.translate(anchorX - anchorX * zoom, anchorY - anchorY * zoom);
    g.scale(zoom, zoom);
    g.drawImage(still, 0, 0, W, H);
    drawLaneRain(g, t);
    const level = ease((t - 0.49) / 3.35);
    fillGlass(g, level);
    drawVapour(g, t);
    drawPour(g, t, level);
    g.restore();
  };
})();
