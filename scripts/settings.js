const settingsMenu = document.getElementById("settingsMenu");
const volumeSlider = document.getElementById("volume");
const volumeText = document.getElementById("volumeText");
const backgroundDimSlider = document.getElementById("backgroundDim");
const backgroundDimText = document.getElementById("backgroundDimText");
const scrollSpeedSlider = document.getElementById("scrollSpeed");
const scrollSpeedText = document.getElementById("scrollSpeedText");
const highlightReceptorField = document.getElementById("highlightReceptor");
const drawEndNoteField = document.getElementById("drawEndNote");
const graphicsQualityField = document.getElementById("graphicsQuality");
const timeText = document.getElementById("timeText");
let defaultConfig;
let userConfig;

Setup();

async function Setup() {
    await GetDefaultConfig();
    if (typeof window.localStorage.getItem("config") == typeof defaultConfig) {
        window.localStorage.setItem("config", JSON.stringify(defaultConfig));
    }
    userConfig = JSON.parse(window.localStorage.getItem("config"));
    BindInput();
    UpdateSettingsMenuInputFields();
    UpdateSettingsText();
}

async function GetDefaultConfig() {
    try {
        let response = await fetch("defaultConfig.json");
        defaultConfig = await response.json();
    } catch (error) {
        console.log(error);
    }
}

function BindInput() {
    document.getElementById("settingsButton").addEventListener("click", _ => {
        OpenSettings();
    });

    document.getElementById("confirmButton").addEventListener("click", _ => {
        window.localStorage.setItem("config", JSON.stringify(userConfig));
        CloseSettings();
    });

    document.getElementById("resetButton").addEventListener("click", _ => {
        window.localStorage.setItem("config", JSON.stringify(defaultConfig));
        userConfig = JSON.parse(window.localStorage.getItem("config"));
        UpdateSettingsMenuInputFields();
        UpdateSettingsText();
    });

    volumeSlider.addEventListener("input", (e) => {
        userConfig.volume = parseFloat(e.target.value);
        UpdateSettingsText();
    });

    backgroundDimSlider.addEventListener("input", (e) => {
        userConfig.backgroundDim = parseFloat(e.target.value);
        UpdateSettingsText();
    });

    scrollSpeedSlider.addEventListener("input", (e) => {
        userConfig.scrollSpeed = parseFloat(e.target.value);
        UpdateSettingsText();
    });

    highlightReceptorField.addEventListener("input", (e) => {
        userConfig.highlightReceptor = e.target.checked;
    });

    drawEndNoteField.addEventListener("input", (e) => {
        userConfig.drawEndNote = e.target.checked;
    });

    graphicsQualityField.addEventListener("input", (e) => {
        userConfig.graphicsQuality = e.target.value;
    });
}

function OpenSettings() {
    settingsMenu.showModal();
    settingsMenu.classList.add("Active");
}

function CloseSettings(){
    settingsMenu.close()
    settingsMenu.classList.remove("Active");
}

function UpdateSettingsMenuInputFields() {
    volumeSlider.value = userConfig.volume;
    backgroundDimSlider.value = userConfig.backgroundDim;
    scrollSpeedSlider.value = userConfig.scrollSpeed;
    highlightReceptorField.checked = userConfig.highlightReceptor;
    drawEndNoteField.checked = userConfig.drawEndNote;
    graphicsQualityField.value = userConfig.graphicsQuality;
}

function UpdateSettingsText() {
    volumeText.textContent = `${Math.round(userConfig.volume * 100)}%`;
    backgroundDimText.textContent = `${Math.round(userConfig.backgroundDim * 100)}%`;
    scrollSpeedText.textContent = userConfig.scrollSpeed;
    timeText.textContent = `${Math.round(2095 - (95 * userConfig.scrollSpeed))}ms`;
}