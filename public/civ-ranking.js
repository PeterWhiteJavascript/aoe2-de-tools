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
        if(unitNum > 15){
            $(".age img").addClass("small-img");
            $(".building img").addClass("small-img");
            $(".unit img").addClass("small-img");
            $(".age-spacer img").addClass("small-img");
            $(".ages-cont img").addClass("small-img");
        }
        if(unitNum > 17){
            $(".age img").addClass("x-small-img");
            $(".building img").addClass("x-small-img");
            $(".unit img").addClass("x-small-img");
            $(".age-spacer img").addClass("x-small-img");
            $(".ages-cont img").addClass("x-small-img");
        }
        
        $("#civ-bonuses").children(".bonus-desc").empty();
        //Show tech information
        civ.bonusDesc.forEach((d) => {
            $("#civ-bonuses").children(".bonus-desc").append("<p>"+d+"</p>");
        });
        // meso: "parthian tactics", "husbandry", "bloodlines"
        
        
        let bsmithUps = [];
        let bsmithCategories = 5;
        for(i = 0; i < bsmithCategories; i++){
            if(civ.techTree["blacksmith"].upgrades[(i * 3) + 2].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3) + 2].name);
            } else if(civ.techTree["blacksmith"].upgrades[(i * 3) + 1].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3) + 1].name);
            } else if(civ.techTree["blacksmith"].upgrades[(i * 3)].available){
                bsmithUps.push(civ.techTree["blacksmith"].upgrades[(i * 3)].name);
            }
        }
        
        let bsmithdiv = $("<div class='desc-cont'></div>");
        bsmithUps.forEach((u) => {
            bsmithdiv.append("<div class='desc-img'><img src='img/"+u+".png'></div>");
        });
        $("#civ-available-techs").append(bsmithdiv);
        
        console.log(bsmithUps)
        
    });
    $(".civ-cont").first().trigger("click");
    
});
});