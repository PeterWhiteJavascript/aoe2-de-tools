const express = require('express');
const app = express();
const server = require('http').Server(app);
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('/index.html');
});
server.listen(process.env.PORT || 5000);
console.log("Multiplayer app listening on port 5000");