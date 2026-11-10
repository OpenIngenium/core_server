'use strict';

const field_map = {
  TITLE: {
    'title': {
      replaceable: true,
      is_html: false
    }
  },
  DESCRIPTION: {
    'description': {
      replaceable: true,
      is_html: true
    }
  },
  ELEM_TYPE: {
    'elem_type': {
      replaceable: false,
      is_html: false
    }
  },
  STEP_TYPE: {
    'step_type': {
      replaceable: false,
      is_html: false
    }
  },
  STATUS: {
    'execution.meta_data.status': {
      replaceable: false,
      is_html: false
    }
  },      
  COMMENT: {
    'conversations.comments.content': {
      replaceable: false,
      is_html: true
    }
  },
  START_TIME: {
    '.start_time': {
      replaceable: true,
      is_html: false
    } 
  },  
  END_TIME: {
    '.end_time': {
      replaceable: true,
      is_html: false
    } 
  },
  DURATION: {
    '.duration': {
      replaceable: true,
      is_html: false
    },
    '.time_value': {
      replaceable: true,
      is_html: false
    }, 
  },
  TIMEOUT: {
    '.timeout': {
      replaceable: true,
      is_html: false
    },
    '.entries.timeout': {
      replaceable: true,
      is_html: false
    },
  },  
  LOOKBACK: {
    '.lookback': {
      replaceable: true,
      is_html: false
    } 
  },  
  DATA_PATH: {
    '.data_path': {
      replaceable: true,
      is_html: false
    },
    '.entries.data_path': {
      replaceable: true,
      is_html: false
    }    
  },
  COMMAND_STRING: {
    '.entries.cmd_string': {
      replaceable: true,
      is_html: false
    },    
  },
  EVR_NAME: {
    '.evr_name': {
      replaceable: true,
      is_html: false
    },
    '.entries.evr_name': {
      replaceable: true,
      is_html: false
    },
  },
  CHANNEL_NAME: {
    '.entries.channel_name': {
      replaceable: true,
      is_html: false
    },
  },
  CHANNEL_ID: {
    '.entries.channel_id': {
      replaceable: true,
      is_html: false
    },
  }
};

const searchable_field_map = {
  // Common
  'title': {
    replaceable: true,
    is_html: false
  },
  'description': {
    replaceable: true,
    is_html: true
  },
  'elem_type': {
    replaceable: false,
    is_html: false
  },  
  'step_type': {
    replaceable: false,
    is_html: false
  }, 
  'conversations.comments.content': {
    replaceable: false,
    is_html: true
  },
  // Procedure Section
  '.reference_procedure_id': {
    replaceable: false,
    is_html: false
  },
  '.reference_procedure_title': {
    replaceable: false,
    is_html: false
  },
  '.reference_procedure_institutional_id': {
    replaceable: false,
    is_html: false
  },
  '.reference_procedure_institutional_release_id': {
    replaceable: false,
    is_html: false
  },
  // Manual Input
  '.entries.name': {
    replaceable: true,
    is_html: false
  },
  '.entries.verification_values': {
    replaceable: true,
    is_html: false
  },  
  '.entries.actual_value': {
    replaceable: false,
    is_html: false
  },
  // Manual EIP
  '.entries.signal_name': {
    replaceable: true,
    is_html: false
  },
  '.entries.icds': {
    replaceable: true,
    is_html: false
  },
  '.entries.from': {
    replaceable: true,
    is_html: false
  },
  '.entries.to': {
    replaceable: true,
    is_html: false
  },
  '.entries.unit': {
    replaceable: false,
    is_html: false
  },
  '.entries.min_value': {
    replaceable: true,
    is_html: false
  },
  '.entries.max_value': {
    replaceable: true,
    is_html: false
  },
  '.entries.measured_unit': {
    replaceable: false,
    is_html: false
  },
  // Venue Config
  '.fsw_version': {
    replaceable: true,
    is_html: false
  },  
  '.sse_version': {
    replaceable: true,
    is_html: false
  },
  '.fsw_dictionary': {
    replaceable: true,
    is_html: false
  },
  '.sse_dictionary': {
    replaceable: true,
    is_html: false
  },
  '.gds_version': {
    replaceable: true,
    is_html: false
  },
  // Environment (none)
  // GDS Manual
  '.default_cmd_string': {
    replaceable: false,
    is_html: false
  },
  '.entries.data_path': {
    replaceable: true,
    is_html: false
  },
  '.entries.session_id': {
    replaceable: false,
    is_html: false
  },  
  // Get Config
  '.entries.config_elem_name': {
    replaceable: true,
    is_html: false
  },
  '.entries.type': {
    replaceable: true,
    is_html: false
  },   
  '.entries.status': {
    replaceable: true,
    is_html: false
  },
  '.entries.serial': {
    replaceable: true,
    is_html: false
  },
  // Update Config
  '.entries.notes': {
    replaceable: true,
    is_html: false
  },
  // Check Config
  '.entries.field_name': {
    replaceable: true,
    is_html: false
  },
  '.entries.verification_value': {
    replaceable: true,
    is_html: false
  },
  // Graph EHA (none)  
  // Query EVR
  '.evr_name': {
    replaceable: true,
    is_html: false
  },
  '.start_time': {
    replaceable: true,
    is_html: false
  },  
  '.end_time': {
    replaceable: true,
    is_html: false
  },
  '.duration': {
    replaceable: true,
    is_html: false
  },
  '.timeout': {
    replaceable: true,
    is_html: false
  },
  '.message_filter': {
    replaceable: true,
    is_html: false
  },
  '.data_path': {
    replaceable: true,
    is_html: false
  },
  // Verify EHA
  '.lookback': {
    replaceable: true,
    is_html: false
  },  
  '.entries.channel_id': {
    replaceable: true,
    is_html: false
  },
  '.entries.channel_name': {
    replaceable: true,
    is_html: false
  },
  // Wait EHA (none)
  // Bus 1553
  '.entries.bus_1553_var': {
    replaceable: true,
    is_html: false
  },
  // Wait EVR
  '.entries.evr_name': {
    replaceable: true,
    is_html: false
  },  
  '.entries.message_filter': {
    replaceable: true,
    is_html: false
  },
  // List DP
  '.entries.ap_id': {
    replaceable: false,
    is_html: false
  },  
  '.entries.product_status_filter': {
    replaceable: true,
    is_html: false
  },
  // Wait DP (none)
  // Cmd
  '.entries.cmd_string': {
    replaceable: true,
    is_html: false
  },
  '.entries.string_selection': {
    replaceable: false,
    is_html: false
  },
  '.entries.timeout': {
    replaceable: true,
    is_html: false
  },
  // Cmd File
  '.entries.file_type': {
    replaceable: true,
    is_html: false
  },
  '.entries.file_path': {
    replaceable: true,
    is_html: false
  },
  '.entries.onboard_path': {
    replaceable: true,
    is_html: false
  },    
  // Cmd SCMF
  '.entries.scmf_name': {
    replaceable: false,
    is_html: false
  },
  // Cmd SSE (none)
  // Custom Script
  '.script_name': {
    replaceable: false,
    is_html: false
  },  
  '.script_path': {
    replaceable: false,
    is_html: false
  },
  '.script_id': {
    replaceable: false,
    is_html: false
  },  
  '.hash': {
    replaceable: false,
    is_html: false
  },   
  '.description': {
    replaceable: false,
    is_html: false
  },
  '.inputs.value': {
    replaceable: true,
    is_html: false
  },
  '.entries.entry_inputs.value': {
    replaceable: true,
    is_html: false
  },
  // Manual Verification
  '.verification_text': {
    replaceable: true,
    is_html: false
  },
  // Analysis
  '.analysis_text': {
    replaceable: true,
    is_html: false
  },
  // Wait (none)
  '.wait_type': {
    replaceable: false,
    is_html: false
  },
  '.time_value': {
    replaceable: true,
    is_html: false
  },
  // TOC (none)
  // VI
  '.vis.vi_name': {
    replaceable: false,
    is_html: false
  },
  '.vis.vi_id': {
    replaceable: false,
    is_html: false
  },
  '.vis.vi_text': {
    replaceable: false,
    is_html: false
  },
  // VIS (none)
}

const searchable_result_field_map = {
  'execution.meta_data.status': {
    replaceable: false,
    is_html: false
  },  
  // Manual Input
  // Manual EIP
  // Venue Config
  // Environment (none)
  // GDS Manual
  // Get Config
  // Update Config
  // Check Config
  // Graph EHA (none)  
  // Query EVR
  'execution.results.evr_data.evr_name': {
    replaceable: false,
    is_html: false
  },
  'execution.results.evr_data.evr_message': {
    replaceable: false,
    is_html: false
  },
  'execution.results.evr_data.evr_module': {
    replaceable: false,
    is_html: false
  },    
  // Verify EHA
  // Wait EHA (none)
  // Bus 1553
  'execution.results.entries.bus_name': {
    replaceable: false,
    is_html: false
  },
  'execution.results.entries.error_status': {
    replaceable: false,
    is_html: false
  },
  'execution.results.entries.data_type': {
    replaceable: false,
    is_html: false
  },
  'execution.results.entries.data_value': {
    replaceable: false,
    is_html: false
  },
  //'execution.results.entries.dictionary': {
  //  replaceable: false,
  //  is_html: false
  //},
  //'execution.results.entries.log_file': {
  //  replaceable: false,
  //  is_html: false
  //},
    
  // Wait EVR
  // List DP
  'execution.results.entries.products.dp_status': {
    replaceable: false,
    is_html: false
  },
  'execution.results.entries.products.apid_product_type': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.entries.products.file_path': {
    replaceable: false,
    is_html: false
  }, 
  // Wait DP (none)
  // Cmd
  // Cmd File
  // Cmd SCMF
  // Cmd SSE (none)
  // Custom Script
  'execution.results.entries.entry_outputs.name': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.entries.entry_outputs.value': {
    replaceable: false,
    is_html: false
  },
  'execution.results.entries.entry_output_array.name': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.entries.entry_output_array.outputs.name': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.entries.entry_output_array.outputs.values': {
    replaceable: false,
    is_html: false
  },   
  'execution.results.outputs.name': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.outputs.value': {
    replaceable: false,
    is_html: false
  },
  'execution.results.output_array.name': {
    replaceable: false,
    is_html: false
  },  
  'execution.results.output_array.outputs.name': {
    replaceable: false,
    is_html: false
  },
  'execution.results.output_array.outputs.values': {
    replaceable: false,
    is_html: false
  },  
  // Manual Verification
  // Analysis
  // Wait (none)
  // TOC (none)
  // VI
  // VIS (none)
}



const [authoring_field_map, execution_field_map] = ['authoring_user_input', 'execution_user_input'].map((name) => {
  const named_field_map = {};
  for (const key in field_map) {
    let item = field_map[key];
    let item_copy = {};
    named_field_map[key] = item_copy;
    for (const item_key in item) {
      if (item_key.startsWith('.')) {
        item_copy[`${name}${item_key}`] = item[item_key];
      } else {
       item_copy[item_key] = item[item_key];
      }
    }  
  }
  return named_field_map;
});

const [authoring_searchable_field_map, execution_searchable_field_map] = ['authoring_user_input', 'execution_user_input'].map((name) => {
  const named_searchable_field_map = {};
  for (const key in searchable_field_map) {
    if (key.startsWith('.')) {
      named_searchable_field_map[`${name}${key}`] = searchable_field_map[key];
    } else {
      named_searchable_field_map[key] = searchable_field_map[key];
    }
  }
  return named_searchable_field_map;
});

module.exports.authoring_field_map = authoring_field_map;
module.exports.execution_field_map = execution_field_map;
module.exports.authoring_searchable_field_map = authoring_searchable_field_map;
module.exports.execution_searchable_field_map = execution_searchable_field_map;

module.exports.searchable_result_field_map = searchable_result_field_map;