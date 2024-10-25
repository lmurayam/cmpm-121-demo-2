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


function createButton(parent: HTMLElement, text: string, onClick: () => void) {
    const button: HTMLButtonElement = document.createElement("button");
    button.innerHTML = text;
    button.addEventListener("click", onClick);
    parent.append(button);
}

createButton(ui_elements,"clear",()=>{
    clearCanvas();
    commands.length = 0;
    redo_commands.length = 0;
});

createButton(ui_elements,"undo",()=>{
    const last_command = commands.pop();
    if(last_command!=null){redo_commands.push(last_command)};
    canvas.dispatchEvent(drawing_changed);
});

createButton(ui_elements,"redo",()=>{
    const last_command = redo_commands.pop();
    if(last_command!=null){commands.push(last_command)};
    canvas.dispatchEvent(drawing_changed);
});

createButton(ui_elements,"thick",()=>{
    draw_size = 5;
});

createButton(ui_elements,"thin",()=>{
    draw_size = 1;
});

type point = [number,number];

interface IDrawCommand{
    points: point[];
    size: number;
    grow(p : point): void;
    place(ctx : CanvasRenderingContext2D): void;
    drag(ctx : CanvasRenderingContext2D): void;
    display(ctx : CanvasRenderingContext2D): void;
}

function createLineCommand(size: number){
    const command : IDrawCommand = {
        points:[],
        size: size,
        grow(p: point){
            this.points.push(p);
        },
        place(ctx: CanvasRenderingContext2D){
            ctx.beginPath();
            ctx.arc(this.points[0][0],this.points[0][1], size/2, 0 ,2*Math.PI);
            ctx.fill();
            ctx.stroke();
        },
        drag(ctx: CanvasRenderingContext2D){
            ctx.lineWidth = this.size;
            ctx.beginPath();
            ctx.moveTo(...this.points[0]);
            this.points.forEach((point)=>{
                ctx.lineTo(...point);
            });
            ctx.stroke();
        },
        display(ctx: CanvasRenderingContext2D){
            ctx.save();
            this.place(ctx);
            this.drag(ctx);
            ctx.restore();
        }
    }
    return command;
}

interface ICursor {
    point: point;
    size: number;
    display(ctx : CanvasRenderingContext2D): void;
}
let draw_size : number = 1;

function createCursor(p : point, s:number){
    const cursor : ICursor = {point: p, size: s,
        display(ctx: CanvasRenderingContext2D){
            ctx.beginPath();
            ctx.arc(this.point[0],this.point[1], s/2, 0 ,2*Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    };
    return cursor;
}


const commands : IDrawCommand[] = [];
const redo_commands: IDrawCommand[] = [];

let current_command : IDrawCommand | null = null;
let cursor : ICursor | null = null;

const drawing_changed : Event = new CustomEvent("drawing-changed");
const tool_moved : Event = new CustomEvent("tool-moved");

canvas.addEventListener("mousedown", (e)=>{
    current_command = createLineCommand(draw_size);
    current_command.grow([e.offsetX,e.offsetY]);
    commands.push(current_command);
    canvas.dispatchEvent(drawing_changed);

    cursor = createCursor([e.offsetX,e.offsetY],draw_size);
    dispatchEvent(tool_moved);

    redo_commands.length = 0;
});
addEventListener("mouseup",(e)=>{
    if(current_command!=null&&current_command.points.length>1){
        current_command.grow([e.offsetX,e.offsetY]);
    }
    current_command = null;
    canvas.dispatchEvent(drawing_changed);
    cursor = createCursor([e.offsetX,e.offsetY],draw_size);
    dispatchEvent(tool_moved);
});
canvas.addEventListener("mousemove",(e)=>{
    if(current_command!=null){
        current_command.grow([e.offsetX,e.offsetY]);
        canvas.dispatchEvent(drawing_changed);
    }

    cursor = createCursor([e.offsetX,e.offsetY],draw_size);
    dispatchEvent(tool_moved);
});
canvas.addEventListener("drawing-changed",()=>{
    clearCanvas();
    redrawCanvas();
})

canvas.addEventListener("mouseover",(e)=>{
    canvas.style.cursor = "none";
    cursor = createCursor([e.offsetX,e.offsetY],draw_size);
    dispatchEvent(tool_moved);
})
canvas.addEventListener("mouseout",()=>{
    canvas.style.cursor = "default";
    cursor = null;
    dispatchEvent(tool_moved);
})

addEventListener("tool-moved",()=>{
    clearCanvas();
    redrawCanvas();
    if(ctx!=null&&cursor!=null){
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

