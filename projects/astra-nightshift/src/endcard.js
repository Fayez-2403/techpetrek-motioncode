(() => {
  const paper = '#fff5e4';
  const amber = '#ffb64c';
  const mono = '"JetBrains Mono", monospace';
  const display = '"Archivo", Arial, sans-serif';
  const clamp = value => Math.max(0, Math.min(1, value));
  const settle = value => 1 - (1 - clamp(value)) ** 3;
  const firstLine = 'Build a rainy night drive';
  const secondLine = 'in Three.js.';

  function revealTitle(ctx, text, baseline, size, color, progress) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(90, baseline - size, 815, size * 1.16);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.font = `740 ${size}px ${display}`;
    ctx.letterSpacing = `${-size * 0.055}px`;
    ctx.fillText(text, 96, baseline + (1 - settle(progress)) * size * 1.16);
    ctx.restore();
  }

  function drawPrompt(ctx, t) {
    const entry = settle((t - 0.21) / 0.44);
    ctx.save();
    ctx.globalAlpha = entry;
    ctx.translate(0, (1 - entry) * 29);

    const panel = ctx.createLinearGradient(95, 0, 884, 0);
    panel.addColorStop(0, 'rgba(14,23,25,0.97)');
    panel.addColorStop(1, 'rgba(18,28,30,0.92)');
    ctx.fillStyle = panel;
    ctx.strokeStyle = 'rgba(205,226,220,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(96, 806, 772, 230, 9);
    ctx.fill();
    ctx.stroke();

    // A small terminal chevron separates the instruction from the editable words.
    ctx.strokeStyle = amber;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(127, 843);
    ctx.lineTo(134, 851);
    ctx.lineTo(127, 859);
    ctx.moveTo(139, 860);
    ctx.lineTo(152, 860);
    ctx.stroke();

    ctx.fillStyle = '#c6d9d3';
    ctx.font = `550 24px ${mono}`;
    ctx.letterSpacing = '2.8px';
    ctx.fillText('STARTER PROMPT', 173, 860);
    ctx.font = `500 42px ${mono}`;
    ctx.letterSpacing = '-1.2px';
    ctx.fillStyle = paper;
    const count = Math.floor((firstLine.length + 1 + secondLine.length) * clamp((t - 0.47) / 1.03));
    const lineOne = firstLine.slice(0, count);
    const lineTwo = secondLine.slice(0, Math.max(0, count - firstLine.length - 1));
    ctx.fillText(lineOne, 127, 932);
    ctx.fillText(lineTwo, 127, 992);
    const onSecondLine = count > firstLine.length;
    const current = onSecondLine ? lineTwo : lineOne;
    const cursorX = 135 + ctx.measureText(current).width;
    ctx.fillStyle = amber;
    ctx.globalAlpha = entry * (t < 1.55 ? 1 : 0.48 + 0.42 * Math.cos((t - 1.55) * 5.4));
    ctx.fillRect(cursorX, onSecondLine ? 960 : 900, 3, 38);
    ctx.restore();
  }

  window.paintEndcard = function paintEndcard(canvas, seconds) {
    const t = Math.max(0, seconds);
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(canvas.width / 1080, 0, 0, canvas.height / 1920, 0, 0);
    ctx.clearRect(0, 0, 1080, 1920);
    const scrim = ctx.createLinearGradient(0, 0, 0, 1580);
    const strength = 0.57 + 0.43 * settle(t / 0.48);
    scrim.addColorStop(0, `rgba(7,16,17,${0.61 * strength})`);
    scrim.addColorStop(0.28, `rgba(7,16,17,${0.85 * strength})`);
    scrim.addColorStop(0.48, `rgba(7,16,17,${0.83 * strength})`);
    scrim.addColorStop(0.7, `rgba(7,16,17,${0.37 * strength})`);
    scrim.addColorStop(1, 'rgba(7,16,17,0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, 1080, 1580);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    revealTitle(ctx, 'Try GPT-6.2', 518, 114, paper, (t + 0.03) / 0.45);
    revealTitle(ctx, 'Astra', 728, 240, amber, (t - 0.075) / 0.48);
    drawPrompt(ctx, t);
    ctx.restore();
  };
})();
