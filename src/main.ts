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

const thin_button : HTMLButtonElement = document.createElement("button");
thin_button.innerHTML = "thin"
ui_elements.append(thin_button);
thin_button.addEventListener("click",()=>{
    line_size = 1;
});
const thick_button : HTMLButtonElement = document.createElement("button");
thick_button.innerHTML = "thick"
ui_elements.append(thick_button);
thick_button.addEventListener("click",()=>{
    line_size = 5;
});


type point = [number,number];

interface ILineCommand{
    points: point[];
    line_width: number;
    display(ctx : CanvasRenderingContext2D): void;
}

function createLineCommand(p : point, size: number){
    const command : ILineCommand = {
        points:[p],
        line_width: size,
        display(ctx: CanvasRenderingContext2D){
            ctx.lineWidth = this.line_width;
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
    inside: boolean;
    point: point;
    display(ctx : CanvasRenderingContext2D): void;
}
const cursor : ICursor = {active:false, inside: false, point: [0,0],
    display(ctx: CanvasRenderingContext2D){
        if(this.active!=true&&this.inside!=false){
            ctx.beginPath();
            ctx.arc(this.point[0],this.point[1], line_size/2, 0 ,2*Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }
};


const commands : ILineCommand[] = [];
const redo_commands: ILineCommand[] = [];

let current_command : ILineCommand | null = null;

let line_size : number = 1;

const drawing_changed : Event = new CustomEvent("drawing-changed");
const tool_moved : Event = new CustomEvent("tool-moved");

canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.point = [e.offsetX,e.offsetY];
    current_command = createLineCommand(cursor.point,line_size);
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
    if(cursor.inside){
        cursor.point = [e.offsetX,e.offsetY];
        dispatchEvent(tool_moved);
    }
    if(cursor.active){
        current_command?.points.push(cursor.point);
        canvas.dispatchEvent(drawing_changed);
    }
});
canvas.addEventListener("drawing-changed",()=>{
    clearCanvas();
    redrawCanvas();
})

canvas.addEventListener("mouseover",()=>{
    canvas.style.cursor = "none";
    cursor.inside=true;
})
canvas.addEventListener("mouseout",()=>{
    canvas.style.cursor = "default";
    cursor.inside=false;
    dispatchEvent(tool_moved);
})

addEventListener("tool-moved",()=>{
    clearCanvas();
    redrawCanvas();
    if(ctx!=null){
        cursor.display(ctx);
    }
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

