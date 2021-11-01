$(function () {
  $('#container').append(
    '<div id="add-combat" class="button">\n\
                <div>Add Combat</div>\n\
            </div>\n\
            <div id="combatants"></div>'
  )

  $.getJSON('data.json', function (data) {
    let civilizations = data.civilizations
    let units = data.units
    let upgrades = data.upgrades
    //Add age up upgrades from units (+2 attack to sc etc...)
    let agesStrings = ['feudal age', 'castle age', 'imperial age']
    for (let i = 0; i < units.length; i++) {
      //We're just doing damage test right now, so use damageTechs
      units[i].techs = units[i].damageTechs.concat(units[i].uniqueDamageTechs) //can go .concat(units[i].otherTechs) for all techs;
      console.log(units[i].techs)
      let ageUpgrade = units[i].ageUpgrade
      if (ageUpgrade) {
        for (let j = 0; j < ageUpgrade.length; j++) {
          upgrades.push({
            name: agesStrings[j] + ' ' + units[i].name,
            effects: ageUpgrade[j],
            ageReq: j + 2,
          })
        }
      }
    }

    let unitGrid = data.unitGrid
    let upgradeGroups = data.upgradeGroups
    //Stores the attack/defender stats.
    let combats = []

    function switchCombatants() {
      let elm = $(this)
      let idxI = $('#combatants')
        .children('.combat-cont')
        .index(elm.closest('.combat-cont')[0])
      let tempData = combats[idxI][0]
      combats[idxI][0] = combats[idxI][1]
      combats[idxI][1] = tempData
      // create a temporary marker div
      let atkElm = elm.closest('.combat-cont').children('.combatant:eq(0)')
      let defElm = elm.closest('.combat-cont').children('.combatant:eq(1)')
      var aNext = $('<div>').insertAfter(atkElm)
      atkElm.insertAfter(defElm)
      defElm.insertBefore(aNext)
      aNext.remove()
      atkElm.children('.combatant-title').children('h3').text('Defender')
      defElm.children('.combatant-title').children('h3').text('Attacker')
      atkElm
        .siblings('.combat-result')
        .replaceWith(generateResult(combats[idxI][0], combats[idxI][1]))
    }
    function getCombatantData(elm) {
      let idxI = $('#combatants')
        .children('.combat-cont')
        .index(elm.closest('.combat-cont')[0])
      let idxJ = $('#combatants')
        .children('.combat-cont:eq(' + idxI + ')')
        .children('.combatant')
        .index(elm.closest('.combatant')[0])
      return {
        combatant: combats[idxI][idxJ],
        idx: [idxI, idxJ],
        combatants: combats[idxI],
      }
    }
    function displayUnitGrid() {
      function removeGrid() {
        grid.remove()
        $(this).unbind('mouseup')
      }
      let portrait = $(this)
      let grid = $("<div class='unit-selection-grid'></div>")
      let sectionNum = 0
      let sectionHeight = 9
      let section = $("<div class='unit-selection-grid-section'></div>")
      for (let i = 0; i < unitGrid.length; i++) {
        let row = $('<div></div>')
        for (let j = 0; j < unitGrid[i].length; j++) {
          let img = $(
            '<img class="icon-big" unit="' +
              unitGrid[i][j] +
              '" src="/img/' +
              unitGrid[i][j] +
              '.png">'
          )
          img.on('mousedown', function () {
            let unitClassNum = grid
              .children('.unit-selection-grid-section')
              .children('div')
              .index($(this).parent())
            let unit = units.find((d) => {
              return d.name === unitGrid[unitClassNum][0]
            })
            let unitUpgrade = $(this).parent().children('img').index(this)
            let replacing = portrait.closest('.combatant')

            let combatant = createCombatant(
              replacing.children('.combatant-title').children('h3').text(),
              unit,
              $(replacing)
                .children('.combatant-props')
                .children('.combatant-upgrades')
                .children('.civilization')
                .children('select')
                .children('option:selected')
                .val()
            )
            let combatIdx = $('#combatants')
              .children('.combat-cont')
              .index(replacing.closest('.combat-cont'))
            let combatantIdx = replacing
              .parent()
              .children('.combatant')
              .index(replacing)
            combats[combatIdx][combatantIdx] = combatant.data
            replacing
              .siblings('.combat-result')
              .replaceWith(
                generateResult(combats[combatIdx][0], combats[combatIdx][1])
              )
            replacing.replaceWith(combatant.element)
            //Apply the class upgrade if there is one.
            if (unitUpgrade) {
              $(combatant.element)
                .children('.combatant-props')
                .children('.combatant-upgrades')
                .children('.upgrades')
                .children('div:eq(0)')
                .children('.icon:eq(' + (unitUpgrade - 1) + ')')
                .click()
            }
            //Just click the age that we need to be in.
            else {
              $(combatant.element)
                .children('.combatant-props')
                .children('.combatant-stats')
                .children('div:eq(0)')
                .children('.icon:eq(' + (combatant.data.ageReq - 1) + ')')
                .click()
            }
            removeGrid()
          })

          row.append(img)
        }
        section.append(row)
        sectionNum++
        if (sectionNum === sectionHeight) {
          grid.append(section)
          section = $("<div class='unit-selection-grid-section'></div>")
          sectionNum = 0
        }
      }
      grid.append(section)

      $(document.body).append(grid)
      $(document.body).mouseup(removeGrid)
    }
    function applyUpgradeEffects(
      unitData,
      locked,
      currentUpgradeData,
      selectedCiv,
      elm
    ) {
      function applyEffect(key, data, upgradeData) {
        if (key === 'cost') {
          unitData.cost[data[key[0]]] += data[key][1] * locked
          if (elm) {
            let statConts = elm
              .closest('.combatant-props')
              .children('.combatant-stats')
              .children('div:eq(0)')
              .children('.stat-cont')
            statConts.each((idx, elm) => {
              if ($(elm).attr('stat') === data[key][0])
                $(elm).children('.stat').text(unitData.cost[data[i][0]])
            })
          }
        } else if (key === 'bonus' || key === 'armorClasses') {
          for (let y = 0; y < data[key].length; y++) {
            let found = false
            for (let x = unitData[key].length - 1; x >= 0; x--) {
              if (unitData[key][x][0] === data[key][y][0]) {
                unitData[key][x][1] += data[key][y][1] * locked
                found = true
              }
            }
            //Add the armor class if it doesn't exist.
            if (!found) {
              unitData[key].push(Object.assign({}, data[key][y]))
            }
          }
          //Special case for chemistry since it applies to either mAtk or pAtk
        } else if (key === 'atk') {
          let primaryAtk =
            (unitData.mAtk || 0) > (unitData.pAtk || 0) ? 'mAtk' : 'pAtk'
          unitData[primaryAtk] += data[key] * locked
          key = primaryAtk
        } else {
          //Determine what operation to apply (+ or *)
          let operation = '+'
          let amount = data[key]
          if (typeof data[key] === 'string') {
            operation = data[key][0]
            amount = parseFloat(amount.substr(1))
          }
          switch (operation) {
            case '+':
              unitData[key] += data[key] * locked
              break
            case '*':
              //If the upgrade is being unlocked
              if (locked === 1) {
                let origNum = unitData[key]
                let appliedAmount = Math.floor(unitData[key] * amount)
                upgradeData.appliedAmount = origNum - appliedAmount
                unitData[key] = appliedAmount
              }
              //If the upgrade is being locked, use the value that was gotten when the upgrade was applied.
              else {
                unitData[key] += upgradeData.appliedAmount
              }
              break
          }
        }
        if (elm) {
          //If we display the information of this particular stat
          let statConts = elm
            .closest('.combatant-props')
            .children('.combatant-stats')
            .children('div:eq(3)')
            .children('.unit-stats')
            .children('.stat-cont')
          statConts.each((idx, elm) => {
            if ($(elm).attr('stat') === key)
              $(elm).children('.stat').text(unitData[key])
          })
        }
      }
      for (let i in currentUpgradeData.effects) {
        //Apply the unit specific effects as well.
        if (i === 'unitSpec') {
          //If there is no data written for an advanced class (because it would be the same), look for the data on the base class.
          let effects =
            currentUpgradeData.effects[i][unitData.unitClass] ||
            currentUpgradeData.effects[i][unitData.name]
          for (j in effects) {
            applyEffect(j, effects, currentUpgradeData)
          }
        } else if (i === 'civSpec') {
          if (currentUpgradeData.effects[i][selectedCiv]) {
            let effects = currentUpgradeData.effects[i][selectedCiv]
            for (j in effects) {
              applyEffect(j, effects, currentUpgradeData)
            }
          }
        } else {
          applyEffect(i, currentUpgradeData.effects, currentUpgradeData)
        }
      }
    }

    function applyUpgrade(force) {
      let elm = $(this)
      let locked = $(this).hasClass('upgrade-locked') ? 1 : -1
      if (force + locked === 0) return
      let upgradeData = finder(upgrades, elm.attr('upgrade'))
      let combatantData = getCombatantData(elm)
      let unitData = combatantData.combatant
      if (upgradeData && locked !== -1) {
        //If the clicked upgrade age req is greater than the current age, force the correct age.
        let ageReqIcon = elm
          .closest('.combatant-props')
          .children('.combatant-stats')
          .children('div:eq(0)')
          .children('.icon:eq(' + (upgradeData.ageReq - 1) + ')')
        if (
          !elm
            .closest('.combatant-props')
            .children('.combatant-stats')
            .children('div:eq(0)')
            .is(elm.parent()) &&
          ageReqIcon.hasClass('upgrade-locked')
        ) {
          changeAge.call(ageReqIcon)
        }
      }

      //Figure out if any prerequesite upgrades are still locked and unlock them.
      let thisIdx = elm.parent().children('img').index(elm)
      let maxIdx = elm.parent().children('img').length - 1

      let unlocked = elm.parent().children('img').not('.upgrade-locked')

      //If the upgrade is being unlocked
      if (locked > 0 && thisIdx > 0) {
        applyUpgrade.call(
          elm.parent().children('img:eq(' + (thisIdx - 1) + ')'),
          locked
        )
      }
      //If the upgrade is being locked
      else if (locked < 0 && thisIdx < maxIdx) {
        applyUpgrade.call(
          elm.parent().children('img:eq(' + (thisIdx + 1) + ')'),
          locked
        )
        //Make sure to only remove the upgrade if it's the final one applied in the group.
        if (
          !$(unlocked[unlocked.length - 1]).is(this) &&
          !Number.isInteger(force)
        ) {
          return
        }
      }

      $(this).toggleClass('upgrade-locked')

      if (upgradeData) {
        let currentUpgradeData =
          locked === 1
            ? $.extend({}, upgradeData)
            : unitData.activeUpgrades.find(function (elm) {
                return elm.name === upgradeData.name
              })
        if (currentUpgradeData) {
          //If the portait changes
          let portraitCont = elm
            .closest('.combatant-props')
            .children('.combatant-stats')
            .children('div:eq(1)')
            .children('.icon-big')
          let reloadUpgrades = []
          if (upgradeData.classChange) {
            //If we need to cycle upgrades since they affect the upgraded class more
            if (unitData.reloadUpgrade) {
              //Turn off any upgrades if they are applied. Turn on again after the class upgrade is made.
              for (let i = 0; i < unitData.reloadUpgrade.length; i++) {
                for (let j = 0; j < unitData.activeUpgrades.length; j++) {
                  if (
                    unitData.reloadUpgrade[i] ===
                    unitData.activeUpgrades[j].name
                  ) {
                    reloadUpgrades.push(unitData.activeUpgrades[j])
                    applyUpgrade.call(unitData.activeUpgrades[j].element, -1)
                  }
                }
              }
            }
            if (locked > 0) {
              portraitCont[0].src = '/img/' + upgradeData.name + '.png'
              unitData.unitClass = upgradeData.name
            } else {
              let unlocked = elm
                .closest('.upgrades')
                .children('div:eq(0)')
                .children('img')
                .not('.upgrade-locked')
              let portraitURL =
                $(unlocked[unlocked.length - 1]).attr('upgrade') ||
                unitData.name
              portraitCont[0].src = '/img/' + portraitURL + '.png'
              unitData.unitClass = portraitURL
            }
          }
          let selectedCiv = elm
            .closest('.combatant-props')
            .children('.combatant-upgrades')
            .children('.civilization')
            .children('select')
            .children('option:selected')
            .val()
          //Add/Remove each of the effects
          applyUpgradeEffects(
            unitData,
            locked,
            currentUpgradeData,
            selectedCiv,
            elm
          )

          //If we're adding the effect
          if (locked === 1) {
            currentUpgradeData.element = this
            unitData.activeUpgrades.push(currentUpgradeData)
          }
          //If we're removing the effect
          else {
            //Find and remove the upgrade.
            for (let i = unitData.activeUpgrades.length - 1; i >= 0; i--) {
              if (unitData.activeUpgrades[i].name === currentUpgradeData.name) {
                unitData.activeUpgrades.splice(i, 1)
              }
            }
          }
          for (let i = 0; i < reloadUpgrades.length; i++) {
            applyUpgrade.call(reloadUpgrades[i].element, 1)
          }
        }
      }

      //Display the results
      let attacker, defender
      //If our guy is odd, then he is the defender
      if (combatantData.idx[1] % 2 === 1) {
        defender = unitData
        attacker = combats[combatantData.idx[0]][combatantData.idx[1] - 1]
      } else {
        defender = combats[combatantData.idx[0]][combatantData.idx[1] + 1]
        attacker = unitData
      }
      elm
        .closest('.combat-cont')
        .children('.combat-result')
        .replaceWith(generateResult(attacker, defender))
    }
    function generateResult(attacker, defender) {
      let elevationBonus =
        attacker.elevation > defender.elevation
          ? 1.25
          : attacker.elevation < defender.elevation
          ? 0.75
          : 1 // 0.75, 1, or 1.25
      let attackerBonus = attacker.bonus
      let defenderArmor = defender.armorClasses
      let totalBonusDamage = 0
      for (let i = 0; i < attackerBonus.length; i++) {
        for (let j = 0; j < defenderArmor.length; j++) {
          if (attackerBonus[i][0] === defenderArmor[j][0]) {
            totalBonusDamage += Math.max(
              0,
              attackerBonus[i][1] - defenderArmor[j][1]
            )
          }
        }
      }
      let bonusDamage = Math.max(0, totalBonusDamage)
      let melee = attacker.mAtk ? Math.max(0, attacker.mAtk - defender.mDef) : 0
      let pierce = attacker.pAtk
        ? Math.max(0, attacker.pAtk - defender.pDef)
        : 0
      let finalDamagePerHit = Math.max(
        1,
        (melee + pierce + bonusDamage) * elevationBonus
      )
      let numHitsToKill = Math.ceil(defender.hp / finalDamagePerHit)
      let minDamageToKill = finalDamagePerHit * numHitsToKill
      let overkill = minDamageToKill - defender.hp

      let elm = $(
        '<div class="combat-result">\n\
                    <div class="combatant-title"><h3>Result</h3></div>\n\
                    <div class="combat-results">\n\
                        <div class="stat-cont">\n\
                            <div class="stat-title">Bonus Damage</div>\n\
                            <div class="stat">' +
          bonusDamage +
          '</div>\n\
                        </div>\n\
                        <div class="stat-cont">\n\
                            <div class="stat-title">Elevation Multiplier</div>\n\
                            <div class="stat">' +
          elevationBonus +
          '</div>\n\
                        </div>\n\
                        <div class="stat-cont">\n\
                            <div class="stat-title">Damage per Hit</div>\n\
                            <div class="stat">' +
          finalDamagePerHit +
          '</div>\n\
                        </div>\n\
                        <div class="stat-cont">\n\
                            <div class="stat-title">Overkill</div>\n\
                            <div class="stat">' +
          overkill +
          ' (' +
          minDamageToKill +
          ')</div>\n\
                        </div>\n\
                        <div class="stat-cont">\n\
                            <div class="stat-title">Hits to Kill</div>\n\
                            <div class="stat">' +
          numHitsToKill +
          '</div>\n\
                        </div>\n\
                    </div>\n\
                </div>'
      )
      let switchButton = $(
        "<div class='switch-button'><div class='button'>Swap Combatants</div></div>"
      )
      switchButton.on('click', switchCombatants)
      $(elm).append(switchButton)
      return elm
    }
    function getUpgrades(data, civ) {
      let upgradeData = []
      let elm = $(
        '<div class="combatant-upgrades"><div class="civilization"></div><div class="upgrades"></div></div>'
      )
      let civSelect = $('<select></select>')
      for (let i = 0; i < civilizations.length; i++) {
        let option = $('<option>' + civilizations[i].name + '</option>')
        if (civilizations[i].name === civ) {
          option.prop('selected', 'selected')
        }
        civSelect.append(option)
      }
      elm.children('.civilization').prepend(civSelect)
      civSelect.on('change', function () {
        let combatantDiv = $(this).closest('.combatant')
        let combatant = createCombatant(
          combatantDiv.children('.combatant-title').children('h3').text(),
          data,
          $(this).children('option:selected').val()
        )

        let combatIdx = $('#combatants')
          .children('.combat-cont')
          .index(combatantDiv.closest('.combat-cont'))

        let combatantIdx = combatantDiv
          .parent()
          .children('.combatant')
          .index(combatantDiv)
        combats[combatIdx][combatantIdx] = combatant.data
        combatantDiv.replaceWith(combatant.element)
      })
      //Find the upgrade data.
      let techData = []
      for (let i = 0; i < data.techs.length; i++) {
        let upgradeData = finder(upgrades, data.techs[i])
        if (!upgradeData) {
          upgradeData = upgradeGroups[data.techs[i]]
          let group = []
          for (let j = 0; j < upgradeData.length; j++) {
            group.push(finder(upgrades, upgradeData[j]))
          }
          techData.push(group)
        } else {
          techData.push([upgradeData])
        }
      }

      //Display the data
      for (let i = 0; i < techData.length; i++) {
        let upgrade = $('<div></div>')
        for (let j = 0; j < techData[i].length; j++) {
          let name = techData[i][j].img
            ? techData[i][j].img
            : techData[i][j].name
          let icon = $(
            '<img class="icon upgrade-icon upgrade-locked" src="/img/' +
              name +
              '.png" upgrade="' +
              techData[i][j].name +
              '">'
          )
          upgrade.append(icon)
          icon.click(applyUpgrade)
        }
        elm.children('.upgrades').append(upgrade)
      }
      return { element: elm, data: upgradeData }
    }
    function changeAge() {
      let elm = $(this)
      applyUpgrade.call(elm)

      //Remove any upgrades that are above the current age.
      let ages = elm
        .closest('.combatant-props')
        .children('.combatant-stats')
        .children('div:eq(0)')
      let currentAge = ages.children('.icon').not('.upgrade-locked').length
      let combatant = getCombatantData(elm).combatant
      for (let i = combatant.activeUpgrades.length - 1; i >= 0; i--) {
        let up = combatant.activeUpgrades[i]
        if (up.ageReq > currentAge) {
          applyUpgrade.call(up.element, -1)
        }
      }
    }
    function createCombatant(title, data, civ) {
      function createStatCont(name, id, data) {
        let value = data[id] % 1 === 0 ? data[id] : 'None'
        let elm =
          '<div class="stat-cont" stat="' +
          id +
          '">\n\
                        <div class="stat-title">' +
          name +
          '</div>\n\
                        <div class="stat">' +
          value +
          '</div>\n\
                    </div>'
        return elm
      }
      let combatantData = $.extend({}, data)
      combatantData.bonus = combatantData.bonus
        ? combatantData.bonus.map((a) => Object.assign({}, a))
        : []
      combatantData.atk = combatantData.atk || 0
      combatantData.atkType = combatantData.atkType || 'melee'
      combatantData.elevation = 1
      combatantData.activeUpgrades = []
      combatantData.unitClass = combatantData.name
      let element = $(
        '<div class="combatant">\n\
                        <div class="combatant-title"><h3>' +
          title +
          '</h3></div>\n\
                        <div class="combatant-props">\n\
                            <div class="combatant-stats"></div>\n\
                        </div>\n\
                    </div>'
      )
      let ages = $(
        '<div>\n\
                            <img class="icon age-icon upgrade-icon upgrade-locked" src="/img/dark age.png">\n\
                            <img class="icon age-icon upgrade-icon upgrade-locked" src="/img/feudal age.png" upgrade="feudal age ' +
          combatantData.name +
          '">\n\
                            <img class="icon age-icon upgrade-icon upgrade-locked" src="/img/castle age.png" upgrade="castle age ' +
          combatantData.name +
          '">\n\
                            <img class="icon age-icon upgrade-icon upgrade-locked" src="/img/imperial age.png" upgrade="imperial age ' +
          combatantData.name +
          '">\n\
                        </div>'
      )
      ages.children('.icon').click(changeAge)

      let elevationCont = $(
        "<div><img class='icon icon-elevation upgrade-locked' src='/img/elevation low.png'><img class='icon icon-elevation' src='/img/elevation neutral.png'><img class='icon icon-elevation upgrade-locked' src='/img/elevation high.png'></div>"
      )
      elevationCont.children('.icon').click(function () {
        if ($(this).hasClass('upgrade-locked')) {
          $(this).parent().children('.icon').addClass('upgrade-locked')
          $(this).removeClass('upgrade-locked')
          let thisIdx = $(this).parent().children('.icon').index($(this))
          combatantData.elevation = thisIdx
          let combatants = getCombatantData($(this)).combatants
          $(this)
            .closest('.combatant')
            .siblings('.combat-result')
            .replaceWith(generateResult(combatants[0], combatants[1]))
        }
      })
      let img =
        '<div>\n\
                            <img class="icon-big" src="img/' +
        data.name +
        '.png">\n\
                        </div>'
      let primaryAtk =
        (combatantData.mAtk || 0) > (combatantData.pAtk || 0) ? 'mAtk' : 'pAtk'
      let unitStats =
        '<div>\n\
                        <div class="unit-stats">' +
        createStatCont('Hit Points', 'hp', combatantData) +
        createStatCont('Attack', primaryAtk, combatantData) +
        createStatCont('Melee Armor', 'mDef', combatantData) +
        createStatCont('Pierce Armor', 'pDef', combatantData) +
        /*createStatCont("Range", "range", data)+
                        createStatCont("ATK Type", "atkType", data)+
                        createStatCont("Speed", "speed", data)+
                        createStatCont("Line of Sight", "lineOfSight", data)+
                        createStatCont("Rate of Fire", "rateOfFire", data)*/
        '</div>\n\
                    </div>'

      element
        .children('.combatant-props')
        .children('div:eq(0)')
        .append(ages, img, elevationCont, unitStats)
      element
        .children('.combatant-props')
        .children('.combatant-stats')
        .children('div:eq(1)')
        .children('.icon-big')
        .click(displayUnitGrid)
      let upgradeData = getUpgrades(data, civ)
      combatantData.upgrades = upgradeData.data
      element.children('.combatant-props').append(upgradeData.element)
      /*
            for(let i in data.cost){
                element.children(".combatant-props").children("div:eq(0)").children("div:eq(3)").children(".unit-stats").append(createStatCont(i, i, data.cost));
            }
            element.children(".combatant-props").children("div:eq(0)").children("div:eq(3)").children(".unit-stats").append(createStatCont("Train Time", "trainTime", data));
            */
      return { element: element, data: combatantData }
    }

    $('#add-combat').click(() => {
      let combat = []
      let cont = $(
        "<div class='combat-cont'><div class='combat-remove'>X</div></div>"
      )
      cont.children('.combat-remove').click(function () {
        $(this).parent().remove()
      })
      let attacker = createCombatant('Attacker', units[5])
      let defender = createCombatant('Defender', units[33])
      combat.push(attacker.data, defender.data)
      let result = generateResult(attacker.data, defender.data)
      cont.append(attacker.element, result, defender.element)
      $('#combatants').append(cont)
      combats.push(combat)

      $(attacker.element)
        .children('.combatant-props')
        .children('.combatant-stats')
        .children('div:eq(0)')
        .children('.icon:eq(' + (attacker.data.ageReq - 1) + ')')
        .click()
      $(defender.element)
        .children('.combatant-props')
        .children('.combatant-stats')
        .children('div:eq(0)')
        .children('.icon:eq(' + (defender.data.ageReq - 1) + ')')
        .click()
    })
    $('#add-combat').click()
  })
})
