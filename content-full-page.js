'use strict';

// Global array that will hold all the elements on the page with "position: sticky or fixed"
const stickyAndFixedElementsArray = []

// Listen to the message sent by the background script to create the full page screenshot
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "createFullPageScreenshot") {
            // Get the height of body and window
            const bodyHeight = document.documentElement.scrollHeight
            const windowHeight = window.innerHeight

            // Get the amount of screenshots to take by dividing the height of the body with the height of the window and rounding it up. That's how many visible content screenshots need to be taken.
            const amountOfScreenshots = bodyHeight / windowHeight
            const amountOfScreenshotsRounded = Math.ceil(amountOfScreenshots)

            // Get percent of last image that is overlapping with the second to last one to cut off, to seemlessly merge all screenshots together
            const cutoffPercent = (amountOfScreenshotsRounded - amountOfScreenshots) * 100

            // Send a response to the background script including all the information needed to create multiple screenshots capturing the full page
            sendResponse({ currentTab: message.currentTab, filename: message.filename, screenshotAmount: amountOfScreenshotsRounded, cutoffPercent: cutoffPercent, windowHeight: windowHeight, bodyHeight: bodyHeight });

            return true;
        }
    }
);

// Listen to background script to scroll down the page
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.action === "scrollDownPage") {
            // Scroll down the window height between each screenshot
            window.scrollBy(0, message.windowHeight)

            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;
        }
    })

// Listen to background script to reset the scrolling to the top of the page adn return the starting scroll position
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.action === "resetScrolling") {
            // Get the starting scroll position to reset to after the screenshots have been taken
            // For whatever reason the current scroll position is always shifted by an additional 2000 pixels, so I just decrease the scroll position by 2000.  
            const currentScrollPosition = window.pageYOffset - 2000 <= 0 ? 0 : window.pageYOffset - 2000

            // Scroll to the top of the page to start taking the full page screenshot
            window.scrollTo(0, 0);

            sendResponse(currentScrollPosition || true)

            return true;
        }
    })

// Listen to background script to set/reset fixed and sticky elements
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.action === "setStatic") {
            getStickyAndFixedElements(() => {
                sendResponse(JSON.stringify(message, null, 4) || true)

                return true;
            })

        } else if (message.action === "resetToStickyAndFixed") {
            // Reset the position of all the elements that were set to static before
            for (let i = 0; i < stickyAndFixedElementsArray.length; i++) {
                stickyAndFixedElementsArray[i].style.removeProperty('position')
            }
            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;

        }
    })

// Function that goes through the DOM and stores every element that has the attribute position set to sicky or fixed
function getStickyAndFixedElements(callback) {
    // Get every element from the DOM
    let elems = document.body.getElementsByTagName("*");

    for (let i = 0; i < elems.length; i++) {
        let elemPosition = window.getComputedStyle(elems[i], null).getPropertyValue('position')
        // Only add every element that is sticky or fixed
        if (elemPosition == 'fixed' || elemPosition == 'sticky') {
            elems[i].style.setProperty('position', 'static', 'important')
            stickyAndFixedElementsArray.push(elems[i])
        }

    }
    callback()
}

// Listen to background script to hide/show scrollbar
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "hideScrollbar") {
            // Hide scrollbar
            document.body.style.overflow = 'hidden';

        } else if (message.action === "showScrollbar") {
            // Show scrollbar
            document.body.style.overflow = 'visible';

        }
        sendResponse(JSON.stringify(message, null, 4) || true)

        return true;
    })

// Listen to background script to create the full page canvas to hold all the screenshots
chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
        if (message.action === "createFullPageCanvas") {
            // Create canvas that will hold all the screenshots
            const finalCanvas = document.createElement('canvas')
            finalCanvas.setAttribute('id', "snapper-full-page-canvas")
            finalCanvas.setAttribute('width', `${window.innerWidth}px`)
            finalCanvas.setAttribute('height', `${document.documentElement.scrollHeight}px`)
            const finalCanvasContext = finalCanvas.getContext('2d')

            let sources = {}
            let fullPageImage

            // Save all the image URIs in an object, where th key is the number of the image
            for (let i = 0; i < message.args.screenshotsArray.length; i++) {
                sources[`image${i + 1}`] = message.args.screenshotsArray[i]
            }

            // Append images together in the canvas
            loadImages(sources, message.args.screenshotsArray.length, (images) => {
                let currentDistanceFromTop = 0;

                // Go through all the images, draw them on the canvas right below each other and cut off the top of the image if it is the last one 
                for (let j = 0; j < message.args.screenshotsArray.length; j++) {
                    if (j === message.args.screenshotsArray.length - 1) {
                        let cutoff = window.innerHeight * (message.args.cutoffPercent / 100)
                        let newHeight = window.innerHeight - cutoff
                        // Cut off as much of the last screenshot as it is overlapping the one before
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, cutoff, window.innerWidth, newHeight, 0, currentDistanceFromTop, window.innerWidth, newHeight);
                    } else {
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, currentDistanceFromTop, window.innerWidth, window.innerHeight);

                    }
                    currentDistanceFromTop += window.innerHeight;
                }
                fullPageImage = finalCanvas.toDataURL("image/png")

                // Reset the scroll position back to the starting position
                window.scrollTo(0, message.args.startScrollPosition)

                // Send back the image to the background script to then send it to the new tab
                sendFullPageImage(fullPageImage, message.currentTab, message.args.filename)

            });
            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;
        }
    })

// Function to save all the onload functions and image elements with the screenshots as sources in the object and load them all at once when the last one has been added. All the images need to be loaded at once to avoid only drawing one image in the canvas. 
function loadImages(sources, numImages, callback) {
    var images = {};
    var loadedImages = 0;
    // Go through all the images and add the image element to the object
    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}

// Function to send the full page image to the background script to then send it to the new tab
function sendFullPageImage(fullPageImage, currentTab, filename) {
    var data = {
        image: fullPageImage,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        action: "sendFullPageScreenshot"
    }

    chrome.runtime.sendMessage({ data: data, currentTabId: currentTab.id, currentTabIndex: currentTab.index, filename: filename }, (responseCallback) => {
        if (responseCallback) {
            console.log("Message has reached the recipient (background.js): send full page image to the new tab")
        }
    })
}