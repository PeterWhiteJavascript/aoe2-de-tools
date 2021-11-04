import { finder, setUpGatherRates } from '/js/shared-es.js'

$(function () {
  $.getJSON('/data/hideAtStart.json', function (hideAtStart) {
    $.getJSON('/data/order.json', function (order) {
      $.getJSON('/data/unitsShow.json', function (unitsShown) {
        $.getJSON('/data/unitVariety.json', function (unitVariety) {
          $.getJSON('/data/ecoBonuses.json', function (ecoBonuses) {
            $.getJSON('/data.json', function (data) {
              let gatherRates = setUpGatherRates(data)
              let gatherRatesCont = $("<div id='gather-rates'></div>")
              let resOrder = ['food', 'wood', 'gold', 'stone']
              for (let i = 0; i < order.length; i++) {
                for (let j = 0; j < order[i].length; j++) {
                  // DONE
                  let imgCont = $(
                    "<div class='res-show-img showing-img' resource='" +
                      order[i][j] +
                      "' title='" +
                      order[i][j] +
                      "'></div>"
                  )
                  let imgurl = gatherRates[order[i][j]].img || order[i][j]
                  let img = $(
                    "<img src='/img/" + imgurl + ".png' class='icon-big'>"
                  )
                  let sec = gatherRates[order[i][j]].gatherRate
                  let min = gatherRates[order[i][j]].gatherRate * 60
                  let num = $(
                    '<div sec=' +
                      sec +
                      ' min=' +
                      min +
                      '>' +
                      sec.toFixed(2) +
                      ' - ' +
                      min.toFixed(1) +
                      '</div>'
                  )
                  imgCont.append(img, num)
                  $('#choose-res').append(imgCont)
                  // END DONE
                  imgCont.on('click', function () {
                    $(this).toggleClass('showing-img')
                    let res = $(this).attr('resource')
                    $('#gather-rates')
                      .children('.unit-container')
                      .each(function () {
                        let resCont = $(this)
                          .children('.res-desc-cont')
                          .children('.resources-cont')
                          .children('.res-row')
                          .children('.resource')
                          .filter(function () {
                            return $(this).attr('resource') === res
                          })[0]
                        $(resCont).toggle()
                      })

                    calculateVilTotals()
                  })
                }
              }

              //Figure out how many villagers are needed to keep all of the units selected producing.
              function calculateVilTotals() {
                let unitsBeingCreated = {}
                let vilsReq = {}
                //Get all visible unit conatiners.
                $('#gather-rates')
                  .children('.unit-container:visible')
                  .each(function () {
                    let unitName = $(this)
                      .children('.unit')
                      .children('.unit-class')
                      .children('img')
                      .attr('title')
                    unitsBeingCreated[unitName] = {}
                    $(this)
                      .children('.unit')
                      .children('.res-cont')
                      .each(function () {
                        let res = $(this).attr('title')
                        unitsBeingCreated[unitName][res] = parseInt(
                          $(this).children('div').text()
                        )
                      })
                    unitsBeingCreated[unitName].quantity = parseInt(
                      $(this)
                        .children('.unit')
                        .children('.multiplier-cont')
                        .children('div:eq(1)')
                        .text()
                    )
                    $(this)
                      .children('.res-desc-cont')
                      .children('.resources-cont')
                      .children('.res-row')
                      .children('.resource')
                      .each(function () {
                        let resName = $(this)
                          .children('.icon-big')
                          .attr('title')
                        let resVal = parseFloat(
                          $(this).children('.resource-num').attr('title')
                        )
                        if (vilsReq[resName]) {
                          vilsReq[resName] += resVal
                        } else {
                          vilsReq[resName] = resVal
                        }
                      })
                  })
                let resTotals = $("<div class='res-totals'></div>")
                let resDisplay = $("<div class='resources-cont'></div>")
                let unitsDisplay = $("<div class='unit-totals'></div>")

                let hiddenRes = getHiddenRes()

                let resRow, curRes
                for (let i in vilsReq) {
                  let res = gatherRates[i].res
                  if (curRes !== res) {
                    if (resRow) resDisplay.append(resRow)
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
                  resRow.append(resElm)
                  if (hiddenRes.includes(i)) {
                    $(resElm).hide()
                  }
                }
                resDisplay.append(resRow)

                for (let i in unitsBeingCreated) {
                  unitsDisplay.append(
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

                resTotals.append(resDisplay)
                resTotals.append(unitsDisplay)
                $('#vil-totals').children('.res-totals').replaceWith(resTotals)
              }
              function getVilsRequired(trainTime, cost, multiplier) {
                function applyCivEcoBonuses(base, res) {
                  for (let i = 0; i < applyEcoBonuses.length; i++) {
                    for (let j in applyEcoBonuses[i].data) {
                      if (j === res) {
                        if (typeof applyEcoBonuses[i].data[j] === 'string') {
                          return parseFloat(applyEcoBonuses[i].data[j]) / 60
                        }
                        return base + base * applyEcoBonuses[i].data[j]
                      }
                    }
                  }
                  return base
                }
                let req = {}
                for (let i in cost) {
                  let idx = resOrder.indexOf(i)
                  let vilTypes = order[idx]
                  for (let j = 0; j < vilTypes.length; j++) {
                    let gatherRate = applyCivEcoBonuses(
                      gatherRates[vilTypes[j]].gatherRate,
                      vilTypes[j]
                    )
                    req[vilTypes[j]] = [
                      gatherRates[vilTypes[j]].res,
                      (1 / ((gatherRate * trainTime) / cost[i])) * multiplier,
                    ]
                  }
                }
                return req
              }
              function changeMultiplier(e, num) {
                let valCont = $(e.target).parent().children('div:eq(1)')
                let curNum = parseInt(valCont.text())
                curNum = Math.max(curNum + num, 1)
                valCont.text(curNum)
              }
              function applyUpgrade(upgradeData, stats) {
                if (upgradeData.cost) {
                  for (let i in upgradeData.cost) {
                    if (upgradeData.costPercent) {
                      stats.cost[i] = Math.ceil(
                        stats.cost[i] - stats.cost[i] * upgradeData.cost[i]
                      )
                    } else {
                      stats.cost[i] += upgradeData.cost[i]
                    }
                  }
                }

                if (upgradeData.trainTime) {
                  if (upgradeData.trainTimePercent) {
                    stats.trainTime = stats.trainTime / upgradeData.trainTime
                  } else {
                    stats.trainTime = upgradeData.trainTime
                  }
                }
                if (upgradeData.img) {
                  stats.img = upgradeData.img
                }
                return stats
              }
              function applyUpgrades(cont, unitName, stats, civBonus) {
                //Apply upgrades after civ bonuses.
                let upgrades = cont
                  .children('.res-desc-cont')
                  .children('.upgrades-cont')
                  .children('div')
                let checkedUpgrades = []
                let upgradesToApply = []
                upgrades.each(function (i, div) {
                  let idx = $(div).parent().children('div').index(div)
                  if (
                    $(div)
                      .parent()
                      .children('div:eq(' + idx + ')')
                      .children('input')
                      .prop('checked')
                  ) {
                    let upName = $(div)
                      .parent()
                      .children('div:eq(' + idx + ')')
                      .children('div:eq(0)')
                      .text()
                    upgradesToApply.push(unitVariety[unitName].upgrades[upName])
                    checkedUpgrades.push(upName)
                  }
                })
                if (civBonus) upgradesToApply.push(civBonus)
                //Sort the upgrades so that the train times that are set happen first. Also sort so that there is only the lowest "set" upgrade.
                //We're gonna make an assumption that any percentage values will be lower than any "set" values for trainTime. This'll sort properly in this case.
                let upsWithTrainTime = []
                for (let i = upgradesToApply.length - 1; i >= 0; i--) {
                  if (upgradesToApply[i].trainTime) {
                    upsWithTrainTime.push(upgradesToApply.splice(i, 1)[0])
                  }
                }
                upsWithTrainTime.sort((a, b) => {
                  return b.trainTime - a.trainTime
                })
                upgradesToApply.push(...upsWithTrainTime)

                upgradesToApply.forEach(function (upgrade) {
                  stats = applyUpgrade(upgrade, stats)
                })
                return { stats: stats, checkedUpgrades: checkedUpgrades }
              }
              function getHiddenRes() {
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
              //When changing a select value, replace the container with a new one with the new values.
              function updateVilsRequired(e) {
                let cont = $(e.target).closest('.unit-container')
                let civ = cont
                  .children('.unit')
                  .children('.upgrade-cont')
                  .children('select')
                  .val()
                let unitName = cont.attr('name')
                let multiplier = parseInt(
                  cont
                    .children('.unit')
                    .children('.multiplier-cont')
                    .children('div:eq(1)')
                    .text()
                )
                let unitData = finder(data.units, unitName)
                let checkedUpgrades = []
                let stats, upgrade
                if (civ && civ !== 'Generic') {
                  stats = Object.assign(
                    {},
                    {
                      trainTime: unitData.trainTime,
                      cost: Object.assign({}, unitData.cost),
                    }
                  )
                  upgrade = unitVariety[unitName].civs[civ]
                } else {
                  stats = finder(data.units, unitName)
                  civ = false
                }
                let applied = applyUpgrades(
                  cont,
                  unitName,
                  Object.assign(
                    {},
                    {
                      trainTime: stats.trainTime,
                      cost: Object.assign({}, stats.cost),
                      img: stats.img,
                    }
                  ),
                  upgrade
                )
                checkedUpgrades = applied.checkedUpgrades
                let replacement = getUnitContainer(
                  unitName,
                  applied.stats,
                  multiplier,
                  civ,
                  checkedUpgrades
                )
                if (replacement) {
                  cont.replaceWith(replacement)
                }
                calculateVilTotals()
              }
              function getResDiv(res) {
                return $(
                  $('#choose-res')
                    .children('.res-show-img')
                    .filter(function () {
                      return $(this).attr('resource') === res
                    })[0]
                )
                  .children('div')
                  .first()
              }
              function displayGatherRate(rate, res) {
                let div = getResDiv(res)
                let pMin = rate * 60
                div.text(rate.toFixed(2) + ' - ' + pMin.toFixed(1))
                div.attr('sec', rate)
                div.attr('min', pMin)
              }
              function getUnitContainer(
                name,
                unitData,
                multiplier,
                selectOption,
                checkedUpgrades
              ) {
                if (unitData) {
                  let cont = $(
                    "<div class='unit-container' name='" + name + "' ></div>"
                  )
                  let unitCont = $("<div class='unit'></div>")
                  let cost = unitData.cost
                  let trainTime = unitData.trainTime
                  let img = unitData.img || name
                  for (let i in cost) {
                    unitCont.append(
                      "<div class='res-cont' title='" +
                        i +
                        "'><img src='/img/" +
                        i +
                        "-icon.png'><div>" +
                        cost[i] +
                        '</div></div>'
                    )
                  }
                  unitCont.append(
                    "<div class='time-cont'><img src='/img/hourglass-icon.png'><div>" +
                      parseFloat(trainTime.toFixed(2)) +
                      '</div></div>'
                  )

                  unitCont.append(
                    "<div class='unit-class'><img src='/img/" +
                      img +
                      ".png' title='" +
                      name +
                      "'></div>"
                  )
                  //Add all relevant upgrades
                  if (unitVariety[name]) {
                    let selectCont = $(
                      "<div class='upgrade-cont'>Civilization</div>"
                    )
                    let upgradeSelect
                    if (!unitVariety[name].noGeneric) {
                      upgradeSelect = $(
                        '<select><option>Generic</option></select>'
                      )
                    } else {
                      upgradeSelect = $('<select></select>')
                    }
                    for (let j in unitVariety[name].civs) {
                      if (selectOption === j) {
                        upgradeSelect.append(
                          '<option selected>' + j + '</option>'
                        )
                      } else {
                        upgradeSelect.append('<option>' + j + '</option>')
                      }
                    }
                    selectCont.append(upgradeSelect)
                    unitCont.append(selectCont)
                    upgradeSelect.on('change', updateVilsRequired)
                  }

                  let multiplierCont = $("<div class='multiplier-cont'></div>")
                  let minus = $('<div>-</div>')
                  let num = $('<div>' + multiplier + '</div>')
                  let plus = $('<div>+</div>')
                  minus.on('click', function (e) {
                    changeMultiplier(e, -1)
                    updateVilsRequired(e)
                  })
                  plus.on('click', function (e) {
                    changeMultiplier(e, 1)
                    updateVilsRequired(e)
                  })
                  multiplierCont.append(minus, num, plus)
                  unitCont.append(multiplierCont)
                  cont.append(unitCont)

                  let resAndTextCont = $("<div class='res-desc-cont'></div>")
                  let resourcesCont = $("<div class='resources-cont'></div>")
                  let upgradesCont = $("<div class='upgrades-cont'></div>")
                  let hiddenRes = getHiddenRes()
                  let res = getVilsRequired(trainTime, cost, multiplier)
                  let curRes, resRow
                  for (let j in res) {
                    if (curRes !== res[j][0]) {
                      if (resRow) resourcesCont.append(resRow)
                      curRes = res[j][0]
                      resRow = $("<div class='res-row'></div>")
                    }
                    let img = gatherRates[j].img || j
                    let resElm = $(
                      "<div class='resource' resource='" +
                        j +
                        "'><img class='icon-big' src='/img/" +
                        img +
                        ".png' title='" +
                        j +
                        "'><div class='resource-num' title='" +
                        res[j][1] +
                        "'><div>" +
                        Math.ceil(res[j][1]) +
                        '</div></div></div>'
                    )
                    resRow.append(resElm)
                    if (hiddenRes.includes(j)) {
                      $(resElm).hide()
                    }
                  }
                  //Append the last row
                  resourcesCont.append(resRow)

                  if (unitVariety[name]) {
                    for (let j in unitVariety[name].upgrades) {
                      //Figure out what's checked.
                      let checked = false
                      if (checkedUpgrades) {
                        if (checkedUpgrades.includes(j)) {
                          checked = true
                        }
                      }
                      let upgradeCont = $('<div></div>')
                      let checkbox = $("<input type='checkbox'>")
                      if (checked) checkbox.attr('checked', true)
                      upgradeCont.append('<div>' + j + '</div>')
                      upgradeCont.append(checkbox)
                      upgradesCont.append(upgradeCont)
                      checkbox.on('change', updateVilsRequired)
                    }
                  }

                  resAndTextCont.append(resourcesCont)
                  resAndTextCont.append(upgradesCont)
                  cont.append(resAndTextCont)
                  return cont
                }
              }

              //Which units to show and in what order.
              // let unitsShown =

              for (let i = 0; i < unitsShown.length; i++) {
                let unitImg = $(
                  "<div class='unit-show-img showing-img' unit='" +
                    unitsShown[i] +
                    "' title='" +
                    unitsShown[i] +
                    "'></div>"
                )
                let img = $("<img src='/img/" + unitsShown[i] + ".png'>")
                unitImg.append(img)
                $('#choose-units').append(unitImg)
                //Toggle the unit data being shown
                unitImg.on('click', function () {
                  let unitName = $(this).attr('unit')
                  let cont = $('#gather-rates')
                    .children('.unit-container')
                    .filter(function () {
                      return $(this).attr('name') === unitName
                    })[0](cont)
                    .toggle()
                  $(this).toggleClass('showing-img')
                  if ($(this).hasClass('showing-img')) {
                    updateVilsRequired({
                      target: $(cont).children('div').first(),
                    })
                  }
                  calculateVilTotals()
                })
              }

              //Track civ/team bonuses that affect eco.
              let applyEcoBonuses = [{ name: 'Generic', data: {} }]
              //Add eco bonuses.
              let ecoSelect = $('<select></select>')
              let ecoCheckboxes = $('<div></div>')
              let civ = ecoBonuses['civ']
              for (let j in civ) {
                ecoSelect.append('<option>' + j + '</option>')
              }
              ecoSelect.on('change', function () {
                let name = $(this).val()
                //Reset any civ bonus
                for (let j in applyEcoBonuses[0].data) {
                  displayGatherRate(gatherRates[j].gatherRate, j)
                }

                applyEcoBonuses[0] = {
                  name: name,
                  data: ecoBonuses['civ'][name],
                }
                $('#gather-rates')
                  .children('.unit-container')
                  .not(':hidden')
                  .each(function () {
                    updateVilsRequired({
                      target: $(this).children('div').first(),
                    })
                  })

                for (let j in applyEcoBonuses[0].data) {
                  let rate
                  if (typeof applyEcoBonuses[0].data[j] === 'string') {
                    rate = parseFloat(applyEcoBonuses[0].data[j]) / 60
                  } else {
                    rate = parseFloat(
                      gatherRates[j].gatherRate +
                        gatherRates[j].gatherRate * applyEcoBonuses[0].data[j]
                    )
                  }
                  displayGatherRate(rate, j)
                }
              })
              let team = ecoBonuses['team']
              for (let j in team) {
                let checkCont = $('<div><div>' + j + '</div></div>')
                let box = $("<input type='checkbox' name='" + j + "'>")
                box.on('change', function () {
                  let name = $(this).attr('name')
                  //First, reset the gather rates.
                  let resetRates = []
                  for (i in applyEcoBonuses) {
                    resetRates = resetRates.concat(
                      Object.keys(applyEcoBonuses[i].data)
                    )
                  }
                  resetRates.forEach((i) => {
                    displayGatherRate(gatherRates[i].gatherRate, i)
                  })

                  if ($(this).is(':checked')) {
                    applyEcoBonuses.push({
                      name: name,
                      data: ecoBonuses['team'][name],
                    })
                  } else {
                    let idx = applyEcoBonuses.indexOf(
                      applyEcoBonuses.filter((bonus) => {
                        return bonus.name === name
                      })[0]
                    )
                    applyEcoBonuses.splice(idx, 1)
                  }

                  let applied = {}
                  for (let i = 0; i < applyEcoBonuses.length; i++) {
                    for (let j in applyEcoBonuses[i].data) {
                      if (applied[j] >= 0) {
                        applied[j] =
                          applied[j] * (1 + applyEcoBonuses[i].data[j])
                      } else {
                        applied[j] =
                          gatherRates[j].gatherRate *
                          (1 + applyEcoBonuses[i].data[j])
                      }
                    }
                  }

                  for (let j in applied) {
                    displayGatherRate(parseFloat(applied[j].toFixed(2)), j + '')
                  }
                  $('#gather-rates')
                    .children('.unit-container')
                    .not(':hidden')
                    .each(function () {
                      updateVilsRequired({
                        target: $(this).children('div').first(),
                      })
                    })
                })
                checkCont.append(box)
                ecoCheckboxes.append(checkCont)
              }

              for (let i = 0; i < unitsShown.length; i++) {
                let unitData = finder(data.units, unitsShown[i])
                if (unitData) {
                  let cont = getUnitContainer(unitsShown[i], unitData, 1)
                  if (cont) {
                    gatherRatesCont.append(cont)
                  }
                }
              }
              $('#container').append(gatherRatesCont)

              $('#econ-civ-bonus').append(ecoSelect)
              $('#econ-civ-bonus').append(ecoCheckboxes)
              //Hide eco at start
              hideAtStart.forEach(function (toHide) {
                let cont = $('#choose-res')
                  .children('.res-show-img')
                  .filter(function () {
                    return $(this).attr('resource') === toHide
                  })[0]
                $(cont).trigger('click')
              })
              $('#choose-units').children('.unit-show-img').trigger('click')
            })
          })
        })
      })
    })
  })
})
