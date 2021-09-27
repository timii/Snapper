// The logic for the popup

var currentTab // result of chrome.tabs.query of current active tab

// Function to create file name for the screenshot
function getFilename(url) {
    // Creates a url object to parse the url more easily
    url = new URL(url);

    // Get the hostname of the url 
    // e.g: https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname 
    // -> hostname: 'developer.mozilla.org'
    var name = url.hostname;

    // Get current date and time
    var today = new Date();
    date = today.getFullYear() + '-'
        + ('0' + (today.getMonth() + 1)).slice(-2) + '-'
        + ('0' + today.getDate()).slice(-2)
    var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    var dateTime = date + '-' + time;

    if (name) {
        name = name.replace(/\./g, '-');
        name = '-' + name;
    }
    else { name = ''; }

    return 'snapper' + name + '-' + dateTime + '.png';
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
        console.log(tabs[0]);

        currentTab = tabs[0];
        // currentTabId = currentTab.id
        // currentTabIndex = currentTabIndex.index
        console.log("currentTab size: ", currentTab.width, currentTab.height, " currentTab id: ", currentTab.id, " currentTab.url: ", currentTab.url, " currentTabIndex: ", currentTab.index)

        //  Create a filename from the site url and the current date and time
        filename = getFilename(currentTab.url)

        // Start capturing the visible content of current active tab
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataURL) => {
            if (dataURL) {
                console.log("filename: ", filename)
                filename = filename.substring(0, filename.length - 4)
                console.log("filename: ", filename)

                // TODO: change active to true
                // Create new tab
                chrome.tabs.create({ active: false, url: 'snapper-image.html', openerTabId: currentTab.id, index: currentTab.index + 1 })

                // Create data object including everything needed to show the image on the new tab
                var data = {
                    image: dataURL,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    devicePixelRatio: window.devicePixelRatio
                } 

                // Send the image including additional information to other tab
                sendImageToNewTab(data)
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
        var tab = tabs[0];
        currentTab = tab // used in later calls to get tab info

        var filename = getFilename(tab.url);
        console.log("tabs: ", tabs, " tabs[0]: ", tab, " tab.url: ", tab.url)
        console.log("filename: ", filename);

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
    console.log("click: " + onoffswitch.checked)
}