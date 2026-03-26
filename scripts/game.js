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
let spawnYPosition = -50;
let perfectYpos = 1400;
let noteSize = 100;
let fallSpeed = 1000;
let backgroundDim = 0.4;
let perfectRange = 30;
let greatRange = 60;
let okayRange = 150;
//Smallest dist is the maximum amount of pixels a note can be behind the perfectYpos before it is ignored.
let smallestDist = -noteSize;
let timeToPerfect = ((perfectYpos - spawnYPosition) / fallSpeed) * 1000;

//Debug
let drawSpawnPoints = true;
let drawOkayrange = false;
let drawGreatrange = false;
let drawPerfectRange = false;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("gl-canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

if (ctx == null) {
    alert("Your Device Doesn't Support The 2D WebGL Rendering Context");
    window.location = "index.html";
}

Setup(localStorage.getItem("selectedSong"));

async function Setup(songPath) {
    await GetSong(songPath);
    chart = song.chart.notes;
    chartLength = chart.length;
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, ' + backgroundDim + '), rgba(0, 0, 0, ' + backgroundDim + ')), url(' + song.songInfo.backgroundImage + ')';
    SetSpawnXPositions();
    BindInput();
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

function Tick() {
    UpdateTime();
    TickSpawning();
    TickNotes();
    TickDeletion();
    DrawCanvas();
    window.requestAnimationFrame(Tick);
}

function UpdateTime() {
    lastTime = timeElapsed ?? 0;
    timeElapsed = Date.now() - programStart;
    deltaTime = (timeElapsed - lastTime) / 1000;
}

function TickSpawning() {
    if (noteIndex < chartLength) {
        if (chart[noteIndex].time - timeToPerfect <= timeElapsed) {
            SpawnNote(chart[noteIndex].lane);
            noteIndex++;
            TickSpawning();
        }
    }
}

function TickNotes() {
    notes.forEach(e => {
        e.yPosition += fallSpeed * deltaTime;
    });
}

function TickDeletion() {
    notes.forEach((e, i) => {
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
            DrawSquare(e, spawnYPosition, 110)
        });
    }

    notes.forEach(e => {
        ctx.fillStyle = noteColors[e.lane];
        DrawSquare(e.xPosition, e.yPosition, noteSize);
    });

    if (drawOkayrange) {
        ctx.fillStyle = "rgba(0.0, 0.0, 255.0, 0.5";
        ctx.fillRect(0, perfectYpos - okayRange, canvas.width, okayRange * 2);
    }

    if (drawGreatrange) {
        ctx.fillStyle = "rgba(0.0, 255.0, 0.0, 0.5";
        ctx.fillRect(0, perfectYpos - greatRange, canvas.width, greatRange * 2);
    }


    if (drawPerfectRange) {
        ctx.fillStyle = "rgba(255.0, 0.0, 0.0, 0.5";
        ctx.fillRect(0, perfectYpos - perfectRange, canvas.width, perfectRange * 2);
    }

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

function SetSpawnXPositions() {
    let lanes = song.chart.lanes
    for (let i = 0; i < lanes; i++) {
        let index = i + 1;
        spawnXPositions.push((canvas.width / (lanes * 2)) * (index + (index - 1)));
    }
}

function Input(lane) {
    let closestNoteIndex = Number.POSITIVE_INFINITY;
    let closestNoteDist = Number.POSITIVE_INFINITY;

    notes.forEach((e, i) => {
        let distance = perfectYpos - e.yPosition;
        if (e.lane == lane && distance < closestNoteDist && distance >= smallestDist && distance <= okayRange) {
            closestNoteDist = distance;
            closestNoteIndex = i;
        }
    });

    if (closestNoteIndex < chartLength) {
        CalculateScore(Math.abs(closestNoteDist));
        DeleteNote(closestNoteIndex);
    }
}

function CalculateScore(distance) {
    if (distance <= perfectRange) {
        console.log("Perfect");
    } else if (distance <= greatRange) {
        console.log("Great");
    } else if (distance <= okayRange) {
        console.log("Okay");
    } else{
        console.log("Unexpected Input Distance Used: " + distance);
    }
}

function BindInput() {
    document.addEventListener("keydown", (event) => {
        const keyName = event.key;

        //This is so goofy
        if (keyName === "d") {
            Input(0);
        }
        if (keyName === "f") {
            Input(1);
        }
        if (keyName === "j") {
            Input(2);
        }
        if (keyName === "k") {
            Input(3);
        }
    });
}