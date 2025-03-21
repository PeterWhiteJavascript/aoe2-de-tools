import { toggleCheckbox, int, hide, show, isInt } from '/js/helpers.js'
import { unitCalc, fwgs } from '/js/shared-es.js'
import { calculateCivilizationBonusOnUnit } from '/js/events/change-unit-civilization-selection-handlers.js'

// do not take base, because option selected would be ignored
//
// Type -> 'food' | 'wood' | 'gold' | 'stone'
// baseType -> 'food' | 'wood' | 'gold' | 'stone' 
//    for calculating from another resource type for percentage calculation to distribute percentage values among multiple resources
//    example: wood = 40% of stone, here type is wood and baseType is stone
// setResAttribute :: Element -> { Type, String, String } -> Effect
export const setResAttribute =
  (elem) =>
  ({ type, res, baseType }) => {
    //override calculation based on another base if base resource type is present
    if(!baseType)
      baseType = type

    // Operator -> '0' | '+' | '-' | any String
    const operator = res.slice(0, 1)
    const base = int(elem.getAttribute(`x-${baseType}`)) // x-food for example
    
    let current = elem.getAttribute(`x-${type}`);
    let currentValue;

    if (current)
      currentValue = int(elem.getAttribute(`x-${type}`))

    if(!currentValue)
      currentValue = 0;

    if (base || base === 0) {
      // case "0.2" // 20% cheaper
      if (operator === '0') {
        currentValue = currentValue - base * parseFloat(res)
      }
      // case "-45","+45" or "-0.40","+0.40"
      else if (operator === '-') {
        //case "-45","+45"
        if (isInt(res.slice(1))) {
          currentValue = currentValue + int(res)  
        }
        //case "-0.40","+0.40"
        else{
          currentValue = currentValue + (base * parseFloat(res))
        }
      }
      else if (operator === '+') {
        //case "-45","+45"
        if (isInt(res.slice(1))) {
          currentValue = currentValue + int(res)
        }
        //case "-0.40","+0.40"
        else{
          currentValue = currentValue + (base * parseFloat(res))
        }
      }
      // case "45"
      else{
        currentValue = currentValue + int(res)
      }

      elem.setAttribute(`x-${type}`, currentValue)
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
            img.src = `/img/${swap.replace(/-/g, ' ')}.webp` // replace all dashes with spaces
          }
        )
      })
    } else {
      Array.from(document.querySelectorAll(`img[alt="${unit}"]`)).map((img) => {
        img.src = `/img/${unit}.webp`
      })
    }
  }
}

// Type -> 'food' | 'wood' | 'gold' | 'stone'
// setResToBaseValue :: Element -> Type -> Effect
export const setResToBaseValue = (elem) => (type) => {
  if (elem.hasAttribute(`x-base-${type}`))
    elem.setAttribute(`x-${type}`, elem.getAttribute(`x-base-${type}`))
}

const hideThingsIfUnitPriceIsZero = (unitFrom, unitTo) => {
  const showHideUnitResourceForUnit = (unit) => (resource) => {
    const res = unitFrom.getAttribute(`x-${resource}`)
    if (res || res === '0')
      Array.from(
        document.querySelectorAll(
          `[x-unit="${unit}"] [x-row-type="${resource}"]`
        )
      ).map((it) => {
        if (res === '0') hide(it)
        else show(it)
      })
  }

  const showHideUnitResourcePriceForUnit = (unit) => (resource) => {
    Array.from(
      document.querySelectorAll(
        `[x-unit="${unit}"] .res-cont[title="${resource}"]`
      )
    ).map((it) => {
      if (it.querySelector('div').innerText === '0') hide(it)
      else show(it)
    })
  }
  const unit = unitFrom.getAttribute('unit')
  fwgs.map(showHideUnitResourceForUnit(unit))
  fwgs.map(showHideUnitResourcePriceForUnit(unit))
}

const updateUnitResourceInfo = (unitInfoFrom, unitInfoTo) => {
  const updateResource = (type) => {
    if (unitInfoFrom.hasAttribute(`x-${type}`)) {
      unitInfoTo.querySelector(`.res-cont[title="${type}"] div`).innerText =
        Math.ceil(parseFloat(unitInfoFrom.getAttribute(`x-${type}`)))
    }
  }
  fwgs.map(updateResource)
}

export const calculateBonusesOnUnit = (option) => (target) => {
  let { priceChanged, trainTimePercentModifier, tempTrainTime } = Object.assign(
    {
      priceChanged: false,
    },
    option // override defaults
  )

  const unitBox = target.closest('.unit-container[x-unit]')
  const unit = unitBox.getAttribute('x-unit')
  const unitStatsBox = document.querySelector(`[unit="${unit}"]`)
  // set defaults

  const setUnitResourceAttributes = setResAttribute(unitStatsBox)
  const setResourceToBaseValue = setResToBaseValue(unitStatsBox)

  swapImageIfPresent({ input: target, unit })

  Array.from(
    document.querySelectorAll(
      `#gather-rates .unit-container[x-unit="${unit}"] input:checked`
    )
  ).map((it) => {
    const trainTime = it.getAttribute('x-train-time')
    const percent = it.getAttribute('x-train-time-percent')
    if (trainTime) {
      if (percent && percent === 'true') {
        trainTimePercentModifier = trainTimePercentModifier * parseFloat(trainTime)
      } else {
        tempTrainTime = parseFloat(trainTime)
      }
    }

    const food = it.getAttribute('x-cost-food')
    const wood = it.getAttribute('x-cost-wood')
    const gold = it.getAttribute('x-cost-gold')
    const stone = it.getAttribute('x-cost-stone')
    const baseType = it.getAttribute('x-cost-base-resource')

    if (food) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'food', res: food, baseType: baseType })
    }
    if (wood) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'wood', res: wood, baseType: baseType })
    }
    if (gold) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'gold', res: gold, baseType: baseType })
    }
    if (stone) {
      priceChanged = true
      setUnitResourceAttributes({ type: 'stone', res: stone, baseType: baseType })
    }
  })

  tempTrainTime = tempTrainTime / trainTimePercentModifier

  // reset timer on unit info
  unitBox.querySelector('.time-cont div').innerText = isInt(tempTrainTime)
    ? Math.ceil(tempTrainTime)
    : tempTrainTime.toFixed(2)

  if (!priceChanged) {
    fwgs.map(setResToBaseValue)
  }
  updateUnitResourceInfo(unitStatsBox, unitBox)
  unitStatsBox.setAttribute('x-train-time', tempTrainTime.toFixed(2))
  unitCalc(unitStatsBox, 'recalc')
  hideThingsIfUnitPriceIsZero(unitStatsBox, unitBox)
}

export const clickUnitBonusesHandler = (event) => {
  if (!event.target.matches('input[x-upgrade-unit]')) return
  toggleCheckbox(event.target)
  const obj = calculateCivilizationBonusOnUnit(event.target)
  calculateBonusesOnUnit(obj)(event.target)
}
