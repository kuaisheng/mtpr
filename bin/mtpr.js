#!/usr/bin/env node

var colors = require('colors');
var path = require('path');
var cmd = require('commander');
var inquirer = require('inquirer');
var PRMT = require('@mtfe/pull-request-mt');
var projectPath = process.cwd();
var cwd = __dirname;

var appInfo = require('./../package.json');
var projectMtprDemo = require('./../package-demo.json');
var projectInfo = require(path.join(projectPath, './package.json'));

var mtprInfo = projectInfo.mtpr || {};
var keyPath = path.join(cwd, './../key.json');

cmd
    //.allowUnknownOption()
    .version(appInfo.version)
    .option('-i, --info', '工具使用说明')
    .option('-k, --key', '缓存git密码')
    .option('-g, --group <group>', '分组名称')
    .option('-p, --project <project>', '项目名称')
    .option('-b, --branch <branch>', '默认分支名称')
    .parse(process.argv);

if (cmd.info) {
    console.log('-----------------mtpr工具使用说明------------------');
    console.log('------用来提交stash pull request并且发送大象消息.--------');
    console.log('------可以使用命令 mtpr ,但是过程中需要输入分组名称,项目名称');
    console.log('------可以使用命令 mtpr -g 分组名称 -p 项目名称 -b 默认分支名称');
    console.log('------文档 http://wiki.sankuai.com/pages/viewpage.action?pageId=472845034');
    console.log('------可以在项目的package.json文件中添加 mtpr 属性,这样在使用mtpr命令的时候就可以不用输入了.');
    console.log(JSON.stringify(projectMtprDemo, null, '    '));
}

if (cmd.key) {
    PRMT.createKey(keyPath);
} else {
    mtprInfo.group = cmd.group || mtprInfo.group || '';
    mtprInfo.project = cmd.project || mtprInfo.project || '';
    mtprInfo.branch = cmd.branch || mtprInfo.branch || '';

    inquirer.prompt([
            {
                type: 'input',
                name: 'group',
                message: '你的分组名称?',
                when: function () {
                    return mtprInfo.group === '';
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
                when: function () {
                    return mtprInfo.project === '';
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
            mtprInfo.group = res.group || mtprInfo.group;
            mtprInfo.project = res.project || mtprInfo.project;
            var pathObj = { //额外配置项（非必填）
                keyPath: keyPath    // 加密密码缓存文件路径（非必填）
            };
            if (mtprInfo.reviewerfilename) {
                pathObj.reviewersPath = mtprInfo.reviewerfilename;  // reviewer路径，可以是本地文件，可以是线上文件（非必填）
            }
            var pull = new PRMT({
                projectKey: mtprInfo.group, // 组名称 （必填）
                repositorySlug: mtprInfo.project, // 项目名称（必填）
                defaultBranch: mtprInfo.branch,    // 项目默认目标分支,如master等（非必填）
                reviewers: mtprInfo.reviewers || []
            }, pathObj);
            pull.send();
        });
}
