// Listen to the message sent by the background script to instantiate overlay
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");

        createOverlayElement();

        sendResponse(JSON.stringify(message, null, 4) || true);

        return true;
    }
);

function createOverlayElement() {
    // Create overlay element
    const el = document.createElement('div');

    // Set overlay styling
    // el.style.width = '200px';
    el.style.width = `${window.innerWidth.toString()}px`;
    // el.style.height = '200px';
    el.style.height = `${window.innerHeight.toString()}px`;
    el.style.backgroundColor = 'black';
    el.style.position = 'fixed';
    el.style.top = '0px';
    el.style.left = '0px';
    el.style.zIndex = '9999';
    el.style.opacity = '0.5';
    el.style.cursor = 'crosshair'

    el.setAttribute('id', 'overlay');

    // Add event listeners to overlay element to listen to mouse down and mouse up events to draw the rectangle

    // Add created overlay to body to show in current tab
    document.body.appendChild(el);
}