const router   = require('express').Router()
const uuid4    = require('uuid4')
const fs       = require('fs')

const isObject = obj => obj && obj.constructor && obj.constructor === Object

function merge(a, b) {
    for (let attr in b) {
      console.log("Current attribute: " + attr)
        if (isObject(a[attr]) && isObject(b[attr])) {
            merge(a[attr], b[attr])
        } else {
            a[attr] = b[attr]
        }
    }
    return a
}

function clone(a) {
  return merge({}, a)
}

router.get('/', (req, res) => {
  if(!req.cookies.fileName) {
    res.cookie('fileName', uuid4())
  }
  res.render('game', { cookie: req.cookies.data }) 
})

router.post('/saveGame', async (req, res) => {
  const code = uuid4()
  const fileName = req.cookies.fileName.replace('.', '').replace('/', '')
  req.body.data['code'] = code

  if(fs.existsSync(`./saves/${fileName}.data`)){
    const result = JSON.parse(fs.readFileSync(`./saves/${req.cookies.fileName}.data`, { encoding : 'utf8' }))
    result.push(req.body.data)

    fs.writeFileSync(`./saves/${fileName}.data`, JSON.stringify(result))
  } else {
    fs.writeFileSync(`./saves/${fileName}.data`, JSON.stringify([req.body.data]))
  }
  
  res.json({ state: 'ok', code })  
})

router.post('/loadGame', (req, res) => {
  const fileName = req.cookies.fileName.replace('.', '').replace('/', '')

  const result = JSON.parse(fs.readFileSync(`./saves/${fileName}.data`, { encoding : 'utf8' }))

  for(let i=0; i<result.length; i++) {
    if(result[i].code === req.body.code) {
      return res.json({ state: 'ok', data: result[i] })
    }
  }
  res.json({ state: 'fail' })
})

module.exports = router
