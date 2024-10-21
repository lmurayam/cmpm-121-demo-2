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
    clearCanvas();
    //I think in a lecture the prof said not to do this...
    points.length=0;
});

type point = [number,number];

interface ICursor {
    active: boolean;
    point: point;
}

const cursor : ICursor = {active:false, point: [0,0]};

const points : point[] = [];

const drawing_changed : Event = new CustomEvent("drawing-changed");

canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.point = [e.offsetX,e.offsetY];
});
addEventListener("mouseup",()=>{
    cursor.active=false;
});
canvas.addEventListener("mousemove",(e)=>{
    if(cursor.active){
        points.push(cursor.point);
        points.push([e.offsetX,e.offsetY]);
        cursor.point = [e.offsetX,e.offsetY]
        canvas.dispatchEvent(drawing_changed);
    }
});
canvas.addEventListener("drawing-changed",()=>{
    clearCanvas();
    redrawCanvas();
})

function clearCanvas() {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

function redrawCanvas(){
    for(let i = 0; i<points.length;i+=2){
        ctx?.beginPath();
        ctx?.moveTo(...points[i]);
        ctx?.lineTo(...points[i+1]);
        ctx?.stroke();
    }
}

