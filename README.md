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

## Setup

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

## Customizing

1. Optionally change the colors in `style.css`.

## During the conference

### Updating the program

1. Follow the steps under "Import program from EasyChair" above to create an updated `program.json` file. Upload the new file to your webserver in the /data folder.
2. In `/data/announcements.json` increment the value `programVersion` by one. 

Incrementing the version number ensures that all users will see the updated program immediately (otherwise it can take severaly hours due to caching and would require a page reload).

### Announcements

Announcements are displayed on displays and the program viewer in real-time (without page reload) in order to make it easy to reach out to all participants. You can make two types of announcements:

* Announcements to all participants: Messages that are relevant for all conference participants. For example information about lunch/dinner, how to get to the conference, welcoming participants in the beginning and thank for coming in the end of the conference.
* Announcements to participants of one (or several) sessions: Messages relevant only to those interested in a given session. For example a note that the room for the session has changed, a speaker/chair has been changed, if the session is delayed etc.

#### Make an announcement

Announcements are made by modifing the file /data/announcements.json.

The following fields *have* to be specified in an announcement:

* `title`: Very short summary (max 5 words), for example: `"Room change"` or `"Welcome to the conference"`. May only contain text.
* `message`: The message, for example: `"The room for this session has been changed to K3` or `The conference takes place at Campus Norrköping, Kåkenhus. <a href='https://goo.gl/maps/EbkRe6VmQvPETpez9'>Map</a>"`. You can use HTML tags for formatting, but avoid pictures in announcements considering sessions.
* `considersSessions`: The list of session numbers (as quoted string) for which the announcement is relevant, for example `["1","5"]`
* `considersAll`: If this announcement should be shown to all participants, `true` or `false`.

If `considersAll: true` you *may* also specify:

* `startTime`: Don't show the announcement before this time
* `endTime`: Don't show the announcement after this time

These times are specified as a list of integers `[YYYY,MM,DD,HH,mm]` in *UTC time*!
For example `[2019, 6, 17, 8, 0]` corresponds to 17 June 2019 8:00 UTC (which is 10:00 CEST).

Below is an example of an `announcement.json` file with one announcement:

```
{
    "announcements": [
        {
            "title": "Welcome to RailNorrköping!",
            "message": "The conference takes place at Campus Norrköping, Kåkenhus. <a href='https://goo.gl/maps/EbkRe6VmQvPETpez9'>Map</a>",
            "considersSessions": ["1"],
            "considersAll": true,
            "startTime": [2019, 6, 16, 19, 0],
            "endTime": [2019, 6, 17, 8, 0]
        }
    ],
    "canceledTalks": [],
    "programVersion": 1
}
```

### Canceling talks

There is also support for marking specific talks as canceled, without removing them from the program. Canceled talks will be marked as strikethrough text in the program viewer and on the displays.

A talk is marked as canceled as follows:

1. In `announcements.json` add the talk numer quoted as string to the list `canceledTalks`. For example `canceledTalks: ["1","13"]` will marks the talks with number 1 and number 13 as canceled.
