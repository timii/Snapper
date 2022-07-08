'use strict';

// Listen to the message sent by the background script to create the full page screenshot
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        console.log("content script full page message:", message)
        if (message.action === "createFullPageScreenshot") {
            console.log("in if")
            window.scrollBy(0, 2000)

            // Get height of body and window
            const bodyHeight = document.documentElement.scrollHeight
            const windowHeight = window.innerHeight

            // Get amount of screenshots to take by dividing bodyHeight with windowHeight and round it up. That's how many visibleContent need to be taken.
            const amountOfScreenshots = bodyHeight / windowHeight
            const amountOfScreenshotsRounded = Math.ceil(amountOfScreenshots)

            // Get percent of last image that is overlapping with the second to last one to cut off to seemlessly merge all screenshots together
            const cutoffPercent = (amountOfScreenshotsRounded - amountOfScreenshots) * 100

            console.log("bodyHeight:", bodyHeight, " windowHeight:", windowHeight, " amountOfScreenshots:", amountOfScreenshots, " amountOfScreenshotsRounded:", amountOfScreenshotsRounded, " cutoffPercent:", cutoffPercent)

            // Send a response to the background script including all the information needed to create multiple screenshots capturing the full page
            sendResponse({ currentTab: message.currentTab, filename: message.filename, screenshotAmount: amountOfScreenshotsRounded, cutoffPercent: cutoffPercent, windowHeight: windowHeight, bodyHeight: bodyHeight });

            return true;
        }
    }
);

// Listen to background script to scroll down the page
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        // console.log("in scroll down listener")

        // console.log("window.pageYOffset:", window.pageYOffset, " type:", typeof window.pageYOffset, "window.pageYOffset > 0:", window.pageYOffset > 0)
        // If page is already scrolled, reset to the top to start taking screenshots 
        // if (window.pageYOffset > 0) {
        //     console.log("scroll to top because page is scrolled")
        //     window.scrollTo(0, 0);
        // }

        if (message.action === "scrollDownPage") {
            console.log("in if scroll down")

            // Scroll down the window height between each screenshot
            window.scrollBy(0, message.windowHeight)

            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;
        }
    })

// Listen to background script to reset the scrolling on the page to the top
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "resetScrolling" && window.pageYOffset > 0) {
            console.log("scroll to top because page is scrolled")
            window.scrollTo(0, 0);

            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;
        }
    })