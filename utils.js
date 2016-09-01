/**
 * 作者:      liangkuaisheng
 * 时间:      16/8/31
 * 功能:      工具文件
 */

var path = require("path");
var fs = require("fs-extra");
var _ = require('lodash');
var Promise = require('bluebird');
var colors = require('colors');
var rp = require('request-promise');

var Config = require('./config.js');

module.exports = {
    showConfigFile: function () {
        console.log();
    },
    outputFile: function (filepath, str, silence) {
        fs.outputFile(filepath, str, function (err) {
            if (err) throw err;
            if (!silence) {
                console.log('写入文件 ' + filepath + ' 成功!');
            }
        });
    },
    outputObjFile: function (filepath, obj, silence) {
        this.outputFile(filepath, JSON.stringify(obj, null, '    '), silence);
    },
    // 获取要添加的列表
    getMembers: function (obj) {
        var arr = obj;
        var res = {};
        arr.forEach(function (item, index) {
            var name = item.passport.replace('@meituan.com', '');
            res[name] = {
                name: name,
                displayName: item.name
            };
        });
        return res;
    },
    // 获取当前的人员列表
    getOriginalMenbers: function () {
        var reviewersPathStr = this.getConfigContent().path;
        if (!reviewersPathStr) {
            console.log('请先使用mtpr -f 设置reviewer缓存文件路径'.red);
            throw Error('请先使用mtpr -f 设置reviewer缓存文件路径');
        }
        return new Promise(function (resolve, reject) {
            var arr = [];
            if (/^(http|https):\/\/.+/gi.test(reviewersPathStr)) {
                rp(reviewersPathStr)
                    .then(function (res) {
                        try {
                            arr = JSON.parse(res);
                            resolve(arr);
                        } catch (err) {
                            reject(err);
                        }
                    });
            } else {
                if (reviewersPathStr) {
                    if (!/^(\/ | \w:).+/i.test(reviewersPathStr)) {
                        var prePath = Config.ProjectPath;
                        var fileStr = reviewersPathStr;
                        if (/^~\/.+/.test(reviewersPathStr)) {
                            prePath = Config.Home_Path;
                            fileStr = fileStr.slice(2);
                        }
                        reviewersPathStr = path.join(prePath, fileStr);
                    }
                    arr = fs.readJsonSync(reviewersPathStr) || [];
                } else {
                    arr = [];
                }
                resolve(arr);
            }
        });
    },
    // 处理添加人员的字符串
    filterMemberStr: function (str) {
        var res = [];
        if (str) {
            var memArr = str.split('#');
            memArr.forEach(function (item, index) {
                if (item) {
                    var arr = item.split('/');
                    res.push({
                        name: arr[0],
                        passport: arr[1]
                    });
                }
            });
        }
        return res;
    },
    // 获取当前配置文件内容
    getConfigContent: function () {
        var reviewersfilePath = path.join(Config.Home_Path, Config.ConfigFile);
        var reviewersPath = fs.readJsonSync(reviewersfilePath);
        if (!reviewersPath) {
            reviewersPath = {
                path: '',
                defaultReviewers: []
            };
        }
        return reviewersPath;
    },
    // 获取不包含的人员列表
    getUnIncludeMembers: function (mtprArr, dxObj) {
        var dxObjTemp = _.cloneDeep(dxObj);
        _.forEach(dxObj, function (item, key) {
            mtprArr.forEach(function (subItem, subIndex) {
                if (key === subItem.name) {
                    delete dxObjTemp[key];
                }
            })
        });
        var res = [];
        _.forEach(dxObjTemp, function (item, key) {
            res.push({
                name: item.displayName + '(' + item.name + ')',
                value: item
            });
        });
        return res;
    },
    // 获取当前的分组列表
    getGroupsList: function (mtprArr) {
        var res = [];
        mtprArr.forEach(function (item, index) {
            if (item.groupType) {
                res.push({
                    name: item.displayName,
                    value: item.name
                });
            }
        });
        return res;
    },
    // 添加人员到列表中
    setMembersInGroups: function (members, groups, membersListObj) {
        if (groups.length) {
            _.forEach(membersListObj, function (item, index) {
                if (membersListObj[index].groupType) {
                    _.forEach(groups, function (subItem, subIndex) {
                        if (subItem === item.name) {
                            membersListObj[index].users = membersListObj[index].users.concat(members);
                        }
                    });
                }
            });
        }
        membersListObj = membersListObj.concat(members);

        return membersListObj;
    }
};