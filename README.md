# STABusStopAPI

// to get agency name:
http://52.88.188.196:8080/api/api/where/agencies-with-coverage.json?key=TEST
// Spokane Transit Authority agency name: 'STA'

// to get routes for STA:
http://52.88.188.196:8080/api/api/where/routes-for-agency/STA.json?key=TEST
// EWU route is: 'STA_66'

// to get stops for STA_66:
http://52.88.188.196:8080/api/api/where/stops-for-route/STA_66.json?key=TEST
// list of all the stops for this route

// to get detailed information for each stop:
http://52.88.188.196:8080/api/api/where/stop/[stop_id].json?key=TEST

