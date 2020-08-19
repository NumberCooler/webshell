const express = require('express');

var server = express();
server.use('/',express.static('./public'));

var port = 8080;
server.listen(port,()=>{
    console.log('listening ' + port);
});
