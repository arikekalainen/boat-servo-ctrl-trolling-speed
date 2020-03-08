/**
 * Boat trolling speed control application
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Node core modules
const path = require("path");
const bodyParser = require("body-parser");
// 3rd party module dependencies.
const express = require("express");
const app = express();
// Local Express route dependencies
const index_1 = require("./routes/index");
const servoControl_1 = require("./routes/servoControl");
var boatTrollingControl;
(function (boatTrollingControl) {
    /**
     * ExpressJS app
     */
    boatTrollingControl.server = app;
    /**
     * Initialization
     */
    function init() {
        /**
         * Server configuration
         */
        // parse application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: true }));
        // parse application/json
        app.use(bodyParser.json());
        // Static path setup
        app.use(express.static(path.join(__dirname, "../client/public")));
        app.set("view engine", "html");
        // Routes
        app.get("/", index_1.default.index);
        // speed control
        app.post("/speed/increase", index_1.default.noCache, servoControl_1.default.increaseSpeed);
        app.post("/speed/decrease", index_1.default.noCache, servoControl_1.default.decreaseSpeed);
        app.post("/speed/zero", index_1.default.noCache, servoControl_1.default.zeroSpeed);
        // calibration control
        app.post("/calib/setmin", index_1.default.noCache, servoControl_1.default.calibSetMin);
        app.post("/calib/setmax", index_1.default.noCache, servoControl_1.default.calibSetMax);
        // parameter handlinf
        app.post("/parameters/save", index_1.default.noCache, servoControl_1.default.saveParams);
        app.get("/parameters/load", index_1.default.noCache, servoControl_1.default.loadParams);
        // Send HTTP 404 for pages that have no defined route
        app.all("*", (req, res) => {
            res.status(404).send("Bad request");
        });
    }
    boatTrollingControl.init = init;
})(boatTrollingControl || (boatTrollingControl = {}));
// Check if this application is a top level (main) module and start services here
if (require.main === module) {
    const port = Number(process.env.PORT) || 8080;
    boatTrollingControl.init();
    setTimeout(() => { servoControl_1.default.init(); }, 5000);
    app.listen(port, function () {
        console.log("Boat control: " + port);
    });
}
// else the parent module must call "start"
exports.default = boatTrollingControl;
//# sourceMappingURL=main.js.map