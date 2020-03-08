"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const rpio = require("rpio");
/**
 * Express routes for ServoControl and other functions.
 * @module ServoControl
 */
var ServoControl;
(function (ServoControl) {
    "use strict";
    const GPIO_18 = 12;
    const options = {
        gpiomem: false,
        mapping: "physical"
    };
    // default config
    let config = {
        maxRevs: 2000,
        minRevs: 800,
        stepSize: 25,
        minStep: 10,
        maxStep: 20,
        intervalMs: 1000,
        servoMinPWM: 100,
        servoMaxPWM: 1000 // Servo Max PWN
    };
    // Starting point (PWN) for servo, always start from min
    let currentPWM = config.servoMinPWM;
    // current step for frontend (e.g. if page is reloaded, current step should not be reset)
    let currentStep = 0;
    // Calculated conversion factor for converting revs step (rpm) to PWM
    let revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
        (config.maxRevs - config.minRevs)).toFixed(4));
    /**
     * Initialise ServoControl
     */
    ServoControl.init = () => {
        config = JSON.parse(fs.readFileSync("params.json", "utf-8"));
        revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
            (config.maxRevs - config.minRevs)).toFixed(4));
        console.log("revsStepToPWMstep : ", revsStepToPWMstep);
        console.log("rev step = " + config.stepSize + " pwm step = ", Math.round(revsStepToPWMstep * config.stepSize));
        rpio.init(options);
        rpio.open(GPIO_18, rpio.PWM);
        rpio.pwmSetClockDivider(64);
        rpio.pwmSetRange(GPIO_18, 1024);
        // Start from min PWM and step 0
        rpio.pwmSetData(12, currentPWM);
        currentStep = 0;
    };
    /**
     * decreaseSpeed
     * @param req {express.Request}
     * @param res {express.Response}
     */
    ServoControl.decreaseSpeed = (req, res) => {
        if (req.body.stepSize) {
            console.log("decreaseSpeed : ", req.body.stepSize);
            const pwmStep = Math.round(revsStepToPWMstep * req.body.stepSize);
            console.log("pwwStep :", pwmStep);
            currentPWM = currentPWM - pwmStep;
            currentStep = currentStep - 1;
            // When calibrating, no need to honor boundaries
            if (!req.body.calib && currentPWM < config.servoMinPWM) {
                currentPWM = config.servoMinPWM;
                currentStep = 0;
            }
            console.log("servo PWM :", currentPWM);
            rpio.pwmSetData(12, currentPWM);
            res.send("OK").status(200);
        }
        else {
            res.send("Failed").status(500);
        }
    };
    /**
     * zeroSpeed
     * @param req {express.Request}
     * @param res {express.Response}
     */
    ServoControl.zeroSpeed = (req, res) => {
        currentStep = 0;
        currentPWM = config.servoMinPWM;
        rpio.pwmSetData(12, config.servoMinPWM);
        res.send("OK").status(200);
    };
    /**
     * increaseSpeed
     * @param req {express.Request}
     * @param res {express.Response}
     */
    ServoControl.increaseSpeed = (req, res) => {
        if (req.body.stepSize) {
            console.log("increaseSpeed : ", req.body.stepSize);
            const pwmStep = Math.round(revsStepToPWMstep * req.body.stepSize);
            console.log("pwwStep :", pwmStep);
            currentPWM = currentPWM + pwmStep;
            currentStep = currentStep + 1;
            // When calibrating, no need to honor boundaries
            if (!req.body.calib && currentPWM > config.servoMaxPWM) {
                currentPWM = config.servoMaxPWM;
                currentStep = Math.ceil((config.maxRevs - config.minRevs) / config.stepSize) + 1;
            }
            console.log("servo PWM :", currentPWM);
            rpio.pwmSetData(12, currentPWM);
            res.send("OK").status(200);
        }
        else {
            res.send("Failed").status(500);
        }
    };
    ServoControl.calibSetMin = (req, res) => {
        console.log("calibSetMin : ", req.body.minRevs);
        if (req.body.minRevs && req.body.minRevs < config.maxRevs) {
            config.minRevs = req.body.minRevs;
            config.servoMinPWM = currentPWM;
            revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
                (config.maxRevs - config.minRevs)).toFixed(4));
            _saveParams();
            res.send("OK").status(200);
        }
        else {
            res.send("Failed").status(500);
        }
    };
    ServoControl.calibSetMax = (req, res) => {
        console.log("calibSetMax : ", req.body.maxRevs);
        if (req.body.maxRevs && req.body.maxRevs > config.minRevs) {
            config.maxRevs = req.body.maxRevs;
            config.servoMaxPWM = currentPWM;
            revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
                (config.maxRevs - config.minRevs)).toFixed(4));
            _saveParams();
            res.send("OK").status(200);
        }
        else {
            res.send("Failed").status(500);
        }
    };
    const _saveParams = () => {
        fs.writeFileSync("params.json", JSON.stringify(config, null, 2), { encoding: "utf-8" });
        // reset step and pwn
        currentStep = 0;
        rpio.pwmSetData(12, config.servoMinPWM);
    };
    ServoControl.saveParams = (req, res) => {
        try {
            const tempConfig = Object.assign(Object.assign({}, config), JSON.parse(JSON.stringify(req.body.config, null, 2)));
            config = Object.assign({}, tempConfig);
            _saveParams();
            res.send("OK").status(200);
        }
        catch (e) {
            res.send("Failed").status(500);
        }
    };
    ServoControl.loadParams = (req, res) => {
        try {
            const params = JSON.parse(fs.readFileSync("params.json", "utf-8"));
            config = Object.assign({}, params);
            res.send({ boat: params, currentStep: currentStep }).status(200);
        }
        catch (e) {
            res.send("Failed").status(500);
        }
    };
})(ServoControl || (ServoControl = {}));
exports.default = ServoControl;
//# sourceMappingURL=servoControl.js.map