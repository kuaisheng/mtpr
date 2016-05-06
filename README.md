```

    ------------------mtpr工具使用说明-------------------
    -------用来提交stash pull request并且发送大象消息.---------
    -------文档 http://wiki.sankuai.com/pages/viewpage.action?pageId=475101739
    -------可以在项目的package.json文件中添加 mtpr 属性,这样在使用mtpr命令的时候就可以不用输入了.
    
    
    -i, --info', '工具使用说明'
    -k, --key', '缓存git密码'
    -f, --filepath', '设置reviewers的列表文件:文件绝对路径或者url'
    -r, --reviewers <reviewers>', '实时设置reviewers的列表: @liangkuaisheng@xxx@yyy'
    -g, --group <group>', '分组名称'
    -p, --project <project>', '项目名称'
    -b, --branch <branch>', '目标分支名称'
    <branch>, '目标分支名称'
    <branch> <reviewers>, '目标分支名称 实时设置reviewers的列表: @liangkuaisheng@xxx@yyy'
 
```

```

    1、只能cd到有git的项目目录中执行，因为内部使用了git 的命令，如git config 、git log。
    2、cd 到项目目录
    3、mtpr调用
    4、mtpr -k 设置git账号密码，会进行加密缓存起来，下次就不会再问你密码了，要是不设置的话每次都会询问密码。
    5、mtpr -f 设置reviewer列表文件的位置（可以是本地json文件，也可以是线上json文件），会缓存起来，也可以不设置，配置在项目的package.json里边，
    如果都不做，则需要在执行命令的时候，执行mtpr -r @xxx@yyy，这样提供reviewer列表。
    6、需要分组名称和项目名称，可以配置在项目的package.json里边，也可以在执行mtpr的时候输入，
    也可以执行mtpr -g 分组 -p 项目  命令的方式提供。
    7、默认pr的目标分支名称，可以配置在项目的package.json里边，也可以在执行mtpr的时候输入,
    也可以在执行命令的时候提供，mtpr -b develop
    8、reviewer列表可以上传到网上（次高优先级），也可以直接在项目的package.json里边
    以reviewers: []属性的方式提供（最高优先级）。
    9、推荐在项目的package.json里边以下面的方式将组名，项目名，默认分支名，reviewer配置文件位置（mtpr -f 缓存起来也可以），都设置好，
    这样，你在使用的时候只需要输入 mtpr 命令就可以了。也可以不做任何设置，使用的时候mtpr -g xxx -p yyy -b zzz -r @sss@fffff
    10、缓存密码功能（mtpr -k），只是提供方便，不能保证你的密码安全，请自行决定是否使用，因为加密解密功能都是在代码的，你懂得！

```