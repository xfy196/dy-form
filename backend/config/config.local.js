'use strict';

module.exports = () => {
  const config = {};

  config.mysql = {
    client: {
      host: 'localhost',
      port: '3306',
      user: 'root',
      password: 'root',
      database: 'dy-form-dev',
      charset: 'utf8mb4',
    },
  };

  return config;
};
