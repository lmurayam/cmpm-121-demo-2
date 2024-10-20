import "./style.css";

const APP_NAME = "Test";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

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

const ctx : CanvasRenderingContext2D | null = canvas.getContext("2d");

const ui_elements : HTMLHeadingElement = document.createElement("h4");
app.append(ui_elements);

const clear_button : HTMLButtonElement = document.createElement("button");
clear_button.innerHTML = "clear"
ui_elements.append(clear_button);
clear_button.addEventListener("click",()=>{
    ctx?.clearRect(0,0,canvas.width,canvas.height);
});

//Source: https://quant-paint.glitch.me/paint0.html


const cursor = {active: false, x:0, y:0};

canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});
canvas.addEventListener("mouseup",()=>{
    cursor.active=false;
});
canvas.addEventListener("mousemove",(e)=>{
    if(cursor.active&&ctx!=null){
        ctx.beginPath();
        ctx.moveTo(cursor.x,cursor.y);
        ctx.lineTo(e.offsetX,e.offsetY);
        ctx.stroke();
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});