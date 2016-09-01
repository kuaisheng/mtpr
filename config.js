/**
 * 作者:      liangkuaisheng
 * 时间:      16/8/31
 * 功能:      配置文件
 */

module.exports = {
    Home_Path: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
    CmdExePath: process.cwd(),
    ProjectPath: __dirname,
    KeyFile: '.mtpr.key',
    ConfigFile: '.mtpr.json',
    OPEN_FILE: false,
    setConfigMtprs: function (cmd) {
        this.OPEN_FILE = cmd.open;
    }
};
