// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportDataset = require('../../../app/controller/dataset');
import ExportField = require('../../../app/controller/field');
import ExportForm = require('../../../app/controller/form');
import ExportHealth = require('../../../app/controller/health');
import ExportMock = require('../../../app/controller/mock');

declare module 'egg' {
  interface IController {
    dataset: ExportDataset;
    field: ExportField;
    form: ExportForm;
    health: ExportHealth;
    mock: ExportMock;
  }
}
