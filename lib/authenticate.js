"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const url = require("url");
const generate_jwt_1 = require("./generate-jwt");
let html = [
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<script>',
    'function setJWT() {',
    'var jwt = %s;',
    'localStorage.setItem(\'ls.jwt\', JSON.stringify(jwt));',
    'if (window.parent) window.parent.postMessage({action: \'CLOSE_AUTH\', params: jwt.jwt}, \'*\');',
    '}',
    '</script>',
    '</head>',
    '<body onload="setJWT();">',
    '</body>',
    '</html>'
];
function authenticateProxy(hostName, path, req, res, pwds) {
    let segments = path.split('/');
    if (!segments[0])
        segments.shift();
    let parsedUrl = url.parse(req.url || '', true);
    let query = parsedUrl.query;
    let token = (query && query.token ? query.token : '');
    generate_jwt_1.generateJWt(hostName, segments[1], pwds.adminUser, pwds.adminPassword, token).then((jwt) => {
        res.write(util.format(html.join(''), JSON.stringify(jwt)));
        res.end();
    }).catch((e) => {
        res.statusCode = 400;
        res.write(e.message);
        res.end();
    });
}
exports.authenticateProxy = authenticateProxy;
