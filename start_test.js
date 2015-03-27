#!/usr/bin/env node
//var spawn = require('child_process').spawn;

(function() {
  var childProcess = require("child_process");
  oldSpawn = childProcess.spawn;
  function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
  }
  childProcess.spawn = mySpawn;
})();

var workingDir = process.env.WORKING_DIR || process.env.PACKAGE_DIR || './';
var args = ['test-packages', '--once', '--driver-package', 'test-in-console', '-p', 10015];

args.push('--release');
args.push('1.0.0');
//if (typeof process.env.METEOR_RELEASE !== 'undefined' &&
//    process.env.METEOR_RELEASE !== '') {
//    args.push('--release');
//    args.push(process.env.METEOR_RELEASE);
//}


if (typeof process.env.PACKAGES === 'undefined') {
  args.push('./');
}
else if (process.env.PACKAGES !== '') {
  args = args.concat(process.env.PACKAGES.split(';'));
}
console.log('(1)');
console.log((process.env.TEST_COMMAND || 'meteor'), args);
var meteor = spawn((process.env.TEST_COMMAND || 'meteor'), args, {cwd: workingDir});
console.log('(2)');
meteor.stdout.pipe(process.stdout);
meteor.stderr.pipe(process.stderr);
console.log('(2b)');
meteor.on('close', function (code) {
  console.log('meteor exited with code ' + code);
  process.exit(code);
});

meteor.stdout.on('data', function startTesting(data) {
  console.log('(2c)');
  var data = data.toString();
  if(data.match(/10015|test-in-console listening/)) {
    console.log('starting testing...');
    meteor.stdout.removeListener('data', startTesting);
    runTestSuite();
  } 
});

function runTestSuite() {
  process.env.URL = "http://localhost:10015/";
console.log('(3)');
  var phantomjs = spawn('phantomjs', ['./phantom_runner.js']);
console.log('(4)');
  phantomjs.stdout.pipe(process.stdout);
  phantomjs.stderr.pipe(process.stderr);

  phantomjs.on('close', function(code) {
    meteor.kill('SIGQUIT');
    process.exit(code);
  });
}
console.log('(5)');
