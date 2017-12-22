"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const http = require("http");
const fs = require("fs");
// const util = require('util');
// const http = require('http');
const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
let cfg = {};
if (fs.existsSync('/config.json')) {
    let cfg = JSON.parse(fs.readFileSync('./config.json').toString('utf8'));
}
const port = process.env.REVERSE_PROXY_PORT || cfg.port || 7500;
const host = process.env.REFERENTIEL_TIERS_ADDRESS || cfg.host || 'http://sercentos1';
const adminPassword = process.env.REFERENTIEL_TIERS__ADMIN_PASSWORD || cfg.password || 'salvia';
const authorization = 'Basic ' + new Buffer('admin:' + adminPassword).toString('base64');
const routes = ['referentiel-tiers', 'account-management', 'document-collect', 'private'];
function reverseProxy(route, req, res) {
    proxy.web(req, res, { target: host, changeOrigin: true, headers: { Authorization: authorization } });
}
proxy.on('proxyRes', function (proxyRes, req, res) {
    // console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, null, 2));
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
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(util.format('Not found %s %s.', req.method, path));
    }
});
server.listen(port, () => {
    console.log(util.format('Tiers reverse proxy (host = %s) started at %d', host, port));
});
