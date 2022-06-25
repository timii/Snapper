// Send image to tab using the currentTabId
function sendImageToNewTab(data, currentTabId, currentTabIndex) {
    // Create new tab to place the create screenshot in 
    chrome.tabs.create({ active: false, url: 'snapper-image.html', openerTabId: currentTabId, index: currentTabIndex + 1 })

    // Send the image after 1 second timeout, so the html and the listener is set up in the new tab
    setTimeout(() => {
        let newTabId
        // console.log("data: ", data, " currentTabId: ", currentTabId, " currentTabIndex: ", currentTabIndex)
        chrome.runtime.sendMessage(data, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (snapper-image.js)!")
            }
            return true;
        })

        // Get id of the new tab
        chrome.tabs.query({ index: currentTabIndex + 1 }, (tabs) => {
            // console.log("tabs: ", tabs)
            // console.log("tabs[0]: ", tabs[0])
            var newTab = tabs[0]
            newTabId = newTab.id

            // Manually change to the newly created tab
            chrome.tabs.update(newTabId, { active: true, highlighted: true })
        })
    }, 100)
}

// Function that sends as message to the content script (content.js) to create an overlay for selecting the custom area
function openOverlayInCurrentTab(currentTab, dataURI) {
    setTimeout(() => {
        chrome.tabs.sendMessage(currentTab.id, { imageURI: dataURI, currentTab: currentTab }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content.js)!")
            }

            return true;
        });
    }, 100)
}

// Listen to content script to call sendImageToNewTab()
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension");

    console.log("message: ", message, " sendeR: ", sender)

    // Call sendImageToNewTab() with the new screenshot of the selected area
    sendImageToNewTab(message.data, message.currentTabId, message.currentTabIndex)

    sendResponse(JSON.stringify(message, null, 4) || true)

    return true;
})