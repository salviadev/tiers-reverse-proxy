import * as  http from 'http';
import * as  util from 'util';
import * as  url from 'url';
import { generateJWt } from './generate-jwt';


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

export function authenticateProxy(hostName: string, path: string, req: http.IncomingMessage, res: http.ServerResponse, pwds: any) {
    let segments = path.split('/');
    if (!segments[0]) segments.shift();
    let parsedUrl = url.parse(req.url || '', true);
    let query: any = parsedUrl.query;
    let token = (query && query.token ? query.token : '');
    generateJWt(hostName, segments[1], 'administrateur', pwds.adminPassword, token).then((jwt) => {
        res.write(util.format(html.join(''), JSON.stringify(jwt)));
        res.end();
    }).catch((e) => {
        res.statusCode = 400;
        res.write(e.message);
        res.end();
    });
}