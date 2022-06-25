const overlayId = "snapper-overlay";
const closeButtonId = "snapper-close-button";
const canvasId = "snapper-canvas";
const clippedCanvasId = "snapper-clipped-canvas";

const allVideosOnPage = document.querySelectorAll('video');

const windowInnerWidthString = window.innerWidth.toString();
const windowInnerHeightString = window.innerHeight.toString();

var currentTab;

// Variables for drawing the selection area in the canvas
var overlay;
var canvas;
var canvasContext;
var clippedCanvas;
var clippedCanvasContext;
var isDrawing = false;
var offsetX;
var offsetY;
var startX;
var startY;
var mouseX;
var mouseY;

var visibleTabImageURI;
var clippedImageURI;

// Listen to the message sent by the background script to instantiate the overlay
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        visibleTabImageURI = message.imageURI
        currentTab = message.currentTab;

        if (!(document.getElementById(overlayId) && document.getElementById(closeButtonId) && document.getElementById(canvasId))) {

            // Create canvas showing a screenshot of the page
            canvas = createCanvasElement();

            // Create overlay
            overlay = createOverlayElement();

            // Add close button to overlay
            addCloseButton();

            // Disable scrolling when overlay is active
            document.body.classList.add('disable-scrolling')
        }

        sendResponse(JSON.stringify(message, null, 4) || true);

        return true;
    }
);

// Function to create a canvas element and draws a screenshot of the current page in it
function createCanvasElement() {
    // Create canvas element
    const mainCanvas = createCanvas(canvasId, `${windowInnerWidthString}px`, `${windowInnerHeightString}px`)

    // Get canvas context to draw into the canvas
    canvasContext = mainCanvas.getContext("2d");

    // Workaround to create an image element and setting the src to the visibleTabImageURI to pass it into drawImage()
    const image = new Image;
    image.src = visibleTabImageURI;
    image.onload = () => canvasContext.drawImage(image, 0, 0)

    offsetX = mainCanvas.offsetLeft;
    offsetY = mainCanvas.offsetTop;


    // Get mouse position on mouse down event as a starting position
    mainCanvas.onmousedown = (e) => {
        isDrawing = true;
        startX = parseInt(e.clientX - offsetX);
        startY = parseInt(e.clientY - offsetY);
    }

    // Set isDrawing to false to not regster mouse move events while not holding mouse down
    mainCanvas.onmouseup = (e) => {
        isDrawing = false;

        // Clip canvas to selected area and turn clipped canvas into image to pass to new tab
        clipCanvasAndCreateImage()
    }

    // Get current and starting mouse position to draw a rectangle over canvas 
    mainCanvas.onmousemove = (e) => {
        if (isDrawing) {
            mouseX = parseInt(e.clientX - offsetX);
            mouseY = parseInt(e.clientY - offsetY);

            // TODO: change stroke color for other color of selection area
            canvasContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            canvasContext.beginPath();
            canvasContext.rect(startX, startY, mouseX - startX, mouseY - startY);
            canvasContext.stroke();
        }
    }

    document.body.appendChild(mainCanvas);

    return mainCanvas;
}

// Function to create the overlay element and everything that has to do with it
function createOverlayElement() {
    // Create overlay element
    const siteOverlay = document.createElement('div');

    // Dynamically set overlay width and height
    siteOverlay.style.width = `${windowInnerWidthString}px`;
    siteOverlay.style.height = `${windowInnerHeightString}px`;

    siteOverlay.setAttribute('id', overlayId);

    // Get all videos on the page and pause them -> unpause them when closing the overlay
    allVideosOnPage.forEach(vid => vid.pause());

    // Add created overlay to body to show in current tab
    document.body.appendChild(siteOverlay);

    return siteOverlay;
}

function addCloseButton() {
    // Create button element to close overlay
    const closeButton = document.createElement('button');

    closeButton.textContent = '×';

    closeButton.setAttribute('id', closeButtonId)

    // Add on click event listener to the button 
    closeButton.onclick = () => {
        // Remove all added elements from the body
        document.body.removeChild(canvas);
        // document.body.removeChild(clippedCanvas);
        document.body.removeChild(overlay);
        document.body.removeChild(closeButton);

        // Unpause all paused videos
        // TODO: get al list of all play videos before and only pause them to unpause only them after so no videos get unpaused that werent playing before
        allVideosOnPage.forEach(vid => vid.play());
        // console.log("all videos unpaued");

        // Enable scrolling again 
        document.body.classList.remove('disable-scrolling')
    }


    document.body.appendChild(closeButton);
}

// Function that clips the canvas to the selected area and converts it into a base64 image
function clipCanvasAndCreateImage() {

    // Create another canvas that clips the image corresponding to the selected area
    clippedCanvas = createCanvas(clippedCanvasId, `${mouseX - startX}px`, `${mouseY - startY}px`)

    // Get canvas context to draw into the canvas
    clippedCanvasContext = clippedCanvas.getContext("2d");

    // Workaround to create an image element and setting the src to the visibleTabImageURI to pass it into drawImage()
    const image = new Image;
    image.src = visibleTabImageURI;

    // console.log("image: ", image, " src: ", image.src)
    // console.log("canvas: ", canvas)

    // Load the clipped canvas (selected area) into the new canvas
    image.onload = () => {
        clippedCanvasContext.drawImage(
            image, // load image into the canvas
            startX, // x (upper left corner) position of the selected area
            startY, // y (upper left corner) position of the selected area
            mouseX - startX, //width of the selected area
            mouseY - startY, // height position of the selected area
            0, // x position of where to place the clipped image in the canvas
            0, // y position of where to place the clipped image in the canvas
            mouseX - startX, // width of the screenshot in the canvas (aspect ratio)
            mouseY - startY) // height of the screenshot in the canvas (aspect ratio)

        // document.body.appendChild(clippedCanvas)

        // Turn into image
        clippedImageURI = clippedCanvas.toDataURL("image/png");
        // console.log("clippedCanvas:", clippedCanvas)
        console.log("clippedImage:", clippedImageURI);

        // Create data object including everything needed to show the image on the new tab
        var data = {
            image: clippedImageURI,
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        }

        // Send a message to the background script to call sendImageToNewTab()
        chrome.runtime.sendMessage({ data: data, currentTabId: currentTab.id, currentTabIndex: currentTab.index }, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient (background.js)!")
            }

            return true;
        })
    }
}

function createCanvas(id, width, height) {
    // Create canvas element
    const createdCanvas = document.createElement('canvas');

    // Set canvas properties
    createdCanvas.setAttribute('id', id)
    createdCanvas.setAttribute('width', width)
    createdCanvas.setAttribute('height', height)

    return createdCanvas;
}