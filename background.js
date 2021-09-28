function sendImageToNewTab(data, currentTabId, currentTabIndex) {
    // Send the image after 1 second timeout, so the html and the listener is set up in the new tab
    setTimeout(() => {
        let newTabId
        console.log("data: ", data, " currentTabId: ", currentTabId, " currentTabIndex: ", currentTabIndex)
        chrome.runtime.sendMessage(data, (responseCallback) => {
            if (responseCallback) {
                console.log("Message has reached the recipient!")
            }
            return true;
        })

        // get id of the new tab
        chrome.tabs.query({index: currentTabIndex + 1, title: "Snapper"}, (tabs) => {
            console.log("tabs: ", tabs)
            console.log("tabs[0]: ", tabs[0])
            var newTab = tabs[0]
            newTabId = newTab.id
            
            // manually change to the new tab
            chrome.tabs.update(newTabId, {active: true, highlighted: true})
        })
    }, 100)
}