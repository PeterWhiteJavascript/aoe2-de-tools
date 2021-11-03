main()

// TODO change $(element) to vanila equivalent

const getHiddenRes = () => {
  return $('#choose-res')
    .children('.res-show-img')
    .filter(function () {
      return !$(this).hasClass('showing-img')
    })
    .toArray()
    .map(function (item) {
      return $(item).attr('resource')
    })
}

// TODO change the whole calculateVilTotals,
// remove jquery
const calculateVilTotals = () => {
  let unitsBeingCreated = {}
  let vilsReq = {}
  //Get all visible unit conatiners.
  Array.from(
    document.querySelectorAll('#gather-rates > .unit-container:visible')
  ).map((it) => {
    const unitName = it
      .querySelector('.unit > .unit-class > img')
      .getAttribute('title')
    console.log({ unitName })
    unitsBeingCreated[unitName] = {}
    Array.from(it.querySelectorAll('.unit > .res-cont')).map((cont) => {
      const res = cont.getAttribute('title')
      unitsBeingCreated[unitName][res] = parseInt(
        cont.querySelector('div').innerText
      )
    })
    unitsBeingCreated[unitName].quantity = parseInt(
      it.querySelector('.unit > .multiplier-cont > div:eq(1)').innerText
    )
    Array.from(
      it.querySelectorAll(
        '.res-desc-cont > .resources-cont > .res-row > .resource'
      )
    ).map((cont) => {
      const resName = cont.querySelector('.icon-big').getAttribute('title')
      const resVal = parseFloat(
        cont.querySelector('.resource-num').getAttribute('title')
      )
      vilsReq[resName] = vilsReq[resName] ? vilsReq[resName] + resVal : resVal
    })
  })

  const resTotals = $("<div class='res-totals'></div>")
  const resDisplay = $("<div class='resources-cont'></div>")
  const unitsDisplay = $("<div class='unit-totals'></div>")

  const hiddenRes = getHiddenRes()

  let resRow, curRes
  for (let i in vilsReq) {
    let res = gatherRates[i].res
    if (curRes !== res) {
      if (resRow) {
        resDisplay.appendChild(resRow)
      }
      curRes = res
      resRow = $("<div class='res-row'></div>")
    }
    let resElm = $(
      "<div class='resource' resource='" +
        i +
        "'><img class='icon-big' src='/img/" +
        i +
        ".png' title='" +
        i +
        "'><div class='resource-num' title='" +
        vilsReq[i] +
        "'><div>" +
        Math.ceil(vilsReq[i]) +
        '</div></div></div>'
    )
    resRow.appendChild(resElm)
    // todo test this one
    if (hiddenRes.includes(i)) {
      // TODO change this hide to vanila
      $(resElm).hide()
    }
  }
  resDisplay.appendChild(resRow)

  for (let i in unitsBeingCreated) {
    unitsDisplay.appendChild(
      "<div class='unit-class'><div class='resource-num' title='" +
        unitsBeingCreated[i].quantity +
        "'><div>" +
        Math.ceil(unitsBeingCreated[i].quantity) +
        "</div></div><img src='/img/" +
        i +
        ".png' title='" +
        i +
        "'></div>"
    )
  }

  resTotals.appendChild(resDisplay)
  resTotals.appendChild(unitsDisplay)
  document.querySelector('#vil-totals > .res-totals').innerHTML = resTotals
}

const resClickEventHandlers = (event) => {
  if (!event.target.closest('[resource]')) return
  event.preventDefault()

  // console.log(res)
  // console.log(el)
  const el = event.target.closest('[resource]')
  el.classList.toggle('showing-img')
  const res = el.getAttribute('resource')
  Array.from(
    document.querySelectorAll(
      `#gather-rates > .unit-container > [resource="${res}"]`
    )
  ).map((it) => {
    console.log(it)
    // https://github.com/nefe/You-Dont-Need-jQuery#8.2
    if (
      it.ownerDocument.defaultView.getComputedStyle(it, null).display === 'none'
    ) {
      it.style.display = 'block'
    } else {
      it.style.display = 'none'
    }
  })

  calculateVilTotals()
}

async function main() {
  document.addEventListener(
    'click',
    function (event) {
      resClickEventHandlers(event)
    },
    false
  )
}
