'use strict';

// Add listener that recieves the image with additional information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Listener initialized")
    console.log("message: ", message, " sender: ", sender, " sendResponse: ", sendResponse, " message.action: ", message.action, " message.filename:", message.filename)

    // chrome.tabs.query({ currentWindow: true, title: "Snapper Screenshot" }, function (tabs) {
    //     var tab = tabs[0];

    //     console.log("tab:", tab, "tab.url:", tab.url, " tab.id:", tab.id)
    // });

    if (message.action === "sendImageToNewTab") {
        console.log("in if in snapper-image")

        var image = document.getElementById("capture_image")
        var downloadButtonPNG = document.getElementById("download_png")

        console.log("image: ", image)

        // Scale down image
        // image.style.transform = 'scale(0.8)'

        // Set image source as base64 image
        image.src = message.image

        // Add zoom in/out when image clicked
        image.onclick = () => {
            console.log("image clicked")
            image.classList.contains('zoomed_in') ?
                image.classList.remove('zoomed_in') : image.classList.add('zoomed_in')
        }

        // Set href and download property on button to download image when clicked
        downloadButtonPNG.href = message.image
        downloadButtonPNG.download = message.filename

        sendResponse(JSON.stringify(message, null, 4) || true)

        // return true;
    }
})