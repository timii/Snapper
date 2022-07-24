'use strict';

// Add listener that recieves the image with additional information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendImageToNewTab") {

        var image = document.getElementById("capture_image")
        var downloadButtonPNG = document.getElementById("download_png")

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

        return true;
    }
})