import express = require("express");

/**
 * Boat trolling speed control - index route handler
 * @module Routes
 */
module Routes {

    "use strict";

    /**
     * Root interface to serve HTML5 app files
     * @param req {express.Request}
     * @param res {express.Response}
     * @param next {function}
     */
    export const index = (req: express.Request, res: express.Response, next: Function): void => {

        res.render('index', {
            title: 'Boat trolling speed control'
        }, function (err, html) {
            if (err) {
                res.sendStatus(500);
                next();
            } else {
                res.end(html);
            }
        });
    };

    /**
     * Express middleware for disabling cache
     * @param req {express.Request}
     * @param res {express.Response}
     * @param next {Function}
     */
    export const noCache = (req: express.Request, res: express.Response, next: Function): void => {
        res.set({
            etag: false,
            "Cache-Control": "no-cache, no-store"
        });
        next();
    };
}

export default Routes;
