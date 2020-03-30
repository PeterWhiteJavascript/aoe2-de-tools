function finder(arr, name){
    return arr.find((e) => {return e.name === name;});
}
function setUpGatherRates(data){
    let gatherRates = data.units[0].gathering;
    //Get all of the gather rates with various upgrades applied.
    gatherRates["wheelbarrow"] = {gatherRate: gatherRates.farmer.gatherRate + finder(data.upgrades, "wheelbarrow").effects.gatherRate};
    gatherRates["hand cart"] = {gatherRate: gatherRates.farmer.gatherRate + finder(data.upgrades, "wheelbarrow").effects.gatherRate + finder(data.upgrades, "hand cart").effects.gatherRate};
    gatherRates["fishing ship shore"] = {gatherRate: 0.28};
    gatherRates["fishing ship deep"] = {gatherRate: 0.49};
    gatherRates["fishing ship shore gillnets"] = {gatherRate: parseFloat((0.28 + 0.28 * 0.25).toFixed(2))};
    gatherRates["fishing ship deep gillnets"] = {gatherRate: parseFloat((0.49 + 0.49 * 0.25).toFixed(2))};
    gatherRates["double-bit axe"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates.lumberjack.gatherRate * 
            parseFloat(finder(data.upgrades, "double-bit axe").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["bow saw"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates.lumberjack.gatherRate * 
            parseFloat(finder(data.upgrades, "double-bit axe").effects.gatherRate[1].substr(1)) *
            parseFloat(finder(data.upgrades, "bow saw").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["two-man saw"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates.lumberjack.gatherRate * 
            parseFloat(finder(data.upgrades, "double-bit axe").effects.gatherRate[1].substr(1)) *
            parseFloat(finder(data.upgrades, "bow saw").effects.gatherRate[1].substr(1)) *
            parseFloat(finder(data.upgrades, "two-man saw").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["gold mining"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates["gold miner"].gatherRate * 
            parseFloat(finder(data.upgrades, "gold mining").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["gold shaft mining"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates["gold miner"].gatherRate * 
            parseFloat(finder(data.upgrades, "gold mining").effects.gatherRate[1].substr(1)) *
            parseFloat(finder(data.upgrades, "gold shaft mining").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["relic"] = {
        gatherRate: 0.5
    };
    gatherRates["stone mining"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates["stone miner"].gatherRate * 
            parseFloat(finder(data.upgrades, "stone mining").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    gatherRates["stone shaft mining"] = {
        gatherRate: 
            parseFloat(
            (
            gatherRates["stone miner"].gatherRate * 
            parseFloat(finder(data.upgrades, "stone mining").effects.gatherRate[1].substr(1)) *
            parseFloat(finder(data.upgrades, "stone shaft mining").effects.gatherRate[1].substr(1))
            ).toFixed(2)
            )
    };
    return gatherRates;
}