$.getJSON('/data.json', function(data) {
    let unitSelect = $("<select id='unit-select'></select>");
    let unitName, //Current unit's name (war galley)
        unitBase, //Current unit's base name (galley)
        baseUnit, //Current units' base stats
        currentUnit; //The current unit's modified stats 
    let upgradesSelected = []; //Save this so that when upgrading a unit class, the ups persist
    for(let i=0; i<data.units.length; i++){
        let unit = data.units[i];
        unitSelect.append("<option>"+unit.name+"</option>");
        let group = data.upgradeGroups[unit.name];
        if(group){
            for(let j=0;j<group.length;j++){
                unitSelect.append("<option first='"+unit.name+"'>"+group[j]+"</option>");
            }
        }
        //If there's an elite upgrade
        if(data.upgrades.find(u => u.name === "elite "+unit.name)){
            unitSelect.append("<option first='"+unit.name+"'>elite "+unit.name+"</option>");
        }
    }
    $(".card").prepend(unitSelect);
    function perMinute(time, res){
        return Math.round((60 / time) * res) || 0;
    }
    function displayData(d){
        $(".unit-img").children("img").attr("src", "/img/"+d.name+".webp");

        let costKeys = Object.keys(d.cost);
        $(".unit-cost-cont").children("div:nth-child("+2+")").hide();
        $(".res-per-minute-cont:nth-child("+(2)+")").hide();
        for(let i=0;i<costKeys.length;i++){
            $(".unit-cost-cont").children("div:nth-child("+(i+1)+")").children("img").attr("src", "/img/"+costKeys[i]+"-icon.webp");
            $(".unit-cost-cont").children("div:nth-child("+(i+1)+")").attr("res", costKeys[i]);
            $(".res-per-minute-cont:nth-child("+(i+1)+")").children("div").first().children("img").attr("src", "/img/"+costKeys[i]+"-icon.webp");
            $(".unit-cost-cont").children("div:nth-child("+(i+1)+")").children("div").text(d.cost[costKeys[i]]);
            $(".res-per-minute-cont:nth-child("+(i+1)+")").children("div").first().children("div").first().text(perMinute(d.trainTime, d.cost[costKeys[i]]));
            if(i === 1){
                $(".unit-cost-cont").children("div:nth-child("+(2)+")").show();
                $(".res-per-minute-cont:nth-child("+(2)+")").show();
            }
        }
        $(".unit-cost-cont").children("div:nth-child("+(3)+")").children("div").text(d.trainTime);
        if(d.upgrade){
            $(".unit-upgrade").show();
            $(".unit-upgrade-cost-cont").children("div:nth-child("+(2)+")").hide();
            let name = d.name;
            
            if(name.slice(0,5) === "elite") {
                if(["elite skirmisher", "elite elephant archer", "elite eagle warrior", "elite battle elephant", "elite steppe lancer", "elite shrivamsha rider", "elite cannon galleon"].indexOf(name) === -1) {
                    name = "elite-unit";
                }
            }
            $(".unit-upgrade-img").children("img").attr("src", "/img/upgrade-"+name+".webp");
            let upgCostKeys = Object.keys(d.upgrade.cost);
            for(let i=0;i<upgCostKeys.length;i++){
                $(".unit-upgrade-cost-cont").children("div:nth-child("+(i+1)+")").children("img").attr("src", "/img/"+upgCostKeys[i]+"-icon.webp");
                $(".unit-upgrade-cost-cont").children("div:nth-child("+(i+1)+")").children("div").text(d.upgrade.cost[upgCostKeys[i]]);
                if(i === 1){
                    $(".unit-upgrade-cost-cont").children("div:nth-child("+(2)+")").show();
                }
            }
            $(".unit-upgrade-cost-cont").children("div:nth-child("+(3)+")").children("div").text(d.upgrade.time);
        } else {
            $(".unit-upgrade").hide();
        }

        $(".card-middle").children(".unit-upgrades").empty();
        $(".card-middle").children(".upgrades").empty();
        
        //Add unit upgrades (maa, long swordsman, etc...)
        //If the base unit is not equal to the current unit, include the base unit as an option
        if(unitName !== unitBase){
            $(".card-middle").children(".unit-upgrades").append("<div class='up-img unit-up unselected' upgrade='"+unitBase+"'><img src='/img/"+unitBase+".webp'></div>");
        }
        //If there is a group for the unit
        if(data.upgradeGroups[unitBase]){
            for(let j = 0; j < data.upgradeGroups[unitBase].length; j++){
                //if it's not this unit itself
                if(data.upgradeGroups[unitBase][j] !== unitName){
                    $(".card-middle").children(".unit-upgrades").append("<div class='up-img unit-up unselected' upgrade='"+data.upgradeGroups[unitBase][j]+"'><img src='/img/"+data.upgradeGroups[unitBase][j]+".webp'></div>");
                } 
                //mark all previous upgrades as selected
                else {
                    $(".card-middle").children(".unit-upgrades").children("div").toggleClass("unselected");
                }
            }
        }
        //If there's just an elite upgrade (in the case of unique units)
        else {
            let elite = getUpgradeData("elite "+unitName);
            if(elite){
                $(".card-middle").children(".unit-upgrades").append("<div class='up-img unit-up unselected' upgrade='"+elite.name+"'><img src='/img/"+elite.name+".webp'></div>");
            }
            if(unitName !== unitBase){
                $(".card-middle").children(".unit-upgrades").children("div").toggleClass("unselected");
            }
        }
        //Add potential upgrades
        for(let i = 0; i < d.upgrades.length; i++){
            let u = d.upgrades[i];
            //If the upgrade string is that of a group, make the upgrade group type.
            if(data.upgradeGroups[u]){
                let groupDiv = $("<div class='upgrade-group'></div>");
                for(let j = 0; j < data.upgradeGroups[u].length; j++){
                    groupDiv.append("<div class='up-img unselected' group='"+u+"' upgrade='"+data.upgradeGroups[u][j]+"'><img src='/img/"+data.upgradeGroups[u][j]+".webp'></div>");
                }
                $(".card-middle").children(".upgrades").append(groupDiv);
            } else if(u !== "heresy" && u !== "faith" && u !== "ballistics"){ //exclude faith/heresy/ballistics
                $(".card-middle").children(".upgrades").append("<div class='up-img unselected' upgrade='"+u+"'><img src='/img/"+u+".webp'></div>");
            }
        }

        $(".unit-stats").children("div:nth-child(1)").children("div:nth-child(1)").children("div").text(d.hp);
        $(".unit-stats").children("div:nth-child(1)").children("div:nth-child(2)").children("div").text(d.mAtk || d.pAtk);
        $(".unit-stats").children("div:nth-child(1)").children("div:nth-child(3)").children("div").text(d.mDef);
        $(".unit-stats").children("div:nth-child(1)").children("div:nth-child(4)").children("div").text(d.pDef);

        $(".unit-stats").children("div:nth-child(2)").children("div:nth-child(1)").children("div").text(d.lineOfSight);
        $(".unit-stats").children("div:nth-child(2)").children("div:nth-child(2)").children("div").text(d.rateOfFire);
        $(".unit-stats").children("div:nth-child(2)").children("div:nth-child(3)").children("div").text(d.speed);

        //Units with ranged attributes
        if(d.accuracy){
            $(".range-attr").show();
            $(".unit-stats").children("div:nth-child(3)").children("div:nth-child(1)").children("div").text(d.range);
            $(".unit-stats").children("div:nth-child(3)").children("div:nth-child(2)").children("div").text(d.frameDelay);
            $(".unit-stats").children("div:nth-child(3)").children("div:nth-child(3)").children("div").text(Math.min(Number(d.accuracy).toFixed(2), 1));
            $(".unit-stats").children("div:nth-child(3)").children("div:nth-child(4)").children("div").text(d.projSpeed);
        } else{
            $(".range-attr").hide();
        }


        $(".unit-stats").children("div:nth-child(4)").children("div:nth-child(1)").children("div:nth-child(2)").text(perMinute(d.rateOfFire, (d.mAtk || d. pAtk) ));
        $(".unit-stats").children("div:nth-child(4)").children("div:nth-child(2)").children("div:nth-child(2)").text(perMinute(1, d.speed));

        $(".armor-classes").empty();
        for(let i=0;i<d.armorClasses.length;i++){
            let armorClassName = data.armorClasses[d.armorClasses[i][0]];
            armorClassName = armorClassName[0].toUpperCase() + armorClassName.substring(1);
            $(".armor-classes").append("<div>"+(armorClassName)+(d.armorClasses[i][1] ? "("+d.armorClasses[i][1]+")" : "")+"</div>");
        }

        $(".attack-bonuses").empty();
        if(d.bonus){
            for(let i=0;i<d.bonus.length;i++){
                if(d.bonus[i][1]){
                    let bonusName = data.armorClasses[d.bonus[i][0]];
                    bonusName = bonusName[0].toUpperCase() + bonusName.substring(1);
                    $(".attack-bonuses").append("<div>"+"+"+d.bonus[i][1]+" vs </div><div>"+bonusName+"</div>");
                }
            }
        }
    }
    function calculateResPerMinute(){
        let res = $(".unit-cost-cont").children("div");
        let time = parseFloat($(".unit-cost-cont").children("div:last-child").children("div:last-child").text());
        for(let i = 0; i < res.length - 1; i++){
            let resNum = parseFloat($(".unit-cost-cont").children("div:eq("+i+")").children("div:last-child").text());
            $(".res-per-minute-cont").children("div:eq("+i+")").children("div:eq(0)").text(perMinute(time, resNum));
        }
    }
    function calculateDamagePerMinute(){
        let damage = parseFloat($(".unit-stats").children("div:eq(0)").children("div:eq(1)").text());
        let attackSpeed = parseFloat($(".unit-stats").children("div:eq(1)").children("div:eq(1)").text());
        $(".unit-stats").children("div:eq(3)").children("div:eq(0)").children("div:eq(0)").text(perMinute(attackSpeed, damage));
    }
    function calculateTilesPerMinute(){
        let speed = parseFloat($(".unit-stats").children("div:nth-child(2)").children("div:nth-child(3)").children("div").text());
        $(".unit-stats").children("div:nth-child(4)").children("div:nth-child(2)").children("div:nth-child(2)").text(perMinute(1, speed));
    }
    function getUnitData(base, unit){
        //Have to get the base unit and then go apply each unit upgrade to get the final stats.
        let group = data.upgradeGroups[base];
        //Base unit stats
        let unitStats = getUnitBaseData(base);
        let stats = {
            name:unit,
            cost:unitStats.cost,
            trainTime:unitStats.trainTime,
            upgrade:false,//most recent upgrade
            hp:unitStats.hp,
            mAtk:unitStats.mAtk,
            pAtk:unitStats.pAtk,
            mDef:unitStats.mDef,
            pDef:unitStats.pDef,
            lineOfSight:unitStats.lineOfSight,
            range:unitStats.range,
            rateOfFire:unitStats.rateOfFire,
            speed:unitStats.speed,
            armorClasses:unitStats.armorClasses,
            bonus:unitStats.bonus,

            frameDelay:unitStats.frameDelay,
            accuracy:unitStats.accuracy,
            projSpeed:unitStats.projSpeed,

            upgrades:[].concat(unitStats.damageTechs, unitStats.otherTechs, unitStats.uniqueDamageTechs, unitStats.uniqueOtherTechs),
            currentUpgrades:{
                trainTime:[]
            }
        };
        if(group){
            //Index for upgrade group
            let groupIdx = group.indexOf(unit);
            //Apply stat increases
            for(let i = 0; i < groupIdx+1; i++){
                let upgrade = getUpgradeData(group[i]);
                let effects = Object.keys(upgrade.effects);
                stats = getUpgradeEffects(upgrade, effects, stats);
                if(groupIdx === i) stats.upgrade = upgrade;
            }
        } else {
            let elite = getUpgradeData(unit);
            if(elite){
                let effects = Object.keys(elite.effects);
                stats = getUpgradeEffects(elite, effects, stats);
                stats.upgrade = elite;
            }
        }
        stats.movementPerMin = stats.speed * 60;
        stats.damagePerMin = stats.mAtk ? 60 / stats.rateOfFire * stats.mAtk : 60 / stats.rateOfFire * stats.pAtk ;

        baseUnit = deepCopyObjects(stats);
        return stats;
    }
    function deepCopyObjects(obj){
        if(obj.bonus){
            let bonus = [];
            for(let i=0;i<obj.bonus.length;i++){
                bonus.push(JSON.parse(JSON.stringify(obj.bonus[i])));
            }
            obj.bonus = JSON.parse(JSON.stringify(bonus));
        }
        if(obj.armorClasses){
            let armorClasses = [];
            for(let i=0;i<obj.armorClasses.length;i++){
                armorClasses.push(JSON.parse(JSON.stringify(obj.armorClasses[i])));
            }
            obj.armorClasses = JSON.parse(JSON.stringify(armorClasses));
        }
        if(obj.cost){
            let cost = {};
            let costKeys = Object.keys(obj.cost);
            for(let i=0;i<costKeys.length;i++){
                cost[costKeys[i]] = JSON.parse(JSON.stringify(obj.cost[costKeys[i]]));
            }
            obj.cost = cost;
        }
        return JSON.parse(JSON.stringify(obj));
    }
    function getUnitBaseData(base){
        return deepCopyObjects(data.units.find(u => u.name === base));
    }
    function getUpgradeData(name){
        let upgrade = data.upgrades.find(u => u.name === name);
        if(upgrade){
            upgrade.effects = deepCopyObjects(upgrade.effects);
        }
        return upgrade;
    };
    function getUpgradeEffects(upgrade, effects, stats){
        for(let j=0;j<effects.length;j++){
            let e = effects[j];
            if(e === "armorClasses"){
                for (let g=0;g<upgrade.effects[e].length;g++){
                    let found = false;
                    for(let k=0;k<stats.armorClasses.length;k++){
                        if(stats.armorClasses[k][0]===upgrade.effects[e][g][0]){
                            stats.armorClasses[k][1] += upgrade.effects[e][g][1];
                            found = true;
                        }
                    }
                    if(!found) stats.armorClasses.push(JSON.parse(JSON.stringify(upgrade.effects[e][g])));
                }

            } else if(e === "bonus"){
                for (let g=0;g<upgrade.effects[e].length;g++){
                    let found = false;
                    for(let k=0;k<stats.bonus.length;k++){
                        if(stats.bonus[k][0]===upgrade.effects[e][g][0]){
                            stats.bonus[k][1] += upgrade.effects[e][g][1];
                            found = true;
                        }
                    }
                    if(!found){
                        stats.bonus.push(JSON.parse(JSON.stringify(upgrade.effects[e][g])));
                    }
                }
            } else if(e === "cost"){
                let costKeys = Object.keys(upgrade.effects[e]);
                for(let k=0;k<costKeys.length;k++){
                    stats[e][costKeys[k]] += upgrade.effects[e][costKeys[k]];
                }
            } else {
                stats[e] += upgrade.effects[e];
            }
        }
        return stats;
    }
    function applyStats(stats, reverse){
        reverse = reverse ? -1 : 1;
        function getStat(cur, to){
            return Number((cur + (to * reverse)).toFixed(2));
        }
        function changeStat(elm, to, s){
            let num = getStat(parseFloat(elm.text()), to);
            elm.text(num);
            currentUnit[s] = num;
        };
        function convertMult(stat, baseStat){
            if(typeof stat === "string"){
                stat = baseStat * parseFloat(stat.substr(1)) - baseStat;
            }
            return stat;
        };
        if(stats.unitSpec){
            if(stats.unitSpec[unitName]){
                stats = stats.unitSpec[unitName];
            } else if(stats.unitSpec[unitBase]){
                stats = stats.unitSpec[unitBase];
            } else {
                console.log("Unit shouldn't be able to upgrade this");
            }
        }
        let statKeys = Object.keys(stats);
        let calcRes = false;
        for(let i=0;i<statKeys.length;i++){
            let s = statKeys[i];
            switch(s){
                case "armorClasses":
                    for(let j = 0; j<stats[s].length; j++){
                        let armorClassName = data.armorClasses[stats[s][j][0]];
                        $(".armor-classes")///UNFINISHED
                    }

                    break;
                case "bonus":
                    for(let j = 0; j<stats[s].length; j++){
                        let bonusName = data.armorClasses[stats[s][j][0]];
                        let category = $(".attack-bonuses").children("div:contains('"+(bonusName[0].toUpperCase() + bonusName.substring(1))+"')");
                        if(!category.length){
                            $(".attack-bonuses").append("<div>"+"+"+0+" vs </div><div>"+(bonusName[0].toUpperCase() + bonusName.substring(1))+"</div>");
                            category = $(".attack-bonuses").children("div:contains('"+(bonusName[0].toUpperCase() + bonusName.substring(1))+"')");
                        }
                        let statDiv = category.prev();
                        let statText = statDiv.text();
                        let bonusDamage = parseFloat(statText.slice(1, -3)) + (stats[s][j][1] * reverse);
                        if(bonusDamage){
                            statDiv.text("+"+bonusDamage+" vs");
                        } else {
                            statDiv.next().remove();
                            statDiv.remove();
                        }
                        
                    }
                    break;
                case "cost":
                    let costKeys = Object.keys(stats[s]);
                    for( let j = 0; j < costKeys.length; j++){
                        let costName = costKeys[j];
                        let cont = $(".unit-cost-cont").children("div[res='"+costName+"']");
                        changeStat(cont.children("div"), convertMult(stats[s][costName], baseUnit.cost[costName]), s);
                    }
                    calcRes = true;
                    break;
                case "hp":
                    changeStat($(".unit-stats").children("div:nth-child(1)").children("div:nth-child(1)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "mAtk":
                    if(!baseUnit.pAtk || baseUnit.mAtk > baseUnit.pAtk){
                        changeStat($(".unit-stats").children("div:nth-child(1)").children("div:nth-child(2)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                        calculateDamagePerMinute();
                    }
                    break;
                case "pAtk":
                    if(!baseUnit.mAtk || baseUnit.pAtk > baseUnit.mAtk){
                        changeStat($(".unit-stats").children("div:nth-child(1)").children("div:nth-child(2)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                        calculateDamagePerMinute();
                    }
                    break;
                case "mDef":
                    changeStat($(".unit-stats").children("div:nth-child(1)").children("div:nth-child(3)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "pDef":
                    changeStat($(".unit-stats").children("div:nth-child(1)").children("div:nth-child(4)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "lineOfSight":
                    changeStat($(".unit-stats").children("div:nth-child(2)").children("div:nth-child(1)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "rateOfFire":
                    changeStat($(".unit-stats").children("div:nth-child(2)").children("div:nth-child(2)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "speed":
                    changeStat($(".unit-stats").children("div:nth-child(2)").children("div:nth-child(3)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    calculateTilesPerMinute();
                    break;
                case "range":
                    changeStat($(".unit-stats").children("div:nth-child(3)").children("div:nth-child(1)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "frameDelay":
                    changeStat($(".unit-stats").children("div:nth-child(3)").children("div:nth-child(2)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "accuracy":
                    currentUnit.accuracy = getStat(currentUnit.accuracy, convertMult(stats[s], baseUnit[s]));
                    $(".unit-stats").children("div:nth-child(3)").children("div:nth-child(3)").children("div").text(Math.min(currentUnit.accuracy, 1));
                    calculateDamagePerMinute();
                    break;
                case "projSpeed":
                    changeStat($(".unit-stats").children("div:nth-child(3)").children("div:nth-child(2)").children("div"), convertMult(stats[s], baseUnit[s]), s);
                    break;
                case "trainTime":
                    if(reverse > 0){
                        currentUnit.currentUpgrades.trainTime.push(stats[s]);
                    } else {
                        var index = currentUnit.currentUpgrades.trainTime.indexOf(stats[s]);
                        if (index !== -1) {
                          currentUnit.currentUpgrades.trainTime.splice(index, 1);
                        }
                    }
                    reverse = 1;
                    
                    let trainTime = baseUnit.trainTime;
                    //apply all upgrades base on the base unit's train time
                    for(k=0;k<currentUnit.currentUpgrades.trainTime.length; k++){
                        trainTime += convertMult(currentUnit.currentUpgrades.trainTime[k], trainTime);
                    }
                    $(".unit-cost-cont").children("div:nth-child(3)").children("div").text(Number(trainTime.toFixed(2)));
                    currentUnit.trainTime = trainTime;
                    calcRes = true;
                    break;
            }
        }
        if(calcRes) calculateResPerMinute();
    }
    function applyUpgrade(name, remove){
        let upData = getUpgradeData(name);
        if(!upData) {
            console.log(name + " doesn't exist in data.json!");
            return;
        }
        applyStats(upData.effects, remove);

    }
    unitSelect.change(function(){
        unitName = $(this).val();
        unitBase = $(this).find(":selected").attr("first") || unitName;
        currentUnit = getUnitData(unitBase, unitName);
        displayData(currentUnit);
    });
    $(document).on("click", ".up-img", (e) => {
        let upgrade =  $(e.currentTarget).attr("upgrade");
        //If it's a class change (war galley -> galleon)
        if($(e.currentTarget).parent().hasClass("unit-upgrades")){
            //Make sure to remember all of the upgrades :)
            upgradesSelected = $(".up-img:not(.unselected):not(.unit-up)");
            unitSelect.val(upgrade).trigger("change");
        } 
        //If it's a normal upgrade
        else {
            //If it's part of an upgrade group
            if($(e.currentTarget).parent().hasClass("upgrade-group")){
                //Apply group logic
                let group = $(e.currentTarget).parent().children(".up-img");
                let idx = group.index(e.currentTarget);
                //When enabling an upgrade, add everything before it
                if($(e.currentTarget).hasClass("unselected")){
                    //Make sure everything up to and including the idx is selected
                    for(let i=0;i<idx+1;i++){
                        if($(group[i]).hasClass("unselected")){
                            $(group[i]).toggleClass("unselected");
                            applyUpgrade($(group[i]).attr("upgrade"), $(group[i]).hasClass("unselected"));
                        }
                    }
                } 
                //When disabling, remove everything after it
                else {
                    let changed = false;
                    for(let i=group.length-1;i>idx-1;i--){
                        if(!$(group[i]).hasClass("unselected")){
                            if((idx === i && !changed) || idx !== i) {
                                $(group[i]).toggleClass("unselected");
                                applyUpgrade($(group[i]).attr("upgrade"), $(group[i]).hasClass("unselected"));
                                changed = true;
                            }
                        }
                    }
                    
                }
                
                
            } else {
                $(e.currentTarget).toggleClass("unselected");
                //It's a standalone upgrade, so just toggle it
                applyUpgrade(upgrade, $(e.currentTarget).hasClass("unselected"));
            }
        }
        //This will only be full when upgrading a unit class
        if(upgradesSelected.length){
            for(let i = 0; i < upgradesSelected.length; i++){
                let up = $(upgradesSelected[i]).attr("upgrade");
                $($("[upgrade='"+up+"']")[0]).toggleClass("unselected");
                applyUpgrade(up, false);
            }
            upgradesSelected = [];
        }
    });
    unitSelect.val("crossbowman").trigger("change");
});