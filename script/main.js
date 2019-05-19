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
  if (q == undefined) {
    return new RegExp("", "gi");
  }
  var words = q.split(/\s+/g);
  words = words.map(function(s) {return s.trim()})
  words = words.filter(function(s) {return !!s});
  const hasTrailingSpace = q.endsWith(" ");
  const searchRegex = new RegExp(
    words.map(function(word, i) {
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
  catch (e) {
    return undefined;
  }
}

function copyToClip(str) {
  function listener(e) {
    e.clipboardData.setData("text/html", str);
    e.clipboardData.setData("text/plain", str);
    e.preventDefault();
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
};




function getiCalForSession(session, talks) {
  function pad(i) {
    return i < 10 ? `0${i}` : `${i}`;
  }
  function formatDateTime(date) {
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hour = pad(date.getUTCHours());
    const minute = pad(date.getUTCMinutes());
    const second = pad(date.getUTCSeconds());
    return `${year}${month}${day}T${hour}${minute}${second}Z`;
  }

  var desc = "";
  if (session.chair != undefined) {
      desc += "Chair: " + String(session.chair) + "\n\n";
  }
  desc += String(session.description) + "\n\n";
  if (talks != undefined) {
      for (var i = 0; i < talks.length; i++) {
      desc += toFormatTime(talks[i].startTime) + ": " + String(talks[i].title) + " (" + String(talks[i].presenter) + ")\n\n"
    }
  }
  desc = desc.replace(/\n/g, "\\n");

  var ical = "\
BEGIN:VCALENDAR\n\
VERSION:2.0\n\
PRODID:https://www.railnorrkoping2019.org\n\
METHOD:PUBLISH\n\
BEGIN:VEVENT\n\
UID:" + String(session.number) + ".session@railnorrkoping2019.org\n\
LOCATION;ENCODING=QUOTED-PRINTABLE:" + String(session.room) + ", Campus Norrköping\n\
SUMMARY;ENCODING=QUOTED-PRINTABLE:" + String(session.number) + ": " + String(session.title) + "\n\
DESCRIPTION;ENCODING=QUOTED-PRINTABLE:" + desc + "\n\
CLASS:PUBLIC\n\
DTSTART:" + formatDateTime(session.startTime) + "\n\
DTEND:" + formatDateTime(session.endTime) + "\n\
DTSTAMP:" + formatDateTime(new Date()) + "\n\
URL;VALUE=URI:" + "bitsteller.github.io/tabla/program.html#/session/" + String(session.number) + "\n\
END:VEVENT\n\
END:VCALENDAR"

  return ical
}

Vue.filter('formatTime', function(d) {
      return toFormatTime(d);
    });

Vue.filter('formatDay', function(d) {
      return weekdays[d.getDay()]
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
        required: false
      },
      now: {
        type: Date,
        required: true
      }
    },
    computed: {
      ical: function() {
        var str = getiCalForSession(this.session, this.talks);
        return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(str);
      },
      status: function() {
        var status = "upcoming";

        var minLeftToStart = minutesBetween(this.now, this.session.startTime);
        var minLeftToEnd = minutesBetween(this.now, this.session.endTime)

        if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
          status = "ongoing";
        }
        else if (minLeftToEnd < 0) { //after
          status = "passed";
        }
        return status;
      }
    },
    methods: {
      copyNotes: function() {
        try {
          var el = document.getElementById('notes-for-session-' + this.session.number);
          var dt = new clipboard.DT();
          dt.setData("text/plain", el.textContent);
          dt.setData("text/html", el.innerHTML);
          clipboard.write(dt);
          alert("✅ Text for use in your note taking app has been copied to clipboard.");
        }
        catch (e) {
          alert("Could not copy to clipboard");
        }

      }
    }
})

Vue.component('talk', {
    template: '#talk-template',
    data: function() {
      return {
        showDetail: false
      }
    },
    props: {
      talk: {
        type: Object,
        required: true 
      },
      now: {
        type: Date,
        required: true
      }
    },
    computed: {
      status: function() {
        var status = "upcoming";

        var minLeftToStart = minutesBetween(this.now, this.talk.startTime);
        var minLeftToEnd = minutesBetween(this.now, this.talk.endTime)

        if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
          status = "ongoing";
        }
        else if (minLeftToEnd < 0) { //after
          status = "passed";
        }
        return status;
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
    debug: true,
    filterDay: "Monday", //TODO: next day
    sessionsData: {},
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
    sessions: function() {
      var keys = Object.keys(this.sessionsData);
      var sess = {};
      for (var i = 0; i < keys.length; i++) {
        var session = this.sessionsData[keys[i]];
        session.startTimeFormatted = toFormatTime(session.startTime);
        session.status = "upcoming";
        session.statusText = "";

        var minLeftToStart = minutesBetween(this.now, session.startTime);
        var minLeftToEnd = minutesBetween(this.now, session.endTime)

        if (minLeftToStart <= 30 && minLeftToStart > 0) { //before
          session.statusText = " － starts in " + minLeftToStart + " min";
        }
        else if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
          session.status = "ongoing";
          session.statusText = " － 🔴 " + minLeftToEnd + " min left";
        }
        else if (minLeftToEnd < 0) { //after
          session.status = "passed";
          session.statusText = " － passed";
        }
        sess[keys[i]] = session;
      }
      return sess;
    },
    filteredSessions: function() {
      var sessions = Object.values(this.sessions);

      var sessions = sessions.filter(function(session) {
          if (app.search == undefined) {
            return true;
          }

          var sessionIDMatch = searchRegex(app.search).test(session.number);
          var roomMatch = session.room != undefined && session.room.toLowerCase().includes(app.search.toLowerCase());
          var titleMatch = searchRegex(app.search).test(session.title);
          var descriptionMatch = searchRegex(app.search).test(session.description);
          var talkMatch = (session.number in app.filteredTalks) && (app.filteredTalks[session.number].length > 0);

          return sessionIDMatch || roomMatch || titleMatch || talkMatch || descriptionMatch;
      });

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
            timeslot = {timeslotTitle: "", days: null, day: "", sessions: [], status: "upcoming"};
          }
          timeslot.title = toFormatTime(sessions[i].startTime) + " - " + toFormatTime(sessions[i].endTime);
          timeslot.status = sessions[i].status;
          timeslot.statusText = sessions[i].statusText;
          timeslot.title += timeslot.statusText;

          if (i == 0 || sessions[i].day != sessions[i-1].day) {
          timeslot.days = days;
          }
          timeslot.day =  weekdays[sessions[i].startTime.getDay()].toString();
        }
        timeslot.sessions.push(sessions[i]);
      }
      timeslots.push(timeslot);

      timeslots = timeslots.filter(function(ts) { 
        return app.filterDay == "" || ts.day == app.filterDay 
      });

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
        filtered[sessionIDs[s]] = bysession[sessionIDs[s]].filter(function(talk) {
          if (app.search == undefined) {
            return true;
          }
          var numberMatch = talk.number.toLowerCase().includes(app.search.toLowerCase());
          var titleMatch = searchRegex(app.search).test(talk.title);
          var abstractMatch = searchRegex(app.search).test(talk.abstract);
          var authorMatch = searchRegex(app.search).test(talk.authors);

          return numberMatch || titleMatch || abstractMatch || authorMatch;
        })
      }

      return filtered
    }
  },
  watch : {
    currentRoute: function (newRoute, oldRoute) {
      if (this.search == "") {
        if (newRoute.match(/^\#\/([A-z0-9 ]+)$/g)) {
          var day = /\/([A-z0-9 ]+)/.exec(newRoute)[1];
          this.filterDay = day;
        }
        else if (newRoute.match(/^\#?$/g)) {
          this.filterDay = 'Monday'; //TODO: next day
        }
      }
    },
    search : function (newSearch, oldSearch) {
      if (this.newSearch != "") {
        this.filterDay = "";
      }
    },
    sessionDetail: function(newSessionDetail, oldSessionDetail) {
      if (newSessionDetail != null) {
        document.body.classList.add("noscroll");
      }
      else {
        document.body.classList.remove("noscroll");
      }
    }
  },
  filters: {
    count: function (obj) {
      var res = Object.keys(obj).length
      return res
    }
  },
  methods: {
    addMinutesToNow: function (min) {
      this.now.setMinutes(this.now.getMinutes() + min );
      this.now = new Date(this.now.getTime());
    }
  }
})

window.addEventListener('popstate', function() {
  app.currentRoute = window.location.hash;
})

this.interval = setInterval(function() {
  if (!app.debug) {
    app.now = new Date();
  }
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
          catch (e) {

          }
        }
        for (var i = 0; i < program.talks.length; i++) {
          try {
            var startTime = program.talks[i].startTime;
            program.talks[i].startTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4]);
            program.talks[i].endTime = new Date(startTime[0], startTime[1], startTime[2], startTime[3], startTime[4] + program.talks[i].duration);       
          }
          catch (e) {

          }
        }
        app.sessionsData = program.sessions;
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
