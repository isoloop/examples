// Timeline tracks for the X header: ticks streaming out of the mark, fading
// to the left; one stretch hatched, as in the site's recording.
const svg = document.querySelector('.x .tracks');
const colours = ['#4cc6d3', '#8aa5ff', '#b79af6', '#4cc6d3', '#8aa5ff'];
let out =
  '<defs><linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="m"><rect width="1080" height="220" fill="url(#fade)"/></mask>';
out +=
  '<pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="8" fill="#b79af6"/></pattern></defs><g mask="url(#m)">';
let seed = 7;
const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
colours.forEach((c, i) => {
  const y = 24 + i * 43;
  out += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="${c}" stroke-opacity=".28" stroke-width="1.5"/>`;
  for (let x = 6; x < 1074; x += 14 + rnd() * 26) {
    if (i === 2 && x > 640 && x < 760) continue;
    const h = 8 + rnd() * 14;
    out += `<rect x="${x.toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="3" height="${h.toFixed(1)}" rx="1.5" fill="${c}"/>`;
  }
  if (i === 2)
    out += `<rect x="644" y="${y - 10}" width="112" height="20" rx="3" fill="url(#h)" stroke="#b79af6" stroke-width="1.5"/>`;
});
svg.innerHTML = out + '</g>';
