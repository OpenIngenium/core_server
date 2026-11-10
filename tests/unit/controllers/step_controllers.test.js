'use strict';

// Verifies that every thin step controller delegates each request to the
// same-named service function, forwarding swagger params, res, next and the
// request headers. Services are mocked with a caching jest.fn proxy so that
// delegation can be asserted (and covered) uniformly.

jest.mock('../../../api/controllers/BUS_1553Service', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CHECK_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CMDService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CMD_FILEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CMD_SCMFService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CMD_SSEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/CUSTOM_SCRIPTService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/EnvironmentService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/GDSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/GET_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/GRAPH_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/LIST_DATA_PRODUCTSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/MANUAL_VERFICATIONService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Manual_EIPService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Manual_InputService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/QUERY_EVRService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/TIME_REFERENCEService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/UPDATE_CONFIGService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/VERIFY_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/VIService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/VI_STATUSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/WAITService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/WAIT_DATA_PRODUCTSService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/WAIT_EHAService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/WAIT_EVRService', () => require('../mocks/proxyServiceMock')());
jest.mock('../../../api/controllers/Venue_ConfigService', () => require('../mocks/proxyServiceMock')());

const pairs = {
  BUS_1553: [require('../../../api/controllers/BUS_1553'), require('../../../api/controllers/BUS_1553Service')],
  CHECK_CONFIG: [require('../../../api/controllers/CHECK_CONFIG'), require('../../../api/controllers/CHECK_CONFIGService')],
  CMD: [require('../../../api/controllers/CMD'), require('../../../api/controllers/CMDService')],
  CMD_FILE: [require('../../../api/controllers/CMD_FILE'), require('../../../api/controllers/CMD_FILEService')],
  CMD_SCMF: [require('../../../api/controllers/CMD_SCMF'), require('../../../api/controllers/CMD_SCMFService')],
  CMD_SSE: [require('../../../api/controllers/CMD_SSE'), require('../../../api/controllers/CMD_SSEService')],
  CUSTOM_SCRIPT: [require('../../../api/controllers/CUSTOM_SCRIPT'), require('../../../api/controllers/CUSTOM_SCRIPTService')],
  Environment: [require('../../../api/controllers/Environment'), require('../../../api/controllers/EnvironmentService')],
  GDS: [require('../../../api/controllers/GDS'), require('../../../api/controllers/GDSService')],
  GET_CONFIG: [require('../../../api/controllers/GET_CONFIG'), require('../../../api/controllers/GET_CONFIGService')],
  GRAPH_EHA: [require('../../../api/controllers/GRAPH_EHA'), require('../../../api/controllers/GRAPH_EHAService')],
  LIST_DATA_PRODUCTS: [require('../../../api/controllers/LIST_DATA_PRODUCTS'), require('../../../api/controllers/LIST_DATA_PRODUCTSService')],
  MANUAL_VERFICATION: [require('../../../api/controllers/MANUAL_VERFICATION'), require('../../../api/controllers/MANUAL_VERFICATIONService')],
  Manual_EIP: [require('../../../api/controllers/Manual_EIP'), require('../../../api/controllers/Manual_EIPService')],
  Manual_Input: [require('../../../api/controllers/Manual_Input'), require('../../../api/controllers/Manual_InputService')],
  QUERY_EVR: [require('../../../api/controllers/QUERY_EVR'), require('../../../api/controllers/QUERY_EVRService')],
  TIME_REFERENCE: [require('../../../api/controllers/TIME_REFERENCE'), require('../../../api/controllers/TIME_REFERENCEService')],
  UPDATE_CONFIG: [require('../../../api/controllers/UPDATE_CONFIG'), require('../../../api/controllers/UPDATE_CONFIGService')],
  VERIFY_EHA: [require('../../../api/controllers/VERIFY_EHA'), require('../../../api/controllers/VERIFY_EHAService')],
  VI: [require('../../../api/controllers/VI'), require('../../../api/controllers/VIService')],
  VI_STATUS: [require('../../../api/controllers/VI_STATUS'), require('../../../api/controllers/VI_STATUSService')],
  WAIT: [require('../../../api/controllers/WAIT'), require('../../../api/controllers/WAITService')],
  WAIT_DATA_PRODUCTS: [require('../../../api/controllers/WAIT_DATA_PRODUCTS'), require('../../../api/controllers/WAIT_DATA_PRODUCTSService')],
  WAIT_EHA: [require('../../../api/controllers/WAIT_EHA'), require('../../../api/controllers/WAIT_EHAService')],
  WAIT_EVR: [require('../../../api/controllers/WAIT_EVR'), require('../../../api/controllers/WAIT_EVRService')],
  Venue_Config: [require('../../../api/controllers/Venue_Config'), require('../../../api/controllers/Venue_ConfigService')]
};

describe('thin step controllers delegate to their services', () => {
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
