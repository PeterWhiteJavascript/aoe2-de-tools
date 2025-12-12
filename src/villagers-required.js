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

  // Unit search functionality
  function setupUnitSearch() {
    const unitSearchInput = document.getElementById('unit-search')
    if (unitSearchInput) {
      unitSearchInput.addEventListener('input', function (event) {
        const searchTerm = event.target.value.toLowerCase().trim()
        const unitElements = document.querySelectorAll('#choose-units .unit-show-img')
        
        unitElements.forEach(function (unitElement) {
          const unitName = (unitElement.getAttribute('unit') || '').toLowerCase()
          const unitTitle = (unitElement.getAttribute('title') || '').toLowerCase()
          
          if (searchTerm === '' || unitName.includes(searchTerm) || unitTitle.includes(searchTerm)) {
            unitElement.style.display = ''
          } else {
            unitElement.style.display = 'none'
          }
        })
      })
    }
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUnitSearch)
  } else {
    setupUnitSearch()
  }
}
