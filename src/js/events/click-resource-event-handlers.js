import { toggle, int } from '/js/helpers.js'

export const resClickEventHandlers = (event) => {
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
