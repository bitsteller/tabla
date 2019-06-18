var stations = {};

function loadStations(tries = 3) {
    // Request to load all stations
    var xmlRequest = "<REQUEST>" +
                        // Use your valid authenticationkey
                        "<LOGIN authenticationkey='dd9f2771eb9b4ddca65caae7140bb6a1' />" +
                        "<QUERY objecttype='TrainStation'>" +
                            "<FILTER/>" +
                            "<INCLUDE>Prognosticated</INCLUDE>" +
                            "<INCLUDE>AdvertisedLocationName</INCLUDE>" +
                            "<INCLUDE>LocationSignature</INCLUDE>" +
                            "<INCLUDE>PlatformLine</INCLUDE>" +
                        "</QUERY>" +
                     "</REQUEST>";

  var http_request = new XMLHttpRequest();
  http_request.open("POST", "http://api.trafikinfo.trafikverket.se/v1/data.json" + "?" + Math.random().toString(), true);
  http_request.onreadystatechange = function () {
    var done = 4, ok = 200, local = 0;
    if (http_request.readyState == done) {
      if (http_request.status == ok || http_request.status == local) {
        try {
            var data = JSON.parse(this.responseText);
            for (var i = 0; i < data.RESPONSE.RESULT[0].TrainStation.length; i++) {
                var item = data.RESPONSE.RESULT[0].TrainStation[i];
                stations[item.LocationSignature] = item.AdvertisedLocationName;
            }
        }
        catch (ex) { }
      }
      else {
        if (tries > 0) {
          loadStations(tries - 1);
        }
      }
    }
  };
  http_request.send(xmlRequest);
}


function updateTrafikverketData() {
    var sign = "Nr";

    // Request to load announcements for a station by its signature
    var xmlRequest = "<REQUEST version='1.0'>" +
                        "<LOGIN authenticationkey='dd9f2771eb9b4ddca65caae7140bb6a1' />" +
                        "<QUERY objecttype='TrainAnnouncement' " +
                            "orderby='AdvertisedTimeAtLocation' >" +
                            "<FILTER>" +
                            "<AND>" +
                                "<OR>" +
                                    "<AND>" +
                                        "<GT name='AdvertisedTimeAtLocation' " +
                                                    "value='$dateadd(-00:02:00)' />" +
                                        "<LT name='AdvertisedTimeAtLocation' " +
                                                    "value='$dateadd(6:00:00)' />" +
                                    "</AND>" +
                                    "<GT name='EstimatedTimeAtLocation' value='$dateadd(-00:02:00)' />" +
                                "</OR>" +
                                "<EQ name='LocationSignature' value='" + sign + "' />" +
                            "</AND>" +
                            "</FILTER>" +
                            // Just include wanted fields to reduce response size.
                            "<INCLUDE>ActivityType</INCLUDE>" +
                            "<INCLUDE>AdvertisedTimeAtLocation</INCLUDE>" +
                            "<INCLUDE>EstimatedTimeAtLocation</INCLUDE>" +
                            "<INCLUDE>TimeAtLocation</INCLUDE>" +
                            "<INCLUDE>TrackAtLocation</INCLUDE>" +
                            "<INCLUDE>FromLocation</INCLUDE>" +
                            "<INCLUDE>ToLocation</INCLUDE>" +
                            "<INCLUDE>AdvertisedTrainIdent</INCLUDE>" +
                            "<INCLUDE>TypeOfTraffic</INCLUDE>" +
                            "<INCLUDE>Canceled</INCLUDE>" +
                            "<INCLUDE>ProductInformation</INCLUDE>" +
                            "<INCLUDE>Deleted</INCLUDE>" +
                            "<INCLUDE>Deviation</INCLUDE>" +
                        "</QUERY>" +
                        "</REQUEST>";

  var http_request = new XMLHttpRequest();
  http_request.open("POST", "http://api.trafikinfo.trafikverket.se/v1/data.json" + "?" + Math.random().toString(), true);
  http_request.onreadystatechange = function () {
    var done = 4, ok = 200, local = 0;
    if (http_request.readyState == done) {
      if (http_request.status == ok || http_request.status == local) {
        try {
            var data = JSON.parse(this.responseText);
            var trainsData = {}
            for (var i = 0; i < data.RESPONSE.RESULT[0].TrainAnnouncement.length; i++) {
                var a = data.RESPONSE.RESULT[0].TrainAnnouncement[i];
                try {
                    parseTrainAnnouncement(trainsData, a);
                }
                catch(e) { }
            }
            app.trainsData = trainsData;
        }
        catch(e) {

        }
      }
    }
  };
  http_request.send(xmlRequest);
}

function parseTrainAnnouncement(trainsData, item) {
    if (item.Deleted) {
        return;
    }

    var today = new Date();  
    var localoffset = -(today.getTimezoneOffset()/60);
    var offset = (16+(timezoneOffset-localoffset)) * 3600 * 1000;

    var train = {};
    if (item.AdvertisedTrainIdent in trainsData) train = trainsData[item.AdvertisedTrainIdent];

    var advertisedtime = new Date(item.AdvertisedTimeAtLocation);
    advertisedtime = new Date(advertisedtime.getTime() + offset); //+ (new Date()).getTimezoneOffset()*60*1000);

    if (item.ActivityType == "Avgang") {
        train.scheduledDeparture = advertisedtime;
        train.scheduledDepartureFormatted = toFormatTime(train.scheduledDeparture);
        train.actualDeparture = advertisedtime;
        train.actualDepartureFormatted = toFormatTime(train.actualDeparture);
    }
    else if (item.ActivityType == "Ankomst"){
        train.scheduledArrival = advertisedtime;
        train.scheduledArrivalFormatted = toFormatTime(train.scheduledArrival);
        train.actualArrival = advertisedtime;
        train.actualArrivalFormatted = toFormatTime(train.actualArrival);
    }

    if (!("delayed" in train)) train.delayed = false;
    if (item.EstimatedTimeAtLocation) {
        var estimatedtime = new Date(item.EstimatedTimeAtLocation);
        estimatedtime = new Date(estimatedtime.getTime() + offset);// + (new Date()).getTimezoneOffset()*60*1000);

        if (item.ActivityType == "Avgang") {
            train.actualDeparture = estimatedtime;
            train.delayed = true;
            train.actualDepartureFormatted = toFormatTime(train.actualDeparture);
        }
        else if (item.ActivityType == "Ankomst"){
            train.actualArrival = estimatedtime;
            train.delayed = true;
            train.actualArrivalFormatted = toFormatTime(train.actualArrival);
        }
    }

    if (!train.departed) train.departed = false;
    if (!train.arrived) train.arrived = false;
    if (item.TimeAtLocation) {
        var time = new Date(item.TimeAtLocation);
        time = new Date(time.getTime() + offset) //+ (new Date()).getTimezoneOffset()*60*1000);
        if (item.ActivityType == "Avgang") {
            train.actualDeparture = time;
            train.departed = true;
            train.actualDepartureFormatted = toFormatTime(train.actualDeparture);
        }
        else if (item.ActivityType == "Ankomst"){
            train.actualArrival = time;
            train.arrived = true;
            train.actualArrivalFormatted = toFormatTime(train.actualArrival);
        }
    }

    var toList = new Array();
    for (var i = 0; i < item.ToLocation.length; i++) {
        toList.push(stations[item.ToLocation[i]]);
    }
    train.toList = toList;

    if (!("canceled" in train)) train.canceled = false;
    if (item.Canceled == true) {
        train.canceled = true;
        if (item.ActivityType == "Avgang") {
            train.actualDeparture = null;
        }
        else if (item.ActivityType == "Ankomst"){
            train.actualArrival = null;
        }
    }

    if (!train.deviation) train.deviation = "";
    if (item.Deviation) {
        if (train.deviation != "") {
            train.deviation += ", ";
        }
        if (item.ActivityType == "Avgang") {
            train.deviation += "Departure: " + item.Deviation; 
        }
        else if (item.ActivityType == "Ankomst") {
            train.deviation += "Arrival: " + item.Deviation;  
        }
    }

    train.type = item.TypeOfTraffic;
    train.id = item.AdvertisedTrainIdent;
    train.product = item.ProductInformation;

    if (!train.track) train.track = item.TrackAtLocation;

    train.statusMessages = [];
    if (train.canceled) {
        train.statusMessages.push("Canceled");
    }
    if (train.deviation != "") {
        train.statusMessages.push(train.deviation);
    }
    if (train.arrived && !train.departed) {
        train.statusMessages.push('<span><span class="livedot"></span> ' + "Arrived");
    }
    if (train.departed) {
        train.statusMessages.push("Departed");
    }
    if (train.delayed) {
        train.statusMessages.push("New time " + train.actualDepartureFormatted);
    }

    trainsData[item.AdvertisedTrainIdent] = train;
}

loadStations();

this.interval = setInterval(function() {
  if (app.now.getHours() >= 11) {
    updateTrafikverketData();
  }
}, 40*1000);
