import { toggle, int } from '/js/helpers.js'

let applyEcoBonuses = [{ name: 'Generic', data: {} }]

const toggleUnit = (unit) => {
  toggle(document.querySelector(`#unit-totals-box > [x-unit="${unit}"]`))
}

const makeHtmlCollection2 = (row) => (arr) => {
  // Rework this, so it does not clone the hole thing because it is ruining input[checkbox] state
  const tempRow = row.cloneNode(true)
  arr.map((it) => {
    const numDiv = tempRow.querySelector(
      `[type-resource="${it.name}"] .resource-num`
    )
    numDiv.title = it.value
    numDiv.querySelector('[x-sec]').innerText = Math.ceil(it.value)
  })
  row.innerHTML = tempRow.innerHTML
}

// calcResRate :: { Number, Number, Number } -> Number
const calcResRate = ({ rate, trainTime, res }) => {
  return 1 / ((rate * trainTime) / int(res))
}

// Type -> 'food' | 'wood' | 'gold' | 'stone'
// renResObj :: {Type, Number, Boolean, Type, String, Object} -> Array
const genResObj = ({ resType, value, visible, type, name, curr }) => {
  return type === resType
    ? [
        ...curr[resType],
        ...[
          {
            name,
            type,
            visible,
            value,
          },
        ],
      ]
    : curr[resType]
}

// calcResourceType :: Element -> Int -> Boolean -> String -> Array -> return undefined
const calcResourceType =
  (box) =>
  (unit) =>
  (multiplier) =>
  (calculation) =>
  (unitVisible) =>
  (type) =>
  (arr) => {
    const row = document.querySelector(
      `#vil-totals > .res-totals [x-row-type="${type}"]`
    )
    // shortcut the code to remove 'res-row' if the resulting number would be 0
    //
    if (
      !unitVisible &&
      arr &&
      parseFloat(row.querySelector(`.resource-num`).getAttribute('title')) -
        arr[0].value * multiplier <
        1 // less than 1 instead of === 0,
      // float minus / plus calculation could be incorrect, therefore less than 1 check is fine to remove element.
    ) {
      makeHtmlCollection2(row)(
        arr.map((it) => {
          return {
            ...it,
            value: 0,
          }
        })
      )
      return hide(row)
    }
    if (unitVisible) {
      if (calculation === 'minus') {
        makeHtmlCollection2(row)(
          arr.map((it) => {
            return {
              ...it,
              value:
                parseFloat(
                  row
                    .querySelector(`[type-resource="${it.name}"] > [title]`)
                    .getAttribute('title')
                ) - it.value,
            }
          })
        )
      } else if (calculation === 'plus') {
        makeHtmlCollection2(row)(
          arr.map((it) => {
            return {
              ...it,
              value:
                parseFloat(
                  row
                    .querySelector(`[type-resource="${it.name}"] > [title]`)
                    .getAttribute('title')
                ) + it.value,
            }
          })
        )
      } else if (calculation === 'recalc') {
        makeHtmlCollection2(row)(
          arr.map((it) => {
            return {
              ...it,
              value:
                // parseFloat(
                //   row
                //     .querySelector(`[type-resource="${it.name}"] > [title]`)
                //     .getAttribute('title')
                // ) -
                // parseFloat(
                //   document
                //     .querySelector(
                //       `.unit-container[x-unit="${unit}"] [type-resource="${it.name}"] > [title]`
                //     )
                //     .getAttribute('title')
                // ) +
                it.value * multiplier,
            }
          })
        )
      } else {
        makeHtmlCollection2(row)(
          arr.map((it) => {
            return {
              ...it,
              value:
                parseFloat(
                  row
                    .querySelector(`[type-resource="${it.name}"] > [title]`)
                    .getAttribute('title')
                ) +
                it.value * multiplier,
            }
          })
        )
      }
    } else {
      // taking into consideration that there could be multiple units
      makeHtmlCollection2(row)(
        arr.map((it) => {
          return {
            ...it,
            value:
              parseFloat(
                row
                  .querySelector(`[type-resource="${it.name}"] > [title]`)
                  .getAttribute('title')
              ) -
              it.value * multiplier,
          }
        })
      )
    }

    if (
      unitVisible &&
      row.ownerDocument.defaultView.getComputedStyle(row, null).display ===
        'none'
    ) {
      return show(row)
    }
  }

const renderGatherRate =
  (visible) => (calculation) => (multiplier) => (result) => (it) => {
    const box = document.getElementById('gather-rates')
    const row = box.querySelector(`[x-unit="${it.name}"]`)
    makeHtmlCollection2(row)(
      [...result.food, ...result.wood, ...result.gold, ...result.stone].map(
        (it) => {
          return { ...it, value: it.value * multiplier }
        }
      )
    )
    if (!calculation) toggle(row)
  }

// Element
export const unitCalc = (el, calculation) => {
  const unitVisible = Array.from(el.classList).includes('showing-img')
  const unit = el.getAttribute('unit')

  const applyCivEcoBonuses = (rateRaw, type) => {
    const rate = parseFloat(rateRaw)
    // TODO add ecoBonuses

    for (let i = 0; i < applyEcoBonuses.length; i++) {
      for (let j in applyEcoBonuses[i].data) {
        if (j === type) {
          if (typeof applyEcoBonuses[i].data[j] === 'string') {
            return parseFloat(applyEcoBonuses[i].data[j]) / 60
          }
          return rate + rate * applyEcoBonuses[i].data[j]
        }
      }
    }
    return rate
  }

  const unitRes = {
    food: el.getAttribute('x-food'), // Nullable
    wood: el.getAttribute('x-wood'), // Nullable
    gold: el.getAttribute('x-gold'), // Nullable
    stone: el.getAttribute('x-stone'), // Nullable
  }
  const trainTime = el.getAttribute('x-train-time')
  const resources = document.querySelectorAll('#choose-res > [res-type]')
  const result = Array.from(resources).reduce(
    (curr, next) => {
      const name = next.getAttribute('resource')
      const rps = next.getAttribute('res-per-sec')
      const type = next.getAttribute('res-type')
      const rate = applyCivEcoBonuses(rps, type)
      // hide resource when adding / show resource when adding
      const visible = Array.from(next.classList).includes('showing-img')
        ? 'display: block;'
        : `display: none;`

      if (unitRes[type]) {
        return {
          food: genResObj({
            resType: 'food',
            name,
            type,
            visible,
            curr,
            value: calcResRate({ rate, trainTime, res: unitRes[type] }),
          }),
          wood: genResObj({
            resType: 'wood',
            name,
            type,
            visible,
            curr,
            value: calcResRate({ rate, trainTime, res: unitRes[type] }),
          }),
          stone: genResObj({
            resType: 'stone',
            name,
            type,
            visible,
            curr,
            value: calcResRate({ rate, trainTime, res: unitRes[type] }),
          }),
          gold: genResObj({
            resType: 'gold',
            name,
            type,
            visible,
            curr,
            value: calcResRate({ rate, trainTime, res: unitRes[type] }),
          }),
        }
      } else {
        return curr
      }
    },
    { food: [], wood: [], gold: [], stone: [] }
  )

  const multiplier = int(
    document
      .querySelector(`.unit-class[x-unit="${unit}"] .resource-num`)
      .getAttribute('x-count')
  )
  console.log(multiplier)

  const box = document.getElementById('resources-cont-box')
  renderGatherRate(unitVisible)(calculation)(multiplier)(result)({
    name: unit,
    timeCreation: trainTime,
    ...unitRes,
  })
  if (!calculation) toggleUnit(unit)

  if (result.food.length > 0) {
    calcResourceType(box)(unit)(multiplier)(calculation)(unitVisible)('food')(
      result.food
    )
  }

  if (result.wood.length > 0) {
    calcResourceType(box)(unit)(multiplier)(calculation)(unitVisible)('wood')(
      result.wood
    )
  }

  if (result.gold.length > 0) {
    calcResourceType(box)(unit)(multiplier)(calculation)(unitVisible)('gold')(
      result.gold
    )
  }

  if (result.stone.length > 0) {
    calcResourceType(box)(unit)(multiplier)(calculation)(unitVisible)('stone')(
      result.stone
    )
  }
}

export const finder = (arr, name) => {
  return arr.find((e) => {
    return e.name === name
  })
}
export const civHasUpgrade = (techTree, upgradeName, building) => {
  if (building) {
    return finder(techTree[building].upgrades, upgradeName).available
  } else {
  }
}

// (setFloat) converst float to number to make calculation with int, float math is finicky
// sf :: Float -> Int
export const sf = (num) => Math.round(num * 10000)

// (getFloat) converts number to float to get what we want.
// gf :: Int -> Float
export const gf = (num) => parseFloat(Math.round(num / 100) / 100) // makes float with 2 floating points max

export const setUpGatherRates = (data) => {
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
