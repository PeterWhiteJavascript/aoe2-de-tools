$(function(){
    let ecoBonuses = {
        "civ":{
            "Generic":{
                
            },
            "Japanese - Dark Age": {
                "fishing ship shore":0.05,
                "fishing ship deep":0.05
            },
            "Japanese - Feudal Age": {
                "fishing ship shore":0.10,
                "fishing ship deep":0.10
            },
            "Japanese - Castle Age": {
                "fishing ship shore":0.15,
                "fishing ship deep":0.15,
                "fishing ship shore gillnets":0.15,
                "fishing ship deep gillnets":0.15
            },
            "Japanese - Imperial Age": {
                "fishing ship shore":0.20,
                "fishing ship deep":0.20,
                "fishing ship shore gillnets":0.20,
                "fishing ship deep gillnets":0.20
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
            ["farmer", "wheelbarrow", "hand cart", "hunter", "shepherd", "forager", "fisherman", "fishing ship shore", "fishing ship deep", "fishing ship shore gillnets", "fishing ship deep gillnets", "feitoria food"],
            ["lumberjack", "double-bit axe", "bow saw","two-man saw", "feitoria wood"],
            ["gold miner", "gold mining", "gold shaft mining", "relic", "trade cart","feitoria gold"],
            ["stone miner", "stone mining", "stone shaft mining", "feitoria stone"]
        ];
        let hideAtStart = ["hunter", "shepherd", "forager", "fisherman", "fishing ship shore", "fishing ship deep", "fishing ship shore gillnets", "fishing ship deep gillnets", "relic", "feitoria food", , "feitoria wood", "feitoria gold", "feitoria stone", "trade cart"];
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
                        let resCont = $(this).children(".res-desc-cont").children(".resources-cont").children(".resource").filter(function(){
                            return $(this).attr("resource") === res;
                        })[0];
                        $(resCont).toggle();
                    }); 
                    calculateVilTotals();
                });
            }
        }
        
        let unitDescs = {
            "villager": "<p>In the Dark Age, you'll mostly be collecting sheep, hunt(boar/deer), and berries. Conventional wisdom dictates that having 6 on sheep allows for constant villager production throughout the Dark Age, but this is only because you start with 200 food. In the case of the Chinese (start with 0 food), 7 villagers on sheep is preferred.</p>"+
                      "<p>If you are booming in Castle Age with 3 town centers, you will need a minimum of 19/17/15 farms, otherwise you can buy food from the market to maintain villager production. 4 town centers require 25/22/20 farms.</p>"+
                      "<p>Indians get cheaper villagers and Persians get faster creation time on their town centers.</p>"+
                      "<p>Fishermen collect shore and deep fish at the same rate, unlike fishing ships.</p>"+
                      "<p>The rates for collecting deep fish are a bit high, as under normal circumstances, there is a long travel distance between the fish and your dock. Even though you only need just over 4 fishing ships to maintain villager production, even with 5 ships working in a realistic situation, you may just barely be able to keep your town center producing.</p>",
            "militia": "<p>Militia are the only military unit available in the Dark Age, so going for a drush (Dark Age rush) is a very common strategy on open maps such as Arabia. You will generally only produce a limited number of them in Dark Age, so being able to maintain production is not important at this point. The most common number to produce in Dark Age is 3.</p>"+
                       "<p>In Feudal Age, you can upgrade militia to man-at-arms, which makes them much scarier to villagers. You can also get the supplies upgrade, which reduces their food cost to 45 from 60. The cost of supplies is 150f 100g and it takes 35 seconds to research. To make this upgrade worth it (in total resource cost), you must produce at least 17 more militia.</p>"+
                       "<p>Once your opponent gets walls and archers, your men-at-arms will have a hard time doing damage since the archers will just kite (run and shoot) your units, so adding skirmishers or towers to your push are some good ways to make men-at-arms more viable in Feudal Age.</p>"+
                       "<p>The Goths get cheaper infantry, which reduces the militia's cost to 39f 13g. They also produce infantry 20% faster in all ages, which reduces their creation time from 21 seconds to 17.5 seconds. After conscription (no perfusion), it's 13.1 seconds. After perfusion (no conscription), they produce in 8.7 seconds.  After conscription and perfusion, it's only 6.5 seconds.</p>",
               
            "spearman": "<p>Spearmen are usually built in small quantities in the early gaame to deal with scout rushes. They are very cost effective at this, being able to kill a single unupgraded scout in 3 hits (4 for sc with bloodlines).</p>"+
                        "<p>Byzantines get 25% cheaper spearmen, so they can afford to train a few extra if the opponent is going scouts. Unupgraded, their combat stats are similar to a loomed villager. In general, it's better to push with man-at-arms or scouts and archers in the early game.</p>"+
                        "<p>Most of the spearman's damage to cavalry comes from their hidden bonus damage, so upgrading forging is pretty much useless against cavalry. If the opponent has a lot of scouts in Feudal Age (10+) you might want to consider getting scale mail armor on your spearmen as it makes scouts need 12 hits instead of 9 to kill them (9 hits instead of 8 if the sc have forging).</p>"+
                        "<p>In the late game, siege and halberdier is a common unit composition since the halbs deal with cavalry, and siege onagers deal with everything else.</p>",
            "eagle scout":"<p>Aztecs, Mayans, and Incas all start with an eagle scout instead of scout cavalry. The eagle scout is slower, but stronger than a scout cavalry, and it has more line of sight.</p>"+
                            "<p>It might seem like 50 gold per eagle warrior is a lot, but considering that mining gold is faster than farming in the early game, massing eagles early on is very easy while still maintaining a good economy. They take 60 seconds to create in the Feudal Age, so you need multiple barracks if you want to go for eagle scouts (51 seconds for Aztecs). Eagle warriors don't have any good counters early on since they start with 2 pierce armor and they can run away from man-at-arms</p>",
            "archer": "<p>The archer is a very common unit to build in the Feudal Age since they can easily kill villagers once they have fletching and they can deny rewalling and repairing walls. Going up to Feudal Age with 21-23 villagers and then building 2 archery ranges is a very common strategy.</p>",
            "skirmisher": "<p>Skirmishers are mostly used to counter a player that is going archers. It is often better to get padded archer armor before fletching if you don't have many skirmishers and you're up against a player who is being aggressive with archers.</p>"+
                          "<p>In Castle Age, if you still have a lot of skirmishers from Feudal Age, they become effective at killing villagers once you get bodkin arrow and the elite upgrade.</p>",
            "hand cannoneer":"<p>Hand cannoneers are mainly used to counter infantry in the late game, but if you go for a fast Imperial Age, then they are good against most Castle Age units (cavalry archers being the main counter).</p>",
            "cavalry archer":"<p>Cavalry archers are expensive, but excel when in large groups that can 1-shot knights and camels. They can be useful for raiding if your opponent isn't able to wall, but they are slower to train and more expensive to train than crossbowmen, and aren't able to fight armies head on until there are a lot of them.</p>",
            "scout cavalry": "<p>Cumans with steppe husbandry train scouts in 6 seconds (4.5 with conscription as well). Since steppe husbandry only costs 200f/300w, you could theoretically have a single stable work as fast as 5 stables to produce light cavalry throughout the Castle Age if you go for kipchaks.</p>",
            "knight":"<p>Knights are a very strong unit that crushes anything that can be made in the Feudal Age, even spearmen. It's difficult to go for early knights since they are so expensive, and also require food, which you need for villager production as well. For 2 stable play in caslte age, you'll probably want 2 mining camps so that your villagers work more efficiently. The gold mining upgrade is worth consideration as well.</p>",
            "camel rider":"<p>Camels are a good counter to knights since they train much faster and cost a bit less. Since they train faster, you'll actually need more villagers on food and gold to maintain production.</p>",
            "battle elephant":"<p>Battle elephants are extremely expensive and are a very situational unit, since they are slow and weak to conversions. They train fairly quickly and can deter entire Feudal Age armies by themselves, so they can be useful defensively.</p>",
            "monk": "<p>Monks train fairly slow, which means that even though they cost 100 gold, you only need around 5 gold miners to maintain constant production. They are commonly built with mangonels, which require 8 on gold, so having 13 on gold for your siege/monk push is necessary.</p>",
            "battering ram":"<p></p>",
            "mangonel":"<p></p>",
            "bombard cannon":"<p>Commonly built with hand canonneers in a fast Imperial Age rush, especially when playing Turks. If you have around 14 farms, 10 lumberjacks, and 25 on gold (49 vils), you can maintain 1 bombard cannon and 3 hand canonneer production as Turks.</p>",
            "scorpion":"<p>Scorpions are the least popular siege workshop unit (apart from the siege tower) because it needs to be massed and have units in front of it to be effective usually. Since their projectile fires faster than the mangonel, they can be used to defeat small raids of archers effectively. It can be argued that 2 scorpions can be more effective than 1 mangonel in this situation.</p>",
            "fishing ship":"<p>Fishing ships collect food faster than villagers in the Dark Age, so they are almost always worth going for on maps with deep fish.</p>",
            "fire galley": "<p>The fire galley is the most common naval unit to open with on water maps since galleys are so weak in small numbers. If you have 2 gold miners per dock, then you should have a good time on water in the Feudal Age.</p>",
            "galley":"<p>The galley can usually be added into your navy once you've gained some water control and are able to transition from fire galleys. If you are playing a water map where your docks are far away from you enemy's docks, you may be able to get away with opening galleys. Vikings don't get fire galleys, but their cheaper galleys and docks allow them to more easily mass them early.</p>",
            "demolition raft":"<p>If you are being overrun by enemy fire ships, you can build a demolition raft to make an easy comeback if your opponent doesn't split their ships properly. They create in 45 seconds instead of 60 for both the galley and fire galley, so they can be produced in a pinch more easily.</p>"+
                              "<p>They should never make up most of your army, but once both you and your opponent have 10+ fire galleys, it's generally worth it to add in some demolition rafts.</p>",
            "cannon galleon":"<p>Cannon galleons are quite a bit more expensive than any other ship.</p>",
            "house":"<p>You won't usually be building houses constantly throughout the dark age, but if you are going for a 3 or 4 tc boom, you should have a single villager dedicated to constantly building houses.</p>",
            "farm":"<p>Farms are usually not something that you build constantly, so I've included an 'upgrade' that allows you to set the farm's build time to 25 seconds (as fast as a villager), which will tell you how many villagers you need on wood to build farms with the next villagers that you'll be building out of the town center.</p>",
            "watch tower":"<p>The numbers for constantly building watch towers are a bit high since there's always some downtime for when your villagers go to the next building location. You will also need stone for repairs, so the numbers on stone are just a guideline. 5 stone miners is probably the maximum you'll need in an actual game for tower rushing.</p>",
            "cataphract":"<p></p>",
            "jaguar warrior":"<p>The train time for jaguar warriors is 20, but it is always reduced to 17 by the Aztec's civ bonus.</p>",
            "karambit warrior":"<p></p>",
            "plumed archer":"<p>Select appropriate age (Castle or Imperial) to determine the cost of the unit.</p>",
            "condottiero": "<p>Condottiero is restricted to the Imperial Age.</p>"+
                           "<p>Allies are able to make this unit, but also must be in the Imperial Age.</p>"
                            
            
        };
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"wood": 0.15},
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
                        "cost": {"wood": 0.15},
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
                        "cost": {"wood": 0.15},
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
                        "cost": {"gold": 0.15},
                        "costPercent": true
                    }
                    
                },
                "upgrades":{
                    "Steppe Husbandry":{
                        "trainTime": 5,
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
                        "cost": {"gold": 0.15},
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
                        "trainTime": 5,
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
                        "cost": {"food": 0.15},
                        "costPercent": true
                    },
                    "Berbers - Imperial Age":{
                        "cost": {"food": 0.20},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.15},
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
                        "cost": {"food": 0.15},
                        "costPercent": true
                    },
                    "Berbers - Imperial Age":{
                        "cost": {"food": 0.20},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
            "fishing ship":{
                "civs":{
                    "Italians Civ Bonus":{
                        "cost": {"wood": -0.15},
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
                        "cost": {"wood": 0.15},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.15},
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
                        "cost": {"wood": 0.15},
                        "costPercent": true
                    },
                    "Portuguese Civ Bonus":{
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
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
                        "cost": {"gold": 0.15},
                        "costPercent": true
                    },
                    "Italians Civ Bonus":{
                        "cost": {"wood": 0.2, "gold": 0.2},
                        "costPercent": true
                    },
                    "Vikings Civ Bonus":{
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
                    },
                    "Turks Team Bonus":{
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
                    },
                    "Turks Team Bonus":{
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
                    },
                    "Turks Team Bonus":{
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
                    },
                    "Turks Team Bonus":{
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
                    "Turks Team Bonus":{
                        "trainTime": 1.25,
                        "trainTimePercent": true
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
                    },
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
                    },
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
                    },
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
                    },
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
                    },
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
                    },
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
                    },
                }
            },

            "plumed archer": {
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
                    },
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
                    },
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
                    },
                }
            },

            "magyar huszar": {
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
                    },
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
                    },
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
                    },
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
                $(this).children(".res-desc-cont").children(".resources-cont").children(".resource").each(function(){
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
            for(let i in vilsReq){
                let resElm = $("<div class='resource' resource='"+i+"'><img class='icon-big' src='img/"+i+".png' title='"+i+"'><div class='resource-num' title='"+vilsReq[i]+"'><div>"+Math.ceil(vilsReq[i])+"</div></div></div>");
                resDisplay.append(resElm);
                if(hiddenRes.includes(i)){
                    $(resElm).hide();
                }
            }
            
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
                    req[vilTypes[j]] = (1 / (gatherRate * trainTime / cost[i]) * multiplier);
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
                let res = getVilsRequired(trainTime, cost, multiplier);
                for(let i in cost){
                    unitCont.append("<div class='res-cont' title='"+i+"'><img src='img/"+i+"-icon.png'><div>"+cost[i]+"</div></div>");
                }
                unitCont.append("<div class='time-cont'><img src='img/hourglass-icon.png'><div>"+parseFloat( trainTime.toFixed(2) )+"</div></div>");
                
                unitCont.append("<div class='unit-class'><img src='img/"+img+".png' title='"+name+"'></div>");
                //Add all relevant upgrades
                if(unitVariety[name]){
                    let selectCont = $("<div class='upgrade-cont'>Civilization</div>");
                    let upgradeSelect = $("<select><option>Generic</option></select>");
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
                let textCont = $("<div class='unit-desc-cont'>"+(unitDescs[name] || "")+"</div>");
                let hiddenRes = getHiddenRes();
                for(let j in res){
                    let img = gatherRates[j].img || j;
                    let resElm = $("<div class='resource' resource='"+j+"'><img class='icon-big' src='img/"+img+".png' title='"+j+"'><div class='resource-num' title='"+res[j]+"'><div>"+Math.ceil(res[j])+"</div></div></div>");
                    resourcesCont.append(resElm);
                    if(hiddenRes.includes(j)){
                        $(resElm).hide();
                    }
                }
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
                resAndTextCont.append(textCont);;
                cont.append(resAndTextCont);
                return cont;
            }
        }
        
        //Which units to show and in what order.
        let unitsShown = ["villager", "militia", "spearman", "eagle scout", "archer", "skirmisher",
                          "cavalry archer", "hand cannoneer", "scout cavalry", "steppe lancer", "knight",
                          "camel rider", "battle elephant", "monk", "battering ram", "mangonel", "scorpion",
                          "bombard cannon", "fishing ship", "fire galley", "galley", "demolition raft", "cannon galleon",
                          "house", "farm", "watch tower", "cataphract", "magyar huszar", "throwing axeman", "shotel warrior", "huskarl", "berserk", "jaguar warrior", "teutonic knight", "samurai", "woad raider", "karambit warrior", "condottiero",
                          "conquistador", "slinger", "kamayuk", "camel archer", "kipchak", "mangudai", "chu ko nu", "genoese crossbowman", "janissary", "plumed archer", "elephant archer", 
                          "konnik", "leitis", "boyar", "keshik", "mameluke", "gbeto", "longbowman", "rattan archer", "arambai"];
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