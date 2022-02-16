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
