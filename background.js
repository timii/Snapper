// Function to send an image + additional information to a new tab
async function sendImageToNewTab(data, currentTabId, currentTabIndex) {

    // Create new tab to place the create screenshot in
    const createdTabPromise = createTab(currentTabId, currentTabIndex)

    // Run when promise is fulfilled (content script on new tab loaded)
    createdTabPromise.then(createdTab => {

        // Workaround to fix the bug where 2 tabs are created after selecting a custom area to screenshot
        // TODO: Replace with better solution for the bug
        // Go through all tabs matching the url and close everyone that doesn't match the id of the created tab & and the index is bigger than the current tab index + 2
        chrome.tabs.query({ currentWindow: true, url: "chrome-extension://dfofdengbpakahfhbfdoeicpecgbldco/snapper-image.html" }, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].id !== createdTab.id && tabs[i].index > currentTabIndex + 1) {
                    chrome.tabs.remove(tabs[i].id)
                }
            }
        });

        data.action = "sendImageToNewTab"

        // Send the image + additional information to the newly created tab
        chrome.tabs.sendMessage(createdTab.id, data, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (snapper-image.js): Image has been sent to the new tab")

                // Manually change to the newly created tab
                chrome.tabs.update(createdTab.id, { active: true, highlighted: true })
            }

        })
    })

}

// Function to asynchronously create a new tab and return created tab after its content script is loaded
function createTab(currentTabId, currentTabIndex) {
    console.info("createTab() called!")
    return new Promise(resolve => {
        chrome.tabs.create({ active: false, url: 'snapper-image.html', openerTabId: currentTabId, index: currentTabIndex + 1 }, async createdTab => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                console.log("not complete!")
                if (info.status === "complete" && tabId === createdTab.id) {
                    console.log("complete!")
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve(createdTab);
                }
            })
        })
    })
}

// Function that sends as message to the content script (content.js) to create an overlay for selecting the custom area
function openOverlayInCurrentTab(currentTab, dataURI) {
    chrome.tabs.sendMessage(currentTab.id, { imageURI: dataURI, currentTab: currentTab }, (responseCallback) => {
        if (responseCallback) {
            console.log("Message has reached the recipient (content.js): Sent message to content script to create an overlay to select a custom area to screenshot")
        }

        return true;
    });
}

// Function to listen to content script to call sendImageToNewTab()
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only call sendImageToNewTab() if the message was sent for the background script
    if (message.data.action === "sendToBackground") {

        // Call sendImageToNewTab() with the new screenshot of the selected area
        sendImageToNewTab(message.data, message.currentTabId, message.currentTabIndex)

        sendResponse(JSON.stringify(message, null, 4) || true)

        // return true;
    }
})