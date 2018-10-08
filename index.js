const fs = require('fs');
const { DateTime } = require('luxon');

const schedule = JSON.parse(fs.readFileSync(`./data/asp-${new Date().getFullYear()}.json`));
const dateFormat = require('./date-format');

const getNextASP = (schedule, date) => {
  return schedule[date] ?
    schedule[date] :
    getNextASP(
      schedule,
      DateTime.fromFormat(date, dateFormat).plus({ days: 1 }).toFormat(dateFormat)
    );
}

exports.flashBriefingHandler = (event, context, callback) => {
  const now = DateTime.utc().setZone('America/New_York');
  const results = {
    titleText: "NYC Alternate Street Parking Status",
    redirectionUrl: "http://www.nyc.gov/html/dot/downloads/pdf/asp-calendar-2018.pdf"
  };

  const entry = getNextASP(schedule, now.toFormat(dateFormat));

  if (!entry) {
    Object.assign(results, {
      mainText: `There is no suspension for the rest of the year`,
      uid: `no-more-${now.getFullYear()}`,
      updateDate: now.toISOString()
    });
  } else {
    const startDate = DateTime.fromISO(entry.start).setZone('America/New_York');
    const isSameDay = startDate.hasSame(now, 'year') && startDate.hasSame(now, 'month') && startDate.hasSame(now, 'day');

    Object.assign(results, {
      mainText: isSameDay ? entry.description : `The next suspension is on ${DateTime.fromISO(entry.start).toFormat('cccc, MMMM d ')} for ${entry.event}`,
      uid: `v1-${entry.uid}`,
      updateDate: entry.end
    });
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(results)
  });
};
