const express = require('express');
const bodyParser = require('body-parser');
const { checkRateLimit, checkUrl, visitUrl } = require('./utils');


const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));


app.post('/report', (req, res) => {
  const url = req.body.url;
  console.log(unescape(url));
  res.send(unescape(url));
});

app.listen(9001);
