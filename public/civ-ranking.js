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
                ranks = ranks.map((r) => {
                    buildingRanks.push(r);
                    return data.rankConversion[(r + "")];
                });
                while(ranks.length < 4){
                    ranks.unshift("-");
                }
                let unitdiv = $("<div class='unit-div'></div>");
                unitdiv.append("<div class='unit'>"+"<img src='img/"+unit+".png'>"+"</div>");
                ranks.forEach((r) => {
                    unitdiv.append("<div class='rank'>"+r+"</div>");
                });
                unitrow.append(unitdiv);
            }
            let numRanks = buildingRanks.length;
            //Produce a number that ends in 0 or 0.5
            let avgRank = Math.round(buildingRanks.reduce((a, b) => a + b, 0) / numRanks * 2) / 2;
            row.children(".building:last-child").append("<div class='building-rank'>"+data.rankConversion[(avgRank + "")]+"</div>");
            
            row.append(unitrow);
            $("#tree").append(row);
        }
        //Adjust the size of the images (which reduces the size of the rows) FOR PRINTING ONLY.
        let unitNum = $(".unit").length;
        if(unitNum === 21){
            $(".age img").addClass("xx-small-img");
            $(".building img").addClass("xx-small-img");
            $(".unit img").addClass("xx-small-img");
            $(".age-spacer img").addClass("xx-small-img");
            $(".ages-cont img").addClass("xx-small-img");
        } else if(unitNum === 20){
            $(".age img").addClass("xa-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("xa-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else if(unitNum >= 18){
            $(".age img").addClass("x-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("x-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        } else if(unitNum >= 16){
            $(".age img").addClass("small-img");
            $(".building img").addClass("small-img");
            $(".unit img").addClass("small-img");
            $(".age-spacer img").addClass("small-img");
            $(".ages-cont img").addClass("small-img");
        }
        
        $("#civ-bonuses").children(".bonus-desc").empty();
        $("#civ-available-techs").empty();
        //Show tech information
        let descText = ""
        civ.bonusDesc.forEach((d) => {
            $("#civ-bonuses").children(".bonus-desc").append("<p>"+d+"</p>");
            descText += d;
        });
        if(descText.length > 530){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("x-small-desc-text");
        } else if(descText.length > 470){
            $("#civ-bonuses").children(".bonus-desc").children("p").addClass("small-desc-text");
        } 
        console.log(descText.length);
        // meso: "parthian tactics", "husbandry", "bloodlines"
        
        
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
            ["siege engineers", "masonry", "fortified wall", "treadmill crane"],
            ["arrowslits", "guard tower","bombard tower upgrade", "hoardings"]
        ];
        if(finder(civ.techTree.university.upgrades, "architecture").available === true) ups[4][1] = "architecture";
        if(finder(civ.techTree.university.upgrades, "keep").available === true) ups[5][1] = "keep";
        let titles = ["Infantry", "Archer", "Cavalry", "Monastery", "University and Castle", false];
        let relevantBuildings = ["barracks", "archery range", "stable", "monastery","university", "castle"];
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
            let row = $("<div class='desc-cont'></div>");
            u.forEach((a) => {
                let img = $("<div class='desc-img'><img src='img/"+a+".png'></div>");
                if(!finder(upsList, a).available) img.children("img").addClass("upgrade-locked");
                row.append(img);
            });
            if(titles[i]){
                $("#civ-available-techs").append("<div class='header'>"+titles[i]+"</div>");
            }
            $("#civ-available-techs").append(row);
        });
    });
    $(".civ-cont:eq(2)").trigger("click");
    
});
});