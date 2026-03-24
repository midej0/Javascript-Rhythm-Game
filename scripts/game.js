let song;

async function GetSong(songPath) {
    try{
        let response = await fetch(songPath);
        song = await response.json();
    }catch(error){
        console.log(error);
    }
}

async function Setup(songPath){
    await GetSong(songPath);
    console.log(song.songInfo.backgroundImage);
    document.getElementById("main").style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + song.songInfo.backgroundImage + ')';
}

Setup(localStorage.getItem("selectedSong"));