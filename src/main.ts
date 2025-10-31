// Yahir Rico
import "./style.css";

const app = document.createElement("div");
app.style.display = "flex";
app.style.flexDirection = "column";
app.style.alignItems = "center";
app.style.justifyContent = "center";
app.style.gap = "16px";
app.style.height = "100vh";
document.body.append(app);

const title = document.createElement("h1");
title.textContent = "🐱Catvas🐱";
title.style.fontFamily = "Comic Sans MS, sans-serif";
title.style.color = "#333";
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchpad"; 
canvas.style.cursor = "none";
canvas.style.backgroundColor = "#fffdf9";
app.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements Command {
  private points: { x: number; y: number }[] = [];
  constructor(startX: number, startY: number, private thickness: number, private color: string) {
    this.points.push({ x: startX, y: startY });
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.thickness;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}

class MarkerPreview implements Command {
  constructor(public x: number, public y: number, private thickness: number, private color: string) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class StickerCommand implements Command {
  constructor(public emoji: string, public x: number, public y: number, private size: number, private rotation: number) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = `${this.size}px serif`;
    ctx.fillText(this.emoji, -this.size / 2, this.size / 2);
    ctx.restore();
  }
}

class StickerPreview implements Command {
  constructor(public emoji: string, public x: number, public y: number, private size: number, private rotation: number) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = 0.5;
    ctx.font = `${this.size}px serif`;
    ctx.fillText(this.emoji, -this.size / 2, this.size / 2);
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}

let displayList: Command[] = [];
let redoStack: Command[] = [];
let currentLine: MarkerLine | null = null;
let currentPreview: Command | null = null;

type ToolType = "marker" | "sticker";
let activeTool: ToolType = "marker";
let activeThickness = 3;
let hue = 0;
let activeSticker: string | null = null;
const stickerSize = 28;
let stickerRotation = 0;

const stickers = ["🐱", "🐾", "🧶", "🍣"];

canvas.addEventListener("mousedown", (e) => {
  if (activeTool === "marker") {
    const color = `hsl(${hue}, 100%, 35%)`;
    currentLine = new MarkerLine(e.offsetX, e.offsetY, activeThickness, color);
    displayList.push(currentLine);
  } else if (activeTool === "sticker" && activeSticker) {
    const cmd = new StickerCommand(activeSticker, e.offsetX, e.offsetY, stickerSize, stickerRotation);
    displayList.push(cmd);
  }
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
  }

  if (activeTool === "marker") {
    const color = `hsl(${hue}, 100%, 35%)`;
    currentPreview = new MarkerPreview(e.offsetX, e.offsetY, activeThickness, color);
  } else if (activeTool === "sticker" && activeSticker) {
    currentPreview = new StickerPreview(activeSticker, e.offsetX, e.offsetY, stickerSize, stickerRotation);
  } else {
    currentPreview = null;
  }

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.fillStyle = "#fffdf9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const cmd of displayList) {
    cmd.display(ctx);
  }
  if (currentPreview) {
    currentPreview.display(ctx);
  }
});

const buttonPanel = document.createElement("div");
buttonPanel.style.display = "flex";
buttonPanel.style.gap = "8px";
app.append(buttonPanel);

function makeButton(label: string, onClick: () => void) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.padding = "6px 12px";
  btn.style.borderRadius = "6px";
  btn.style.border = "1px solid #888";
  btn.style.cursor = "pointer";
  btn.addEventListener("click", onClick);
  buttonPanel.append(btn);
  return btn;
}

makeButton("🧼 Clear", () => {
  displayList = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

makeButton("↩ Undo", () => {
  if (displayList.length > 0) {
    redoStack.push(displayList.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

makeButton("↪ Redo", () => {
  if (redoStack.length > 0) {
    displayList.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

makeButton("💾 Export", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.fillStyle = "#fffdf9";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.scale(4, 4);
  for (const cmd of displayList) {
    cmd.display(exportCtx);
  }
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "cat_canvas_deluxe.png";
  anchor.click();
});

const toolPanel = document.createElement("div");
toolPanel.style.display = "flex";
toolPanel.style.flexWrap = "wrap";
toolPanel.style.justifyContent = "center";
toolPanel.style.gap = "8px";
app.append(toolPanel);

makeButton("🖊️ Pen", () => {
  activeTool = "marker";
  activeThickness = 2;
  activeSticker = null;
  currentPreview = null;
});

makeButton("🖌️ Paint Brush", () => {
  activeTool = "marker";
  activeThickness = 8;
  activeSticker = null;
  currentPreview = null;
});

const hueLabel = document.createElement("label");
hueLabel.textContent = "Hue:";
hueLabel.style.fontFamily = "sans-serif";
hueLabel.style.color = "#444";

const hueSlider = document.createElement("input");
hueSlider.type = "range";
hueSlider.min = "0";
hueSlider.max = "360";
hueSlider.value = hue.toString();
hueSlider.style.width = "120px";
hueSlider.addEventListener("input", () => {
  hue = Number(hueSlider.value);
});
toolPanel.append(hueLabel, hueSlider);

const rotLabel = document.createElement("label");
rotLabel.textContent = "Sticker Rotation:";
rotLabel.style.fontFamily = "sans-serif";
rotLabel.style.color = "#444";

const rotSlider = document.createElement("input");
rotSlider.type = "range";
rotSlider.min = "0";
rotSlider.max = "360";
rotSlider.value = stickerRotation.toString();
rotSlider.style.width = "120px";
rotSlider.addEventListener("input", () => {
  stickerRotation = Number(rotSlider.value);
});
toolPanel.append(rotLabel, rotSlider);

const updateStickers = () => {
  toolPanel.querySelectorAll(".sticker-btn").forEach((b) => b.remove());
  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "sticker-btn";
    btn.textContent = emoji;
    btn.style.fontSize = "20px";
    btn.addEventListener("click", () => {
      activeTool = "sticker";
      activeSticker = emoji;
      currentPreview = null;
    });
    toolPanel.append(btn);
  });
};
updateStickers();

makeButton("+ Custom", () => {
  const text = prompt("Enter custom sticker (emoji or short text):", "😺");
  if (text && text.trim()) {
    stickers.push(text.trim());
    updateStickers();
  }
});
