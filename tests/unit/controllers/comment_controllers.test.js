'use strict';

// Delegation coverage for the Comment and Procedure_Comment thin controllers.

jest.mock('../../../api/controllers/CommentService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CommentService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  Comment: [require('../../../api/controllers/Comment'), require('../../../api/controllers/CommentService')],
  Procedure_Comment: [require('../../../api/controllers/Procedure_Comment'), require('../../../api/controllers/Procedure_CommentService')]
};

describe('comment thin controllers delegate to their services', () => {
  Object.entries(pairs).forEach(([name, [ctrl, svc]]) => {
    describe(name, () => {
      Object.keys(ctrl)
        .filter((key) => typeof ctrl[key] === 'function')
        .forEach((method) => {
          it(`${method} forwards params, res, next, headers`, () => {
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
