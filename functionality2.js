var arrivalTimes = []; // arrival times for the countdowns
var setIntervalHandle = null;

// save initialization upon the DOM loaded event.
$(function() {
    $("#GetStopScheduleButton").click(getSchedule);
})

function countDonwEvent() {
    var cur = new Date();

    for(i = 0; i < arrivalTimes.length; i++) {
        var time = new Date(arrivalTimes[i].time);

        var diff = parseInt((time.getTime() - cur.getTime()) / 1000);

        if(diff > 0) {
            if(i == 0) { // first one, show time left until arrival
                $("#count-down-" + i).html(" in " + convertSecondsToTime(diff));
            } else {
                $("#count-down-" + i).html(" at " + arrivalTimes[i].fmtTime);
            }
        } else {
            $("#count-down-" + i).html(" now...");
        }
    }
}


function getSchedule() {

    stopID = $("#stopInput").val();

    url = "https://cors-anywhere.herokuapp.com/http://52.88.188.196:8080/api/api/where/schedule-for-stop/" + stopID + ".json?key=TEST"
   
    $.get(url, gotData);
}

function gotData(data) {
    console.log(data);

    // Make sure to stop the interval coutdown mechanism
    if(setIntervalHandle != null ) {
        clearInterval(setIntervalHandle);
    }

    $("#time").html(timeConverter(data.currentTime));

    $("#currentTime").show();

    $("#stopInfo").show();

    $("#stopName").html(data.data.references.stops[0].name);

    // Reset to allow smooth recalclation.
    arrivalTimes = [];

    // Reset trips information.
    $("#trips").html('');

    let routes = data.data.entry.stopRouteSchedules;

    for (var route of routes) {
        console.log(route);

        // let routeName = document.createElement("h");
        // routeName.innerHTML = route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>";
        // document.getElementById("stopInfo").appendChild(routeName);

        $("#route").html(route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>");

        var count = 0;
        var times = [];

        for (var trip of route.stopRouteDirectionSchedules[0].scheduleStopTimes) {
            
            if (trip.arrivalTime >= data.currentTime) {

                let tripID = document.createElement("h");
                tripID.innerHTML = "TripID: " + trip.tripId + "<br>";
                let tripArrivalTime = document.createElement("h");
                tripArrivalTime.innerHTML = route.routeId + " will be here <span id='count-down-"+count+"'></span><br><br>";
                // let tripDepartureTime = document.createElement("h"); 
                // tripDepartureTime.innerHTML = "Departure Time: " + timeConverter(trip.departureTime) + "<br><br>";
                document.getElementById("trips").appendChild(tripID);
                document.getElementById("trips").appendChild(tripArrivalTime);
                //document.getElementById("tripInfo").appendChild(tripDepartureTime);

                times.push({ time: trip.arrivalTime, fmtTime: timeConverter(trip.arrivalTime) });
                count++;
            }
            
        }

        // Update times
        arrivalTimes = times;

        countDonwEvent(); // update immediatelly

        // Start interval coutdown
        setIntervalHandle = setInterval(countDonwEvent, 1000); // every seconds

        let dashedLine = document.createElement("h");
        dashedLine.innerHTML = "---------------------------------- <br><br>";
        document.getElementById("trips").appendChild(dashedLine);

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

$("#setNewColorScheme").click(setNewColors);

function setNewColors() {
    document.getElementById("stopInfo").style.background = document.getElementById("color1").value;
    document.getElementById("tripInfo").style.background = document.getElementById("color2").value;
}