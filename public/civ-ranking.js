$(function(){
$.getJSON('data.json', function(data) {
    data.civilizations.forEach((civ, i) => {
        $("#civ-conts").append("<div class='civ-cont' civid='"+i+"'><img src='img/civicon-"+(civ.name.toLowerCase())+".png'><div>"+civ.name+"</div></div>");
    });
    
    
    $(".civ-cont").click((e) => {
        $(".selected-civ").removeClass("selected-civ");
        $(e.currentTarget).addClass("selected-civ");
        let civ = data.civilizations[parseInt($(e.currentTarget).attr("civid"))];
        $("#civ-title").text(civ.name);
        $("#civ-emblem").children("img").attr("src", "img/civicon-"+(civ.name.toLowerCase())+".png");
        let buildings = Object.keys(civ.ranks);
        $("#tree").empty();
        
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
                let unitdiv = $("<div class='unit-div'></div>");
                unitdiv.append("<div class='unit'>"+"<img src='img/"+unit+".png'>"+"</div>");
                ranks.forEach((r, k) => {
                    let str = r;
                    if(str.length === 2) str = "&nbsp" + str;
                    let rankDiv = $("<div class='rank "+(rankValues[k] + "-rank")+"'>"+str+"</div>");
                    unitdiv.append(rankDiv);
                });
                unitrow.append(unitdiv);
            }
            let numRanks = buildingRanks.length;
            //Produce a number that ends in 0 or 0.5
            let avgRank = Math.round(buildingRanks.reduce((a, b) => a + b, 0) / numRanks * 2) / 2;
            let rankStr = data.rankConversion[(avgRank + "")];
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
        } else if(unitNum === 21){
            $(".age img").addClass("xa-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("xa-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else if(unitNum >= 19){
            $(".age img").addClass("x-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("x-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else if(unitNum >= 17){
            $(".age img").addClass("small-img");
            $(".building img").addClass("small-img");
            $(".unit img").addClass("small-img");
            $(".age-spacer img").addClass("small-img");
            $(".ages-cont img").addClass("small-img");
        }
        //console.log(unitNum)
        $("#civ-bonuses").children(".bonus-desc").empty();
        $("#civ-available-techs").empty();
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
            ["sanctity", "redemption", "atonement", "illumination", "block printing"],
            ["siege engineers", "masonry", "fortified wall", "hoardings", "sappers", "arrowslits", "guard tower","bombard tower upgrade"]
        ];
        if(finder(civ.techTree.university.upgrades, "architecture").available === true) ups[4][ups[4].indexOf("masonry")] = "architecture";
        if(finder(civ.techTree.university.upgrades, "keep").available === true) ups[4][ups[4].indexOf("guard tower")] = "keep";
        let titles = ["Infantry", "Archer", "Cavalry", "Monastery", "Castle and University"];
        let relevantBuildings = ["barracks", "archery range", "stable", "monastery", "university", "castle"];
        if(missingStable){
            titles.splice(titles.indexOf("Cavalry"), 1);
            ups[1].splice(1, 1);
            ups.splice(2, 1);
            relevantBuildings.splice(2, 1);
        };
        let unique = civ.ranksUnique;
        if(unique){
            civ.ranksUnique.forEach((r) => {
                let idx = titles.indexOf(r[1]);
                if(idx < 0){
                    ups.push([r[0]]);
                    titles.push(r[1]);
                } else {
                    ups[idx].push(r[0]);
                }
            });
        }
        let upsList = [];
        relevantBuildings.forEach((b) => {
            upsList = upsList.concat(civ.techTree[b].upgrades);
        });
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
        
        if(descTextSize > 950){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("x-small-desc-text");
            $(".desc-img img").addClass("x-small-img");
        } else if(descTextSize > 800){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("x-small-desc-text");
        } else if(descTextSize > 750){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("small-desc-text");
            $(".desc-img img").addClass("x-small-img");
        } else if(descTextSize > 700){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("small-desc-text");
        } 
        console.log(descTextSize);
    });
    $(".civ-cont:eq(9)").trigger("click");
    
});
});