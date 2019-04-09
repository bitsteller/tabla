var weekdays = new Array(7);
        weekdays[0] = "Sunday";
        weekdays[1] = "Monday";
        weekdays[2] = "Tuesday";
        weekdays[3] = "Wednesday";
        weekdays[4] = "Thursday";
        weekdays[5] = "Friday";
        weekdays[6] = "Saturday";

Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );


function searchRegex(q) {
  function escapeRegExp(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  }
  const words = q
    .split(/\s+/g)
    .map(s => s.trim())
    .filter(s => !!s);
  const hasTrailingSpace = q.endsWith(" ");
  const searchRegex = new RegExp(
    words
      .map((word, i) => {
        if (i + 1 === words.length && !hasTrailingSpace) {
          // The last word - ok with the word being "startswith"-like
          return `(?=.*\\b${escapeRegExp(word)})`;
        } else {
          // Not the last word - expect the whole word exactly
          return `(?=.*\\b${escapeRegExp(word)}\\b)`;
        }
      })
      .join("") + ".+",
    "gi"
  );
  return searchRegex;
}

function formatTime(date) {
	return date.toLocaleTimeString(navigator.language, {
   		hour: '2-digit',
    	minute:'2-digit',
    	hour12: false
  	});
}

var data = {
  	search: '',
  	showSessionDetail: '',
    sessions : {
    	"S1": {
    		sessionID: "S1",
    		startTime: new Date(),
    		endTime: new Date(),
    		title: "Innovations in model trains",
    		locationID: "K2"
    	},
     	"S2": {
    		sessionID: "S2",
    		startTime: new Date(2019,5,2,9,40),
    		endTime: new Date(2019,5,2,10,10),
    		title: "Innovations in model trains II",
    		locationID: "K4"
    	},
      	"S3": {
    		sessionID: "S3",
    		startTime: new Date(),
    		endTime: new Date(),
    		title: "Innovations in model trains III",
    		locationID: "K3"
    	},
    	"S4": {
    		sessionID: "S4",
    		startTime: new Date(),
    		endTime: new Date(),
    		title: "Cool new models",
    		locationID: "K4"
    	},
    	"S5": {
    		sessionID: "S5",
    		startTime: new Date(2019,5,2,9,40),
    		endTime: new Date(2019,5,2,10,10),
    		title: "Cool new models II",
    		locationID: "K3"
    	},
    	"S6": {
    		sessionID: "S6",
    		startTime: new Date(2019,5,2,10,15),
    		endTime: new Date(2019,5,2,11,10),
    		title: "Cool new models III",
    		locationID: "K3"
    	},
    	"S7": {
    		sessionID: "S7",
    		startTime: new Date(2019,5,3,10,15),
    		endTime: new Date(2019,5,3,11,10),
    		title: "Cool new models IV",
    		locationID: "K3"
    	},
    	"L1": {
    		sessionID: "L1",
    		startTime: new Date(2019,5,3,12,0),
    		endTime: new Date(2019,5,3,13,10),
    		title: "Lunch break 🍽",
    		locationID: "Louis de Geer"
    	}
	}
};

Vue.component('modal', {
  template: '#modal-template'
})

var app = new Vue({
  el: '#app',
  data: data,
  computed: {
  	filteredSessions: function() {
      var sessions = Object.filter(this.sessions, session => {
	        var sessionIDMatch = searchRegex(this.search).test(session.sessionID);
	      	var roomMatch = session.locationID.toLowerCase().includes(this.search.toLowerCase());
	        var titleMatch = searchRegex(this.search).test(session.title);
	        return sessionIDMatch || roomMatch || titleMatch;
    	});
      sessions = Object.values(sessions);

   		for (var i = 0; i < sessions.length; i++) {
			sessions[i].startTimeFormatted = formatTime(sessions[i].startTime);
		}

      return sessions;
  	},
    filteredSessionsByTimeslot: function() {
      var sessions = Object.filter(this.sessions, session => {
	        var sessionIDMatch = searchRegex(this.search).test(session.sessionID);
	      	var roomMatch = session.locationID.toLowerCase().includes(this.search.toLowerCase());
	        var titleMatch = searchRegex(this.search).test(session.title);
	        return sessionIDMatch || roomMatch || titleMatch;
    	});

        sessions = Object.values(sessions);
  		sessions = sessions.sort(function(a,b) {return a.startTime - b.startTime});
  		var days = new Array();

  		for (var i = 0; i < sessions.length; i++) {
  			sessions[i].day = weekdays[sessions[i].startTime.getDay()]
  			if (i == 0 || sessions[i].day != sessions[i-1].day) {
  				days.push(sessions[i].day);
  			}
  		}

  		var timeslots = new Array();
  		var timeslot = {title: "", days: null, day: "", sessions: []};


  		for (var i = 0; i < sessions.length; i++) {
  			if (i == 0 || (sessions[i].startTime.getTime() != sessions[i-1].startTime.getTime()) || (sessions[i].endTime.getTime() != sessions[i-1].endTime.getTime())) {
  				if (i > 0) {
  					timeslots.push(timeslot);
  					timeslot = {timeslotTitle: "", days: null, day: "", sessions: []};
  				}
  				timeslot.title = weekdays[sessions[i].startTime.getDay()].toString() + ", " + formatTime(sessions[i].startTime) + " - " + formatTime(sessions[i].endTime);
  			  	if (i == 0 || sessions[i].day != sessions[i-1].day) {
					timeslot.days = days;
					timeslot.day =  weekdays[sessions[i].startTime.getDay()].toString();
  				}
  			}
  			timeslot.sessions.push(sessions[i]);
  		}
   		timeslots.push(timeslot);

  		return timeslots;
  	},
  	sessionDetail: function() {
       sessions = Object.values(this.sessions);
  		for (var i = 0; i < sessions.length; i++) {
  			if (sessions[i].sessionID === this.showSessionDetail) {
  				return sessions[i];
  			}
  		}
  	}
  },
  filters: {
  	count: function (obj) {
  				var res = Object.keys(obj).length
  				return res
  			}
  }
})


