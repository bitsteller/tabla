const weekdays = new Array(7);
        weekdays[0] = "Sunday";
        weekdays[1] = "Monday";
        weekdays[2] = "Tuesday";
        weekdays[3] = "Wednesday";
        weekdays[4] = "Thursday";
        weekdays[5] = "Friday";
        weekdays[6] = "Saturday";

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

function minutesBetween(a, b) {
  var diff = b-a;
  var minutes = Math.floor((diff/1000)/60);
  return minutes;
}

function toFormatTime(date) {
  try {
    return date.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute:'2-digit',
      hour12: false
    });
  }
  catch {
    return undefined;
  }

}

Vue.filter('formatTime', function(d) {
      return toFormatTime(d);
    });

Vue.component('vlink', {
    template: '#link-template',
    props: {
      href: {
        type:String,
        required: true 
      }
    },
    computed: {
      isActive () {
        return this.href === this.$root.currentRoute
      }
    },
    methods: {
      go (event) {
        event.preventDefault()
        this.$root.currentRoute = this.href
        window.location.hash = this.href
      }
    }
})

Vue.component('sessiondetail', {
    template: '#sessiondetail-template',
    props: {
      session: {
        type: Object,
        required: true 
      },
      talks: {
        type: Array,
        required: true
      }
    },
})


const app = new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.hash,
    now: new Date(),
    includePast: false,
    search: "",
    sessions: {},
    rooms: {},
    talks: [],
    authors: {},
    sessionschairs: {}
  },
  computed: {
    sessionDetail () {
      if (this.currentRoute.match(/\/session\/*/)) {
        var number = /\/session\/([A-z0-9 ]*)/.exec(this.currentRoute)[1];
        return this.sessions[number];
      }
      else {
        return null;
      }
    },
    filterDay () {
      if (this.currentRoute.match(/\/([A-z0-9 ]+)/)) {
        var day = /\/([A-z0-9 ]+)/.exec(this.currentRoute)[1];
        return day;
      }
      else {
        return "";
      }
    },
    filteredSessions: function() {
      var sessions = Object.values(this.sessions);

      var sessions = sessions.filter(session => {
          var sessionIDMatch = searchRegex(this.search).test(session.number);
          var roomMatch = session.room.toLowerCase().includes(this.search.toLowerCase());
          var titleMatch = searchRegex(this.search).test(session.title);
          var descriptionMatch = searchRegex(this.search).test(session.description);
          var talkMatch = (session.number in this.filteredTalks) && (this.filteredTalks[session.number].length > 0);

          return sessionIDMatch || roomMatch || titleMatch || talkMatch || descriptionMatch;
      });

      for (var i = 0; i < sessions.length; i++) {
        sessions[i].startTimeFormatted = toFormatTime(sessions[i].startTime);
      }

      sessions.sort(function(a,b) {return a.startTime - b.startTime});

      return sessions;
    },
    filteredSessionsByTimeslot: function() {
      var sessions = this.filteredSessions;
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
          timeslot.title = toFormatTime(sessions[i].startTime) + " - " + toFormatTime(sessions[i].endTime); //weekdays[sessions[i].startTime.getDay()].toString() + ", " +
          var minLeftToStart = minutesBetween(this.now, sessions[i].startTime);
          var minLeftToEnd = minutesBetween(this.now, sessions[i].endTime)

          if (minLeftToStart <= 30 && minLeftToStart > 0) { //before
            timeslot.title += " － 🔵 in " + minLeftToStart + " min";
          }
          else if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
            timeslot.title += " － 🔴 " + minLeftToEnd + " min left";
          }
          else if (minLeftToEnd < 0) { //after
            timeslot.title += " － passed";
          }

          if (i == 0 || sessions[i].day != sessions[i-1].day) {
          timeslot.days = days;
          }
          timeslot.day =  weekdays[sessions[i].startTime.getDay()].toString();
        }
        timeslot.sessions.push(sessions[i]);
      }
      timeslots.push(timeslot);

      timeslots = timeslots.filter(ts => { return this.filterDay == "" || ts.day == this.filterDay });

      return timeslots;
    },
    talksBySession: function() {
      var talks = this.talks;
      var bysession = talks.reduce(function(rv, x) {
        (rv[x["session"]] = rv[x["session"]] || []).push(x);
        return rv;
      }, {});

      //todo sort by time

      return bysession;
    },
    filteredTalks: function() {
      var bysession = this.talksBySession;
      var sessionIDs = Object.keys(bysession);
      var filtered = {};

      for (var s = 0; s < sessionIDs.length; s++) {
        filtered[sessionIDs[s]] = bysession[sessionIDs[s]].filter(talk => {
          var numberMatch = talk.number.toLowerCase().includes(this.search.toLowerCase());
          var titleMatch = searchRegex(this.search).test(talk.title);
          var abstractMatch = searchRegex(this.search).test(talk.abstract);
          var authorMatch = searchRegex(this.search).test(talk.authors);

          return numberMatch || titleMatch || abstractMatch || authorMatch;
        })
      }

      return filtered
    }
  },
  filters: {
    count: function (obj) {
      var res = Object.keys(obj).length
      return res
    }
  }
})

window.addEventListener('popstate', () => {
  app.currentRoute = window.location.hash;
})

this.interval = setInterval(() => {
  app.now = new Date();
}, 30*1000)



function loadProgram(url, tries = 5) {
  var http_request = new XMLHttpRequest();
  http_request.open("GET", url, true);
  http_request.onreadystatechange = function () {
    var done = 4, ok = 200, local = 0;
    if (http_request.readyState == done) {
      if (http_request.status == ok || http_request.status == local) {
        var program = JSON.parse(this.responseText);
        var sessionNumbers = Object.keys(program.sessions);
        for (var i = 0; i < sessionNumbers.length; i++) {
          try {
            var startTime = program.sessions[sessionNumbers[i]].startTime;
            program.sessions[sessionNumbers[i]].startTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4]);
            program.sessions[sessionNumbers[i]].endTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4] + program.sessions[sessionNumbers[i]].duration);       
          }
          catch {

          }
        }
        for (var i = 0; i < program.talks.length; i++) {
          try {
            var startTime = program.talks[i].startTime;
            program.talks[i].startTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4]);
            program.talks[i].endTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4] + program.talks[i].duration);       
          }
          catch {

          }
        }
        app.sessions = program.sessions;
        app.talks = program.talks;
        app.rooms = program.rooms;
      }
      else {
        if (tries > 0) {
          loadProgram(url, tries - 1);
        }
      }
    }
  };
  http_request.send(null);
}

loadProgram("./data/program.json");
