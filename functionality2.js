/*
Svetlana Kozubenko & Steven Richmond
CSCD378 - Web Application Development
Team Project - Bus Stop API
*/

var BoardTime = new Date();
var BusRoute = "Calculating...";
var BusStopName = "";

// References to the selects for the routes and stops.
var select_routes;
var select_stops;

var DefaultRoute = "STA_64";
var DefaultStop = "STA_ELMPUBWF";
var FirstTimeLoad = true;

var arrivalTimes = []; // arrival times for the countdowns
var departureTimes = [];

var setIntervalHandle = null;



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
 * Loads all STA routs from the service.
 */
function getRoutes() {

    $.get("http://52.88.188.196:8080/api/api/where/routes-for-agency/STA.json?key=TEST", 
      function(response) {
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

      if(FirstTimeLoad)
      {
          FirstTimeLoad = false;
          select_routes.value = DefaultRoute;
      }

      // grab stops for the selected routs
      getStops(select_routes.value);

      onRouteChanged();

    }, "jsonp");
  }

/**
 * Loads all the stops for the specified route.
 * @param {*} routeId 
 */
function getStops(routeId) {
    console.log("getStops: " + routeId);
  
    $.get("http://52.88.188.196:8080/api/api/where/stops-for-route/" + routeId + ".json?key=TEST",
    function(response) {
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
  
      if(FirstTimeLoad)
      {
          FirstTimeLoad = false;
          select_stops.value = DefaultStop;
      }

      // Indicate that the stop has hchanged.
      onStopChanged();
  
      // Reload the time schedule
      //getArrivalDepartures(select_stops.value);
    }, "jsonp");
  }

/**
 * Runs upon the route change.
 */
function onRouteChanged() {
    console.log("onRouteChanged: " + select_routes.value);
    BusRoute = select_routes.options[select_routes.selectedIndex].text;
    getStops(select_routes.value);
  }

/**
 * Runs upon the stop select change.
 */
function onStopChanged() {
    var face = select_stops.options[select_stops.selectedIndex].text;
    var value = select_stops.options[select_stops.selectedIndex].value;
  
    //getArrivalDepartures(value);
    getSchedule(value);

    BusStopName = face;
  }

// save initialization upon the DOM loaded event.
$(function() {
    $("#GetStopScheduleButton").click(getSchedule);

      //takes reference to 'select_routes' element and saves to select_routes
  select_routes = document.getElementById('select_routes');
  select_stops  = document.getElementById('select_stops');

  getRoutes();

  updateBoardHeader();

  setInterval(updateBoardHeader, 1000);

})

function countDonwEvent() {
    var cur = new Date();

    if (departureTimes != null) {

        for(i = 0; i < departureTimes.length; i++) {
            var span = $("#count-down-" + i); // take reference
    
            var time = new Date(departureTimes[i].time);
    
            var diff = parseInt((time.getTime() - cur.getTime()) / 1000);
    
            if(diff > 0) {
                if(i == 0) { // first one, show time left until arrival
    
                    if(diff < 120) { // two minutes
                        span.addClass('highlight');
                    } else {
                        span.removeClass('highlight');
                    }
    
                    span.html(" in " + convertSecondsToTime(diff) + "  (@" + timeConverterTrip(departureTimes[i].time) + ")");
                } else {
                    span.html(" at " + timeConverterTrip(departureTimes[i].fmtTime));
                }
            } else {
                span.html(" now...");
            }
        }
    }
}

function getSchedule(stopID = null) {

    if(stopID == null)
    {
        stopID = $("#stopInput").val();
    }

    url = "http://52.88.188.196:8080/api/api/where/schedule-for-stop/" + stopID + ".json?key=TEST"
   
    $.get(url, gotData, "jsonp");
}

/**
 * Updates the board header information that conatins 
 * the stop name and current time.
 */
function updateBoardHeader() {
    $("#header_text").html(BusRoute + ", STOP: " + BusStopName + ' - ' + timeConverter(BoardTime));
    BoardTime.setSeconds( BoardTime.getSeconds() + 1 );
  }

function gotData(data) {
    console.log(data);

    // Make sure to stop the interval coutdown mechanism
    if(setIntervalHandle != null ) {
        clearInterval(setIntervalHandle);
    }

    BoardTime = new Date(data.currentTime);

    //$("#time").html(timeConverter(data.currentTime));

    //$("#currentTime").show();

    $("#stopInfo").show();

    $("#stopName").html(data.data.references.stops[0].name);

    // Reset to allow smooth recalclation.
    arrivalTimes = [];
    departureTimes = [];

    $("#arrivals").html("<h2>Arrivals</h2>");
    $("#departures").html("<h2>Departures</h2>");

    // Reset trips information.
    $("#trips").html('');

    console.log("selected_route: " + select_routes.value);

    let routes = data.data.entry.stopRouteSchedules;

    for (var route of routes) {
        
        console.log(route);

        if (route.routeId == select_routes.value) {
            
            // let routeName = document.createElement("h");
            // routeName.innerHTML = route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>";
            // document.getElementById("stopInfo").appendChild(routeName);

            //$("#routes").append(route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>");

            //var A_count = 0;
            var D_count = 0;
            
            var A_times = [];
            var D_times = [];

            for (var trip of route.stopRouteDirectionSchedules[0].scheduleStopTimes) {
                
                if (trip.arrivalTime >= data.currentTime) {

                    let tripArrivalTime = document.createElement("h");
                    tripArrivalTime.innerHTML = route.routeId + " will be here at " + timeConverterTrip(trip.arrivalTime) + "<br><br>";

                    document.getElementById("arrivals").appendChild(tripArrivalTime);

                }

                if (trip.departureTime >= data.currentTime) {

                    let tripDepartureTime = document.createElement("h"); 
                    tripDepartureTime.innerHTML = route.routeId + " is leaving <span id='count-down-"+D_count+"'></span><br><br>";

                    document.getElementById("departures").appendChild(tripDepartureTime);

                    D_times.push({ time: trip.departureTime, fmtTime: timeConverter(trip.departureTime) });
                    D_count++;
                }
                
            }
        }

        // Update times
        arrivalTimes = A_times;
        departureTimes = D_times;

        countDonwEvent(); // update immediatelly

        // Start interval coutdown
        setIntervalHandle = setInterval(countDonwEvent, 1000); // every second
    }
    $("#tripInfo").show();
}

function convertSecondsToTime(seconds) {

    var hours   = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);
    
    return hours.toString().padStart(2, '0') + ':' + 
          minutes.toString().padStart(2, '0') + ':' + 
          seconds.toString().padStart(2, '0');
}

// this function converts millisecond time into human-readable format
// reference where I got the base code: https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();

    // if its the first 9 minutes of an hour, turns _:4 into _:04
    if (min < 10) { 
        min = "0" + min;
    }

    // var time = month + ' ' + date + ', ' + year + ' ' + hour + ':' + min;
    // return time;


    // convert to 12 hour AM/PM

    if (hour == 0) {
        var time = month + ' ' + date + ', ' + year + ' ' + (hour +=12) + ':' + min + " AM";
        return time;
    }

    else if (hour < 12) {
        var time = month + ' ' + date + ', ' + year + ' ' + hour + ':' + min + " AM";
        return time;
    }

    else if (hour == 12) {
        var time = month + ' ' + date + ', ' + year + ' ' + hour + ':' + min + " PM";
        return time;
    }

    else {
        var time = month + ' ' + date + ', ' + year + ' ' + (hour -= 12) + ':' + min + " PM";
        return time;
    }
}

function timeConverterTrip(UNIX_timestamp){
    var a = new Date(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();

    // if its the first 9 minutes of an hour, turns _:4 into _:04
    if (min < 10) { 
        min = "0" + min;
    }

    // convert to 12 hour AM/PM
    if (hour == 0) {
        var time = (hour +=12) + ':' + min + " AM";
        return time;
    } else if (hour < 12) {
        var time = hour + ':' + min + " AM";
        return time;
    } else if (hour == 12) {
        var time = hour + ':' + min + " PM";
        return time;
    } else {
        var time = (hour -= 12) + ':' + min + " PM";
        return time;
    }
}

$("#setNewColorScheme").click(setNewColors);

function setNewColors() {
    //document.getElementById("stopInfo").style.background = document.getElementById("color1").value;
    document.getElementById("tripInfo").style.background = document.getElementById("color2").value;
}

function toggleSettings()
{
    $("#settings").toggle();
}