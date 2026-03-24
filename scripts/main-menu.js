let songList;
let container = document.getElementById("container");
let audio = new Audio();
let currentAudio;

GetSongList();

async function GetSongList() {
    try {
        let response = await fetch("songs/song-list.json");
        songList = await response.json();
        songList = songList.songList;
        songList.forEach(element => {
            GetSongInfo(element);
        });
    } catch (error) {
        console.error(error);
    }
}

async function GetSongInfo(songPath) {
    try {
        let response = await fetch(songPath);
        let songInfo = await response.json();
        songInfo = songInfo.songInfo
        CreateSongCard(songInfo.image, songInfo.name, songInfo.artist, songInfo.audio, songInfo.previewStart, songInfo.previewEnd, songInfo.backgroundImage, songPath);
    } catch (error) {
        console.error(error);
    }
}

function CreateSongCard(imagePath, songName, artistName, audioPath, previewStart, previewEnd, backgroundImagePath, songPath) {
    let songCard = document.createElement("div");
    songCard.classList.add("songCard");
    songCard.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(' + backgroundImagePath + ')';

    songCard.addEventListener("mouseover", (e) => {
        PlaySongPreview(audioPath, previewStart, previewEnd);
    });
    songCard.addEventListener("click", (e) => {
        localStorage.setItem("selectedSong", songPath);
        location = "game.html";
    });

    let image = document.createElement("img");
    image.setAttribute("src", imagePath);

    let names = document.createElement("div");
    names.classList.add("names");

    let songTitle = document.createElement("h2");
    songTitle.textContent = songName;

    let artistTitle = document.createElement("p");
    artistTitle.textContent = artistName;

    names.appendChild(songTitle);
    names.appendChild(artistTitle);

    songCard.appendChild(image);
    songCard.appendChild(names);

    container.appendChild(songCard);
}

function PlaySongPreview(audioPath, startTime, endTime) {
    if (currentAudio != audioPath) {
        audio.pause();
        LoopPreview(startTime, endTime);
        audio = new Audio(audioPath);
        LoopPreview(startTime, endTime);
        audio.volume = 0.1;
        currentAudio = audioPath;
        audio.currentTime = startTime;
        audio.play();
    }
}

function LoopPreview(startTime, endTime) {
    audio.ontimeupdate = function () {
        if (audio.currentTime >= endTime/1000) {
            audio.currentTime = startTime/1000;
        }
    }
}