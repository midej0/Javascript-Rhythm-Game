const baseConfig = { 
    "volume": 0.5, 
    "backgroundDim": 0.5, 
    "scrollSpeed": 10, 
    "highlightReceptor": true, 
    "drawEndNote": true, 
    "graphicsQuality": "High"
};

if(window.localStorage.getItem("config") == null){
    window.localStorage.setItem("config", JSON.stringify(baseConfig));
}

