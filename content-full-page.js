'use strict';

const stickyAndFixedElementsArray2 = []

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

        if (message.action === "resetScrolling") {
            console.log("scroll to top because page is scrolled")
            console.log("current scroll posotion pageYOffset:", window.pageYOffset, typeof window.pageYOffset)

            // Get the starting scroll position to reset to after the screenshot has been taken
            // For whatever reason the current scroll position is always shifted by an additional 2000 pixels, so I just decrease the scroll position 2000.  
            const currentScrollPosition = window.pageYOffset - 2000 <= 0 ? 0 : window.pageYOffset - 2000

            // Scroll to the top of the page to start taking the full page screenshot
            window.scrollTo(0, 0);

            sendResponse(currentScrollPosition || true)

            return true;
        }
    })

// Listen to background script to get the current scroll position on the page 
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "getScrollPosition" && window.pageYOffset > 0) {
            console.log("get scroll position:", window.pageYOffset)
            // window.scrollTo(0, 0);

            sendResponse(window.pageYOffset || true)

            return true;
        }
    })

// Listen to background script to set/reset fixed and sticky elements
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log("message fixed and sticky:", message)



        if (message.action === "setStatic") {
            console.log("set elements position as static")

            getStickyAndFixedElements((fixedAndStickyElementsArray) => {
                console.log("in callback")

                console.log("fixedAndStickyElementsArray after:", fixedAndStickyElementsArray)
                console.log("stickyAndFixedElementsArray2 after:", stickyAndFixedElementsArray2)

                sendResponse(JSON.stringify(message, null, 4) || true)

                return true;
            })

        } else if (message.action === "resetToStickyAndFixed") {
            console.log("reset elements position to sticky and fixed")
            console.log("message.elementsArray:", message.elementsArray)
            console.log("stickyAndFixedElementsArray2 in reset:", stickyAndFixedElementsArray2)

            for (let i = 0; i < stickyAndFixedElementsArray2.length; i++) {
                console.log("stickyAndFixedElementsArray2[i]:", stickyAndFixedElementsArray2[i])
                stickyAndFixedElementsArray2[i].style.removeProperty('position')
            }
            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;

        }
    })

function getStickyAndFixedElements() {
    // let fixedAndStickyElementsArray = []

    // Get every element from the DOM
    let elems = document.body.getElementsByTagName("*");

    for (let i = 0; i < elems.length; i++) {

        let elemPosition = window.getComputedStyle(elems[i], null).getPropertyValue('position')
        // Only add every element that is sticky or fixed
        if (elemPosition == 'fixed' || elemPosition == 'sticky') {
            console.log(elems[i])
            elems[i].style.setProperty('position', 'static', 'important')
            // fixedAndStickyElementsArray.push(elems[i])
            stickyAndFixedElementsArray2.push(elems[i])
        }

    }
}

// Listen to background script to hide/show scrollbar
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "hideScrollbar") {
            console.log("hide scrollbar")

            // Hide scrollbar
            document.body.style.overflow = 'hidden';

        } else if (message.action === "showScrollbar") {
            console.log("show scrollbar")

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
            console.log("message:", message)
            console.log("message.currentTab:", message.currentTab)
            console.log("create full page canvas")

            // Create canvas that will hold all the screenshots
            const finalCanvas = document.createElement('canvas')
            finalCanvas.setAttribute('id', "snapper-full-page-canvas")
            finalCanvas.setAttribute('width', `${window.innerWidth}px`)
            // fullPageCanvas.setAttribute('width', `600px`)
            finalCanvas.setAttribute('height', `${document.documentElement.scrollHeight}px`)
            // console.log("finalCanvas:", finalCanvas)

            const finalCanvasContext = finalCanvas.getContext('2d')

            var sources = {}

            console.log("sources before:", sources)
            for (let i = 0; i < message.args.screenshotsArray.length; i++) {
                console.log("i:", i)
                sources[`image${i + 1}`] = message.args.screenshotsArray[i]
            }
            console.log("sources after:", sources)

            let fullPageImage

            // Append images together in the canvas
            loadImages(sources, message.args.screenshotsArray.length, function (images) {
                let currentDistanceFromTop = 0;

                for (let j = 0; j < message.args.screenshotsArray.length; j++) {
                    // Cut off as much of the last screenshot as it is overlapping the one before
                    if (j === message.args.screenshotsArray.length - 1) {
                        let cutoff = window.innerHeight * (message.args.cutoffPercent / 100)
                        let newHeight = window.innerHeight - cutoff
                        console.log("cutoff:", cutoff, " newHeight:", newHeight, " screenshot[j]:", message.args.screenshotsArray[j])
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, cutoff, window.innerWidth, newHeight, 0, currentDistanceFromTop, window.innerWidth, newHeight);
                    } else {
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, currentDistanceFromTop, window.innerWidth, window.innerHeight);

                    }

                    console.log("currentDistanceFromTop before:", currentDistanceFromTop)
                    currentDistanceFromTop += window.innerHeight;
                    console.log("currentDistanceFromTop after:", currentDistanceFromTop)

                    // finalCanvasContext.drawImage(images[`image3`], 0, window.innerHeight, window.innerWidth, window.innerHeight);

                }
                fullPageImage = finalCanvas.toDataURL("image/png")
                console.log("fullPageImage:", fullPageImage)

                console.log("fullPageImage after function:", fullPageImage)

                // document.body.appendChild(finalCanvas);

                // const fullPageImage = finalCanvas.toDataURL("image/png")
                // console.log("fullPageImage:", fullPageImage)
                console.log("3")

                console.log("reset scroll position to :", message.args.startScrollPosition)
                // Reset the scroll position back to the starting position
                window.scrollTo(0, message.args.startScrollPosition)


                // Send back the image to the background script to then send it to the new tab
                sendFullPageImage(fullPageImage, message.currentTab, message.args.filename)

            });
            sendResponse(JSON.stringify(message, null, 4) || true)

            return true;
            // })
        }
    })

function loadImages(sources, numImages, callback) {
    var images = {};
    var loadedImages = 0;
    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
    console.log(images)
}

function sendFullPageImage(fullPageImage, currentTab, filename) {
    console.log("sendFullPageImage() -> currentTab:", currentTab, " filename:", filename)

    var data = {
        image: fullPageImage,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        action: "sendFullPageScreenshot"
    }

    chrome.runtime.sendMessage({ data: data, currentTabId: currentTab.id, currentTabIndex: currentTab.index, filename: filename }, (responseCallback) => {
        if (responseCallback) {
            console.log("Message has reached the recipient (background.js): call sendImageToNewTab() in background.js to send the full page image")
        }

        // return true;
    })
}