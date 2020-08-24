const express = require('express');

var server = express();
server.use('/',express.static('./public'));


server.post('/api/request',(req,res)=>{
    const Url = require('url').URL;
    const http = require('http');
    const https = require('https');

    var body = [];
    req.on('data', function (data) {
        body.push(data);
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.join("").length > 1e4) req.connection.destroy();
    });
    req.on('end', async function () {
        var info = JSON.parse( body.join("") );
        console.log(info);
        var url = new Url(info.url);
        console.log(url);
        var options = {
            hostname: url.hostname,
            path: url.pathname,
            method: info.method
        };
        if(url.port != '') {
            options.port = parseInt( url.port );
        }
        if("headers" in info.options) {
            options.headers = {};

            for(var key in info.options.headers) {
                options.headers[key] = info.options.headers[key];
            }
        }
        var data = await await new Promise((resolve,reject)=>{
            var prot = null;
            console.log(url.protocol);
            if(url.protocol == "http:") {
                prot = http;
                if(!("port" in options)) {
                    options.port = 80;
                }
            }
            if(url.protocol == "https:") {
                prot = https;
                if(!("port" in options)) {
                    options.port = 443;
                }
                if("rejectUnauthorized" in info.options) {
                    options.rejectUnauthorized = info.options.rejectUnauthorized;
                } else {
                    if(url.hostname == 'localhost') {
                        options.rejectUnauthorized = false;
                    }
                }
            }
            const req = prot.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                var resBody = [];
                res.on('data', (chunk) => {
                    resBody.push(chunk);
                });
                res.on('end', () => {
                    resolve( JSON.stringify({
                        status : res.statusCode,
                        headers : res.headers,
                        body : resBody.join("") 
                    }) );
                });
            });
            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });
            if("body" in info.options) {
                req.write(info.options.body);
            }
            req.end();
        });
        res.write(data);
        res.end();
    });

});

var port = 8080;
server.listen(port,()=>{
    console.log('listening ' + port);
});
