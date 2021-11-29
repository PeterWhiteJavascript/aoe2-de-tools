import { toggleCheckbox, int } from '/js/helpers.js'
import { unitCalc } from '/js/shared-es.js'

// Type -> 'food' | 'wood' | 'gold' | 'stone'
// setResAttribute :: Element -> { Type, String } -> Effect
const setResAttribute =
  (elem) =>
  ({ type, res }) => {
    // Operator -> '0' | '+' | '-' | any String
    const operator = res.slice(0, 1)
    const base = int(elem.getAttribute(`x-base-${type}`)) // x-base-food for example

    // case "0.2" // 20% cheaper
    if (operator === '0') {
      elem.setAttribute(`x-${type}`, base * (1 - parseFloat(res)))
      // case "-45"
    } else if (operator === '-') {
      elem.setAttribute(`x-${type}`, base - int(res.slice(1)))
      // case "+45"
    } else if (operator === '+') {
      elem.setAttribute(`x-${type}`, base + int(res.slice(1)))
      // case "45"
    } else {
      elem.setAttribute(`x-${type}`, base + int(res))
    }
  }

// swapImageIfPresent :: { Element, String } -> Effect
const swapImageIfPresent = ({ input, unit }) => {
  if (input.hasAttribute('x-img-swap')) {
    const arr = Array.from(
      input
        .closest('.unit-container')
        .querySelectorAll('input[x-img-swap]:checked')
    )
    if (arr && arr.length > 0) {
      arr.map((it) => {
        const swap = it.getAttribute('x-img-swap')
        Array.from(document.querySelectorAll(`img[alt="${unit}"]`)).map(
          (img) => {
            img.src = `/img/${swap.replace(/-/g, ' ')}.png` // replace all dashes with spaces
          }
        )
      })
    } else {
      Array.from(document.querySelectorAll(`img[alt="${unit}"]`)).map((img) => {
        img.src = `/img/${unit}.png`
      })
    }
  }
}

// Type -> 'food' | 'wood' | 'gold' | 'stone'
// setResToBaseValue :: Element -> Type -> Effect
const setResToBaseValue = (elem) => (type) => {
  if (elem.hasAttribute(`x-base-${type}`))
    elem.setAttribute(`x-type`, elem.getAttribute(`x-base-${type}`))
}

export const clickUnitBonusesHandler = (event) => {
  if (!event.target.matches('input[x-upgrade-unit]')) return
  toggleCheckbox(event.target)

  const unit = event.target.getAttribute('x-upgrade-unit')

  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)
  const setUnitResourceAttributes = setResAttribute(unitStatsBox)
  const setResourceToBaseValue = setResToBaseValue(unitStatsBox)

  swapImageIfPresent({ input: event.target, unit })

  const baseTraintime = parseFloat(
    unitStatsBox.getAttribute('x-base-train-time')
  )
  let tempTrainTime = baseTraintime
  let priceChanged = false
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

    const food = it.getAttribute('x-cost-food')
    const wood = it.getAttribute('x-cost-wood')
    const gold = it.getAttribute('x-cost-gold')
    const stone = it.getAttribute('x-cost-stone')
    if (food) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'food', res: food })
    }
    if (wood) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'wood', res: wood })
    }
    if (gold) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'gold', res: gold })
    }
    if (stone) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'stone', res: stone })
    }
  })

  // reset timer on unit info
  event.target
    .closest('.unit-container[x-unit]')
    .querySelector('.time-cont div').innerText = Math.ceil(tempTrainTime)

  if (!priceChanged) {
    setResourceToBaseValue('food')
    setResourceToBaseValue('wood')
    setResourceToBaseValue('gold')
    setResourceToBaseValue('stone')
  }

  unitStatsBox.setAttribute('x-train-time', tempTrainTime.toFixed(2))
  unitCalc(unitStatsBox, 'recalc')
}
