var log4js = require("log4js");

log4js.configure({　　
    appenders: [　　　　{　
        type: 'console'　　　　
    }, 　　　　 {　　　　　　
        type: 'dateFile',
        　　　　　　filename: 'www/logs/log',
		　　　　　　pattern: "-yyyy-MM-dd.log",
		　　　　　　maxLogSize: 1024,
		　　　　　　alwaysIncludePattern: true,
        　　　　　　 //backups: 4 //日志备份数量，大于该数则自动删除
        　　　　　　 // category: 'normal' //这个破玩儿，加上就写不到文件中去了
        　　　　
    }　　],
    　　replaceConsole: true
});

// log4js.setGlobalLogLevel(log4js.levels.ERROR);
log4js.setGlobalLogLevel(log4js.levels.INFO);
// log4js.setGlobalLogLevel(log4js.levels.TRACE);

exports.setLogLevel = function(level) {　　
    log4js.setGlobalLogLevel(level || log4js.levels.DEBUG);
};

exports.getLogger = function(file) {　　
    return log4js.getLogger(file || "dateFileLog");
};