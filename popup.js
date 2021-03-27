// The logic for the popup

var currentTab, // result of chrome.tabs.query of current active tab
    resultWindowId; // window id for putting resulting images

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
    + ('0' + (today.getMonth()+1)).slice(-2) + '-'
    + ('0' + today.getDate()).slice(-2)
    var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    var dateTime = date+'-'+time;

    if(name) {
        name = name.replace(/\./g, '-');
        name = '-' + name;
    }
    else { name = ''; }

    return 'snapper' + name + '-' + dateTime + '.png';
}


// 
// Full page button stuff
// 

// EventListener for "Full Page" button
document.getElementById("fullPage").addEventListener("click", clickFullPage);

// Function to call when "Full Page" button is clicked.
// Calls everything needed to create a full page screenshot
function clickFullPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0];
        currentTab = tab // used in later calls to get tab info

        var filename = getFilename(tab.url);
        console.log(filename);

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