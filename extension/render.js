// Kreslí odznak a razítko na canvas písmem JetBrains Mono z rozšíření, takže vypadají
// stejně jako na webu bez ohledu na písma příjemce. Stejné rozměry jako badges/build.py.

const FONT_SIZE = 16, CH = 9.6, LINE = 19.2, BORDER = 2, SCALE = 2;
const FAMILY = `"JetBrains Mono"`;
const CAP = 0.73 * FONT_SIZE;                        // výška verzálek
const ASCENT = 1.02 * FONT_SIZE, DESCENT = 0.3 * FONT_SIZE;

const fontsReady = Promise.all([500, 800].map((w) => document.fonts.load(`${w} ${FONT_SIZE}px ${FAMILY}`)));

function canvas(w, h, fill) {
  const c = document.createElement("canvas");
  c.width = w * SCALE;
  c.height = h * SCALE;
  const ctx = c.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = BORDER;
  ctx.strokeRect(BORDER / 2, BORDER / 2, w - BORDER, h - BORDER);
  ctx.fillStyle = "#000";
  return [c, ctx];
}

// Zalomení po slovech na nejvýše `cols` znaků (monospace, takže znak = sloupec).
export function wrap(text, cols) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > cols) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Odznak: rámeček 158×42 s názvem úrovně, jako v ASCII diagramu na webu. */
export async function renderBadge(label) {
  await fontsReady;
  const w = Math.round(2 * BORDER + 16 * CH), h = Math.round(2 * BORDER + 2 * LINE);
  const [c, ctx] = canvas(w, h, "#fff");
  ctx.font = `500 ${FONT_SIZE}px ${FAMILY}`;
  ctx.fillText(label, BORDER + CH, h / 2 + CAP / 2);
  return c;
}

/** Razítko: šedý rámeček s tučným názvem a textem odpovědnosti zalomeným na `cols` znaků. */
export async function renderStamp(label, text, cols) {
  await fontsReady;
  const lines = wrap(`${label}  ${text}`, cols);
  const w = Math.round(2 * BORDER + (cols + 4) * CH);
  const h = Math.round(2 * BORDER + (lines.length + 2) * LINE);
  const [c, ctx] = canvas(w, h, "#eee");
  const x0 = BORDER + 2 * CH;
  const firstBaseline = BORDER + LINE + (LINE - ASCENT - DESCENT) / 2 + ASCENT;
  lines.forEach((line, i) => {
    const y = firstBaseline + i * LINE;
    if (i === 0) {
      ctx.font = `800 ${FONT_SIZE}px ${FAMILY}`;
      ctx.fillText(label, x0, y);
      ctx.font = `500 ${FONT_SIZE}px ${FAMILY}`;
      ctx.fillText(line.slice(label.length), x0 + label.length * CH, y);
    } else {
      ctx.fillText(line, x0, y);
    }
  });
  return c;
}

export const toBlob = (c) => new Promise((resolve) => c.toBlob(resolve, "image/png"));
export const cssSize = (c) => ({ width: c.width / SCALE, height: c.height / SCALE });
