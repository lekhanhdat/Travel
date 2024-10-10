/**
 * @flow
 */
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const argv = require('yargs-parser')(process.argv.slice(2));
//$FlowFixMe
String.prototype.format = function () {
  let a = this;
  for (let k in arguments) {
    //$FlowFixMe
    a = a.replace(('{' + k + '}').toRegex('g'), arguments[k]);
  }
  return a;
};
//$FlowFixMe
String.prototype.toRegex = function (option = 'i') {
  let regexStr = this.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, '\\$&');
  regexStr = regexStr.replace(/\s/g, '\\s?');
  return new RegExp(regexStr, option);
};
const getFileName = file => {
  var fileNameMatch = file.match(/^(.+)\.[^\.]+$/);
  return fileNameMatch && fileNameMatch[1].replace(/[\s-\+]+/g, '_');
};

const folder = argv.folder || argv.d || argv._[0];
var match = folder.match(/^(.+\/([^\/]+))\/?$/);
//$FlowFixMe
var output = match && '{0}/{1}.tsx'.format(match[1], match[2]);
output = argv.output || argv.o || output;

let outputMatch = output.match(/^(?:(.*)\/)?([^\/]+)$/);
let outputName = outputMatch[2];
let outputPath = outputMatch[1] || '.';
let requirePath = path.posix.relative(outputPath, folder);
let author = argv.author || argv.a || 'AW';
let template = `/**
  * @author {2}
  * @flow
  */
  
  {1}
  export {
    {0}
    }`;

let moduleName = argv.name || getFileName(outputName);
fs.readdir(folder, (err, files) => {
  if (err) {
    return console.error(err);
  }
  var strCodes = [];
  var strExport = [];
  files.forEach(file => {
    if (file.match(/@\dx\.(png|jpg)/)) return;
    var fileName = getFileName(file);
    if (fileName) {
      //$FlowFixMe
      strCodes.push(
        `import {0} from './{1}/{2}';`.format(fileName, requirePath, file),
      );
      strExport.push(
        `{0},`.format(fileName),
      );
    }
  });
  //$FlowFixMe
  let code = template.format(strExport.join('\n'), strCodes.join('\n'), author);
  fs.writeFileSync(output, code);
});
