const fs = require('fs');
const path = require('path');

const ical = require("node-ical");
const request = require('request');
const { DateTime } = require('luxon');

const thisYear = new Date().getFullYear();
const matcher = /^Alternate Side Parking suspended for ([A-z '().-]+)/;

const aspURL = (year = thisYear) =>
  `http://www.nyc.gov/html/dot/downloads/misc/${year}-alternate-side.ics`;

const writeICSFileToJSON = (ics, year) => {
  ical.parseICS(ics, (error, data) => {
    if (error) { throw new Error(error); }

    const cleansedData = JSON.parse(JSON.stringify(data)); // Object bug in iCal library reading the date as a key?

    const byDate = Object.values(cleansedData).reduce((accum, calEntry) => {
      let event = null;
      const date = DateTime.fromISO(calEntry.start).toFormat('yyyy/MM/dd');

      if(accum[date]) {
        console.log(
          `[WARNING]: There is a duplicate for the date: ${date}. Entries are

          ${calEntry.description}

          and

          ${accum[date].description}

        `);
      }
      console.log(calEntry.description.split('. ')[0]);
      const match = matcher.exec(calEntry.description.split('. ')[0]);
      if (match) {
        event = match[1].replace('.', '');
      }

      accum[date] = {
        description: calEntry.description,
        start: calEntry.start,
        end: calEntry.end,
        uid: calEntry.uid,
        event
      };

      return accum;
    }, {});

    console.debug(`The number of suspensions in ${year} is ${Object.keys(byDate).length}`);
    fs.writeFileSync(path.resolve(process.cwd(), 'data', `asp-${year}.json`), JSON.stringify(byDate));
  });
}

request(aspURL(), (error, response, body) => writeICSFileToJSON(body, thisYear));
