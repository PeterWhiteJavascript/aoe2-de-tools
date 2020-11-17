$(function(){
    let ecoBonuses = {
        "civ":{
            "Generic":{
                
            },
            "Japanese - Dark Age": {
                "fishing ship shore":0.05,
                "fishing ship deep":0.05,
                "fish trap": 0.05
            },
            "Japanese - Feudal Age": {
                "fishing ship shore":0.10,
                "fishing ship deep":0.10,
                "fish trap": 0.10
            },
            "Japanese - Castle Age": {
                "fishing ship shore":0.15,
                "fishing ship deep":0.15,
                "fishing ship shore gillnets":0.15,
                "fishing ship deep gillnets":0.15,
                "fish trap": 0.15,
                "fish trap gillnets": 0.15
            },
            "Japanese - Imperial Age": {
                "fishing ship shore":0.20,
                "fishing ship deep":0.20,
                "fishing ship shore gillnets":0.20,
                "fishing ship deep gillnets":0.20,
                "fish trap": 0.20,
                "fish trap gillnets": 0.20
            },
            "Aztecs (Farms)":{
                "farmer": 0.1309,
                "wheelbarrow": 0.0542
            },
            "Khmer (Farms)":{
                "farmer": 0.083226,
                "wheelbarrow": 0.042098,
                "hand cart": 0.0028
            },
            "Slavs (Farms)":{
                "farmer": 0.1063,
                "wheelbarrow": 0.1183,
                "hand cart": 0.1022
            },
            "Berbers (Farms)":{
                "farmer": 0.0248,
                "wheelbarrow": 0.0218,
                "hand cart": 0.001
            },
            "Mayans (Farms)":{
                "farmer": -0.0286,
                "wheelbarrow": -0.0407,
                "hand cart": 0.0219
            },
            "Mongols (Hunters)":{
                "hunter": 0.4
            },
            "Britons (Shepherds)":{
                "shepherd": 0.25
            },
            "Celts (Lumberjacks)":{
                "lumberjack": 0.15,
                "double-bit axe": 0.15,
                "bow saw": 0.15,
                "two-man saw": 0.15
            },
            "Franks (Foragers)":{
                "forager": 0.25
            },
            "Indians (Fishermen)":{
                "fisherman": 0.10
            },
            "Koreans (Stone Miners)":{
                "stone miner": 0.20,
                "stone mining": 0.20,
                "stone shaft mining": 0.20
            },
            "Turks (Gold Miners)":{
                "gold miner": 0.15,
                "gold mining": 0.15,
                "gold shaft mining": 0.15
            }
        },
        "team":{
            "Aztec Relics": {
                "relic": 0.3333
            },
            "Sultans": {
                "gold miner": 0.1,
                "gold mining": 0.1,
                "gold shaft mining": 0.1,
                "relic": 0.1,
                "trade cart": 0.1
                
            }
        }
    };
    
    $.getJSON('data.json', function(data) {
        let gatherRates = setUpGatherRates(data);
        let gatherRatesCont = $("<div id='gather-rates'></div>");
        let resOrder = ["food", "wood", "gold", "stone"];
        let order = [
            ["farmer", "wheelbarrow", "hand cart", "hunter", "shepherd", "forager", "fisherman", "fishing ship shore", "fishing ship deep", "fishing ship shore gillnets", "fishing ship deep gillnets", "fish trap", "fish trap gillnets","feitoria food"],
            ["lumberjack", "double-bit axe", "bow saw", "two-man saw", "feitoria wood"],
            ["gold miner", "gold mining", "gold shaft mining", "relic", "trade cart","feitoria gold"],
            ["stone miner", "stone mining", "stone shaft mining", "feitoria stone"]
        ];
        let hideAtStart = ["hunter", "shepherd", "forager", "fisherman", "fishing ship shore", "fishing ship deep", "fishing ship shore gillnets", "fishing ship deep gillnets", "fish trap", "fish trap gillnets", "relic", "feitoria food", , "feitoria wood", "feitoria gold", "feitoria stone", "trade cart", "stone shaft mining", "gold shaft mining", "two-man saw"];
        for(let i = 0 ; i < order.length; i++){
            for(let j = 0; j < order[i].length; j++){
                let imgCont = $("<div class='res-show-img showing-img' resource='"+order[i][j]+"' title='"+order[i][j]+"'></div>");
                let imgurl = gatherRates[order[i][j]].img || order[i][j];
                let img = $("<img src='img/"+imgurl+".png' class='icon-big'>");
                let sec = gatherRates[order[i][j]].gatherRate;
                let min = (gatherRates[order[i][j]].gatherRate * 60);
                let num = $("<div sec="+sec+" min="+min+">"+sec+" - " + (min.toFixed(1)) + "</div>");
                imgCont.append(img, num);
                $("#choose-res").append(imgCont);
                imgCont.on("click", function(){
                    $(this).toggleClass("showing-img");
                    let res = $(this).attr("resource");
                    $("#gather-rates").children(".unit-container").each(function(){
                        let resCont = $(this).children(".res-desc-cont").children(".resources-cont").children(".res-row").children(".resource").filter(function(){
                            return $(this).attr("resource") === res;
                        })[0];
                        $(resCont).toggle();
                    }); 
                    calculateVilTotals();
                });
            }
        }
        
        let unitVariety = {
            "villager":{
                "civs":{
                    "Indians - Dark Age":{
                        "cost": {"food": 0.10},
                        "costPercent": true
                    },
                    "Indians - Feudal Age":{
                        "cost": {"food": 0.15},
                        "costPercent": true
                    },
                    "Indians - Castle Age":{
                        "cost": {"food": 0.20},
                        "costPercent": true
                    },
                    "Indians - Imperial Age":{
                        "cost": {"food": 0.25},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.10,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.20,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    
                }
            },
            "militia":{
                "civs":{
                    "Goths - Dark Age": {
                        "cost": {"food": 0.2, "gold": 0.2},
                        "costPercent": true
                    },
                    "Goths - Feudal Age": {
                        "cost": {"food": 0.25, "gold": 0.25},
                        "costPercent": true
                    },
                    "Goths - Castle Age": {
                        "cost": {"food": 0.3, "gold": 0.3},
                        "costPercent": true
                    },
                    "Goths - Imperial Age": {
                        "cost": {"food": 0.35, "gold": 0.35},
                        "costPercent": true
                    },
                    "Aztec Civ Bonus": {
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Supplies": {
                        "cost": {"food": -15}
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Perfusion":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Goths Team Bonus":{
                        "trainTime": 1.20,
                        "trainTimePercent": true
                    }
                }
                        
            },
            "spearman":{
                "civs":{
                    "Goths Civ Bonus": {
                        "cost": {"food": 0.35, "wood": 0.35},
                        "costPercent": true
                    },
                    "Byzantines Civ Bonus":{
                        "cost": {"food": 0.25, "wood": 0.25},
                        "costPercent": true
                    },
                    "Aztec Civ Bonus": {
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Perfusion":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Goths Team Bonus":{
                        "trainTime": 1.20,
                        "trainTimePercent": true
                    }
                }
            },
            "eagle scout":{
                "civs":{
                    "Aztec Civ Bonus": {
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Castle Age":{
                        "trainTime": 35,
                        "img": "eagle warrior"
                    },
                    "Elite Eagle Warrior":{
                        "trainTime": 20,
                        "img": "elite eagle warrior"
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Goths Team Bonus":{
                        "trainTime": 1.20,
                        "trainTimePercent": true
                    }
                }
            },
            "archer":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Mayans - Feudal Age":{
                        "cost": {"wood": 0.10, "gold": 0.10},
                        "costPercent": true
                    },
                    "Mayans - Castle Age":{
                        "cost": {"wood": 0.20, "gold": 0.20},
                        "costPercent": true
                    },
                    "Mayans - Imperial Age":{
                        "cost": {"wood": 0.30, "gold": 0.30},
                        "costPercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Crossbowman":{
                        "trainTime": 27,
                        "img": "crossbowman"
                    },
                    "Kamandaran":{
                        "cost": {"wood": 35, "gold": -45}
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Britons Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "skirmisher":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Byzantines Civ Bonus":{
                        "cost": {"food": 0.25, "wood": 0.25},
                        "costPercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Britons Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "genitour":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Huns - Castle Age":{
                        "cost": {"food": 0.10, "wood": 0.10},
                        "costPercent": true
                    },
                    "Huns - Imperial Age":{
                        "cost": {"food": 0.20, "wood": 0.20},
                        "costPercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Britons Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
                       
            },
            "cavalry archer":{
                "civs":{
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    },
                    "Huns - Castle Age":{
                        "cost": {"wood": 0.10, "gold": 0.10},
                        "costPercent": true
                    },
                    "Huns - Imperial Age":{
                        "cost": {"wood": 0.20, "gold": 0.20},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                    
                },
                "upgrades":{
                    "Steppe Husbandry":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Britons Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "hand cannoneer":{
                "civs":{
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Italians Civ Bonus":{
                        "cost": {"food": 0.2, "gold": 0.2},
                        "costPercent": true
                    }
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Britons Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    },
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "scout cavalry":{
                "civs":{
                    "Berbers - Castle Age":{
                        "cost": {"food": 0.15},
                        "costPercent": true
                    },
                    "Berbers - Imperial Age":{
                        "cost": {"food": 0.20},
                        "costPercent": true
                    },
                    "Magyars Civ Bonus":{
                        "cost": {"food": 0.15},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Chivalry":{
                        "trainTime": 1.4,
                        "trainTimePercent": true
                    },
                    "Steppe Husbandry":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Huns Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "knight":{
                "civs":{
                    "Berbers - Castle Age":{
                        "cost": {"food": 0.15, "gold": 0.15},
                        "costPercent": true
                    },
                    "Berbers - Imperial Age":{
                        "cost": {"food": 0.20, "gold": 0.20},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Chivalry":{
                        "trainTime": 1.4,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Huns Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "camel rider":{
                "civs":{
                    "Berbers - Castle Age":{
                        "cost": {"food": 0.15, "gold": 0.15},
                        "costPercent": true
                    },
                    "Berbers - Imperial Age":{
                        "cost": {"food": 0.20, "gold": 0.20},
                        "costPercent": true
                    },
                    "Byzantines Civ Bonus":{
                        "cost": {"food": 0.25, "gold": 0.25},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Huns Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "steppe lancer":{
                "civs":{
                    
                },
                "upgrades":{
                    "Steppe Husbandry":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Huns Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "battle elephant":{
                "civs":{
                    "Malay Civ Bonus":{
                        "cost": {"food": 0.3, "gold": 0.3},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Huns Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "monk":{
                "civs":{
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Lithuanians Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "battering ram":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Slavs Civ Bonus":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Celts Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "mangonel":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Slavs Civ Bonus":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Celts Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "scorpion":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Slavs Civ Bonus":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    }
                },
                "upgrades":{    
                    "Celts Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "bombard cannon":{
                "civs":{
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Italians Civ Bonus":{
                        "cost": {"food": 0.2, "gold": 0.2},
                        "costPercent": true
                    }
                    
                },
                "upgrades":{
                    "Celts Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    },
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "siege tower":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                    
                },
                "upgrades":{
                    "Celts Team Bonus":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                }
            },
            "trebuchet":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    
                }
            },
            
            "petard":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    
                }
            },
            
            "fishing ship":{
                "civs":{
                    "Italians Civ Bonus":{
                        "cost": {"wood": 0.15},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.1,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    }
                }
            },
            "fire galley":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.1,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Fire Ship":{
                        "trainTime": 36,
                        "img": "fire ship"
                    },
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    }
                }
            },
            "galley":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.1,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    },
                    "Vikings - Feudal/Castle Age":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    },
                    "Vikings - Imperial Age":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "War Galley":{
                        "trainTime": 36,
                        "img": "war galley"
                    },
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    }
                }
            },
            "demolition raft":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.1,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    },
                    "Vikings - Feudal/Castle Age":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    },
                    "Vikings - Imperial Age":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Demolition Ship":{
                        "trainTime": 31,
                        "img": "demolition ship"
                    },
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    }
                }
            },
            "cannon galleon":{
                "civs":{
                    "Aztec Civ Bonus":{
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    },
                    "Italians Civ Bonus":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    },
                    "Vikings - Imperial Age":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    },
                    "Persians - Feudal Age":{
                        "trainTime": 1.1,
                        "trainTimePercent": true
                    },
                    "Persians - Castle Age":{
                        "trainTime": 1.15,
                        "trainTimePercent": true
                    },
                    "Persians - Imperial Age":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    },
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "longboat":{
                "noGeneric": true,
                "civs":{
                    "Vikings - Feudal/Castle Age":{
                        "cost": {"wood": 0.15, "gold": 0.15},
                        "costPercent": true
                    },
                    "Vikings - Imperial Age":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    
                }
            },
            "caravel":{
                "noGeneric": true,
                "civs":{
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    
                }
            },
            "turtle ship":{
                "noGeneric": true,
                "civs":{
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Shipwright":{
                        "cost": {"wood": 0.2},
                        "costPercent": true,
                        "trainTime": 1.54,
                        "trainTimePercent": true
                    },
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "house":{
                "civs":{
                    "Malians Civ Bonus":{
                        "cost": {"wood": 0.15},
                        "costPercent": true
                    },
                    "Spanish Civ Bonus":{
                        "trainTime":1.30,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Treadmill Crane":{
                        "trainTime":1.2,
                        "trainTimePercent": true
                    },
                    "2 Villagers":{
                        "trainTime":1.33,
                        "trainTimePercent": true
                    },
                    "3 Villagers":{
                        "trainTime":1.66,
                        "trainTimePercent": true
                    },
                    "4 Villagers":{
                        "trainTime":2,
                        "trainTimePercent": true
                    }
                }
            },
            "farm":{
                "civs":{
                    "Spanish Civ Bonus":{
                        "trainTime":1.30,
                        "trainTimePercent": true
                    },
                    "Teutons Civ Bonus":{
                        "cost": {"wood": 0.4},
                        "costPercent": true
                    }
                },
                "upgrades":{
                    "Treadmill Crane":{
                        "trainTime": 1.2,
                        "trainTimePercent": true
                    },
                    "25 Second Build Time":{
                        "trainTime": 25
                    }
                }
            },
            "watch tower":{
                "civs":{
                    "Malians Civ Bonus":{
                        "cost": {"wood": 0.15},
                        "costPercent": true
                    },
                    "Incas Civ Bonus":{
                        "cost": {"stone": 0.15},
                        "costPercent": true
                    },
                    "Spanish Civ Bonus":{
                        "trainTime":1.30,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Treadmill Crane":{
                        "trainTime":1.2,
                        "trainTimePercent": true
                    },
                    "2 Villagers":{
                        "trainTime":1.33,
                        "trainTimePercent": true
                    },
                    "3 Villagers":{
                        "trainTime":1.66,
                        "trainTimePercent": true
                    },
                    "4 Villagers":{
                        "trainTime":2,
                        "trainTimePercent": true
                    },
                    "5 Villagers":{
                        "trainTime":2.33,
                        "trainTimePercent": true
                    },
                    "6 Villagers":{
                        "trainTime":2.66,
                        "trainTimePercent": true
                    },
                    "7 Villagers":{
                        "trainTime":3,
                        "trainTimePercent": true
                    }
                }
            },
            "cataphract":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "huskarl":{
                "civs":{
                    
                },
                "upgrades":{
                    "Barracks":{
                        "trainTime": 13
                    },
                    "Perfusion":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "jaguar warrior":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "berserk":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "mameluke":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "teutonic knight":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "throwing axeman":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "shotel warrior":{
                "civs":{
                    
                },
                "upgrades":{
                    "Royal Heirs":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "karambit warrior":{
                "civs":{
                    
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "condottiero":{
                "civs":{
                    "Goths Civ Bonus": {
                        "cost": {"food": 0.35, "gold": 0.35},
                        "costPercent": true
                    },
                    "Aztec Civ Bonus": {
                        "trainTime": 1.11,
                        "trainTimePercent": true
                    }
                },
                "upgrades":{
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Perfusion":{
                        "trainTime": 2,
                        "trainTimePercent": true
                    },
                    "Goths Team Bonus":{
                        "trainTime": 1.20,
                        "trainTimePercent": true
                    }
                }
                
            },
            "war wagon": {
                "noGeneric": true,
                "civs":{
                    "Koreans Civ Bonus": {
                        "cost": {"wood": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "conquistador": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    },
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "tarkan": {
                "civs":{
                    
                },
                "upgrades": {
                    "Stable":{
                        "trainTime": 21
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "camel archer": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "slinger": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "gbeto": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "leitis": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "chu ko nu": {
                "civs":{
                    
                },
                "upgrades": {
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    },
                    "Elite Chu ko Nu":{
                        "trainTime": 13,
                        "img": "elite chu ko nu"
                    }
                }
            },

            "longbowman": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "konnik": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "war elephant": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            "keshik": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "kipchak": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "arambai": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "mangudai": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "kamayuk": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "samurai": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "boyar": {
                "civs":{
                    
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "plumed archer": {
                "noGeneric": true,
                "civs":{
                    "Mayans - Castle Age":{
                        "cost": {"wood": 0.19, "gold": 0.19},
                        "costPercent": true
                    },
                    "Mayans - Imperial Age":{
                        "cost": {"wood": 0.29, "gold": 0.29},
                        "costPercent": true
                    }
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "genoese crossbowman": {
                "civs":{

                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "janissary": {
                "civs":{

                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },
            
            "organ gun":{
                "noGeneric": true,
                "civs":{
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.2},
                        "costPercent": true
                    }
                },
                "upgrades": {
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "ballista elephant":{
                "civs":{

                },
                "upgrades": {
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
                
            },
            "magyar huszar": {
                "civs":{

                },
                "upgrades": {
                    "Corvinian Army": {
                        "cost": {"gold": -10}
                    },
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "rattan archer": {
                "civs":{

                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "elephant archer": {
                "civs":{

                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            },

            "woad raider": {
                "civs":{
 
                },
                "upgrades": {
                    
                    "Conscription":{
                        "trainTime": 1.33,
                        "trainTimePercent": true
                    },
                    "Kasbah":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
                    }
                }
            }
        };
        //Figure out how many villagers are needed to keep all of the units selected producing.
        function calculateVilTotals(){
            let unitsBeingCreated = {};
            let vilsReq = {};
            //Get all visible unit conatiners.
            $("#gather-rates").children(".unit-container:visible").each(function(){
                let unitName = $(this).children(".unit").children(".unit-class").children("img").attr("title");
                unitsBeingCreated[unitName] = {};
                $(this).children(".unit").children(".res-cont").each(function(){
                    let res = $(this).attr("title");
                    unitsBeingCreated[unitName][res] = parseInt($(this).children("div").text());
                });
                unitsBeingCreated[unitName].quantity = parseInt($(this).children(".unit").children(".multiplier-cont").children("div:eq(1)").text());
                $(this).children(".res-desc-cont").children(".resources-cont").children(".res-row").children(".resource").each(function(){
                    let resName = $(this).children(".icon-big").attr("title");
                    let resVal = parseFloat($(this).children(".resource-num").attr("title"));
                    if(vilsReq[resName]){
                        vilsReq[resName] += resVal;
                    } else {
                        vilsReq[resName] = resVal;
                    }
                });
            });
            let resTotals = $("<div class='res-totals'></div>");
            let resDisplay = $("<div class='resources-cont'></div>");
            let unitsDisplay = $("<div class='unit-totals'></div>");
            
            let hiddenRes = getHiddenRes();
            
            let resRow, curRes;
            for(let i in vilsReq){
                let res = gatherRates[i].res;
                if(curRes !== res){
                    if(resRow) resDisplay.append(resRow);
                    curRes = res;
                    resRow = $("<div class='res-row'></div>");
                }
                let resElm = $("<div class='resource' resource='"+i+"'><img class='icon-big' src='img/"+i+".png' title='"+i+"'><div class='resource-num' title='"+vilsReq[i]+"'><div>"+Math.ceil(vilsReq[i])+"</div></div></div>");
                resRow.append(resElm);
                if(hiddenRes.includes(i)){
                    $(resElm).hide();
                }
            }
            resDisplay.append(resRow);
            
            for(let i in unitsBeingCreated){
                unitsDisplay.append("<div class='unit-class'><div class='resource-num' title='"+unitsBeingCreated[i].quantity+"'><div>"+Math.ceil(unitsBeingCreated[i].quantity)+"</div></div><img src='img/"+i+".png' title='"+i+"'></div>");
            }
            
            
            resTotals.append(resDisplay);
            resTotals.append(unitsDisplay);
            $("#vil-totals").children(".res-totals").replaceWith(resTotals);
        }
        function getVilsRequired(trainTime, cost, multiplier){
            function applyCivEcoBonuses(base, res){
                for(let i = 0 ; i < applyEcoBonuses.length; i++){
                    for(let j in applyEcoBonuses[i].data){
                        if(j === res){
                            return base + base * applyEcoBonuses[i].data[j];
                        }
                    }
                }
                return base;
            }
            let req = {};
            for(let i in cost){
                let idx = resOrder.indexOf(i);
                let vilTypes = order[idx];
                for(let j = 0; j < vilTypes.length; j++){
                    let gatherRate = applyCivEcoBonuses(gatherRates[vilTypes[j]].gatherRate, vilTypes[j]);
                    req[vilTypes[j]] = [gatherRates[vilTypes[j]].res, (1 / (gatherRate * trainTime / cost[i]) * multiplier)];
                }
            }
            return req;
        }
        function changeMultiplier(e, num){
            let valCont = $(e.target).parent().children("div:eq(1)");
            let curNum = parseInt(valCont.text());
            curNum = Math.max(curNum + num, 1);
            valCont.text(curNum);
        }
        function applyUpgrade(upgradeData, stats){
            if(upgradeData.cost){
                for(let i in upgradeData.cost){
                    if(upgradeData.costPercent){
                        stats.cost[i] = Math.ceil(stats.cost[i] - stats.cost[i] * upgradeData.cost[i]);   
                    } else {
                        stats.cost[i] += upgradeData.cost[i];
                    }
                }
            }
            
            if(upgradeData.trainTime){
                if(upgradeData.trainTimePercent){
                    stats.trainTime = stats.trainTime / upgradeData.trainTime;
                } else {
                    stats.trainTime = upgradeData.trainTime;
                }
            }
            if(upgradeData.img){
                stats.img = upgradeData.img;
            }
            return stats;
        }
        function applyUpgrades(cont, unitName, stats, civBonus){
            //Apply upgrades after civ bonuses.
            let upgrades = cont.children(".res-desc-cont").children(".upgrades-cont").children("div");
            let checkedUpgrades = [];
            let upgradesToApply = [];
            upgrades.each(function(i, div){
                let idx = $(div).parent().children("div").index(div);
                if($(div).parent().children("div:eq("+idx+")").children("input").prop("checked")){
                    let upName = $(div).parent().children("div:eq("+idx+")").children("div:eq(0)").text();
                    upgradesToApply.push(unitVariety[unitName].upgrades[upName]);
                    checkedUpgrades.push(upName);
                }
            });
            if(civBonus) upgradesToApply.push(civBonus);
            //Sort the upgrades so that the train times that are set happen first. Also sort so that there is only the lowest "set" upgrade.
            //We're gonna make an assumption that any percentage values will be lower than any "set" values for trainTime. This'll sort properly in this case.
            let upsWithTrainTime = [];
            for(let i = upgradesToApply.length - 1; i >= 0; i--){
                if(upgradesToApply[i].trainTime){
                    upsWithTrainTime.push(upgradesToApply.splice(i, 1)[0]);
                }
            }
            upsWithTrainTime.sort((a, b) => {return b.trainTime - a.trainTime;});
            upgradesToApply.push(...upsWithTrainTime);
            
            upgradesToApply.forEach(function(upgrade){stats = applyUpgrade(upgrade, stats);});
            return {stats: stats, checkedUpgrades: checkedUpgrades};
        }
        function getHiddenRes(){
            return $("#choose-res").children(".res-show-img").filter(function(){
                    return !$(this).hasClass("showing-img");
            }).toArray().map(function(item){return $(item).attr("resource");});
        }
        //When changing a select value, replace the container with a new one with the new values.
        function updateVilsRequired(e){
            let cont = $(e.target).closest(".unit-container");
            let civ = cont.children(".unit").children(".upgrade-cont").children("select").val();
            let unitName = cont.attr("name");
            let multiplier = parseInt(cont.children(".unit").children(".multiplier-cont").children("div:eq(1)").text());
            let unitData = finder(data.units, unitName);
            let checkedUpgrades = [];
            let stats, upgrade;
            if(civ && civ !== "Generic"){
                stats = Object.assign({}, {trainTime: unitData.trainTime, cost: Object.assign({}, unitData.cost)});
                upgrade = unitVariety[unitName].civs[civ];
            } else {
                stats = finder(data.units, unitName);
                civ = false;
            }
            let applied = applyUpgrades(cont, unitName, Object.assign({}, {trainTime: stats.trainTime, cost: Object.assign({}, stats.cost), img: stats.img}), upgrade);
            checkedUpgrades = applied.checkedUpgrades;
            let replacement = getUnitContainer(unitName, applied.stats, multiplier, civ, checkedUpgrades);
            if(replacement){
                cont.replaceWith(replacement);
            }
            calculateVilTotals();
        }
        function getResDiv(res){
            return $($("#choose-res").children(".res-show-img").filter(function(){
                return $(this).attr("resource") === res;
            })[0]).children("div").first();
        }
        function displayGatherRate(rate, res){
            let div = getResDiv(res);
            let pMin = rate * 60;
            div.text(
                rate + " - " + (pMin.toFixed(1))
            );
            div.attr("sec", rate);
            div.attr("min", pMin);
        }
        function getUnitContainer(name, unitData, multiplier, selectOption, checkedUpgrades){
            if(unitData){
                let cont = $("<div class='unit-container' name='"+name+"' ></div>");
                let unitCont = $("<div class='unit'></div>");
                let cost = unitData.cost;
                let trainTime = unitData.trainTime;
                let img = unitData.img || name;
                for(let i in cost){
                    unitCont.append("<div class='res-cont' title='"+i+"'><img src='img/"+i+"-icon.png'><div>"+cost[i]+"</div></div>");
                }
                unitCont.append("<div class='time-cont'><img src='img/hourglass-icon.png'><div>"+parseFloat( trainTime.toFixed(2) )+"</div></div>");
                
                unitCont.append("<div class='unit-class'><img src='img/"+img+".png' title='"+name+"'></div>");
                //Add all relevant upgrades
                if(unitVariety[name]){
                    let selectCont = $("<div class='upgrade-cont'>Civilization</div>");
                    let upgradeSelect;
                    if(!unitVariety[name].noGeneric){ 
                        upgradeSelect = $("<select><option>Generic</option></select>");
                    } else {
                        upgradeSelect = $("<select></select>");
                    }
                    for(let j in unitVariety[name].civs){
                        if(selectOption === j){
                            upgradeSelect.append("<option selected>"+j+"</option>");
                        } else {
                            upgradeSelect.append("<option>"+j+"</option>");
                        }
                    }
                    selectCont.append(upgradeSelect);
                    unitCont.append(selectCont);
                    upgradeSelect.on("change", updateVilsRequired);
                }
                
                
                let multiplierCont = $("<div class='multiplier-cont'></div>");
                let minus = $("<div>-</div>");
                let num = $("<div>"+multiplier+"</div>");
                let plus = $("<div>+</div>");
                minus.on("click", function(e){
                    changeMultiplier(e, -1);
                    updateVilsRequired(e);
                });
                plus.on("click", function(e){
                    changeMultiplier(e, 1);
                    updateVilsRequired(e);
                });
                multiplierCont.append(minus, num, plus);
                unitCont.append(multiplierCont);
                cont.append(unitCont);
                
                let resAndTextCont = $("<div class='res-desc-cont'></div>");
                let resourcesCont = $("<div class='resources-cont'></div>");
                let upgradesCont = $("<div class='upgrades-cont'></div>");
                let hiddenRes = getHiddenRes();
                let res = getVilsRequired(trainTime, cost, multiplier);
                let curRes, resRow;
                for(let j in res){
                    if(curRes !== res[j][0]){
                        if(resRow) resourcesCont.append(resRow);
                        curRes = res[j][0];
                        resRow = $("<div class='res-row'></div>");
                    }
                    let img = gatherRates[j].img || j;
                    let resElm = $("<div class='resource' resource='"+j+"'><img class='icon-big' src='img/"+img+".png' title='"+j+"'><div class='resource-num' title='"+res[j][1]+"'><div>"+Math.ceil(res[j][1])+"</div></div></div>");
                    resRow.append(resElm);
                    if(hiddenRes.includes(j)){
                        $(resElm).hide();
                    }
                
                }
                //Append the last row
                resourcesCont.append(resRow);
                
                if(unitVariety[name]){
                    for(let j in unitVariety[name].upgrades){
                        //Figure out what's checked.
                        let checked = false;
                        if(checkedUpgrades){
                            if(checkedUpgrades.includes(j)){
                                checked = true;
                            }
                        }
                        let upgradeCont = $("<div></div>");
                        let checkbox = $("<input type='checkbox'>");
                        if(checked) checkbox.attr("checked", true);
                        upgradeCont.append("<div>"+j+"</div>");
                        upgradeCont.append(checkbox);
                        upgradesCont.append(upgradeCont);
                        checkbox.on("change", updateVilsRequired);
                    }
                }
                
                resAndTextCont.append(resourcesCont);
                resAndTextCont.append(upgradesCont);
                cont.append(resAndTextCont);
                return cont;
            }
        }
        
        //Which units to show and in what order.
        let unitsShown = ["villager", "militia", "spearman", "eagle scout", "archer", "skirmisher",
                          "cavalry archer", "hand cannoneer", "scout cavalry", "knight", "camel rider", "steppe lancer", "battle elephant", 
                          "monk", "battering ram", "mangonel", "scorpion", "bombard cannon", "siege tower", "trebuchet", "petard",
                          "fishing ship", "fire galley", "galley", "demolition raft", "cannon galleon", "longboat", "caravel", "turtle ship",
                          "house", "farm", "watch tower", "arambai", "ballista elephant", "berserk", "boyar", "camel archer", "cataphract", "chu ko nu", "condottiero", "conquistador", "elephant archer", "gbeto", "genitour", "genoese crossbowman", "huskarl", "jaguar warrior", "janissary", "kamayuk", "karambit warrior", "keshik", "kipchak", "konnik", "leitis", "longbowman", "magyar huszar", "mameluke", "mangudai", "organ gun", "plumed archer", "rattan archer", "samurai", "shotel warrior", "slinger", "tarkan", "teutonic knight", "throwing axeman", "war elephant", "war wagon", "woad raider"];
        for(let i = 0; i < unitsShown.length; i++){
            let unitImg = $("<div class='unit-show-img showing-img' unit='"+unitsShown[i]+"' title='"+unitsShown[i]+"'></div>");
            let img = $("<img src='img/"+unitsShown[i]+".png'>");
            unitImg.append(img);
            $("#choose-units").append(unitImg);
            //Toggle the unit data being shown
            unitImg.on("click", function(){
                let unitName = $(this).attr("unit");
                let cont = $("#gather-rates").children(".unit-container").filter(function(){
                    return $(this).attr("name") === unitName;
                })[0];
                $(cont).toggle();
                $(this).toggleClass("showing-img");
                if($(this).hasClass("showing-img")){
                    updateVilsRequired({target:$(cont).children("div").first()});
                }
                calculateVilTotals();
            });
        }
        
        //Track civ/team bonuses that affect eco.
        let applyEcoBonuses = [{name: "Generic", data: {}}];
        //Add eco bonuses.
        let ecoSelect = $("<select></select>");
        let ecoCheckboxes = $("<div></div>");
        let civ = ecoBonuses["civ"];
        for(let j in civ){
            ecoSelect.append("<option>"+j+"</option>");
        }
        ecoSelect.on("change", function(){
            let name = $(this).val();
            //Reset any civ bonus
            for(let j in applyEcoBonuses[0].data){
                displayGatherRate(gatherRates[j].gatherRate, j);
            }
            
            
            
            applyEcoBonuses[0] = {name: name, data: ecoBonuses["civ"][name]};
            $("#gather-rates").children(".unit-container").not(":hidden").each(function(){
                updateVilsRequired({target:$(this).children("div").first()});
            });
            for(let j in applyEcoBonuses[0].data){
                let rate = parseFloat((gatherRates[j].gatherRate + gatherRates[j].gatherRate * applyEcoBonuses[0].data[j]).toFixed(2));
                displayGatherRate(rate, j);
            }
            
            
        });
        let team = ecoBonuses["team"];
        for(let j in team){
            let checkCont = $("<div><div>"+j+"</div></div>");
            let box = $("<input type='checkbox' name='"+j+"'>");
            box.on("change", function(){
                let name = $(this).attr("name");
                //First, reset the gather rates.
                let resetRates = [];
                for(i in applyEcoBonuses){
                    resetRates = resetRates.concat(Object.keys(applyEcoBonuses[i].data));
                }
                resetRates.forEach((i) => {
                    displayGatherRate(gatherRates[i].gatherRate, i);
                });
                
                if($(this).is(':checked')){
                    applyEcoBonuses.push({name: name, data:ecoBonuses["team"][name]});
                } else {
                    let idx = applyEcoBonuses.indexOf(applyEcoBonuses.filter((bonus) => {return bonus.name === name;})[0]);
                    applyEcoBonuses.splice(idx, 1);
                }
                
                let applied = {};
                for(let i = 0; i < applyEcoBonuses.length; i++){
                    for(let j in applyEcoBonuses[i].data){
                        if(applied[j] >= 0){
                            applied[j] = (applied[j] * (1 + applyEcoBonuses[i].data[j]));
                        } else {
                            applied[j] = (gatherRates[j].gatherRate * (1 + applyEcoBonuses[i].data[j]));
                        }
                    }
                }
                
                
                
                for(let j in applied){
                    displayGatherRate(parseFloat(applied[j]).toFixed(2), j);
                }
                $("#gather-rates").children(".unit-container").not(":hidden").each(function(){
                    updateVilsRequired({target:$(this).children("div").first()});
                });
            });
            checkCont.append(box);
            ecoCheckboxes.append(checkCont);
        }

        for(let i = 0; i < unitsShown.length; i++){
            let unitData = finder(data.units, unitsShown[i]);
            if(unitData){
                let cont = getUnitContainer(unitsShown[i], unitData, 1);
                if(cont){
                    gatherRatesCont.append(cont);
                }
            }
        }
        $("#container").append(gatherRatesCont);
        
        $("#econ-civ-bonus").append(ecoSelect);
        $("#econ-civ-bonus").append(ecoCheckboxes);
        $("#choose-units").children(".unit-show-img").trigger("click");
        hideAtStart.forEach(function(toHide){
            let cont = $("#choose-res").children(".res-show-img").filter(function(){
                return $(this).attr("resource") === toHide;
            })[0];
            $(cont).trigger("click");
        });
    });
});