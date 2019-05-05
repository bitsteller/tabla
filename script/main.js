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

function formatTime(date) {
  return date.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute:'2-digit',
      hour12: false
    });
}



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
        window.history.pushState(
          null,
          this.href,
          this.href
        )
      }
    }
})

Vue.component('sessiondetail', {
    template: '#sessiondetail-template',
    props: {
      session: {
        type: Object,
        required: true 
      }
    },
})


const app = new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.pathname,
    now: new Date(),
    includePast: false,
    search: "",
    sessions: {},
    rooms: {},
    talks: {},
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
    filteredSessions: function() {
      var sessions = Object.values(this.sessions);

      var sessions = sessions.filter(session => {
          var sessionIDMatch = searchRegex(this.search).test(session.number);
          var roomMatch = session.room.toLowerCase().includes(this.search.toLowerCase());
          var titleMatch = searchRegex(this.search).test(session.title);
          return sessionIDMatch || roomMatch || titleMatch;
      });

      for (var i = 0; i < sessions.length; i++) {
        sessions[i].startTimeFormatted = formatTime(sessions[i].startTime);
      }

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
  },
  filters: {
    count: function (obj) {
          var res = Object.keys(obj).length
          return res
        }
  }
})

window.addEventListener('popstate', () => {
  app.currentRoute = window.location.pathname
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
        app.sessions = program.sessions;
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
