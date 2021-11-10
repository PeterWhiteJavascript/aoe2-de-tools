import { placeholder } from '/js/placeholder.js'
import { finder, setUpGatherRates } from '/js/shared-es.js'

let applyEcoBonuses = [{ name: 'Generic', data: {} }]

// TODO remove
init().then(main)

const renderGatherRate = (visible) => (result) => (it) => {
  const box = document.getElementById('gather-rates-id')
  if (visible) {
    const tItem = document.getElementById('t-gather-rates-item')
    const item = tItem.content.firstElementChild.cloneNode(true)

    const src = `src="/img/${it.name}.png"`
    let resources = ''
    if (it.food) {
      resources = `${resources}
<div class="res-cont" title="food">
  <img src="/img/food-icon.png" alt="food" />
  <div>
    ${it.food}
  </div>
</div>`
    }

    if (it.wood) {
      resources = `${resources}
<div class="res-cont" title="wood">
  <img src="/img/wood-icon.png" alt="wood" />
  <div>
    ${it.wood}
  </div>
</div>`
    }

    if (it.gold) {
      resources = `${resources}
<div class="res-cont" title="gold">
  <img src="/img/gold-icon.png" alt="gold" />
  <div>
    ${it.gold}
  </div>
</div>`
    }
    if (it.stone) {
      resources = `${resources}
<div class="res-cont" title="stone">
  <img src="/img/stone-icon.png" alt="stone" />
  <div>
    ${it.stone}
  </div>
</div>`
    }

    let resourcesUnit = ''
    const tResRow = document.getElementById('t-res-row')
    const tResItem = document.getElementById('t-res-row-resource')
    if (result.food.length > 0) {
      const rResRow = tResRow.content.firstElementChild.cloneNode(true)
      const rResItem = tResItem.content.firstElementChild.cloneNode(true)
      rResRow.setAttribute('x-row-type', 'food')
      rResRow.innerHTML = makeHtmlCollection(rResItem)(result.food)
      resourcesUnit = `${resourcesUnit}
${rResRow.outerHTML}`
    }

    if (result.wood.length > 0) {
      const rResRow = tResRow.content.firstElementChild.cloneNode(true)
      const rResItem = tResItem.content.firstElementChild.cloneNode(true)
      rResRow.setAttribute('x-row-type', 'wood')
      rResRow.innerHTML = makeHtmlCollection(rResItem)(result.wood)
      resourcesUnit = `${resourcesUnit}
${rResRow.outerHTML}`
    }

    if (result.gold.length > 0) {
      const rResRow = tResRow.content.firstElementChild.cloneNode(true)
      const rResItem = tResItem.content.firstElementChild.cloneNode(true)
      rResRow.setAttribute('x-row-type', 'gold')
      rResRow.innerHTML = makeHtmlCollection(rResItem)(result.gold)
      resourcesUnit = `${resourcesUnit}
${rResRow.outerHTML}`
    }
    if (result.stone.length > 0) {
      const rResRow = tResRow.content.firstElementChild.cloneNode(true)
      const rResItem = tResItem.content.firstElementChild.cloneNode(true)
      rResRow.setAttribute('x-row-type', 'stone')
      rResRow.innerHTML = makeHtmlCollection(rResItem)(result.stone)
      resourcesUnit = `${resourcesUnit}
${rResRow.outerHTML}`
    }

    const newItem = new DOMParser().parseFromString(
      placeholder(item.outerHTML)({ ...it, src, resources, resourcesUnit }),
      'text/html'
    )

    box.appendChild(newItem.body.firstElementChild)
  } else {
    box.querySelector(`[x-unit="${it.name}"]`).remove()
  }
}

// renderUnit :: Boolean -> Object({name, value}) -> returns undefined
const renderUnit = (visible) => (it) => {
  const unitsBox = document.getElementById('unit-totals-box')
  if (!visible) {
    unitsBox.querySelector(`[x-unit="${it.name}"]`).remove()
    return
  } else {
    const tUnitItem = document.getElementById('t-unit-class')
    // returns what is inside of the template element
    const templateUnit = tUnitItem.content.firstElementChild.cloneNode(true)
    const src = `src="/img/${it.name}.png"`
    const newUnit = new DOMParser().parseFromString(
      placeholder(templateUnit.outerHTML)({ ...it, src }),
      'text/html'
    )
    unitsBox.appendChild(newUnit.body.firstElementChild)
    return
  }
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
    it.style.display = 'block'
  } else {
    it.style.display = 'none'
  }
}

// calcResourceType :: Element -> Boolean -> String -> Array -> return undefined
const calcResourceType = (box) => (unitVisible) => (type) => (arr) => {
  const doesRowExist = document.querySelector(
    `#vil-totals > .res-totals [x-row-type="${type}"]`
  )

  // shortcut the code to remove 'res-row' if the resulting number would be 0
  if (
    !unitVisible &&
    arr &&
    doesRowExist &&
    doesRowExist.querySelector(`.resource-num`).getAttribute('title') -
      arr[0].value <
      1 // less than 1 instead of === 0,
    // float minus / plus calculation could be incorrect, therefore less than 1 check is fine to remove element.
  ) {
    doesRowExist.remove()
    return
  }

  const tResRow = document.getElementById('t-res-row')
  const tResItem = document.getElementById('t-res-row-resource')
  // returns what is inside of the template element
  const rResRow = tResRow.content.firstElementChild.cloneNode(true)
  const rResItem = tResItem.content.firstElementChild.cloneNode(true)

  if (doesRowExist) {
    if (unitVisible) {
      const arrWithPrevValue = arr.map((it) => {
        return {
          ...it,
          prevAddValue: parseFloat(
            doesRowExist
              .querySelector(`[resource="${it.name}"] > [title]`)
              .getAttribute('title')
          ),
        }
      })

      doesRowExist.innerHTML = makeHtmlCollection(rResItem)(arrWithPrevValue)
    } else {
      const arrWithPrevValue = arr.map((it) => {
        return {
          ...it,
          prevDelValue: parseFloat(
            doesRowExist
              .querySelector(`[resource="${it.name}"] > [title]`)
              .getAttribute('title')
          ),
        }
      })

      doesRowExist.innerHTML = makeHtmlCollection(rResItem)(arrWithPrevValue)
    }
  } else {
    rResRow.setAttribute('x-row-type', type)
    rResRow.innerHTML = makeHtmlCollection(rResItem)(arr)
    box.appendChild(rResRow)
  }
}

const getHiddenRes = () => {
  const chres = Array.from(
    document.querySelectorAll('#choose-res > .res-show-img >.showing-img')
  ).map((it) => it.getAttribute('resource'))
}

const calculateVilTotals = () => {
  let unitsBeingCreated = {}
  let vilsReq = {}
  //Get all visible unit conatiners.
  Array.from(
    document.querySelectorAll('#gather-rates > .unit-container:visible')
  ).map((it) => {
    const unitName = it
      .querySelector('.unit > .unit-class > img')
      .getAttribute('title')
    console.log({ unitName })
    unitsBeingCreated[unitName] = {}
    Array.from(it.querySelectorAll('.unit > .res-cont')).map((cont) => {
      const res = cont.getAttribute('title')
      unitsBeingCreated[unitName][res] = parseInt(
        cont.querySelector('div').innerText
      )
    })
    unitsBeingCreated[unitName].quantity = parseInt(
      it.querySelector('.unit > .multiplier-cont > div:eq(1)').innerText
    )
    Array.from(
      it.querySelectorAll(
        '.res-desc-cont > .resources-cont > .res-row > .resource'
      )
    ).map((cont) => {
      const resName = cont.querySelector('.icon-big').getAttribute('title')
      const resVal = parseFloat(
        cont.querySelector('.resource-num').getAttribute('title')
      )
      vilsReq[resName] = vilsReq[resName] ? vilsReq[resName] + resVal : resVal
    })
  })

  const resTotals = new DOMParser().parseFromString(
    "<div class='res-totals'></div>",
    'text/html'
  )
  const resDisplay = new DOMParser().parseFromString(
    "<div class='resources-cont'></div>",
    'text/html'
  )
  const unitsDisplay = new DOMParser().parseFromString(
    "<div class='unit-totals'></div>",
    'text/html'
  )

  const hiddenRes = getHiddenRes()

  let resRow, curRes
  for (let i in vilsReq) {
    let res = gatherRates[i].res
    if (curRes !== res) {
      if (resRow) {
        resDisplay.appendChild(resRow)
      }
      curRes = res

      resRow = new DOMParser().parseFromString(
        "<div class='res-row'></div>",
        'text/html'
      )
    }
    let resElm = new DOMParser().parseFromString(`
      <div class='resource' resource='${i}'>
        <img class='icon-big' src='/img/${i}.png' title='${i}'>
        <div class='resource-num' title='${vilsReq[i]}'>
          <div>${Math.ceil(vilsReq[i])}'</div>
        </div>
      </div>'", 'text/html'`)
    resRow.appendChild(resElm)
    if (hiddenRes.includes(i)) {
      resElm.style.display = 'none'
    }
  }
  resDisplay.appendChild(resRow)

  for (let i in unitsBeingCreated) {
    unitsDisplay.appendChild(
      "<div class='unit-class'><div class='resource-num' title='" +
        unitsBeingCreated[i].quantity +
        "'><div>" +
        Math.ceil(unitsBeingCreated[i].quantity) +
        "</div></div><img src='/img/" +
        i +
        ".png' title='" +
        i +
        "'></div>"
    )
  }

  resTotals.appendChild(resDisplay)
  resTotals.appendChild(unitsDisplay)
  document.querySelector('#vil-totals > .res-totals').innerHTML = resTotals
}

const resClickEventHandlers = (event) => {
  if (!event.target.closest('[resource]')) return
  event.preventDefault()

  const el = event.target.closest('[resource]')
  el.classList.toggle('showing-img')
  const res = el.getAttribute('resource')
  Array.from(
    document.querySelectorAll(
      `#gather-rates-id > .unit-container [resource="${res}"]`
    )
  ).map((it) => {
    toggle(it)
  })

  Array.from(
    document.querySelectorAll(`#vil-totals > .res-totals [resource="${res}"]`)
  ).map((it) => {
    toggle(it)
  })
}

const unitClickEventHandlers = (event) => {
  if (!event.target.closest('[unit]')) return
  event.preventDefault()

  const el = event.target.closest('[unit]')
  el.classList.toggle('showing-img')
  const unitVisible = Array.from(el.classList).includes('showing-img')

  const unit = el.getAttribute('unit')

  const unitRes = {
    food: el.getAttribute('x-food'), // Nullable
    wood: el.getAttribute('x-wood'), // Nullable
    gold: el.getAttribute('x-gold'), // Nullable
    stone: el.getAttribute('x-stone'), // Nullable
  }
  const trainTime = el.getAttribute('x-train-time')

  const multiplier = 1 // DUMMY VALUE TODO change

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

  const box = document.getElementById('resources-cont-box')
  renderGatherRate(unitVisible)(result)({
    name: unit,
    timeCreation: trainTime,
    ...unitRes,
  })
  renderUnit(unitVisible)({ name: unit, value: 1 })

  // TODO check if the resources are already present
  // TODO check for the visible resources and add Boolean value to indicate if they are shown or not
  // TODO split this into resource type eg. gold, wood , food, stone

  if (result.food.length > 0) {
    calcResourceType(box)(unitVisible)('food')(result.food)
  }

  if (result.wood.length > 0) {
    calcResourceType(box)(unitVisible)('wood')(result.wood)
  }

  if (result.gold.length > 0) {
    calcResourceType(box)(unitVisible)('gold')(result.gold)
  }

  if (result.stone.length > 0) {
    calcResourceType(box)(unitVisible)('stone')(result.stone)
  }

  // this is triggered by calculate vills call function
  // This takes care of adding row for resource when unit depends on it. // toggles display none or ""
  // let res = gatherRates[i].res
  // if (curRes !== res) {
  //   if (resRow) resDisplay.append(resRow)
  //   curRes = res
  //   resRow = $("<div class='res-row'></div>")
  // }
  // let resElm = $(
  //   "<div class='resource' resource='" +
  //     i +
  //     "'><img class='icon-big' src='/img/" +
  //     i +
  //     ".png' title='" +
  //     i +
  //     "'><div class='resource-num' title='" +
  //     vilsReq[i] +
  //     "'><div>" +
  //     Math.ceil(vilsReq[i]) +
  //     '</div></div></div>'
  // )
  // resRow.append(resElm)
  // if (hiddenRes.includes(i)) {
  //   $(resElm).hide()
  // }
  //
  //
  //
}

async function init() {
  const data = await fetch('/data.json') // this takes 500ms on localhost
    .then((response) => response.json())
  // load data and generate gatherRates
  const gatherRates = setUpGatherRates(data) // this takes 1ms
  console.log(gatherRates)
  return gatherRates
}

async function main(gatherRates) {
  document.addEventListener(
    'click',
    function (event) {
      // TODO event on change of the select option
      // TODO event on change of the checkbox
      //
      // TODO event on click for units

      resClickEventHandlers(event)
      unitClickEventHandlers(event)
    },
    false
  )
  // const test = document.getElementById('t-test').innerHTML
  // console.log(test)

  // document.getElementById('t-box').innerHTML = placeholder(test)({test: 'works'})

  // <template id="t-test">
  //   <p>[[test]]</p>
  // </template>
  // <div id="t-box"></div>
}
