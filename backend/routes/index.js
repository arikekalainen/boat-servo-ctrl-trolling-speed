"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Boat trolling speed control - index route handler
 * @module Routes
 */
var Routes;
(function (Routes) {
    "use strict";
    /**
     * Root interface to serve HTML5 app files
     * @param req {express.Request}
     * @param res {express.Response}
     * @param next {function}
     */
    Routes.index = (req, res, next) => {
        res.render('index', {
            title: 'Boat trolling speed control'
        }, function (err, html) {
            if (err) {
                res.sendStatus(500);
                next();
            }
            else {
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
    Routes.noCache = (req, res, next) => {
        res.set({
            etag: false,
            "Cache-Control": "no-cache, no-store"
        });
        next();
    };
})(Routes || (Routes = {}));
exports.default = Routes;
//# sourceMappingURL=index.js.map