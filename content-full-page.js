'use strict';

// Listen to the message sent by the background script to create the full page screenshot
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        console.log("content script full page message:", message)
        if (message.action === "createFullPageScreenshot") {
            console.log("in if")

            // Get height of body and window
            const bodyHeight = document.documentElement.scrollHeight
            const windowHeight = window.innerHeight

            // Get amount of screenshots to take by dividing bodyHeight with windowHeight and round it up. That's how many visibleContent need to be taken.
            const amountOfScreenshots = bodyHeight / windowHeight
            const amountOfScreenshotsRounded = Math.ceil(amountOfScreenshots)

            // Get percent of last image that is overlapping with the second to last one to cut off to seemlessly merge all screenshots together
            const cutoffPercent = (amountOfScreenshotsRounded - amountOfScreenshots) * 100


            console.log("bodyHeight:", bodyHeight, " windowHeight:", windowHeight, " amountOfScreenshots:", amountOfScreenshots, " amountOfScreenshotsRounded:", amountOfScreenshotsRounded, " cutoffPercent:", cutoffPercent)

            // var data = {
            //     action: "captureFullPage"
            // }

            // Send a message to the background script to create multiple visible tab screenshots
            // chrome.runtime.sendMessage({ data: data, currentTabId: message.currentTab.id, currentTabIndex: message.currentTab.index, filename: message.filename, screenshotAmount: amountOfScreenshotsRounded, cutoffPercent: cutoffPercent }, (responseCallback) => {
            //     if (responseCallback) {
            //         console.log("Message has reached the recipient (background.js): create " + amountOfScreenshotsRounded + " screenshots and cut off " + cutoffPercent + " of last screenshot")
            //     }

            //     // return true;
            // })

            // Make as many screenshots as the result from before
            // Cut away part of last screenshot
            // Append images together
            // Send to new tab
            // }

            // sendResponse(JSON.stringify(message, null, 4) || true);

            // Send a response to the background script including all the information needed to create multiple screenshots capturing the full page
            sendResponse({ currentTabId: message.currentTab.id, currentTabIndex: message.currentTab.index, filename: message.filename, screenshotAmount: amountOfScreenshotsRounded, cutoffPercent: cutoffPercent });

            return true;
        }
    }
);