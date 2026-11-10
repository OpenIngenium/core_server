'use strict';

// Delegation coverage for the File and Procedure_File thin controllers.

jest.mock('../../../api/controllers/FileService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_FileService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  File: [require('../../../api/controllers/File'), require('../../../api/controllers/FileService')],
  Procedure_File: [require('../../../api/controllers/Procedure_File'), require('../../../api/controllers/Procedure_FileService')]
};

describe('file thin controllers delegate to their services', () => {
  Object.entries(pairs).forEach(([name, [ctrl, svc]]) => {
    describe(name, () => {
      Object.keys(ctrl)
        .filter((key) => typeof ctrl[key] === 'function')
        .forEach((method) => {
          it(`${method} forwards params, res, next`, () => {
            const req = { swagger: { params: { p: 1 } }, headers: { h: 'v' } };
            const res = {};
            const next = () => {};
            ctrl[method](req, res, next);
            const spy = svc[method];
            expect(spy).toHaveBeenCalledTimes(1);
            const callArgs = spy.mock.calls[0];
            expect(callArgs[0]).toBe(req.swagger.params);
            expect(callArgs[1]).toBe(res);
            expect(callArgs[2]).toBe(next);
          });
        });
    });
  });
});
