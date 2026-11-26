'use strict';

module.exports = () => {
  const config = {};

  config.mysql = {
    client: {
      host: '192.168.3.122',
      port: '3306',
      user: 'root',
      password: '123456',
      database: 'dy-form-dev',
      charset: 'utf8mb4',
    },
  };

  return config;
};
