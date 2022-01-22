import { int, changeSelection } from '/js/helpers.js'
import {
  calculateBonusesOnUnit,
  asignNewValuesToUnit,
  setResToBaseValue,
} from '/js/events/click-unit-bonuses-handlers.js'

// usage of base values because we calculate this bonuses first !
// Type -> 'food' | 'wood' | 'gold' | 'stone'
// setResAttributeCiv :: Element -> { Type, String } -> Effect
export const setResAttributeCiv =
  (elem) =>
  ({ type, res }) => {
    // Operator -> '0' | '+' | '-' | any String
    const operator = res.slice(0, 1)
    const base = int(elem.getAttribute(`x-base-${type}`)) // x-base-food for example

    if (base) {
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
  }

export const calculateCivilizationBonusOnUnit = (option) => (target) => {
  let { priceChanged, tempTrainTime } = Object.assign(
    {
      priceChanged: false,
    },
    option // override defaults
  )

  const unitBox = target.closest('.unit-container[x-unit]')
  const unit = unitBox.getAttribute('x-unit')

  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)
  const setUnitResourceAttributes = setResAttributeCiv(unitStatsBox)

  const selectElem = document.querySelector(
    `#gather-rates .unit-container[x-unit="${unit}"] select[unit-option="civilization"]`
  )
  let it = selectElem.querySelector(`option[value="${selectElem.value}"]`) // option element with data
  if (!it) it = selectElem.firstElementChild // take Generic option if there is no other option selected
  const trainTime = it.getAttribute('x-opt-train-time')
  const percent = it.getAttribute('x-opt-train-time-percent')
  if (trainTime) {
    if (percent && percent === 'true') {
      tempTrainTime = tempTrainTime / parseFloat(trainTime)
    } else {
      tempTrainTime = parseFloat(trainTime)
    }
  }

  const food = it.getAttribute('x-opt-cost-food')
  const wood = it.getAttribute('x-opt-cost-wood')
  const gold = it.getAttribute('x-opt-cost-gold')
  const stone = it.getAttribute('x-opt-cost-stone')

  // modify x-food or reset it to base-value for later computation
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
  return { tempTrainTime, priceChanged }
}

export const unitCivChangeSelectionHandlers = (event) => {
  if (!event.target.matches('[unit-option="civilization"]')) return
  let option = event.target.querySelector(`[value="${event.target.value}"]`)
  if (!option) option = event.target.firstElementChild
  changeSelection(event.target, option)
  // apply input bonuses
  const obj = calculateBonusesOnUnit(event.target) // make sure to applie input checked bonuses as well
  // apply civ bonuses
  const opt = calculateCivilizationBonusOnUnit(obj)(option)
  asignNewValuesToUnit(opt)(event.target)
}
