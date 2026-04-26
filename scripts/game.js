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

//The pixel sizes for the canvas based on graphicsQuality in the user config
const qualities = Object.freeze({
    "High": [900, 1600],
    "Medium": [450, 800],
    "Low": [225, 400]
});

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("gl-canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

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
let finishTimeOffset = 1000;
let finishTime;

//Cosmetics
const noteColors = [
    new RGBA(26.0, 44.0, 121.0, 1.0),
    new RGBA(232.0, 5.0, 102.0, 1.0),
    new RGBA(255.0, 141.0, 104.0, 1.0),
    new RGBA(244.0, 234.0, 188.0, 1.0)
];
//This is easier to implement but assumes the canvas is always 9:16
const baseHeight = 1600;
const heightMult = canvas.height / baseHeight;
const receptorColor = new RGBA(255.0, 255.0, 255.0, 1);
const scoringTextColor = new RGBA(255.0, 255.0, 255.0, 1.0);
let highlightReceptor = true;
let backgroundDim = 1;
let receptorLineWidth = 15 * heightMult;
let baseTextSize = 90 * heightMult;
let bigTextSize = 120 * heightMult;
let textSizeDecreaseSpeed = 70 * heightMult;
let gradeTextOffset = 87.5 * heightMult;
let comboSizeFactor = 1;
let comboTextYPosition = 500 * heightMult;
let textSize;

//Notes
let spawnXPositions = [];
let notes = [];
let spawnYPosition = -50 * heightMult;
let perfectYpos = 1400 * heightMult;
let noteSize = 175 * heightMult;
// filip speed 3000
let fallSpeed = 2000 * heightMult;
//Smallest dist is the maximum amount of pixels a note can be behind the perfectYpos before it is ignored.
let smallestDist = -noteSize;
let timeToPerfect = ((perfectYpos - spawnYPosition) / fallSpeed) * 1000;
//The id of the hold notes, lets the beginning and end portions of a hold note know where they are.
let holdNoteId = 0;

//Scoring 
//In milliseconds deviated from the time the note is supposed to be clicked
let perfectRange = 50;
let greatRange = 75;
let okayRange = 100;
let missRange = 150;
let scoreTable = [
    { limit: perfectRange, label: "Perfect", amount: 0, score: 300 },
    { limit: greatRange, label: "Great", amount: 0, score: 200 },
    { limit: okayRange, label: "Okay", amount: 0, score: 100 },
    { limit: missRange, label: "Miss", amount: 0, score: 0 }
]
let lastGrade = "";
let combo = 0;
let maxCombo = 0;
let score = 0;

//Input
let inputBlocked = false;
let inputStoredTime = 750;
let inputsToTrigger = 10;
//time with no missed inputs to reset the block timer
let unblockTime = 250;
let lastBlockTriggerTime;
let inputs = [];
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

if (ctx == null) {
    alert("Your Device Doesn't Support The 2D WebGL Rendering Context");
    window.location = "index.html";
}

Setup(localStorage.getItem("selectedSong"));

async function Setup(songPath) {
    await GetSong(songPath);
    chart = song.chart.notes;
    chartLength = chart.length;
    finishTime = (chart[chartLength - 1].type == 0) ? chart[chartLength - 1].time + finishTimeOffset : chart[chartLength - 1].endTime + finishTimeOffset;
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
    UpdateTimeHeld();
    TickInputTimers();
    TickSpawning();
    TickNotes();
    TickDeletion();
    TickRatingText();
    DrawCanvas();

    if (timeElapsed >= finishTime) {
        TriggerFinishPopup();
    }

    if (running) {
        window.requestAnimationFrame(Tick);
    }
}

function TriggerFinishPopup() {
    //Used this instead of chartLength because chartlength only has one value for hold notes while two values are used when scoring hold notes
    let totalNotes = scoreTable.reduce((sum, item) => sum + item.amount, 0);
    let accuracyListChildren = document.getElementById("AccuracyList").children;

    document.getElementById("ScoreText").textContent = `Score: ${score}`;
    document.getElementById("MaxComboText").textContent = (maxCombo == totalNotes) ? `Full Combo!` : `Max Combo: ${maxCombo}`;

    for (let i = 0; i < accuracyListChildren.length; i++) {
        accuracyListChildren[i].textContent = `${scoreTable[i].label}: ${(scoreTable[i].amount / totalNotes == 1) ? scoreTable[i].amount / totalNotes * 100 : (scoreTable[i].amount / totalNotes * 100).toFixed(2)}%`;
    }

    running = false;
    document.getElementById("FinishScreen").classList.add("Active");
}

function UpdateTime() {
    lastTime = timeElapsed ?? 0;
    timeElapsed = Date.now() - programStart;
    deltaTime = (timeElapsed - lastTime) / 1000;
}

function UpdateTimeHeld() {
    for (let i = 0; i < timeHeld.length; i++) {
        if (shouldCount[i] && keysHeld[i]) {
            timeHeld[i] += deltaTime * 1000;
        }
    }
}

function TickInputTimers() {
    for (let i = 0; i < inputs.length; i++) {
        inputs[i] -= deltaTime * 1000;
        if (inputs[i] <= 0) {
            inputs.splice(i, 1);
        }
    }
    if (timeElapsed >= lastBlockTriggerTime + unblockTime && inputBlocked) {
        inputBlocked = false;
        inputs.splice(0, inputs.length);
    }
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
        if (!e.endNote && !e.scored && e.yPosition >= perfectYpos - smallestDist && e.type == 1) {
            shouldCount[e.lane] = true;
            e.scored = true;
            ChangeGrade("Miss");
        }
    });
}

function TickDeletion() {
    notes.forEach((e, i) => {
        if (e.yPosition >= canvas.height + (noteSize / 2) && !e.scored) {
            ChangeGrade("Miss");
            DeleteNote(i);
        }
    });
}

function TickRatingText() {
    if (textSize > baseTextSize) {
        textSize -= textSizeDecreaseSpeed * deltaTime;
    }
    textSize = (textSize < baseTextSize) ? baseTextSize : textSize;
}

function DrawCanvas() {
    //Clears the canvas
    canvas.width = canvas.width;

    DrawHoldConnector();
    DrawNotes();
    DrawReceptor();
    DrawText();

    if (drawBadRange && drawScoringRanges) {
        ctx.fillStyle = "rgba(255.0, 255.0, 255.0, 0.5)";
        ctx.fillRect(0, perfectYpos - (missRange / 1000) * fallSpeed, canvas.width, (missRange / 1000) * fallSpeed * 2);
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

            ctx.fillStyle = `rgba(${color.red * 0.6}, ${color.green * 0.6}, ${color.blue * 0.6}, ${color.alpha * 0.9})`;

            if (GetStartNote(e.id).scored && keysHeld[e.lane] && e.yPosition < perfectYpos - smallestDist / 2 && !inputBlocked) {
                ctx.fillRect(e.xPosition - (noteSize / 2), e.yPosition, noteSize, perfectYpos - e.yPosition);
                //draws a half circle so it doesn't overlap with the connector.
                ctx.beginPath();
                ctx.arc(e.xPosition, perfectYpos, noteSize / 2, 0, Math.PI);
                ctx.fill();
            } else {
                ctx.fillRect(e.xPosition - (noteSize / 2), e.yPosition, noteSize, startYPosition - e.yPosition);
            }
        }
    });
}

function DrawNotes() {
    notes.forEach(e => {
        let noteColor = noteColors[e.lane];
        ctx.fillStyle = `rgba(${noteColor.red}, ${noteColor.green}, ${noteColor.blue}, ${noteColor.alpha})`;
        if (!e.scored) {
            DrawCircle(e.xPosition, e.yPosition, noteSize / 2, true);
        }
    });
}

function DrawReceptor() {
    spawnXPositions.forEach((e, i) => {
        if (drawSpawnPoints == true) {
            ctx.fillStyle = "turquoise"
            DrawSquare(e, spawnYPosition, 110)
        }

        ctx.lineWidth = receptorLineWidth;
        ctx.strokeStyle = `rgba(${receptorColor.red}, ${receptorColor.green}, ${receptorColor.blue}, ${(keysHeld[i] || !highlightReceptor) ? receptorColor.alpha : receptorColor.alpha * 0.5})`;
        DrawCircle(e, perfectYpos, noteSize / 2, false)
    });
}

function DrawText() {
    ctx.fillStyle = `rgba(${scoringTextColor.red}, ${scoringTextColor.green}, ${scoringTextColor.blue}, ${scoringTextColor.alpha})`;
    ctx.font = `${textSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(lastGrade, canvas.width / 2, (perfectYpos - (noteSize / 2)) - gradeTextOffset);
    if (combo > 0) {
        ctx.font = `${textSize * comboSizeFactor}px sans-serif`;
        ctx.fillText(combo, canvas.width / 2, comboTextYPosition);
    }
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
                shouldCount[note.lane] = false;
                timeHeld[note.lane] = 0;
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

    if (closestNoteIndex < Number.POSITIVE_INFINITY && !inputBlocked) {
        switch (note.type) {
            case 0:
                ChangeGrade(GetScore(Math.abs(leastTimeDifference)));
                DeleteNote(closestNoteIndex);
                break;
            case 1:
                if (!note.scored) {
                    shouldCount[note.lane] = true;
                    ChangeGrade(GetScore(Math.abs(leastTimeDifference)));
                    note.scored = true;
                }
                break;
        }
    } else {
        inputs.push(inputStoredTime);
        if (inputs.length >= inputsToTrigger) {
            inputBlocked = true;
            lastBlockTriggerTime = timeElapsed;
        }
    }
    interactable[lane] = false;
}

function ReleaseInput(lane) {
    let [closestNoteIndex, leastTimeDifference] = GetClosestNoteIndex(lane);
    let note = notes[closestNoteIndex];

    if (closestNoteIndex < Number.POSITIVE_INFINITY && note.type == 1 && note.endNote) {
        ChangeGrade(GetScore(Math.abs(note.holdTime - timeHeld[note.lane])));
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
        if (e.lane == lane && timeDifference < leastTimeDifference && distance >= smallestDist && timeDifference <= missRange) {
            leastTimeDifference = timeDifference;
            closestNoteIndex = i;
        }
    });

    return [closestNoteIndex, leastTimeDifference];
}

function ChangeGrade(grade) {
    lastGrade = grade;
    combo += 1;
    combo = (grade == "Okay" || grade == "Miss") ? 0 : combo;
    maxCombo = (combo > maxCombo) ? combo : maxCombo;
    scoreTable.find((item) => grade == item.label).amount++;
    score += scoreTable.find((item) => grade == item.label).score;
    textSize = bigTextSize;
}

function GetScore(timeDifference) {
    if (timeDifference >= missRange) {
        return "Miss";
    }
    return scoreTable.find((item) => timeDifference <= item.limit).label;
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

    document.addEventListener("keyup", (event) => {
        KeyReleased(event.key);
    });

    document.getElementById("MainMenuButton").addEventListener("click", _ => {
        window.location = "index.html"
    });

    document.getElementById("RetryButton").addEventListener("click", _ => {
        window.location = "game.html"
    });
}

function SendInput(keyName) {
    if (interactable[keys[keyName]]) {
        Input(keys[keyName]);
        keysHeld[keys[keyName]] = true;
    }
}

function KeyReleased(keyName) {
    interactable[keys[keyName]] = true;
    keysHeld[keys[keyName]] = false;
    if (!inputBlocked) {
        ReleaseInput(keys[keyName]);
    }
}