import { placeholder } from '/js/placeholder.js'
import { finder, setUpGatherRates } from '/js/shared-es.js'
import { hide, show, toggle, toggleCheckbox, int } from '/js/helpers.js'
import { clickUnitBonusesHandler } from '/js/events/click-unit-bonuses-handlers.js'
import { unitClickEventHandlers } from '/js/events/click-unit-event-handlers.js'
import { resClickEventHandlers } from '/js/events/click-resource-event-handlers.js'
import { unitCivChangeSelectionHandlers } from '/js/events/change-unit-civilization-selection-handlers.js'
import { changeOfCivilizationSelection } from '/js/events/change-civilization-selection-handlers.js'
import { clickInputCivilizationBonusEventHandlers } from '/js/events/click-input-civilization-bonus-handlers.js'

import {
  unitPlusClickEventHandlers,
  unitMinusClickEventHandlers,
} from '/js/events/click-plus-minus-handlers.js'

main().catch(console.error)

async function main() {
  document.addEventListener(
    'click',
    function (event) {
      clickInputCivilizationBonusEventHandlers(event)
      resClickEventHandlers(event)
      unitClickEventHandlers(event)
      unitPlusClickEventHandlers(event)
      unitMinusClickEventHandlers(event)
      clickUnitBonusesHandler(event)
    },
    false
  )

  document.addEventListener(
    'change',
    function (event) {
      changeOfCivilizationSelection(event)
      unitCivChangeSelectionHandlers(event)
    },
    false
  )
}
