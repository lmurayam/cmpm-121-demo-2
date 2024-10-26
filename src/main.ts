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
app_title.style.marginTop = "20px"
app.append(app_title);

const canvas : HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);

const ctx : CanvasRenderingContext2D | null = canvas.getContext("2d");

function CreateNewHeader(){
    const h = document.createElement("h4");
    app.append(h);
    return h;
}

const ui_elements : HTMLHeadingElement = CreateNewHeader()

const pen_buttons : HTMLHeadingElement = CreateNewHeader()

const modifier_slider : HTMLHeadingElement = CreateNewHeader()
modifier_slider.innerHTML = "Change Color of Lines and Rotation of Stickers"

const create_sticker_button : HTMLHeadingElement = CreateNewHeader()

const sticker_buttons : HTMLHeadingElement = CreateNewHeader()

const export_button : HTMLHeadingElement = CreateNewHeader()


function createButton(parent: HTMLElement, text: string, onClick: () => void) {
    const button: HTMLButtonElement = document.createElement("button");
    button.innerHTML = text;
    button.addEventListener("click", ()=>{
        onClick();
        clearCanvas();
        redrawCanvas();
    });
    button.style.margin="2px"
    parent.append(button);
    return button;
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

createButton(pen_buttons,"thick",()=>{
    draw_size = 7;
    current_sticker = null;
});

createButton(pen_buttons,"thin",()=>{
    draw_size = 1;
    current_sticker = null;
});

function createStickerButton(s : string){
    createButton(sticker_buttons,s,()=>{
        current_sticker = s;
        draw_size = 30;
    });
}

createButton(create_sticker_button,"Create Custom Sticker",()=>{
    const answer : string | null= prompt("Custom sticker text","");
    if(answer!=null&&answer!=""){
        createStickerButton(answer);
    }
});

createButton(export_button,"EXPORT",()=>{
    const temp : HTMLCanvasElement = document.createElement("canvas");
    temp.width = temp.height = 1024;
    const tctx : CanvasRenderingContext2D | null = temp.getContext("2d");
    if(tctx!=null){
        tctx.fillStyle = "white";
        tctx.fillRect(0,0,temp.width,temp.height);
        tctx.scale(4,4);
        commands.forEach((command)=>{command.display(tctx);})
        const anchor = document.createElement("a");
        anchor.href = temp.toDataURL("image/png");
        anchor.download = "sketchpad.png";
        anchor.click();
    }
});

const stickers: string[] = ["😊","🍜","🚗"];

stickers.forEach((sticker)=>{
    createStickerButton(sticker);
});

type point = [number,number];

interface IDrawCommand{
    points: point[];
    size: number;
    modifier: number; //color for lines, rotation for stickers
    grow(p : point): void;
    place(ctx : CanvasRenderingContext2D): void;
    drag(ctx : CanvasRenderingContext2D): void;
    display(ctx : CanvasRenderingContext2D): void;
}

function createLineCommand(size: number){
    const command : IDrawCommand = {
        points:[],
        size: size,
        modifier: modifier,
        grow(p: point){
            this.points.push(p);
        },
        place(ctx: CanvasRenderingContext2D){
            ctx.fillStyle = `hsl(${this.modifier}, 100%, 50%)`;
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
            ctx.lineWidth = 1;
        },
        display(ctx: CanvasRenderingContext2D){
            ctx.strokeStyle = `hsl(${this.modifier}, 100%, 50%)`;
            this.place(ctx);
            this.drag(ctx);
        }
    }
    return command;
}

function createStickerCommand(size: number, sticker: string){
    const command : IDrawCommand = {
        points:[],
        size: size,
        modifier: modifier,
        grow(p: point){
            this.points.push(p);
        },
        place(ctx: CanvasRenderingContext2D){
            const width = ctx.measureText(sticker).width;
            ctx.font = `${size}px sans-serif`;
            
            ctx.save();
            ctx.translate(this.points[0][0] - width/2,this.points[0][1] + size/2);
            ctx.rotate(this.modifier *(Math.PI/180));
            ctx.fillText(sticker, 0, 0);
            ctx.restore();
        },
        drag(ctx: CanvasRenderingContext2D){
            let last_point = this.points[0];
            ctx.font = `${size}px sans-serif`
            const width = ctx.measureText(sticker).width
            this.points.forEach((point)=>{
                if(calculateDistance(last_point,point)>size){
                    ctx.save();
                    ctx.translate(point[0] - width/2,point[1] + size/2);
                    ctx.rotate(this.modifier*(Math.PI/180));
                    ctx.fillText(sticker, 0, 0);
                    ctx.restore();
                    last_point = point;
                }
            });
        },
        display(ctx: CanvasRenderingContext2D){
            this.place(ctx);
            this.drag(ctx);
        }
    }
    return command;
}

interface ICursor {
    point: point;
    size: number;
    display(ctx : CanvasRenderingContext2D): void;
}
let draw_size : number = 7;

function createCursor(p : point, s:number){
    const cursor : ICursor = {point: p, size: s,
        display(ctx: CanvasRenderingContext2D){
            if(current_sticker==null){
                ctx.strokeStyle = `hsl(${modifier}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(this.point[0],this.point[1], s/2, 0 ,2*Math.PI);
                ctx.fillStyle = `hsl(${modifier}, 100%, 50%)`;
                ctx.fill();
                ctx.stroke();
            }
            else{
                ctx.font = `${s}px sans-serif`
                const width = ctx.measureText(current_sticker).width
                ctx.save();
                ctx.translate(this.point[0] - width/2, this.point[1] + s/2);
                ctx.rotate(modifier*(Math.PI/180));
                ctx.fillText(current_sticker, 0, 0);
                ctx.restore();
            }
        }
    };
    return cursor;
}


const commands : IDrawCommand[] = [];
const redo_commands: IDrawCommand[] = [];

let current_command : IDrawCommand | null = null;
let current_sticker : string | null = null;
let cursor : ICursor | null = null;

const slider : HTMLInputElement = document.createElement("input");
slider.type = "range";
slider.min= "0";
slider.max="360";
slider.defaultValue = "0";
slider.addEventListener("input",()=>{
    modifier=Number(slider.value);
})

modifier_slider.append(slider);

let modifier : number = 0;

const drawing_changed : Event = new CustomEvent("drawing-changed");
const tool_moved : Event = new CustomEvent("tool-moved");

canvas.addEventListener("mousedown", (e)=>{
    current_command = current_sticker == null ? createLineCommand(draw_size) : createStickerCommand(draw_size,current_sticker);
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

let cursor_in : boolean = false;
canvas.addEventListener("mouseover",(e)=>{
    cursor_in = true;
    canvas.style.cursor = "none";
    cursor = createCursor([e.offsetX,e.offsetY],draw_size);
    dispatchEvent(tool_moved);
})
canvas.addEventListener("mouseout",()=>{
    cursor_in = false;
    canvas.style.cursor = "default";
    cursor = null;
    dispatchEvent(tool_moved);
})

addEventListener("tool-moved",()=>{
    clearCanvas();
    redrawCanvas();
    if(ctx!=null&&cursor!=null&&cursor_in){
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

function calculateDistance(p1: point, p2: point): number {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    return Math.sqrt(dx * dx + dy * dy);
}