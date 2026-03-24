let song;
let spawnXPositions = [];
let spawn

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



function DrawSquare(x, y, size) {
    ctx.fillRect(x - (size / 2), y - (size / 2), size, size);
}

async function GetSong(songPath) {
    try {
        let response = await fetch(songPath);
        song = await response.json();
    } catch (error) {
        console.log(error);
    }
}

async function Setup(songPath) {
    await GetSong(songPath);
    console.log(song.songInfo.backgroundImage);
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + song.songInfo.backgroundImage + ')';
    SetSpawnYPositions()
    spawnXPositions.forEach((e) => {
        DrawSquare(e, 50, 50);
    });
}

function SetSpawnXPositions() {
    let lanes = song.chart.lanes
    console.log(lanes);
    for (let i = 0; i < lanes; i++) {
        let index = i + 1;
        spawnXPositions.push((canvas.width / (lanes * 2)) * (index + (index - 1)));
    }
}