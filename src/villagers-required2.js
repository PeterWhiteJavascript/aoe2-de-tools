import { placeholder } from '/js/placeholder.js'
import { finder, setUpGatherRates } from '/js/shared-es.js'
import { hide, show, toggle, toggleCheckbox, int } from '/js/helpers.js'
import { clickUnitBonusesHandler } from '/js/events/click-unit-bonuses-handlers.js'
import { unitClickEventHandlers } from '/js/events/click-unit-event-handlers.js'
import { resClickEventHandlers } from '/js/events/click-resource-event-handlers.js'
import {
  unitPlusClickEventHandlers,
  unitMinusClickEventHandlers,
} from '/js/events/click-plus-minus-handlers.js'

main().catch(console.error)

async function main() {
  document.addEventListener(
    'click',
    function (event) {
      // choose economic bonuses section TOP
      // TODO event on change of the select option
      // TODO event on change of the checkbox

      resClickEventHandlers(event)
      unitClickEventHandlers(event)
      unitPlusClickEventHandlers(event)
      unitMinusClickEventHandlers(event)
      clickUnitBonusesHandler(event)
    },
    false
  )
}
