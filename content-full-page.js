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

// Listen to background script to create the full page canvas to hold all the screenshots
chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {

        if (message.action === "createFullPageCanvas") {
            console.log("message:", message)
            console.log("create full page canvas")

            // Just for testing the canvas
            // TODO: remove
            // const canvasContainer = document.createElement('div')
            // canvasContainer.setAttribute('width', `${window.innerWidth - 400}px`)
            // canvasContainer.setAttribute('height', `${window.innerHeight - 400}px`)
            // canvasContainer.setAttribute('overflow', "scroll")
            // canvasContainer.setAttribute('position', "fixed")
            // canvasContainer.setAttribute('top', "0")
            // canvasContainer.setAttribute('left', "0")

            // document.body.appendChild(canvasContainer)

            // // Create canvas that will hold all the screenshots
            // const fullPageCanvas = document.createElement('canvas')
            // fullPageCanvas.setAttribute('id', "snapper-full-page-canvas")
            // fullPageCanvas.setAttribute('width', `${window.innerWidth}px`)
            // // fullPageCanvas.setAttribute('width', `600px`)
            // fullPageCanvas.setAttribute('height', `${message.args.bodyHeight}px`)
            // // fullPageCanvas.setAttribute('height', `600px`)

            // console.log('fullPageCanvas:', fullPageCanvas)

            // createCanvas(canvasId, `${windowInnerWidthString}px`, `${windowInnerHeightString}px`)

            // Get canvas context to draw into the canvas
            // const canvasContext = fullPageCanvas.getContext("2d");
            console.log("1")

            // let currentDistanceFromTop = 0;
            // const singleCanvasInfo = []


            // Loop through array of screenshots and append them together by creating a canvas for each image and merging them together as one canvas
            // const finalCanvasPromise = mergeSingleImagesIntoOne(message.args.screenshotsArray)

            // finalCanvasPromise.then(finalCanvas => {
            const finalCanvas = document.createElement('canvas')
            finalCanvas.setAttribute('id', "snapper-full-page-canvas")
            finalCanvas.setAttribute('width', `${window.innerWidth}px`)
            // fullPageCanvas.setAttribute('width', `600px`)
            finalCanvas.setAttribute('height', `${document.documentElement.scrollHeight}px`)
            console.log("finalCanvas:", finalCanvas)

            const finalCanvasContext = finalCanvas.getContext('2d')

            var sources = {}

            console.log("sources before:", sources)
            for (let i = 0; i < message.args.screenshotsArray.length; i++) {
                console.log("i:", i)
                sources[`image${i + 1}`] = message.args.screenshotsArray[i]
            }
            console.log("sources after:", sources)

            await loadImages(sources, message.args.screenshotsArray.length, function (images) {
                let currentDistanceFromTop = 0;

                for (let j = 0; j < message.args.screenshotsArray.length; j++) {
                    // Cut off as much of the last screenshot as it is overlapping the one before
                    let cutoff = window.innerHeight * (message.args.cutoffPercent / 100)
                    console.log("cutoff:", cutoff)
                    if (j === message.args.screenshotsArray.length - 1) {
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, currentDistanceFromTop - cutoff, window.innerWidth, window.innerHeight - cutoff);
                    } else {
                        finalCanvasContext.drawImage(images[`image${j + 1}`], 0, currentDistanceFromTop, window.innerWidth, window.innerHeight);

                    }

                    console.log("currentDistanceFromTop before:", currentDistanceFromTop)
                    currentDistanceFromTop += window.innerHeight;
                    console.log("currentDistanceFromTop after:", currentDistanceFromTop)

                    // finalCanvasContext.drawImage(images[`image3`], 0, window.innerHeight, window.innerWidth, window.innerHeight);

                }
                const fullPageImage = finalCanvas.toDataURL("image/png")
                console.log("fullPageImage:", fullPageImage)
                // context.drawImage(images.image2, 350, 55, 93, 104);
            });


            // for (let i = 0; i < message.args.screenshotsArray.length; i++) {

            //     let singleImageCanvas = document.createElement('canvas')
            //     singleImageCanvas.setAttribute('id', `singleCanvas-${i}`)
            //     singleImageCanvas.setAttribute('height', `${message.args.windowHeight}px`)
            //     singleImageCanvas.setAttribute('width', `${window.innerWidth}px`)
            //     let singleImageCanvasContext = singleImageCanvas.getContext('2d')
            //     let singleImageCanvasBCR = singleImageCanvas.getBoundingClientRect()

            //     let image = new Image;
            //     image.src = message.args.screenshotsArray[i];
            //     image.onload = () => {
            //         singleImageCanvasContext.drawImage(image, 0, 0)

            //     }

            //     console.log("singleImageCanvas:", singleImageCanvas, " singleImageCanvasContext:", singleImageCanvasContext, " singleImageCanvasBCR:", singleImageCanvasBCR)
            //     console.log("singleCanvasInfo before:", singleCanvasInfo)
            //     singleCanvasInfo.push({ cv: singleImageCanvas, ctx: singleImageCanvasContext, bcr: singleImageCanvasBCR })
            //     console.log("singleCanvasInfo after:", singleCanvasInfo)

            //     // console.log("currentDistanceFromTop before:", currentDistanceFromTop)
            //     // // Workaround to create an image element and setting the src to the visibleTabImageURI to pass it into drawImage()
            //     // let image = new Image;
            //     // image.src = message.args.screenshotsArray[2];
            //     // image.onload = () => {
            //     //     canvasContext.drawImage(image, 0, 500)
            //     //     // const fullPageImage = fullPageCanvas.toDataURL("image/png")
            //     //     // console.log("fullPageImage:", fullPageImage)
            //     // }

            //     // let image2 = new Image;
            //     // image2.src = message.args.screenshotsArray[1];
            //     // image2.onload = () => canvasContext.drawImage(image2, 0, 1400)

            //     // currentDistanceFromTop += message.args.windowHeight;
            //     // console.log("currentDistanceFromTop after:", currentDistanceFromTop)
            // }


            document.body.appendChild(finalCanvas);

            // const fullPageImage = finalCanvas.toDataURL("image/png")
            // console.log("fullPageImage:", fullPageImage)
            console.log("3")

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

// function mergeSingleImagesIntoOne(screenshotsArray) {

//     return new Promise(resolve => {

//         console.log("mergeSingleImagesIntoOne()")
//         console.log("screenshotsArray:", screenshotsArray)

//         // const canvasInfo = []

//         // let currentDistanceFromTop = 0

//         const canvasInfoPromise = createSeparateCanvas(screenshotsArray)

//         // Create a canvas for each screenshot and draw the corresponding screenshot onto it
//         // for (let i = 0; i < screenshotsArray.length; i++) {

//         //     let singleImageCanvas = document.createElement('canvas')
//         //     singleImageCanvas.setAttribute('id', `singleCanvas-${i}`)
//         //     singleImageCanvas.setAttribute('height', `${document.documentElement.scrollHeight}px`)
//         //     singleImageCanvas.setAttribute('width', `${window.innerWidth}px`)
//         //     let singleImageCanvasContext = singleImageCanvas.getContext('2d')
//         //     let singleImageCanvasBCR

//         //     let image = new Image;
//         //     image.src = screenshotsArray[i];
//         //     image.onload = () => {
//         //         singleImageCanvasContext.drawImage(image, 0, currentDistanceFromTop)
//         //         singleImageCanvasBCR = singleImageCanvas.getBoundingClientRect()

//         //         console.log("singleImageCanvas:", singleImageCanvas, " singleImageCanvasContext:", singleImageCanvasContext, " singleImageCanvasBCR:", singleImageCanvasBCR)
//         //         console.log("canvasInfo before:", canvasInfo)
//         //         canvasInfo.push({ cv: singleImageCanvas, ctx: singleImageCanvasContext, bcr: singleImageCanvasBCR })
//         //         console.log("canvasInfo after:", canvasInfo)

//         //         console.log("currentDistanceFromTop before:", currentDistanceFromTop)
//         //         currentDistanceFromTop += window.innerHeight;
//         //         console.log("currentDistanceFromTop after:", currentDistanceFromTop)
//         //     }

//         // }

//         canvasInfoPromise.then(canvasInfo => {

//             console.log("canvasInfo after for loop after function call:", canvasInfo)

//             // compute bounding rect for all canvases
//             var rect = canvasInfo[0].bcr;
//             rect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

//             for (let i = 1; i < screenshotsArray.length; i++) {
//                 var br = canvasInfo[i].bcr;
//                 expandRect(rect, br);
//             }

//             // Create canvas that will hold all the screenshots
//             const fullPageCanvas = document.createElement('canvas')
//             fullPageCanvas.setAttribute('id', "snapper-full-page-canvas")
//             fullPageCanvas.setAttribute('width', `${rect.width}px`)
//             // fullPageCanvas.setAttribute('width', `600px`)
//             fullPageCanvas.setAttribute('height', `${rect.height}px`)
//             // fullPageCanvas.setAttribute('height', `600px`)

//             console.log('fullPageCanvas:', fullPageCanvas)

//             // Get canvas context to draw into the canvas
//             const canvasContext = fullPageCanvas.getContext("2d");

//             // print all canvases on the new canvas
//             for (let i = 0; i < screenshotsArray.length; i++) {
//                 var cv = canvasInfo[i].cv;
//                 var br = canvasInfo[i].bcr;
//                 canvasContext.drawImage(cv, br.left - rect.left, br.top - rect.top);
//             }

//             // return fullPageCanvas
//             resolve(fullPageCanvas)
//         })
//     })
// }

// // expands [rect] bounding rectangle with [nRect] so that rect contains nRect.
// function expandRect(rect, nRect) {
//     if (nRect.left < rect.left) {
//         rect.width += rect.left - nRect.left;
//         rect.left = nRect.left;
//     }
//     if (nRect.top < rect.top) {
//         rect.height += rect.top - nRect.top;
//         rect.top = nRect.top;
//     }
//     if ((nRect.left + nRect.width) > (rect.left + rect.width)) {
//         rect.width += (nRect.left + nRect.width) - (rect.left + rect.width);
//     }
//     if ((nRect.top + nRect.height) > (rect.top + rect.height)) {
//         rect.height += (nRect.top + nRect.height) - (rect.top + rect.height);
//     }
// }

// async function createSeparateCanvas(screenshotsArray) {

//     return new Promise(async resolve => {

//         console.log("createSeparateCanvas()")
//         console.log("screenshotsArray:", screenshotsArray)

//         let canvasInfo = []

//         let currentDistanceFromTop = 0

//         // Create a canvas for each screenshot and draw the corresponding screenshot onto it
//         for (let i = 0; i < screenshotsArray.length; i++) {

//             let singleImageCanvas = document.createElement('canvas')
//             singleImageCanvas.setAttribute('id', `singleCanvas-${i}`)
//             // singleImageCanvas.setAttribute('height', `${document.documentElement.scrollHeight}px`)
//             singleImageCanvas.setAttribute('height', `${window.innerHeight}px`)
//             singleImageCanvas.setAttribute('width', `${window.innerWidth}px`)
//             singleImageCanvas.setAttribute('position', `absolute`)
//             singleImageCanvas.setAttribute('top', `${currentDistanceFromTop}`)
//             let singleImageCanvasContext = singleImageCanvas.getContext('2d')
//             // let singleImageCanvasBCR

//             // let image = new Image;
//             // image.src = screenshotsArray[i];
//             console.log("screenshotsArray[i]:", screenshotsArray[i])
//             canvasInfo = await loadImage(singleImageCanvasContext, singleImageCanvas, currentDistanceFromTop, canvasInfo, screenshotsArray[i])

//             console.log("canvasInfo:", canvasInfo)

//             // loadedImagePromise.then(canvasInfo => {

//             // image.onload = () => {
//             //     singleImageCanvasContext.drawImage(image, 0, currentDistanceFromTop)
//             //     const singleImage = singleImageCanvas.toDataURL()
//             //     document.body.appendChild(singleImageCanvas)
//             //     console.log("singleImage:", singleImage)
//             //     singleImageCanvasBCR = singleImageCanvas.getBoundingClientRect()

//             //     console.log("singleImageCanvas:", singleImageCanvas, " singleImageCanvasContext:", singleImageCanvasContext, " singleImageCanvasBCR:", singleImageCanvasBCR)
//             //     console.log("canvasInfo before:", canvasInfo)
//             //     canvasInfo.push({ cv: singleImageCanvas, ctx: singleImageCanvasContext, bcr: singleImageCanvasBCR })
//             //     console.log("canvasInfo after:", canvasInfo)

//             console.log("currentDistanceFromTop before:", currentDistanceFromTop)
//             currentDistanceFromTop += window.innerHeight;
//             console.log("currentDistanceFromTop after:", currentDistanceFromTop)

//             if (i === screenshotsArray.length - 1) {
//                 console.log("canvasInfo after for loop:", canvasInfo)
//                 resolve(canvasInfo)
//             }
//             // })
//             // }

//         }

//         // return canvasInfo;
//     })
// }

// function loadImage(singleImageCanvasContext, singleImageCanvas, currentDistanceFromTop, canvasInfo, currentScreenshot) {
//     return new Promise(resolve => {
//         let singleImageCanvasBCR

//         let image = new Image;
//         image.src = currentScreenshot;

//         image.onload = () => {
//             singleImageCanvasContext.drawImage(image, 0, currentDistanceFromTop)
//             const singleImage = singleImageCanvas.toDataURL()
//             document.body.appendChild(singleImageCanvas)
//             console.log("singleImage:", singleImage)
//             singleImageCanvasBCR = singleImageCanvas.getBoundingClientRect()

//             console.log("singleImageCanvas:", singleImageCanvas, " singleImageCanvasContext:", singleImageCanvasContext, " singleImageCanvasBCR:", singleImageCanvasBCR)
//             console.log("canvasInfo before:", canvasInfo)
//             canvasInfo.push({ cv: singleImageCanvas, ctx: singleImageCanvasContext, bcr: singleImageCanvasBCR })
//             console.log("canvasInfo after:", canvasInfo)

//             resolve(canvasInfo)

//             // console.log("currentDistanceFromTop before:", currentDistanceFromTop)
//             // currentDistanceFromTop += window.innerHeight;
//             // console.log("currentDistanceFromTop after:", currentDistanceFromTop)

//             // if (i === screenshotsArray.length - 1) {
//             //     console.log("canvasInfo after for loop:", canvasInfo)
//             //     resolve(canvasInfo)
//             // }
//         }
//     })
// }