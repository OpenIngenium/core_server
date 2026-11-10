'use strict';

// Verifies each thin Procedure_* step controller delegates to its service,
// forwarding swagger params, res, next and request headers.

jest.mock('../../../api/controllers/Procedure_ANALYSISService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_BUS_1553Service', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CHECK_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CMDService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CMD_FILEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CMD_SCMFService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CMD_SSEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_CUSTOM_SCRIPTService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_EnvironmentService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_GDSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_GET_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_GRAPH_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_LIST_DATA_PRODUCTSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_MANUAL_VERFICATIONService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_Manual_EIPService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_Manual_InputService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_QUERY_EVRService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_TIME_REFERENCEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_UPDATE_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_VERIFY_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_VIService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_VI_STATUSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_WAITService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_WAIT_DATA_PRODUCTSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_WAIT_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_WAIT_EVRService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Procedure_Venue_ConfigService', () => require('../mocks/proxyServiceMock')());

const modules = [
  'Procedure_ANALYSIS', 'Procedure_BUS_1553', 'Procedure_CHECK_CONFIG', 'Procedure_CMD',
  'Procedure_CMD_FILE', 'Procedure_CMD_SCMF', 'Procedure_CMD_SSE', 'Procedure_CUSTOM_SCRIPT',
  'Procedure_Environment', 'Procedure_GDS', 'Procedure_GET_CONFIG', 'Procedure_GRAPH_EHA',
  'Procedure_LIST_DATA_PRODUCTS', 'Procedure_MANUAL_VERFICATION', 'Procedure_Manual_EIP',
  'Procedure_Manual_Input', 'Procedure_QUERY_EVR', 'Procedure_TIME_REFERENCE',
  'Procedure_UPDATE_CONFIG', 'Procedure_VERIFY_EHA', 'Procedure_VI', 'Procedure_VI_STATUS',
  'Procedure_WAIT', 'Procedure_WAIT_DATA_PRODUCTS', 'Procedure_WAIT_EHA', 'Procedure_WAIT_EVR',
  'Procedure_Venue_Config'
];

const pairs = {};
modules.forEach((m) => {
  pairs[m] = [
    require(`../../../api/controllers/${m}`),
    require(`../../../api/controllers/${m}Service`)
  ];
});

describe('thin Procedure_* step controllers delegate to their services', () => {
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
