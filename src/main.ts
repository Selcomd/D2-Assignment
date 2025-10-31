// Yahir Rico
import "./style.css";

const app = document.createElement("div");
app.style.display = "flex";
app.style.flexDirection = "column";
app.style.alignItems = "center";
app.style.justifyContent = "center";
app.style.gap = "12px";
app.style.height = "100vh";
document.body.append(app);

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchpad";
canvas.style.cursor = "none";
app.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements Command {
  private points: { x: number; y: number }[] = [];
  constructor(startX: number, startY: number, private thickness: number) {
    this.points.push({ x: startX, y: startY });
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}

class MarkerPreview implements Command {
  constructor(public x: number, public y: number, private thickness: number) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class StickerCommand implements Command {
  constructor(public emoji: string, public x: number, public y: number) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

class StickerPreview implements Command {
  constructor(public emoji: string, public x: number, public y: number) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.5;
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.globalAlpha = 1.0;
  }
}

let displayList: Command[] = [];
let redoStack: Command[] = [];
let currentLine: MarkerLine | null = null;
let currentPreview: Command | null = null;

type ToolType = "marker" | "sticker";
let activeTool: ToolType = "marker";
let activeThickness = 2;
let activeSticker: string | null = null;

const stickers = ["🐱", "🌟", "🎈"];

canvas.addEventListener("mousedown", (e) => {
  if (activeTool === "marker") {
    currentLine = new MarkerLine(e.offsetX, e.offsetY, activeThickness);
    displayList.push(currentLine);
  } else if (activeTool === "sticker" && activeSticker) {
    const cmd = new StickerCommand(activeSticker, e.offsetX, e.offsetY);
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
    currentPreview = new MarkerPreview(e.offsetX, e.offsetY, activeThickness);
  } else if (activeTool === "sticker" && activeSticker) {
    currentPreview = new StickerPreview(activeSticker, e.offsetX, e.offsetY);
  } else {
    currentPreview = null;
  }

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const cmd of displayList) {
    cmd.display(ctx);
  }
  if (currentPreview) {
    currentPreview.display(ctx);
  }
});

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
app.append(clearBtn);

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
app.append(undoBtn);

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
app.append(redoBtn);

clearBtn.addEventListener("click", () => {
  displayList = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoBtn.addEventListener("click", () => {
  if (displayList.length > 0) {
    redoStack.push(displayList.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    displayList.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const toolPanel = document.createElement("div");
toolPanel.style.display = "flex";
toolPanel.style.gap = "8px";
app.append(toolPanel);

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin Marker";
thinBtn.addEventListener("click", () => {
  activeTool = "marker";
  activeThickness = 2;
  activeSticker = null;
  currentPreview = null;
});
toolPanel.append(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick Marker";
thickBtn.addEventListener("click", () => {
  activeTool = "marker";
  activeThickness = 8;
  activeSticker = null;
  currentPreview = null;
});
toolPanel.append(thickBtn);

const updateStickers = () => {
  toolPanel.querySelectorAll(".sticker-btn").forEach((b) => b.remove());

  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "sticker-btn";
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      activeTool = "sticker";
      activeSticker = emoji;
      currentPreview = null;
    });
    toolPanel.append(btn);
  });
};
updateStickers();

const addStickerBtn = document.createElement("button");
addStickerBtn.textContent = "+ Custom Sticker";
addStickerBtn.addEventListener("click", () => {
  const text = prompt("Enter custom sticker (emoji or short text):", "🧩");
  if (text && text.trim()) {
    stickers.push(text.trim());
    updateStickers();
  }
});
toolPanel.append(addStickerBtn);
