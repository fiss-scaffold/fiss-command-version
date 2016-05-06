/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

exports.name = 'version';
exports.usage = '[options] <releaseType>';
exports.desc = 'update component version';

var semver = require('semver');
var Git = require('nodegit');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var jsonfile = require('jsonfile');
var log4js = require('log4js');

log4js.configure({
  appenders: [
    {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%r %[%-5p%] %m'
      }
    }
  ]
});

var logger = new log4js.getLogger('fiss');

exports.register = function (commander) {
  commander
  .action(function () {
    var args = [].slice.call(arguments);
    var options = args.pop();
    var type = ('string' === typeof args[0] ? args[0] : '');
    var rootDir = process.cwd(); // 项目根目录
    var componentJson;
    var json;
    var repo;
    var version, nextVersion;
    debugger;
    Promise.try(function () {
      // type参数必须是major, minor或者patch
      if(type && !~['major', 'minor', 'patch'].indexOf(type)) throw new Error('Invalid realease type! Expected "major", "minor" or "patch".');

      return Git.Repository.openExt(path.resolve(''), 0, '');
    })
    .then(function (repoResult) {
      repo = repoResult;
      rootDir = repo.workdir();
      componentJson = path.join(rootDir, 'component.json');

      if(!fs.existsSync(componentJson)) throw new Error('missing `component.json`');

      json = jsonfile.readFileSync(componentJson);
      version = json.version || '0.0.0';

      return Git.Tag.list(repo);
    })
    .then(function (tags) {
      
      if(!tags.length) { // 如果未发布过版本

        if(!type) return new Promise(function (resolve, reject) {
          logger.info('No version published before!');
        });

        if('0.0.0' === version) { // 如果版本号是0.0.0，在此基础上增加
          nextVersion = semver.inc(version, type);
        } else { // 如果版本号不是0.0.0，使用此版本号为初始版本号
          nextVersion = version;
        }

      } else { // 如果发布过版本，直接在此基础上累加

        tags = tags.sort(function (a, b) {
          return semver.compare(a, b);
        });

        if(!type) return new Promise(function (resolve, reject) {
          logger.info('Current version: ' + json.name + '@' + version);
        });
        // 如果component.json和tag中的版本不匹配
        if(version !== tags.pop()) throw new Error('Component version and the latest tag does not match!');

        nextVersion = semver.inc(version, type);
      }

      return repo.getStatus();
    })
    .then(function (statusList) {
      // 如果本地有未提交的修改
      if(statusList.length > 0) throw new Error('Please commit local change first!');
      // 如果component.json中的版本号发生更改，写到json中
      if(nextVersion !== version) {
        json.version = nextVersion;
        jsonfile.writeFileSync(componentJson, json, { spaces: 2 });
      }
    })
    .then(function() {
      // 提交component.json改动
      var author = Git.Signature.default(repo);
      var committer = Git.Signature.default(repo);

      return repo.createCommitOnHead(['component.json'], author, committer, 'v' + nextVersion);
    })
    .then(function(oid) {
      logger.info("New Commit: " + oid.toString());
      return repo.createTag(oid, nextVersion, 'v' + nextVersion);
    })
    .then(function (tag) {
      logger.info("New Version: " + nextVersion);
    })
    .catch(function (e) {
      logger.error(e.message);
    });
  });
};
