'use strict';

// Step controller/service families that are fully unit-tested (both the thin
// controller and its *Service implementation reach 100% coverage).
const stepModules = [
  'ANALYSIS', 'BUS_1553', 'CHECK_CONFIG', 'CMD', 'CMD_FILE', 'CMD_SCMF',
  'CMD_SSE', 'CUSTOM_SCRIPT', 'Environment', 'GDS', 'GET_CONFIG', 'GRAPH_EHA',
  'LIST_DATA_PRODUCTS', 'MANUAL_VERFICATION', 'Manual_EIP', 'Manual_Input',
  'QUERY_EVR', 'TIME_REFERENCE', 'UPDATE_CONFIG', 'VERIFY_EHA', 'VI',
  'VI_STATUS', 'WAIT', 'WAIT_DATA_PRODUCTS', 'WAIT_EHA', 'WAIT_EVR', 'Venue_Config'
];

// Parallel authoring-side (procedure) step controller/service families.
const procedureStepModules = [
  'Procedure_ANALYSIS', 'Procedure_BUS_1553', 'Procedure_CHECK_CONFIG', 'Procedure_CMD',
  'Procedure_CMD_FILE', 'Procedure_CMD_SCMF', 'Procedure_CMD_SSE', 'Procedure_CUSTOM_SCRIPT',
  'Procedure_Environment', 'Procedure_GDS', 'Procedure_GET_CONFIG', 'Procedure_GRAPH_EHA',
  'Procedure_LIST_DATA_PRODUCTS', 'Procedure_MANUAL_VERFICATION', 'Procedure_Manual_EIP',
  'Procedure_Manual_Input', 'Procedure_QUERY_EVR', 'Procedure_TIME_REFERENCE',
  'Procedure_UPDATE_CONFIG', 'Procedure_VERIFY_EHA', 'Procedure_VI', 'Procedure_VI_STATUS',
  'Procedure_WAIT', 'Procedure_WAIT_DATA_PRODUCTS', 'Procedure_WAIT_EHA', 'Procedure_WAIT_EVR',
  'Procedure_Venue_Config'
];

// Content (non-step) controller/service families with full coverage.
const miscModules = [
  'Section', 'Paragraph', 'TOC', 'Step',
  'Procedure_Section', 'Procedure_Paragraph', 'Procedure_TOC', 'Procedure_Step', 'Procedure_Element',
  'Venue', 'VenueGroup',
  'Comment', 'Procedure_Comment',
  'File', 'Procedure_File'
];

const stepFiles = stepModules
  .concat(procedureStepModules)
  .concat(miscModules)
  .reduce((acc, m) => {
    acc.push(`api/controllers/${m}.js`);
    acc.push(`api/controllers/${m}Service.js`);
    return acc;
  }, []);

// Every first-party source file that currently has complete unit-test coverage.
const fullyCovered = [
  'config.js',
  'api/search_definitions.js',
  'api/step_definitions.js',
  'api/controllers/Health.js',
  'api/controllers/HealthService.js',
  'api/controllers/Logging.js',
  'api/controllers/LoggingService.js',
  // Procedure-section controllers/services (mismatched controller/service names)
  'api/controllers/ProcSection.js',
  'api/controllers/ProcedureSectionService.js',
  'api/controllers/Procedure_Procedure_Section.js',
  'api/controllers/Procedure_ProcedureSectionService.js',
  // Large controllers (fully covered) and their completed services
  'api/controllers/Procedures.js',
  'api/controllers/ProceduresService.js',
  'api/controllers/Procedure.js',
  'api/controllers/ProcedureService.js',
  'api/controllers/Execution.js',
  'api/controllers/ExecutionService.js',
  'api/controllers/Procedure_Versions.js',
  ...stepFiles
];

const FULL = { branches: 100, functions: 100, statements: 100, lines: 100 };

// Files that are fully covered except for one or more branches that cannot be
// exercised without triggering existing latent defects (documented per file).
// Procedure_VersionsService.update_version_status dereferences
// version_status_input.action before the null-coalescing branch can be taken,
// so the `undefined -> null` branch is unreachable without a 500.
const partiallyCovered = {
  'api/controllers/Procedure_VersionsService.js': { branches: 99, functions: 100, statements: 100, lines: 100 }
};

const coverageThreshold = fullyCovered.reduce((acc, file) => {
  acc[`./${file}`] = FULL;
  return acc;
}, {});

Object.keys(partiallyCovered).forEach((file) => {
  coverageThreshold[`./${file}`] = partiallyCovered[file];
});

// api/node_funcs.js is a large legacy module still being migrated from the
// retired Python integration suite. The bulk of the remaining uncovered code is
// integration-heavy (targz archive export/import, streaming HTML rewriting,
// filesystem staging) that cannot be exercised as isolated unit tests without
// real I/O. A floor threshold locks in the coverage achieved so far so it can
// only ratchet upward as more of the module is migrated.
coverageThreshold['./api/node_funcs.js'] = {
  branches: 64,
  functions: 73,
  statements: 75,
  lines: 75
};

module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/tests/unit/**/*.test.js'
  ],

  setupFiles: [
    '<rootDir>/tests/unit/setupEnv.js'
  ],

  // Coverage is collected from first-party source that currently has unit
  // tests. As additional modules are migrated from the legacy Python
  // integration suite, add them here.
  collectCoverageFrom: [
    ...fullyCovered,
    ...Object.keys(partiallyCovered),
    'api/node_funcs.js'
  ],

  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],

  // Modules that are fully covered enforce a 100% policy so regressions fail
  // CI. api/node_funcs.js is a large legacy module still being migrated, so it
  // is measured without a hard threshold for now.
  coverageThreshold
};
