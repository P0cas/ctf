const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
// const __DIR = '/usr/src/app'
const __DIR = './'

/* express */
app.set('views', __DIR + '/views')
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)

app.use(express.static('static'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

const index = require(__DIR + '/route/index')

app.use(index)

app.listen(80)
