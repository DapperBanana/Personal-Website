// Get the initial viewport dimensions
let { viewportWidth, viewportHeight } = handleViewportResize();
let isSendingData = true; // Flag to track whether data is currently being sent
let clientX, clientY;
let lastSentX, lastSentY;
let serverPositions;

const ws = new WebSocket('wss://austinlhoward.com');
const userId = generateUserID(); // Unique user ID
const isDarkModeEnabled = localStorage.getItem('darkMode') === 'true';
const root = document.documentElement;

//Dark-mode code.... Should move this into HTML at some point to avoid flicker...
// ...Maybe someday!
if (isDarkModeEnabled) {
    root.style.setProperty('--dark-mode', 'true');
    root.style.setProperty('--code-background', '#00495C');
    root.style.setProperty('--code-border', '#0085A8');
    root.style.setProperty('--light', '#002B36');//'#110B11');
    root.style.setProperty('--dark', '#E6E8E6');
    root.style.setProperty('--grey', '#495867');
    root.style.setProperty('--yellow', '#1B9AAA');
    root.style.setProperty('--blue', '#073642');//'#092327');
    root.style.setProperty('--dark-grey', '#9C9DA1');
    root.style.setProperty('--drop-shadow', '#658C92');//'#9C9DA1');
    root.style.setProperty('--passive-button-text', '#9C9DA1');
    root.style.setProperty('--selected-button-text', '#092327');
    root.style.setProperty('--hover-button-text', '#092327');
    root.style.setProperty('--main-page-background', 'background-color: #181818');
    root.style.setProperty('--rotation-degrees', '180deg');
    root.style.setProperty('--invert-percentage', '0%');
    root.style.setProperty('--about-page-background', 'background-color: #181818');
    root.style.setProperty('--vh', '0vh');
    root.style.setProperty('--vw', '0vw');
    root.style.setProperty('--home-page-margin', '0px');
} else {
    root.style.setProperty('--dark-mode', 'false');
    root.style.setProperty('--code-background', '#d9dad9');
    root.style.setProperty('--code-border', '#fcfffc');
    root.style.setProperty('--light', '#E6E8E6');
    root.style.setProperty('--dark', '#092327');
    root.style.setProperty('--grey', '#9C9DA1');
    root.style.setProperty('--yellow', '#FFB400');
    root.style.setProperty('--blue', '#1B9AAA');
    root.style.setProperty('--drop-shadow', '#092327');
    root.style.setProperty('--passive-button-text', '#9C9DA1');
    root.style.setProperty('--selected-button-text', '#E6E8E6');
    root.style.setProperty('--hover-button-text', '#E6E8E6');
    root.style.setProperty('--main-page-background', 'url("/assets/pretentious-headshot.png")');
    root.style.setProperty('--rotation-degrees', '0deg');
    root.style.setProperty('--invert-percentage', '100%');
    root.style.setProperty('--about-page-background', 'url("/assets/adam-and-i.png")');
    root.style.setProperty('--main-page-background', 'url("/assets/pretentious-headshot.png")');
    root.style.setProperty('--vh', '60vh');
    root.style.setProperty('--vw', '60vw');
    root.style.setProperty('--home-page-margin', '10px');
}


// Send mouse position data to the server every 300ms
setInterval(sendMouseData, 200);
setInterval(smoothTransition, 200);

document.addEventListener('mousemove', (event) => {
    // Update clientX and clientY with the latest mouse position
    clientX = event.clientX;
    clientY = event.clientY;
});

// Attach event listener to window resize event
window.addEventListener('resize', () => {
    // Update viewport dimensions
    ({ viewportWidth, viewportHeight } = handleViewportResize());
});

// Update mouse pointer position based on server data
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'clientCount') {
        document.getElementById('currently-online').innerText = data.count;
        document.getElementById('total-site-visits').innerText = data.totalCount;
    } else if (data.type === 'blogLinks') {
        // Ignore data for blog links
    } else {
        // Handle client positions message
        const positions = data;
        serverPositions = positions;
    
        // Create pointer elements for each client
        positions.forEach(pos => {
            // Check if the position is not our own
            if (pos.userId !== userId) {
                let clientPointer = document.querySelector(`.client-pointer[data-user-id="${pos.userId}"]`);
                if (!clientPointer) {
                    clientPointer = document.createElement('div');
                    clientPointer.className = 'client-pointer'; // Add a class to identify client pointers
                    clientPointer.dataset.userId = pos.userId; // Store user ID as a data attribute
                    document.body.appendChild(clientPointer);
                }
                // Calculate scaled coordinates based on the received data and the viewport size
                let scaledX = (pos.x / 100) * viewportWidth;
                let scaledY = (pos.y / 100) * viewportHeight;
                // Adjust coordinates if they exceed the viewport bounds
                scaledX = Math.min(scaledX, viewportWidth - 20); // Adjust 20 for the pointer width
                scaledY = Math.min(scaledY, viewportHeight - 25); // Adjust 20 for the pointer height
                clientPointer.style.transition = "left 0.3s ease, top 0.3s ease"; // Smooth transition
                clientPointer.style.left = `${scaledX}px`;
                clientPointer.style.top = `${scaledY}px`;
            }
        });

        // Clean up disconnected pointers
        cleanupDisconnectedPointers(positions);
    };
};
// Function to smoothly transition pointer position
function smoothTransition() {
    const pointers = document.querySelectorAll('.client-pointer');
    pointers.forEach(pointer => {
        const pointerUserId = parseInt(pointer.dataset.userId);
        // Check if the pointer belongs to a client other than the primary client
        if (pointerUserId !== userId) {
            const targetPosition = serverPositions.find(pos => pos.userId === pointerUserId);
            if (targetPosition) {
                const currentPositionX = parseFloat(pointer.style.left);
                const currentPositionY = parseFloat(pointer.style.top);
                const targetPositionX = (targetPosition.x / 100) * viewportWidth;
                const targetPositionY = (targetPosition.y / 100) * viewportHeight;
                const distanceX = targetPositionX - currentPositionX;
                const distanceY = targetPositionY - currentPositionY;
                const speed = 0.1; // Adjust speed of transition

                // Apply easing function for smooth transition
                const newX = currentPositionX + distanceX * speed;
                const newY = currentPositionY + distanceY * speed;

                pointer.style.left = `${newX}px`;
                pointer.style.top = `${newY}px`;
            }
        }
    });
}

// Function to remove pointers for disconnected users
function cleanupDisconnectedPointers(serverPositions) {
    const pointers = document.querySelectorAll('.client-pointer');
    pointers.forEach(pointer => {
        const pointerUserId = parseInt(pointer.dataset.userId);
        // Check if the pointer belongs to a disconnected user
        const disconnected = !serverPositions.some(pos => pos.userId === pointerUserId);
        if (disconnected) {
            pointer.remove(); // Remove the pointer from the DOM
        }
    });
}

// Function to toggle dark mode
function toggleDarkMode() {
    // Get the root element
    const root = document.documentElement;

    // Check if currently in dark mode
    const isDarkMode = root.style.getPropertyValue('--dark-mode') == 'true';

    // Toggle between dark and light mode by swapping variables
    if (isDarkMode) {
        root.style.setProperty('--dark-mode', 'false');
        root.style.setProperty('--code-background', '#d9dad9');
        root.style.setProperty('--code-border', '#fcfffc');
        root.style.setProperty('--light', '#E6E8E6');
        root.style.setProperty('--dark', '#092327');
        root.style.setProperty('--grey', '#9C9DA1');
        root.style.setProperty('--yellow', '#FFB400');
        root.style.setProperty('--blue', '#1B9AAA');
        root.style.setProperty('--drop-shadow', '#092327');
        root.style.setProperty('--passive-button-text', '#9C9DA1');
        root.style.setProperty('--selected-button-text', '#E6E8E6');
        root.style.setProperty('--hover-button-text', '#E6E8E6');
        root.style.setProperty('--main-page-background', 'url("/assets/pretentious-headshot.png")');
        root.style.setProperty('--rotation-degrees', '0deg');
        root.style.setProperty('--invert-percentage', '100%');
        root.style.setProperty('--about-page-background', 'url("/assets/adam-and-i.png")');
        root.style.setProperty('--main-page-background', 'url("/assets/pretentious-headshot.png")');
        root.style.setProperty('--vh', '60vh');
        root.style.setProperty('--vw', '60vw');
        root.style.setProperty('--home-page-margin', '10px');

    } else {
        root.style.setProperty('--dark-mode', 'true');
        root.style.setProperty('--code-background', '#00495C');
        root.style.setProperty('--code-border', '#0085A8');
        root.style.setProperty('--light', '#002B36');//'#110B11');
        root.style.setProperty('--dark', '#E6E8E6');
        root.style.setProperty('--grey', '#495867');
        root.style.setProperty('--yellow', '#1B9AAA');
        root.style.setProperty('--blue', '#073642');//'#092327');
        root.style.setProperty('--dark-grey', '#9C9DA1');
        root.style.setProperty('--drop-shadow', '#658C92');//'#9C9DA1');
        root.style.setProperty('--passive-button-text', '#9C9DA1');
        root.style.setProperty('--selected-button-text', '#092327');
        root.style.setProperty('--hover-button-text', '#092327');
        root.style.setProperty('--main-page-background', 'background-color: #181818');
        root.style.setProperty('--rotation-degrees', '180deg');
        root.style.setProperty('--invert-percentage', '0%');
        root.style.setProperty('--about-page-background', 'background-color: #181818');
        root.style.setProperty('--vh', '0vh');
        root.style.setProperty('--vw', '0vw');
        root.style.setProperty('--home-page-margin', '0px');
    }

    localStorage.setItem('darkMode', isDarkMode ? 'false' : 'true');
}

// Attach click event listener to dark-mode button
const darkModeButton = document.getElementById('dark-mode-button');
if (darkModeButton) {
    darkModeButton.addEventListener('click', toggleDarkMode);
}

// Generate a unique user ID
function generateUserID() {
    return 1000 + Math.floor(Math.random() * 90000);
}

// Function to handle viewport resize
function handleViewportResize() {
    // Recalculate viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Return the updated viewport dimensions
    return { viewportWidth, viewportHeight };
}

// Function to handle sending mouse position data to the server
function sendMouseData() {
    // Calculate mouse position as a percentage of the viewport size
    const userX = (clientX / viewportWidth) * 100;
    const userY = (clientY / viewportHeight) * 100;
    lastSentX = userX;
    lastSentY = userY;
    const data = JSON.stringify({ userId, x: userX, y: userY });
    
    // Check if the WebSocket connection is open before sending data
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
    }
    isSendingData = false; // Reset flag after sending data
}