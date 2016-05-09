/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

exports.name = 'version';
exports.usage = '[options] <list|major|minor|patch>';
exports.desc = 'update or show component version';

var Promise = require('bluebird');
var path = require('path');

var logger = require('./lib/logger');

var release = require('./lib/release');
var list = require('./lib/list');

exports.register = function (commander) {
  commander
  .action(function () {
    debugger;
    var args = [].slice.call(arguments);
    var options = args.pop();
    var type = ('string' === typeof args[0] ? args[0] : 'list');
    var components = args.slice(1);
    
    Promise.try(function () {
      // type参数必须是major, minor, patchh或者list
      if(type && !~['major', 'minor', 'patch', 'list'].indexOf(type)) throw new Error('Invalid realease parameter! Expected "major", "minor", "patch" or "list".');

      if('list' === type) {
        return list(components);
      } else {
        return release(type);
      }
      
    })
    .catch(function (e) {
      logger.error(e.message);
      // 添加调试错误堆栈功能
      if(process.env.NODE_ENV === 'debug') logger.error(e.stack);
    });
  });
};
