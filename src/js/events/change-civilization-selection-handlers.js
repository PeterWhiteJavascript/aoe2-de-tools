import { changeSelection } from '/js/helpers.js'
import { unitCalc } from '/js/shared-es.js'
import { applyCheckedCivilizationBonuses } from '/js/events/click-input-civilization-bonus-handlers.js'

export const resetAllRatesToBaseValues = () => {
  Array.from(
    document.querySelectorAll('#choose-res .res-show-img[resource]')
  ).map((res) => {
    res.setAttribute('res-per-sec', res.getAttribute('res-per-sec-base'))
    const div = res.querySelector('div[sec]')
    const rps = parseFloat(res.getAttribute('res-per-sec'))
    const rpm = rps * 60
    div.setAttribute('sec', rps)
    div.setAttribute('min', rpm)
    div.innerText = `${rps.toFixed(2)} - ${rpm.toFixed(1)}`
  })
}

export const applyCivilizationBonus = (upgrades) => {
  Object.keys(upgrades).map((key) => {
    const el = document.querySelector(
      `#choose-res .res-show-img[resource="${key}"]`
    )
    const upgrade = parseFloat(upgrades[key])
    const isFloat = new String(upgrade).slice(0, 1) === '0'

    if (isFloat) {
      el.setAttribute(
        'res-per-sec',
        parseFloat(el.getAttribute('res-per-sec')) * (1 + upgrade)
      )
    } else {
      el.setAttribute('res-per-sec', upgrade / 60)
    }
    // update visible rates
    const div = el.querySelector('div[sec]')
    const rps = parseFloat(el.getAttribute('res-per-sec'))
    const rpm = rps * 60
    div.setAttribute('sec', rps)
    div.setAttribute('min', rpm)
    div.innerText = `${rps.toFixed(2)} - ${rpm.toFixed(1)}`
  })
}

export const recalculateAllVisibleUnits = () => {
  Array.from(
    document.querySelectorAll('#choose-units .unit-show-img.showing-img')
  ).map((unitStatsBox) => {
    // not optimized but we need to recalculate all the visible units
    // this does a lot of dom manipulation
    unitCalc(unitStatsBox, 'recalc')
  })
}

export const changeOfCivilizationSelection = (event) => {
  if (!event.target.matches('#econ-civ-select')) return
  resetAllRatesToBaseValues()

  let option = event.target.querySelector(`[value="${event.target.value}"]`)
  if (!option) option = event.target.firstElementChild
  changeSelection(event.target, option)
  const upgrades = JSON.parse(option.getAttribute('data-json'))

  applyCivilizationBonus(upgrades)
  applyCheckedCivilizationBonuses()
  recalculateAllVisibleUnits()
}
