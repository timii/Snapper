'use strict';

// Function to send an image + additional information to a new tab
async function sendImageToNewTab(data, currentTabId, currentTabIndex, filename) {

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

        // Add action and filename to data object
        data.action = "sendImageToNewTab"
        console.log("filename:", filename)
        data.filename = filename;

        // Send the image + additional information to the newly created tab
        chrome.tabs.sendMessage(createdTab.id, data, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (snapper-image.js): Image has been sent to the new tab")

                // Manually change to the newly created tab
                // chrome.tabs.update(createdTab.id, { active: true, highlighted: true })
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

// Function that sends as message to the content script for the custom area (content-custom-area.js) to create an overlay for selecting the custom area
function openOverlayInCurrentTab(currentTab, dataURI, filename) {
    chrome.tabs.sendMessage(currentTab.id, { imageURI: dataURI, currentTab: currentTab, filename: filename, action: "createCustomAreaScreenshot" }, (responseCallback) => {
        if (responseCallback) {
            console.log("Message has reached the recipient (content-custom-area.js): Sent message to content script to create an overlay to select a custom area to screenshot")
        }

        return true;
    });
}

// Function to listen to custom area content script to call sendImageToNewTab()
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only call sendImageToNewTab() if the message was sent for the background script
    if (message.data.action === "sendCustomAreaScreenshot") {

        // Call sendImageToNewTab() with the new screenshot of the selected area
        sendImageToNewTab(message.data, message.currentTabId, message.currentTabIndex, message.filename)

        sendResponse(JSON.stringify(message, null, 4) || true)

        // return true;
    }
})

// Function that sends as message to the content script for the full page (content-full-page.js) to create a screenshot of the full page
function initiateFullPageScreenshot(currentTab, filename) {
    console.log("createFullPageScreenshot() currentTab", currentTab, " filename:", filename)

    chrome.tabs.sendMessage(currentTab.id, { currentTab: currentTab, filename: filename, action: "createFullPageScreenshot" }, (responseCallback) => {
        if (responseCallback) {
            console.log("responseCallback:", responseCallback)
            console.log("Message has reached the recipient (content-full-page.js): Sent message to content script to create a full page screenshot")

            captureFullPageScreenshots(responseCallback)
        }

    });
}

// Function to start the process of capturing the full page screenshots
async function captureFullPageScreenshots(screenshotInfo) {
    console.log("captureFullPageScreenshots -> screenshotInfo:", screenshotInfo)
    console.log("screenshotAmount:", screenshotInfo.screenshotAmount)

    var screenshotsArray = []

    await sendMessageToResetScrolling("resetScrolling", screenshotInfo.currentTab)

    // Capture as many screenshots needed to capture the whole page
    for (let i = 0; i < screenshotInfo.screenshotAmount; i++) {
        console.log("in for -> i:", i)

        // Capture screenshot and wait 1 second between each screenshot to bypass the "MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND" error
        await captureTab().then(async (createdScreenshot) => {

            console.log("createdScreenshot:", createdScreenshot)
            console.log("screenshotsArray before:", screenshotsArray)
            // Store the created screenshot into the array of all screenshots
            screenshotsArray.push(createdScreenshot)
            console.log("screenshotsArray after:", screenshotsArray)

            console.log("windowHeight:", screenshotInfo.windowHeight)

            // Send message to full page content script to scroll down
            await sendMessageToScrollDown("scrollDownPage", screenshotInfo.windowHeight, screenshotInfo.currentTab)
        })


        // Cut away part of last screenshot
        // Append images together
        // Send to new tab

    }
}

// Function to asynchronously capture the currently visible part of the active tab
async function captureTab() {
    return new Promise(resolve => {
        setTimeout(() => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, async dataURL => {
                console.log("in captureVisibleTab")
                if (dataURL) {
                    // console.log("dataURL:", dataURL)
                    resolve(dataURL)
                }
            })
        }, 1000)
    })
}

// Function to call the full page content script to scroll down by the value widnowHeight
async function sendMessageToScrollDown(action, windowHeight, currentTab) {
    console.log("action:", action, " windowHeight:", windowHeight, " currentTab:", currentTab)
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action, windowHeight: windowHeight }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): Sent message to content script to scroll down by ")
                resolve()
            }

        });
    })
}

// Function to call the full page content script to reset the scrolling on the currently active tab
async function sendMessageToResetScrolling(action, currentTab) {
    console.log("action:", action, " currentTab:", currentTab)
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): Reset scroll position to the top")
                resolve()
            }

        });
    })
}