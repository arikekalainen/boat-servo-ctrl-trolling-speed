
// App states
let appOn = false;
let programOn = false;
let currentStep;
let settingsView = false;
let stepAmount;
let selectedToBeMovedStep = null;
let isMaxStepMoved = false;

// Custom program
let timerID;
let direction; // 1 = up and -1 down



// Configuration (Loaded from server)
// - fill with defaults
let config = {
    maxRevs: 2000, // MAX revs (rpm)
    minRevs: 800,  // MIN revs (rpm)
    stepSize: 25,  // Revs step size (rpm)
    minStep: 10,   // Custom program: min step number
    maxStep: 20,   // Custom program: max step number
    intervalMs: 1000 // Custom program: stepping interval
};

let tempConfig = {...config};

const saveClicked = () => {
    console.log("saveCLicked");

    return axios({
        method: 'post',
        url: 'parameters/save',
        data: {
            config: tempConfig
        }
    })
    .then((res) => {
        console.log("Save parameters: DONE");
        config = {...tempConfig};
        currentStep = 0;
    });
};

const cancelClicked = () => {
    console.log("cancelClicked");
    $("#step-size-input").val(config.stepSize);
    $("#min-revs-input").val(config.minRevs);
    $("#max-revs-input").val(config.maxRevs);
    $("#step-interval-input").val(config.intervalMs);
    tempConfig = {...config};
};

const calibIncrease = () => {
    axios({
        method: 'post',
        url: 'speed/increase',
        data: {
            stepSize: 10,
            calib: true
        }
    })
};
const calibDecrease = () => {
    axios({
        method: 'post',
        url: 'speed/decrease',
        data: {
            stepSize: 10,
            calib: true
        }
    })

};
const calibSetMin = () => {
    axios({
        method: 'post',
        url: 'calib/setmin',
        data: {
            minRevs: config.minRevs
        }
    })
};
const calibSetMax = () => {
    axios({
        method: 'post',
        url: 'calib/setmax',
        data: {
            maxRevs: config.maxRevs
        }
    })
};
const customProgramStepTimeChanged = (value) => {
    const valueStr = value.toString();
    if (valueStr && !isNaN(valueStr)) {
        tempConfig.intervalMs = Number(valueStr);
    }
};

const stepSizeValueChanged = (value) => {
    const valueStr = value.toString();
    if (valueStr && !isNaN(valueStr)) {
        tempConfig.stepSize = Number(valueStr);
    }
};

const minRevsValueChanged = (value) => {
    const valueStr = value.toString();
    if (valueStr && !isNaN(valueStr)) {
        tempConfig.minRevs = Number(valueStr);
    }
};

const maxRevsValueChanged = (value) => {
    const valueStr = value.toString();
    if (valueStr && !isNaN(valueStr)) {
        tempConfig.maxRevs = Number(valueStr);
    }
};

const onOffButtonClicked = () => {
    appOn = !appOn;
    if (appOn) {
        // App On
        $("#on-off-button")[0].setAttribute("app-on", "true");
        // Enable buttons
        $("#increase-button").prop("disabled", false);
        $("#decrease-button").prop("disabled", false);
        $("#start-stop-program").prop("disabled", false);

    } else {
        // App Off
        $("#on-off-button")[0].removeAttribute("app-on");
        // Disable buttons
        $("#increase-button").prop( "disabled", true);
        $("#decrease-button").prop( "disabled", true);
        $("#start-stop-program").prop( "disabled", true);

        // Set Revs to zero
        axios({
            method: 'post',
            url: 'speed/zero',
            data: {
                calib: false
            }
        }).then((res) => {
            currentStep = 0;
            fillMeterBar();
        })

    }
};

const startStopButtonClicked = () => {
    programOn = !programOn;
    if (programOn) {
        // program On
        $("#start-stop-program")[0].setAttribute("program-on", "true");
        if (config.intervalMs) {
            direction = currentStep < config.maxStep ? 1 : -1;
            timerID = setInterval(() => {

                if (currentStep <= config.minStep) {
                    direction = 1; // up
                }
                if (currentStep >= (config.maxStep - 1)) {
                    direction = - 1 // down
                }

                if (direction > 0) {
                    console.log("increase");
                    increaseButtonClicked();
                } else {
                    console.log("decrease");
                    decreaseButtonClicked();
                }

            }, config.intervalMs)
        }

    } else {
        // program Off
        $("#start-stop-program")[0].removeAttribute("program-on");
        if (timerID) {
            clearInterval(timerID);
        }
    }
};

const settingsButtonClicked = () => {
    console.log("Settings button clicked");
    settingsView = !settingsView;
    if (settingsView) {
        $("#settings-mode-content")[0].style.display = "flex";
        $("#normal-mode-content")[0].style.display = "none";
    } else {
        $("#settings-mode-content")[0].style.display = "none";
        $("#normal-mode-content")[0].style.display = "flex";

        loadParameters()
            .then(() => {
                $("#step-size-input").val(config.stepSize);
                $("#min-revs-input").val(config.minRevs);
                $("#max-revs-input").val(config.maxRevs);
                $("#step-interval-input").val(config.intervalMs);
                fillMeterBar();
            });

        // disable speed button
        $("#increase-button").prop("disabled", true);
        $("#decrease-button").prop("disabled", true);
        $("#start-stop-program").prop("disabled", true);
    }
};

const increaseButtonClicked = () => {
    if (appOn) {
        currentStep = currentStep + 1;
        if (currentStep > stepAmount) {
            currentStep = stepAmount;
        } else {
            const meterBlock = $(`#meter-block-${currentStep}`);
            if (meterBlock && meterBlock[0]) {
                meterBlock[0].style.backgroundColor = "green";
            }
            axios({
                method: 'post',
                url: 'speed/increase',
                data: {
                    stepSize: config.stepSize,
                    calib: false
                }
            })
        }
    }
};

const decreaseButtonClicked = () => {
    if (appOn) {
        if (currentStep > 0) {
            const meterBlock = $(`#meter-block-${currentStep}`);
            if (meterBlock && meterBlock[0]) {
                meterBlock[0].style.backgroundColor = "lightgray";
                axios({
                    method: 'post',
                    url: 'speed/decrease',
                    data: {
                        stepSize: config.stepSize,
                        calib: false
                    }
                })
            }
            currentStep = currentStep - 1;
        }
        if (currentStep < 0) {
            currentStep = 0;
        }
    }
};

const meterBlockClicked = (event) => {

    if (event.target && event.target.id && event.target.dataset["revs"]) {
        const newStep = Number(event.target.id.replace("meter-block-", ""));

        if (!selectedToBeMovedStep &&
            (newStep === config.maxStep || newStep === config.minStep)) {
            // set selected
            $(`#${event.target.id}`)[0].classList.add("toBeMovedBlock");
            selectedToBeMovedStep = newStep;
            isMaxStepMoved = selectedToBeMovedStep > config.minStep;

        } else if (selectedToBeMovedStep &&
            newStep !== config.minStep && newStep !== config.maxStep) {

            $(`#meter-block-${selectedToBeMovedStep}`)[0].classList.remove("toBeMovedBlock");
            $(`#meter-block-${selectedToBeMovedStep}`)[0].classList.remove("selectedBlock");
            $(`#${event.target.id}`)[0].classList.add("selectedBlock");

            if (isMaxStepMoved) {
                // max moved
                if (newStep > config.minStep) {
                    // just max is moved to max
                    config.maxStep = newStep;
                } else {
                    // old max is moves to new min and old min becomes new max
                    config.maxStep = config.minStep;
                    config.minStep = newStep;
                }
            } else {
                // min is moved
                if (newStep < config.maxStep) {
                    // just min is moved to min
                    config.minStep = newStep;
                } else {
                    // new step to max and old max to min
                    config.minStep = config.maxStep;
                    config.maxStep = newStep;
                }
            }
            selectedToBeMovedStep = null;
        } else {
            // do nothing
        }
    }
};

/**
 * Fill speed meterbar
 */
const fillMeterBar = () => {
    const meterBar = $("#meter-bar");
    meterBar.empty();
    if (meterBar) {
        // clear old
        meterBar.empty();
        // Calculate step amount
        stepAmount = Math.ceil((config.maxRevs - config.minRevs) / config.stepSize) + 1;
        const meterBlockHeight = ((meterBar[0].offsetHeight - 4) / stepAmount) - 2; // top margin
        console.log("meterBlockHeight :", meterBlockHeight);
        for (let i = 1; i <= stepAmount; i++) {
            const meterBlock = document.createElement("LI");
            meterBlock.classList.add("meterBlock");
            meterBlock.style.height = `${meterBlockHeight}px`;
            meterBlock.id = `meter-block-${i}`;
            meterBlock.dataset["revs"] = `${config.minRevs + ( (i - 1) * config.stepSize ) }`
            meterBlock.onclick = meterBlockClicked;
            console.log(currentStep);
            if (i <= currentStep) {
                meterBlock.classList.add("greenBlock");
            }
            if (i === config.minStep || i === config.maxStep) {
                meterBlock.classList.add("selectedBlock");
            }
            meterBar.append(meterBlock)
        }
    }
};

/**
 * Load parameters
 * @return {Promise<void>}
 */
const loadParameters = async () => {
    return axios({
        method: 'get',
        url: 'parameters/load',
    })
        .then((res) => {
            console.log("load parameters: get : ", res.data);
            if (res.data && res.data.boat) {
                config = {...res.data.boat};
                currentStep = res.data.currentStep || 0;
                console.log("Store parameters to globals : currentStep=", currentStep);
            }
            return new Promise(resolve => resolve(true));
        });
};

//
// Startpoint
//
setTimeout(() => {
    loadParameters()
        .then(() => {
            $("#step-size-input").val(config.stepSize);
            $("#min-revs-input").val(config.minRevs);
            $("#max-revs-input").val(config.maxRevs);
            $("#step-interval-input").val(config.intervalMs);
            fillMeterBar();
        });

    // disable speed button
    $("#increase-button").prop("disabled", true);
    $("#decrease-button").prop("disabled", true);
    $("#start-stop-program").prop("disabled", true);
},100);
