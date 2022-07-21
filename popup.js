'use strict';

// Function to create file name for the screenshot
function getFilename(url) {
    // Creates a url object to parse the url more easily
    url = new URL(url);

    // Get the hostname and pathname of the url
    const hostname = url.hostname.split(".")[0];
    var pathname = url.pathname.replace(/\//g, '-');

    // Get current date and time
    const today = new Date();
    const date = today.getFullYear() + '-'
        + ('0' + (today.getMonth() + 1)).slice(-2) + '-'
        + ('0' + today.getDate()).slice(-2)
    const time = today.getHours() + "_" + today.getMinutes() + "_" + today.getSeconds();
    const dateTime = date + '-' + time;

    if (pathname !== "-") pathname += "-"

    return 'snapper' + pathname + hostname + '-' + dateTime + '.png';
}

// 
// Custom area button stuff
// 

// EventListener for "Custom Area" button
document.getElementById("customArea").addEventListener("click", clickCustomArea);

// Function to call when "Custom Area" button is clicked.
// Calls everything needed to create a screenshot of a custom area
function clickCustomArea() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];

        var filename = getFilename(currentTab.url);

        initiateCustomAreaScreenshot(currentTab, filename);
    });
}


// 
// Visible content button stuff
// 

// EventListener for "Visible Content" button
document.getElementById("visibleContent").addEventListener("click", clickVisibleContent);
var imagetest = document.getElementById("test")

// Function to call when "Visible Content" button is clicked.
function clickVisibleContent() {
    let filename;

    // Get current active tab inforamtion 
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const currentTab = tabs[0];

        //  Create a filename from the site url and the current date and time
        filename = getFilename(currentTab.url)

        // Start capturing the visible content of current active tab
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataURL) => {
            if (dataURL) {
                // console.log("filename: ", filename)
                // filename = filename.substring(0, filename.length - 4)
                // console.log("filename: ", filename)

                // Set filename to background script
                // setFilename(filename);


                // Create data object including everything needed to show the image on the new tab
                var data = {
                    image: dataURL,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    devicePixelRatio: window.devicePixelRatio
                }

                // Send the image including additional information to new tab
                sendImageToNewTab(data, currentTab.id, currentTab.index, filename)
            }
        })
    });
}


// 
// Full page button stuff
// 

// EventListener for "Full Page" button
document.getElementById("fullPage").addEventListener("click", clickFullPage);

// Function to call when "Full Page" button is clicked.
// Calls everything needed to create a full page screenshot
function clickFullPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];

        var filename = getFilename(currentTab.url);
        // console.log("tabs: ", tabs, " tabs[0]: ", tab, " tab.url: ", tab.url)
        // console.log("currentTab size: ", currentTab.width, currentTab.height, " currentTab id: ", currentTab.id, " currentTab.url: ", currentTab.url, " currentTabIndex: ", currentTab.index)
        console.log("filename: ", filename);

        // Set filename to background script
        // setFilename(filename);

        initiateFullPageScreenshot(currentTab, filename);

        // Send the image including additional information to new tab
        // sendImageToNewTab(data, currentTab.id, currentTab.index, filename)

        // call api to create screenshot
    });
}


// 
// Dark/Light mode switch stuff
// 

// EventListener for the on/off switch
document.querySelector(".onoffswitch-checkbox").addEventListener("click", onoff);

// Function for the on/off switch for dark/light mode
function onoff() {
    document.body.classList.toggle("dark-theme")
}