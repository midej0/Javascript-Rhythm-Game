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

//Chart
let song;
let chart;
let chartLength;
let noteIndex = 0;

//Notes
let spawnXPositions = [];
let notes = [];
let noteColors = ["red", "green", "blue", "yellow"];
let spawnYPosition = 0;
let perfectYpos = 1200;
let noteSize = 100;
let fallSpeed = 1600;
let backgroundDim = 0.4;
let timeToPerfect = ((perfectYpos-spawnYPosition)/fallSpeed) * 1000

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

Setup(localStorage.getItem("selectedSong"));

function Tick() {
    UpdateTime();
    if (noteIndex < chartLength) {
        TickSpawning();
    }
    TickNotes();
    DrawCanvas();
    //Get Input
    window.requestAnimationFrame(Tick);
}

function UpdateTime() {
    lastTime = timeElapsed ?? 0;
    timeElapsed = Date.now() - programStart;
    deltaTime = (timeElapsed - lastTime) / 1000;
}

function TickSpawning() {
    if (chart[noteIndex].time - timeToPerfect <= timeElapsed) {
        SpawnNote(chart[noteIndex].lane);
        noteIndex++;
    }
}

function TickNotes() {
    notes.forEach((e, i) => {
        e.yPosition += fallSpeed * deltaTime;
        if(e.yPosition >= perfectYpos){
            console.log(timeElapsed);
            DeleteNote(i);
        }

        if (e.yPosition >= canvas.height + (noteSize / 2)) {
            DeleteNote(i);
        }
    });
}

function DrawCanvas() {
    //Clears the canvas
    canvas.width = canvas.width;

    if (drawSpawnPoints == true) {
        spawnXPositions.forEach(e => {
            DrawSquare(e, spawnYPosition, 50)
        });
    }

    notes.forEach(e => {
        ctx.fillStyle = noteColors[e.lane];
        DrawSquare(e.xPosition, e.yPosition, noteSize);
    });

    ctx.fillStyle = "rgba(255.0, 255.0, 255.0, 0.5";
    ctx.fillRect(0, perfectYpos - (noteSize / 2), canvas.width, noteSize);
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
    chart = song.chart.notes;
    chartLength = chart.length;
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, ' + backgroundDim + '), rgba(0, 0, 0, ' + backgroundDim + ')), url(' + song.songInfo.backgroundImage + ')';
    SetSpawnXPositions();
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