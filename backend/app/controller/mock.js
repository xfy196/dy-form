'use strict';

const { Controller } = require('egg');

const CITIES = [
  { code: 'bj', name: '北京', region: '华北' },
  { code: 'sh', name: '上海', region: '华东' },
  { code: 'gz', name: '广州', region: '华南' },
  { code: 'sz', name: '深圳', region: '华南' },
  { code: 'hz', name: '杭州', region: '华东' },
  { code: 'cd', name: '成都', region: '西南' },
  { code: 'wh', name: '武汉', region: '华中' },
  { code: 'xa', name: '西安', region: '西北' },
];

/** Demo upstream data for dataset preview / options mapping */
class MockController extends Controller {
  async cities() {
    const { ctx } = this;
    const keyword = String(ctx.query.keyword || ctx.query.q || '').trim().toLowerCase();
    let list = CITIES;
    if (keyword) {
      list = CITIES.filter(item =>
        item.name.includes(keyword) ||
        item.code.includes(keyword) ||
        item.region.includes(keyword)
      );
    }
    ctx.body = {
      code: 0,
      data: { list },
    };
  }
}

module.exports = MockController;
