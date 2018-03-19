import * as  util from 'util';
import * as  http from 'http';
import * as fs from 'fs';
import { authenticateProxy } from './lib/authenticate';


const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

let cfg: any = {};
if (fs.existsSync('./config.json')) {
    cfg = JSON.parse(fs.readFileSync('./config.json').toString('utf8'));
}

const port = process.env.PORT || process.env.REVERSE_PROXY_PORT || cfg.port || 7500;
const host = process.env.REFERENTIEL_TIERS_ADDRESS || cfg.host || 'http://sercentos1';
const adminPassword = process.env.REFERENTIEL_TIERS_ADMIN_PWD || cfg.adminPassword || 'salvia';

const routes: string[] = ['referentiel-tiers', 'account-management', 'document-collect', 'private']

function reverseProxy(route: string, req: http.IncomingMessage, res: http.ServerResponse) {
    proxy.web(req, res, { target: host, changeOrigin: true });
}


proxy.on('proxyRes', function (proxyRes: any, req: http.IncomingMessage, res: http.ServerResponse) {
    delete proxyRes.headers['x-frame-options'];
});

proxy.on('proxyReq', function (proxyReq: any, req: any, res: any, options: any) {
    if (cfg.removeAcceptEncoding)
        proxyReq.removeHeader('Accept-Encoding');
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
    } else if (/^\/authenticate\/.*/.test(path)) {
        return authenticateProxy(host, path, req, res, { adminPassword: adminPassword });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(util.format('Not found %s %s.', req.method, path));
    }
})


server.listen(port, () => {
    console.log(util.format('Tiers reverse proxy (host = %s) started at %d', host, port))
});



