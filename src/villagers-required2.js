import { placeholder } from '/js/placeholder.js'
import { finder, setUpGatherRates } from '/js/shared-es.js'
import { hide, show, toggle, toggleCheckbox, int } from '/js/helpers.js'

let applyEcoBonuses = [{ name: 'Generic', data: {} }]

init().then(main)

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

// Generates String html collection
// example:
// <div id="1"></div>
// <div id="2"></div>
// <div id="3"></div>
// makeHtmlCollection :: String -> Array -> returns String
const makeHtmlCollection = (templateItem) => (arr) => {
  return (
    arr
      // this needs to be mapped into src of the image,
      // otherwise image in template with src is trying to load the src resulting in 404,
      // therefore we are adding src="img path" later
      .map((it) => {
        if (typeof it.prevAddValue !== 'undefined') {
          const newValue = it.prevAddValue + it.value
          return {
            ...it,
            src: `src="/img/${it.name}.png"`,
            value: newValue,
            valueCeiling: Math.ceil(newValue),
          }
        } else if (typeof it.prevDelValue !== 'undefined') {
          const newValue = it.prevDelValue - it.value
          return {
            ...it,
            src: `src="/img/${it.name}.png"`,
            value: newValue,
            valueCeiling: Math.ceil(newValue),
          }
        } else {
          return {
            ...it,
            src: `src="/img/${it.name}.png"`,
            valueCeiling: Math.ceil(it.value),
          }
        }
      })
      .map((it) => {
        return placeholder(templateItem.outerHTML)(it)
      })
      .reduce((curr, next) => {
        return `${curr}
${next}`
      }, '')
  )
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

const resClickEventHandlers = (event) => {
  if (!event.target.closest('[resource]')) return
  event.preventDefault()

  const el = event.target.closest('[resource]')
  el.classList.toggle('showing-img')
  const res = el.getAttribute('resource')
  Array.from(
    document.querySelectorAll(
      `#gather-rates > .unit-container [type-resource="${res}"]`
    )
  ).map((it) => {
    toggle(it)
  })

  Array.from(
    document.querySelectorAll(
      `#vil-totals > .res-totals [type-resource="${res}"]`
    )
  ).map((it) => {
    toggle(it)
  })
}

const unitClickEventHandlers = (event) => {
  if (!event.target.closest('[unit]')) return
  event.preventDefault()

  const el = event.target.closest('[unit]')
  el.classList.toggle('showing-img')

  unitCalc(el)
}

// Element
const unitCalc = (el, calculation) => {
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

async function init() {
  const data = await fetch('/data/unitVariety.json').then((response) =>
    response.json()
  )
  return data
}

const unitPlusClickEventHandlers = (event) => {
  if (!event.target.closest('[x-unit-count-calc="plus"]')) return
  event.preventDefault()

  const unitBox = event.target.closest('[x-unit]')
  const unit = unitBox.getAttribute('x-unit')
  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)
  const box = unitBox.querySelector('[x-unit-count="num"]')
  const num = int(box.innerText) + 1
  box.innerText = num
  const unitCountBox = document.querySelector(
    `.unit-class[x-unit="${unit}"] .resource-num`
  )
  unitCountBox.title = `${num}x ${unit}`
  unitCountBox.setAttribute('x-count', num)
  unitCountBox.innerHTML = `<div>${num}</div>`

  unitCalc(unitStatsBox, 'plus')
}

const unitMinusClickEventHandlers = (event) => {
  if (!event.target.closest('[x-unit-count-calc="minus"]')) return
  event.preventDefault()

  const unitBox = event.target.closest('[x-unit]')
  const unit = unitBox.getAttribute('x-unit')
  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)
  const box = unitBox.querySelector('[x-unit-count="num"]')
  if (int(box.innerText) <= 1) return // do not go to 0 or lower

  const num = int(box.innerText) - 1
  box.innerText = num

  const unitCountBox = document.querySelector(
    `.unit-class[x-unit="${unit}"] .resource-num`
  )
  unitCountBox.title = `${num}x ${unit}`
  unitCountBox.setAttribute('x-count', num)
  unitCountBox.innerHTML = `<div>${num}</div>`

  unitCalc(unitStatsBox, 'minus')
}

const clickOnApplyEcoBonusHandlers = (event) => {
  if (!event.target.matches('input[x-upgrade-unit]')) return
  toggleCheckbox(event.target)

  const unit = event.target.getAttribute('x-upgrade-unit')

  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)

  if (event.target.hasAttribute('x-img-swap')) {
    const arr = Array.from(
      event.target
        .closest('.unit-container')
        .querySelectorAll('input[x-img-swap]:checked')
    )
    if (arr && arr.length > 0) {
      arr.map((it) => {
        const swap = it.getAttribute('x-img-swap')
        Array.from(document.querySelectorAll(`img[alt="${unit}"]`)).map(
          (img) => {
            img.src = `/img/${swap.replace(/-/g, ' ')}.png` // replace all dashes with space
          }
        )
      })
    } else {
      Array.from(document.querySelectorAll(`img[alt="${unit}"]`)).map((img) => {
        img.src = `/img/${unit}.png`
      })
    }
  }

  const baseTraintime = parseFloat(
    unitStatsBox.getAttribute('x-base-train-time')
  )
  let tempTrainTime = baseTraintime
  let priceChanged = false
  console.log(tempTrainTime)
  Array.from(
    document.querySelectorAll(
      `#gather-rates .unit-container[x-unit="${unit}"] input:checked`
    )
  ).map((it) => {
    const trainTime = it.getAttribute('x-train-time')
    const percent = it.getAttribute('x-train-time-percent')
    if (trainTime) {
      if (percent && percent === 'true') {
        tempTrainTime = tempTrainTime / parseFloat(trainTime)
      } else {
        tempTrainTime = parseFloat(trainTime)
      }
    }

    const xfood = it.getAttribute('x-cost-food')
    const xwood = it.getAttribute('x-cost-wood')
    const xgold = it.getAttribute('x-cost-gold')
    const xstone = it.getAttribute('x-cost-stone')
    if (xfood) {
      priceChanged = true
      const operator = xfood.slice(0, 1)
      const food = int(xfood.slice(1))
      const baseFood = int(unitStatsBox.getAttribute('x-base-food'))

      // case "0.2" // 20% cheaper
      if (operator === '0') {
        unitStatsBox.setAttribute('x-food', baseFood * (1 - parseFloat(xfood)))
        // case "-45"
      } else if (operator === '-') {
        unitStatsBox.setAttribute('x-food', baseFood - int(xfood.slice(1)))
        // case "+45"
      } else if (operator === '+') {
        unitStatsBox.setAttribute('x-food', baseFood + int(xfood.slice(1)))
        // case "45"
      } else {
        unitStatsBox.setAttribute('x-food', baseFood + int(xfood))
      }
    }

    if (xwood) {
      priceChanged = true
      const operator = xwood.slice(0, 1)
      const baseWood = int(unitStatsBox.getAttribute('x-base-wood'))
      // case "0.2" // 20% cheaper
      if (operator === '0') {
        unitStatsBox.setAttribute('x-wood', baseWood * (1 - parseFloat(xwood)))
        // case "-45"
      } else if (operator === '-') {
        unitStatsBox.setAttribute('x-wood', baseWood - int(xwood.slice(1)))
        // case "+45"
      } else if (operator === '+') {
        unitStatsBox.setAttribute('x-wood', baseWood + int(xwood.slice(1)))
        // case "45"
      } else {
        unitStatsBox.setAttribute('x-wood', baseWood + int(xwood))
      }
    }

    if (xgold) {
      priceChanged = true
      const operator = xgold.slice(0, 1)
      const baseGold = int(unitStatsBox.getAttribute('x-base-gold'))
      // case "0.2" // 20% cheaper
      if (operator === '0') {
        unitStatsBox.setAttribute('x-gold', baseGold * (1 - parseFloat(xgold)))
        // case "-45"
      } else if (operator === '-') {
        unitStatsBox.setAttribute('x-gold', baseGold - int(xgold.slice(1)))
        // case "+45"
      } else if (operator === '+') {
        unitStatsBox.setAttribute('x-gold', baseGold + int(xgold.slice(1)))
        // case "45"
      } else {
        unitStatsBox.setAttribute('x-gold', baseGold + int(xgold))
      }
    }

    if (xstone) {
      priceChanged = true
      const operator = xstone.slice(0, 1)
      const baseStone = int(unitStatsBox.getAttribute('x-base-stone'))
      // case "0.2" // 20% cheaper
      if (operator === '0') {
        unitStatsBox.setAttribute(
          'x-stone',
          baseStone * (1 - parseFloat(xstone))
        )
        // case "-45"
      } else if (operator === '-') {
        unitStatsBox.setAttribute('x-stone', baseStone - int(xstone.slice(1)))
        // case "+45"
      } else if (operator === '+') {
        unitStatsBox.setAttribute('x-stone', baseStone + int(xstone.slice(1)))
        // case "45"
      } else {
        unitStatsBox.setAttribute('x-stone', baseStone + int(xstone))
      }
    }
  })

  // reset timer on unit info
  event.target
    .closest('.unit-container[x-unit]')
    .querySelector('.time-cont div').innerText = Math.ceil(tempTrainTime)

  if (!priceChanged) {
    if (unitStatsBox.hasAttribute('x-base-food'))
      unitStatsBox.setAttribute(
        'x-food',
        unitStatsBox.getAttribute('x-base-food')
      )
    if (unitStatsBox.hasAttribute('x-base-wood'))
      unitStatsBox.setAttribute(
        'x-wood',
        unitStatsBox.getAttribute('x-base-wood')
      )
    if (unitStatsBox.hasAttribute('x-base-gold'))
      unitStatsBox.setAttribute(
        'x-gold',
        unitStatsBox.getAttribute('x-base-gold')
      )
    if (unitStatsBox.hasAttribute('x-base-stone'))
      unitStatsBox.setAttribute(
        'x-stone',
        unitStatsBox.getAttribute('x-base-stone')
      )
  }

  unitStatsBox.setAttribute('x-train-time', tempTrainTime.toFixed(2))
  console.log(unitStatsBox)
  unitCalc(unitStatsBox, 'recalc')
  // TODO something with calculation is crooked, apply bonuses from base
}

async function main() {
  document.addEventListener(
    'click',
    function (event) {
      // TODO event on change of the select option
      // TODO event on change of the checkbox

      resClickEventHandlers(event)
      unitClickEventHandlers(event)
      unitPlusClickEventHandlers(event)
      unitMinusClickEventHandlers(event)
      clickOnApplyEcoBonusHandlers(event)
    },
    false
  )
}
