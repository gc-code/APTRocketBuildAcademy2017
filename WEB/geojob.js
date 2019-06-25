// Author: George Christian

var map = null;
var ourLocations = new Array();
var radioButtonState = "LONG_NAMES";

function GeojobMarker(googleMarker, labelShort, labelLong) {
	this.googleMarker = googleMarker;
	this.labelShort = labelShort;
	this.labelLong = labelLong;
	
	this.setLabel();
}

GeojobMarker.prototype.setLabel = function() {
	if (radioButtonState == "LONG_NAMES") {
		this.googleMarker.set('label', this.labelLong);
	} else {
		this.googleMarker.set('label', this.labelShort);
	}
}

var markers = new Array();

// LOGIN
function login() {
	var loginData = {
		"username": "SB",
		"password": "",
	};
	
	var baseURL = "http://localhost:9293";
	var appName = "LOCAL_GEOJOB";
	var url = baseURL + "/" + appName + "/Login";
	
	sessionStorage.sbxaBaseURL = baseURL;
	sessionStorage.sbxaAppName = appName;
	
	$.support.cors = true;
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(loginData),
		dataType: "json",
		success: loginSuccessCallback,
		error: errorCallback
	});
}

function loginSuccessCallback(data, textStatus, jqXHR) {
	if (data.errorCode != "0") {
		alert("Login attempt failed, error " + data.errorCode + " " + data.errorDesc);
	} else {
		sessionStorage.sbxaSessionId = data.sessionId;
		console.log("Session ID: " + sessionStorage.sbxaSessionId);
		
		// Continue loading the page
		selectJobs();
		selectOurLocations();
	}
}

// SELECTION
function selectJobs() {
	// First select all jobs
	var url = sessionStorage.sbxaBaseURL + "/Select/JOBS.SEL"
	
	$.support.cors = true;
	$.ajax({
		type: "GET",
		url: url,
		headers:
		{
			"Session-Id": sessionStorage.sbxaSessionId
		},
		success: selectSuccessCallback,
		error: errorCallback
	});
}

function selectSuccessCallback(data, textStatus, jqXHR) {
	if (data.errors != "") {
		alert("Errors returned from call " + data.errors);
	} else {
		console.log("Select returned " + data.numItems + " items");
		for (var i = 0; i < data.numItems; i++) {
			readJob(data.resultSet[i].KEY);
		}
	}
}

function selectOurLocations() {
	var url = sessionStorage.sbxaBaseURL + "/Select/OUR_LOCATIONS.SEL";
	
	$.support.cors = true;
	$.ajax({
		type: "GET",
		url: url,
		headers:
		{
			"Session-Id": sessionStorage.sbxaSessionId
		},
		success: ourLocSuccessCallback,
		error: errorCallback
	});
}

function ourLocSuccessCallback(data, textStatus, jqXHR) {
	if (data.errors != "") {
		alert("Errors returned from call " + data.errors);
	} else {
		console.log("Select returned " + data.numItems + " items");
		for (var i = 0; i < data.numItems; i++) {
			readLocation(data.resultSet[i].KEY, null);
		}
	}
}

// READ JOBS
function readJob(key) {
	var url = sessionStorage.sbxaBaseURL + "/Read";
	var procData = {
		"sessionId": sessionStorage.sbxaSessionId,
		"file": "JOBS",
		"id": key,
		"serviceName": "JOB_SERVICE"
	};
	
	$.support.cors = true;
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(procData),
		datatype: "json",
		success: readJobSuccessCallback,
		error: errorCallback
	});
}

function readJobSuccessCallback(data, textStatus, jqXHR) {
	if (data.errors != "") {
		alert("Errors returned from call " + data.errors);
	} else {
		readLocation(data.LOCATION, data);
	}
}

// READ LOCATION
function readLocation(key, job) {
	var url = sessionStorage.sbxaBaseURL + "/READ";
	var procData = {
		"sessionId": sessionStorage.sbxaSessionId,
		"file": "LOCATIONS",
		"id": key,
		"serviceName": "LOCS_SERVICE"
	};
	
	$.support.cors = true;
	$.ajax({
		type: "POST",
		url: url,
		contentType: 'application/json',
		data: JSON.stringify(procData),
		datatype: "json",
		success: function(data, textStatus, jqXHR) {
			if (job == null) {
				dropHomePin(data.LATITUDE, data.LONGITUDE);
				ourLocations.push(data);
				
				var box = document.getElementById("locbox");
				var el = document.createElement("option");
				el.appendChild(document.createTextNode(data.DESCRIPTION));
				el.value = data.DESCRIPTION;
				box.appendChild(el);
			} else {
				dropPin(data.LATITUDE, data.LONGITUDE, job);
			}
		},
		error: errorCallback
	});
}

// GOOGLE MAPS
function dropPin(latitude, longitude, job) {
	// Draw the line
	var lineCoords = [new google.maps.LatLng(latitude, longitude), 
					  new google.maps.LatLng(job.LINE_TO[0], job.LINE_TO[1])];
	var line = new google.maps.Polyline({
		path: lineCoords,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	line.setMap(map);
	
	// Drop the labelled pin
	var latLng = new google.maps.LatLng(latitude, longitude);
	var labelLong = "(" + job.PRIORITY + ") " + job.DESCRIPTION;
	var labelShort = job.PRIORITY;
	var marker = new google.maps.Marker({
		position: latLng,
		title: labelShort,
		map: map
	});
	
	google.maps.event.addListener(marker, 'mouseover', function() {
		if (radioButtonState == "SHORT_NAMES") {
			marker.set('label', labelLong);
		}
	});
	google.maps.event.addListener(marker, 'mouseout', function() {
		if (radioButtonState == "SHORT_NAMES") {
			marker.set('label', labelShort);
		}
	});
	
	var geoMarker = new GeojobMarker(marker, labelShort, labelLong);
	markers.push(geoMarker);
}

function dropHomePin(latitude, longitude) {
	label = 'HOME';
	var latLng = new google.maps.LatLng(latitude, longitude);
	var market = new google.maps.Marker({
		position: latLng,
		title: label,
		label: label,
		map: map
	});
}

// GENERAL
function errorCallback(request, textStatus, errorThrown) {
	var message = "";
	if (request.status == "404")
		message = "Data not available";
	else if (Error == "")
		message = "Unable to retrieve data";
	else
		message = "Error getting data: " + errorThrown + " (" + request.status + ")";
	alert("Call failed " + message);
}

function boxChangeCallback() {
	if (this.selectedIndex != 0) {
		var latLng = new google.maps.LatLng(ourLocations[this.selectedIndex - 1].LATITUDE,
			ourLocations[this.selectedIndex - 1].LONGITUDE);
		map.setCenter(latLng);
	}
}

function initMap() {
	// Load the map
	var latLng = new google.maps.LatLng(51.522217, -0.106182);
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 10,
		center: latLng
	});
	// Start U2 data retrieval
	login();
	
	// Register label length radio button listener
	var rad = document.labelForm.labelLength;
	for (var i = 0; i < rad.length; i++) {
		rad[i].onclick = function() {
			if (this.value == "long") {
				radioButtonState = "LONG_NAMES";
			} else {
				radioButtonState = "SHORT_NAMES";
			}
			for (var i = 0; i < markers.length; i++) {
				markers[i].setLabel();
			}
		};
	}
	
	// Register event listener
	var box = document.getElementById("locbox");
	box.addEventListener("change", boxChangeCallback);
}