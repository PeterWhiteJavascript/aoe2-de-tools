import { toggleCheckbox } from '/js/helpers.js'
import {
  resetAllRatesToBaseValues,
  applyCivilizationBonus,
  recalculateAllVisibleUnits,
} from '/js/events/change-civilization-selection-handlers.js'

export const applyCheckedCivilizationBonuses = () => {
  Array.from(document.querySelectorAll('#econ-civ-bonus input:checked')).map(
    (it) => {
      const upgrades = JSON.parse(it.getAttribute('data-json'))
      applyCivilizationBonus(upgrades)
    }
  )
}

const applyOptionSelectedCivilizationBonuses = () => {
  // apply option selected
  let option = document.querySelector('#econ-civ-bonus option[selected]')
  if (!option)
    option = document.querySelector('#econ-civ-select').firstElementChild
  const optionUpgrades = JSON.parse(option.getAttribute('data-json'))
  applyCivilizationBonus(optionUpgrades)
}

export const clickInputCivilizationBonusEventHandlers = (event) => {
  if (!event.target.matches('[x-upgrade-resources="civilization"]')) return
  toggleCheckbox(event.target)
  resetAllRatesToBaseValues() // reset rates
  applyOptionSelectedCivilizationBonuses()
  applyCheckedCivilizationBonuses()
  recalculateAllVisibleUnits()
}
