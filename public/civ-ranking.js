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
            row.append("<div class='building'>"+"<img src='img/"+buildings[i]+".png'>"+"</div>");
            let unitrow = $("<div class='unit-row'></div>");
            for(let j = 0; j < units.length; j++){
                let unit = units[j];
                let ranks = civ.ranks[buildings[i]][units[j]];
                ranks = ranks.map((r) => {return data.rankConversion[(r + "")];});
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
            row.append(unitrow);
            $("#tree").append(row);
        }
        let unitNum = $(".unit").length;
        if(unitNum > 15){
            $(".age img").addClass("small-img");
            $(".building img").addClass("small-img");
            $(".unit img").addClass("small-img");
            $(".age-spacer img").addClass("small-img");
            $(".ages-cont img").addClass("small-img");
        }
    });
    $(".civ-cont").first().trigger("click");
    
});
});