$(function(){
$.getJSON('data.json', function(data) {
   
    
    
    /*
     * Upgrade data formatter
     * let upgradesList = {};
    let keys =  Object.keys(data.civilizations[1].techTree);
    for(let i = 0; i <keys.length; i++){
        let b = keys[i];
        for (let j = 0 ;j < data.civilizations[1].techTree[keys[i]].upgrades.length; j++){
            upgradesList[data.civilizations[1].techTree[keys[i]].upgrades[j].name] = b;
        }
    }
    console.log(upgradesList)
    */
    
    
    let upgradeGroup = data.unitGroups;
    let relevantUpgrades = data.relevantUpgrades;
    
    data.civilizations.forEach((civ, i) => {
        $("#civ-conts").append("<div class='civ-cont' civid='"+i+"'><img src='img/civicon-"+(civ.name.toLowerCase())+".png'><div>"+civ.name+"</div></div>");
        
    });
    
    $(".civ-cont").click((e) => {
        $(".selected-civ").removeClass("selected-civ");
        $(e.currentTarget).addClass("selected-civ");
        $("#tree").empty();
        $("#civ-bonuses").children(".bonus-desc").empty();
        $("#civ-available-techs").empty();
        
        if($(e.currentTarget).attr("page") === "explanation"){
            $("#civ-title-cont").hide();
            $("#civ-info").hide();
            $("#explanation").show();
            
            return;
        }
        
        $("#civ-title-cont").show();
        $("#civ-info").show();
        $("#explanation").hide();
        
        let civ = data.civilizations[parseInt($(e.currentTarget).attr("civid"))];
        console.log("You've selected civ #" + (parseInt($(e.currentTarget).attr("civid")) + 1)+", "+civ.name);
        $("#civ-title").text(civ.name);
        $("#civ-emblem").children("img").attr("src", "img/civicon-"+(civ.name.toLowerCase())+".png");
        let buildings = Object.keys(civ.ranks);
        
        for(let i = 0; i < buildings.length; i++){
            let units = Object.keys(civ.ranks[buildings[i]]);
            let row = $("<div class='row'></div>");
            row.append("<div class='building'>"+"<div><img src='img/"+buildings[i]+".png'></div>"+"</div>");
            let unitrow = $("<div class='unit-row'></div>");
            let buildingRanks = [];
            
            for(let j = 0; j < units.length; j++){
                let unit = units[j];
                
                let ranks = civ.ranks[buildings[i]][units[j]];
                let rankValues = [];
                ranks = ranks.map((r, k) => {
                    buildingRanks.push(r);
                    if(r > 3) rankValues.push("high");
                    else if(r < 2) rankValues.push("low");
                    else rankValue = rankValues.push("medium");
                    return data.rankConversion[(r + "")];
                });
                while(ranks.length < 4){
                    ranks.unshift(" ");
                    rankValues.unshift("medium");
                }
                let unitdiv = $("<div class='unit-div' unit='"+unit+"'></div>");
                unitdiv.append("<div class='unit'>"+"<img src='img/"+unit+".png'>"+"</div>");
                
                ranks.forEach((r, k) => {
                    let str = r;
                    if(str.length === 2) str = "&nbsp" + str;
                    let rankDiv = $("<div class='rank "+(rankValues[k] + "-rank")+"'>"+str+"</div>");
                    unitdiv.append(rankDiv);
                });
                unitrow.append(unitdiv);
                unitdiv.mouseenter((e) => {
                    unitdiv.addClass("hovered-unit");
                    let upgradesDiv = $("<div class='upgrades-div'><div class='relative-upgrades'></div></div>");
                    let height = $(e.currentTarget).height();
                    let width = $(e.currentTarget).width();
                    upgradesDiv.children(".relative-upgrades").css({
                        top: -height,
                        left: width / 4 - width / 8,
                        height: height + height / 8,
                        width: width - width / 4
                    });
                    let unit = $(e.currentTarget).attr("unit");
                    if(!relevantUpgrades[unit] && upgradeGroup[unit])  unit = upgradeGroup[unit];
                    let relevant = relevantUpgrades[unit];
                    let uniqueUps = civ.ranksUnique.map((u) => {
                        return u[1].includes(unit);
                    });
                    console.log(unit, relevantUpgrades)
                    relevant.forEach((u) => {
                        let up = u;
                        let locked = false;
                        if(data.upgradeGroups[u]){
                            let changed = false;
                            //Get the best upgrade this civ has in the group.
                            for(let i = 0; i < data.upgradeGroups[u].length; i++){
                                let buildingName = data.upgradeBuilding[data.upgradeGroups[u][i]];
                                console.log(buildingName, civ.techTree)
                                if(finder(civ.techTree[buildingName].upgrades, data.upgradeGroups[u][i]).available){
                                    up = data.upgradeGroups[u][i];
                                    changed = true;
                                }
                            }
                            if(!changed){
                                up = data.upgradeGroups[u][0];
                                locked = true;
                            }
                        } else {
                            locked = !finder(civ.techTree[data.upgradeBuilding[up]].upgrades, up).available;
                            
                        }
                        let img = $("<div class='relevant-img'><img src='img/"+up+".png'></div>");
                        if(locked) img.addClass("upgrade-locked");
                        upgradesDiv.children(".relative-upgrades").append(img);
                    });
                    uniqueUps.forEach((affectsUnit, i) => {
                        if(affectsUnit){
                            upgradesDiv.children(".relative-upgrades").append("<div class='relevant-img'><img src='img/"+civ.ranksUnique[i][0]+".png'></div>");
                        }
                    });
                    if(upgradesDiv.children(".relative-upgrades").children(".relevant-img").length > 7){
                        upgradesDiv.children(".relative-upgrades").children(".relevant-img").css({
                            "margin-left": "1px",
                            "margin-right": "1px"
                        });
                    } else if(upgradesDiv.children(".relative-upgrades").children(".relevant-img").length > 5){
                        upgradesDiv.children(".relative-upgrades").children(".relevant-img").css({
                            "margin-left": "3px",
                            "margin-right": "3px"
                        });
                    }
                    
                    $(e.currentTarget).append(upgradesDiv);
                    
                });
                unitdiv.mouseleave((e) => {
                    unitdiv.removeClass("hovered-unit");
                    $(e.currentTarget).children(".upgrades-div").remove();
                });
            }
            let numRanks = buildingRanks.length;
            //Produce a number that ends in 0 or 0.5
            let buildingRank = buildingRanks.reduce((a, b) => a + b, 0);
            let avgRank = Math.round(buildingRank / numRanks * 2) / 2;
            let rankStr = data.rankConversion[(avgRank + "")];
            if(buildingRank / buildingRanks.length === 4){
                rankStr = "X";
            }
            if(rankStr.length === 2) rankStr = "&nbsp" + rankStr;
            else rankStr = "&nbsp" + rankStr + "&nbsp";
            row.children(".building:last-child").append("<div class='building-rank'><div>"+rankStr+"</div></div>");
            
            row.append(unitrow);
            $("#tree").append(row);
        }
        //Adjust the size of the images (which reduces the size of the rows) FOR PRINTING ONLY.
        let unitNum = $(".unit").length;
        if(unitNum === 22){
            $(".age img").addClass("xx-small-img");
            $(".building img").addClass("xx-small-img");
            $(".unit img").addClass("xx-small-img");
            $(".age-spacer img").addClass("xx-small-img");
            $(".ages-cont img").addClass("xx-small-img");
        } else if(unitNum >= 20){
            $(".age img").addClass("xa-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("xa-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else if(unitNum >= 17){
            $(".age img").addClass("x-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("x-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else {
            $(".age img").addClass("small-img");
            $(".building img").addClass("small-img");
            $(".unit img").addClass("small-img");
            $(".age-spacer img").addClass("small-img");
            $(".ages-cont img").addClass("small-img");
        }
        //console.log(unitNum)
        //Show tech information
        let descTextSize = 0;
        //Each line is maximum (44) characters
        //Each p adds 1 line of spacing, so (44) characters are added
        civ.bonusDesc.forEach((d) => {
            $("#civ-bonuses").children(".bonus-desc").append("<p>"+d+"</p>");
            descTextSize += d.length + 44;
        });
        
        let bsmithUps = [];
        let bsmithCategories = 5;
        let missingStable = false;
        for(i = 0; i < bsmithCategories; i++){
            if(civ.techTree["blacksmith"].upgrades[(i * 3) + 2].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3) + 2].name);
            } else if(civ.techTree["blacksmith"].upgrades[(i * 3) + 1].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3) + 1].name);
            } else if(civ.techTree["blacksmith"].upgrades[(i * 3)].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3)].name);
            } else {
                missingStable = true;
            }
        }
        
                   
        let bsmithdiv = $("<div class='desc-cont'></div>");
        bsmithUps.forEach((u) => {
            bsmithdiv.append("<div class='desc-img'><img src='img/"+u+".png'></div>");
        });
        $("#civ-available-techs").append("<div class='header'>Blacksmith</div>");
        $("#civ-available-techs").append(bsmithdiv);
        
        let ups = [
            ["squires", "supplies", "arson"],
            ["thumb ring", "parthian tactics"],
            ["bloodlines", "husbandry"],
            ["sanctity", "redemption", "block printing", "illumination", "fervor", "atonement", "theocracy", "heresy", "faith","herbal medicine"],
            ["siege engineers", "masonry", "fortified wall", "hoardings", "sappers", "arrowslits", "treadmill crane", "bombard tower upgrade"]
        ];
        if(finder(civ.techTree.university.upgrades, "architecture").available === true) ups[4][ups[4].indexOf("masonry")] = "architecture";
        civ.ranksUnique.forEach((r) => {
            ups[4].push(r[0]);
        });
        let titles = ["Barracks", "Archery Range", "Stable", "Monastery", "Castle and University"];
        let relevantBuildings = ["barracks", "archery range", "stable", "monastery", "university", "castle"];
        if(missingStable){
            titles.splice(titles.indexOf("Stable"), 1);
            ups[1].splice(1, 1);
            ups.splice(2, 1);
            relevantBuildings.splice(2, 1);
        };
        let upsList = [];
        relevantBuildings.forEach((b) => {
            upsList = upsList.concat(civ.techTree[b].upgrades);
        });
        if(civ.name === "Goths" || civ.name === "Cumans"){
            ups[4][ups[4].indexOf("fortified wall")] = "stone wall";
            upsList.push({name: "stone wall", available: false})
        }
        ups.forEach((u, i) => {
            if(titles[i]){
                $("#civ-available-techs").append("<div class='header'>"+titles[i]+"</div>");
            }
            let row = $("<div class='desc-cont'></div>");
            u.forEach((a) => {
                let img = $("<div class='desc-img'><img src='img/"+a+".png'></div>");
                if(!finder(upsList, a).available) img.children("img").addClass("upgrade-locked");
                row.append(img);
                if(row.children(".desc-img").length === 5){
                    $("#civ-available-techs").append(row);
                    row = $("<div class='desc-cont'></div>");
                }
            });
            $("#civ-available-techs").append(row);
        });
        if(descTextSize > 1050){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("xxx-small-desc-text");
            $(".desc-img img").addClass("xxx-small-img");
        } else if(descTextSize > 950){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("xxx-small-desc-text");
            $(".desc-img img").addClass("xx-small-img");
        } else if(descTextSize > 850){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("xx-small-desc-text");
            $(".desc-img img").addClass("xx-small-img");
        } else if(descTextSize > 750){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("x-small-desc-text");
            $(".desc-img img").addClass("xx-small-img");
        } else if(descTextSize > 650){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("x-small-desc-text");
            $(".desc-img img").addClass("x-small-img");
        } else if(descTextSize > 550){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("small-desc-text");
        } 
    });
    $(".civ-cont:eq(0)").trigger("click");
    
});
});