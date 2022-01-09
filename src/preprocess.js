const fs = require('fs');
const util = require('util');
const path = require('path');
const es = require('event-stream');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

if (!fs.existsSync(path.join(__dirname, '/../data'))) {
  fs.mkdirSync(path.join(__dirname, '/../data'));
  console.log('mkdir ../data/');
}

if (!fs.existsSync(path.join(__dirname, '/../images'))) {
  fs.mkdirSync(path.join(__dirname, '/../images'));
  console.log('mkdir ../images/');
}

let groupNo = 0;
let groupData = '';
let groupStarted = false;

const s = fs
  .createReadStream(path.join(__dirname, 'raw.csv'))
  .pipe(es.split())
  .pipe(
    es
      .mapSync(function (line) {
        // pause the readstream
        s.pause();
        // process line here and call s.resume() when rdy
        // function below was for logging memory usage
        processLine(line);
        // resume the readstream, possibly from a callback
        s.resume();
      })
      .on('error', function (err) {
        console.log('Error while reading file.', err);
      })
      .on('end', function () {
        console.log('Read entire file.');
      })
  );

function processLine(line) {
  if (line.startsWith('V (V)')) {
    groupNo++;
    groupData = 'V (V),I (A),P (W)';
    groupStarted = true;
  } else if (!line && groupNo > 0) {
    groupStarted = false;
    saveGroupData(groupNo, groupData);
  } else if (groupStarted) {
    groupData += '\n' + line;
  }
}

async function saveGroupData(groupNo, data) {
  try {
    await writeFile(path.join(__dirname, `/../data/group${groupNo}.csv`), data);
    console.log(`Group ${groupNo} saved!`);
  } catch (error) {
    console.log('write file error: ', error);
  }
}