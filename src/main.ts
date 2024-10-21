import "./style.css";

const APP_NAME = "DRAW";
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
    commands.length=0;
    redo_commands.length=0;
});

const undo_button : HTMLButtonElement = document.createElement("button");
undo_button.innerHTML = "undo"
ui_elements.append(undo_button);
undo_button.addEventListener("click",()=>{
    const last_command = commands.pop();
    if(last_command!=null){redo_commands.push(last_command)};
    canvas.dispatchEvent(drawing_changed);
});

const redo_button : HTMLButtonElement = document.createElement("button");
redo_button.innerHTML = "redo"
ui_elements.append(redo_button);
redo_button.addEventListener("click",()=>{
    const last_command = redo_commands.pop();
    if(last_command!=null){commands.push(last_command)};
    canvas.dispatchEvent(drawing_changed);
});

type point = [number,number];

interface ILineCommand{
    points: point[];
    display(ctx : CanvasRenderingContext2D): void;
}

function createLineCommand(p : point){
    const command : ILineCommand = {
        points:[p],
        display(ctx: CanvasRenderingContext2D){
            ctx.beginPath();
            ctx.moveTo(...this.points[0]);
            this.points.forEach((point)=>{
                ctx.lineTo(...point);
            });
            ctx.stroke();
        }
    }
    return command;
}

interface ICursor {
    active: boolean;
    point: point;
}

const cursor : ICursor = {active:false, point: [0,0]};

const commands : ILineCommand[] = [];
const redo_commands: ILineCommand[] = [];

let current_command : ILineCommand | null = null;

const drawing_changed : Event = new CustomEvent("drawing-changed");

canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.point = [e.offsetX,e.offsetY];
    current_command = createLineCommand(cursor.point);
    commands.push(current_command);
    canvas.dispatchEvent(drawing_changed);

    redo_commands.length = 0;
});
addEventListener("mouseup",()=>{
    cursor.active=false;
    current_command = null;
    canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mousemove",(e)=>{
    if(cursor.active){
        cursor.point = [e.offsetX,e.offsetY];
        current_command?.points.push(cursor.point);
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
    commands.forEach((command)=>{
        if(ctx!=null){
            command.display(ctx);
        }
    })
}

