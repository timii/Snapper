// The logic for the popup

// EventListener for the on/off switch
document.querySelector(".onoffswitch-checkbox").addEventListener("click", onoff);

// Function for the on/off switch for dark/light mode
function onoff() {
    document.body.classList.toggle("dark-theme")
    console.log("click: " + onoffswitch.checked)
}