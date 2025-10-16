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
