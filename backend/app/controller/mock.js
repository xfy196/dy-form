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

const DEPTS = [
  { deptCode: 'rd', deptName: '研发中心', titles: [ '工程师', '高级工程师', '架构师' ], tags: [ '后端', '前端', 'Node', 'Vue' ] },
  { deptCode: 'pm', deptName: '产品部', titles: [ '产品经理', '高级产品经理' ], tags: [ '产品', 'B端' ] },
  { deptCode: 'design', deptName: '设计中心', titles: [ 'UI 设计', '交互设计' ], tags: [ '设计', 'Figma' ] },
  { deptCode: 'qa', deptName: '质量保障', titles: [ '测试工程师', '自动化测试' ], tags: [ '测试', '自动化' ] },
  { deptCode: 'ops', deptName: '运营中心', titles: [ '运营专员', '增长运营' ], tags: [ '运营', '增长' ] },
  { deptCode: 'hr', deptName: '人力资源', titles: [ 'HRBP', '招聘专员' ], tags: [ 'HR', '招聘' ] },
];

const STATUSES = [ 'active', 'active', 'active', 'inactive', 'leave' ];
const CITIES_POOL = [ '杭州', '上海', '深圳', '北京', '广州', '成都', '武汉', '西安' ];
const SURNAMES = [ '张', '李', '王', '赵', '孙', '周', '吴', '郑', '冯', '陈' ];
const GIVEN = [ '伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超' ];

/** 默认总人数；可通过 query.total 覆盖（上限 2000） */
const DEFAULT_EMPLOYEE_TOTAL = 200;

/**
 * 动态生成员工列表，便于验证分页
 * @param {number} total - 总条数
 * @returns {Array<object>}
 */
function buildEmployees(total) {
  const list = [];
  const size = Math.max(1, Math.min(2000, Number(total) || DEFAULT_EMPLOYEE_TOTAL));
  for (let i = 1; i <= size; i++) {
    const dept = DEPTS[(i - 1) % DEPTS.length];
    const title = dept.titles[(i - 1) % dept.titles.length];
    const level = ((i - 1) % 4) + 1;
    const status = STATUSES[(i - 1) % STATUSES.length];
    const city = CITIES_POOL[(i - 1) % CITIES_POOL.length];
    const name = `${SURNAMES[(i - 1) % SURNAMES.length]}${GIVEN[(i - 1) % GIVEN.length]}`;
    const userName = `user${String(i).padStart(4, '0')}`;
    const tagA = dept.tags[(i - 1) % dept.tags.length];
    const tagB = dept.tags[i % dept.tags.length];
    list.push({
      userId: `u${1000 + i}`,
      empNo: `E${1000 + i}`,
      userName,
      displayName: `${name}（${title}）`,
      deptCode: dept.deptCode,
      deptName: dept.deptName,
      level,
      status,
      city,
      email: `${userName}@example.com`,
      tags: tagA === tagB ? [ tagA ] : [ tagA, tagB ],
    });
  }
  return list;
}

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

  /**
   * 复杂演示上游：动态生成员工 + 嵌套信封 + 分页 + 多条件筛选
   * data_path 示例：payload.items
   * 常用映射：value=userId，label=displayName
   * Query：keyword/q、status、deptCode、page、pageSize、total（数据集规模，默认 200）
   */
  async employees() {
    const { ctx } = this;
    const keyword = String(ctx.query.keyword || ctx.query.q || '').trim().toLowerCase();
    const status = String(ctx.query.status || '').trim();
    const deptCode = String(ctx.query.deptCode || '').trim();
    const page = Math.max(1, Number(ctx.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(ctx.query.pageSize) || 10));
    const poolTotal = Number(ctx.query.total) || DEFAULT_EMPLOYEE_TOTAL;

    let list = buildEmployees(poolTotal);
    if (status) {
      list = list.filter(item => item.status === status);
    }
    if (deptCode) {
      list = list.filter(item => item.deptCode === deptCode);
    }
    if (keyword) {
      list = list.filter(item =>
        item.userId.toLowerCase().includes(keyword) ||
        item.empNo.toLowerCase().includes(keyword) ||
        item.userName.toLowerCase().includes(keyword) ||
        item.displayName.toLowerCase().includes(keyword) ||
        item.deptName.includes(keyword) ||
        item.city.includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }

    const total = list.length;
    const start = (page - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    ctx.body = {
      code: 0,
      message: 'success',
      meta: {
        requestId: `mock-${Date.now()}`,
        timestamp: Date.now(),
      },
      payload: {
        pagination: {
          total,
          page,
          pageSize,
          hasMore: start + items.length < total,
        },
        items,
      },
    };
  }
}

module.exports = MockController;
