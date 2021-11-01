$(function () {
  $.getJSON('/data.json', function (data) {
    $.getJSON('/maps/arabia.json', function (mapData) {
      let gatherRates = setUpGatherRates(data)
      console.log(gatherRates)
    })
  })
})
