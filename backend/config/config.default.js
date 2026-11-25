'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /** @type Egg.EggAppConfig */
  const config = (exports = {});

  config.keys = appInfo.name + '_dy_form_secret_key';

  config.middleware = [];

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };

  config.mysql = {
    client: {
      host: 'localhost',
      port: '3306',
      user: 'root',
      password: 'root',
      database: 'dy-form-dev',
      charset: 'utf8mb4',
    },
    app: true,
    agent: false,
  };

  config.bodyParser = {
    jsonLimit: '2mb',
  };

  // 数据集相对路径（如 /api/mock/cities）拼绝对地址时使用
  config.datasetBaseUrl = 'http://127.0.0.1:7001';

  return config;
};
