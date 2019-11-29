
$("#GetStopScheduleButton").click(getSchedule);

function getSchedule() {

    stopID = $("#stopInput").val();

    url = "https://cors-anywhere.herokuapp.com/http://52.88.188.196:8080/api/api/where/schedule-for-stop/" + stopID + ".json?key=TEST"
   
    $.get(url, gotData);
}

function gotData(data) {
    console.log(data);

    $("#time").html(timeConverter(data.currentTime));

    $("#currentTime").show();

    $("#stopInfo").show();

    $("#stopName").html(data.data.references.stops[0].name);

    let routes = data.data.entry.stopRouteSchedules;

    for (var route of routes) {
        console.log(route);

        let routeName = document.createElement("h");
        routeName.innerHTML = route.routeId + " (" + route.stopRouteDirectionSchedules[0].tripHeadsign + ") <br>";
        document.getElementById("stopInfo").appendChild(routeName);

        for (var trip of route.stopRouteDirectionSchedules[0].scheduleStopTimes) {
            
            if (trip.arrivalTime >= data.currentTime) {

                let tripID = document.createElement("h");
                tripID.innerHTML = "TripID: " + trip.tripId + "<br>";
                let tripArrivalTime = document.createElement("h");
                tripArrivalTime.innerHTML = route.routeId + " will be here at " + timeConverter(trip.arrivalTime) + "<br><br>";
                // let tripDepartureTime = document.createElement("h"); 
                // tripDepartureTime.innerHTML = "Departure Time: " + timeConverter(trip.departureTime) + "<br><br>";
                document.getElementById("tripInfo").appendChild(tripID);
                document.getElementById("tripInfo").appendChild(tripArrivalTime);
                //document.getElementById("tripInfo").appendChild(tripDepartureTime);
            }
            
        }

        let dashedLine = document.createElement("h");
        dashedLine.innerHTML = "---------------------------------- <br><br>";
        document.getElementById("tripInfo").appendChild(dashedLine);

    }
    
    
    $("#tripInfo").show();


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