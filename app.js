const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
var dir = path.join(__dirname, 'public');
app.use(express.static(dir));
server.listen(process.env.PORT || 5000);
console.log("Multiplayer app listening on port 5000");