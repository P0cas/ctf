/* https://github.com/seungyeop-lee/tetris */


//현재 게임정보 객체 저장 변수
var cGameInfo;

//게임 시작 함수
function startPlay() {
  cGameInfo = new GameInfo();
  initScreen();
  initPiecesMap(cGameInfo.panelRow, cGameInfo.panelColume);
  initDisplayGamePanel(cGameInfo.panelColume, cGameInfo.panelRow);
  initNextBlockInfo();
  setNextPieces();
  setDropInterval();
  setPlayInterval();
  document.addEventListener('keydown', keyboardEventHandler);
  setControleButton();
}

/**
 * 게임 정보를 생성하는 생성자 함수
 */
function GameInfo() {
  this.panelRow = 20;
  this.panelColume = 10;

  this.piecesMap;
  this.cPiece;  //현재 블록
  this.nPiece;  //다음 블록

  this.started = true;
  this.gameOver = false;
  this.dropIntervalTime = 1000; //초기 속도, 1초에 1tick을 의미
  this.accelateIntervalTime = 10000;  //가속 간격, 10초를 의미
  this.dropIntervalId;

  this.mobile = navigator.userAgent.match(/Android|Mobile|iP(hone|od|ad)|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/);

  //게임 속도 표시
  this.gameSpeedTag = document.getElementById('game-speed');
  this.changeSpeedDisplay = function() {
    this.gameSpeedTag.innerText = this.dropIntervalTime / 1000 + " sec/pick";
  }
  this.changeSpeedDisplay();

  //스코어 표시
  this.score = 0;

  this.gameScoreTag = document.getElementById('game-info-score');
  this.gameOverScoreTag = document.getElementById('game-over-score');
  this.updateScore = function(removedRowCount) {
    switch (removedRowCount) {
      case 0:
        break;
      case 1:
        this.score += 100;
        break;
      case 2:
        this.score += 200;
        break;
      case 3:
        this.score += 400;
        break;
      case 4:
        this.score += 600;
        break;
      default:
        console.log('unexpected removedRowCount: ' + removedRowCount);
        break;
    }
    this.gameScoreTag.innerText = this.score;
    this.gameOverScoreTag.innerText = "SCORE: " + this.score;
  }
  this.updateScore(0);
}

//게임화면 부분을 표시한다.
function initScreen() {
  document.getElementById('start-screen').style.display = "none";
  document.getElementById('outer-game-screen').style.display = "flex";
  document.getElementById('game-over-screen').style.display = "none";
}

/**
 * 게임 판넬의 정보를 저장 할 배열을 초기화한다.
 * @param {number} row 
 * @param {number} col 
 */
function initPiecesMap(row, col) {
  var piecesMap = [];
  for(var currRow = 0; currRow < row; currRow++) {
    piecesMap[currRow] = [];
    for(var currCol = 0; currCol < col; currCol++) {
      piecesMap[currRow][currCol] = {
        located: false,
        color: VACANT
      };
    }
  }
  cGameInfo.piecesMap = piecesMap;
}

/**
 * 테트리스 게임 판낼을 생성 후 브라우저에 표시한다.
 * @param {number} xSize 가로 블록 갯수
 * @param {number} ySize 세로 블록 갯수
 */
function initDisplayGamePanel(xSize, ySize) {
  //게임 판에 해당하는 테이블 Element 생성
  var gamePanel = document.createElement('table');
  
  for(var y = 0; y < ySize; ++y) {
    
    var row = document.createElement('tr');
    row.className = 'row' + y;
    for(var x = 0; x < xSize; ++x) {
      
      var cell = document.createElement('td');
      cell.className = 'col' + x;
      cell.style.backgroundColor = 'white';
      row.appendChild(cell);
    }
    gamePanel.appendChild(row);
  }
  
  //스타일 및 속성 지정
  gamePanel.id = 'tetris-panel';
  
  //화면에 추가
  var gamePanelDiv = document.getElementById('tetris-display');
  gamePanelDiv.innerHTML = "";
  gamePanelDiv.appendChild(gamePanel);
}

/**
 * 다음 블럭 표시부분을 생성 후 브라우저에 표시한다.
 */
function initNextBlockInfo() {
  var nextBlockInfoTable = document.createElement('table');
  nextBlockInfoTable.id = 'next-block';

  for(var row = 0; row < 4; ++row) {
    var tr = document.createElement('tr');
    tr.className = "nbRow" + row;
    
    for(var col = 0; col < 4; ++col) {
      var cell = document.createElement('td');
      cell.className = "nbCol" + col;
      cell.style.backgroundColor = 'white';
      tr.appendChild(cell);
    }

    nextBlockInfoTable.appendChild(tr);
  }
  
  var nextBlockInfo = document.getElementById('next-block-info');
  if(nextBlockInfo.childElementCount > 1) {
    nextBlockInfo.lastElementChild.remove();
  }
  nextBlockInfo.appendChild(nextBlockInfoTable);
}

//현재블록과 다음블록을 설정한다.
function setNextPieces() {
  if(cGameInfo.nPiece) {
    cGameInfo.cPiece = cGameInfo.nPiece;
  } else {
    cGameInfo.cPiece = randomPiece();
  }
  cGameInfo.cPiece.draw();
  cGameInfo.nPiece = randomPiece();
  cGameInfo.nPiece.nbDraw();
}

// 랜덤하게 블럭을 생성
function randomPiece() {
  var r = Math.floor(Math.random() * pieces.length);  // 0 ~ 6
  return new Piece(pieces[r][0], pieces[r][1], pieces[r][2]);
}

//가속 간격마다 0.1초씩 내려오는 속도를 높인다. 최대속도 0.2 sec/tick
function setDropInterval() {
  cGameInfo.dropIntervalId = window.setInterval(function() {
    if(cGameInfo.dropIntervalTime > 200) {
      cGameInfo.dropIntervalTime -= 100;
      cGameInfo.changeSpeedDisplay();
    }
  }, cGameInfo.accelateIntervalTime);
}

//게임 속도에 따라 블록을 움직인다.
function setPlayInterval() {
  if(cGameInfo.gameOver === false) {
    window.setTimeout(function() {
      cGameInfo.cPiece.moveDown();
      setPlayInterval();
    }, cGameInfo.dropIntervalTime);
  }
}

//키보드 이벤트 리스너
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

// 게임 저장 함수
async function saveGame(){
  const data = {
    'score': cGameInfo.score,
    'accelateIntervalTime': cGameInfo.accelateIntervalTime,
    'dropIntervalTime': cGameInfo.dropIntervalTime,
  }

  const req = await axios.post('/saveGame', { data })
  const result = req.data
  
  if (result.state === 'ok') {
    prompt('Your game data code', result.code)
  }
}

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

//모바일 전용 버튼 표시 및 비표시 함수
function setControleButton() {
  var buttons = document.getElementById('outer-game-screen').getElementsByTagName('button');
  if(cGameInfo.mobile && cGameInfo.started && !cGameInfo.gameOver) {
    Array.from(buttons).forEach(function(button) {
      button.style.display = "inline-block";
      button.addEventListener('touchmove', preventZoomInOut, false);
    });
  } else {
    Array.from(buttons).forEach(function(button) {
      button.style.display = "none";
      button.removeEventListener('touchmove', preventZoomInOut, false);
    });
  }
}

//줌인, 줌아웃 제스쳐 무효화 이벤트 리스너
function preventZoomInOut(e) {
  e = e.originalEvent || e;
  if (e.scale !== 1) {
     e.preventDefault();
  }
}

//게임아웃 화면 표시
function goGameOverScreen() {
  document.getElementById('game-over-screen').style.display = "flex";
}

//게임 재시작
function restartGame() {
  startPlay()
}

//초기 화면 표시
function goStartUp() {
  document.getElementById('start-screen').style.display = "flex";
  document.getElementById('outer-game-screen').style.display = "none";
  document.getElementById('game-over-screen').style.display = "none";
}