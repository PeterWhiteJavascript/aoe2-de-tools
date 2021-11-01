const fs = require('fs')
const util = require('util')
const path = require('path')
const readFile = util.promisify(fs.readFile)

module.exports = async function () {
  const buf = await readFile(path.join(__dirname, '../data/unitsShow.json'))
  return JSON.parse(buf.toString('utf8'))
}
