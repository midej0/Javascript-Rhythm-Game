let songList;
let container = document.getElementById("container");
let audio;
let currentAudio;
let currentStartTime;
let currentEndTime;

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
        songInfo = songInfo.songInfo;
        CreateSongCard(songInfo.image, songInfo.name, songInfo.artist, songInfo.audio, songInfo.previewStart, songInfo.previewEnd,songInfo.backgroundImage);
    } catch (error) {
        console.error(error);
    }
}

function CreateSongCard(imagePath, songName, artistName, audioPath, previewStart, previewEnd, backgroundImagePath) {
    let songCard = document.createElement("div");
    songCard.classList.add("songCard");
    songCard.style.backgroundImage += 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(' + backgroundImagePath + ')';
    songCard.addEventListener("mouseover", (e) =>{
        PlaySongPreview(audioPath, previewStart, previewEnd);
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

function PlaySongPreview(audioPath, startTime, endTime){
    if(audio != undefined){
        if(currentAudio != audioPath){
            audio.pause();
            audio = new Audio(audioPath);
            audio.currentTime = startTime;
            audio.volume = 0.1;
            audio.play();
            currentAudio = audioPath;
            currentStartTime = startTime;
            currentEndTime = endTime;
        }
    }else{
        audio = new Audio(audioPath);
        currentAudio = audioPath;
        audio.currentTime = startTime;
        audio.volume = 0.1;
        audio.play();
        currentAudio = audioPath;
        currentStartTime = startTime;
        currentEndTime = endTime;
    }  
}