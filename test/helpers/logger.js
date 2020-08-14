const log4js = require('log4js'),
  defaultLoggingConfig = {
    appenders: {
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] %c - %]%m',
        },
      },
    },
    categories: { default: { appenders: ['out'], level: 'debug' } },
  };

log4js.configure(defaultLoggingConfig);

module.exports.logger = log4js.getLogger('VboxTestLogger');
