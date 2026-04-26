const baseConfig = { 
    "volume": 0.5, 
    "backgroundDim": 0.5, 
    "scrollSpeed": 5, 
    "highlightReceptor": true, 
    "drawEndNote": true, 
    "graphicsQuality": "high"
};

/* if(window.localStorage.getItem("config") == null){
    window.localStorage.setItem("config", JSON.stringify(baseConfig));
} */

window.localStorage.setItem("config", JSON.stringify(baseConfig));

const settingsButton = document.getElementById("settingsButton");
const settingsPopup = document.getElementById("settingsPopup");
const volumeSlider = document.getElementById("volume");
const volumeText = document.getElementById("volumeText");
const backgroundDimSlider = document.getElementById("backgroundDim");
const backgroundDimText = document.getElementById("backgroundDimText");
const scrollSpeedSlider = document.getElementById("scrollSpeed");
const scrollSpeedText = document.getElementById("scrollSpeedText");
const highlightReceptorField = document.getElementById("highlightReceptor");
const drawEndNoteField = document.getElementById("drawEndNote");
const graphicsQualityField = document.getElementById("graphicsQuality");
let settingsOpen = false;
let userConfig = JSON.parse(window.localStorage.getItem("config"));

/*Binds all the inputs*/
settingsButton.addEventListener("click", _ =>{
    if(settingsOpen){
        CloseSettings();
    }else{
        OpenSettings();
    }
});

volumeSlider.addEventListener("input", (e) => {
    userConfig.volume = e.target.value;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
    UpdateSettingsText();
});

backgroundDimSlider.addEventListener("input", (e) => {
    userConfig.backgroundDim = e.target.value;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
    UpdateSettingsText();
});

scrollSpeedSlider.addEventListener("input", (e) => {
    userConfig.scrollSpeed = e.target.value;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
    UpdateSettingsText();
});

highlightReceptorField.addEventListener("input", (e) => {
    userConfig.highlightReceptor = e.target.checked;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
});

drawEndNoteField.addEventListener("input", (e) => {
    userConfig.drawEndNote = e.target.checked;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
});

graphicsQualityField.addEventListener("input", (e) => {
    userConfig.graphicsQuality = e.target.value;
    window.localStorage.setItem("config", JSON.stringify(userConfig));
});

UpdateSettingsMenuInputFields();
UpdateSettingsText();

function OpenSettings(){
    settingsOpen = true;
    settingsPopup.classList.add("Active");
}

function CloseSettings(){
    settingsOpen = false;
    settingsPopup.classList.remove("Active");
}

function UpdateSettingsMenuInputFields(){
    volumeSlider.value = userConfig.volume;
    backgroundDimSlider.value = userConfig.backgroundDim;
    scrollSpeedSlider.value = userConfig.scrollSpeed;
    highlightReceptorField.checked = userConfig.highlightReceptor;
    drawEndNoteField.checked = userConfig.drawEndNote;
    graphicsQualityField.value = userConfig.graphicsQuality;
}

function UpdateSettingsText(){
    volumeText.textContent = `${Math.round(userConfig.volume * 100)}%`;
    backgroundDimText.textContent = `${Math.round(userConfig.backgroundDim * 100)}%`;
    scrollSpeedText.textContent = userConfig.scrollSpeed;
}