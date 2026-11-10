'use strict';

// Delegation coverage for the large thin controllers.

jest.mock('../../../api/controllers/ProceduresService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/ProcedureService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/ExecutionService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_VersionsService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  Procedures: [require('../../../api/controllers/Procedures'), require('../../../api/controllers/ProceduresService')],
  Procedure: [require('../../../api/controllers/Procedure'), require('../../../api/controllers/ProcedureService')],
  Execution: [require('../../../api/controllers/Execution'), require('../../../api/controllers/ExecutionService')],
  Procedure_Versions: [require('../../../api/controllers/Procedure_Versions'), require('../../../api/controllers/Procedure_VersionsService')]
};

describe('large thin controllers delegate to their services', () => {
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
