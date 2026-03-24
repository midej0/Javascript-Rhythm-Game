let song;

async function GetSong(songPath) {
    try{
        let response = await fetch(songPath);
        song = await response.json();
    }catch(error){
        console.log(error);
    }
}

export async function Setup(songPath){
    await GetSong(songPath);
    console.log(song.songInfo.backgroundImage);
    HideMainMenu();
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5  )), url(' + song.songInfo.backgroundImage + ')';
}

function HideMainMenu(){
    document.getElementById("header").style.display = "none";
    document.getElementById("footer").style.display = "none";
    let songCards = document.getElementsByClassName("songCard");
    for(let i = 0; i < songCards.length; i++){
        songCards[i].style.display = "none";
    }
}

function ShowMainMenu(){
    document.getElementById("header").style.display = "block";
    document.getElementById("footer").style.display = "block";
    let songCards = document.getElementsByClassName("songCard");
    for(let i = 0; i < songCards.length; i++){
        songCards[i].style.display = "flex";
    }
}