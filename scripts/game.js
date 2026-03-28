class Note {
    type = 0;

    constructor(lane, time) {
        this.time = time;
        this.lane = lane;
        this.xPosition = spawnXPositions[lane];
        this.yPosition = spawnYPosition;
    }
}

class HoldNote {
    type = 1;

    constructor(lane, time, yPosition, id, holdTime, endNote) {
        this.time = time;
        this.lane = lane;
        this.xPosition = spawnXPositions[lane];
        this.yPosition = yPosition;
        this.id = id;
        this.holdTime = holdTime;
        this.endNote = endNote;
    }
}

class RGBA {
    constructor(red, green, blue, alpha) {
        this.red = red;
        this.blue = blue;
        this.green = green;
        this.alpha = alpha;
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
let spawnYPosition = -50;
let perfectYpos = 1400;
let noteSize = 175;
let fallSpeed = 1400;
//Smallest dist is the maximum amount of pixels a note can be behind the perfectYpos before it is ignored.
let smallestDist = -noteSize;
let timeToPerfect = ((perfectYpos - spawnYPosition) / fallSpeed) * 1000;
//The id of the hold notes, lets the begining and end portions of a hold note know where they are.
let holdNoteId = 0;

//Cosmetics
let noteColors = [
    new RGBA(255.0, 0.0, 0.0, 1.0),
    new RGBA(0.0, 255.0, 0.0, 1.0),
    new RGBA(0.0, 0.0, 255.0, 1.0),
    new RGBA(255.0, 255.0, 0.0, 1.0)
];
let backgroundDim = 0.4;
let receptorLineWidth = 10;

//Scoring 
//In milliseconds deviated from the time the note is supposed to be clicked
let perfectRange = 50;
let greatRange = 100;
let okayRange = 150;
let badRange = 250;
let scoreTable = [
    { limit: perfectRange, label: "Perfect" },
    { limit: greatRange, label: "Great" },
    { limit: okayRange, label: "Okay" },
    { limit: badRange, label: "Bad" }
]

//Input
//Used for click note detection, one for each lane
let interactable = [true, true, true, true];
let keysHeld = [false, false, false, false];
//Key and lane pairs
const keys = {
    d: 0,
    f: 1,
    j: 2,
    k: 3
}

//Debug
let drawSpawnPoints = false;
let drawScoringRanges = false;
let drawBadRange = true;
let drawOkayrange = true;
let drawGreatrange = true;
let drawPerfectRange = true;

//Makees it possible to debug during runtime
globalThis.drawSpawnPoints;
globalThis.drawScoringRanges;
globalThis.drawBadRange;
globalThis.drawOkayrange;
globalThis.drawGreatrange;
globalThis.drawPerfectRange;

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
            switch (chart[noteIndex].type) {
                case 0:
                    SpawnNote(chart[noteIndex].lane, chart[noteIndex].time);
                    break;
                case 1:
                    SpawnHoldNote(chart[noteIndex].lane, chart[noteIndex].time, chart[noteIndex].endTime);
                    break;
            }
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

    notes.forEach(e => {
        let noteColor = noteColors[e.lane];
        ctx.fillStyle = `rgba(${noteColor.red}, ${noteColor.green}, ${noteColor.blue}, ${noteColor.alpha})`;
        DrawCircle(e.xPosition, e.yPosition, noteSize / 2, true);
    });

    spawnXPositions.forEach(e => {
        if (drawSpawnPoints == true) {
            ctx.fillStyle = "turquoise"
            DrawSquare(e, spawnYPosition, 110)
        }
        ctx.lineWidth = receptorLineWidth;
        ctx.strokeStyle = "white";
        DrawCircle(e, perfectYpos, noteSize / 2, false)
    });

    if (drawBadRange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 0.0, 0.0, 0.5";
        ctx.fillRect(0, perfectYpos - (badRange / 1000) * fallSpeed, canvas.width, (badRange / 1000) * fallSpeed * 2);
    }

    if (drawOkayrange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 0.0, 255.0, 0.5";
        ctx.fillRect(0, perfectYpos - (okayRange / 1000) * fallSpeed, canvas.width, (okayRange / 1000) * fallSpeed * 2);
    }

    if (drawGreatrange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 255.0, 0.0, 0.5";
        ctx.fillRect(0, perfectYpos - (greatRange / 1000) * fallSpeed, canvas.width, (greatRange / 1000) * fallSpeed * 2);
    }

    if (drawPerfectRange && drawScoringRanges) {
        ctx.fillStyle = "rgba(255.0, 0.0, 0.0, 0.5";
        ctx.fillRect(0, perfectYpos - (perfectRange / 1000) * fallSpeed, canvas.width, (perfectRange / 1000) * fallSpeed * 2);
    }
}

function SpawnNote(lane, time) {
    notes.push(new Note(lane, time));
}

function SpawnHoldNote(lane, startTime, endTime) {
    let holdTime = endTime - startTime;
    notes.push(new HoldNote(lane, startTime, spawnYPosition, holdNoteId, holdTime, false));
    let endSpawnYPos = spawnYPosition - ((holdTime / 1000) * fallSpeed);
    notes.push(new HoldNote(lane, endTime, endSpawnYPos, holdNoteId, holdNoteId, true));
    holdNoteId++;
}

function DeleteNote(index) {
    notes.splice(index, 1);
}

function DrawCircle(x, y, radius, filled) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    if (filled) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
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
    let leastTimeDifference = Number.POSITIVE_INFINITY;

    notes.forEach((e, i) => {
        let timeDifference = e.time - timeElapsed;
        let distance = perfectYpos - e.yPosition;
        //Some yummy conditions
        if (e.lane == lane && timeDifference < leastTimeDifference && distance >= smallestDist && timeDifference <= badRange) {
            leastTimeDifference = timeDifference;
            closestNoteIndex = i;
        }
    });
    if (closestNoteIndex < chartLength) {
        console.log(GetScore(Math.abs(leastTimeDifference)));
        DeleteNote(closestNoteIndex);
    }
    interactable[lane] = false;
}

function GetScore(timeDifference) {
    return scoreTable.find((item) => timeDifference <= item.limit).label ?? "Unexpected time difference used: " + timeDifference;
}

function BindInput() {
    document.addEventListener("keydown", (event) => {
        const keyName = event.key;

        //This is so goofy
        if (keyName === "d" && interactable[keys["d"]]) {
            Input(keys["d"]);
            keysHeld[keys["d"]] = true;
        }
        if (keyName === "f" && interactable[keys["f"]]) {
            Input(keys["f"]);
            keysHeld[keys["f"]] = true;
        }
        if (keyName === "j" && interactable[keys["j"]]) {
            Input(keys["j"]);
            keysHeld[keys["j"]] = true;
        }
        if (keyName === "k" && interactable[keys["k"]]) {
            Input(keys["k"]);
            keysHeld[keys["k"]] = true;
        }
    });

    document.addEventListener("keyup", (event) => {
        const keyName = event.key;

        //This is so goofy
        if (keyName === "d") {
            interactable[keys["d"]] = true;
            keysHeld[keys["d"]] = false;
        }
        if (keyName === "f") {
            interactable[keys["f"]] = true;
            keysHeld[keys["f"]] = false;
        }
        if (keyName === "j") {
            interactable[keys["j"]] = true;
            keysHeld[keys["j"]] = false;
        }
        if (keyName === "k") {
            interactable[keys["k"]] = true;
            keysHeld[keys["k"]] = false;
        }
    });
}