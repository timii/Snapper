'use strict';

// Function to send an image + additional information to a new tab
async function sendImageToNewTab(data, currentTabId, currentTabIndex, filename) {

    // Create new tab to place the created screenshot in
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
        data.filename = filename;

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
    return new Promise(resolve => {
        chrome.tabs.create({ active: false, url: 'snapper-image.html', openerTabId: currentTabId, index: currentTabIndex + 1 }, async createdTab => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (info.status === "complete" && tabId === createdTab.id) {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve(createdTab);
                }
            })
        })
    })
}

// Function that initiates the process of creating a custom area screenshot
async function initiateCustomAreaScreenshot(currentTab, filename) {

    // Hide scrollbar before capturing the tab to avoid showing the scrollbar in the selection area
    await sendMessageToToggleScrollbar("hideScrollbar", currentTab)

    // Capture visible tab to draw the selection area over
    await captureTab(100).then(async (createdScreenshot) => {

        if (createdScreenshot) {
            // Send message to the custom area content script to display overlay
            chrome.tabs.sendMessage(currentTab.id, { imageURI: createdScreenshot, currentTab: currentTab, filename: filename, action: "createCustomAreaScreenshot" }, (responseCallback) => {
                if (responseCallback) {
                    console.log("Message has reached the recipient (content-custom-area.js): Sent message to content script to create an overlay to select a custom area to screenshot")
                }
            });
        }
    })
}

// Function to listen to the custom area content script (content-custom-area.js) to send the custom area image to the new tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.data.action === "sendCustomAreaScreenshot") {
        // Call sendImageToNewTab() with the new screenshot of the selected area
        sendImageToNewTab(message.data, message.currentTabId, message.currentTabIndex, message.filename)

        sendResponse(JSON.stringify(message, null, 4) || true)
    }
})

// Function that sends a message to the full page content script (content-full-page.js) to get the needed information about the current page (e.g: window height, how many screenshots need to be taken, how much of the last screenshot needs to be cut off)
function initiateFullPageScreenshot(currentTab, filename) {
    chrome.tabs.sendMessage(currentTab.id, { currentTab: currentTab, filename: filename, action: "createFullPageScreenshot" }, (screenshotInfo) => {
        if (screenshotInfo) {
            console.log("Message has reached the recipient (content-full-page.js): Sent message to content script to create a full page screenshot")

            captureFullPageScreenshots(screenshotInfo)
        }

    });
}

// Function to start the process of capturing the full page screenshots
async function captureFullPageScreenshots(screenshotInfo) {
    var screenshotsArray = []

    // Get current scroll position on the page and reset it to 0
    const currentScrollPostition = await sendMessageToResetScrolling("resetScrolling", screenshotInfo.currentTab)

    // Hide the scrollbar while taking screenshots
    await sendMessageToToggleScrollbar("hideScrollbar", screenshotInfo.currentTab)

    // Capture as many screenshots needed to capture the whole page
    for (let i = 0; i < screenshotInfo.screenshotAmount; i++) {

        // Capture screenshot and wait 1 second between each screenshot to bypass the "MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND" error
        await captureTab(1000).then(async (createdScreenshot) => {

            // Save the created screenshot in the array of all screenshots
            screenshotsArray.push(createdScreenshot)

            // Set fixed and sticky elements to static after the first screenshot to only show them in the first image
            if (i === 0) {
                await sendMessageToToggleStickyAndFixedElements("setStatic", screenshotInfo.currentTab)
            }

            // Send message to full page content script (content-full-page.js) to scroll down
            await sendMessageToScrollDown("scrollDownPage", screenshotInfo.windowHeight, screenshotInfo.currentTab, screenshotInfo.filename)
        })
    }

    // Reset fixed and sticky elements after all screenshots have been taken
    await sendMessageToToggleStickyAndFixedElements("resetToStickyAndFixed", screenshotInfo.currentTab)

    // Show the scrollbar again after all the screenshots have been taken
    await sendMessageToToggleScrollbar("showScrollbar", screenshotInfo.currentTab)

    // Send the array of screenshots + additional information to the full page content script (content-full-page.js) to draw all the screenshots into one big canvas
    await sendMessageToCreateFullPageCanvas("createFullPageCanvas", screenshotInfo.currentTab, { screenshotsArray: screenshotsArray, cutoffPercent: screenshotInfo.cutoffPercent, windowHeight: screenshotInfo.windowHeight, bodyHeight: screenshotInfo.bodyHeight, filename: screenshotInfo.filename, startScrollPosition: currentScrollPostition })
}

// Function to asynchronously capture the currently visible part of the active tab and return the screenshot
async function captureTab(timeout) {
    return new Promise(resolve => {
        setTimeout(() => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, async dataURL => {
                if (dataURL) {
                    resolve(dataURL)
                }
            })
        }, timeout)
    })
}

// Function to call the full page content script to scroll down by the value widnowHeight
async function sendMessageToScrollDown(action, windowHeight, currentTab) {
    console.log("action:", action, " windowHeight:", windowHeight, " currentTab:", currentTab)
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action, windowHeight: windowHeight }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): Sent message to content script to scroll down by ", windowHeight)
                resolve()
            }

        });
    })
}

// Function to call the full page content script (content-full-page.js) to reset the scrolling on the currently active tab
async function sendMessageToResetScrolling(action, currentTab) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): Reset scroll position to the top")
                resolve(responseCallback === true ? 0 : responseCallback)
            }

        });
    })
}

// Function to call the full page content script (content-full-page.js) to hide/show the scrollbar
async function sendMessageToToggleScrollbar(action, currentTab) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): ", action === "hideScrollbar" ? "Hide" : "Show", " the scrollbar")
                resolve()
            }

        });
    })
}

// Function to call the full page content script (content-full-page.js) to set/reset fixed and sticky elements
async function sendMessageToToggleStickyAndFixedElements(action, currentTab) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): ", action === "setStatic" ? "Set fixed/sticky elements position to static" : "Reset to fixed/sticky elements")
                resolve()
            }

        });
    })
}

// Function to call the full page content script (content-full-page.js) to draw all the screenshots into one big canvas
async function sendMessageToCreateFullPageCanvas(action, currentTab, args) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(currentTab.id, { action: action, currentTab: currentTab, args: args }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (content-full-page.js): Create full page canvas with all the captured screenshots")
                resolve()
            }

        });
    })
}

// Function to listen to the full page content script (content-full-page.js) to call send the full page image to the new tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.data.action === "sendFullPageScreenshot") {
        // Call sendImageToNewTab() with the new screenshot of the full page
        sendImageToNewTab(message.data, message.currentTabId, message.currentTabIndex, message.filename)

        sendResponse(JSON.stringify(message, null, 4) || true)
    }
})