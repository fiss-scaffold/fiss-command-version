/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var jsonfile = require('jsonfile');
var _ = require('lodash');
var treeify = require('treeify');

var logger = require('./logger');

module.exports = function (components) {
  var rootDir = process.cwd(); // 项目根目录
  var componentJson;
  var componentsDir = 'components';
  var json;
  var rootName = path.basename(process.cwd());
  var rootVersion;

  return new Promise(function (resolve, reject) {
    // 寻找组件安装目录
    componentJson = path.join(rootDir, 'component.json');

    if(fs.existsSync(componentJson)) {
      json = jsonfile.readFileSync(componentJson);
      json.dir && (componentsDir = json.dir);
      json.name && (rootName = json.name);
      json.version && (rootVersion = json.version);
    }

    resolve(path.join(rootDir, componentsDir));

  })
  // 获取已经安装的组件
  .then(function (dir) {
    var installed;

    if(!fs.existsSync(dir)) throw new Error('Components dir not exists!');

    var results = fs.readdirSync(dir);

    if(!components.length) {
      installed = results;
    } else {
      installed = results.filter(function (component) {
        return ~components.indexOf(component);
      });
    }

    return installed;
  })
  // 获取有版本号的组件
  .then(function (installed) {
    return installed.map(function (componentDir) {
      var json = jsonfile.readFileSync(path.join(componentsDir, componentDir, 'component.json'));
      return {
        name: componentDir,
        version: json.version
      };
    }).filter(function (component) {
      return component.version;
    });
  })
  // 打印组件以及版本号
  .then(function (installed) {
    var map = _.zipObject(installed.map(function (component) {
      return component.name + '@' + component.version;
    }));
    var tree = treeify.asTree(map);
    var str = rootName ? (rootName + (rootVersion ? '@' + rootVersion : '') + '\n') : '';

    if(components.length) str = '';

    logger.info('Component versions: \n' + str + tree);

  });
};