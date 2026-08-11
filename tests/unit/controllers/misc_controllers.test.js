'use strict';

// Delegation coverage for the non-step content controllers and their
// procedure-side counterparts.

jest.mock('../../../api/controllers/SectionService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/ParagraphService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/TOCService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/StepService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_SectionService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_ParagraphService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_TOCService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_StepService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_ElementService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  Section: [require('../../../api/controllers/Section'), require('../../../api/controllers/SectionService')],
  Paragraph: [require('../../../api/controllers/Paragraph'), require('../../../api/controllers/ParagraphService')],
  TOC: [require('../../../api/controllers/TOC'), require('../../../api/controllers/TOCService')],
  Step: [require('../../../api/controllers/Step'), require('../../../api/controllers/StepService')],
  Procedure_Section: [require('../../../api/controllers/Procedure_Section'), require('../../../api/controllers/Procedure_SectionService')],
  Procedure_Paragraph: [require('../../../api/controllers/Procedure_Paragraph'), require('../../../api/controllers/Procedure_ParagraphService')],
  Procedure_TOC: [require('../../../api/controllers/Procedure_TOC'), require('../../../api/controllers/Procedure_TOCService')],
  Procedure_Step: [require('../../../api/controllers/Procedure_Step'), require('../../../api/controllers/Procedure_StepService')],
  Procedure_Element: [require('../../../api/controllers/Procedure_Element'), require('../../../api/controllers/Procedure_ElementService')]
};

describe('misc thin controllers delegate to their services', () => {
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
            expect(callArgs[3]).toBe(req.headers);
          });
        });
    });
  });
});
