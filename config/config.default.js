/* eslint valid-jsdoc: "off" */

'use strict'

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1581153409405_8173'

  // add your middleware config here
  config.middleware = [ 'jwt' ]
  config.mongo = {
    clients: {
      oj: {
        host: 'localhost',
        port: '27017',
        name: 'zjyc-oj',
        user: 'zjz236',
        password: 'zjz1236'
      }
    }
  }
  config.jwt = {
    ignore: [ '/exam/getExamList', '/exam/getExamInfo', '/account/getPublicKey', '/account/login', '/ide/addIDEData', '/ide/getIDEData' ]
  }
  // csrf配置
  config.security = {
    csrf: {
      enable: false
    }
  }

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }

  return {
    ...config,
    ...userConfig
  }
}
