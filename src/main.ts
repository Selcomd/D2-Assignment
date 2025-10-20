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
app.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements Command {
  private points: { x: number; y: number }[] = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
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
    ctx.lineWidth = 1;
  }
}

let displayList: Command[] = [];
let redoStack: Command[] = [];
let currentLine: MarkerLine | null = null;

let currentThickness = 2;

const toolbar = document.createElement("div");
toolbar.style.display = "flex";
toolbar.style.gap = "8px";
app.append(toolbar);

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin Marker";
toolbar.append(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick Marker";
toolbar.append(thickBtn);

thinBtn.addEventListener("click", () => {
  currentThickness = 2;
  thinBtn.classList.add("selectedTool");
  thickBtn.classList.remove("selectedTool");
});

thickBtn.addEventListener("click", () => {
  currentThickness = 6;
  thickBtn.classList.add("selectedTool");
  thinBtn.classList.remove("selectedTool");
});

thinBtn.classList.add("selectedTool");

canvas.addEventListener("mousedown", (e) => {
  currentLine = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
  displayList.push(currentLine);
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
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