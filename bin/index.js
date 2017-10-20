#!/usr/bin/env node
/**
 * 作者:      liangkuaisheng
 * 时间:      16/8/31
 * 功能:      xx
 */
var cmd = require('commander');
var appInfo = require('./../package.json');
var AddMem = require('./../add-members.js');
var Config = require('./../config.js');

cmd
//.allowUnknownOption()
    .version(appInfo.version)
    .option('-f, --file <filename>', '新增人员列表文件(绝对路径)')
    .option('-n, --new <filename>', '输出新的列表文件(绝对路径)')
    .option('-m, --member <namestr>', '要添加的人的姓名/misId格式: 梁快升/kuaisheng#举个栗子/lizi')
    .option('-o, --open', '打开文件和工具')
    .parse(process.argv);

Config.setConfigMtprs(cmd);

if (cmd.file || cmd.member) {
    AddMem(cmd.file, cmd.member, cmd.new);
}
