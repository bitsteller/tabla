# Tablå
Conference program display with focus on usability


## Features
* Conference program website 
	* Works great on all screen sizes (Mobile and Desktop)
	* Built-in search function
	* Highlight of current timeslot/talk during conference in real-time
	* Export of sessions as calendar entry (ical)
	* Export of session info for note taking
	* Easily customizable due to the use of vue templates (*coming*)
* Program display for information screens
* Program display for individual rooms including talk timer (*coming*)
* Import of conference program directly from EasyChair
* Support for ad-hoc changes in real-time
* Support for announcements in real-time


## Usage

### Import program from Easy chair

1. Use the csv export from Easy chair. It is recommended also to export the submissions as Excel and convert to csv.
2. Place the the files

```authors.csvrooms.csvsession_chairs.csvsessions.csvtalks.csv
submissions.csv
```
	
into the Tablå /data folder.
	
3. Run the converter `python convert.py` in the /data folder. It will create the file `program.json`.

### Setup website

1. Set the parameters in the first lines of `/script/main.js`, such as timezone, conference name, and url to your conference website.
2. Upload the the Tablå folder, including subfolders to your webserver.

### Customizing

1. Optionally change the colors in `style.css`.


### Updating the program

(TBD)

### Making announcements

(TBD)



	


*coming*