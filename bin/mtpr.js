#!/usr/bin/env node

var colors = require('colors');
var path = require('path');
var cmd = require('commander');
var inquirer = require('inquirer');
var PRMT = require('@mtfe/pull-request-mt');
var fsextra = require('fs-extra');
var _ = require('lodash');
var git = require("git-promise");
var rp = require('request-promise');
var Promise = require('bluebird');
var projectPath = process.cwd();
var cwd = __dirname;

var appInfo = require('./../package.json');
var projectMtprDemo = require('./../package-demo.json');

var projectInfo = {};
try {
    projectInfo = require(path.join(projectPath, './package.json'));
} catch (err) {
    projectInfo = {};
}
function getUserHome () {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
var Home_Path = getUserHome();
var mtprInfo = projectInfo.mtpr || {};
var keyPath = path.join(Home_Path, './.mtpr.key');
var reviewersfilePath = path.join(Home_Path, './.mtpr.json');
var reviewersPath = {
    path: '',
    defaultReviewers: []
};
try {
    reviewersPath = require(reviewersfilePath);
} catch (err) {
    reviewersPath = {
        path: '',
        defaultReviewers: []
    };
}
var reviewersPathTemp = mtprInfo.reviewerfilename || reviewersPath.path;
var silence = true;

var $defer;
function readReviewerFile (reviewersPathStr) {
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
            try {
                if (!/^(\/ | \w:).+/i.test(reviewersPathStr)) {
                    var prePath = projectPath;
                    var fileStr = reviewersPathStr;
                    if (/^~\/.+/.test(reviewersPathStr)) {
                        prePath = Home_Path;
                        fileStr = fileStr.slice(2);
                    }
                    reviewersPathStr = path.join(prePath, fileStr);
                }
                arr = require(reviewersPathStr);
                resolve(arr);
            } catch (err) {
                reject(err);
            }
        }
    });
}

cmd
//.allowUnknownOption()
    .version(appInfo.version)
    .option('-i, --info', '工具使用说明http://wiki.sankuai.com/pages/viewpage.action?pageId=475101739')
    .option('-k, --key', '缓存git密码')
    .option('-f, --filepath', '设置reviewers的列表文件:文件绝对路径或者url')
    .option('-d, --defaultReviewers', '设置默认reviewers的列表（需要有reviewer列表的情况下使用）')
    .option('-q, --question', '问题模式,信息会经过确认,默认安静模式,有值的参数不会再询问')
    .option('-t, --title <titleStr>', '设置标题')
    .option('-r, --reviewers <reviewers>', '实时设置reviewers的列表: @liangkuaisheng@xxx@yyy')
    .option('-g, --group <group>', '分组名称')
    .option('-p, --project <project>', '项目名称')
    .option('-b, --branch <branch>', '目标分支名称')
    .option('<branch>', '目标分支名称')
    .option('<branch> <reviewers>', '目标分支名称 实时设置reviewers的列表: @liangkuaisheng@xxx@yyy')
    .parse(process.argv);

if (cmd.info) {
    console.log('-----------------mtpr工具使用说明------------------');
    console.log('------用来提交stash pull request并且发送大象消息.--------');
    console.log('------可以使用命令 mtpr');
    console.log('------可以使用命令 mtpr <目标分支>');
    console.log('------可以使用命令 mtpr -g 分组名称 -p 项目名称 -b 目标分支名称');
    console.log('------文档 http://wiki.sankuai.com/pages/viewpage.action?pageId=475101739');
    console.log('------可以在项目的package.json文件中添加 mtpr 属性,这样在使用mtpr命令的时候就可以不用输入了.');
    console.log(JSON.stringify(projectMtprDemo, null, '    '));
} else if (cmd.key) {
    PRMT.createKey(keyPath);
} else if (cmd.filepath) {
    inquirer.prompt([
            {
                type: 'input',
                name: 'reviewersfile',
                message: 'reviewers的列表json文件:文件绝对路径或者url?',
                validate: function (input) {
                    if (input === '' ||
                        input === null ||
                        input === undefined) {
                        return 'reviewers的列表文件:文件绝对路径或者url 不能为空!';
                    }
                    return true;
                }
            }
        ])
        .then(function (res) {
            var paramObj = _.cloneDeep(reviewersPath);
            paramObj.path = res.reviewersfile;
            fsextra.outputJson(reviewersfilePath, paramObj, function (err) {
                if (err) throw err;
                console.log('设置reviewer文件路径成功 !'.green);
            });
        });
} else if (cmd.defaultReviewers) {
    if (!reviewersPath.path) {
        console.log('请先使用mtpr -f 设置reviewer缓存文件路径'.red);
        return false;
    }
    $defer = readReviewerFile (reviewersPath.path);
    $defer
        .catch(function (err) {
            console.log(err);
            return [];
        })
        .then(function (defaultReviewersArr) {
            if (defaultReviewersArr.length === 0) {
                console.log('读取到的reviewer列表为空！'.red);
                return false;
            }
            var reviewersAskArr = [];
            defaultReviewersArr.forEach(function (reviewer) {
                reviewersAskArr.push({
                    name: reviewer.name + ' @' + reviewer.displayName,
                    value: reviewer,
                    checked: reviewer.checked
                });
            });
            inquirer.prompt([
                    {
                        type: 'checkbox',
                        name: 'reviewers',
                        message: '设置默认 reviewer (空格选中)?',
                        choices: reviewersAskArr,
                        validate: function (input) {
                            if (input.length === 0) {
                                return '不能为空';
                            }
                            return true;
                        },
                        filter: function (val) {
                            var resArr = [];
                            val.forEach(function (item) {
                                resArr.push(item.name);
                            });
                            return resArr;
                        }
                    }
                ])
                .then(function (res) {
                    var paramObj = _.cloneDeep(reviewersPath);
                    paramObj.defaultReviewers = res.reviewers;
                    fsextra.outputJson(reviewersfilePath, paramObj, function (err) {
                        if (err) throw err;
                        console.log('设置默认reviewer列表成功 !'.green);
                    });
                });
        });
} else {
    var reviewerfileStr = reviewersPath.path;
    if (!reviewerfileStr) {
        console.log('推荐先使用mtpr -f 设置reviewer缓存文件路径'.yellow);
        console.log('帮助文档wiki: http://wiki.sankuai.com/pages/viewpage.action?pageId=475101739'.yellow);
    }
    $defer = readReviewerFile (reviewerfileStr);
    $defer
        .catch(function (err) {
            console.log(err);
            return [];
        })
        .then(function (reviewerArr) {
            mtprInfo.reviewers = _.unionWith(mtprInfo.reviewers, reviewerArr, _.isEqual);
            _.forEach(mtprInfo.reviewers, function (value, key) {
                _.forEach(reviewersPath.defaultReviewers || [], function (item, index) {
                    if (value.name === item) {
                        value.checked = true;
                    }
                });
            });
            mtprInfo.reviewers.sort(function (item1, item2) {
                if (item1.checked) {
                    return -1;
                }
                if (item2.checked) {
                    return 1;
                }
                return 0;
            });

            if (cmd.question) {
                silence = false;
            }
            var args = cmd.args;
            var br = '';
            var reviewerStr = '';
            if (args && args.length > 0) {
                br = args[0];
            }
            if (args && args.length > 1) {
                reviewerStr = args[1];
            }
            reviewerStr = cmd.reviewers || reviewerStr;
            mtprInfo.group = cmd.group || mtprInfo.group || '';
            mtprInfo.project = cmd.project || mtprInfo.project || '';
            mtprInfo.branch = cmd.branch || br || mtprInfo.branch || '';
            mtprInfo.reviewers = mtprInfo.reviewers || [];
            mtprInfo.title = cmd.title || '';
            if (reviewerStr) {
                var reviewersArr = reviewerStr.split('@');
                _.forEach(reviewersArr, function (value, key) {
                    if (value !== '') {
                        mtprInfo.reviewers.unshift({
                            "name": value,
                            "displayName": value,
                            "checked": true
                        });
                    }
                });
            }

            function actions (arrRes) {
                var groupStr = mtprInfo.group || arrRes[0];
                var projectStr = mtprInfo.project || arrRes[1];
                return inquirer.prompt([
                        {
                            type: 'input',
                            name: 'group',
                            message: '你的分组名称?',
                            default: groupStr || '',
                            when: function (obj) {
                                return !(groupStr && silence);
                            },
                            validate: function (input) {
                                if (input === '' ||
                                    input === null ||
                                    input === undefined) {
                                    return '分组名称不能为空!';
                                }
                                return true;
                            }
                        },
                        {
                            type: 'input',
                            name: 'project',
                            message: '你的项目名称?',
                            default: projectStr || '',
                            when: function (obj) {
                                return !(projectStr && silence);
                            },
                            validate: function (input) {
                                if (input === '' ||
                                    input === null ||
                                    input === undefined) {
                                    return '项目名称不能为空!';
                                }
                                return true;
                            }
                        }
                    ])
                    .then(function (res) {
                        mtprInfo.group = res.group || groupStr;
                        mtprInfo.project = res.project || projectStr;
                        var pathObj = { //额外配置项（非必填）
                            keyPath: keyPath    // 加密密码缓存文件路径（非必填）
                        };
                        if (reviewersPathTemp) {
                            pathObj.reviewersPath = reviewersPathTemp;  // reviewer路径，可以是本地文件，可以是线上文件（非必填）
                        }
                        var pull = new PRMT({
                            projectKey: mtprInfo.group, // 组名称 （必填）
                            repositorySlug: mtprInfo.project, // 项目名称（必填）
                            defaultBranch: mtprInfo.branch,    // 项目默认目标分支,如master等（非必填）
                            reviewers: mtprInfo.reviewers || [],
                            title: mtprInfo.title
                        }, pathObj);
                        pull.send(silence);
                    });
            }

            git('config --get remote.origin.url', function (stdout) {
                var arrRes = ['', ''];
                if (stdout) {
                    var arr = stdout.match(/.*\/(.+)\/(.+)\.git\n$/);
                    if (arr && arr.length > 2) {
                        arrRes = [arr[1], arr[2]];
                    }
                }
                return arrRes;
            })
                .catch(function (err) {
                    console.log('请切换到含有git环境的目录中使用，或者手动输入信息！'.yellow);
                    return arrRes = ['', ''];
                })
                .then(function (arrRes) {
                    return actions(arrRes);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
}
