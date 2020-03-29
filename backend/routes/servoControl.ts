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
    const SERVOPIN = 12;

    const options: RPIO.Options = {
        gpiomem: false,
        mapping: "physical"
    };

    // default config
    let config = {...JSON.parse(fs.readFileSync("defaultParams.json", "utf-8"))};
    // Starting point (PWN) for servo, always start from min
    let currentPWM = config.servoMinPWM;
    // current step for frontend (e.g. if page is reloaded, current step should not be reset)
    let currentStep = 0;

    // Calculated conversion factor for converting revs step (rpm) to PWM
    const calcRevsStepToPwmStep = (config) => {
        return Math.max(2, Number(((config.servoMaxPWM - config.servoMinPWM) /
            (config.maxRevs - config.minRevs)).toFixed(4)));
    };
    let revsStepToPWMstep = calcRevsStepToPwmStep(config);

    /**
     * Initialise ServoControl
     */
    export const init = () => {
        config = {...JSON.parse(fs.readFileSync("params.json", "utf-8"))};
        revsStepToPWMstep = calcRevsStepToPwmStep(config);
        console.log("Current config", config);

        console.log("revsStepToPWMstep : ", revsStepToPWMstep);
        console.log("rev step = " + config.stepSize  + " pwm step = ", Math.round(revsStepToPWMstep * config.stepSize));

        rpio.init(options);
        rpio.open(SERVOPIN, rpio.PWM);
        rpio.pwmSetClockDivider(64);
        rpio.pwmSetRange(SERVOPIN, 1024);

        // Start from min PWM and step 0
        rpio.pwmSetData(SERVOPIN, currentPWM);
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
            rpio.pwmSetData(SERVOPIN, currentPWM);
            res.status(200).send({currentPWM: currentPWM});
        } else {
            res.status(500).end();
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
        rpio.pwmSetData(SERVOPIN, config.servoMinPWM);
        if (res) {
            res.status(200).send({currentPWM: currentPWM});
        }
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
            rpio.pwmSetData(SERVOPIN, currentPWM);
            res.status(200).send({currentPWM: currentPWM});
        } else {
            res.status(500).end();
        }
    };

    export const calibSetMin = (req: express.Request, res: express.Response) => {
        console.log("calibSetMin : ", req.body.minRevs);
        if (req.body.minRevs && req.body.minRevs < config.maxRevs) {
            config.minRevs = req.body.minRevs;
            config.servoMinPWM = currentPWM;
            revsStepToPWMstep = calcRevsStepToPwmStep(config);
            _saveParams();
            res.status(200).send({currentPWM: currentPWM});
        } else {
            res.status(500).end();
        }
    };

    export const calibSetMax = (req: express.Request, res: express.Response) => {
        console.log("calibSetMax : ", req.body.maxRevs);
        if (req.body.maxRevs && req.body.maxRevs > config.minRevs) {
            config.maxRevs = req.body.maxRevs;
            config.servoMaxPWM = currentPWM;
            revsStepToPWMstep = calcRevsStepToPwmStep(config);
            res.status(200).send({currentPWM: currentPWM});

            _saveParams();
        } else {
            res.status(500).end();
        }
    };

    const _saveParams = () => {
        fs.writeFileSync("params.json", JSON.stringify(config, null, 2), {encoding: "utf-8"});
        // reset step and pwn
        zeroSpeed(null, null);

        console.log("config : ", JSON.stringify(config, null, 2));
    };

    export const saveParams = (req: express.Request, res: express.Response) => {

        try {
            const tempConfig = {...config, ...JSON.parse(JSON.stringify(req.body.config, null, 2))};
            config = {...tempConfig};
            _saveParams();
            res.status(200).end();
        } catch (e) {
            res.status(500).end();
        }
    };
    export const loadParams = (req: express.Request, res: express.Response) => {

        try {
            const params = JSON.parse(fs.readFileSync("params.json", "utf-8"));
            config = {...params};
            res.status(200).send({boat: params, currentStep: currentStep});
        } catch (e) {
            res.status(500).end();
        }
    };
    export const resetParams = (req: express.Request, res: express.Response) => {
        try {
            const params = JSON.parse(fs.readFileSync("defaultParams.json", "utf-8"));
            config = {...params};
            _saveParams();
            zeroSpeed(null, null);
            res.status(200).send({boat: params, currentStep: currentStep});
        } catch (e) {
            res.status(500).end();
        }
    };
}

export default ServoControl;
