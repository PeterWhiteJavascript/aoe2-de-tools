const path = require('path')
const express = require('express')
const compression = require('compression')
const app = express()
const server = require('http').Server(app)
var dir = path.join(__dirname, 'public')

app.use(compression())

app.use('/villagers-required.html', (req, res) => {
  res.redirect('/villagers-required/')
})

app.use('/build-order-helper.html', (req, res) => {
  res.redirect('/build-order-helper/')
})

app.use('/civ-ranking.html', (req, res) => {
  res.redirect('/civ-ranking/')
})

app.use('/unit-card.html', (req, res) => {
  res.redirect('/civ-ranking/')
})

app.use('/wood-calc.html', (req, res) => {
  res.redirect('/wood-calc/')
})


app.use(express.static(dir))

const port = process.env.PORT || 5000
server.listen(port)
console.log(`AOE2: DE tools app listening on port ${port}`)
