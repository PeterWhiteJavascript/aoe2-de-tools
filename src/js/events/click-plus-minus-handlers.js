import { int } from '/js/helpers.js'
import { unitCalc } from '/js/shared-es.js'

export const unitPlusClickEventHandlers = (event) => {
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

export const unitMinusClickEventHandlers = (event) => {
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
