```

    console.log('-----------------mtpr工具使用说明------------------');
    console.log('------用来提交stash pull request并且发送大象消息.--------');
    console.log('------可以使用命令 mtpr ,但是过程中需要输入分组名称,项目名称');
    console.log('------可以使用命令 mtpr -g 分组名称 -p 项目名称 -b 默认分支名称');
    console.log('------文档 http://wiki.sankuai.com/pages/viewpage.action?pageId=472845034');
    console.log('------可以在项目的package.json文件中添加 mtpr 属性,这样在使用mtpr命令的时候就可以不用输入了.');
    
    
    .option('-i, --info', '工具使用说明')
    .option('-k, --key', '缓存git密码')
    .option('-f, --filepath', '设置reviewers的列表文件:文件绝对路径或者url')
    .option('-r, --reviewers <reviewers>', '实时设置reviewers的列表: @liangkuaisheng@xxx@yyy')
    .option('-g, --group <group>', '分组名称')
    .option('-p, --project <project>', '项目名称')
    .option('-b, --branch <branch>', '默认分支名称')
 
```