'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/api/health', controller.health.index);
  router.get('/api/mock/cities', controller.mock.cities);
  router.get('/api/mock/employees', controller.mock.employees);

  router.get('/api/forms', controller.form.index);
  router.get('/api/forms/:id', controller.form.show);
  router.post('/api/forms', controller.form.create);
  router.put('/api/forms/:id', controller.form.update);
  router.delete('/api/forms/:id', controller.form.destroy);

  router.get('/api/datasets', controller.dataset.index);
  router.get('/api/datasets/:id', controller.dataset.show);
  router.post('/api/datasets', controller.dataset.create);
  router.put('/api/datasets/:id', controller.dataset.update);
  router.delete('/api/datasets/:id', controller.dataset.destroy);
  router.post('/api/datasets/:id/preview', controller.dataset.preview);
  router.post('/api/datasets/:id/options', controller.dataset.options);

  router.get('/api/fields', controller.field.index);
  router.get('/api/fields/:id', controller.field.show);
  router.post('/api/fields', controller.field.create);
  router.put('/api/fields/:id', controller.field.update);
  router.delete('/api/fields/:id', controller.field.destroy);
  router.get('/api/fields/:id/options', controller.field.options);
};
