const fs = require('fs');
const { DateTime } = require('luxon');

const schedule = JSON.parse(fs.readFileSync(`./data/asp-${new Date().getFullYear()}.json`));
const dateFormat = require('./date-format');

const getNextASP = (schedule, date) => {
  const dateObject = DateTime.fromFormat(date, dateFormat);
  const nextDay = dateObject.plus({ days: 1 }).toFormat(dateFormat);

  if (schedule[nextDay]) {
    return schedule[nextDay];
  } else {
    getNextAsp(schedule, nextDay);
  }
}

exports.flashBriefingHandler = (event, context, callback) => {
  const date = DateTime.utc().setZone('America/New_York').toFormat(dateFormat);
  let message;

  if (schedule[date]) {
    message = schedule[date].description;
  } else {
    const nextASP = getNextASP(schedule, date);
    message = nextASP ?
      `The next suspension is on ${DateTime.fromISO(nextASP.start).toFormat('cccc, MMMM d ')}` :
      'There is no suspension for the rest of the year';
  };

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      uid: "sfgdfgdfgdfgfgdfg",
      titleText: "NYC Alternate Street Parking Status",
      mainText: message,
      redirectionUrl: "http://www.nyc.gov/html/dot/downloads/pdf/asp-calendar-2018.pdf",
      updateDate: new Date().toISOString()
    })
  });
};
