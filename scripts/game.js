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
    scored = false;

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
let programStart;
let timeElapsed;
let lastTime;

//Chart
let song;
let chart;
let chartLength;
let noteIndex = 0;
let running = false;
let audio;
let offset;

//Notes
let spawnXPositions = [];
let notes = [];
let spawnYPosition = -50;
let perfectYpos = 1400;
let noteSize = 175;
// filip speed 3000
let fallSpeed = 1400;
//Smallest dist is the maximum amount of pixels a note can be behind the perfectYpos before it is ignored.
let smallestDist = -noteSize;
let timeToPerfect = ((perfectYpos - spawnYPosition) / fallSpeed) * 1000;
//The id of the hold notes, lets the begining and end portions of a hold note know where they are.
let holdNoteId = 0;

//Cosmetics
let noteColors = [
    new RGBA(26.0, 44.0, 121.0, 1.0),
    new RGBA(232.0, 5.0, 102.0, 1.0),
    new RGBA(255.0, 141.0, 104.0, 1.0),
    new RGBA(244.0, 234.0, 188.0, 1.0)
];
let backgroundDim = 1;
let receptorLineWidth = 15;

//Scoring 
//In milliseconds deviated from the time the note is supposed to be clicked
let perfectRange = 50;
let greatRange = 75;
let okayRange = 100;
let badRange = 150;
let scoreTable = [
    { limit: perfectRange, label: "Perfect" },
    { limit: greatRange, label: "Great" },
    { limit: okayRange, label: "Okay" },
    { limit: badRange, label: "Bad" }
]

//Input
//Used for click note detection, one for each lane
let interactable = [true, true, true, true];
//For hold note detection, one for each lane.
let keysHeld = [false, false, false, false];
//If the timeHeld array should add time, one for each lane.
let shouldCount = [false, false, false, false];
//The time in ms the player has held the hold note, one for each lane.
let timeHeld = [0, 0, 0, 0];
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

//Makes it possible to debug during runtime
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
    offset = song.chart.offset;
    document.getElementById("main").style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${backgroundDim}), rgba(0, 0, 0, ${backgroundDim})), url(${song.songInfo.backgroundImage})`;
    SetSpawnXPositions();
    DrawReceptor();
    BindInput();
}

function Start() {
    programStart = Date.now();
    audio = new Audio(song.songInfo.audio);
    audio.volume = 0.1;
    audio.play();
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
        if (chart[noteIndex].time + offset - timeToPerfect <= timeElapsed) {
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

    DrawHoldConnector();
    DrawNotes();
    DrawReceptor();

    if (drawBadRange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 0.0, 0.0, 0.5)";
        ctx.fillRect(0, perfectYpos - (badRange / 1000) * fallSpeed, canvas.width, (badRange / 1000) * fallSpeed * 2);
    }

    if (drawOkayrange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 0.0, 255.0, 0.5)";
        ctx.fillRect(0, perfectYpos - (okayRange / 1000) * fallSpeed, canvas.width, (okayRange / 1000) * fallSpeed * 2);
    }

    if (drawGreatrange && drawScoringRanges) {
        ctx.fillStyle = "rgba(0.0, 255.0, 0.0, 0.5)";
        ctx.fillRect(0, perfectYpos - (greatRange / 1000) * fallSpeed, canvas.width, (greatRange / 1000) * fallSpeed * 2);
    }

    if (drawPerfectRange && drawScoringRanges) {
        ctx.fillStyle = "rgba(255.0, 0.0, 0.0, 0.5)";
        ctx.fillRect(0, perfectYpos - (perfectRange / 1000) * fallSpeed, canvas.width, (perfectRange / 1000) * fallSpeed * 2);
    }
}

function DrawHoldConnector() {
    notes.forEach(e => {
        if (e.endNote) {
            let startYPosition = GetStartNote(e.id).yPosition;
            let color = noteColors[e.lane];
            ctx.fillStyle = `rgba(${color.red * 0.6}, ${color.green * 0.6}, ${color.blue * 0.6}, ${color.alpha * 0.7})`;
            ctx.fillRect(e.xPosition - (noteSize / 2), e.yPosition, noteSize, startYPosition - e.yPosition);
        }
    });
}

function DrawNotes() {
    notes.forEach(e => {
        let noteColor = noteColors[e.lane];
        ctx.fillStyle = `rgba(${noteColor.red}, ${noteColor.green}, ${noteColor.blue}, ${noteColor.alpha})`;
        DrawCircle(e.xPosition, e.yPosition, noteSize / 2, true);
    });
}

function DrawReceptor() {
    spawnXPositions.forEach(e => {
        if (drawSpawnPoints == true) {
            ctx.fillStyle = "turquoise"
            DrawSquare(e, spawnYPosition, 110)
        }
        ctx.lineWidth = receptorLineWidth;
        ctx.strokeStyle = "white";
        DrawCircle(e, perfectYpos, noteSize / 2, false)
    });
}

function GetStartNote(id) {
    return notes.find(n => n.id === id && !n.endNote)
}

function SpawnNote(lane, time) {
    notes.push(new Note(lane, time));
}

function SpawnHoldNote(lane, startTime, endTime) {
    let holdTime = endTime - startTime;
    notes.push(new HoldNote(lane, startTime, spawnYPosition, holdNoteId, holdTime, false));
    let endSpawnYPos = spawnYPosition - ((holdTime / 1000) * fallSpeed);
    notes.push(new HoldNote(lane, endTime, endSpawnYPos, holdNoteId, holdTime, true));
    holdNoteId++;
}

function DeleteNote(index) {
    let note = notes[index];
    switch (note.type) {
        case 0:
            notes.splice(index, 1);
            break;
        case 1:
            if (note.endNote) {
                notes.splice(index, 1);
                notes.splice(notes.indexOf(GetStartNote(note.id)), 1);
            }
            break;
    }
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

function SetSpawnXPositions() {
    let lanes = song.chart.lanes
    for (let i = 0; i < lanes; i++) {
        let index = i + 1;
        spawnXPositions.push((canvas.width / (lanes * 2)) * (index + (index - 1)));
    }
}

function Input(lane) {
    let [closestNoteIndex, leastTimeDifference] = GetClosestNoteIndex(lane);

    let note = notes[closestNoteIndex];

    if (closestNoteIndex < chartLength) {
        switch (note.type) {
            case 0:
                console.log(GetScore(Math.abs(leastTimeDifference)));
                DeleteNote(closestNoteIndex);
                break;
            case 1:
                if (!note.scored) {
                    console.log(GetScore(Math.abs(leastTimeDifference)));
                    note.scored = true;
                }
                break;
        }
    }
    interactable[lane] = false;
}

function ReleaseInput(lane){
    let [closestNoteIndex, leastTimeDifference] = GetClosestNoteIndex(lane);
    let note = notes[closestNoteIndex];

    if(closestNoteIndex < chartLength && note.type == 1 && note.endNote){
        DeleteNote(closestNoteIndex);
    }
}

//returns the closest note index and time difference from when the note is clicked and it's actual click time.
function GetClosestNoteIndex(lane) {
    let closestNoteIndex = Number.POSITIVE_INFINITY;
    let leastTimeDifference = Number.POSITIVE_INFINITY;

    notes.forEach((e, i) => {
        let timeDifference = e.time + offset - timeElapsed;
        let distance = perfectYpos - e.yPosition;
        //Some yummy conditions
        if (e.lane == lane && timeDifference < leastTimeDifference && distance >= smallestDist && timeDifference <= badRange) {
            leastTimeDifference = timeDifference;
            closestNoteIndex = i;
        }
    });

    return [closestNoteIndex, leastTimeDifference];
}

function GetScore(timeDifference) {
    return scoreTable.find((item) => timeDifference <= item.limit).label ?? "Unexpected time difference used: " + timeDifference;
}

function BindInput() {
    document.addEventListener("keydown", (event) => {
        const keyName = event.key;

        SendInput(keyName);

        if (keyName === "q") {
            if (!running) {
                Start();
                running = true;
            }
        }
    });

    function SendInput(keyName) {
        if (interactable[keys[keyName]]) {
            Input(keys[keyName]);
            keysHeld[keys[keyName]] = true;
        }
    }

    document.addEventListener("keyup", (event) => {
        KeyReleased(event.key);
    });

    function KeyReleased(keyName) {
        interactable[keys[keyName]] = true;
        keysHeld[keys[keyName]] = false;
        ReleaseInput(keys[keyName]);
    }
}