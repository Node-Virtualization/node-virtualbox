var log4js = require('log4js'),
            logger;

log4js.configure({
    appenders: {
        out: {
            type: 'stdout',
            layout: {
                type: 'pattern',
                pattern: "%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] %c - %]%m",
            }
        }
    },
    categories: { default: { appenders: ['out'], level: 'info' } }
});

logger = log4js.getLogger("VirtualBox");

module.exports = logger;


