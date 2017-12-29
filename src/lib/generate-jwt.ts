import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as util from 'util';
import { parse } from 'path';
import { escape } from 'querystring';


function urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += '==';
            break;
        case 3:
            output += '=';
            break;

        default: {
            throw 'Illegal base64url string!';
        }
    }

    return decodeURIComponent(escape(new Buffer(output, 'base64').toString('binary')));
}

export function generateJWt(baseUri: string, tenant: string, userName: string, password: string, token: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        if (token) {
            // console.log(token);
            let segments = token.split('.')
            const payload = JSON.parse(urlBase64Decode(segments[1]));
            // console.log(payload);
            // console.log(urlBase64Decode(token));
            // console.log(payload)
            // return resolve({
            //     jwt: token,
            //     payload: {}
            // })
        }

        let requestFactory: any = (baseUri.startsWith('https') ? https : http);
        const purl = url.parse(baseUri + '/account-management/' + tenant + '/tokens')
        const port = purl.port ? parseInt(purl.port, 10) : undefined;
        const request = requestFactory.request({
            port: port,
            hostname: purl.hostname,
            path: purl.path,
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }, (response: http.IncomingMessage) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                let segments = data.split('.')
                if (segments.length < 2)
                    return reject({ message: data });
                try {
                    const payload = JSON.parse(urlBase64Decode(segments[1]));
                    const localIAT = new Date().getTime() / 1000;
                    const localEXP = payload.exp + (localIAT - payload.iat);
                    const jsonJWT = {
                        jwt: data,
                        localIAT: localIAT,
                        localEXP: localEXP,
                        payload: payload
                    }
                    resolve(jsonJWT);
                } catch (e) {
                    reject(e);
                }
            });

        }).on('error', (e: Error) => {
            reject(e);
        });
        const toSend = util.format('username=%s&password=%s', userName, password);
        request.write(toSend);
        request.end();
    });


}