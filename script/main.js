const timezoneOffset = 2; //Offset from UTC to display times, +2=CEST 
const url = "http://railnorrkoping2019.org/program/program.html";
const conferenceName = "RailNorrköping";
const conferenceUrl = "https://www.railnorrkoping2019.org"


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
    var str = date.getHours().toString() + ":";
    if (date.getMinutes() > 9) {
      str += date.getMinutes().toString();
    }
    else {
      str += "0" + date.getMinutes().toString();
    }
    return str;
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




function getiCalForSession(session, talks, url) {
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
      desc += toFormatTime(talks[i].startTime) + ": " + String(talks[i].title) + " (" + String(talks[i].presenter[0].name) + ")\n\n"
    }
  }
  desc = desc.replace(/\n/g, "\\n");

  var ical = "\
BEGIN:VCALENDAR\n\
VERSION:2.0\n\
PRODID:" + url + "\n\
METHOD:PUBLISH\n\
BEGIN:VEVENT\n\
UID:" + String(session.number) + ".session@" + url + "\n\
LOCATION;ENCODING=QUOTED-PRINTABLE:" + String(session.room) + ", Campus Norrköping\n\
SUMMARY;ENCODING=QUOTED-PRINTABLE:" + String(session.number) + ": " + String(session.title) + "\n\
DESCRIPTION;ENCODING=QUOTED-PRINTABLE:" + desc + "\n\
CLASS:PUBLIC\n\
DTSTART:" + formatDateTime(session.startTime) + "\n\
DTEND:" + formatDateTime(session.endTime) + "\n\
DTSTAMP:" + formatDateTime(new Date()) + "\n\
URL;VALUE=URI:" + url + "#/session/" + String(session.number) + "\n\
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

Vue.component('announcement', {
    template: '#announcement-template',
    props: {
      announcement: {
        type:Object,
        required: true
      }
    },
    data: function() {
      return {
        showDetail: false
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
        required: false,
        default: function() {return new Array();}
      },
      now: {
        type: Date,
        required: true
      },
      announcements: {
        type: Array,
        required: false,
        default: function() {return new Array();}
      },
      canceledTalks: {
        type: Array,
        required: false,
        default: function() {return new Array();}
      }
    },
    computed: {
      ical: function() {
        var str = getiCalForSession(this.session, this.talks, url);
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
      },
      statusText: function() {
        var minLeftToStart = minutesBetween(this.now, this.session.startTime);
        var minLeftToEnd = minutesBetween(this.now, this.session.endTime)
        var statusText = "";

        if (minLeftToStart <= 30 && minLeftToStart > 0) { //before
          statusText = "<span>starts in " + minLeftToStart + " min</span>";
        }
        else if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
          statusText = '<span><span class="livedot"></span> ' + minLeftToEnd + " min left</span>";
        }
        return statusText
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
      },
      canceled: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    computed: {
      status: function() {
        var status = "upcoming";

        var minLeftToStart = minutesBetween(this.now, this.talk.startTime);
        var minLeftToEnd = minutesBetween(this.now, this.talk.endTime);

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
    currentRoute: "",
    now: new Date(),
    includePast: false,
    search: "",
    debug: false,
    showSettings: false,
    filterDay: "",
    sessionsData: {},
    rooms: {},
    talks: [],
    authors: {},
    sessionschairs: {},
    announcementsData: [],
    canceledTalks: [],
    programVersion: 0,
    conferenceName: conferenceName,
    conferenceUrl: conferenceUrl,
    phase: 0
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

        //status
        session.status = "upcoming";
        session.statusText = "";

        var minLeftToStart = minutesBetween(this.now, session.startTime);
        var minLeftToEnd = minutesBetween(this.now, session.endTime)

        if (minLeftToStart <= 30 && minLeftToStart > 0) { //before
          session.statusText = '<span>starts in ' + minLeftToStart + " min</span>";
        }
        else if (minLeftToStart <= 0 && minLeftToEnd >= 0) { //while
          session.status = "ongoing";
          session.statusText = '<span><span class="livedot"></span> ' + minLeftToEnd + " min left</span>";
        }
        else if (minLeftToEnd < 0) { //after
          session.status = "passed";
          session.statusText = "<span>passed</span>";
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
    upcomingSessions: function() {
      var sessions = this.filteredSessions.filter(function(session) {
        return session.status == "ongoing" || session.status == "upcoming";
      })
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
            timeslot = {timeslotTitle: "", statusText: "", days: null, day: "", sessions: []};
          }
          timeslot.title = toFormatTime(sessions[i].startTime) + " - " + toFormatTime(sessions[i].endTime);
          timeslot.status = sessions[i].status;
          timeslot.statusText = sessions[i].statusText;

          if (i == 0 || sessions[i].day != sessions[i-1].day) {
            timeslot.days = days;
          }
          timeslot.day =  weekdays[sessions[i].startTime.getDay()].toString();
        }
        timeslot.sessions.push(sessions[i]);
      }
      timeslots.push(timeslot);

      timeslots = timeslots.filter(function(ts) { 
        return app.filterDay == "" || ts.day == app.filterDay;
      });

      return timeslots;
    },
    talksBySession: function() {
      var talks = this.talks;
      var bysession = talks.reduce(function(rv, x) {
        (rv[x["session"]] = rv[x["session"]] || []).push(x);
        return rv;
      }, {});

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
          var authorMatch = false;
          for (var i = 0; i < talk.authors.length; i++) {
            if (searchRegex(app.search).test(talk.authors[i].name) || searchRegex(app.search).test(talk.authors[i].organization)) {
              authorMatch = true;
              break;
            }
          }

          return numberMatch || titleMatch || abstractMatch || authorMatch;
        })
      }

      return filtered
    },
    defaultDay: function () {
      var sessions = Object.values(this.sessions);
      sessions.sort(function(a,b) {return a.startTime - b.startTime});
      var conferenceStart = sessions[0].startTime;
      var conferenceEnd = sessions[sessions.length-1].endTime;

      if (this.now < conferenceStart || this.now > conferenceEnd) { //before and after conference: show first day
        return weekdays[conferenceStart.getDay()];
      }
      else { //during conference
        return weekdays[this.now.getDay()]; //show currentday
      }
    },
    announcementsForSession: function() {
      var bysession = {};

      for (var i = 0; i < this.announcementsData.length; i++) {
        var a = this.announcementsData[i];
        if ("considersSessions" in this.announcementsData[i]) {
          for (var j = 0; j < a.considersSessions.length; j++) {
            if (a.considersSessions[j] in bysession) {
              bysession[a.considersSessions[j]].push(a);
            }
            else {
              bysession[a.considersSessions[j]] = [a];
            }
          }
        }
      }
      
      return bysession;
    },
    announcements: function() {
      var filteredAnnouncements = this.announcementsData.filter(function(a) {
        var show = true;
        if (a.considersAll == false) {
          show = false;
        } 
        if (app.now < a.startTime) {
          show = false; //don't show before start time
        }
        if (app.now > a.endTime) {
          show = false; //don't show after end time
        }
        return show;
      })
      return filteredAnnouncements;
    },
    presentersHTMLForSession: function() {
      var presentersHTML = {};
      var sessions = Object.values(this.sessions);

      for (var i = 0; i < sessions.length; i++) {
        var session = sessions[i];
        var html = "";
        var talks = this.talksBySession[session.number];
        if (talks != undefined) {
          for (var j = 0; j < talks.length; j++) {
            if (talks[j].presenter.length > 0) {
              if (this.canceledTalks.includes(talks[j].number)) {
                html += '<span class="canceled">';
              }
              else {
                html += '<span>';
              }
              html += talks[j].presenter[0].name;
              html += '</span>';
              if (j < talks.length -1) {
                html += ", ";
              }
            }
          }
        }
        presentersHTML[session.number] = html;
      }
      return presentersHTML;
    },
    displayCycle: function() {
      var cycle = [];
      for (var p = 0; p < 3; p++) {
        cycle.push({
          "view": "program",
          "index": 0
        });
      }
      var announcements = this.announcements;
      for (var i = 0; i < announcements.length; i++) {
        for (var p = 0; p < 1; p++) {
          cycle.push({
            "view": "announcement",
            "index": i
          });
        }
      }
      return cycle;
    },
    roomCycle: function() {
      var cycle = [];
      if (this.upcomingSessions.length > 0) {
        if (this.upcomingSessions[0].status == "ongoing") { //during session
          cycle.push({
            "view": "session",
            "index": 0
          });
        }
        else { //before session
          for (var p = 0; p < 3; p++) {
            cycle.push({
              "view": "nextsession",
              "index": 0
            });
          }
          var announcements = this.announcements;
          for (var i = 0; i < announcements.length; i++) {
            for (var p = 0; p < 1; p++) {
              cycle.push({
                "view": "announcement",
                "index": i
              });
            }
          }
        }
      }
      else { //after last session
        for (var p = 0; p < 3; p++) {
          cycle.push({
            "view": "nomoresession",
            "index": 0
          });
        }
        var announcements = this.announcements;
        for (var i = 0; i < announcements.length; i++) {
          for (var p = 0; p < 1; p++) {
            cycle.push({
              "view": "announcement",
              "index": i
            });
          }
        }
      }

      return cycle;
    },
    displayView: function() {
      var currentPhase = this.displayCycle[this.phase % this.displayCycle.length];
      return currentPhase.view;
    },
    displayIndex: function() {
      var currentPhase = this.displayCycle[this.phase % this.displayCycle.length];
      return currentPhase.index;
    },
    roomView: function() {
      var currentPhase = this.roomCycle[this.phase % this.roomCycle.length];
      return currentPhase.view;
    },
    roomIndex: function() {
      var currentPhase = this.roomCycle[this.phase % this.roomCycle.length];
      return currentPhase.index;
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
          this.filterDay = this.defaultDay;
        }
      }
    },
    sessionsData: function(newSessions, oldSessions) {
      if (!this.currentRoute.match(/^\#\/([A-z0-9 ]+)$/g)) {
        this.filterDay = this.defaultDay;
      }
    },
    search : function (newSearch, oldSearch) {
      if (newSearch == "") { //leaving search, go back to whole day
        if (this.oldSearch != "") {
          if (this.currentRoute.match(/^\#\/([A-z0-9 ]+)$/g)) {
            var day = /\/([A-z0-9 ]+)/.exec(this.currentRoute)[1];
            this.filterDay = day;
          }
          else if (newRoute.match(/^\#?$/g)) {
            this.filterDay = this.defaultDay;
          }
        }
      }
      else { //show all days in search mode
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
    var now = new Date();
    var localoffset = -(now.getTimezoneOffset()/60);
    var offset = (timezoneOffset-localoffset) * 3600 * 1000;
    var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    app.now = new Date(new Date(utc_timestamp).getTime() + offset);
  }
  else {
    app.now.setMinutes(app.now.getMinutes() + 1 );
    app.now = new Date(app.now.getTime());
  }
  loadAnnouncements("./data/announcements.json");

  app.phase = (app.phase + 1) % 100;
}, 40*1000)


document.addEventListener('keypress', function(e) {
  if (e.altKey == true && e.code == "Digit1") {
    app.debug = !app.debug;
    e.preventDefault();
  }
});

document.addEventListener('keypress', function(e) {
  if (e.altKey == true && e.code == "Digit2") {
    app.showSettings = !app.showSettings;
    e.preventDefault();
  }
});


function loadProgram(url, tries = 5, version = 0) {
  var http_request = new XMLHttpRequest();
  http_request.open("GET", url + "?" + version.toString(), true);
  http_request.onreadystatechange = function () {
    var done = 4, ok = 200, local = 0;
    if (http_request.readyState == done) {
      if (http_request.status == ok || http_request.status == local) {
        var program = JSON.parse(this.responseText);
        var sessionNumbers = Object.keys(program.sessions);
        var today = new Date();  
        var localoffset = -(today.getTimezoneOffset()/60);
        var offset = (timezoneOffset-localoffset) * 3600 * 1000;
        for (var i = 0; i < sessionNumbers.length; i++) {
          try {
            var startTime = program.sessions[sessionNumbers[i]].startTime;
            startTime = new Date(Date.UTC(startTime[0], startTime[1]-1, startTime[2], startTime[3], startTime[4]));
            endTime = new Date(startTime.getTime() + program.sessions[sessionNumbers[i]].duration * 60 * 1000);

            program.sessions[sessionNumbers[i]].startTime = new Date(startTime.getTime() + offset);
            program.sessions[sessionNumbers[i]].endTime = new Date(endTime.getTime() + offset);
          }
          catch (e) {

          }
        }
        for (var i = 0; i < program.talks.length; i++) {
          try {
            var startTime = program.talks[i].startTime;
            startTime = new Date(Date.UTC(startTime[0], startTime[1]-1, startTime[2], startTime[3], startTime[4]));
            endTime = new Date(startTime.getTime() +  program.talks[i].duration * 60 * 1000);

            program.talks[i].startTime = new Date(startTime.getTime() + offset);
            program.talks[i].endTime = new Date(endTime.getTime() + offset);    
          }
          catch (e) {

          }
        }
        app.sessionsData = program.sessions;
        app.talks = program.talks;
        app.rooms = program.rooms;
        app.currentRoute = window.location.hash;
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

function loadAnnouncements(url, tries = 2) {
  var http_request = new XMLHttpRequest();
  http_request.open("GET", url + "?" + Math.random().toString(), true);
  http_request.onreadystatechange = function () {
    var done = 4, ok = 200, local = 0;
    if (http_request.readyState == done) {
      if (http_request.status == ok || http_request.status == local) {
        try {
          var data = JSON.parse(this.responseText);

          if (data.programVersion != app.programVersion) { //program outdated, update
            app.programVersion = data.programVersion;
            loadProgram("./data/program.json");
          }

          app.canceledTalks = data.canceledTalks;
          var announcements = data.announcements;

          var today = new Date();  
          var localoffset = -(today.getTimezoneOffset()/60);
          var offset = (timezoneOffset-localoffset) * 3600 * 1000;
          for (var i = 0; i < announcements.length; i++) {
            try {
              if ("startTime" in announcements[i]) {
                var startTime = announcements[i].startTime;
                startTime = new Date(Date.UTC(startTime[0], startTime[1]-1, startTime[2], startTime[3], startTime[4]));
                announcements[i].startTime = new Date(startTime.getTime() + offset);
              }
              if ("endTime" in announcements[i]) {
                var endTime = announcements[i].endTime;
                endTime = new Date(Date.UTC(endTime[0], endTime[1]-1, endTime[2], endTime[3], endTime[4]));
                announcements[i].endTime = new Date(endTime.getTime() + offset);
              }
            }
            catch (e) {

            }
          }
          app.announcementsData = announcements;
        }
        catch (e) {

        }
      }
      else {
        if (tries > 0) {
          loadAnnouncements(url, tries - 1);
        }
      }
    }
  };
  http_request.send(null);
}

loadProgram("./data/program.json");
loadAnnouncements("./data/announcements.json");
