// Add listener that recieves the image with additional information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Listener initialized")
    console.log("message: ", message, " sender: ", sender, " sendResponse: ", sendResponse, " message.action: ", message.action)

    // chrome.tabs.query({ currentWindow: true, title: "Snapper Screenshot" }, function (tabs) {
    //     var tab = tabs[0];

    //     console.log("tab:", tab, "tab.url:", tab.url, " tab.id:", tab.id)
    // });

    if (message.action === "sendImageToNewTab") {
        console.log("in if in snapper-image")

        var image = document.getElementById("capture_image")

        console.log("image: ", image)

        // Scale down image
        // image.style.transform = 'scale(0.8)'

        image.src = message.image

        // Just for debugging
        sendResponse(JSON.stringify(message, null, 4) || true)

        // return true;
    }
})