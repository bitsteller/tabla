import csv  
import json  
import re
import os

#import analyse
#tr4w = analyse.TextRank4Keyword()

  
# Open the CSV  
f = open( 'sessions.csv', 'r' )  
print("Parsing sessions csv...")
f.readline()
reader = csv.DictReader( f, fieldnames = ( "number", "title", "date", "time", "duration", "kind", "description", "chairs", "room" ))  

print("Converting sessions...")
sessions = dict()

for s in reader:
	date = re.match(r'([0-9]{4})-([0-9]{2})-([0-9]{2})', s["date"])
	time = re.match(r'([0-9]{2}):([0-9]{2})', s["time"])
	s["startTime"] = [int(date.group(1)), int(date.group(2))-1, int(date.group(3)), int(time.group(1)), int(time.group(2))]
	s["duration"] = int(s["duration"])
	sessions[s["number"]] = s

print("Parsing talks csv...")
f = open( 'talks.csv', 'r' )  
f.readline()
reader = csv.DictReader( f, fieldnames = ( "number", "title", "date", "time", "duration", "authors", "presenter", "session", "abstract", "track"))  

print("Converting talks...")
talks = []

for t in reader:
	date = re.match(r'([0-9]{4})-([0-9]{2})-([0-9]{2})', s["date"])
	time = re.match(r'([0-9]{2}):([0-9]{2})', t["time"])
	t["startTime"] = [int(date.group(1)), int(date.group(2))-1, int(date.group(3)), int(time.group(1)), int(time.group(2))]
	t["duration"] = int(s["duration"])

	#tr4w.analyze(t["title"] + " " + t["abstract"], candidate_pos = ['NOUN'], window_size=4, lower=False, stopwords = ["railways", "railway", "train", "rail", "%"])
	#t["keywords"] = tr4w.get_keywords(1)
	talks.append(t)


if os.path.isfile('submissions.csv'):
	print("Parsing submissions csv...")
	f = open( 'submissions.csv', 'r' )  
	f.readline()
	reader = csv.DictReader(f, delimiter=";",fieldnames = ( "number", "authors", "title", "ext_abstract", "full_paper", "camera_ready", "revision_letter", "category", "accepts_publication", "poster_session", "track", "decision"))  
	for s in reader:
		talk = [t for t in talks if t["number"] == s["number"]]
		if len(talk) > 0:
			talk = talk[0]
			talk["category"] = s["category"]
			talk["accepts_publication"] = s["accepts_publication"]


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
	if talk["authors"] != "" and "category" in talk:
		valid_talks.append(talk)

valid_talks.sort(key = lambda talk: re.search(r'([\w-]+)(,| and|$)', talk["authors"]).group(1))
tex = "\n".join(["\\includeabstract{" + talk["title"].replace("\\","") + "}{" + talk["authors"] + "}{" + talk["session"] + "}{" + talk["number"] + "}{" + talk["category"] + "}{" + talk["accepts_publication"] + "}" for talk in valid_talks])
tex = tex.replace("&", "\\&")
tex = tex.replace("&", "\\%")

f = open( 'proceedings.tex', 'w')  
f.write(tex)  
