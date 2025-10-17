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
title.textContent = "Sketchpad";
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchpad";
app.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

type Point = { x: number; y: number };
let strokes: Point[][] = [];
let redoStack: Point[][] = [];
let currentStroke: Point[] | null = null;

canvas.addEventListener("mousedown", (e) => {
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
  strokes.push(currentStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (currentStroke) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  currentStroke = null;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "black";
  ctx.beginPath();
  for (const stroke of strokes) {
    if (stroke.length > 0) {
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const p of stroke) {
        ctx.lineTo(p.x, p.y);
      }
    }
  }
  ctx.stroke();
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
  strokes = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoBtn.addEventListener("click", () => {
  if (strokes.length > 0) {
    const stroke = strokes.pop()!;
    redoStack.push(stroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const stroke = redoStack.pop()!;
    strokes.push(stroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
