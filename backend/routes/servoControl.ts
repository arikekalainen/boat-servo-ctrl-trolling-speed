/**
 * Boat trolling speed control application
 * Servo Control
 */
import express = require("express");
import * as fs from "fs";
import * as rpio from "rpio";

/**
 * Express routes for ServoControl and other functions.
 * @module ServoControl
 */
module ServoControl {

    "use strict";
    const GPIO_18 = 12;

    const options: RPIO.Options = {
        gpiomem: false,
        mapping: "physical"
    };

    // default config
    let config = {
        maxRevs: 2000, // MAX revs (rpm)
        minRevs: 800,  // MIN revs (rpm)
        stepSize: 25,  // Revs step size (rpm)
        minStep: 10,   // Custom program: min step number
        maxStep: 20,   // Custom program: max step number
        intervalMs: 1000, // Custom program: stepping interval
        servoMinPWM: 100, // Servo Min PWN
        servoMaxPWM: 750 // Servo Max PWN
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
    export const init = () => {
        config = {...JSON.parse(fs.readFileSync("params.json", "utf-8"))};
        revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
                    (config.maxRevs - config.minRevs)).toFixed(4));
        console.log("Current config", config);

        console.log("revsStepToPWMstep : ", revsStepToPWMstep);
        console.log("rev step = " + config.stepSize  + " pwm step = ", Math.round(revsStepToPWMstep * config.stepSize));

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
    export const decreaseSpeed = (req: express.Request, res: express.Response) => {

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
        } else {
            res.send("Failed").status(500);
        }
    };
    /**
     * zeroSpeed
     * @param req {express.Request}
     * @param res {express.Response}
     */
    export const zeroSpeed = (req: express.Request, res: express.Response) => {
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
    export const increaseSpeed = (req: express.Request, res: express.Response) => {

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
        } else {
            res.send("Failed").status(500);
        }
    };

    export const calibSetMin = (req: express.Request, res: express.Response) => {
        console.log("calibSetMin : ", req.body.minRevs);
        if (req.body.minRevs && req.body.minRevs < config.maxRevs) {
            config.minRevs = req.body.minRevs;
            config.servoMinPWM = currentPWM;
            revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
                (config.maxRevs - config.minRevs)).toFixed(4));
            _saveParams();
            res.send("OK").status(200);
        } else {
            res.send("Failed").status(500);
        }
    };
    export const calibSetMax = (req: express.Request, res: express.Response) => {
        console.log("calibSetMax : ", req.body.maxRevs);
        if (req.body.maxRevs && req.body.maxRevs > config.minRevs) {
            config.maxRevs = req.body.maxRevs;
            config.servoMaxPWM = currentPWM;
            revsStepToPWMstep = Number(((config.servoMaxPWM - config.servoMinPWM) /
                (config.maxRevs - config.minRevs)).toFixed(4));
            _saveParams();
            res.send("OK").status(200);
        } else {
            res.send("Failed").status(500);
        }
    };

    const _saveParams = () => {
        fs.writeFileSync("params.json", JSON.stringify(config, null, 2), {encoding: "utf-8"});
        // reset step and pwn
        currentStep = 0;
        rpio.pwmSetData(12, config.servoMinPWM);
    };

    export const saveParams = (req: express.Request, res: express.Response) => {

        try {
            const tempConfig = {...config, ...JSON.parse(JSON.stringify(req.body.config, null, 2))};
            config = {...tempConfig};
            _saveParams();
            res.send("OK").status(200);
        } catch (e) {
            res.send("Failed").status(500);
        }
    };
    export const loadParams = (req: express.Request, res: express.Response) => {

        try {
            const params = JSON.parse(fs.readFileSync("params.json", "utf-8"));
            config = {...params};
            res.send({boat: params, currentStep: currentStep}).status(200);
        } catch (e) {
            res.send("Failed").status(500);
        }
    };
}

export default ServoControl;
