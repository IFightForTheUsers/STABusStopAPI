var BoardTime = new Date();
var BusStopName = "";

var select_stops;

var DefaultStop = "STA_ELMPUBWF";
var FirstTimeLoad = true;

var arrivalTimes = [];
var departureTimes = [];
var setIntervalHandle = null;

function getSchedule() {

    if(FirstTimeLoad)
    {
        FirstTimeLoad = false;
        select_stops = DefaultStop;
    }
    else {
        select_stops = $("#stopInput").val();
    }

    url = "https://cors-anywhere.herokuapp.com/http://52.88.188.196:8080/api/api/where/schedule-for-stop/" + select_stops + ".json?key=TEST"
   
    $.get(url, gotData);
}

function gotData(data) {
    
    console.log(data);

    // Make sure to stop the interval coutdown mechanism
    if(setIntervalHandle != null ) {
        clearInterval(setIntervalHandle);
    }

    BoardTime = new Date(data.currentTime);


    // $("#time").html(timeConverter(data.currentTime));

    // $("#currentTime").show();

    $("#stopInfo").show();

    $("#stopName").html(data.data.references.stops[0].name);

    // Reset to allow smooth recalclation.
    arrivalTimes = [];
    departureTimes = [];

    // Reset routes information.
    $("#routes").html('');

    let routes = data.data.entry.stopRouteSchedules;

    for (var route of routes) {
        console.log(route);

        // let routeName = document.createElement("h");
        // routeName.innerHTML = route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>";
        // document.getElementById("stopInfo").appendChild(routeName);

        $("#routes").append(route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>");

        //var A_count = 0;
        var D_count = 0;
        
        var A_times = [];
        var D_times = [];

        for (var trip of route.stopRouteDirectionSchedules[0].scheduleStopTimes) {
            
            if (trip.arrivalTime >= data.currentTime) {

                let tripArrivalTime = document.createElement("h");
                tripArrivalTime.innerHTML = route.routeId + " will be here at " + timeConverterTrip(trip.arrivalTime) + "<br><br>";

                document.getElementById("arrivals").appendChild(tripArrivalTime);

                // A_times.push({ time: trip.arrivalTime, fmtTime: timeConverterTrip(trip.arrivalTime) });
                // A_count++;
            }

            if (trip.departureTime >= data.currentTime) {

                let tripDepartureTime = document.createElement("h"); 
                tripDepartureTime.innerHTML = route.routeId + " is leaving <span id='count-down-"+D_count+"'></span><br><br>";
                //"Departure Time: " + timeConverter(trip.departureTime) + "<br><br>";

                document.getElementById("departures").appendChild(tripDepartureTime);

                D_times.push({ time: trip.departureTime, fmtTime: timeConverter(trip.departureTime) });
                D_count++;
            }
            
        }

        // Update times
        arrivalTimes = A_times;
        departureTimes = D_times;

        countDownEvent(); // update immediatelly

        // Start interval coutdown
        setIntervalHandle = setInterval(countDownEvent, 1000); // every second

        updateBoardHeader();

        setInterval(updateBoardHeader, 6000);

    }
    
    
    $("#tripInfo").show();

}

function countDownEvent() {
    var cur = new Date();

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
                span.html(" at " + departureTimes[i].fmtTime);
            }
        } else {
            span.html(" now...");
        }
    }
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

function updateBoardHeader() {
    $("#header_text").html(timeConverter(BoardTime));
    BoardTime.setSeconds( BoardTime.getSeconds() + 1 );
  }

$("#GetScheduleButton").click(function() {
    getSchedule();
});


function toggleSettings()
{
    $("#settings").toggle();
}

function start() {

    getSchedule();
}

$(document).ready(start)

