import "./style.css";

const APP_NAME = "Test";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

const app_title : HTMLHeadingElement = document.createElement("h1");
app_title.innerHTML = APP_NAME;
app_title.style.textAlign = "center"
app_title.style.position = "absolute";
app_title.style.top = "5%";
app_title.style.left = "50%";
app_title.style.transform = "translateX(-50%)";
app.append(app_title);

const canvas : HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);