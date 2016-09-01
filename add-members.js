/**
 * 作者:      liangkuaisheng
 * 时间:      16/8/31
 * 功能:      xx
 */
var path = require('path');
var inquirer = require('inquirer');
var fs = require("fs-extra");
var request = require('request-promise');
var Config = require('./config.js');
var Utils = require('./utils.js');
var _ = require('lodash');
var open = require("open");

function setGroups (unIncludeMembers, groupsList, membersListObj) {
    if (unIncludeMembers.length === 0) {
        return membersListObj;
    }
    var gLen = groupsList.length;
    return inquirer.prompt([
        {
            type: 'checkbox',
            name: 'reviewers',
            message: '选择要添加的 reviewer (不选中则结束操作)?',
            choices: unIncludeMembers
        },
        {
            type: 'checkbox',
            name: 'groups',
            message: '选择要添加到的位置?',
            choices: groupsList,
            when: function (obj) {
                return obj.reviewers.length && gLen;
            }
        }
    ])
        .then(function (res) {
            if (res.reviewers.length === 0) {
                return setGroups([], groupsList, membersListObj);
            }
            res.groups = res.groups || [];
            membersListObj = Utils.setMembersInGroups(res.reviewers, res.groups, membersListObj);
            var newUnIncludeMembers = _.cloneDeep(unIncludeMembers);
            _.remove(newUnIncludeMembers, function (item) {
                var flag = false;
                _.forEach(res.reviewers, function (subItem, subIndex) {
                    if (item.value.name === subItem.name) {
                        flag = true;
                    }
                });
                return flag;
            });
            console.log('添加完成');
            return setGroups(newUnIncludeMembers, groupsList, membersListObj);
        });
}

module.exports = function (filename, memberName, outputFile) {
    var obj = [];
    if (filename) {
        obj = fs.readJsonSync(filename);
    }
    if (memberName) {
        obj = obj.concat(Utils.filterMemberStr(memberName));
    }

    // mtpr 文件列表
    var membersListObj = [];
    var groupsList = [];
    Utils.getOriginalMenbers()
        .then(function (res) {
            membersListObj = res;
            groupsList = Utils.getGroupsList(res);
            return Utils.getUnIncludeMembers(res, Utils.getMembers(obj));
        })
        .then(function (res) {
            return setGroups(res, groupsList, membersListObj);
        })
        .then(function (res) {
            var filenameStr = outputFile || path.join(__dirname, 'members-list.json');
            Utils.outputObjFile(filenameStr, res);
            if (Config.OPEN_FILE) {
                open(filenameStr);
                open('http://awp.vip.sankuai.com/hfe/file-ep/edit/index.html');
                open(Utils.getConfigContent().path);
            }
            return res;
        })
        .catch(function (err) {
            console.log(err);
        });
};