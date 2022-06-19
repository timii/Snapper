const overlayId = "snapper-overlay";
const controlsCloseButtonId = "snapper-close-button";
const canvasId = "snapper-canvas";

const allVideosOnPage = document.querySelectorAll('video');

const windowInnerWidthString = window.innerWidth.toString();
const windowInnerHeightString = window.innerHeight.toString();

// Variables for drawing the selection area in the canvas
var isDrawing = false;
var canvasOffset;
var offsetX;
var offsetY;
var startX;
var startY;

// Listen to the message sent by the background script to instantiate the overlay
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");

        console.log("message: ", message, " sendeR: ", sender)
        console.log("content script imageURI: ", message.imageURI)

        // Create canvas showing a screenshot of the page
        const canvas = createCanvasElement(message.imageURI);

        // Create overlay
        const overlay = createOverlayElement();

        // Add close button to overlay
        addCloseButton(canvas, overlay);

        // Disabled scrolling
        document.body.classList.add('disable-scrolling')

        sendResponse(JSON.stringify(message, null, 4) || true);

        return true;
    }
);

// Function to create a canvas element and draws a screenshot of the current page in it
function createCanvasElement(imageURI) {
    // Create canvas element
    const canvas = document.createElement('canvas');

    // Set canvas properties
    canvas.setAttribute('id', canvasId)
    canvas.setAttribute('width', `${windowInnerWidthString}px`)
    // canvas.setAttribute('width', `600px`)
    canvas.setAttribute('height', `${windowInnerHeightString}px`)
    // canvas.setAttribute('height', `600px`)

    console.log("canvas: ", canvas);

    // Get canvas context to draw into the canvas
    const canvasContext = canvas.getContext("2d");

    // Workaround to create an image element and setting the src to the imageURI to pass it into drawImage()
    const image = new Image;
    image.src = imageURI;
    image.onload = () => canvasContext.drawImage(image, 0, 0)

    // canvasOffset = canvas.offsetLeft
    offsetX = canvas.offsetLeft;
    offsetY = canvas.offsetTop;

    console.log("offsetX: ", offsetX, " offsetY: ", offsetY)

    // Add mouse event listeners to canvas to draw selection area
    canvas.onclick = () => {
        console.log("canvas clicked")
    }

    canvas.onmousedown = (e) => {
        console.log("mousedown: ", e)
        isDrawing = true;
        startX = parseInt(e.clientX - offsetX);
        startY = parseInt(e.clientY - offsetY);
    }

    document.body.appendChild(canvas);

    return canvas;
}

// Function to create the overlay element and everything that has to do with it
function createOverlayElement() {
    // Create overlay element
    const overlay = document.createElement('div');

    // Dynamically set overlay width and height
    overlay.style.width = `${windowInnerWidthString}px`;
    overlay.style.height = `${windowInnerHeightString}px`;

    overlay.setAttribute('id', overlayId);

    // Get all videos on the page and pause them -> unpause them when closing the overlay
    console.log("videos: ", allVideosOnPage)
    console.log("all videos paused")

    allVideosOnPage.forEach(vid => vid.pause());

    // Add event listeners to overlay element to listen to mouse down and mouse up events to draw the rectangle
    overlay.onclick = () => {
        console.log("overlay clicked")
    }

    // Add created overlay to body to show in current tab
    document.body.appendChild(overlay);

    return overlay;
}

function addCloseButton(canvasElement, overlayElement) {
    // Create button element to close overlay
    const closeButton = document.createElement('button');

    closeButton.textContent = '×';

    closeButton.setAttribute('id', controlsCloseButtonId)

    // Add on click event listener to the button 
    closeButton.onclick = () => {
        // Remove all added elements from the body
        document.body.removeChild(canvasElement);
        document.body.removeChild(overlayElement);
        document.body.removeChild(closeButton);

        // Unpause all paused videos
        // TODO: get al list of all play videos before and only pause them to unpause only them after so no videos get unpaused that werent playing before
        allVideosOnPage.forEach(vid => vid.play());
        console.log("all videos unpaued");

        // Enable scrolling again 
        document.body.classList.remove('disable-scrolling')
        console.log("scrolling enabled");
    }

    console.log("controlsCloseButton: ", closeButton);

    document.body.appendChild(closeButton);
}