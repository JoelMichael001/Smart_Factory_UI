function validateLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage"); // Might be null

    // Example: Hardcoded credentials
    const validAdminname = "leo";
    const validAdminPassword = "joelm";
    const validUserPassword = "joel";

    // Validate credentials
    if (username === validAdminname && password === validAdminPassword) {
        localStorage.setItem("loggedInUser", username);
        window.location.href = "/userlogin";
    } 
    else if (username === validAdminname && password === validUserPassword) {
        localStorage.setItem("loggedInUser", username);
        window.location.href = "/userlogin";
    } 
    else {
        if (errorMessage) {  // Only access if it exists
            errorMessage.style.display = "block";
            errorMessage.innerText = "Invalid username or password!";
        }
    }
}

document.addEventListener('keydown', function (e) {
    // Block common zoom shortcuts
    if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === '=' || e.key === '-' || e.key === '0' || 
         e.code === 'Equal' || e.code === 'Minus' || e.code === 'Digit0' || 
         e.code === 'NumpadAdd' || e.code === 'NumpadSubtract' || e.code === 'Numpad0')
    ) {
        e.preventDefault();
    }
});

// Disable zooming with mouse wheel + Ctrl or Cmd
document.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }
}, { passive: false });


//....................................................................Dashboard...........................................//



function placeorderforproduct() {
    const productA = document.getElementById('ProductAOrder').value || 0;
    const productB = document.getElementById('ProductBOrder').value || 0;
    const productC = document.getElementById('ProductCOrder').value || 0;

    fetch('http://127.0.0.1:5500/write_to_plc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ProductA: productA,
            ProductB: productB,
            ProductC: productC
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

let cancelorder; // Declare globally

function checkPLCStatus() {
    const placedOrder = document.getElementById('placedorderuserlogin');
    const placeOrder = document.getElementById('placeorderuserlogin');
    const ProductAOrderSpan = document.getElementById('ProductAOrderSpan');
    const ProductBOrderSpan = document.getElementById('ProductBOrderSpan');
    const ProductCOrderSpan = document.getElementById('ProductCOrderSpan');

    fetch('http://127.0.0.1:5500/read_plc_coil')
        .then(response => response.json())
        .then(data => {
            if (data.orderPlaced) {
                placeOrder.style.display = 'none';
                placedOrder.style.display = 'block';
                cancelorder.style.display = 'block';
            } else {
                placeOrder.style.display = 'block';
                placedOrder.style.display = 'none';
                cancelorder.style.display = 'none';
            }

            // Update product order span values
            ProductAOrderSpan.innerText = "Ordered: " + data.D1span;
            ProductBOrderSpan.innerText = "Ordered: " + data.D2span;
            ProductCOrderSpan.innerText = "Ordered: " + data.D3span;
        })
        .catch(error => console.error('Error:', error));
}

function cancelOrder() {   
    const Prod1UnderProcessOrder = document.getElementById('Prod1UnderProcessOrder');
    const Prod2UnderProcessOrder = document.getElementById('Prod2UnderProcessOrder');
    const Prod3UnderProcessOrder = document.getElementById('Prod3UnderProcessOrder');

    fetch('http://127.0.0.1:5500/cancel_order', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Order Canceled:', data);
        checkPLCStatus(); // Refresh UI without reloading the page

        if (Prod1UnderProcessOrder) Prod1UnderProcessOrder.innerText = 0;
        if (Prod2UnderProcessOrder) Prod2UnderProcessOrder.innerText = 0;
        if (Prod3UnderProcessOrder) Prod3UnderProcessOrder.innerText = 0;
    })
    .catch(error => console.error('Error:', error));
}


// Initialize global elements
function initGlobalElements() {
    cancelorder = document.getElementById('cancelorder');
}

// Call this function inside window.onload when we add it later
function underprocess() {
    setInterval(() => {
        const ProductAOrderSpan = document.getElementById('ProductAOrderSpan');
        const ProductBOrderSpan = document.getElementById('ProductBOrderSpan');
        const ProductCOrderSpan = document.getElementById('ProductCOrderSpan');

        if (!ProductAOrderSpan || !ProductBOrderSpan || !ProductCOrderSpan) {
            console.error("Error: Order span elements not found");
            return;
        }

        const ProductAValue = parseInt(ProductAOrderSpan.innerText.replace(/\D/g, '')) || 0;
        const ProductBValue = parseInt(ProductBOrderSpan.innerText.replace(/\D/g, '')) || 0;
        const ProductCValue = parseInt(ProductCOrderSpan.innerText.replace(/\D/g, '')) || 0;

        const Product1finished = document.getElementById('product1finished');
        const Product2finished = document.getElementById('product2finished');
        const Product3finished = document.getElementById('product3finished');

        const Prod1UnderProcessOrder = document.getElementById('Prod1UnderProcessOrder');
        const Prod2UnderProcessOrder = document.getElementById('Prod2UnderProcessOrder');
        const Prod3UnderProcessOrder = document.getElementById('Prod3UnderProcessOrder');

        if (!Product1finished || !Product2finished || !Product3finished ||
            !Prod1UnderProcessOrder || !Prod2UnderProcessOrder || !Prod3UnderProcessOrder) {
            console.error("Error: Under process or finished product elements not found");
            return;
        }

        fetch('http://127.0.0.1:5500/underprocess_read', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("PLC connection failed");
                    return;
                }

                // Update "Under Process" order values
                Prod1UnderProcessOrder.innerText = Math.max(ProductAValue - data.D10, 0);
                Prod2UnderProcessOrder.innerText = Math.max(ProductBValue - data.D11, 0);
                Prod3UnderProcessOrder.innerText = Math.max(ProductCValue - data.D12, 0);

                // Update "Finished" product values
                Product1finished.innerText = data.D10;
                Product2finished.innerText = data.D11;
                Product3finished.innerText = data.D12;
            })
            .catch(error => console.error("Error fetching data:", error));
    }, 1000); // Fetch updates every 1 second
}

function productinStorage() {
    setInterval(() => {
        const Prod1Leftorder = document.getElementById('Prod1Leftorder');
        const Prod2Leftorder = document.getElementById('Prod2Leftorder');
        const Prod3Leftorder = document.getElementById('Prod3Leftorder');

        if (!Prod1Leftorder || !Prod2Leftorder || !Prod3Leftorder) {
            console.error("Error: Storage elements not found");
            return;
        }

        fetch('http://127.0.0.1:5500/productinStorage', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("PLC connection failed");
                    return;
                }

                // Update storage product values
                Prod1Leftorder.innerText = data.C1D7;
                Prod2Leftorder.innerText = data.C4D8;
                Prod3Leftorder.innerText = data.C6D9;
            })
            .catch(error => console.error("Error fetching data:", error));
    }, 1000); // Update storage product values every second
}

window.onload = function () {

    checkstatus();
    // Run checkstatus() every 10 seconds instead of 5 if it's a heavy function
    setInterval(checkstatus, 10000);

    if (window.location.pathname === "/" || window.location.pathname.includes("userlogin")) { 
        console.log("User login page detected. Initializing functions...");

        // Initialize global elements
        initGlobalElements();

        // Start checking PLC status
        checkPLCStatus();

        // Set interval for checking PLC status every 2 seconds
        setInterval(checkPLCStatus, 2000);

        // Ensure the cancel order button works only if it exists
        if (cancelorder) {
            cancelorder.addEventListener('click', cancelOrder);
        }

        // Run functions with a delay after initial data is fetched
        setTimeout(() => {
            underprocess();
            productinStorage();
        }, 3000);
    } else {
        console.log("Not on userlogin page, skipping function execution.");
    }
};



//...........................................Product OEE (later)........................................................//

function checkstatus() {
    const systemstatuscontrol = document.getElementById('systemstatuscontrol');

    fetch('http://127.0.0.1:5500/checkstatus', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("PLC connection failed");
            systemstatuscontrol.innerText = "Offline";
            systemstatuscontrol.style.color = "red";
            return;
        }

        if (data.Y0 === 1) {
            systemstatuscontrol.innerText = "Online";
            systemstatuscontrol.style.color = "green";
        } else {
            systemstatuscontrol.innerText = "Offline";
            systemstatuscontrol.style.color = "red";
        }
    })
    .catch(error => console.error("Error:", error));
}



function TurnOnSystem() {
    fetch('http://127.0.0.1:5500/TurnOnSystem', { method: 'POST', })  

    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to turn on system');
    })
    .then(data => {
        console.log(data);
        checkstatus();  // Run status check
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        document.getElementById("startbuttonreportuser").disabled = false;
    });
}

function TurnOffSystem() {
    fetch('http://127.0.0.1:5500/TurnoffSystem', { method: 'POST', })  

    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to turn on system');
    })
    .then(data => {
        console.log(data);
        checkstatus();  // Run status check
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        document.getElementById("stopbuttonreportuser").disabled = false;
    });
}

//.................................digitaltwin1...............................//
window.PackagingSystem = window.PackagingSystem || {};

// Check if the script is running on digitaltwin.html
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname === "/" || window.location.pathname.includes("digitaltwin")) { 
    console.log("This is the digitaltwin.html page");
         // DOM Elements
         const elements = {
            container: document.getElementById('container-digitwin'),
            box:document.getElementById('box-forstorage'),
            tape:document.getElementById('tape-forstoragebox'),
            startBtn: document.getElementById('start-btn-digitwin'),
            stopBtn: document.getElementById('stop-btn-digitwin'),
            resetBtn: document.getElementById('reset-btn'),
            fillBallsBtn: document.getElementById('fill-balls'),
            fillChipsBtn: document.getElementById('fill-chips'),
            horizontalConveyor: document.getElementById('horizontal-conveyor'),
            verticalConveyor: document.getElementById('vertical-conveyor'),
            statusMessage: document.getElementById('status-message'),
            systemStatus: document.getElementById('system-status'),
            totalCount: document.getElementById('total-count-digitwin'),
            ballsCount: document.getElementById('balls-count-digitwin'),
            chipsCount: document.getElementById('chips-count-digitwin'),
            leftIndicator: document.getElementById('left-indicator'),
            rightIndicator: document.getElementById('right-indicator'),
            containerEntry: document.getElementById('container-entry-digitwin'),
            ballFilling: document.getElementById('ball-filling'),
            chipFilling: document.getElementById('chip-filling'),
            lidPlacing: document.getElementById('lid-placing'),
            storageStation: document.getElementById('storage'),
            storageAnimation: document.getElementById("storage-animation"),
            arrowToBall: document.getElementById('arrow-to-ball'),
            arrowToChip: document.getElementById('arrow-to-chip'),
            arrowToLid: document.getElementById('arrow-to-lid'),
            arrowToStorage: document.getElementById('arrow-to-storage'),
            arrowContentBall: document.getElementById('arrow-content-ball'),
            arrowContentChip: document.getElementById('arrow-content-chip'),
            arrowContentLid: document.getElementById('arrow-content-lid'),
            arrowContentStorage: document.getElementById('arrow-content-storage')
        };
    
        // System Variables
        let state = {
            isRunning: false,
            currentStation: 'none',
            productType: 'none',
            totalContainers: 0,
            ballsContainers: 0,
            chipsContainers: 0,
            animationInProgress: false
        };
    
        // Initialize System
        resetSystem();
    
        // Attach Event Listeners (only if the buttons exist)
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', resetSystem);
        }
//..........................................................................................................................//    
        function resetSystem() {
            state.isRunning = false;
            state.currentStation = 'none';
            state.productType = 'none';
            state.totalContainers = 0;
            state.ballsContainers = 0;
            state.chipsContainers = 0;
            state.animationInProgress = false;
            updateCounters();
            hideContainer();
            resetStationHighlights();
            hideAllArrows();
            resetArrowContents();
            updateStatus('System Ready', 'Ready');
        }

        function updateStatus(message, status) {
            if (elements.statusMessage) elements.statusMessage.textContent = message;
            if (elements.systemStatus) elements.systemStatus.textContent = status;
        }
//..........................................................................................................................//
        function updateCounters() {
            if (elements.totalCount) elements.totalCount.textContent = state.totalContainers;
            if (elements.ballsCount) elements.ballsCount.textContent = state.ballsContainers;
            if (elements.chipsCount) elements.chipsCount.textContent = state.chipsContainers;
        }
//..........................................................................................................................//
        function activateIndicatorLights(activate) {
            if (elements.leftIndicator) elements.leftIndicator.classList.toggle('active', activate);
            if (elements.rightIndicator) elements.rightIndicator.classList.toggle('active', activate);
        }
//..........................................................................................................................//
        function hideContainer() {
            if (elements.container) elements.container.style.display = 'none';
        }
//..........................................................................................................................//
        function hidebox(){
            if (elements.box) elements.box.style.display = 'none';
        }
//..........................................................................................................................//
        function showbox(){
            if (elements.box) elements.box.style.display = 'block';
        }
//..........................................................................................................................//
        function showContainer() {
            if (elements.container) elements.container.style.display = 'block';
        }
//..........................................................................................................................//
        function positionContainer(left, top) {
            if (elements.container) {
                elements.container.style.left = left;
                elements.container.style.top = top;
            
            }
        }
//..........................................................................................................................//
        function updateContainerClass(className) {
            if (elements.container) elements.container.className = className;           
        }

//..........................................................................................................................//
        function hideAllArrows() {
            if (elements.arrowToBall) elements.arrowToBall.style.display = 'none';
            if (elements.arrowToChip) elements.arrowToChip.style.display = 'none';
            if (elements.arrowToLid) elements.arrowToLid.style.display = 'none';
            if (elements.arrowToStorage) elements.arrowToStorage.style.display = 'none';
        }
//..........................................................................................................................//
        function resetArrowContents() {
            if (elements.arrowContentBall) elements.arrowContentBall.className = 'arrow-content empty';
            if (elements.arrowContentChip) elements.arrowContentChip.className = 'arrow-content empty';
            if (elements.arrowContentLid) elements.arrowContentLid.className = 'arrow-content empty';
            if (elements.arrowContentStorage) elements.arrowContentStorage.className = 'arrow-content empty';
        }
//..........................................................................................................................//
        function resetStationHighlights() {
            if (elements.containerEntry) elements.containerEntry.classList.remove('station-active');
            if (elements.ballFilling) elements.ballFilling.classList.remove('station-active');
            if (elements.chipFilling) elements.chipFilling.classList.remove('station-active');
            if (elements.lidPlacing) elements.lidPlacing.classList.remove('station-active');
            if (elements.storageStation) elements.storageStation.classList.remove('station-active');
        }
//..........................................................................................................................//    
        function highlightStation(station) {
            resetStationHighlights();
            if (station) station.classList.add('station-active');
        }
//..........................................................................................................................//    
        function startConveyorAnimation() {
            if (elements.horizontalConveyor) elements.horizontalConveyor.style.animationPlayState = 'running';
            if (elements.verticalConveyor) elements.verticalConveyor.style.animationPlayState = 'running';
        }
//..........................................................................................................................//    
        function stopConveyorAnimation() {
            if (elements.horizontalConveyor) elements.horizontalConveyor.style.animationPlayState = 'paused';
            if (elements.verticalConveyor) elements.verticalConveyor.style.animationPlayState = 'paused';
        }
//..........................................................................................................................//    
        function showContainerAtEntryStation() {
            return new Promise((resolve) => {
                hideAllArrows();
                hidebox();
                hideContainer();
                highlightStation(elements.containerEntry);
    
                // First position the container while hidden
                hideContainer();
                updateContainerClass('container');
                positionContainer('80px', '140px');
    
                // Then make it visible
                setTimeout(() => {
                    showContainer();
                    updateStatus('Processing container at Entry Station', 'Running');
                    setTimeout(resolve, 2000);
                }, 100);
            });
        }
       
//..........................................................................................................................//
        function containerAtConveyor() {
            hideContainer()
            hidebox();
        // Show the container at the conveyor position
        // Highlight the arrow
        document.getElementById("arrow-to-ball").style.display = "flex"; 
        document.getElementById("arrow-content-ball").classList.add("empty");

        // Move the container to a fixed position
        positionContainer("180px", "130px");

        // Update status message (Optional)
        updateStatus("Container is Moving", "Running");
        }

//..........................................................................................................................//
        
        function AtBallFillingStation() {
        // Hide container and reset station highlights
        hideContainer();
        hidebox();
        resetStationHighlights();
        hideAllArrows();


        positionContainer('240px', '140px'); // Set position for ball filling station
        showContainer();
        highlightStation(elements.ballFilling);

            // Update status message
        updateStatus('Moved to Ball Filling Station', 'Running');
            setTimeout(() => {
                updateStatus('Ball filling in progress...', 'Running');
            },2000 );

        };


//..........................................................................................................................//

        function BallFillingAnimation() {
        // Highlight the Ball Filling Station and update status
        highlightStation(elements.ballFilling);
        updateStatus("Ball filling in progress...", "Running");

    
        setTimeout(() => {
            // Hide arrow once container reaches the filling station
            elements.arrowToBall.style.display = 'none';

            // Position container at Ball Filling Station
            elements.container.style.display = 'block';
            elements.container.style.left = '240px';
            elements.container.style.top = '140px';

            // Highlight the Ball Filling Station
            highlightStation(elements.ballFilling);

            // Start filling animation
            setTimeout(() => {
                elements.container.className = 'container with-balls';
                updateStatus('Filling container with balls', 'Running');
    
                // Update arrow content for the next stage
                elements.arrowContentLid.className = 'arrow-content with-balls';
    
                setTimeout(() => {
                    updateStatus('Ball filling complete', 'Complete');
                    }, 1000);
                }, 700);
            }, 500);
        }    
//..........................................................................................................................//
        function AtChipFillingStation() {
        // Hide container and reset station highlights
        hideContainer();
        hidebox();
        resetStationHighlights();
        hideAllArrows();

        // Set position for Chip Filling Station
        positionContainer('400px', '140px'); 
        showContainer();
        highlightStation(elements.chipFilling);

        // Update status message
        updateStatus('Moved to Chip Filling Station', 'Running');

        setTimeout(() => {
            updateStatus('Chip filling in progress...', 'Running');
        }, 2000);
        }
//..........................................................................................................................//
        function ChipFillingAnimation() {
            hideContainer();
            hidebox();
            // Highlight the Chip Filling Station and update status
            positionContainer('400px', '140px'); 
            showContainer();            
            highlightStation(elements.chipFilling);
            updateStatus("Chip filling in progress...", "Running");

        setTimeout(() => {
            // Hide arrow once container reaches the filling station
            elements.arrowToChip.style.display = 'none';

            // Position container at Chip Filling Station
            elements.container.style.display = 'block';
            elements.container.style.left = '400px';
            elements.container.style.top = '140px';

            // Highlight the Chip Filling Station
            highlightStation(elements.chipFilling);

            // Start filling animation
            setTimeout(() => {
                elements.container.className = 'container with-chips';
                updateStatus('Filling container with chips', 'Running');

                // Update arrow content for the next stage
                elements.arrowContentLid.className = 'arrow-content with-chips';

                setTimeout(() => {
                    updateStatus('Chip filling complete', 'Complete');
                }, 1000);
            }, 700);
        }, 500);
        }
//..........................................................................................................................//
        function ballContainerAtConveyorToLid() {
        hideContainer();
        hidebox();
        resetStationHighlights();
        // Show arrow towards the lid station from ball filling
        elements.arrowToLid.style.display = "flex"; 
        elements.arrowContentLid.classList.add("with-balls");

        // Move the container to a fixed position before moving to the lid station
        positionContainer("300px", "130px"); 

        // Update status message
        updateStatus("Ball container moving to Lid Station", "Running");
        }
//..........................................................................................................................//
        function chipContainerAtConveyorToLid() {
        hideContainer();
        hidebox();
        resetStationHighlights();
        // Show arrow towards the lid station from chip filling
        elements.arrowToLid.style.display = "flex"; 
        elements.arrowContentLid.classList.add("with-chips");

        // Move the container to a fixed position before moving to the lid station
        positionContainer("460px", "130px"); 

        // Update status message
        updateStatus("Chip container moving to Lid Station", "Running");
        }
//..........................................................................................................................//

        function ballContainerAtLidStation() {
        hideAllArrows();
        hideContainer();
        hidebox();
        resetStationHighlights();
        
        if (!elements.container || !elements.lidPlacing) {
        console.error("One or more elements not found!");
        return;
        }

        // Ensure container is visible
        elements.container.style.display = "block";
        elements.container.classList.add("with-balls");

        positionContainer("565px", "140px");     

        // Highlight the lid placing station
        elements.lidPlacing.classList.add("station-active");

        // Update status
        updateStatus("container at lid placing station", "Complete");
        }
//..........................................................................................................................//
        function ChipContainerAtLidStation() {
        hideAllArrows();
        hideContainer();
        hidebox();
        resetStationHighlights();
        if (!elements.container || !elements.lidPlacing) {
        console.error("One or more elements not found!");
        return;
        }

        // Ensure container is visible
        elements.container.style.display = "block";
        elements.container.classList.add("with-chips");

        positionContainer("565px", "140px");     

        // Highlight the lid placing station
        elements.lidPlacing.classList.add("station-active");

        // Update status
        updateStatus("container at lid placing station", "Complete");
        }

//..........................................................................................................................//

        function ballContainerLidPlacingAnimation() {
        hideAllArrows();
        hideContainer();
        hidebox();
        resetStationHighlights();
            if (!elements.container || !elements.lidPlacing) {
            console.error("One or more elements not found!");
            return;
        }

        // Ensure container is visible
        elements.container.style.display = "block";
        elements.container.classList.add("with-balls");

        // Move to lid placing station
        positionContainer("565px", "140px");

        // Highlight the lid placing station
        elements.lidPlacing.classList.add("station-active");

        // Start animation for lid placement
        updateStatus("Placing lid on Ball container...", "Running");
    
        setTimeout(() => {
            elements.container.classList.add("with-lid"); // Add lid animation
           updateStatus("Lid placed on Ball container", "Complete");
        }, 1500); // Delay for animation effect
        }
//..........................................................................................................................//
        function chipContainerLidPlacingAnimation() {
        hideAllArrows();
        hideContainer();
        hidebox();
        resetStationHighlights();
        if (!elements.container || !elements.lidPlacing) {
        console.error("One or more elements not found!");
        return;
        }

        // Ensure container is visible
        elements.container.style.display = "block";
        elements.container.classList.add("with-chips");

        // Move to lid placing station
       positionContainer("565px", "140px");

        // Highlight the lid placing station
       elements.lidPlacing.classList.add("station-active");

        // Start animation for lid placement
        updateStatus("Placing lid on Chip container...", "Running");

        setTimeout(() => {
            elements.container.classList.add("with-lid"); // Add lid animation
            updateStatus("Lid placed on Chip container", "Complete");
        }, 1500); // Delay for animation effect
        }

//..........................................................................................................................//

function ballContainerAtConveyorToStorage() {
    hideContainer();
    hidebox();
    resetStationHighlights();

    if (!elements.container || !elements.arrowToStorage) {
        console.error("One or more elements not found!");
        return;
    }

    // Show arrow towards storage
    elements.arrowToStorage.style.display = "flex";
    elements.arrowContentStorage.classList.add("with-balls", "with-lid");

    // Move the container to the conveyor before storage
    positionContainer("660px", "130px"); 

    // Update status message
    updateStatus("Ball container moving to Conveyor before Storage", "Running");

    setTimeout(() => {
        updateStatus("Ball container ready for storage", "Complete");
    }, 1500);
}

//..........................................................................................................................//

function chipContainerAtConveyorToStorage() {
    hideContainer();
    hidebox();
    resetStationHighlights();
    if (!elements.container || !elements.arrowToStorage) {
        console.error("One or more elements not found!");
        return;
    }

    // Show arrow towards storage
    elements.arrowToStorage.style.display = "flex";
    elements.arrowContentStorage.classList.add("with-chips", "with-lid");

    // Move the container to the conveyor before storage
    positionContainer("660px", "130px"); 

    // Update status message
    updateStatus("Chip container moving to Conveyor before Storage", "Running");

    setTimeout(() => {
       updateStatus("Chip container ready for storage", "Complete");
    }, 1500);
}

//...............................................................................................................//
function ballContainerAtStorageStation() {
    resetStationHighlights();
    hideAllArrows();
    hideContainer();
}
//.......................................................................................................................//
function showContainerAtStorage() {
    hideAllArrows();
    highlightStation();

    if (!elements.box) {
        console.error("One or more elements not found!");
        return;
    }

    // First, hide the container before positioning it
    hideContainer();
    showbox();
    // Then make it visible after a short delay
    setTimeout(() => {
        updateStatus('Storing Container', 'Running');
    }, 100);
}
function storedboxes(){
    hideAllArrows();
    highlightStation();

    if (!elements.box) {
        console.error("One or more elements not found!");
        return;
    }

    // First, hide the container before positioning it
    hideContainer();
    showbox();
    elements.box.classList.add("with-check");
    // Then make it visible after a short delay
    setTimeout(() => {

        updateStatus('Container Stored Securely', 'Running');
    },100); 
    
    setTimeout(() => {
        
        hidebox();
    },2000);
    
    

}
    
        // Expose functions in PackagingSystem
        Object.assign(window.PackagingSystem, {
            resetSystem,
            storedboxes,
            showbox,
            showContainerAtStorage,
            ballContainerAtStorageStation,
            chipContainerAtConveyorToStorage,
            ballContainerAtConveyorToStorage,
            chipContainerLidPlacingAnimation,
            ballContainerLidPlacingAnimation,
            ChipContainerAtLidStation,
            ballContainerAtLidStation,
            ballContainerAtConveyorToLid,
            chipContainerAtConveyorToLid,
            AtBallFillingStation,
            AtChipFillingStation,
            ChipFillingAnimation,
            BallFillingAnimation,
            containerAtConveyor,
            showContainerAtEntryStation,
            activateIndicatorLights,
            startConveyorAnimation,
            stopConveyorAnimation,
            resetStationHighlights,
            highlightStation,
            hideAllArrows,
            resetArrowContents,
            hideContainer,
            showContainer,
            positionContainer,
            updateContainerClass,
            updateStatus
        });
    }
});




//.................................................................Inventory Page.............................................//
window.inventoryWindow = window.inventoryWindow || {};

window.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname === "/" || window.location.pathname.includes("inventory")) { 

        window.inventoryWindow.productinStorageInv = function () {
            setInterval(() => {
                const Prod1LeftorderInv = document.getElementById('item1Leftinventory');
                const Prod2LeftorderInv = document.getElementById('item2Leftinventory');
                const Prod3LeftorderInv = document.getElementById('item3Leftinventory');

                if (!Prod1LeftorderInv || !Prod2LeftorderInv || !Prod3LeftorderInv) {
                    console.error("Error: Storage elements not found");
                    return;
                }

                fetch('http://127.0.0.1:5500/productinStorage', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error("PLC connection failed");
                            return;
                        }

                        // Update storage product values
                        Prod1LeftorderInv.innerText = data.C1D7;
                        Prod2LeftorderInv.innerText = data.C4D8;
                        Prod3LeftorderInv.innerText = data.C6D9;
                    })
                    .catch(error => console.error("Error fetching data:", error));
            }, 1000);
        };

        // Call the function to start fetching data once the DOM is fully loaded
        window.inventoryWindow.productinStorageInv();
    }
});

