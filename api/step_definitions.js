'use strict';

var execution_meta_data_template = {
  'test_conductor': '',
  'time_started': '',
  'time_completed': '',
  'time_updated': '',
  'status': 'NONE',
  'status_message': '',
  'error': {}
};

var step_dict = {
	"MANUAL_INPUT" : {
    "elem_type": "STEP",
    "step_type" : "MANUAL_INPUT",
    "specification": {
      "authoring_user_input": {
        "entries": [
          {
            "name": "",
            "type": "STRING",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []
          }
        ]
      },
      "execution_user_input": {
        "entries": [
          {
            "name": "",
            "type": "STRING",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": [],
            "actual_value": ""      // execution only
          }
        ]
      },
      "results": {
        "entries": [
          {
            "name": "",
            "type": "STRING",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": [],
            "actual_value": "",
            "verification_status": "FAIL"
          }
        ]
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,        
    "code": {
      "name": "manual_input_step.run",
      "commit": "",
      "release": "1.0"
    }
  },
  "MANUAL_EIP" : {
    "elem_type": "STEP",
    "step_type" : "MANUAL_EIP",
    "specification": {
      "authoring_user_input": {
        "entries": [
          {
            "signal_name": "",
            "icds": "",
            "from": "",
            "to": "",
            "unit": "Volt",
            "min_value": "",
            "max_value": "",
          }
        ]
      },
      "execution_user_input": {
        "entries": [
          {
            "signal_name": "",
            "icds": "",
            "from": "",
            "to": "",
            "unit": "Volt",
            "min_value": "",
            "max_value": "",
            "actual_value": "",      // execution only
            "measured_unit": "Volt"
          }
        ]
      },
      "results": {
        "entries": [
          {
            "signal_name": "",
            "icds": "",
            "from": "",
            "to": "",
            "unit": "Volt",
            "min_value": "",
            "max_value": "",
            "actual_value": "",
            "measured_unit": "Volt",
            "verification_status": "FAIL"
          }
        ]
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,        
    "code": {
      "name": "manual_eip_step.run",
      "commit": "",
      "release": "1.0"
    }
  },  
	"VENUE_CONFIG_MANUAL" : {
    "elem_type": "STEP",
    "step_type" : "VENUE_CONFIG_MANUAL",
    "specification": {
      "authoring_user_input": {
      },    
      "execution_user_input": {
        "fsw_version": "",       // execution only
        "sse_version": "",       // execution only
        "fsw_dictionary": "",    // execution only
        "sse_dictionary": "",    // execution only
        "gds_version": ""        // execution only
      },
      "results": {
        "fsw_version": "", 
        "sse_version": "",  
        "fsw_dictionary": "",  
        "sse_dictionary": "", 
        "gds_version": ""           
      }      
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,         
    "code": {
      "name": "venue_config_manual_step.run",
      "commit": "",
      "release": "1.0"
    }
  },
	"ENVIRONMENT_MANUAL" : {
    "elem_type": "STEP",
    "step_type" : "ENVIRONMENT_MANUAL",
    "specification": {
      "authoring_user_input" : {
        "temperature": {
          "verify_on": "VALUE",
          "verification_condition": "RECORD",
          "verification_values": []
        },
        "humidity": {
          "verify_on": "VALUE",        
          "verification_condition": "RECORD",
          "verification_values": []
        }
      },
      "execution_user_input" : {
        "temperature": {
          "verify_on": "VALUE",
          "verification_condition": "RECORD",
          "verification_values": [],
          "actual_value": 0.0       // execution only
        },
        "humidity": {
          "verify_on": "VALUE",        
          "verification_condition": "RECORD",
          "verification_values": [],
          "actual_value": 0.0        // execution only
        }
      },
      "results": {
        "temperature": {
          "verify_on": "VALUE",
          "verification_condition": "RECORD",
          "verification_values": [],
          "actual_value": 0.0,
          "verification_status": "FAIL"    // results only
        },
        "humidity": {
          "verify_on": "VALUE",        
          "verification_condition": "RECORD",
          "verification_values": [],
          "actual_value": 0.0,
          "verification_status": "FAIL"    // results only
        }              
      }
    },     
    "execution": {
      "meta_data": execution_meta_data_template
    },  
    "executable": "EXECUTED",
    "verifiable": true,                
    "code" : {
      "name": "environment_manual_step.run",
      "commit": "",
      "release": "1.0"
    }
  },
	"GDS_MANUAL" : {
    "elem_type": "STEP",
    "step_type" : "GDS_MANUAL",
    "specification": {
      "authoring_user_input" : {
        "default_cmd_string": "AB",
        "entries": [
          {
            "data_path": ""
          }
        ]
      },    
      "execution_user_input" : {
        "default_cmd_string": "AB",
        "entries": [
          {
            "data_path": "",
            "session_id": 0         // execution only
          }
        ]
      },
      "results": {
        "default_cmd_string": "AB",
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "entries": [
          {
            "data_path": "",
            "session_id": 0
          }
        ]        
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
      "name": "gds_manual_step.run",
      "commit": "",
      "release": "1.0"
    }
  },
	"VERIFICATION_ITEM" : {
    "elem_type": "STEP",
    "step_type": "VERIFICATION_ITEM",
    "specification": {
      "authoring_user_input": {
        vis: []
      },    
      "execution_user_input": {
        vis: []
      },
      "results": {
        vis: []
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "NONE",
    "verifiable": false,              
    "code": {
      "name": "",
      "commit": "",
      "release": ""
    }
  },
  "VERIFICATION_ITEM_STATUS" : {
    "elem_type": "STEP",
    "step_type" : "VERIFICATION_ITEM_STATUS",
    "specification": {
      "authoring_user_input" : {
        "vis": [],
        "steps": []
      },    
      "execution_user_input" : {
        "vis": [],
        "steps": []
      },
      "results": {
        "vis": [],
        "steps": []        
      }
    },    
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "COMPUTED",
    "verifiable": true,               
    "code": {}
  },
  "GRAPH_EHA" : {
    "elem_type": "STEP",
    "step_type" : "GRAPH_EHA",
    "specification": {
      "authoring_user_input" : {
        "channel_id": "",
        "channel_name": "",      
        "start_time": "",     
        "end_time": "",     
        "duration": "",     
        "time_type": "ERT",     
        "timeout": 240,     
        "channel_type": "FSW_RECORDED",           
        "dn_eu": "DN",     
        "data_path": ""     
      },    
      "execution_user_input" : {
        "channel_id": "",
        "channel_name": "",      
        "start_time": "",     
        "end_time": "",     
        "duration": "",     
        "time_type": "ERT",     
        "timeout": 240,     
        "channel_type": "FSW_RECORDED",           
        "dn_eu": "DN",     
        "data_path": ""     
      },
      "results": {
        "channel_id": "",
        "channel_name": "",      
        "start_time": "",     
        "end_time": "",  
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "duration": "",     
        "time_type": "ERT",     
        "timeout": 240,     
        "channel_type": "FSW_RECORDED",           
        "dn_eu": "DN",     
        "data_path": "",
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "total_count": 0,             // results only    
        "channel_data": []            // results only         
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
      "name": "graph_eha_step.run",
      "commit": "",
      "release": "1.0"
    }
  },  
  "QUERY_EVR" : {
    "elem_type": "STEP",
    "step_type" : "QUERY_EVR",
    "specification": {
      "authoring_user_input" : {
        "evr_name": "",
        "evr_id": "",
        "evr_type": "FSW_REALTIME",
        "evr_level": "",
        "start_time": "",
        "end_time": "",
        "duration": "",
        "time_type": "ERT",
        "message_filter": "",
        "timeout": 240,
        "verification_condition": "RECORD",
        "verification_value": 0,
        "data_path": ""
      },    
      "execution_user_input" : {
        "evr_name": "",
        "evr_id": "",
        "evr_type": "FSW_REALTIME",
        "evr_level": "",
        "start_time": "",
        "end_time": "",
        "duration": "",
        "time_type": "ERT",
        "message_filter": "",
        "timeout": 240,
        "verification_condition": "RECORD",
        "verification_value": 0,
        "data_path": ""
      },
      "results": {
        "evr_name": "",
        "evr_id": "",
        "evr_type": "FSW_REALTIME",
        "evr_level": "",
        "start_time": "",
        "end_time": "",
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "duration": "",
        "time_type": "ERT",
        "message_filter": "",
        "timeout": 240,
        "verification_condition": "RECORD",
        "verification_value": 0,
        "data_path": "",
        "venue_id": "",                    // results only
        "venue_name": "",                  // results only
        "venue_ampcs_address": "",         // results only
        "total_count": 0,                  // results only      
        "evr_data": [],                    // results only 
        "verification_status": "FAIL"          // results only        
      }
    }, 
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "query_evr_step.run",
        "commit": "",
        "release": "1.0"
    }
  },
  "VERIFY_EHA": {
    "elem_type": "STEP",
    "step_type" : "VERIFY_EHA",
    "specification": {
      "authoring_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []
          }
        ],
      },
      "execution_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []
          }
        ],
      },
      "results": {
        "venue_id": "",             // results only
        "venue_name": "",           // results only
        "venue_ampcs_address": "",  // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": [],
            "dn": "",
            "eu": 0.0,
            "session_id": 0,
            "channel_status": "",
            "sclk": "",
            "ert": "",
            "scet": "",
            "actual_value": "",
            "verification_status": "FAIL"        
          }          
        ]        
      }
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "verify_eha_step.run",
        "commit": "",
        "release": "1.0"
    }    
  },
  "WAIT_EHA": {
    "elem_type": "STEP",
    "step_type" : "WAIT_EHA",
    "specification": {
      "authoring_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []                                                                                                                               
          }
        ],
      },    
      "execution_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []                                                                                                                               
          }
        ],
      },
      "results": {
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "channel_type": "FLIGHT",
            "channel_id": "",
            "channel_name": "",
            "data_path": "",
            "dn_eu": "DN",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": [],
            "dn": "",
            "eu": 0.0,
            "session_id": 0,
            "channel_status": "",
            "sclk": "",
            "ert": "",
            "scet": "",
            "actual_value": "",
            "verification_status": "FAIL"                                                                                                                                             
          }
        ]      
      }
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,                
    "code": {
        "name": "wait_eha_step.run",
        "commit": "",
        "release": "1.0"
    }      
  },
  "BUS_1553": {
    "elem_type": "STEP",
    "step_type" : "BUS_1553",
    "specification": {
      "authoring_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "time_type": "SCET",
        "verify_wait": "VERIFY",
        "entries": [
          {
            "bus_1553_var": "",
            "raw_convert": "RAW",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []                                                                                                                               
          }
        ],
      },    
      "execution_user_input" : {
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "time_type": "SCET",        
        "verify_wait": "VERIFY",       
        "entries": [
          {
            "bus_1553_var": "",
            "raw_convert": "RAW",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": []                                                                                                                               
          }
        ],
      },
      "results": {
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "bus_1553_var": "",
            "raw_convert": "RAW",
            "verify_on": "VALUE",
            "verification_condition": "RECORD",
            "verification_values": [],            
            "rti": 0,
            "bus_name": "",
            "error_status": "",
            "data_type": "",
            "data_value": "",
            "converted_value": "",
            "actual_value": "",
            "dictionary": "",
            "log_file": "",
            "sclk": "",
            "scet": "",
            "verification_status": "FAIL"                                                                                                                                             
          }
        ]      
      }
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,                
    "code": {
        "name": "bus_1553_step.run",
        "commit": "",
        "release": "1.0"
    }      
  },  
  "WAIT_EVR": {
    "elem_type": "STEP",
    "step_type" : "WAIT_EVR",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "evr_name": "",
            "evr_id": "",
            "evr_type": "FSW_REALTIME",
            "evr_level": "",
            "message_filter": "",
            "verification_condition": "EXISTS"                                                                                                                       
          }
        ],
      },    
      "execution_user_input" : {
        "data_path": "",
        "start_time": "",
        "lookback": 0,
        "timeout": 240,
        "entries": [
          {
            "evr_name": "",
            "evr_id": "",
            "evr_type": "FSW_REALTIME",
            "evr_level": "",
            "message_filter": "",
            "verification_condition": "EXISTS"                                                                                                                       
          }
        ],
      },
      "results": {
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "evr_name": "",
            "evr_id": "",
            "evr_type": "FSW_REALTIME",
            "evr_level": "",
            "message_filter": "",
            "verification_condition": "EXISTS",
            "verification_status": "FAIL",
            "total_count": 0,
            "evr_data": [
              {
                "evr_name": "",
                "session_id": 0,
                "vcid": 0,
                "event_id": 0,
                "evr_level": "",
                "from_sse": false,
                "evr_message": "",
                "evr_module": "",
                "sclk": "",
                "ert": "",
                "scet": "",
                "is_recorded": false   
              }                                                                                                                                                                  
            ]                                                                                                                       
          }
        ]        
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "wait_evr_step.run",
        "commit": "",
        "release": "1.0"
    }      
  }, 
  "CUSTOM_SCRIPT": {
    "elem_type": "STEP",
    "step_type" : "CUSTOM_SCRIPT",
    "specification": {
      "authoring_user_input" : {
        "script_name": "",
        "script_path": "",
        "script_id": "",
        "description": "",
        "hash": "",
        "status": "ACTIVE",                                
        "timeout": 240,
        "inputs": [
          {
            "name": "",
            "description": "",
            "phase": "AUTHORING",
            "required": "YES",
            "type": "INT",
            "enumerations": [],
            "value": "",
            "default_value": ""
          }
        ],
        "entries": [
          {
            "display_field": "",
            "entry_inputs": [
              {
                "name": "",
                "description": "",
                "phase": "AUTHORING",
                "required": "YES",
                "type": "INT",
                "enumerations": [],
                "value": "",
                "default_value": ""
              }
            ],
            "entry_outputs": [
              {
                "name": "",
                "description": "",
                "type": "INT"                                                                                                             
              }
            ],
            "entry_output_array": {
              "name": "",
              "description": "",
              "max_entries": 10,
              "outputs": [
                {
                  "name": "",
                  "description": "",
                  "visible": "YES",
                  "type": "INT"
                }
              ]         
            }                                                                                                                             
          }
        ],        
        "outputs": [
          {
            "name": "",
            "description": "",
            "type": "INT"                                                                                                             
          }
        ],
        "output_array": {
          "name": "",
          "description": "",
          "max_entries": 10,
          "outputs": [
            {
              "name": "",
              "description": "",
              "visible": "YES",
              "type": "INT"
            }
          ]          
        }
      },    
      "execution_user_input" : {
        "script_name": "",
        "script_path": "",
        "script_id": "",
        "description": "",
        "hash": "",
        "status": "ACTIVE",                                
        "timeout": 240,
        "inputs": [
          {
            "name": "",
            "description": "",
            "phase": "AUTHORING",
            "required": "YES",
            "type": "INT",
            "enumerations": [],
            "value": "",
            "default_value": ""                                                                                                                   
          }
        ],
        "entries": [
          {
            "display_field": "",
            "entry_inputs": [
              {
                "name": "",
                "description": "",
                "phase": "AUTHORING",
                "required": "YES",
                "type": "INT",
                "enumerations": [],
                "value": "",
                "default_value": ""
              }
            ],
            "entry_outputs": [
              {
                "name": "",
                "description": "",
                "type": "INT"                                                                                                             
              }
            ],
            "entry_output_array": {
              "name": "",
              "description": "",
              "max_entries": 10,
              "outputs": [
                {
                  "name": "",
                  "description": "",
                  "visible": "YES",
                  "type": "INT"
                }
              ]         
            }                                                                                                                             
          }
        ],        
        "outputs": [
          {
            "name": "",
            "description": "",
            "type": "INT"                                                                                                             
          }
        ],
        "output_array": {
          "name": "",
          "description": "",
          "max_entries": 10,
          "outputs": [
            {
              "name": "",
              "description": "",
              "visible": "YES",
              "type": "INT"
            }
          ]          
        }
      },
      "results": {
        "script_name": "",
        "script_path": "",
        "script_id": "",
        "description": "",
        "hash": "",
        "status": "ACTIVE",                                
        "timeout": 240,        
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "inputs": [
          {
            "name": "",
            "description": "",
            "phase": "AUTHORING",
            "required": "YES",
            "type": "INT",
            "enumerations": [],
            "value": "",
            "default_value": ""                                                                                                                    
          }
        ],
        "entries": [
          {
            "display_field": "",
            "verification_status": "PENDING",
            "entry_inputs": [
              {
                "name": "",
                "description": "",
                "phase": "AUTHORING",
                "required": "YES",
                "type": "INT",
                "enumerations": [],
                "value": "",
                "default_value": ""
              }
            ],
            "entry_outputs": [
              {
                "name": "",
                "description": "",
                "type": "INT",
                "value": ""                                                                                                   
              }
            ],
            "entry_output_array": {
              "name": "",
              "description": "",
              "max_entries": 10,
              "outputs": [
                {
                  "name": "",
                  "description": "",
                  "visible": "YES",
                  "type": "INT",
                  "values": []
                }
              ]         
            }                                                                                                                             
          }
        ],        
        "outputs": [
          {
            "name": "",
            "description": "",
            "type": "INT",
            "value": ""                                                                                             
          }
        ],
        "output_array": {
          "name": "",
          "description": "",
          "max_entries": 10,
          "outputs": [
            {
              "name": "",
              "description": "",
              "visible": "YES",
              "type": "INT",
              "values": []
            }
          ]          
        },
        "output_summary": "",
        "custom_script_status": "PENDING",      
        "log_file_local_path": "",
        "log_file_url": ""
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "custom_script_step.run",
        "commit": "",
        "release": "1.0"
    }      
  },   
  "LIST_DATA_PRODUCTS": {
    "elem_type": "STEP",
    "step_type" : "LIST_DATA_PRODUCTS",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",
        "start_time": "",
        "end_time": "",
        "duration": "",
        "time_type": "ERT",
        "timeout": 240,      
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0                    
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",
        "start_time": "",       
        "end_time": "",
        "duration": "",
        "time_type": "ERT",
        "timeout": 240,      
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0                    
          }
        ]
      },
      "results": {
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0,
            "verification_status": "FAIL",
            "total_count": 0,
            "products": [
              {
                "session_id": 0,
                "vcid": 0,
                "dp_status": "",
                "apid": 0,
                "apid_product_type": "",
                "file_path": "",
                "file_size": 0.0,
                "creation_time": "",
                "sclk": "",
                "ert": "",
                "scet": ""  
              }                                                                                                                                                                  
            ]                                                                                                                       
          }                                
        ]     
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "EXECUTED",
    "verifiable": true,              
    "code": {
        "name": "list_data_products_step.run",
        "commit": "",
        "release": "1.0"
    }          
  },
  "WAIT_DATA_PRODUCTS": {
    "elem_type": "STEP",
    "step_type" : "WAIT_DATA_PRODUCTS",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",
        "start_time": "",
        "lookback": 0,        
        "timeout": 240,      
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0                                                                                    
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",
        "start_time": "",
        "lookback": 0,        
        "timeout": 240,      
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0                                                                                    
          }
        ]
      },
      "results": {
        "venue_id": "",               // results only
        "venue_name": "",             // results only
        "venue_ampcs_address": "",    // results only
        "translated_start_time": "",  // results only
        "translated_end_time": "",    // results only
        "query_start_time": "",       // results only
        "query_end_time": "",         // results only
        "entries": [
          {
            "apid": 0,
            "product_status_filter": "",
            "verification_condition": "RECORD",
            "verification_value": 0,
            "verification_status": "FAIL",
            "total_count": 0,
            "products": [
              {
                "session_id": 0,
                "vcid": 0,
                "dp_status": "",
                "apid": 0,
                "apid_product_type": "",
                "file_path": "",
                "file_size": 0.0,
                "creation_time": "",
                "sclk": "",
                "ert": "",
                "scet": ""  
              }                                                                                                                                                                  
            ]
          }
        ]      
      }
    },   
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "wait_data_products_step.run",
        "commit": "",
        "release": "1.0"
    }    
  },
  "CMD": {
    "elem_type": "STEP",
    "step_type" : "CMD",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "hw_fsw": "FSW",
            "timeout": 60,
            "cmd_string": "",
            "string_selection": "DEFAULT",
            "verify": false
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "hw_fsw": "FSW",
            "timeout": 60,
            "cmd_string": "",
            "string_selection": "DEFAULT",
            "verify": false
          }
        ]
      },
      "results": {
        "data_path": "",
        "entries": [
          {
            "hw_fsw": "FSW",
            "timeout": 60,
            "cmd_string": "",
            "string_selection": "DEFAULT",
            "verify": false,
            "radiated": false,
            "radiated_time": "",
            "verified": false,
            "verified_time": ""
          }
        ]        
      }
    },   
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "EXECUTED",
    "verifiable": true,              
    "code": {
        "name": "cmd_step.run",
        "commit": "",
        "release": "1.0"
    }        
  },
  "CMD_FILE": {
    "elem_type": "STEP",
    "step_type" : "CMD_FILE",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "onboard_path": "",
            "overwrite": true,
            "string_selection": "DEFAULT",
            "verify": false                                                        
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "onboard_path": "",
            "overwrite": true,
            "string_selection": "DEFAULT",
            "verify": false                                                        
          }
        ]
      },
      "results": {
        "data_path": "",
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "onboard_path": "",
            "overwrite": true,
            "string_selection": "DEFAULT",
            "verify": false,
            "radiated": false,
            "radiated_time": "",
            "verified": false,
            "verified_time": ""                                                                    
          }
        ]       
      }
    },   
    "execution": {
      "meta_data": execution_meta_data_template
    },  
    "executable": "EXECUTED",
    "verifiable": true,             
    "code": {
        "name": "cmd_file_step.run",
        "commit": "",
        "release": "1.0"
    }            
  },  
  "CMD_SCMF": {
    "elem_type": "STEP",
    "step_type" : "CMD_SCMF",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "verify": false,
            "disable_checks": false                                                                  
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "verify": false,
            "disable_checks": false                                                                  
          }
        ]
      },
      "results": {
        "data_path": "",
        "entries": [
          {
            "file_type": "",
            "timeout": 120,
            "file_path": "",
            "verify": false,
            "disable_checks": false,
            "scmf_name": "",      
            "radiated": false,
            "radiated_time": "",
            "verified": false,
            "verified_time": ""                                                                        
          }
        ]       
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "cmd_scmf_step.run",
        "commit": "",
        "release": "1.0"
    }        
  },
  "CMD_SSE": {
    "elem_type": "STEP",
    "step_type" : "CMD_SSE",
    "specification": {
      "authoring_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "timeout": 10,
            "cmd_string": ""                                                               
          }
        ]
      },    
      "execution_user_input" : {
        "data_path": "",    
        "entries": [
          {
            "timeout": 10,
            "cmd_string": ""                                                               
          }
        ]
      },
      "results": {
        "data_path": "",
        "entries": [
          {
            "timeout": 10,
            "cmd_string": "",
            "radiated": false,
            "radiated_time": ""                                                                           
          }
        ]     
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
        "name": "cmd_sse_step.run",
        "commit": "",
        "release": "1.0"
    }    
  },
  "VENUE_CONFIG_GET" : {
    "elem_type": "STEP",
    "step_type" : "VENUE_CONFIG_GET",
    "specification": {
      "authoring_user_input" : {
        "get_all": false,
        "entries": [
          {
            "config_elem_name": ""
          }
        ]
      },     
      "execution_user_input" : {
        "get_all": false,
        "entries": [
          {
            "config_elem_name": ""
          }
        ]
      },
      "results": {
        "venue_id": "",
        "venue_name": "",
        "entries": [
          {
            "config_elem_name": "",
            "type": "OTHER",
            "status": "NOT_INSTALLED",
            "serial": ""
          }
        ]        
      }
    }, 
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "EXECUTED",
    "verifiable": true,              
    "code": {
      "name": "get_config_step.run",
      "commit": "",
      "release": "1.0"
    }
  },  
  "VENUE_CONFIG_UPDATE" : {
    "elem_type": "STEP",
    "step_type" : "VENUE_CONFIG_UPDATE",
    "specification": {
      "authoring_user_input" : {
        "entries": [
          {
            "config_elem_name": "",
            "type": "SIMULATOR",
            "status": "INSTALLED",
            "serial": "",
            "notes": ""                                          
          }
        ]
      },
      "execution_user_input" : {
        "entries": [
          {
            "config_elem_name": "",
            "type": "SIMULATOR",
            "status": "INSTALLED",
            "serial": "",
            "notes": ""                                          
          }
        ]
      },
      "results": {
        "venue_id": "",
        "venue_name": "",
        "entries": [
          {
            "config_elem_name": "",
            "type": "SIMULATOR",
            "status": "INSTALLED",
            "serial": "",
            "notes": ""                                          
          }
        ]     
      }
    },   
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
      "name": "update_config_step.run",
      "commit": "",
      "release": "1.0"
    }
  }, 
  "VENUE_CONFIG_CHECK" : {
    "elem_type": "STEP",
    "step_type" : "VENUE_CONFIG_CHECK",
    "specification": {
      "authoring_user_input" : {
        "entries": [
          {
            "config_elem_name": "",
            "field_name": "STATUS",
            "verification_condition": "EQUAL",
            "verification_value": ""                               
          }
        ]
      },    
      "execution_user_input" : {
        "entries": [
          {
            "config_elem_name": "",
            "field_name": "STATUS",
            "verification_condition": "EQUAL",
            "verification_value": ""                               
          }
        ]
      },
      "results": {
        "entries": [
          {
            "config_elem_name": "",
            "field_name": "STATUS",
            "verification_condition": "EQUAL",
            "verification_value": "",
            "actual_value": "",
            "verification_status": "FAIL"                               
          }
        ]      
      }
    },
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
      "name": "check_config_step.run",
      "commit": "",
      "release": "1.0"
    }
  },  
  "MANUAL_VERIFICATION": {
    "elem_type": "STEP",
    "step_type" : "MANUAL_VERIFICATION",
    "specification": {
      "authoring_user_input" : {
        "verification_text": ""
      },    
      "execution_user_input" : {
        "verification_text": "",
        "verified_by": "",                    // execution only. set automatically if not provided
        "time_verified": "",                  // execution only. set automatically if not provide
        "verification_status": "PENDING"      // execution only
      },
      "results": {
        "verification_text": "",
        "verified_by": "",
        "time_verified": "",
        "verification_status": "PENDING"        
      } 
    }, 
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "EXECUTED",
    "verifiable": true,               
    "code": {
      "name": "manual_verification_step.run",
      "commit": "",
      "release": "1.0"
    }    
  },  
  "ANALYSIS": {
    "elem_type": "STEP",
    "step_type" : "ANALYSIS",
    "specification": {
      "authoring_user_input" : {
        "analysis_text": ""
      },     
      "execution_user_input" : {
        "analysis_text": "",
        "verification_status": "FAIL"      // execution only
      },
      "results": {
        "analysis_text": "",
        "verification_status": "FAIL"             
      } 
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    },
    "executable": "COMPUTED",
    "verifiable": true,               
    "code": {
      "name": "",    // this is an non-executable step
      "commit": "",
      "release": "1.0"
    }    
  },
  "WAIT": {
    "elem_type": "STEP",
    "step_type" : "WAIT",
    "specification": {
      "authoring_user_input" : {
        "wait_type": "DURATION",
        "time_value": ""
      },    
      "execution_user_input" : {
        "wait_type": "DURATION",
        "time_value": ""
      },
      "results": {
        "wait_type": "DURATION",
        "time_value": ""        
      }
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "EXECUTED",
    "verifiable": true,              
    "code": {
      "name": "wait_step.run",
      "commit": "",
      "release": "1.0"
    }    
  },  
  "TIME_REFERENCE": {
    "elem_type": "STEP",
    "step_type" : "TIME_REFERENCE",
    "specification": {
      "authoring_user_input" : {
        "name": ""
      },    
      "execution_user_input" : {
        "name": ""
      },
      "results": {
        "name": "",
        "time_value": ""        
      }
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    }, 
    "executable": "EXECUTED",
    "verifiable": true,
    "code": {
      "name": "time_reference_step.run",
      "commit": "",
      "release": "1.0"
    }
  },
  "TOC": {
    "elem_type": "STEP",
    "step_type" : "TOC",
    "specification": {
      "authoring_user_input" : {},   // no input is required,    
      "execution_user_input" : {},   // no input is required 
      "results": {
        "entries": [
          {
            "number": "",
            "title": ""
          }
        ]        
      }       
    },  
    "execution": {
      "meta_data": execution_meta_data_template
    },   
    "executable": "COMPUTED",
    "verifiable": false,            
    "code": {
      "name": "",   // this is an non-executable step 
      "commit": "",
      "release": "1.0"
    }      
  },
  // Technically  speaking, procedure section is not a step. But define the template here for convenience.
  "PROCEDURE_SECTION": {
    "elem_type": "PROCEDURE_SECTION",
    "specification": {
      "authoring_user_input" : {
        "callable": false,
        "reference_procedure_id": "",
        "reference_procedure_title": "",
        "reference_procedure_version": 0,
        "reference_procedure_version_description": "",
        "reference_procedure_institutional_id": "",
        "reference_procedure_institutional_release_id": "",
        "tag_selections": [],
        "elements": []
      },       
      "execution_user_input" : {
        "callable": false,
        "reference_procedure_id": "",
        "reference_procedure_title": "",
        "reference_procedure_version": 0,
        "reference_procedure_version_description": "",
        "reference_procedure_institutional_id": "",
        "reference_procedure_institutional_release_id": "",
        "tag_selections": [],        
        "elements": [],
        "run_for_score": false
      }   
    }   
  }  
}

module.exports.step_dict = step_dict;