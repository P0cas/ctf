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