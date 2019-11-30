// These two are in the header of the board. Always present.
var BoardTime = new Date();
var BusStopName = "Calculating...";

// References to the selects for the routes and stops.
var select_routes;
var select_stops;

/**
 * Settings to be used for the GET to avoid CORS problems.
 * @param {*} url 
 */
function ajaxSessings(url) {
  return {
    'cache': false,
    'dataType': "jsonp",
    "async": true,
    "crossDomain": true,
    "url": url,
    "method": "GET",
    "headers": {
        "accept": "application/json",
        "Access-Control-Allow-Origin":"*"
    }
  };
}

/**
 * Reloads drop-down box (select)
 * @param {*} select - select to reload
 * @param {*} data   - array to be loaded in the following format: { text: '', value: '' }
 */
function fillSelect(select, data) {
  select.options.length = 0;
  data.forEach(e => {
    var option   = document.createElement("option");
    option.text  = e.text;
    option.value = e.value;
    select.add(option);
  });
}

/**
 * Runs upon the route change.
 */
function onRouteChanged() {
  console.log("onRouteChanged: " + select_routes.value);
  getStops(select_routes.value);
}

/**
 * Runs upon the stop select change.
 */
function onStopChanged() {
  var face = select_stops.options[select_stops.selectedIndex].text;
  var value = select_stops.options[select_stops.selectedIndex].value;

  getArrivalDepartures(value);

  BusStopName = face;
}

/**
 * Loads all STA routs from the service.
 */
function getRoutes() {
  $.ajax(ajaxSessings("http://52.88.188.196:8080/api/api/where/routes-for-agency/STA.json?key=TEST"))
  .done(function(response) {
    console.log(response.data);
    var data = [];

    // reformatting the data to be compatible with the fillSelect function
    response.data.list.forEach(e => {
      data.push({ text: 'Route ' + e.shortName, value: e.id  });
    });

    // Sort the data to be in ascending order.
    data.sort((a, b) => (a.value > b.value) ? 1 : -1);

    // Reload data
    fillSelect(select_routes, data, 0);

    // grab stops for the selected routs
    getStops(select_routes.value);
  });
}

/**
 * Loads all the stops for the specified route.
 * @param {*} routeId 
 */
function getStops(routeId) {
  console.log("getStops: " + routeId);

  $.ajax(ajaxSessings("http://52.88.188.196:8080/api/api/where/stops-for-route/" + routeId + ".json?key=TEST"))
  .done(function(response) {
    //console.log(response.data.references.stops);
    var stops = response.data.references.stops;
    /* we get data in the following format:
    code: "1005"
    direction: "E"
    id: "STA_ARENA"
    lat: 47.667999
    locationType: 0
    lon: -117.419131
    name: "Arena Lot"
    */

    var data = [];

    // Reformat data to be populated to the select.
    stops.forEach(e => {
      data.push({ text: e.name, value: e.id }); // e.code + ":" + e.direction + ":" + e.id  });
    });

    fillSelect(select_stops, data, 0);

    // Indicate that the stop has hchanged.
    onStopChanged();

    // Reload the time schedule
    getArrivalDepartures(select_stops.value);
  });
}

/**
 * Reloads the time schedule for th given stop.
 * @param {*} stopId 
 */
function getArrivalDepartures(stopId) {
  console.log("getArrivalDepartures: " + stopId);

  $.ajax(ajaxSessings("http://52.88.188.196:8080/api/api/where/schedule-for-stop/" + stopId + ".json?key=TEST"))
  .done(function(response) {
    console.log(response.data);

    var obj = {
      date: response.data.entry.date,
      stopId: response.data.entry.stopId,
      routeId: response.data.entry.stopRouteSchedules[0].routeId,
      directions: response.data.entry.stopRouteSchedules[0].stopRouteDirectionSchedules
    };

    console.log(obj);

    printStopSchedule(obj);
  });
}

/**
 * UI - Prints stop schedule (raw, needs nicefication)
 * @param {*} data 
 */
function printStopSchedule(data) {
  var dirs = data.directions;

  var d1 = $("#dir1");
  var d2 = $("#dir2");

  BoardTime = new Date(data.date);

  var txt = dirs[0].tripHeadsign;

  var schedule = dirs[0].scheduleStopTimes;

  for(i=0; i<schedule.length; i++) {
    txt += "<br />" + new Date(schedule[i].arrivalTime).toLocaleTimeString();
  }

  d1.html(txt);

  d2.html('');

  if(dirs.length > 1) {
    txt = dirs[1].tripHeadsign;

    var schedule = dirs[0].scheduleStopTimes;

    for(i=0; i<schedule.length; i++) {
      txt += "<br />" + new Date(schedule[i].arrivalTime).toLocaleTimeString();
    }

    d2.html(txt);
  }
}

/**
 * Updates the board header information that conatins 
 * the stop name and current time.
 */
function updateBoardHeader() {
  $("#header_text").html(BusStopName + ' - ' + BoardTime);
  BoardTime.setSeconds( BoardTime.getSeconds() + 1 );
}

/**
 * Function that runs upon the DOM ready event.
 */
$(function(){
  select_routes = document.getElementById('select_routes');
  select_stops  = document.getElementById('select_stops');


  getRoutes();


  updateBoardHeader();
  setInterval(updateBoardHeader, 1000);




  // select_routes.remove();

  // for(i=0; i< SAMPLE_DATA.length; i++) {
  //   var option   = document.createElement("option");
  //   option.text  = (SAMPLE_DATA[i].name);
  //   option.value = 20 + i;
  //   select_routes.add(option);
  // }

});