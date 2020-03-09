/**
 * Boat trolling speed control application
 */

"use strict";

// Node core modules
import * as path from "path";
import * as bodyParser from "body-parser";
// 3rd party module dependencies.
import * as express from "express";
const app = express();

// Local Express route dependencies
import routes from "./routes/index";
import servoControl from './routes/servoControl';

module boatTrollingControl {
    /**
     * ExpressJS app
     */
    export const server = app;

    /**
     * Initialization
     */
    export function init() {

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
        app.get("/", routes.index);

        // speed control
        app.post("/speed/increase", routes.noCache, servoControl.increaseSpeed);
        app.post("/speed/decrease", routes.noCache, servoControl.decreaseSpeed);
        app.post("/speed/zero", routes.noCache, servoControl.zeroSpeed);

        // calibration control
        app.post("/calib/setmin", routes.noCache, servoControl.calibSetMin);
        app.post("/calib/setmax", routes.noCache, servoControl.calibSetMax);

        // parameter handlinf
        app.post("/parameters/save", routes.noCache, servoControl.saveParams);
        app.get("/parameters/load", routes.noCache, servoControl.loadParams);
        // Send HTTP 404 for pages that have no defined route
        app.all("*", (req: express.Request, res: express.Response) => {
            res.status(404).send("Bad request");
        });
    }
}
// Check if this application is a top level (main) module and start services here
if (require.main === module) {
    const port: number = Number(process.env.PORT) || 8080;
    boatTrollingControl.init();
    setTimeout(() => { servoControl.init(); }, 5000);
    app.listen(port, function () {
        console.log("Boat control: " + port);
    });
}
// else the parent module must call "start"
export default boatTrollingControl;
