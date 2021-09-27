function sendImageToNewTab(data) {
    // Send the image after 1 second timeout, so the html and the listener is set up in the new tab
    setTimeout(() => {
        console.log("data: ", data)
        chrome.runtime.sendMessage(data, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has been sent!")
            }
            return true;
        })
    }, 100)
}