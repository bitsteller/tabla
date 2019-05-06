import csv  
import json  
import re
  
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
	talks.append(t)

# Save the JSON  
print("Saving...")
program = {"sessions": sessions, "talks": talks}

out = json.dumps( program, indent = 4, sort_keys=True)
f = open( 'program.json', 'w')  
f.write(out)  
print("JSON saved!")