const fs = require('fs')
const util = require('util')
const path = require('path')
const readFile = util.promisify(fs.readFile)

const finder = (arr, name) => {
  return arr.find((e) => {
    return e.name === name
  })
}

const setUpGatherRates = (data) => {
  let gatherRates = data.units[0].gathering
  //Get all of the gather rates with various upgrades applied.
  gatherRates['farm heavy plow'] = { res: 'food', gatherRate: 21.2 / 60 }
  gatherRates['wheelbarrow'] = { res: 'food', gatherRate: 23.03 / 60 }
  gatherRates['wheelbarrow heavy plow'] = {
    res: 'food',
    gatherRate: 23.16 / 60,
  }
  gatherRates['hand cart'] = { res: 'food', gatherRate: 24 / 60 }

  gatherRates['fishing ship shore'] = { res: 'food', gatherRate: 0.28 }
  gatherRates['fishing ship deep'] = { res: 'food', gatherRate: 0.49 }
  gatherRates['fishing ship shore gillnets'] = {
    res: 'food',
    gatherRate: parseFloat((0.28 + 0.28 * 0.25).toFixed(2)),
  }
  gatherRates['fishing ship deep gillnets'] = {
    res: 'food',
    gatherRate: parseFloat((0.49 + 0.49 * 0.25).toFixed(2)),
  }
  gatherRates['fish trap'] = { res: 'food', gatherRate: 0.35 }
  gatherRates['fish trap gillnets'] = {
    res: 'food',
    gatherRate: parseFloat((0.35 + 0.35 * 0.25).toFixed(2)),
  }
  gatherRates['double-bit axe'] = {
    res: 'wood',
    gatherRate: parseFloat(
      (
        gatherRates.lumberjack.gatherRate *
        parseFloat(
          finder(data.upgrades, 'double-bit axe').effects.gatherRate[1].substr(
            1
          )
        )
      ).toFixed(2)
    ),
  }
  gatherRates['bow saw'] = {
    res: 'wood',
    gatherRate: parseFloat(
      (
        gatherRates.lumberjack.gatherRate *
        parseFloat(
          finder(data.upgrades, 'double-bit axe').effects.gatherRate[1].substr(
            1
          )
        ) *
        parseFloat(
          finder(data.upgrades, 'bow saw').effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['two-man saw'] = {
    res: 'wood',
    gatherRate: parseFloat(
      (
        gatherRates.lumberjack.gatherRate *
        parseFloat(
          finder(data.upgrades, 'double-bit axe').effects.gatherRate[1].substr(
            1
          )
        ) *
        parseFloat(
          finder(data.upgrades, 'bow saw').effects.gatherRate[1].substr(1)
        ) *
        parseFloat(
          finder(data.upgrades, 'two-man saw').effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['gold mining'] = {
    res: 'gold',
    gatherRate: parseFloat(
      (
        gatherRates['gold miner'].gatherRate *
        parseFloat(
          finder(data.upgrades, 'gold mining').effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['gold shaft mining'] = {
    res: 'gold',
    gatherRate: parseFloat(
      (
        gatherRates['gold miner'].gatherRate *
        parseFloat(
          finder(data.upgrades, 'gold mining').effects.gatherRate[1].substr(1)
        ) *
        parseFloat(
          finder(
            data.upgrades,
            'gold shaft mining'
          ).effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['relic'] = {
    res: 'gold',
    gatherRate: 0.5,
  }
  gatherRates['relic food'] = {
    res: 'food',
    gatherRate: 0.5,
  }
  gatherRates['stone mining'] = {
    res: 'stone',
    gatherRate: parseFloat(
      (
        gatherRates['stone miner'].gatherRate *
        parseFloat(
          finder(data.upgrades, 'stone mining').effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['stone shaft mining'] = {
    res: 'stone',
    gatherRate: parseFloat(
      (
        gatherRates['stone miner'].gatherRate *
        parseFloat(
          finder(data.upgrades, 'stone mining').effects.gatherRate[1].substr(1)
        ) *
        parseFloat(
          finder(
            data.upgrades,
            'stone shaft mining'
          ).effects.gatherRate[1].substr(1)
        )
      ).toFixed(2)
    ),
  }
  gatherRates['feitoria food'] = {
    res: 'food',
    gatherRate: 1.6,
  }
  gatherRates['feitoria wood'] = {
    res: 'wood',
    gatherRate: 1,
  }
  gatherRates['feitoria gold'] = {
    res: 'gold',
    gatherRate: 0.7,
  }
  gatherRates['feitoria stone'] = {
    res: 'stone',
    gatherRate: 0.3,
  }
  gatherRates['trade cart'] = {
    res: 'gold',
    gatherRate: 0.4,
  }
  gatherRates['gold from stone'] = {
    res: 'gold',
    gatherRate: gatherRates['stone miner'].gatherRate / 2,
  }
  gatherRates['gold from stone mining'] = {
    res: 'gold',
    gatherRate: gatherRates['stone mining'].gatherRate / 2,
  }
  gatherRates['gold from stone shaft'] = {
    res: 'gold',
    gatherRate: gatherRates['stone shaft mining'].gatherRate / 2,
  }
  return gatherRates
}

module.exports = async function () {
  const buf = await readFile(path.join(__dirname, '../data.json'))
  const data = JSON.parse(buf.toString('utf8'))
  return setUpGatherRates(data)
}
