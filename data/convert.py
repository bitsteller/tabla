import csv  
import json  
import re
import os
import datetime
from dateutil.parser import parse
from pytz import timezone

tz = 'Europe/Stockholm'

#import analyse
#tr4w = analyse.TextRank4Keyword()

  
# Open the CSV  
f = open( 'sessions.csv', 'r' )  
print("Parsing sessions csv...")
f.readline()
reader = csv.DictReader( f, fieldnames = ( "number", "title", "date", "time", "duration", "kind", "description", "chairs", "room" ))  

print("Converting sessions...")
sessions = dict()
next_internal_id = 0

for s in reader:
	date_str = s["date"] + " " + s["time"]
	start = parse(date_str)
	start_utc = timezone(tz).localize(start).utctimetuple()
	s["startTime"] = start_utc[0:5]
	s["duration"] = int(s["duration"])
	if s["number"] != "":
		sessions[s["number"]] = s
	else:
		s["number"] = "_" + str(next_internal_id)
		sessions["_" + str(next_internal_id)] = s
		next_internal_id = next_internal_id + 1

print("Parsing talks csv...")
f = open( 'talks.csv', 'r' )  
f.readline()
reader = csv.DictReader( f, fieldnames = ( "number", "title", "date", "time", "duration", "authors", "presenter", "session", "abstract", "track"))  

print("Converting talks...")
talks = []

for t in reader:
	date_str = t["date"] + " " + t["time"]
	start = parse(date_str)
	start_utc = timezone(tz).localize(start).utctimetuple()
	t["startTime"] = start_utc[0:5]
	t["duration"] = int(t["duration"])
	t["authors_str"] = t["authors"]
	t["authors"] = []
	t["presenter"] = []

	#tr4w.analyze(t["title"] + " " + t["abstract"], candidate_pos = ['NOUN'], window_size=4, lower=False, stopwords = ["railways", "railway", "train", "rail", "%"])
	#t["keywords"] = tr4w.get_keywords(1)
	talks.append(t)


print("Parsing authors csv...")
f = open( 'authors.csv', 'r' )  
f.readline()
reader = csv.DictReader( f, fieldnames = ( "talk", "firstname", "lastname", "country", "organization", "email", "url", "personid", "presenter"))  

for a in reader:
	talk = [t for t in talks if t["number"] == a["talk"]]
	if len(talk) > 0:
		talk = talk[0]
		author = {"name": a["firstname"] + " " + a["lastname"],
				  "firstname": a["firstname"],
				  "lastname": a["lastname"],
				  "country": a["country"],
				  "organization": a["organization"],
				  "url": a["url"],
				  "presenter": True if a["presenter"] == "yes" else False
				  }
		talk["authors"].append(author)
		if author["presenter"]:
			talk["presenter"].append(author)


if os.path.isfile('submissions2.csv'):
	print("Parsing submissions csv...")
	f = open( 'submissions2.csv', 'r' )  
	f.readline()
	reader = csv.DictReader(f, delimiter=";",fieldnames = ( "number", "lastname", "authors", "title", "ext_abstract", "full_paper", "camera_ready", "revision_letter", "category", "accepts_publication", "poster_session", "track", "decision"))  
	for s in reader:
		talk = [t for t in talks if t["number"] == s["number"]]
		if len(talk) > 0:
			talk = talk[0]
			talk["title"] = s["title"]
			talk["authors_str"] = s["authors"]
			talk["category"] = s["category"]
			talk["accepts_publication"] = s["accepts_publication"]
			talk["lastname"] = s["lastname"]


# Save the JSON  
print("Saving...")
program = {"sessions": sessions, "talks": talks}

out = json.dumps( program, indent = 4, sort_keys=True)
f = open( 'program.json', 'w')  
f.write(out)  
print("JSON saved!")

#save latex list of talks for proceedings
print("Export latex for proceedings...")
valid_talks = []
for talk in talks:
	if talk["authors_str"] != "" and "category" in talk:
		valid_talks.append(talk)

valid_talks.sort(key = lambda talk: re.search(r'([A-Za-z-ÁÀȦÂÄǞǍĂĀÃÅǺǼǢĆĊĈČĎḌḐḒÉÈĖÊËĚĔĒẼE̊ẸǴĠĜǦĞG̃ĢĤḤáàȧâäǟǎăāãåǻǽǣćċĉčďḍḑḓéèėêëěĕēẽe̊ẹǵġĝǧğg̃ģĥḥÍÌİÎÏǏĬĪĨỊĴĶǨĹĻĽĿḼM̂M̄ʼNŃN̂ṄN̈ŇN̄ÑŅṊÓÒȮȰÔÖȪǑŎŌÕȬŐỌǾƠíìiîïǐĭīĩịĵķǩĺļľŀḽm̂m̄ŉńn̂ṅn̈ňn̄ñņṋóòôȯȱöȫǒŏōõȭőọǿơP̄ŔŘŖŚŜṠŠȘṢŤȚṬṰÚÙÛÜǓŬŪŨŰŮỤẂẀŴẄÝỲŶŸȲỸŹŻŽẒǮp̄ŕřŗśŝṡšşṣťțṭṱúùûüǔŭūũűůụẃẁŵẅýỳŷÿȳỹźżžẓǯßœŒçÇ\w-]+)(,| and|$)', talk["authors_str"]).group(1))
#valid_talks.sort(key = lambda talk: talk["lastname"])

tex = "\n".join(["\\includeabstract{" + talk["title"].replace("\\","") + "}{" + talk["authors_str"] + "}{" + talk["session"] + "}{" + talk["number"] + "}{" + talk["category"] + "}{" + talk["accepts_publication"] + "}" for talk in valid_talks])
tex = tex.replace("&", "\\&")
tex = tex.replace("&", "\\%")

f = open( 'proceedings.tex', 'w')  
f.write(tex)  
