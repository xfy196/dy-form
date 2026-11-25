'use strict';

const { Controller } = require('egg');

class HealthController extends Controller {
  async index() {
    const { ctx, app } = this;
    try {
      await app.mysql.query('SELECT 1');
      ctx.body = { code: 0, message: 'ok', data: { mysql: true } };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        code: 1,
        message: err instanceof Error ? err.message : 'db unavailable',
        data: { mysql: false },
      };
    }
  }
}

module.exports = HealthController;
