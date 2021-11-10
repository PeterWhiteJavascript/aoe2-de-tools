import { placeholder } from '/js/placeholder.js'
import { finder, setUpGatherRates } from '/js/shared-es.js'

let applyEcoBonuses = [{ name: 'Generic', data: {} }]

init().then(main)

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

// hides or shows element
// toggle :: Element
const toggle = (it) => {
  // https://github.com/nefe/You-Dont-Need-jQuery#8.2
  if (
    it.ownerDocument.defaultView.getComputedStyle(it, null).display === 'none'
  ) {
    it.removeAttribute('style')
  } else {
    it.style.display = 'none'
  }
}

// show :: Element
const show = (it) => {
  it.removeAttribute('style')
}

// hide :: Element
const hide = (it) => {
  it.style.display = 'none'
}

// calcResourceType :: Element -> Int -> Boolean -> String -> Array -> return undefined
const calcResourceType =
  (box) =>
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
    // add or subtract vil resources needed
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

  const unitRes = {
    food: el.getAttribute('x-food'), // Nullable
    wood: el.getAttribute('x-wood'), // Nullable
    gold: el.getAttribute('x-gold'), // Nullable
    stone: el.getAttribute('x-stone'), // Nullable
  }
  const trainTime = el.getAttribute('x-train-time')

  const resources = document.querySelectorAll('#choose-res > [res-type]')

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
          food:
            type === 'food'
              ? [
                  ...curr.food,
                  ...[
                    {
                      name: name,
                      type: type,
                      visible: visible,
                      value:
                        1 / ((rate * trainTime) / parseInt(unitRes[type], 10)),
                    },
                  ],
                ]
              : curr.food,
          wood:
            type === 'wood'
              ? [
                  ...curr.wood,
                  ...[
                    {
                      name: name,
                      type: type,
                      visible: visible,
                      value:
                        1 / ((rate * trainTime) / parseInt(unitRes[type], 10)),
                    },
                  ],
                ]
              : curr.wood,
          gold:
            type === 'gold'
              ? [
                  ...curr.gold,
                  ...[
                    {
                      name: name,
                      type: type,
                      visible: visible,
                      value:
                        1 / ((rate * trainTime) / parseInt(unitRes[type], 10)),
                    },
                  ],
                ]
              : curr.gold,
          stone:
            type === 'stone'
              ? [
                  ...curr.stone,
                  ...[
                    {
                      name: name,
                      type: type,
                      visible: visible,
                      value:
                        1 / ((rate * trainTime) / parseInt(unitRes[type], 10)),
                    },
                  ],
                ]
              : curr.stone,
        }
      } else {
        return curr
      }
    },
    { food: [], wood: [], gold: [], stone: [] }
  )

  const multiplier = parseInt(
    document
      .querySelector(`.unit-class[x-unit="${unit}"] .resource-num`)
      .getAttribute('x-count')
  )

  const box = document.getElementById('resources-cont-box')
  renderGatherRate(unitVisible)(calculation)(multiplier)(result)({
    name: unit,
    timeCreation: trainTime,
    ...unitRes,
  })
  if (!calculation) toggleUnit(unit)

  if (result.food.length > 0) {
    calcResourceType(box)(multiplier)(calculation)(unitVisible)('food')(
      result.food
    )
  }

  if (result.wood.length > 0) {
    calcResourceType(box)(multiplier)(calculation)(unitVisible)('wood')(
      result.wood
    )
  }

  if (result.gold.length > 0) {
    calcResourceType(box)(multiplier)(calculation)(unitVisible)('gold')(
      result.gold
    )
  }

  if (result.stone.length > 0) {
    calcResourceType(box)(multiplier)(calculation)(unitVisible)('stone')(
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
  const num = parseInt(box.innerText) + 1
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
  if (parseInt(box.innerText) <= 1) return // do not go to 0 or lower

  const num = parseInt(box.innerText) - 1
  box.innerText = num

  const unitCountBox = document.querySelector(
    `.unit-class[x-unit="${unit}"] .resource-num`
  )
  unitCountBox.title = `${num}x ${unit}`
  unitCountBox.setAttribute('x-count', num)
  unitCountBox.innerHTML = `<div>${num}</div>`

  unitCalc(unitStatsBox, 'minus')
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
    },
    false
  )
}
