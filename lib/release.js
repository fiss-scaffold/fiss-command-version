'use strict';

var Promise = require('bluebird');
var semver = require('semver');
var Git = require('nodegit');
var path = require('path');
var fs = require('fs');
var jsonfile = require('jsonfile');
var prompt = require('prompt');
var logger = require('./logger');

prompt.message = '';

module.exports = function (type) {
  var rootDir = process.cwd(); // 项目根目录
  var componentJson;
  var json;
  var repo;
  var version, nextVersion;
  return Git.Repository.openExt(path.resolve(''), 0, '')
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

      // 如果component.json和tag中的版本不匹配
      if(version !== tags.pop()) throw new Error('Component version and the latest tag does not match!');

      nextVersion = semver.inc(version, type);
    }

    return repo.getStatus();
  })
  .then(function (statusList) {
    // 如果本地有未提交的修改
    if(statusList.length > 0) throw new Error('Please commit local change first!');
  })
  .then(function() {
    var getPrompt = Promise.promisify(prompt.get);
    var schema = {
      properties: {
        comment: {
          description: 'Please enter the release message',
          pattern: /^.{4,50}$/,
          message: 'Release message should be between 4 and 50 charactors!',
          required: true
        }
      }
    };
    prompt.start();
    return getPrompt(schema);
  })
  .then(function(result) {
    // 如果component.json中的版本号发生更改，写到json中
    if(nextVersion !== version) {
      json.version = nextVersion;
      jsonfile.writeFileSync(componentJson, json, { spaces: 2 });
    }
    // 提交component.json改动并新增Tag
    var author = Git.Signature.default(repo);
    var committer = Git.Signature.default(repo);

    return repo.createCommitOnHead(['component.json'], author, committer, 'v' + nextVersion)
    .then(function(oid) {
      logger.info("New Commit: " + oid.toString());
      return repo.createTag(oid, nextVersion, result.comment);
    })
    .then(function (tag) {
      logger.info("New Version: " + nextVersion);
      logger.info("Release message: " + result.comment);
    });

  });
};
