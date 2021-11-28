import { unitCalc } from '/js/shared-es.js'

export const unitClickEventHandlers = (event) => {
  if (!event.target.closest('[unit]')) return
  event.preventDefault()

  const el = event.target.closest('[unit]')
  el.classList.toggle('showing-img')

  unitCalc(el)
}
