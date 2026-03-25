class Note {
    constructor(lane) {
        this.lane = lane;
        this.xPosition = spawnXPositions[lane];
        this.yPosition = spawnYPosition;
    }
}

//Time Handling
let deltaTime;
let programStart = Date.now();
let timeElapsed;
let lastTime;

let song;
let spawnXPositions = [];
let notes = [];
let spawnYPosition = 0;
let noteSize = 100;
let fallSpeed = 1000;
let backgroundDim = 0.4;

//Debug
let drawSpawnPoints = true;



/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("gl-canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

if (ctx == null) {
    alert("Your Device Doesn't Support The 2D WebGL Rendering Context");
    window.location = "index.html";
}

ctx.fillStyle = "blue";
Setup(localStorage.getItem("selectedSong"));






function Tick() {
    UpdateTime();
    TickNotes();
    DrawCanvas();
    window.requestAnimationFrame(Tick);
}

function UpdateTime() {
    lastTime = timeElapsed ?? 0;
    timeElapsed = Date.now() - programStart;
    deltaTime = (timeElapsed - lastTime) / 1000;
}

function TickNotes() {
    notes.forEach((e, i) => {
        e.yPosition += fallSpeed * deltaTime;
        if (e.yPosition >= canvas.height + (noteSize / 2)) {
            DeleteNote(i);
        }
    });
}

function DrawCanvas(){
    //Clears the canvas
    canvas.width = canvas.width;

    if(drawSpawnPoints == true){
        spawnXPositions.forEach(e => {
            DrawSquare(e, spawnYPosition, 50)
        });
    }

    notes.forEach(e => {
        DrawSquare(e.xPosition, e.yPosition, noteSize);
    });
}

function SpawnNote(lane) {
    notes.push(new Note(lane));
}

function DeleteNote(index) {
    notes.splice(index, 1);
}

//A custom draw square function that puts the position at the center of the square
function DrawSquare(x, y, size) {
    ctx.fillRect(x - (size / 2), y - (size / 2), size, size);
}

async function Setup(songPath) {
    await GetSong(songPath);
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, ' + backgroundDim + '), rgba(0, 0, 0, ' + backgroundDim + ')), url(' + song.songInfo.backgroundImage + ')';
    SetSpawnXPositions();
    SpawnNote(0);
    SpawnNote(1);
    SpawnNote(2);
    SpawnNote(3);
    window.requestAnimationFrame(Tick);
}

async function GetSong(songPath) {
    try {
        let response = await fetch(songPath);
        song = await response.json();
    } catch (error) {
        console.log(error);
    }
}

function SetSpawnXPositions() {
    let lanes = song.chart.lanes
    for (let i = 0; i < lanes; i++) {
        let index = i + 1;
        spawnXPositions.push((canvas.width / (lanes * 2)) * (index + (index - 1)));
    }
}