'use strict';

// Delegation coverage for the procedure-section thin controllers.

jest.mock('../../../api/controllers/ProcedureSectionService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_ProcedureSectionService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  ProcSection: [require('../../../api/controllers/ProcSection'), require('../../../api/controllers/ProcedureSectionService')],
  Procedure_Procedure_Section: [require('../../../api/controllers/Procedure_Procedure_Section'), require('../../../api/controllers/Procedure_ProcedureSectionService')]
};

describe('procedure-section thin controllers delegate to their services', () => {
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
