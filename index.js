"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const http = require("http");
const fs = require("fs");
const authenticate_1 = require("./lib/authenticate");
const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
let cfg = {};
if (fs.existsSync('/config.json')) {
    let cfg = JSON.parse(fs.readFileSync('./config.json').toString('utf8'));
}
const port = process.env.PORT || process.env.REVERSE_PROXY_PORT || cfg.port || 7500;
const host = process.env.REFERENTIEL_TIERS_ADDRESS || cfg.host || 'http://sercentos1';
const routes = ['referentiel-tiers', 'account-management', 'document-collect', 'private'];
function reverseProxy(route, req, res) {
    proxy.web(req, res, { target: host, changeOrigin: true });
}
proxy.on('proxyRes', function (proxyRes, req, res) {
    delete proxyRes.headers['x-frame-options'];
});
const server = http.createServer((req, res) => {
    const uri = req.url || '';
    const path = url.parse(uri).pathname || '';
    let routeFound = '';
    routes.forEach(route => {
        const regex = new RegExp('^\/' + route + '\/.*');
        if (regex.test(path)) {
            routeFound = route;
        }
    });
    if (routeFound) {
        return reverseProxy(routeFound, req, res);
    }
    else if (/^\/authenticate\/.*/.test(path)) {
        return authenticate_1.authenticateProxy(host, path, req, res);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(util.format('Not found %s %s.', req.method, path));
    }
});
server.listen(port, () => {
    console.log(util.format('Tiers reverse proxy (host = %s) started at %d', host, port));
});
