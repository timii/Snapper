// Add listener that recieves the image with additional information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Listener initialized")
    console.log("message: ", message, " sender: ", sender, " sendResponse: ", sendResponse)

    var image = document.getElementById("capture_image")
    console.log("image: ", image)

    // Scale down image
    image.style.transform = 'scale(0.8)'
    
    image.src = message.image

    // Just for debugging
    sendResponse(JSON.stringify(message, null, 4) || true)

    return true;
})