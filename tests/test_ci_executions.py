"""
Usage:
 - Run all tests
   $ python executions_test.py

 - Run a class
   $ python executions_test.py ExecutionsTest

 - Run a method
   $ python executions_test.py ExecutionDeleteTest.test_delete_executions

"""

import xmlrunner
import os
import sys
import unittest
import requests
import json
import copy
import random
import time
from multiprocessing.pool import ThreadPool
import string
import shutil
from dateutil import parser
from datetime import datetime
import math
import dateutil
import dateutil.tz
from config import shared_dict, logger
from utils import random_string
from ingenium_client import CoreTestBase, StepTypes
import threading

class ExecutionsTest(CoreTestBase):
    def test_create_execution_using_core(self):

        id_dict = self.create_execution_example_using_core()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        ## Get As Run
        res_dict = self.get_as_run(execution_id)


        self.check_as_run(res_dict)

        ### MANUAL_INPUT step, set user input
        user_input_1_1 = {
            'entries': [
                {
                    'name': 'param1',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 'abc'
                },
                {
                    'name': 'param2',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': '11.0'
                }
            ]
        }
        self.set_step_input(execution_url, StepTypes.MANUAL_INPUT, step_id_1_1, user_input_1_1)

        ## Check step
        step = self.get_step_generic(execution_url, step_id_1_1)

        self.assertDictEqual(step['execution_user_input'], user_input_1_1)
        self.assertEqual(step['step_type'], 'MANUAL_INPUT')

        # run the step
        res_dict = self.run_step(execution_id, step_id_1_1)

        ## Check step
        step = self.get_step_generic(execution_url, step_id_1_1)

        self.assertDictEqual(step['execution_user_input'], user_input_1_1)
        result_1_1 = step['execution']['results']
        for entry in result_1_1['entries']:
            self.assertEqual(entry['verification_status'], 'PASS')
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        ### VENUE_CONFIG_MANUAL step, set user input
        user_input_1_2 = {
            'fsw_version': '1.0',
            'sse_version': '1.0',
            'fsw_dictionary': 'https://fsw_dict.jpl.nasa.gov',
            'sse_dictionary': 'https://sse_dict.jpl.nasa.gov',
            'gds_version': '1.0'
        }
        self.set_step_input(execution_url, StepTypes.VENUE_CONFIG_MANUAL, step_id_1_2, user_input_1_2)

        ## Check step
        step = self.get_step_generic(execution_url, step_id_1_2)

        self.assertDictEqual(step['execution_user_input'], user_input_1_2)
        self.assertEqual(step['step_type'], 'VENUE_CONFIG_MANUAL')

        # run the step
        res_dict = self.run_step(execution_id, step_id_1_2)


        ## Check step
        step = self.get_step_generic(execution_url, step_id_1_2)


        self.assertDictEqual(step['execution_user_input'], user_input_1_2)
        result_1_2 = step['execution']['results']
        self.assertDictEqual(result_1_2, user_input_1_2)
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')


        ### GDS_MANUAL step, set user input
        user_input_3_1 = {
            'default_cmd_string': 'AB', 
            'entries': [
                {
                    'data_path': 'side_a',
                    'session_id': 3242945
                },
                {
                    'data_path': 'side_b',
                    'session_id': 3242946
                }
            ]
        }

        self.set_step_input(execution_url, StepTypes.GDS_MANUAL, step_id_3_1, user_input_3_1)

        ## Check step
        step = self.get_step_generic(execution_url, step_id_3_1)

        self.assertDictEqual(step['execution_user_input'], user_input_3_1)
        self.assertEqual(step['step_type'], 'GDS_MANUAL')

        ### ENVIRONMENT_MANUAL step, set user input
        user_input_3_2 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 21.1
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.1
            }
        }

        result_3_2_expected = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 21.1,
                'verification_status': 'PASS'
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.1,
                'verification_status': 'PASS'
            }
        }

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_3_2, user_input_3_2)

        ## Check step
        step = self.get_step_generic(execution_url, step_id_3_2)

        self.assertDictEqual(step['execution_user_input'], user_input_3_2)
        self.assertEqual(step['step_type'], 'ENVIRONMENT_MANUAL')

        # run the step
        res_dict = self.run_step(execution_id, step_id_3_2)


        ## Check step
        step = self.get_step_generic(execution_url, step_id_3_2)

        self.assertDictEqual(step['execution_user_input'], user_input_3_2)
        result_3_2 = step['execution']['results']
        self.assertDictEqual(result_3_2, result_3_2_expected)
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        res_dict = self.get_as_run(execution_id)


        self.assertEqual(res_dict['children'][0]['children'][0]['execution']['results'], result_1_1)
        self.assertEqual(res_dict['children'][0]['children'][1]['execution']['results'], result_1_2)
        # Did not run GDS step
        self.assertEqual(res_dict['children'][2]['children'][1]['execution']['results'], result_3_2)

        ## Test for getting steps
        self.run_get_elements2(execution_id)

        # check history
        res_dict = self.get_history(execution_id)


        self.assertEqual(len(res_dict), 3)

        self.assertEqual(res_dict[0]['elem_id'], step_id_1_1)
        self.assertDictEqual(res_dict[0]['execution']['results'], result_1_1)
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        self.assertEqual(res_dict[1]['elem_id'], step_id_1_2)
        self.assertDictEqual(res_dict[1]['execution']['results'], result_1_2)
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')


        ## move elements
        self.run_move_elements(id_dict)

    def test_execution_history(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']   

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        ## Check execution
        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        #
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='')

        step_id_1 = res_dict['elem']['elem_id']

        user_input = {
            "wait_type": "DURATION",
            "time_value": "0.1"
        }
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_1, user_input)

        #
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1,
            level='SIBLING')

        step_id_2 = res_dict['elem']['elem_id']

        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)

        #
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.VERIFICATION_ITEM_STATUS,
            insert_after_id=step_id_2,
            level='SIBLING')

        step_id_3 = res_dict['elem']['elem_id']

        #
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_3,
            level='SIBLING')

        step_id_4 = res_dict['elem']['elem_id']

        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_4, user_input)

        #
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_4,
            level='SIBLING')

        step_id_5 = res_dict['elem']['elem_id']

        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_5, user_input)

        res_dict = self.run_step(execution_id, step_id_1, 200)
        res_dict = self.run_step(execution_id, step_id_2, 200)
        res_dict = self.run_step(execution_id, step_id_3, 200)
        res_dict = self.run_step(execution_id, step_id_4, 200)

        # go to to VIS step
        res_dict = self.run_step(execution_id, step_id_3, 200)

        # Run another step
        res_dict = self.run_step(execution_id, step_id_5, 200)

        history_dict = self.get_history(execution_id)
        for elem in history_dict:
            logger.debug('elem: %s', elem['number']) 

        self.assertEqual(len(history_dict), 4)
        self.assertEqual(history_dict[0]['elem_id'], step_id_1)
        self.assertEqual(history_dict[1]['elem_id'], step_id_2)
        self.assertEqual(history_dict[2]['elem_id'], step_id_4)
        self.assertEqual(history_dict[3]['elem_id'], step_id_5)


    def test_get_elements_flat(self):
        id_dict = {}

        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']   

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        ## Check execution
        execution_id = res_dict['execution_id']
        id_dict['execution_id'] = execution_id
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        id_dict['execution_url'] = execution_url

        ## Add Step 1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.CMD,
            insert_after_id=-1,
            level='CHILD')
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))

        step_id_1 = res_dict['elem']['elem_id']
        logger.debug('step_id_1= %s', step_id_1)
        self.assertEqual(res_dict['elem']['number'], '1')

        ## Add Step 2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.CMD,
            insert_after_id=step_id_1,
            level='SIBLING')

        step_id_2 = res_dict['elem']['elem_id']
        logger.debug('step_id_2= %s', step_id_2)
        self.assertEqual(res_dict['elem']['number'], '2')

        ## Add Step 3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.CMD,
            insert_after_id=step_id_2,
            level='SIBLING')

        step_id_3 = res_dict['elem']['elem_id']
        logger.debug('step_id_3= %s', step_id_3)
        self.assertEqual(res_dict['elem']['number'], '3')

        ## Add Step 4
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.CMD,
            insert_after_id=step_id_3,
            level='SIBLING')

        step_id_4 = res_dict['elem']['elem_id']
        logger.debug('step_id_4= %s', step_id_4)
        self.assertEqual(res_dict['elem']['number'], '4')

        ## get elements
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        logger.debug('url=%s', url)
        result = requests.get(url, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        logger.debug('x-total-count= %s', result.headers['x-total-count'])
        self.assertEqual(result.headers['x-total-count'], '4')
        self.assertEqual(len(elems), 4)
        self.assertEqual(elems[0]['number'], "1")
        self.assertEqual(elems[1]['number'], "2")
        self.assertEqual(elems[2]['number'], "3")
        self.assertEqual(elems[3]['number'], "4")

        self.assertEqual(elems[0]['elem_id'], step_id_1)
        self.assertEqual(elems[1]['elem_id'], step_id_2)
        self.assertEqual(elems[2]['elem_id'], step_id_3)
        self.assertEqual(elems[3]['elem_id'], step_id_4)

        ## Add Step 5 at the second position
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.CMD,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_5 = res_dict['elem']['elem_id']
        logger.debug('step_id_5= %s', step_id_5)
        self.assertEqual(res_dict['elem']['number'], '2')

        ## get elements
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        logger.debug('url=%s', url)
        result = requests.get(url, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        logger.debug('x-total-count= %s', result.headers['x-total-count'])
        self.assertEqual(result.headers['x-total-count'], '5')
        self.assertEqual(len(elems), 5)
        self.assertEqual(elems[0]['number'], "1")
        self.assertEqual(elems[1]['number'], "2")
        self.assertEqual(elems[2]['number'], "3")
        self.assertEqual(elems[3]['number'], "4")
        self.assertEqual(elems[4]['number'], "5")

        self.assertEqual(elems[0]['elem_id'], step_id_1)
        self.assertEqual(elems[1]['elem_id'], step_id_5)
        self.assertEqual(elems[2]['elem_id'], step_id_2)
        self.assertEqual(elems[3]['elem_id'], step_id_3)
        self.assertEqual(elems[4]['elem_id'], step_id_4)

  

    def test_halt(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']   

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        ## Check execution
        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        ## Add step

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='')

        logger.debug('new step res_dict= %s', json.dumps(res_dict, indent=4))

        step_id = res_dict['elem']['elem_id']

        user_input = {
            "wait_type": "DURATION",
            "time_value": "60"
        }

        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id, user_input)

        pool = ThreadPool(processes=2)
        res1 = pool.apply_async(self.worker_run, (execution_id, step_id))
        res2 = pool.apply_async(self.worker_interrupt, (execution_id,))

        self.assertEqual(res2.get(), True)
        # without halt, it would take ~60 seconds
        self.assertLess(res1.get(), 30.0)

        time.sleep(1)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'IDLE')         

        self.close_execution(execution_id)


    def worker_run(self, execution_id, step_id):
        logger.debug('worker_run: %s', execution_id)

        time0 = time.time()

        res_dict = self.run_step(execution_id, step_id, 200)

        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))

        self.assertEqual(res_dict['execution']['meta_data']['status'], 'ERROR')  
        self.assertTrue(res_dict['execution']['meta_data']['error']['message'].find('A process in the process pool was terminated abruptly') > -1)        

        time1 = time.time()

        elapsed_sec = time1-time0

        logger.debug('elapsed_sec: %s', elapsed_sec)

        return elapsed_sec

    def worker_interrupt(self, execution_id):
        logger.debug('worker_interrupt: %s', execution_id)
        time.sleep(3.0)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')         

        execution = self.halt_execution(execution_id, 200)
        logger.debug('worker_interrupt halted execution_id: %s', execution_id)
        self.assertEqual(execution['status'], 'IDLE') 

        return True     

    def test_history(self):
        random_name = random_string(8)
        description = 'My execution ' + random_name
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=-1,
            level='CHILD')

        step_id_1 = res_dict['elem']['elem_id']

        user_input_1_0 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50],
                'actual_value': 60
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30],
                'actual_value': 40
            }
        }

        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1_0)
        res_dict = self.run_step(execution_id, step_id_1)

        ### run 2nd time
        res_dict = self.create_new_run(execution_id, step_id_1)
        
        self.assertEqual(res_dict['elem_id'], step_id_1)
        self.assertTrue(len(res_dict['run_records'][0]['elem_id']) > 0)        
        self.assertEqual(len(res_dict['run_records']), 1)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_1)

        user_input_1_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50],
                'actual_value': 60.1
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30],
                'actual_value': 40.1
            }
        }

        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1_1)
        res_dict = self.run_step(execution_id, step_id_1)

        history_dict = self.get_history(execution_id)
        logger.debug('history_dict: %s', json.dumps(history_dict, indent=4)) 

        self.assertEqual(len(history_dict), 2)

        self.assertDictEqual(history_dict[0]['execution_user_input'], user_input_1_0)
        self.assertDictEqual(history_dict[1]['execution_user_input'], user_input_1_1)

        self.assertEqual(history_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])
        self.assertEqual(history_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])                     


        ### run 3rd time
        res_dict = self.create_new_run(execution_id, step_id_1)
        
        self.assertEqual(res_dict['elem_id'], step_id_1)
        self.assertEqual(len(res_dict['run_records']), 2)
        self.assertTrue(len(res_dict['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(res_dict['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(res_dict['run_records'][1]['elem_id'], step_id_1)

        user_input_1_2 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50],
                'actual_value': 60.2
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30],
                'actual_value': 40.2
            }
        }

        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1_2)
        res_dict = self.run_step(execution_id, step_id_1)

        history_dict = self.get_history(execution_id)
        logger.debug('history_dict: %s', json.dumps(history_dict, indent=4))

        self.assertEqual(len(history_dict), 3)

        self.assertDictEqual(history_dict[0]['execution_user_input'], user_input_1_0)
        self.assertDictEqual(history_dict[1]['execution_user_input'], user_input_1_1)
        self.assertDictEqual(history_dict[2]['execution_user_input'], user_input_1_2)

        self.assertEqual(history_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])
        self.assertEqual(history_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])         
        self.assertEqual(history_dict[2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value']) 

        # check elements
        elements_dict = self.get_elements(execution_url)
        logger.debug('elements_dict: %s', json.dumps(elements_dict, indent=4))

        self.assertEqual(len(elements_dict), 1)

        self.assertEqual(elements_dict[0]['elem_id'], step_id_1)
        self.assertEqual(len(elements_dict[0]['run_records']), 2)
        self.assertTrue(len(elements_dict[0]['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(elements_dict[0]['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[0]['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(elements_dict[0]['run_records'][1]['elem_id'], step_id_1)   

        self.assertEqual(elements_dict[0]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])         
        self.assertEqual(elements_dict[0]['run_records'][1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])              
        self.assertEqual(elements_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])      

        ### add 2nd step
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1,
            level='SIBLING')

        step_id_2 = res_dict['elem']['elem_id']

        user_input_2_0 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [60],
                'actual_value': 70
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [40],
                'actual_value': 50
            }
        }
        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2, user_input_2_0)
        res_dict = self.run_step(execution_id, step_id_2)

        ### run 2nd time
        res_dict = self.create_new_run(execution_id, step_id_2)
        
        self.assertEqual(res_dict['elem_id'], step_id_2)
        self.assertTrue(len(res_dict['run_records'][0]['elem_id']) > 0)        
        self.assertEqual(len(res_dict['run_records']), 1)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_2)

        user_input_2_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [60],
                'actual_value': 70.1
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [40],
                'actual_value': 50.1
            }
        }
        #
        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2, user_input_2_1)
        res_dict = self.run_step(execution_id, step_id_2)

        history_dict = self.get_history(execution_id)
        logger.debug('history_dict: %s', json.dumps(history_dict, indent=4)) 

        self.assertEqual(len(history_dict), 5)

        self.assertDictEqual(history_dict[0]['execution_user_input'], user_input_1_0)
        self.assertDictEqual(history_dict[1]['execution_user_input'], user_input_1_1)
        self.assertDictEqual(history_dict[2]['execution_user_input'], user_input_1_2)
        self.assertDictEqual(history_dict[3]['execution_user_input'], user_input_2_0)
        self.assertDictEqual(history_dict[4]['execution_user_input'], user_input_2_1)

        self.assertEqual(history_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])
        self.assertEqual(history_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])                     
        self.assertEqual(history_dict[2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])
        self.assertEqual(history_dict[3]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])
        self.assertEqual(history_dict[4]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])   

        # check elements
        elements_dict = self.get_elements(execution_url)
        logger.debug('elements_dict: %s', json.dumps(elements_dict, indent=4))

        self.assertEqual(len(elements_dict), 2)

        self.assertEqual(elements_dict[0]['elem_id'], step_id_1)
        self.assertEqual(len(elements_dict[0]['run_records']), 2)
        self.assertTrue(len(elements_dict[0]['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(elements_dict[0]['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[0]['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(elements_dict[0]['run_records'][1]['elem_id'], step_id_1)   

        self.assertEqual(elements_dict[0]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])         
        self.assertEqual(elements_dict[0]['run_records'][1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])              
        self.assertEqual(elements_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])   

        self.assertEqual(elements_dict[1]['elem_id'], step_id_2)
        self.assertEqual(len(elements_dict[1]['run_records']), 1)
        self.assertTrue(len(elements_dict[1]['run_records'][0]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[1]['run_records'][0]['elem_id'], step_id_2) 

        self.assertEqual(elements_dict[1]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])                     
        self.assertEqual(elements_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])                                              

        # Go back and run the 1st step
        res_dict = self.create_new_run(execution_id, step_id_1)
        
        self.assertEqual(res_dict['elem_id'], step_id_1)
        self.assertEqual(len(res_dict['run_records']), 3)
        self.assertTrue(len(res_dict['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(res_dict['run_records'][1]['elem_id']) > 0)
        self.assertTrue(len(res_dict['run_records'][2]['elem_id']) > 0)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(res_dict['run_records'][1]['elem_id'], step_id_1)
        self.assertNotEqual(res_dict['run_records'][2]['elem_id'], step_id_1)

        user_input_1_3 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50],
                'actual_value': 60.3
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30],
                'actual_value': 40.3
            }
        }

        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1_3)
        res_dict = self.run_step(execution_id, step_id_1)

        # check history
        history_dict = self.get_history(execution_id)
        logger.debug('history_dict: %s', json.dumps(history_dict, indent=4))

        self.assertEqual(len(history_dict), 6)

        self.assertDictEqual(history_dict[0]['execution_user_input'], user_input_1_0)
        self.assertDictEqual(history_dict[1]['execution_user_input'], user_input_1_1)
        self.assertDictEqual(history_dict[2]['execution_user_input'], user_input_1_2)
        self.assertDictEqual(history_dict[3]['execution_user_input'], user_input_2_0)
        self.assertDictEqual(history_dict[4]['execution_user_input'], user_input_2_1)
        self.assertDictEqual(history_dict[5]['execution_user_input'], user_input_1_3)

        self.assertEqual(history_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])
        self.assertEqual(history_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])                     
        self.assertEqual(history_dict[2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])
        self.assertEqual(history_dict[3]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])
        self.assertEqual(history_dict[4]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])   
        self.assertEqual(history_dict[5]['execution']['results']['temperature']['actual_value'], 
            user_input_1_3['temperature']['actual_value'])

        # check elements
        elements_dict = self.get_elements(execution_url)
        logger.debug('elements_dict: %s', json.dumps(elements_dict, indent=4))

        self.assertEqual(len(elements_dict), 2)

        self.assertEqual(elements_dict[0]['elem_id'], step_id_1)
        self.assertEqual(len(elements_dict[0]['run_records']), 3)
        self.assertTrue(len(elements_dict[0]['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(elements_dict[0]['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[0]['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(elements_dict[0]['run_records'][1]['elem_id'], step_id_1) 
        self.assertNotEqual(elements_dict[0]['run_records'][2]['elem_id'], step_id_1)  

        self.assertEqual(elements_dict[0]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])         
        self.assertEqual(elements_dict[0]['run_records'][1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])          
        self.assertEqual(elements_dict[0]['run_records'][2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])
        self.assertEqual(elements_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_3['temperature']['actual_value'])   

        self.assertEqual(elements_dict[1]['elem_id'], step_id_2)
        self.assertEqual(len(elements_dict[1]['run_records']), 1)
        self.assertTrue(len(elements_dict[1]['run_records'][0]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[1]['run_records'][0]['elem_id'], step_id_2) 

        self.assertEqual(elements_dict[1]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])                     
        self.assertEqual(elements_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])  

        ## jump forward and run step 2 again
        res_dict = self.create_new_run(execution_id, step_id_2)
        
        self.assertEqual(res_dict['elem_id'], step_id_2)
        self.assertTrue(len(res_dict['run_records'][0]['elem_id']) > 0) 
        self.assertTrue(len(res_dict['run_records'][1]['elem_id']) > 0)       
        self.assertEqual(len(res_dict['run_records']), 2)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_2)
        self.assertNotEqual(res_dict['run_records'][1]['elem_id'], step_id_2)

        user_input_2_2 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [60],
                'actual_value': 70.2
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [40],
                'actual_value': 50.2
            }
        }
        #
        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2, user_input_2_2)
        res_dict = self.run_step(execution_id, step_id_2)

        # check history
        history_dict = self.get_history(execution_id)
        logger.debug('history_dict: %s', json.dumps(history_dict, indent=4))

        self.assertEqual(len(history_dict), 7)

        self.assertDictEqual(history_dict[0]['execution_user_input'], user_input_1_0)
        self.assertDictEqual(history_dict[1]['execution_user_input'], user_input_1_1)
        self.assertDictEqual(history_dict[2]['execution_user_input'], user_input_1_2)
        self.assertDictEqual(history_dict[3]['execution_user_input'], user_input_2_0)
        self.assertDictEqual(history_dict[4]['execution_user_input'], user_input_2_1)
        self.assertDictEqual(history_dict[5]['execution_user_input'], user_input_1_3)
        self.assertDictEqual(history_dict[6]['execution_user_input'], user_input_2_2)

        self.assertEqual(history_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])
        self.assertEqual(history_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])                     
        self.assertEqual(history_dict[2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])
        self.assertEqual(history_dict[3]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])
        self.assertEqual(history_dict[4]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])   
        self.assertEqual(history_dict[5]['execution']['results']['temperature']['actual_value'], 
            user_input_1_3['temperature']['actual_value'])
        self.assertEqual(history_dict[6]['execution']['results']['temperature']['actual_value'], 
            user_input_2_2['temperature']['actual_value'])            

        # check elements
        elements_dict = self.get_elements(execution_url)
        logger.debug('elements_dict: %s', json.dumps(elements_dict, indent=4))

        self.assertEqual(len(elements_dict), 2)

        self.assertEqual(elements_dict[0]['elem_id'], step_id_1)
        self.assertEqual(len(elements_dict[0]['run_records']), 3)
        self.assertTrue(len(elements_dict[0]['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(elements_dict[0]['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[0]['run_records'][0]['elem_id'], step_id_1)
        self.assertNotEqual(elements_dict[0]['run_records'][1]['elem_id'], step_id_1) 
        self.assertNotEqual(elements_dict[0]['run_records'][2]['elem_id'], step_id_1)  

        self.assertEqual(elements_dict[0]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_0['temperature']['actual_value'])         
        self.assertEqual(elements_dict[0]['run_records'][1]['execution']['results']['temperature']['actual_value'], 
            user_input_1_1['temperature']['actual_value'])          
        self.assertEqual(elements_dict[0]['run_records'][2]['execution']['results']['temperature']['actual_value'], 
            user_input_1_2['temperature']['actual_value'])
        self.assertEqual(elements_dict[0]['execution']['results']['temperature']['actual_value'], 
            user_input_1_3['temperature']['actual_value'])   

        self.assertEqual(elements_dict[1]['elem_id'], step_id_2)
        self.assertEqual(len(elements_dict[1]['run_records']), 2)
        self.assertTrue(len(elements_dict[1]['run_records'][0]['elem_id']) > 0)
        self.assertTrue(len(elements_dict[1]['run_records'][1]['elem_id']) > 0)
        self.assertNotEqual(elements_dict[1]['run_records'][0]['elem_id'], step_id_2) 
        self.assertNotEqual(elements_dict[1]['run_records'][1]['elem_id'], step_id_2)

        self.assertEqual(elements_dict[1]['run_records'][0]['execution']['results']['temperature']['actual_value'], 
            user_input_2_0['temperature']['actual_value'])
        self.assertEqual(elements_dict[1]['run_records'][1]['execution']['results']['temperature']['actual_value'], 
            user_input_2_1['temperature']['actual_value'])                                  
        self.assertEqual(elements_dict[1]['execution']['results']['temperature']['actual_value'], 
            user_input_2_2['temperature']['actual_value'])          

        self.close_execution(execution_id)


    def test_continue_execution(self):


        id_dict = self.create_execution_example_using_core()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']


        url = execution_url + '/continue'

        result = requests.post(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 204)

        self.close_execution(execution_id)


    def test_close_execution(self):


        id_dict = self.create_execution_example_using_core()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        execution = self.get_execution(execution_id)
        venue_id = execution['venue_id']

        venue = self.get_venue(venue_id)

        self.assertEqual(venue['venue_status']['status'], 'IN_USE')

        res_dict = self.get_execution_status(execution_id)
        self.assertEqual(res_dict['status'], 'IDLE')

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'IDLE')
        self.assertTrue(execution['time_completed'] == '')
        self.assertEqual(execution['transitions'], [])

        self.close_execution(execution_id)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'CLOSED')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['current_step_number'], '')
        self.assertEqual(execution['current_step_title'], '')
        self.assertEqual(execution['current_procedure_id'], '')
        self.assertEqual(execution['current_procedure_title'], '')
        
        self.assertTrue(len(execution['time_completed']) > 0)

        res_dict = self.get_execution_status(execution_id)
        self.assertEqual(res_dict['status'], 'CLOSED')

        venue = self.get_venue(venue_id)

        self.assertEqual(venue['venue_status']['status'], 'AVAILABLE')
        
        res_dict = self.get_execution(execution_id)
        self.assertEqual(res_dict['status'], 'CLOSED')
        self.assertEqual(len(res_dict['transitions']), 1)
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        comment1 = 'ready for review'
        self.update_execution_status(execution_id, {'status': 'IN_REVIEW', 'comment': comment1})
        res_dict = self.get_execution(execution_id)
        self.assertEqual(res_dict['status'], 'IN_REVIEW')
        self.assertEqual(len(res_dict['transitions']), 2)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)
        
        comment2 = 'it is finalized'
        self.update_execution_status(execution_id, {'status': 'FINALIZED', 'comment': comment2})
        res_dict = self.get_execution(execution_id)
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))
        
        self.assertEqual(res_dict['status'], 'FINALIZED')
        self.assertEqual(len(res_dict['transitions']), 3)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][2]['from_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][2]['to_status'], 'FINALIZED')
        self.assertEqual(res_dict['transitions'][2]['comment'], comment2)
        self.assertTrue(len(res_dict['transitions'][2]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][2]['time_updated']) > 0)                               
             
    def test_execution_lifecycle(self):
        id_dict = self.create_execution_example_using_core()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        execution = self.get_execution(execution_id)
        venue_id = execution['venue_id']

        venue = self.get_venue(venue_id)

        self.assertEqual(venue['venue_status']['status'], 'IN_USE')

        res_dict = self.get_execution_status(execution_id)
        self.assertEqual(res_dict['status'], 'IDLE')

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'IDLE')
        self.assertTrue(execution['time_completed'] == '')
        self.assertEqual(execution['transitions'], [])

        self.close_execution(execution_id)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'CLOSED')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['current_step_number'], '')
        self.assertEqual(execution['current_step_title'], '')
        self.assertEqual(execution['current_procedure_id'], '')
        self.assertEqual(execution['current_procedure_title'], '')
        
        self.assertTrue(len(execution['time_completed']) > 0)

        res_dict = self.get_execution_status(execution_id)
        self.assertEqual(res_dict['status'], 'CLOSED')

        venue = self.get_venue(venue_id)

        self.assertEqual(venue['venue_status']['status'], 'AVAILABLE')
        
        res_dict = self.get_execution(execution_id)
        time_completed = res_dict['time_completed'] 
        self.assertEqual(res_dict['status'], 'CLOSED')
        self.assertEqual(len(res_dict['transitions']), 1)
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)

        # Cannot re-open execution
        error_dict = self.update_execution_status(execution_id, {'status': 'IDLE', 'comment': ''}, code_expected=400)
        self.assertEqual(error_dict['message'], 'Error when updating an execution status')
        self.assertTrue(error_dict['details'][0].startswith('Execution has been closed'))
        
        # Cannot re-open execution
        error_dict = self.update_execution_status(execution_id, {'status': 'SUSPENDED', 'comment': ''}, code_expected=400)
        self.assertEqual(error_dict['message'], 'Error when updating an execution status')
        self.assertTrue(error_dict['details'][0].startswith('Execution has been closed'))

        #
        comment1 = 'ready for review'
        self.update_execution_status(execution_id, {'status': 'IN_REVIEW', 'comment': comment1})
        res_dict = self.get_execution(execution_id)
        self.assertEqual(res_dict['status'], 'IN_REVIEW')
        self.assertEqual(len(res_dict['transitions']), 2)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)

        # Cannot re-open execution
        error_dict = self.update_execution_status(execution_id, {'status': 'IDLE', 'comment': ''}, code_expected=400)
        self.assertEqual(error_dict['message'], 'Error when updating an execution status')
        self.assertTrue(error_dict['details'][0].startswith('Execution has been closed'))

        comment1b = 'Not ready for review'
        self.update_execution_status(execution_id, {'status': 'CLOSED', 'comment': comment1b})
        res_dict = self.get_execution(execution_id)
        self.assertEqual(res_dict['status'], 'CLOSED')
        
        # time completed should not be changed
        self.assertEqual(res_dict['time_completed'], time_completed)

        self.assertEqual(len(res_dict['transitions']), 3)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)    

        self.assertEqual(res_dict['transitions'][2]['from_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][2]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][2]['comment'], comment1b)
        self.assertTrue(len(res_dict['transitions'][2]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][2]['time_updated']) > 0)

        comment1c = 'Ready for review again'
        self.update_execution_status(execution_id, {'status': 'IN_REVIEW', 'comment': comment1c})
        res_dict = self.get_execution(execution_id)
        self.assertEqual(res_dict['status'], 'IN_REVIEW')
        self.assertEqual(len(res_dict['transitions']), 4)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)    

        self.assertEqual(res_dict['transitions'][2]['from_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][2]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][2]['comment'], comment1b)
        self.assertTrue(len(res_dict['transitions'][2]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][2]['time_updated']) > 0)   

        self.assertEqual(res_dict['transitions'][3]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][3]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][3]['comment'], comment1c)
        self.assertTrue(len(res_dict['transitions'][3]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][3]['time_updated']) > 0) 
        
        comment2 = 'it is finalized'
        self.update_execution_status(execution_id, {'status': 'FINALIZED', 'comment': comment2})
        res_dict = self.get_execution(execution_id)
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))
        
        self.assertEqual(res_dict['status'], 'FINALIZED')

        # time completed should not be changed
        self.assertEqual(res_dict['time_completed'], time_completed)

        self.assertEqual(len(res_dict['transitions']), 5)
        
        self.assertEqual(res_dict['transitions'][0]['from_status'], 'IDLE')
        self.assertEqual(res_dict['transitions'][0]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][0]['comment'], '')
        self.assertTrue(len(res_dict['transitions'][0]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][0]['time_updated']) > 0)
        
        self.assertEqual(res_dict['transitions'][1]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][1]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][1]['comment'], comment1)
        self.assertTrue(len(res_dict['transitions'][1]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][1]['time_updated']) > 0)

        self.assertEqual(res_dict['transitions'][2]['from_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][2]['to_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][2]['comment'], comment1b)
        self.assertTrue(len(res_dict['transitions'][2]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][2]['time_updated']) > 0)   

        self.assertEqual(res_dict['transitions'][3]['from_status'], 'CLOSED')
        self.assertEqual(res_dict['transitions'][3]['to_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][3]['comment'], comment1c)
        self.assertTrue(len(res_dict['transitions'][3]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][3]['time_updated']) > 0) 
        
        self.assertEqual(res_dict['transitions'][4]['from_status'], 'IN_REVIEW')
        self.assertEqual(res_dict['transitions'][4]['to_status'], 'FINALIZED')
        self.assertEqual(res_dict['transitions'][4]['comment'], comment2)
        self.assertTrue(len(res_dict['transitions'][4]['user_name']) > 0)
        self.assertTrue(len(res_dict['transitions'][4]['time_updated']) > 0)                               

    def test_create_execution(self):

        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        ## Get As Run
        res_dict = self.get_as_run(execution_id)


        self.check_as_run(res_dict)


        ## Test for getting steps
        self.run_get_elements(execution_id)

        ## Get As Run
        res_dict = self.get_as_run(execution_id)


        self.check_as_run(res_dict)
        
    def test_suspend_execution(self):

        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']
        
        ## Get execution
        execution_info = self.get_execution(execution_id)
        test_conductors = execution_info['test_conductors']
        self.assertEqual(execution_info['status'], 'IDLE')
        
        # check venue
        venue_id = execution_info['venue_id']
        venue = self.get_venue(venue_id)
        self.assertEqual(venue['venue_status']['status'], 'IN_USE')
        self.assertEqual(venue['venue_status']['execution_id'], execution_id) 

        #### Run a step
        res_dict = self.run_step(execution_id, step_id_1_1)
        
        ## suspend
        execution_info = self.update_execution_status(execution_id, {'status': 'SUSPENDED', 'comment': 'first suspension'}, code_expected=200)
        logger.debug('after first suspension execution_info= %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        self.assertEqual(execution_info['test_conductors'], test_conductors)
            
        # check venue
        venue = self.get_venue(venue_id)
        self.assertEqual(venue['venue_status']['status'], 'AVAILABLE')
        self.assertEqual(venue['venue_status']['execution_id'], '')
        self.assertEqual(venue['venue_status']['test_conductor'], '')
        self.assertEqual(venue['venue_status']['started_on'], '')        
        
        ## resume
        execution_info = self.resume_execution(execution_id, {'venue_id': venue_id})
        logger.debug('after first resume execution_info= %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(execution_info['test_conductors'], test_conductors)
        
        # check venue
        venue = self.get_venue(venue_id)
        self.assertEqual(venue['venue_status']['status'], 'IN_USE')
        self.assertEqual(venue['venue_status']['execution_id'], execution_id)
        self.assertEqual(venue['venue_status']['test_conductor'], test_conductors[0])
        self.assertTrue(len(venue['venue_status']['started_on']) > 0)

        ## Run a step
        res_dict = self.run_step(execution_id, step_id_1_2)
        
        ## suspend
        execution_info = self.update_execution_status(execution_id, {'status': 'SUSPENDED', 'comment': 'second suspension'}, code_expected=200)
        logger.debug('after first suspension execution_info= %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        
        # check venue
        venue = self.get_venue(venue_id)
        self.assertEqual(venue['venue_status']['status'], 'AVAILABLE')
        self.assertEqual(venue['venue_status']['execution_id'], '')
        self.assertEqual(venue['venue_status']['test_conductor'], '')
        self.assertEqual(venue['venue_status']['started_on'], '')
                
        ## resume
        execution_info = self.resume_execution(execution_id, {'venue_id': venue_id})
        logger.debug('after second resume execution_info= %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(execution_info['test_conductors'], test_conductors)        

        ## Run a step
        res_dict = self.run_step(execution_id, step_id_3_1)
        
        # close
        self.close_execution(execution_id)       
        
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'CLOSED')
        transitions = execution_info['transitions']
        self.assertEqual(len(transitions), 5)
        self.assertEqual(transitions[0]['from_status'], 'IDLE')
        self.assertEqual(transitions[0]['to_status'], 'SUSPENDED')
        self.assertEqual(transitions[1]['from_status'], 'SUSPENDED')
        self.assertEqual(transitions[1]['to_status'], 'IDLE')
        self.assertEqual(transitions[2]['from_status'], 'IDLE')
        self.assertEqual(transitions[2]['to_status'], 'SUSPENDED')
        self.assertEqual(transitions[3]['from_status'], 'SUSPENDED')
        self.assertEqual(transitions[3]['to_status'], 'IDLE')
        self.assertEqual(transitions[4]['from_status'], 'IDLE')
        self.assertEqual(transitions[4]['to_status'], 'CLOSED')                                
        
        # logger.debug('after close execution_info= %s', json.dumps(execution_info, indent=4))                    

    def test_update_step(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        ## Check execution
        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        # add step 1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.VENUE_CONFIG_MANUAL,
            insert_after_id='-1',
            level='')

        logger.debug('new step res_dict= %s', json.dumps(res_dict, indent=4))

        step_1 = res_dict['elem']
        step_1_id = step_1['elem_id']

        new_description = 'Once updated step'
        self.update_step(execution_url,
            StepTypes.VENUE_CONFIG_MANUAL, step_1_id, {'description': new_description})
        res_dict = self.get_step(execution_url, StepTypes.VENUE_CONFIG_MANUAL, step_1_id)
        self.assertEqual(res_dict['description'], new_description)

        new_description_2 = 'Twice updated step'
        step_1['description'] = new_description_2
        self.update_step(execution_url,
            StepTypes.VENUE_CONFIG_MANUAL, step_1_id, step_1)
        res_dict = self.get_step(execution_url, StepTypes.VENUE_CONFIG_MANUAL, step_1_id)
        self.assertEqual(res_dict['description'], new_description_2)            

        # add step 2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.GDS_MANUAL,
            insert_after_id=step_1_id,
            level='SIBLING')

        logger.debug('new step res_dict= %s', json.dumps(res_dict, indent=4))

        step_2 = res_dict['elem']
        step_2_id = step_2['elem_id']

        new_description = 'Once updated step'
        self.update_step(execution_url,
            StepTypes.GDS_MANUAL, step_2_id, {'description': new_description})
        res_dict = self.get_step(execution_url, StepTypes.GDS_MANUAL, step_2_id)
        self.assertEqual(res_dict['description'], new_description)

        new_description_2 = 'Twice updated step'
        step_2['description'] = new_description_2
        self.update_step(execution_url,
            StepTypes.GDS_MANUAL, step_2_id, step_2)
        res_dict = self.get_step(execution_url, StepTypes.GDS_MANUAL, step_2_id)
        self.assertEqual(res_dict['description'], new_description_2)      

        # add step 3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_2_id,
            level='SIBLING')

        logger.debug('new step res_dict= %s', json.dumps(res_dict, indent=4))

        step_3 = res_dict['elem']
        step_3_id = step_3['elem_id']

        new_description = 'Once updated step'
        self.update_step(execution_url,
            StepTypes.WAIT, step_3_id, {'description': new_description})
        res_dict = self.get_step(execution_url, StepTypes.WAIT, step_3_id)
        self.assertEqual(res_dict['description'], new_description)

        new_description_2 = 'Twice updated step'
        step_3['description'] = new_description_2
        self.update_step(execution_url,
            StepTypes.WAIT, step_3_id, step_3)
        res_dict = self.get_step(execution_url, StepTypes.WAIT, step_3_id)
        self.assertEqual(res_dict['description'], new_description_2)                    

    def test_copy_element(self):
        logger.debug('test_copy_element')

        id_dict = self.create_execution_example()
        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        self.run_copy_elements(id_dict)          

    def test_copy_elements(self):
        id_dict = self.create_execution_example()
        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        ## copy a step
        res_dict = self.copy_elements(base_url=execution_url,
            elem_ids=[step_id_1_1, step_id_3_1], insert_after_id=section_id_3, level='CHILD',
            code_expected=200)
        
        logger.debug('copy_element res: %s', json.dumps(res_dict, indent=4))            
        
        self.assertEqual(len(res_dict['numbers']), 5)
        self.assertEqual(res_dict['numbers'][0]['number'], "3-1")
        self.assertEqual(res_dict['numbers'][1]['number'], "3-2")
        self.assertEqual(res_dict['numbers'][2]['number'], "3-3")
        self.assertEqual(res_dict['numbers'][3]['number'], "3-4")
        self.assertEqual(res_dict['numbers'][4]['number'], "3-5")

        self.assertEqual(len(res_dict['elements']), 2)
        self.assertEqual(res_dict['elements'][0]['title'], 'Step 1-1')
        self.assertEqual(res_dict['elements'][0]['number'], '3-1')
        self.assertEqual(res_dict['elements'][1]['title'], 'Step 3-1')
        self.assertEqual(res_dict['elements'][1]['number'], '3-2')         

        res_dict = self.get_elements(execution_url)
        logger.debug('copied step elements res_dict= %s', json.dumps(res_dict, indent=4))

        self.assertEqual(len(res_dict), 10)
        self.assertEqual(res_dict[0]['title'], "Section 1")
        self.assertEqual(res_dict[1]['title'], "Step 1-1")
        self.assertEqual(res_dict[2]['title'], "Step 1-2")
        self.assertEqual(res_dict[3]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict[4]['title'], "Section 3")
        self.assertEqual(res_dict[5]['title'], "Step 1-1")        
        self.assertEqual(res_dict[6]['title'], "Step 3-1") 
        self.assertEqual(res_dict[7]['title'], "Step 3-1")
        self.assertEqual(res_dict[8]['title'], "Step 3-2")
        self.assertEqual(res_dict[9]['title'], "Step 3-3")

        self.assertEqual(res_dict[0]['number'], "1")
        self.assertEqual(res_dict[1]['number'], "1-1")
        self.assertEqual(res_dict[2]['number'], "1-2")
        self.assertEqual(res_dict[3]['number'], "2")
        self.assertEqual(res_dict[4]['number'], "3")
        self.assertEqual(res_dict[5]['number'], "3-1")
        self.assertEqual(res_dict[6]['number'], "3-2")
        self.assertEqual(res_dict[7]['number'], "3-3")   
        self.assertEqual(res_dict[8]['number'], "3-4")     
        self.assertEqual(res_dict[9]['number'], "3-5") 

    def test_copy_element_across_executions(self):
        logger.debug('test_copy_across_executions')

        source_id_dict = self.create_execution_example()
        source_execution_url = source_id_dict['execution_url']
        source_execution_id = source_id_dict['execution_id']
        source_section_id_1 = source_id_dict['section_id_1']
        source_step_id_1_1 = source_id_dict['step_id_1_1']
        source_step_id_1_2 = source_id_dict['step_id_1_2']
        source_section_id_3 = source_id_dict['section_id_3']
        source_step_id_3_1 = source_id_dict['step_id_3_1']
        source_step_id_3_2 = source_id_dict['step_id_3_2']
        source_step_id_3_3 = source_id_dict['step_id_3_3']

        target_id_dict = self.create_execution_example()
        target_execution_url = target_id_dict['execution_url']
        target_execution_id = target_id_dict['execution_id']
        target_section_id_1 = target_id_dict['section_id_1']
        target_step_id_1_1 = target_id_dict['step_id_1_1']
        target_step_id_1_2 = target_id_dict['step_id_1_2']
        target_section_id_3 = target_id_dict['section_id_3']
        target_step_id_3_1 = target_id_dict['step_id_3_1']
        target_step_id_3_2 = target_id_dict['step_id_3_2']
        target_step_id_3_3 = target_id_dict['step_id_3_3']        

        res_dict = self.copy_element_across(target_execution_url, source_section_id_1, target_section_id_1, 'SIBLING', 
            source_execution_id, None, None)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))            

        added_elements = res_dict['elements']
        self.assertEqual(len(added_elements), 3)

        for added_element in added_elements:
            self.assertEqual(added_element['execution_id'], target_execution_id)

        numbers = res_dict['numbers']
        self.assertEqual(len(numbers), 8)

        self.assertEqual(numbers[0]['number'], '2')
        self.assertEqual(numbers[1]['number'], '2-1')
        self.assertEqual(numbers[2]['number'], '2-2')
        self.assertEqual(numbers[3]['number'], '3')
        self.assertEqual(numbers[4]['number'], '4')
        self.assertEqual(numbers[5]['number'], '4-1')
        self.assertEqual(numbers[6]['number'], '4-2') 
        self.assertEqual(numbers[7]['number'], '4-3')                  

        elements = self.get_elements(target_execution_url)
        logger.debug('after copy elements elements= %s', json.dumps(elements, indent=4))   

        self.assertEqual(len(elements), 11)

        for element in elements:
            self.assertEqual(element['execution_id'], target_execution_id)    

        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[2]['number'], '1-2')
        self.assertEqual(elements[3]['number'], '2')
        self.assertEqual(elements[4]['number'], '2-1')
        self.assertEqual(elements[5]['number'], '2-2')
        self.assertEqual(elements[6]['number'], '3')
        self.assertEqual(elements[7]['number'], '4')
        self.assertEqual(elements[8]['number'], '4-1')
        self.assertEqual(elements[9]['number'], '4-2') 
        self.assertEqual(elements[10]['number'], '4-3')            

    def test_copy_elements_across_executions(self):
        logger.debug('test_copy_elements_across_executions')

        source_id_dict = self.create_execution_example()
        source_execution_url = source_id_dict['execution_url']
        source_execution_id = source_id_dict['execution_id']
        source_section_id_1 = source_id_dict['section_id_1']
        source_step_id_1_1 = source_id_dict['step_id_1_1']
        source_step_id_1_2 = source_id_dict['step_id_1_2']
        source_section_id_3 = source_id_dict['section_id_3']
        source_step_id_3_1 = source_id_dict['step_id_3_1']
        source_step_id_3_2 = source_id_dict['step_id_3_2']

        target_id_dict = self.create_execution_example()
        target_execution_url = target_id_dict['execution_url']
        target_execution_id = target_id_dict['execution_id']
        target_section_id_1 = target_id_dict['section_id_1']
        target_step_id_1_1 = target_id_dict['step_id_1_1']
        target_step_id_1_2 = target_id_dict['step_id_1_2']
        target_section_id_3 = target_id_dict['section_id_3']
        target_step_id_3_1 = target_id_dict['step_id_3_1']
        target_step_id_3_2 = target_id_dict['step_id_3_2']        

        res_dict = self.copy_elements_across(target_execution_url, [source_section_id_1, source_step_id_3_1], target_section_id_1, 'SIBLING', 
            source_execution_id, None, None)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))            

        added_elements = res_dict['elements']
        self.assertEqual(len(added_elements), 4)

        for added_element in added_elements:
            self.assertEqual(added_element['execution_id'], target_execution_id)

        numbers = res_dict['numbers']
        self.assertEqual(len(numbers), 9)

        self.assertEqual(numbers[0]['number'], '2')
        self.assertEqual(numbers[1]['number'], '2-1')
        self.assertEqual(numbers[2]['number'], '2-2')
        self.assertEqual(numbers[3]['number'], '3')
        self.assertEqual(numbers[4]['number'], '4')
        self.assertEqual(numbers[5]['number'], '5')
        self.assertEqual(numbers[6]['number'], '5-1')
        self.assertEqual(numbers[7]['number'], '5-2')       
        self.assertEqual(numbers[8]['number'], '5-3')            

        elements = self.get_elements(target_execution_url)
        logger.debug('after copy elements elements= %s', json.dumps(elements, indent=4))   

        self.assertEqual(len(elements), 12)

        for element in elements:
            self.assertEqual(element['execution_id'], target_execution_id)    

        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[2]['number'], '1-2')
        self.assertEqual(elements[3]['number'], '2')
        self.assertEqual(elements[4]['number'], '2-1')
        self.assertEqual(elements[5]['number'], '2-2')
        self.assertEqual(elements[6]['number'], '3')
        self.assertEqual(elements[7]['number'], '4')
        self.assertEqual(elements[8]['number'], '5')
        self.assertEqual(elements[9]['number'], '5-1')
        self.assertEqual(elements[10]['number'], '5-2') 
        self.assertEqual(elements[11]['number'], '5-3')    

    def test_copy_from_procedure_to_execution(self):
        logger.debug('test_copy_from_procedure_to_execution')

        source_id_dict = self.create_procedure_example()
        source_procedure_id = source_id_dict['procedure_id']
        source_procedure_url = source_id_dict['procedure_url']
        source_procedure_title = source_id_dict['procedure_title']
        source_version = source_id_dict['version']
        source_version_description = source_id_dict['version_description']
        source_section_1_id = source_id_dict['section_1_id']
        source_paragraph_1_1_id = source_id_dict['paragraph_1_1_id']
        source_step_1_2_id = source_id_dict['step_1_2_id']
        source_step_1_3_id = source_id_dict['step_1_3_id']
        source_section_2_id = source_id_dict['section_2_id']
        source_step_2_1_id = source_id_dict['step_2_1_id']
        source_step_2_2_id = source_id_dict['step_2_2_id']

        target_id_dict = self.create_execution_example()
        target_execution_url = target_id_dict['execution_url']
        target_execution_id = target_id_dict['execution_id']
        target_section_id_1 = target_id_dict['section_id_1']
        target_step_id_1_1 = target_id_dict['step_id_1_1']
        target_step_id_1_2 = target_id_dict['step_id_1_2']
        target_section_id_3 = target_id_dict['section_id_3']
        target_step_id_3_1 = target_id_dict['step_id_3_1']
        target_step_id_3_2 = target_id_dict['step_id_3_2']  
        target_step_id_3_3 = target_id_dict['step_id_3_3']       

        res_dict = self.copy_element_across(target_execution_url, source_section_1_id, target_section_id_1, 'SIBLING', 
            None, source_procedure_id, source_version)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))            

        added_elements = res_dict['elements']
        self.assertEqual(len(added_elements), 4)

        for added_element in added_elements:
            self.assertEqual(added_element['execution_id'], target_execution_id)
            self.assertEqual(added_element['procedure_id'], '')

        numbers = res_dict['numbers']
        self.assertEqual(len(numbers), 9)

        self.assertEqual(numbers[0]['number'], '2')
        self.assertEqual(numbers[1]['number'], '2-1')
        self.assertEqual(numbers[2]['number'], '2-2')
        self.assertEqual(numbers[3]['number'], '2-3')
        self.assertEqual(numbers[4]['number'], '3')
        self.assertEqual(numbers[5]['number'], '4')
        self.assertEqual(numbers[6]['number'], '4-1')
        self.assertEqual(numbers[7]['number'], '4-2')   
        self.assertEqual(numbers[8]['number'], '4-3')               

        elements = self.get_elements(target_execution_url)
        logger.debug('after copy elements elements= %s', json.dumps(elements, indent=4))   

        self.assertEqual(len(elements), 12)

        for element in elements:
            self.assertEqual(element['execution_id'], target_execution_id)   
            self.assertEqual(added_element['procedure_id'], '') 

        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[2]['number'], '1-2')
        self.assertEqual(elements[3]['number'], '2')
        self.assertEqual(elements[4]['number'], '2-1')
        self.assertEqual(elements[5]['number'], '2-2')
        self.assertEqual(elements[6]['number'], '2-3')
        self.assertEqual(elements[7]['number'], '3')
        self.assertEqual(elements[8]['number'], '4')
        self.assertEqual(elements[9]['number'], '4-1')
        self.assertEqual(elements[10]['number'], '4-2') 
        self.assertEqual(elements[11]['number'], '4-3')  

    def test_copy_from_execution_to_procedure(self):
        logger.debug('test_copy_from_execution_to_procedure')

        source_id_dict = self.create_execution_example()
        source_execution_url = source_id_dict['execution_url']
        source_execution_id = source_id_dict['execution_id']
        source_section_id_1 = source_id_dict['section_id_1']
        source_step_id_1_1 = source_id_dict['step_id_1_1']
        source_step_id_1_2 = source_id_dict['step_id_1_2']
        source_section_id_3 = source_id_dict['section_id_3']
        source_step_id_3_1 = source_id_dict['step_id_3_1']
        source_step_id_3_2 = source_id_dict['step_id_3_2']     
        source_step_id_3_3 = source_id_dict['step_id_3_3']     

        target_id_dict = self.create_procedure_example()
        target_procedure_id = target_id_dict['procedure_id']
        target_procedure_url = target_id_dict['procedure_url']
        target_procedure_title = target_id_dict['procedure_title']
        target_version = target_id_dict['version']
        target_version_description = target_id_dict['version_description']
        target_section_1_id = target_id_dict['section_1_id']
        target_paragraph_1_1_id = target_id_dict['paragraph_1_1_id']
        target_step_1_2_id = target_id_dict['step_1_2_id']
        target_step_1_3_id = target_id_dict['step_1_3_id']
        target_section_2_id = target_id_dict['section_2_id']
        target_step_2_1_id = target_id_dict['step_2_1_id']
        target_step_2_2_id = target_id_dict['step_2_2_id']

        res_dict = self.copy_element_across(target_procedure_url, source_section_id_1, target_section_1_id, 'SIBLING', 
            source_execution_id, None, None)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))            

        added_elements = res_dict['elements']
        self.assertEqual(len(added_elements), 3)

        for added_element in added_elements:
            self.assertEqual(added_element['execution_id'], '')
            self.assertEqual(added_element['procedure_id'], target_procedure_id)

        numbers = res_dict['numbers']
        self.assertEqual(len(numbers), 6)

        self.assertEqual(numbers[0]['number'], '2')
        self.assertEqual(numbers[1]['number'], '2-1')
        self.assertEqual(numbers[2]['number'], '2-2')
        self.assertEqual(numbers[3]['number'], '3')
        self.assertEqual(numbers[4]['number'], '3-1')
        self.assertEqual(numbers[5]['number'], '3-2')             

        elements = self.get_elements(target_procedure_url)
        logger.debug('after copy elements elements= %s', json.dumps(elements, indent=4))   

        self.assertEqual(len(elements), 10)

        for element in elements:
            self.assertEqual(element['execution_id'], '')
            self.assertEqual(added_element['procedure_id'], target_procedure_id)

        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[2]['number'], '1-2')
        self.assertEqual(elements[3]['number'], '1-3')
        self.assertEqual(elements[4]['number'], '2')        
        self.assertEqual(elements[5]['number'], '2-1')
        self.assertEqual(elements[6]['number'], '2-2')
        self.assertEqual(elements[7]['number'], '3')
        self.assertEqual(elements[8]['number'], '3-1')
        self.assertEqual(elements[9]['number'], '3-2')

    def test_copy_executed_element(self):
        logger.debug('test_copy_from_executed_element')

        description = 'My execution'
        res_dict = self.create_venue('WSTS')
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        execution_dict = self.create_execution(venue_id, description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id        

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']
        
        user_input_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50],
                'actual_value': 60
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30],
                'actual_value': 40
            }
        } 

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1)
        res_dict = self.run_step(execution_id, step_id_1)

        # add another step to execution
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']        
        user_input_2 = {
            'entries': [
                {
                    'name': 'param1',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['abc'],
                    'actual_value': 'abc'
                },
                {
                    'name': 'param2',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['11.0'],
                    'actual_value': '11.0'
                }
            ]
        }
        self.set_step_input(execution_url, StepTypes.MANUAL_INPUT, step_id_2, user_input_2)        

        ## add procedure
        procedure_title = 'title_' + random_string()
        procedure_dict = self.create_procedure(procedure_title, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id='-1',
            level='CHILD')
        proc_step_id = res_dict['elem']['elem_id']
        
        user_input = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [51]
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [31]
            }
        }       

        self.set_step_input(procedure_url, StepTypes.ENVIRONMENT_MANUAL, proc_step_id, user_input)        

        # Copy from procedure to execution
        res_dict = self.copy_element_across(procedure_url, step_id_1, proc_step_id, 'SIBLING', 
            execution_id, None, None)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))

        copied_step_id = res_dict['elements'][0]['elem_id']

        res_dict = self.copy_element_across(procedure_url, step_id_2, copied_step_id, 'SIBLING', 
            execution_id, None, None)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))

        # check elements
        elements = self.get_elements(execution_url)
        logger.debug('execution elements res_dict= %s', json.dumps(elements, indent=4)) 

        elements = self.get_elements(procedure_url)
        logger.debug('procedure elements res_dict= %s', json.dumps(elements, indent=4))

        copied_elem_1 = elements[1]

        self.assertEqual(copied_elem_1['execution']['meta_data']['status'], 'NONE')     
        self.assertEqual(copied_elem_1['execution']['meta_data']['time_started'], '')  
        self.assertEqual(copied_elem_1['execution']['meta_data']['time_completed'], '')      

        # should be reset according to specification
        self.assertEqual(copied_elem_1['execution_user_input']['temperature']['verification_condition'], 'RECORD')  
        self.assertEqual(copied_elem_1['execution_user_input']['humidity']['verification_condition'], 'RECORD')

        # should be based on the step from execution except for actual_value
        self.assertEqual(copied_elem_1['authoring_user_input']['temperature']['verification_condition'], 'GREATER_THAN') 
        self.assertEqual(copied_elem_1['authoring_user_input']['humidity']['verification_condition'], 'GREATER_THAN')

        self.assertSequenceEqual(copied_elem_1['authoring_user_input']['temperature']['verification_values'], [50])
        self.assertSequenceEqual(copied_elem_1['authoring_user_input']['humidity']['verification_values'], [30])

        self.assertTrue(copied_elem_1['authoring_user_input']['temperature'].get('actual_value') is None)
        self.assertTrue(copied_elem_1['authoring_user_input']['humidity'].get('actual_value') is None)

        copied_elem_2 = elements[2]

        self.assertEqual(copied_elem_2['execution']['meta_data']['status'], 'NONE')     
        self.assertEqual(copied_elem_2['execution']['meta_data']['time_started'], '')  
        self.assertEqual(copied_elem_2['execution']['meta_data']['time_completed'], '')      

        # should be reset according to specification
        self.assertEqual(copied_elem_2['execution_user_input']['entries'][0]['verification_condition'], 'RECORD')  

        # should be based on the step from execution except for actual_value
        self.assertEqual(len(copied_elem_2['authoring_user_input']['entries']), 2)
        self.assertEqual(copied_elem_2['authoring_user_input']['entries'][0]['verification_condition'], 'EQUAL')
        self.assertEqual(copied_elem_2['authoring_user_input']['entries'][1]['verification_condition'], 'EQUAL') 

        self.assertSequenceEqual(copied_elem_2['authoring_user_input']['entries'][0]['verification_values'], ['abc'])
        self.assertSequenceEqual(copied_elem_2['authoring_user_input']['entries'][1]['verification_values'], ['11.0'])

        self.assertTrue(copied_elem_2['authoring_user_input']['entries'][0].get('actual_value') is None)
        self.assertTrue(copied_elem_2['authoring_user_input']['entries'][0].get('actual_value') is None)

    def test_copy_procedure_elements_check_input(self):
        logger.debug('test_copy_procedure_elements_check_input')

        procedure_title = 'title_' + random_string()
        procedure_dict = self.create_procedure(procedure_title, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']
        
        user_input_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [50]
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [30]
            }
        } 

        self.set_step_input(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1, user_input_1)

        # add another step to procedure
        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']        
        user_input_2 = {
            'entries': [
                {
                    'name': 'param1',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['abc']
                },
                {
                    'name': 'param2',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['11.0']
                }
            ]
        }
        self.set_step_input(procedure_url, StepTypes.MANUAL_INPUT, step_id_2, user_input_2)        


        ## create execution
        description = 'My execution'
        res_dict = self.create_venue('WSTS')
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        execution_dict = self.create_execution(venue_id, description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id        

        # Copy from execution to procedure
        res_dict = self.copy_element_across(execution_url, step_id_1, '-1', 'CHILD', 
            None, procedure_id, 0)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))

        copied_step_id = res_dict['elements'][0]['elem_id']

        res_dict = self.copy_element_across(execution_url, step_id_2, copied_step_id, 'SIBLING', 
            None, procedure_id, 0)
        logger.debug('element copied res_dict: %s', json.dumps(res_dict, indent=4))

        # check elements
        elements = self.get_elements(procedure_url)
        logger.debug('procedure elements res_dict= %s', json.dumps(elements, indent=4))

        elements = self.get_elements(execution_url)
        logger.debug('execution elements res_dict= %s', json.dumps(elements, indent=4)) 

        copied_elem_1 = elements[0]

        self.assertEqual(copied_elem_1['execution']['meta_data']['status'], 'NONE')     
        self.assertEqual(copied_elem_1['execution']['meta_data']['time_started'], '')  
        self.assertEqual(copied_elem_1['execution']['meta_data']['time_completed'], '')      

        # should be based on the step from procedure
        self.assertEqual(copied_elem_1['authoring_user_input']['temperature']['verification_condition'], 'GREATER_THAN') 
        self.assertEqual(copied_elem_1['authoring_user_input']['humidity']['verification_condition'], 'GREATER_THAN')
        self.assertSequenceEqual(copied_elem_1['authoring_user_input']['temperature']['verification_values'], [50])
        self.assertSequenceEqual(copied_elem_1['authoring_user_input']['humidity']['verification_values'], [30])
        self.assertTrue(copied_elem_1['authoring_user_input']['temperature'].get('actual_value') is None)
        self.assertTrue(copied_elem_1['authoring_user_input']['humidity'].get('actual_value') is None)        

        # should be based on the step from procedure
        self.assertEqual(copied_elem_1['execution_user_input']['temperature']['verification_condition'], 'GREATER_THAN')  
        self.assertEqual(copied_elem_1['execution_user_input']['humidity']['verification_condition'], 'GREATER_THAN')
        self.assertSequenceEqual(copied_elem_1['execution_user_input']['temperature']['verification_values'], [50])
        self.assertSequenceEqual(copied_elem_1['execution_user_input']['humidity']['verification_values'], [30])    
        self.assertEqual(copied_elem_1['execution_user_input']['temperature'].get('actual_value'), 0)
        self.assertEqual(copied_elem_1['execution_user_input']['humidity'].get('actual_value'), 0)                  


        copied_elem_2 = elements[1]

        self.assertEqual(copied_elem_2['execution']['meta_data']['status'], 'NONE')     
        self.assertEqual(copied_elem_2['execution']['meta_data']['time_started'], '')  
        self.assertEqual(copied_elem_2['execution']['meta_data']['time_completed'], '')      

        # should be based on the step from procedure
        self.assertEqual(len(copied_elem_2['authoring_user_input']['entries']), 2)
        self.assertEqual(copied_elem_2['authoring_user_input']['entries'][0]['verification_condition'], 'EQUAL')
        self.assertEqual(copied_elem_2['authoring_user_input']['entries'][1]['verification_condition'], 'EQUAL') 
        self.assertSequenceEqual(copied_elem_2['authoring_user_input']['entries'][0]['verification_values'], ['abc'])
        self.assertSequenceEqual(copied_elem_2['authoring_user_input']['entries'][1]['verification_values'], ['11.0'])
        self.assertTrue(copied_elem_2['authoring_user_input']['entries'][0].get('actual_value') is None)
        self.assertTrue(copied_elem_2['authoring_user_input']['entries'][0].get('actual_value') is None)

        # should be based on the step from procedure
        self.assertEqual(len(copied_elem_2['execution_user_input']['entries']), 2)
        self.assertEqual(copied_elem_2['execution_user_input']['entries'][0]['verification_condition'], 'EQUAL')
        self.assertEqual(copied_elem_2['execution_user_input']['entries'][1]['verification_condition'], 'EQUAL') 
        self.assertSequenceEqual(copied_elem_2['execution_user_input']['entries'][0]['verification_values'], ['abc'])
        self.assertSequenceEqual(copied_elem_2['execution_user_input']['entries'][1]['verification_values'], ['11.0'])
        self.assertEqual(copied_elem_2['execution_user_input']['entries'][0].get('actual_value'), '')
        self.assertEqual(copied_elem_2['execution_user_input']['entries'][0].get('actual_value'), '')       


    def run_move_elements(self, id_dict):
        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        paragraph_id_2 = id_dict['paragraph_id_2']

        ## Move element

        res_dict = self.move_element(base_url=execution_url,
            elem_id=section_id_3, insert_after_id='-1', level='CHILD',
            code_expected=200)

        logger.debug('element moved: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(len(res_dict['numbers']), 7)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], section_id_3)
        self.assertEqual(res_dict['numbers'][0]['number'], '1')        
        self.assertEqual(res_dict['numbers'][1]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][1]['number'], '1-1')
        self.assertEqual(res_dict['numbers'][2]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][2]['number'], '1-2')      
        self.assertEqual(res_dict['numbers'][3]['elem_id'], section_id_1)
        self.assertEqual(res_dict['numbers'][3]['number'], '2')
        self.assertEqual(res_dict['numbers'][4]['elem_id'], step_id_1_1)
        self.assertEqual(res_dict['numbers'][4]['number'], '2-1')
        self.assertEqual(res_dict['numbers'][5]['elem_id'], step_id_1_2)
        self.assertEqual(res_dict['numbers'][5]['number'], '2-2')
        self.assertEqual(res_dict['numbers'][6]['elem_id'], paragraph_id_2)
        self.assertEqual(res_dict['numbers'][6]['number'], '3')        

        self.assertEqual(len(res_dict['elem_ids']), 7)
        self.assertEqual(res_dict['elem_ids'][0], section_id_3)
        self.assertEqual(res_dict['elem_ids'][1], step_id_3_1)
        self.assertEqual(res_dict['elem_ids'][2], step_id_3_2)
        self.assertEqual(res_dict['elem_ids'][3], section_id_1)
        self.assertEqual(res_dict['elem_ids'][4], step_id_1_1)
        self.assertEqual(res_dict['elem_ids'][5], step_id_1_2)
        self.assertEqual(res_dict['elem_ids'][6], paragraph_id_2)            

        res_dict = self.get_as_run(execution_id)

        # move it back

        res_dict = self.move_element(base_url=execution_url,
            elem_id=section_id_3, insert_after_id=paragraph_id_2, level='SIBLING',
            code_expected=200)

        self.assertEqual(len(res_dict['numbers']), 7)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], section_id_1)
        self.assertEqual(res_dict['numbers'][0]['number'], '1')        
        self.assertEqual(res_dict['numbers'][1]['elem_id'], step_id_1_1)
        self.assertEqual(res_dict['numbers'][1]['number'], '1-1')
        self.assertEqual(res_dict['numbers'][2]['elem_id'], step_id_1_2)
        self.assertEqual(res_dict['numbers'][2]['number'], '1-2')
        self.assertEqual(res_dict['numbers'][3]['elem_id'], paragraph_id_2)
        self.assertEqual(res_dict['numbers'][3]['number'], '2')
        self.assertEqual(res_dict['numbers'][4]['elem_id'], section_id_3)
        self.assertEqual(res_dict['numbers'][4]['number'], '3')
        self.assertEqual(res_dict['numbers'][5]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][5]['number'], '3-1')
        self.assertEqual(res_dict['numbers'][6]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][6]['number'], '3-2')   

        res_dict = self.get_as_run(execution_id)



        res_dict = self.move_element(base_url=execution_url,
            elem_id=step_id_1_1, insert_after_id=section_id_3, level='CHILD',
            code_expected=200)

        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], step_id_1_2)
        self.assertEqual(res_dict['numbers'][0]['number'], '1-1')        
        self.assertEqual(res_dict['numbers'][1]['elem_id'], step_id_1_1)
        self.assertEqual(res_dict['numbers'][1]['number'], '3-1')        
        self.assertEqual(res_dict['numbers'][2]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][2]['number'], '3-2')
        self.assertEqual(res_dict['numbers'][3]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][3]['number'], '3-3')

        ## Get As Run to check
        url = shared_dict['host'] + '/executions/' + execution_id + '/as_run'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)


        self.assertEqual(res_dict['children'][0]['description'], 'Section 1')
        self.assertEqual(res_dict['children'][0]['number'], '1')
        self.assertEqual(res_dict['children'][0]['children'][0]['title'], 'Step 1-2')
        self.assertEqual(res_dict['children'][0]['children'][0]['number'], '1-1')

        self.assertEqual(res_dict['children'][1]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict['children'][1]['number'], '2')

        self.assertEqual(res_dict['children'][2]['title'], 'Section 3')
        self.assertEqual(res_dict['children'][2]['number'], '3')
        self.assertEqual(res_dict['children'][2]['children'][0]['title'], 'Step 1-1')
        self.assertEqual(res_dict['children'][2]['children'][0]['number'], '3-1')
        self.assertEqual(res_dict['children'][2]['children'][1]['title'], 'Step 3-1')
        self.assertEqual(res_dict['children'][2]['children'][1]['number'], '3-2')
        self.assertEqual(res_dict['children'][2]['children'][2]['title'], 'Step 3-2')
        self.assertEqual(res_dict['children'][2]['children'][2]['number'], '3-3')

        ## move back the element
        res_dict = self.move_element(base_url=execution_url,
            elem_id=step_id_1_1, insert_after_id=section_id_1, level='CHILD',
            code_expected=200)

        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], step_id_1_1)
        self.assertEqual(res_dict['numbers'][0]['number'], '1-1')  
        self.assertEqual(res_dict['numbers'][1]['elem_id'], step_id_1_2)
        self.assertEqual(res_dict['numbers'][1]['number'], '1-2')        
        self.assertEqual(res_dict['numbers'][2]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][2]['number'], '3-1')
        self.assertEqual(res_dict['numbers'][3]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][3]['number'], '3-2')

        ## Get As Run to check
        url = shared_dict['host'] + '/executions/' + execution_id + '/as_run'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)


        self.check_as_run(res_dict)

        #### insert an element and check numbers

        ## Add a section temporarily
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            description='Section 1 temp')



        section_id_1_temp = res_dict['elem']['elem_id']
        self.assertEqual(res_dict['elem']['number'], '2')

        # check numbers
        self.assertEqual(len(res_dict['numbers']), 5)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], section_id_1_temp)
        self.assertEqual(res_dict['numbers'][0]['number'], '2')        
        self.assertEqual(res_dict['numbers'][1]['elem_id'], paragraph_id_2)
        self.assertEqual(res_dict['numbers'][1]['number'], '3')  
        self.assertEqual(res_dict['numbers'][2]['elem_id'], section_id_3)
        self.assertEqual(res_dict['numbers'][2]['number'], '4')        
        self.assertEqual(res_dict['numbers'][3]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][3]['number'], '4-1')
        self.assertEqual(res_dict['numbers'][4]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][4]['number'], '4-2')

        #### delete the dummy element and check numbers and as run
        res_dict = self.delete_element(execution_url, section_id_1_temp)
        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], paragraph_id_2)
        self.assertEqual(res_dict['numbers'][0]['number'], '2')  
        self.assertEqual(res_dict['numbers'][1]['elem_id'], section_id_3)
        self.assertEqual(res_dict['numbers'][1]['number'], '3')        
        self.assertEqual(res_dict['numbers'][2]['elem_id'], step_id_3_1)
        self.assertEqual(res_dict['numbers'][2]['number'], '3-1')
        self.assertEqual(res_dict['numbers'][3]['elem_id'], step_id_3_2)
        self.assertEqual(res_dict['numbers'][3]['number'], '3-2')


        #### Cannot delete element that has been executed
        res_dict = self.delete_element(execution_url, step_id_1_1, 400)


    def run_copy_elements(self, id_dict):
        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']
        step_id_3_3 = id_dict['step_id_3_3']

        paragraph_id_2 = id_dict['paragraph_id_2']
        
        # Add comment
        content = 'This is the first comment for the section'
        res_dict = self.add_conversation(execution_url, section_id_3, {'type': 'ACTIVITY_REPORT_COMMENT'})
        conversation_id = res_dict['conversation_id']
        comment = res_dict['comments'][0]
        comment_id = comment['comment_id']        
        res_dict = self.update_comment(execution_url, section_id_3, conversation_id, comment_id, content)
        self.assertEqual(res_dict['content'], content)        

        ## Copy element
        res_dict = self.copy_element(base_url=execution_url,
            elem_id=section_id_3, insert_after_id='-1', level='CHILD',
            code_expected=200)
        logger.debug('copy_element res: %s', json.dumps(res_dict, indent=4))     

        self.assertEqual(len(res_dict['elements']), 4)
        self.assertEqual(res_dict['elements'][0]['title'], 'Section 3')
        self.assertEqual(res_dict['elements'][1]['title'], 'Step 3-1')
        self.assertEqual(res_dict['elements'][2]['title'], 'Step 3-2')
        self.assertEqual(res_dict['elements'][3]['title'], 'Step 3-3')
        self.assertEqual(res_dict['elements'][3]['execution']['meta_data']['time_started'], '')    
        
        # check comment
        self.assertEqual(len(res_dict['elements'][0]['conversations']), 0)        

        self.assertEqual(len(res_dict['numbers']), 12)
        self.assertEqual(res_dict['numbers'][0]['number'], "1")
        self.assertEqual(res_dict['numbers'][1]['number'], "1-1")
        self.assertEqual(res_dict['numbers'][2]['number'], "1-2")
        self.assertEqual(res_dict['numbers'][3]['number'], "1-3")        
        self.assertEqual(res_dict['numbers'][4]['number'], "2")
        self.assertEqual(res_dict['numbers'][5]['number'], "2-1")
        self.assertEqual(res_dict['numbers'][6]['number'], "2-2")
        self.assertEqual(res_dict['numbers'][7]['number'], "3")
        self.assertEqual(res_dict['numbers'][8]['number'], "4")
        self.assertEqual(res_dict['numbers'][9]['number'], "4-1")
        self.assertEqual(res_dict['numbers'][10]['number'], "4-2")
        self.assertEqual(res_dict['numbers'][11]['number'], "4-3")    

        self.assertEqual(len(res_dict['elem_ids']), 12)
        self.assertEqual(res_dict['elem_ids'][0], res_dict['elements'][0]['elem_id'])
        self.assertEqual(res_dict['elem_ids'][1], res_dict['elements'][1]['elem_id'])
        self.assertEqual(res_dict['elem_ids'][2], res_dict['elements'][2]['elem_id'])
        self.assertEqual(res_dict['elem_ids'][3], res_dict['elements'][3]['elem_id'])
        self.assertEqual(res_dict['elem_ids'][4], section_id_1)
        self.assertEqual(res_dict['elem_ids'][5], step_id_1_1)
        self.assertEqual(res_dict['elem_ids'][6], step_id_1_2)
        self.assertEqual(res_dict['elem_ids'][7], paragraph_id_2)
        self.assertEqual(res_dict['elem_ids'][8], section_id_3)
        self.assertEqual(res_dict['elem_ids'][9], step_id_3_1)
        self.assertEqual(res_dict['elem_ids'][10], step_id_3_2)   
        self.assertEqual(res_dict['elem_ids'][11], step_id_3_3)                

        res_dict = self.get_elements(execution_url)
        logger.debug('copied elements res_dict= %s', json.dumps(res_dict, indent=4))        

        self.assertEqual(len(res_dict), 12)
        self.assertEqual(res_dict[0]['title'], "Section 3")
        self.assertEqual(res_dict[1]['title'], "Step 3-1")
        self.assertEqual(res_dict[2]['title'], "Step 3-2")
        self.assertEqual(res_dict[3]['title'], "Step 3-3")        
        self.assertEqual(res_dict[4]['title'], "Section 1")
        self.assertEqual(res_dict[5]['title'], "Step 1-1")
        self.assertEqual(res_dict[6]['title'], "Step 1-2")
        self.assertEqual(res_dict[7]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict[8]['title'], "Section 3")
        self.assertEqual(res_dict[9]['title'], "Step 3-1")
        self.assertEqual(res_dict[10]['title'], "Step 3-2")
        self.assertEqual(res_dict[11]['title'], "Step 3-3")        

        self.assertEqual(res_dict[0]['number'], "1")
        self.assertEqual(res_dict[1]['number'], "1-1")
        self.assertEqual(res_dict[2]['number'], "1-2")
        self.assertEqual(res_dict[3]['number'], "1-3")        
        self.assertEqual(res_dict[4]['number'], "2")
        self.assertEqual(res_dict[5]['number'], "2-1")
        self.assertEqual(res_dict[6]['number'], "2-2")
        self.assertEqual(res_dict[7]['number'], "3")
        self.assertEqual(res_dict[8]['number'], "4")
        self.assertEqual(res_dict[9]['number'], "4-1")
        self.assertEqual(res_dict[10]['number'], "4-2")
        self.assertEqual(res_dict[11]['number'], "4-3")    
        
        # check comment
        
        self.assertEqual(len(res_dict[0]['conversations']), 0)
        self.assertEqual('comments' in res_dict[0], False)
        
        self.assertEqual(len(res_dict[8]['conversations']), 1)
        self.assertEqual(len(res_dict[8]['conversations'][0]['comments']), 1)
        self.assertEqual('comments' in res_dict[8], False)            

        # delete the copied element

        copied_section_id_2 = res_dict[0]['elem_id']

        res_dict = self.delete_element(base_url=execution_url, elem_id=copied_section_id_2)

        logger.debug('element deleted: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(len(res_dict['numbers']), 8)

        self.assertEqual(len(res_dict['elem_ids']), 8)
        self.assertEqual(res_dict['elem_ids'][0], section_id_1)
        self.assertEqual(res_dict['elem_ids'][1], step_id_1_1)
        self.assertEqual(res_dict['elem_ids'][2], step_id_1_2)
        self.assertEqual(res_dict['elem_ids'][3], paragraph_id_2)
        self.assertEqual(res_dict['elem_ids'][4], section_id_3)
        self.assertEqual(res_dict['elem_ids'][5], step_id_3_1)
        self.assertEqual(res_dict['elem_ids'][6], step_id_3_2)
        self.assertEqual(res_dict['elem_ids'][7], step_id_3_3)        

        res_dict = self.get_elements(execution_url)
        logger.debug('deleted back elements res_dict= %s', json.dumps(res_dict, indent=4))

        self.assertEqual(len(res_dict), 8)
        self.assertEqual(res_dict[0]['title'], "Section 1")
        self.assertEqual(res_dict[1]['title'], "Step 1-1")
        self.assertEqual(res_dict[2]['title'], "Step 1-2")
        self.assertEqual(res_dict[3]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict[4]['title'], "Section 3")
        self.assertEqual(res_dict[5]['title'], "Step 3-1")
        self.assertEqual(res_dict[6]['title'], "Step 3-2")
        self.assertEqual(res_dict[7]['title'], "Step 3-3")        

        self.assertEqual(res_dict[0]['number'], "1")
        self.assertEqual(res_dict[1]['number'], "1-1")
        self.assertEqual(res_dict[2]['number'], "1-2")
        self.assertEqual(res_dict[3]['number'], "2")
        self.assertEqual(res_dict[4]['number'], "3")
        self.assertEqual(res_dict[5]['number'], "3-1")
        self.assertEqual(res_dict[6]['number'], "3-2")
        self.assertEqual(res_dict[7]['number'], "3-3")

        ## copy a step

        res_dict = self.copy_element(base_url=execution_url,
            elem_id=step_id_1_1, insert_after_id=section_id_3, level='CHILD',
            code_expected=200)
        
        logger.debug('copy_element res: %s', json.dumps(res_dict, indent=4))            
        
        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['number'], "3-1")
        self.assertEqual(res_dict['numbers'][1]['number'], "3-2")
        self.assertEqual(res_dict['numbers'][2]['number'], "3-3")
        self.assertEqual(res_dict['numbers'][3]['number'], "3-4")

        self.assertEqual(len(res_dict['elements']), 1)
        self.assertEqual(res_dict['elements'][0]['title'], 'Step 1-1')
        self.assertEqual(res_dict['elements'][0]['number'], '3-1')

        #res_dict = self.get_as_run(execution_id)
        #logger.debug('copy step as run after res_dict= %s', json.dumps(res_dict, indent=4))            

        res_dict = self.get_elements(execution_url)
        logger.debug('copied step elements res_dict= %s', json.dumps(res_dict, indent=4))

        self.assertEqual(len(res_dict), 9)
        self.assertEqual(res_dict[0]['title'], "Section 1")
        self.assertEqual(res_dict[1]['title'], "Step 1-1")
        self.assertEqual(res_dict[2]['title'], "Step 1-2")
        self.assertEqual(res_dict[3]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict[4]['title'], "Section 3")
        self.assertEqual(res_dict[5]['title'], "Step 1-1")        
        self.assertEqual(res_dict[6]['title'], "Step 3-1")
        self.assertEqual(res_dict[7]['title'], "Step 3-2")
        self.assertEqual(res_dict[8]['title'], "Step 3-3")

        self.assertEqual(res_dict[0]['number'], "1")
        self.assertEqual(res_dict[1]['number'], "1-1")
        self.assertEqual(res_dict[2]['number'], "1-2")
        self.assertEqual(res_dict[3]['number'], "2")
        self.assertEqual(res_dict[4]['number'], "3")
        self.assertEqual(res_dict[5]['number'], "3-1")
        self.assertEqual(res_dict[6]['number'], "3-2")
        self.assertEqual(res_dict[7]['number'], "3-3")     
        self.assertEqual(res_dict[8]['number'], "3-4")   

        ## copy another step

        res_dict = self.copy_element(base_url=execution_url,
            elem_id=step_id_1_2, insert_after_id=step_id_3_1, level='SIBLING',
            code_expected=200)
        
        logger.debug('copy_element res: %s', json.dumps(res_dict, indent=4))            
        
        self.assertEqual(len(res_dict['numbers']), 3)
        self.assertEqual(res_dict['numbers'][0]['number'], "3-3")
        self.assertEqual(res_dict['numbers'][1]['number'], "3-4")
        self.assertEqual(res_dict['numbers'][2]['number'], "3-5")

        self.assertEqual(len(res_dict['elements']), 1)
        self.assertEqual(res_dict['elements'][0]['title'], 'Step 1-2')
        self.assertEqual(res_dict['elements'][0]['number'], '3-3')

        res_dict = self.get_as_run(execution_id)
        logger.debug('copy step as run after res_dict= %s', json.dumps(res_dict, indent=4))            

        res_dict = self.get_elements(execution_url)
        logger.debug('copied step elements res_dict= %s', json.dumps(res_dict, indent=4))

        self.assertEqual(len(res_dict), 10)
        self.assertEqual(res_dict[0]['title'], "Section 1")
        self.assertEqual(res_dict[1]['title'], "Step 1-1")
        self.assertEqual(res_dict[2]['title'], "Step 1-2")
        self.assertEqual(res_dict[3]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict[4]['title'], "Section 3")
        self.assertEqual(res_dict[5]['title'], "Step 1-1")        
        self.assertEqual(res_dict[6]['title'], "Step 3-1")
        self.assertEqual(res_dict[7]['title'], "Step 1-2")       
        self.assertEqual(res_dict[8]['title'], "Step 3-2")
        self.assertEqual(res_dict[9]['title'], "Step 3-3")

        self.assertEqual(res_dict[0]['number'], "1")
        self.assertEqual(res_dict[1]['number'], "1-1")
        self.assertEqual(res_dict[2]['number'], "1-2")
        self.assertEqual(res_dict[3]['number'], "2")
        self.assertEqual(res_dict[4]['number'], "3")
        self.assertEqual(res_dict[5]['number'], "3-1")
        self.assertEqual(res_dict[6]['number'], "3-2")
        self.assertEqual(res_dict[7]['number'], "3-3")   
        self.assertEqual(res_dict[8]['number'], "3-4")
        self.assertEqual(res_dict[9]['number'], "3-5")

    def test_close_delete_execution(self):
        description1 = 'My execution to be deleted '
        res_dict = self.create_venue('WSTS')
        venue_id_1 = res_dict['venue_id']
        venue_name_1 = res_dict['name']

        execution_dict = self.create_execution(venue_id_1, description1)
        execution_id_1 = execution_dict['execution_id']

        self.delete_execution(execution_id_1)

        description2 = 'My execution to be closed and deleted '
        res_dict = self.create_venue('WSTS')
        venue_id_2 = res_dict['venue_id']
        venue_name_2 = res_dict['name']        
        execution_dict = self.create_execution(venue_id_2, description1)
        execution_id_2 = execution_dict['execution_id']

        # close it
        self.close_execution(execution_id_2)
        # then delete it
        self.delete_execution(execution_id_2)


    def test_delete_execution_error(self):
        res_dict = self.delete_execution('not an id', 400)

        self.assertTrue(len(res_dict['message']) > 0)

    def test_redline(self):
        self.create_redline_example(complete=False)
        
    def test_redline_execution_auto(self):
        execution_id, execution_url = self.create_redline_example(complete=False)
        approval_input = {
            'content': 'this is a change for test',
            'status': 'APPROVED'
        }
        
        elements = self.get_elements(execution_url)
        for element in elements:
            procedure_modification_status = element['procedure_modification_status']
            if procedure_modification_status in ['MODIFYING', 'ADDED', 'DELETED']:
                res = self.approve_element(execution_id, element['elem_id'], approval_input)
                
        # add an executable step to the front so that we can start auto execution
        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level=''
            )
        step_1 = res['elem']
        step_1_id = step_1['elem_id']

        self.update_step(execution_url, StepTypes.WAIT, step_1_id, {'title': 'Step 1'})

        user_input_0 = {
            'wait_type': 'DURATION',
            'time_value': '0'
        }
        self.set_step_input(execution_url, StepTypes.WAIT, step_1_id, user_input_0)
                
        ### set execution mode
        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': False, 
                'on_fail': False, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': False                
            }
        }

        self.update_execution(execution_id, execution_info, code_expected=200)      


        # start from the section that contains the procedure section.
        self.run_step_async(execution_id, step_1_id, 202)

        time.sleep(0.2)
        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'RUNNING')        

        time.sleep(3)
 
        elements = self.get_elements(execution_url)
        logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 13)
        
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[0]['elem_type'], 'STEP')
        self.assertEqual(elements[0]['executed'], True)
        self.assertEqual(elements[1]['number'], '2')
        self.assertEqual(elements[1]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(elements[1]['executed'], False)
        self.assertEqual(elements[2]['number'], '1')
        self.assertEqual(elements[2]['elem_type'], 'SECTION')
        self.assertEqual(elements[2]['executed'], False) 
        self.assertEqual(elements[3]['number'], '1-1')
        self.assertEqual(elements[3]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[3]['executed'], False) 
        self.assertEqual(elements[4]['number'], '1-2')
        self.assertEqual(elements[4]['elem_type'], 'STEP')
        self.assertEqual(elements[4]['executed'], False)   
        self.assertEqual(elements[5]['number'], '1-2.1')
        self.assertEqual(elements[5]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[5]['executed'], False)    
        self.assertEqual(elements[6]['number'], '1-3')
        self.assertEqual(elements[6]['elem_type'], 'STEP')
        self.assertEqual(elements[6]['executed'], True)   
        self.assertEqual(elements[7]['number'], '2')
        self.assertEqual(elements[7]['elem_type'], 'SECTION')
        self.assertEqual(elements[7]['executed'], False) 
        self.assertEqual(elements[8]['number'], '2-1')
        self.assertEqual(elements[8]['elem_type'], 'STEP')
        self.assertEqual(elements[8]['executed'], False)  
        self.assertEqual(elements[9]['number'], '2-1.a')
        self.assertEqual(elements[9]['elem_type'], 'STEP')
        self.assertEqual(elements[9]['executed'], False)                                                                  
        self.assertEqual(elements[10]['number'], '2-1.b')
        self.assertEqual(elements[10]['elem_type'], 'STEP')
        self.assertEqual(elements[10]['executed'], True)
        self.assertEqual(elements[11]['number'], '2-1.1')
        self.assertEqual(elements[11]['elem_type'], 'STEP')
        self.assertEqual(elements[11]['executed'], True)    
        self.assertEqual(elements[12]['number'], '2-2')
        self.assertEqual(elements[12]['elem_type'], 'STEP')
        self.assertEqual(elements[12]['executed'], True)            
                 

    def test_redline_discard(self):
        self.create_redline_example(complete=True)

    def create_redline_example(self, complete=False):

        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)         

        outline_elems = self.get_outline(procedure_url, version)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])


        procedure_section_input = {
            'callable': False,
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',
            'reference_procedure_title': procedure_title,
            'run_for_score': True,
            'tag_selections': []
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)

        self.assertDictEqual(procedure_section_input, user_input)

        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        self.assertEqual(proc_section_elems[0]['elem_id'], procedure_section_id)
        self.assertEqual(proc_section_elems[0]['imported'], True)
        self.assertEqual(proc_section_elems[0]['executed'], False)
        self.assertEqual(proc_section_elems[3]['title'], 'Step 1-2')
        self.assertEqual(proc_section_elems[3]['number'], '1-2')
        self.assertEqual(proc_section_elems[3]['authoring_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(proc_section_elems[3]['execution_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(proc_section_elems[3]['run_for_score'], True)
        self.assertEqual(proc_section_elems[7]['title'], 'Step 2-2')
        self.assertEqual(proc_section_elems[7]['number'], '2-2')

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['authoring_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['execution_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')

        proc_section_secion_1_id = as_run_dict['children'][0]['children'][0]['elem_id']
        logger.debug('proc_section_secion_1_id= %s', proc_section_secion_1_id)

        proc_section_paragraph_1_1_id = as_run_dict['children'][0]['children'][0]['children'][0]['elem_id']
        logger.debug('proc_section_paragraph_1_1_id= %s', proc_section_paragraph_1_1_id)        

        proc_section_step_1_2_id = as_run_dict['children'][0]['children'][0]['children'][1]['elem_id']
        logger.debug('proc_section_step_1_2_id= %s', proc_section_step_1_2_id)

        proc_section_step_1_3_id = as_run_dict['children'][0]['children'][0]['children'][2]['elem_id']
        logger.debug('proc_section_step_1_3_id= %s', proc_section_step_1_3_id)        

        proc_section_secion_2_id = as_run_dict['children'][0]['children'][1]['elem_id']
        logger.debug('proc_section_secion_2_id= %s', proc_section_secion_2_id)     

        proc_section_step_2_1_id = as_run_dict['children'][0]['children'][1]['children'][0]['elem_id']
        logger.debug('proc_section_step_2_1_id= %s', proc_section_step_2_1_id)        

        proc_section_step_2_2_id = as_run_dict['children'][0]['children'][1]['children'][1]['elem_id']
        logger.debug('proc_section_step_2_2_id= %s', proc_section_step_2_2_id)           

        # create a redline by modification
        modify_res = self.modify_element(execution_id, proc_section_step_2_1_id)
        logger.debug('modify_res= %s', json.dumps(modify_res, indent=4))

        proc_section_step_2_1_a = modify_res['elem']
        numbers = modify_res['numbers']
        elem_ids = modify_res['elem_ids']
        proc_section_step_2_1_a_id = proc_section_step_2_1_a['elem_id']               

        self.assertEqual(proc_section_step_2_1_a['number'], '2-1.a')
        self.assertEqual(proc_section_step_2_1_a['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(proc_section_step_2_1_a['procedure_modification']['justification']['modification_type'], 'REDLINE')

        self.assertEqual(len(numbers), 2)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_id)
        self.assertEqual(numbers[0]['number'], '2-1')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFIED')
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_2_1_a_id)
        self.assertEqual(numbers[1]['number'], '2-1.a')
        self.assertEqual(numbers[1]['procedure_modification_status'], 'MODIFYING')     
        self.assertEqual(len(elem_ids), 9)   

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))    
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')            
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[7]['number'], '2-1.a')  
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements_res[8]['number'], '2-2')

        # set justification
        justification_input = {
            'modification_type': 'BLUELINE',                    
            'content': 'this is a temporary change'
        }
        res = self.justify_element(execution_id, proc_section_step_2_1_a_id, justification_input)
        logger.debug('res= %s', json.dumps(res, indent=4))  

        self.assertEqual(res['procedure_modification']['justification']['modification_type'], justification_input['modification_type'])
        self.assertEqual(res['procedure_modification']['justification']['content'], justification_input['content'])
        self.assertTrue(len(res['procedure_modification']['justification']['user_name']) > 0)
        self.assertTrue(len(res['procedure_modification']['justification']['time_updated']) > 0)

        # approve it
        approval_input = {
            'content': 'this is a temporary change',
            'status': 'APPROVED'
        }
        res = self.approve_element(execution_id, proc_section_step_2_1_a_id, approval_input)
        logger.debug('res= %s', json.dumps(res, indent=4))   
        self.assertEqual(res['procedure_modification']['approval']['status'], approval_input['status'])
        self.assertEqual(res['procedure_modification']['approval']['content'], approval_input['content'])             

        # modify the step again

        modify_res = self.modify_element(execution_id, proc_section_step_2_1_id)
        logger.debug('modify_res= %s', json.dumps(modify_res, indent=4))

        proc_section_step_2_1_b = modify_res['elem']
        numbers = modify_res['numbers']
        elem_ids = modify_res['elem_ids']
        proc_section_step_2_1_b_id = proc_section_step_2_1_b['elem_id']               

        self.assertEqual(proc_section_step_2_1_b['number'], '2-1.b')
        self.assertEqual(proc_section_step_2_1_b['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(proc_section_step_2_1_b['procedure_modification']['justification']['modification_type'], 'REDLINE')

        self.assertEqual(len(numbers), 2)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_a_id)
        self.assertEqual(numbers[0]['number'], '2-1.a')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFYING_OLD')   
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_2_1_b_id)
        self.assertEqual(numbers[1]['number'], '2-1.b')
        self.assertEqual(numbers[1]['procedure_modification_status'], 'MODIFYING')         

        self.assertEqual(len(elem_ids), 10)   

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))    
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')            
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[7]['number'], '2-1.a')  
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[8]['number'], '2-1.b')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING')        
        self.assertEqual(elements_res[9]['number'], '2-2')        
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'ORIGINAL')

        # modify the step 3rd time

        modify_res = self.modify_element(execution_id, proc_section_step_2_1_id)
        logger.debug('modify_res= %s', json.dumps(modify_res, indent=4))

        proc_section_step_2_1_c = modify_res['elem']
        numbers = modify_res['numbers']
        elem_ids = modify_res['elem_ids']
        proc_section_step_2_1_c_id = proc_section_step_2_1_c['elem_id']               

        self.assertEqual(proc_section_step_2_1_c['number'], '2-1.c')
        self.assertEqual(proc_section_step_2_1_c['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(proc_section_step_2_1_c['procedure_modification']['justification']['modification_type'], 'REDLINE')

        self.assertEqual(len(numbers), 2)   
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_b_id)
        self.assertEqual(numbers[0]['number'], '2-1.b')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFYING_OLD')   
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_2_1_c_id)
        self.assertEqual(numbers[1]['number'], '2-1.c')
        self.assertEqual(numbers[1]['procedure_modification_status'], 'MODIFYING')              

        self.assertEqual(len(elem_ids), 11)   

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))    
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')            
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[7]['number'], '2-1.a')  
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[8]['number'], '2-1.b')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING_OLD')  
        self.assertEqual(elements_res[9]['number'], '2-1.c')  
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'MODIFYING')              
        self.assertEqual(elements_res[10]['number'], '2-2')        
        self.assertEqual(elements_res[10]['procedure_modification_status'], 'ORIGINAL')            

        # discard redline C
        dicard_res = self.discard_element(execution_id, proc_section_step_2_1_c_id, 200)  
        logger.debug('dicard_res= %s', json.dumps(dicard_res, indent=4))       
        numbers = dicard_res['numbers']
        elem_ids = dicard_res['elem_ids']         
        
        self.assertEqual(len(numbers), 1)   
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_b_id)
        self.assertEqual(numbers[0]['number'], '2-1.b')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFYING')               

        self.assertEqual(len(elem_ids), 10)   

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))    
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')            
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[7]['number'], '2-1.a')  
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[8]['number'], '2-1.b')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING')        
        self.assertEqual(elements_res[9]['number'], '2-2')        
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'ORIGINAL')

        ## Test creating redline in reverse order
        # create a redline by modification
        modify_res = self.modify_element(execution_id, proc_section_step_1_3_id)
        logger.debug('modify_res= %s', json.dumps(modify_res, indent=4))        
        proc_section_step_1_3_a = modify_res['elem']
        numbers = modify_res['numbers']
        elem_ids = modify_res['elem_ids']
        proc_section_step_1_3_a_id = proc_section_step_1_3_a['elem_id']     
        
        self.assertEqual(proc_section_step_1_3_a['number'], '1-3.a')
        self.assertEqual(proc_section_step_1_3_a['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(proc_section_step_1_3_a['procedure_modification']['justification']['modification_type'], 'REDLINE')   
        self.assertEqual(len(numbers), 2) 
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_3_id)
        self.assertEqual(numbers[0]['number'], '1-3')
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_1_3_a_id)  
        self.assertEqual(numbers[1]['number'], '1-3.a')
        
        # create a redline by modification for the element before
        modify_res = self.modify_element(execution_id, proc_section_step_1_2_id)
        logger.debug('modify_res= %s', json.dumps(modify_res, indent=4))        
        proc_section_step_1_2_a = modify_res['elem']
        numbers = modify_res['numbers']
        elem_ids = modify_res['elem_ids']
        proc_section_step_1_2_a_id = proc_section_step_1_2_a['elem_id']
        
        self.assertEqual(proc_section_step_1_2_a['number'], '1-2.a')
        self.assertEqual(proc_section_step_1_2_a['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(proc_section_step_1_2_a['procedure_modification']['justification']['modification_type'], 'REDLINE')   
        self.assertEqual(len(numbers), 2) 
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-2')
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_1_2_a_id)  
        self.assertEqual(numbers[1]['number'], '1-2.a')        
         
        # discard modifications
        dicard_res = self.discard_element(execution_id, proc_section_step_1_2_a_id, 200)  
        logger.debug('dicard_res= %s', json.dumps(dicard_res, indent=4))       
        numbers = dicard_res['numbers']
        elem_ids = dicard_res['elem_ids']         
        
        self.assertEqual(len(numbers), 1)   
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-2')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ORIGINAL')  
                
        dicard_res = self.discard_element(execution_id, proc_section_step_1_3_a_id, 200)  
        logger.debug('dicard_res= %s', json.dumps(dicard_res, indent=4))       
        numbers = dicard_res['numbers']
        elem_ids = dicard_res['elem_ids']         
        
        self.assertEqual(len(numbers), 1)   
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_3_id)
        self.assertEqual(numbers[0]['number'], '1-3')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ORIGINAL')        
        
        # add a paragraph to create a redline

        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=proc_section_step_1_2_id,
            level='SIBLING',
            title='Paragraph 1-2.1 in Procedure Section')
        logger.debug('res= %s', json.dumps(res, indent=4))
        proc_section_paragraph_1_2__1 = res['elem']
        numbers = res['numbers']
        elem_ids = res['elem_ids']
        proc_section_paragraph_1_2__1_id = proc_section_paragraph_1_2__1['elem_id']        

        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_paragraph_1_2__1_id)
        self.assertEqual(numbers[0]['number'], '1-2.1')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ADDED')     
        self.assertEqual(len(elem_ids), 11)           

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'ORIGINAL')   
        self.assertEqual(elements_res[4]['number'], '1-2.1') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ADDED')               
        self.assertEqual(elements_res[7]['number'], '2-1') 
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[8]['number'], '2-1.a')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[9]['number'], '2-1.b')  
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'MODIFYING')          
        self.assertEqual(elements_res[10]['number'], '2-2')
        self.assertEqual(elements_res[10]['procedure_modification_status'], 'ORIGINAL')
 
        # delete a step to create a redline
        res = self.delete_element(execution_url, proc_section_step_1_2_id)
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-2')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'DELETED')     
        self.assertEqual(len(elem_ids), 11)   

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))              
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-2.1') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ADDED')               
        self.assertEqual(elements_res[7]['number'], '2-1') 
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[8]['number'], '2-1.a')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[9]['number'], '2-1.b')  
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'MODIFYING') 
        self.assertEqual(elements_res[10]['number'], '2-2')   
        self.assertEqual(elements_res[10]['procedure_modification_status'], 'ORIGINAL')      

        # set justification
        justification_input = {
            'modification_type': 'REDLINE',                    
            'content': 'this step is not needed'
        }
        res = self.justify_element(execution_id, proc_section_step_1_2_id, justification_input)
        logger.debug('res= %s', json.dumps(res, indent=4))  

        self.assertEqual(res['procedure_modification']['justification']['modification_type'], justification_input['modification_type'])
        self.assertEqual(res['procedure_modification']['justification']['content'], justification_input['content'])
        self.assertTrue(len(res['procedure_modification']['justification']['user_name']) > 0)
        self.assertTrue(len(res['procedure_modification']['justification']['time_updated']) > 0)              

        # copy a step to create a redline
        res = self.copy_element(base_url=execution_url,
            elem_id=proc_section_step_1_3_id, insert_after_id=proc_section_step_2_1_b_id, level='SIBLING',
            code_expected=200)
        logger.debug('copy_element res: %s', json.dumps(res, indent=4))  
        self.assertEqual(len(res['elements']), 1) 
        proc_section_step_2_1__1 = res['elements'][0] 
        proc_section_step_2_1__1_id = proc_section_step_2_1__1['elem_id']
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1__1_id)
        self.assertEqual(numbers[0]['number'], '2-1.1')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ADDED')     
        self.assertEqual(len(elem_ids), 12) 

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-2.1') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ADDED')               
        self.assertEqual(elements_res[7]['number'], '2-1') 
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[8]['number'], '2-1.a')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements_res[9]['number'], '2-1.b')  
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'MODIFYING') 
        self.assertEqual(elements_res[10]['number'], '2-1.1')  
        self.assertEqual(elements_res[10]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements_res[10]['title'], 'Step 1-3')        
        self.assertEqual(elements_res[11]['number'], '2-2')        
        self.assertEqual(elements_res[11]['procedure_modification_status'], 'ORIGINAL') 

        logger.info('venue_id: %s', venue_id)
        logger.info('venue_name: %s', venue_name)
        logger.info('execution_id %s:', execution_id)

        if not complete:
            return (execution_id, execution_url)

        ## test various rules that would prevent element operations 
        
        # Add a section temporarily   
        res = self.add_section(base_url=execution_url,
            insert_after_id=procedure_section_id,
            level='SIBLING',
            title='Temporary section')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        section_2_id = res['elem']['elem_id']

        # Add a paragraph temporarily   
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_2_id,
            level='SIBLING',
            title='Temporary paragraph')
        logger.debug('add_paragraph res= %s', json.dumps(res, indent=4))
        paragraph_3_id = res['elem']['elem_id']        

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4)) 
        
        # copy a redline element into a non-protected area
        res = self.copy_element(base_url=execution_url,
            elem_id=proc_section_step_2_1_a_id, insert_after_id=paragraph_3_id, level='SIBLING',
            code_expected=200)
        logger.debug('copy_element res: %s', json.dumps(res, indent=4))  

        self.assertEqual(len(res['elements']), 1) 
        step_4 = res['elements'][0] 
        step_4_id = step_4['elem_id']
        numbers = res['numbers']
        elem_ids = res['elem_ids']   
        self.assertEqual(step_4['number'], '4')
        self.assertEqual(step_4['procedure_modification_status'], 'NONE')
        self.assertDictEqual(step_4['procedure_modification'], {})

        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], step_4_id)
        self.assertEqual(numbers[0]['number'], '4')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'NONE')     
        
        self.assertEqual(len(elem_ids), 15) 

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))   
        self.assertEqual(elements_res[14]['elem_id'], step_4_id) 
        self.assertEqual(elements_res[14]['number'], '4')        
        self.assertEqual(elements_res[14]['procedure_modification_status'], 'NONE')        
        self.assertEqual(elements_res[14]['procedure_section_id'], '') 
        self.assertEqual(elements_res[14]['procedure_id'], '') 
        self.assertEqual(elements_res[14]['procedure_title'], '')                              

        # return
            
        # Cannot add between modified elements    
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=proc_section_step_2_1_id,
            level='SIBLING',
            title='Paragraph cannot be added',
            code_expected=400)
        logger.debug('res= %s', json.dumps(res, indent=4))

        # Cannot add between modified elements    
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=proc_section_step_2_1_a_id,
            level='SIBLING',
            title='Paragraph cannot be added',
            code_expected=400)
        logger.debug('res= %s', json.dumps(res, indent=4))      

        # Cannot move into protected area          
        logger.debug('proc_section_paragraph_1_1_id= %s', proc_section_paragraph_1_1_id) 
        res = self.move_element(base_url=execution_url,
            elem_id=section_2_id,
            insert_after_id=proc_section_paragraph_1_1_id,
            level='SIBLING',
            code_expected=400)
        logger.debug('move res= %s', json.dumps(res, indent=4))

        # Cannot move out from protected area
        res = self.move_element(base_url=execution_url,
            elem_id=proc_section_step_2_1_a_id,
            insert_after_id=section_2_id,
            level='SIBLING',
            code_expected=400)       
        logger.debug('move res= %s', json.dumps(res, indent=4)) 

        # Can copy a section into the protected area
        res = self.copy_element(base_url=execution_url,
            elem_id=section_2_id,
            insert_after_id=proc_section_paragraph_1_1_id,
            level='SIBLING',
            code_expected=200)       
        logger.debug('copy res= %s', json.dumps(res, indent=4))     

        # cannot discard a section the redline
        self.discard_element(execution_id, res['numbers'][0]['elem_id'], 400)  

        # can delete a section in R4R
        res = self.delete_element(execution_url, res['numbers'][0]['elem_id'])
        logger.debug('res= %s', json.dumps(res, indent=4))       

        # Cannot copy to between modified elements    
        res = self.copy_element(base_url=execution_url,
            elem_id=paragraph_3_id,
            insert_after_id=proc_section_step_2_1_id,
            level='SIBLING',
            code_expected=400)
        logger.debug('res= %s', json.dumps(res, indent=4))

        # Cannot copy to between modified elements    
        res = self.copy_element(base_url=execution_url,
            elem_id=paragraph_3_id,        
            insert_after_id=proc_section_step_2_1_a_id,
            level='SIBLING',
            code_expected=400)
        logger.debug('res= %s', json.dumps(res, indent=4))   
    

        # We are done with the section, remove it. 
        self.delete_element(execution_url, section_2_id) 
        self.delete_element(execution_url, paragraph_3_id) 
        self.delete_element(execution_url, step_4_id)
        
        # Cannot delete a redline element
        res = self.delete_element(execution_url, proc_section_step_2_1_a_id, 400)  
        logger.debug('res= %s', json.dumps(res, indent=4)) 

        # return


        # Cannot discard NONE
        res = self.discard_element(execution_id, procedure_section_id, 400)  
        logger.debug('res= %s', json.dumps(res, indent=4)) 

        # Cannot discard ORIGINAL
        res = self.discard_element(execution_id, proc_section_secion_1_id, 400)  
        logger.debug('res= %s', json.dumps(res, indent=4)) 

        # Cannot discard MODIFYING_OLD
        res = self.discard_element(execution_id, proc_section_step_2_1_a_id, 400)  
        logger.debug('res= %s', json.dumps(res, indent=4)) 

        # Cannot discard MODIFIED
        res = self.discard_element(execution_id, proc_section_step_2_1_id, 400)   
        logger.debug('res= %s', json.dumps(res, indent=4))

        # Can discard MODIFYING
        res = self.discard_element(execution_id, proc_section_step_2_1_b_id)       
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_a_id)
        self.assertEqual(numbers[0]['number'], '2-1.a')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFYING')     
        self.assertEqual(len(elem_ids), 11)         

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')    
        self.assertEqual(elements_res[1]['number'], '1') 
        self.assertEqual(elements_res[1]['procedure_modification_status'], 'ORIGINAL') 
        self.assertEqual(elements_res[2]['number'], '1-1') 
        self.assertEqual(elements_res[2]['procedure_modification_status'], 'ORIGINAL')                     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-2.1') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ADDED')  
        self.assertEqual(elements_res[5]['number'], '1-3') 
        self.assertEqual(elements_res[5]['procedure_modification_status'], 'ORIGINAL')          
        self.assertEqual(elements_res[6]['number'], '2') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'ORIGINAL')                    
        self.assertEqual(elements_res[7]['number'], '2-1') 
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'MODIFIED')       
        self.assertEqual(elements_res[8]['number'], '2-1.a')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements_res[9]['number'], '2-1.1')  
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'ADDED')       
        self.assertEqual(elements_res[10]['number'], '2-2')        
        self.assertEqual(elements_res[10]['procedure_modification_status'], 'ORIGINAL') 

        # Cannot discard an approved element
        res = self.discard_element(execution_id, proc_section_step_2_1_a_id, 400)       
        logger.debug('res= %s', json.dumps(res, indent=4))

        # unapprove it
        approval_input = {
            'content': 'this is a temporary change',
            'status': 'PENDING'
        }
        res = self.approve_element(execution_id, proc_section_step_2_1_a_id, approval_input)
        logger.debug('res= %s', json.dumps(res, indent=4))   
        self.assertEqual(res['procedure_modification']['approval']['status'], approval_input['status'])
        self.assertEqual(res['procedure_modification']['approval']['content'], approval_input['content']) 

        # Can discard MODIFYING again
        res = self.discard_element(execution_id, proc_section_step_2_1_a_id)       
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_2_1_id)
        self.assertEqual(numbers[0]['number'], '2-1')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ORIGINAL')     
        self.assertEqual(len(elem_ids), 10)         

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')    
        self.assertEqual(elements_res[1]['number'], '1') 
        self.assertEqual(elements_res[1]['procedure_modification_status'], 'ORIGINAL') 
        self.assertEqual(elements_res[2]['number'], '1-1') 
        self.assertEqual(elements_res[2]['procedure_modification_status'], 'ORIGINAL')                     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-2.1') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ADDED')  
        self.assertEqual(elements_res[5]['number'], '1-3') 
        self.assertEqual(elements_res[5]['procedure_modification_status'], 'ORIGINAL')          
        self.assertEqual(elements_res[6]['number'], '2') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'ORIGINAL')                    
        self.assertEqual(elements_res[7]['number'], '2-1') 
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'ORIGINAL')       
        self.assertEqual(elements_res[8]['number'], '2-1.1')  
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'ADDED')       
        self.assertEqual(elements_res[9]['number'], '2-2')        
        self.assertEqual(elements_res[9]['procedure_modification_status'], 'ORIGINAL')         

        # Can discard ADDED
        res = self.discard_element(execution_id, proc_section_paragraph_1_2__1_id)       
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 0)  
        self.assertEqual(len(elem_ids), 9)         

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')    
        self.assertEqual(elements_res[1]['number'], '1') 
        self.assertEqual(elements_res[1]['procedure_modification_status'], 'ORIGINAL') 
        self.assertEqual(elements_res[2]['number'], '1-1') 
        self.assertEqual(elements_res[2]['procedure_modification_status'], 'ORIGINAL')                     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-3') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ORIGINAL')          
        self.assertEqual(elements_res[5]['number'], '2') 
        self.assertEqual(elements_res[5]['procedure_modification_status'], 'ORIGINAL')                    
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'ORIGINAL')       
        self.assertEqual(elements_res[7]['number'], '2-1.1')  
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'ADDED')       
        self.assertEqual(elements_res[8]['number'], '2-2')        
        self.assertEqual(elements_res[8]['procedure_modification_status'], 'ORIGINAL')    

        # Can discard another ADDED
        res = self.discard_element(execution_id, proc_section_step_2_1__1_id)       
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 0)  
        self.assertEqual(len(elem_ids), 8)         

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')    
        self.assertEqual(elements_res[1]['number'], '1') 
        self.assertEqual(elements_res[1]['procedure_modification_status'], 'ORIGINAL') 
        self.assertEqual(elements_res[2]['number'], '1-1') 
        self.assertEqual(elements_res[2]['procedure_modification_status'], 'ORIGINAL')                     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'DELETED')   
        self.assertEqual(elements_res[4]['number'], '1-3') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ORIGINAL')          
        self.assertEqual(elements_res[5]['number'], '2') 
        self.assertEqual(elements_res[5]['procedure_modification_status'], 'ORIGINAL')                    
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'ORIGINAL')              
        self.assertEqual(elements_res[7]['number'], '2-2')        
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'ORIGINAL')       

        # Can discard DELETED
        res = self.discard_element(execution_id, proc_section_step_1_2_id)       
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']    
        self.assertEqual(len(numbers), 1)
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-2')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ORIGINAL')   
        self.assertEqual(len(elem_ids), 8)         

        elements_res = self.get_elements(execution_url)
        logger.debug('elements_res= %s', json.dumps(elements_res, indent=4))  
        self.assertEqual(elements_res[0]['number'], '1') 
        self.assertEqual(elements_res[0]['procedure_modification_status'], 'NONE')    
        self.assertEqual(elements_res[1]['number'], '1') 
        self.assertEqual(elements_res[1]['procedure_modification_status'], 'ORIGINAL') 
        self.assertEqual(elements_res[2]['number'], '1-1') 
        self.assertEqual(elements_res[2]['procedure_modification_status'], 'ORIGINAL')                     
        self.assertEqual(elements_res[3]['number'], '1-2') 
        self.assertEqual(elements_res[3]['procedure_modification_status'], 'ORIGINAL') 
        self.assertDictEqual(elements_res[3]['procedure_modification'], {})
        self.assertEqual(elements_res[4]['number'], '1-3') 
        self.assertEqual(elements_res[4]['procedure_modification_status'], 'ORIGINAL')          
        self.assertEqual(elements_res[5]['number'], '2') 
        self.assertEqual(elements_res[5]['procedure_modification_status'], 'ORIGINAL')                    
        self.assertEqual(elements_res[6]['number'], '2-1') 
        self.assertEqual(elements_res[6]['procedure_modification_status'], 'ORIGINAL')              
        self.assertEqual(elements_res[7]['number'], '2-2')        
        self.assertEqual(elements_res[7]['procedure_modification_status'], 'ORIGINAL')       
        
        return (execution_id, execution_url)                 

    def test_bulk_redline(self):

        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)         

        outline_elems = self.get_outline(procedure_url, version)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'callable': False,
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',
            'reference_procedure_title': procedure_title,
            'run_for_score': True,
            'tag_selections': []
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)

        self.assertDictEqual(procedure_section_input, user_input)

        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        self.assertEqual(proc_section_elems[0]['elem_id'], procedure_section_id)
        self.assertEqual(proc_section_elems[0]['imported'], True)
        self.assertEqual(proc_section_elems[0]['executed'], False)
        self.assertEqual(proc_section_elems[3]['title'], 'Step 1-2')
        self.assertEqual(proc_section_elems[3]['number'], '1-2')
        self.assertEqual(proc_section_elems[3]['authoring_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(proc_section_elems[3]['execution_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(proc_section_elems[3]['run_for_score'], True)
        self.assertEqual(proc_section_elems[7]['title'], 'Step 2-2')
        self.assertEqual(proc_section_elems[7]['number'], '2-2')

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['authoring_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['execution_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')

        proc_section_secion_1_id = as_run_dict['children'][0]['children'][0]['elem_id']
        logger.debug('proc_section_secion_1_id= %s', proc_section_secion_1_id)

        proc_section_paragraph_1_1_id = as_run_dict['children'][0]['children'][0]['children'][0]['elem_id']
        logger.debug('proc_section_paragraph_1_1_id= %s', proc_section_paragraph_1_1_id)        

        proc_section_step_1_2_id = as_run_dict['children'][0]['children'][0]['children'][1]['elem_id']
        logger.debug('proc_section_step_1_2_id= %s', proc_section_step_1_2_id)

        proc_section_step_1_3_id = as_run_dict['children'][0]['children'][0]['children'][2]['elem_id']
        logger.debug('proc_section_step_1_3_id= %s', proc_section_step_1_3_id)        

        proc_section_secion_2_id = as_run_dict['children'][0]['children'][1]['elem_id']
        logger.debug('proc_section_secion_2_id= %s', proc_section_secion_2_id)     

        proc_section_step_2_1_id = as_run_dict['children'][0]['children'][1]['children'][0]['elem_id']
        logger.debug('proc_section_step_2_1_id= %s', proc_section_step_2_1_id)        

        proc_section_step_2_2_id = as_run_dict['children'][0]['children'][1]['children'][1]['elem_id']
        logger.debug('proc_section_step_2_2_id= %s', proc_section_step_2_2_id)        

        elements = self.get_elements(execution_url)
        for i, element in enumerate(elements):
            logger.debug(f'i: {i} number: {element["number"]} title: {element["title"]} elem_type: {element["elem_type"]}')

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 8)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-2')
        self.assertEqual(elements[4]['number'], '1-3')
        self.assertEqual(elements[5]['number'], '2')
        self.assertEqual(elements[6]['number'], '2-1')
        self.assertEqual(elements[7]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')

        # insert a section into R4R area        
        res = self.add_section(base_url=execution_url,
            insert_after_id=proc_section_paragraph_1_1_id,
            level='SIBLING',
            title='New section in R4R')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        self.assertEqual(res['elem']['number'], '1-1.1')

        section_r4r_1_id = res['elem']['elem_id']

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 9)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-2')
        self.assertEqual(elements[5]['number'], '1-3')
        self.assertEqual(elements[6]['number'], '2')
        self.assertEqual(elements[7]['number'], '2-1')
        self.assertEqual(elements[8]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')

        # cannot discard a section
        res = self.discard_element(execution_id, section_r4r_1_id, 400)
        logger.debug('discard_element res= %s', json.dumps(res, indent=4))
        
        # add a child section into R4R area        
        res = self.add_section(base_url=execution_url,
            insert_after_id=section_r4r_1_id,
            level='CHILD',
            title='New child section in R4R')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        self.assertEqual(res['elem']['number'], '1-1.1.1')

        section_r4r_1_1_id = res['elem']['elem_id']

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 10)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-2')
        self.assertEqual(elements[6]['number'], '1-3')
        self.assertEqual(elements[7]['number'], '2')
        self.assertEqual(elements[8]['number'], '2-1')
        self.assertEqual(elements[9]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')

        # add first child paragraph into R4R area        
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_r4r_1_1_id,
            level='CHILD',
            title='New child paragraph 1 in R4R')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        self.assertEqual(res['elem']['number'], '1-1.1.1.1')

        paragraph_r4r_1_1_1_id = res['elem']['elem_id']

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 11)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-2')
        self.assertEqual(elements[7]['number'], '1-3')
        self.assertEqual(elements[8]['number'], '2')
        self.assertEqual(elements[9]['number'], '2-1')
        self.assertEqual(elements[10]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')

        # add second child paragraph into R4R area        
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=paragraph_r4r_1_1_1_id,
            level='SIBLING',
            title='New child paragraph 2 in R4R')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        self.assertEqual(res['elem']['number'], '1-1.1.1.2')

        paragraph_r4r_1_1_2_id = res['elem']['elem_id']

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 12)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-1.1.1.2')
        self.assertEqual(elements[7]['number'], '1-2')
        self.assertEqual(elements[8]['number'], '1-3')
        self.assertEqual(elements[9]['number'], '2')
        self.assertEqual(elements[10]['number'], '2-1')
        self.assertEqual(elements[11]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[11]['procedure_modification_status'], 'ORIGINAL')

        # discard the first added paragraph
        res = self.discard_element(execution_id, paragraph_r4r_1_1_1_id)
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']   
        
        self.assertEqual(len(numbers), 1)   
        self.assertEqual(numbers[0]['elem_id'], paragraph_r4r_1_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-1.1.1.1')

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 11)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-2')
        self.assertEqual(elements[7]['number'], '1-3')
        self.assertEqual(elements[8]['number'], '2')
        self.assertEqual(elements[9]['number'], '2-1')
        self.assertEqual(elements[10]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')

        # add first child paragraph again into R4R area        
        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_r4r_1_1_id,
            level='CHILD',
            title='New child paragraph 1 in R4R')
        logger.debug('add_section res= %s', json.dumps(res, indent=4))
        self.assertEqual(res['elem']['number'], '1-1.1.1.1')

        paragraph_r4r_1_1_1_id = res['elem']['elem_id']

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 12)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-1.1.1.2')
        self.assertEqual(elements[7]['number'], '1-2')
        self.assertEqual(elements[8]['number'], '1-3')
        self.assertEqual(elements[9]['number'], '2')
        self.assertEqual(elements[10]['number'], '2-1')
        self.assertEqual(elements[11]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[11]['procedure_modification_status'], 'ORIGINAL')

        # add a modification redline
        res = self.modify_element(execution_id, proc_section_step_1_2_id)
        logger.debug('res= %s', json.dumps(res, indent=4))
        step_mod_1_id = res['elem']['elem_id']
        
        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 13)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-1.1.1.2')
        self.assertEqual(elements[7]['number'], '1-2')
        self.assertEqual(elements[8]['number'], '1-2.a')
        self.assertEqual(elements[9]['number'], '1-3')
        self.assertEqual(elements[10]['number'], '2')
        self.assertEqual(elements[11]['number'], '2-1')
        self.assertEqual(elements[12]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[7]['procedure_modification_status'], 'MODIFIED')
        self.assertEqual(elements[8]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[11]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[12]['procedure_modification_status'], 'ORIGINAL')
        
        # modify it again
        res = self.modify_element(execution_id, proc_section_step_1_2_id)
        logger.debug('modify_res= %s', json.dumps(res, indent=4))
        step_mod_2_id = res['elem']['elem_id']
        
        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 14)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-1.1.1.2')
        self.assertEqual(elements[7]['number'], '1-2')
        self.assertEqual(elements[8]['number'], '1-2.a')
        self.assertEqual(elements[9]['number'], '1-2.b')
        self.assertEqual(elements[10]['number'], '1-3')
        self.assertEqual(elements[11]['number'], '2')
        self.assertEqual(elements[12]['number'], '2-1')
        self.assertEqual(elements[13]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[7]['procedure_modification_status'], 'MODIFIED')
        self.assertEqual(elements[8]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements[9]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[11]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[12]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[13]['procedure_modification_status'], 'ORIGINAL')

        # DELETED redline
        res = self.delete_element(execution_url, proc_section_step_1_3_id)
        logger.debug('modify_res= %s', json.dumps(res, indent=4))
        step_del_1_id = res['numbers'][0]['elem_id']
        self.assertEqual(step_del_1_id, proc_section_step_1_3_id)
        
        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 14)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-1.1.1.1')
        self.assertEqual(elements[6]['number'], '1-1.1.1.2')
        self.assertEqual(elements[7]['number'], '1-2')
        self.assertEqual(elements[8]['number'], '1-2.a')
        self.assertEqual(elements[9]['number'], '1-2.b')
        self.assertEqual(elements[10]['number'], '1-3')
        self.assertEqual(elements[11]['number'], '2')
        self.assertEqual(elements[12]['number'], '2-1')
        self.assertEqual(elements[13]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[7]['procedure_modification_status'], 'MODIFIED')
        self.assertEqual(elements[8]['procedure_modification_status'], 'MODIFYING_OLD')
        self.assertEqual(elements[9]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements[10]['procedure_modification_status'], 'DELETED')
        self.assertEqual(elements[11]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[12]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[13]['procedure_modification_status'], 'ORIGINAL')

        # cannot justifiy inactive redline (MODIFYING_OLD)
        justification_input = {
            'modification_type': 'BLUELINE',                    
            'content': 'this is a temporary change'
        }
        self.justify_element(execution_id, step_mod_1_id, justification_input, 400)

        bulk_justification_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_1_id,
                step_mod_2_id, 
                proc_section_step_1_3_id
            ], 
            'justification_input': justification_input
        }
        self.justify_elements(execution_id, bulk_justification_input, 400)

        # cannot approve inactive redline (MODIFYING_OLD)
        approval_input = {
            'content': 'this is a change for test',
            'status': 'APPROVED'
        }
        self.approve_element(execution_id, step_mod_1_id, approval_input, 400)

        bulk_approval_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_1_id,
                step_mod_2_id, 
                proc_section_step_1_3_id
            ], 
            'approval_input': approval_input
        }
        self.approve_elements(execution_id, bulk_approval_input, 400)

        # cannot discard inactive redline (MODIFYING_OLD)
        self.discard_element(execution_id, step_mod_1_id, 400)

        discard_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_1_id,
                step_mod_2_id, 
                proc_section_step_1_3_id
            ]
        }
        self.discard_elements(execution_id, discard_input, 400)  

        # bulk justification
        justification_input = {
            'modification_type': 'BLUELINE',                    
            'content': 'this is a temporary change'
        }
        bulk_justification_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_2_id, 
                proc_section_step_1_3_id
            ], 
            'justification_input': justification_input
        }
        res = self.justify_elements(execution_id, bulk_justification_input)
        logger.debug('res= %s', json.dumps(res, indent=4))

        self.assertEqual(len(res), 4)

        for elem in res:
            self.assertEqual(elem['procedure_modification']['justification']['modification_type'], justification_input['modification_type'])
            self.assertEqual(elem['procedure_modification']['justification']['content'], justification_input['content'])
            self.assertTrue(len(elem['procedure_modification']['justification']['user_name']) > 0)
            self.assertTrue(len(elem['procedure_modification']['justification']['time_updated']) > 0)
        
        # bulk approval
        approval_input = {
            'content': 'this is a change for test',
            'status': 'APPROVED'
        }
        bulk_approval_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_2_id, 
                proc_section_step_1_3_id
            ], 
            'approval_input': approval_input
        }
        
        res = self.approve_elements(execution_id, bulk_approval_input)
        logger.debug('res= %s', json.dumps(res, indent=4))

        self.assertEqual(len(res), 4)
        for elem in res:
            self.assertEqual(elem['procedure_modification']['approval']['status'], approval_input['status'])
            self.assertEqual(elem['procedure_modification']['approval']['content'], approval_input['content'])

        # cannot discard approved redline
        discard_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_2_id, 
                proc_section_step_1_3_id
            ]
        }
        res = self.discard_elements(execution_id, discard_input, 400)
        logger.debug('res= %s', json.dumps(res, indent=4))

        # bulk un-approval
        approval_input = {
            'content': 'will check later',
            'status': 'PENDING'
        }
        bulk_approval_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_2_id, 
                proc_section_step_1_3_id
            ], 
            'approval_input': approval_input
        }
        
        res = self.approve_elements(execution_id, bulk_approval_input)
        logger.debug('res= %s', json.dumps(res, indent=4))

        self.assertEqual(len(res), 4)
        for elem in res:
            self.assertEqual(elem['procedure_modification']['approval']['status'], approval_input['status'])
            self.assertEqual(elem['procedure_modification']['approval']['content'], approval_input['content'])

        # bulk discard
        discard_input = {
            'elem_ids': [
                paragraph_r4r_1_1_1_id, 
                paragraph_r4r_1_1_2_id, 
                step_mod_2_id, 
                proc_section_step_1_3_id
            ]
        }
        res = self.discard_elements(execution_id, discard_input)
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']         
        
        self.assertEqual(len(numbers), 2)   
        self.assertEqual(numbers[0]['elem_id'], step_mod_1_id)
        self.assertEqual(numbers[0]['number'], '1-2.a')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'MODIFYING')     
        self.assertEqual(numbers[1]['elem_id'], proc_section_step_1_3_id)
        self.assertEqual(numbers[1]['number'], '1-3')
        self.assertEqual(numbers[1]['procedure_modification_status'], 'ORIGINAL')

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 11)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-2')
        self.assertEqual(elements[6]['number'], '1-2.a')
        self.assertEqual(elements[7]['number'], '1-3')
        self.assertEqual(elements[8]['number'], '2')
        self.assertEqual(elements[9]['number'], '2-1')
        self.assertEqual(elements[10]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'MODIFIED')
        self.assertEqual(elements[6]['procedure_modification_status'], 'MODIFYING')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[10]['procedure_modification_status'], 'ORIGINAL')

        # discard
        discard_input = {
            'elem_ids': [
                step_mod_1_id
            ]
        }
        res = self.discard_elements(execution_id, discard_input)
        logger.debug('res= %s', json.dumps(res, indent=4))
        numbers = res['numbers']
        elem_ids = res['elem_ids']         
        
        self.assertEqual(len(numbers), 1)   
        self.assertEqual(numbers[0]['elem_id'], proc_section_step_1_2_id)
        self.assertEqual(numbers[0]['number'], '1-2')
        self.assertEqual(numbers[0]['procedure_modification_status'], 'ORIGINAL')     

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 10)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-1.1')
        self.assertEqual(elements[4]['number'], '1-1.1.1')
        self.assertEqual(elements[5]['number'], '1-2')
        self.assertEqual(elements[6]['number'], '1-3')
        self.assertEqual(elements[7]['number'], '2')
        self.assertEqual(elements[8]['number'], '2-1')
        self.assertEqual(elements[9]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ADDED')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[8]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[9]['procedure_modification_status'], 'ORIGINAL')

        # delete element
        res = self.delete_element(execution_url, section_r4r_1_id)
        logger.debug('res= %s', json.dumps(res, indent=4))

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 8)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[1]['number'], '1')
        self.assertEqual(elements[2]['number'], '1-1')
        self.assertEqual(elements[3]['number'], '1-2')
        self.assertEqual(elements[4]['number'], '1-3')
        self.assertEqual(elements[5]['number'], '2')
        self.assertEqual(elements[6]['number'], '2-1')
        self.assertEqual(elements[7]['number'], '2-2')

        self.assertEqual(elements[0]['procedure_modification_status'], 'NONE')
        self.assertEqual(elements[1]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[2]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[3]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[4]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[5]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[6]['procedure_modification_status'], 'ORIGINAL')
        self.assertEqual(elements[7]['procedure_modification_status'], 'ORIGINAL')

    def test_replace_element(self):
        procedure_title = 'title_' + random_string()
        procedure_dict = self.create_procedure(procedure_title, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        # add another step to procedure
        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.MANUAL_INPUT,
            insert_after_id='-1',
            level='SIBLING')
        step_id_1 = res_dict['elem']['elem_id']        
        user_input_1 = {
            'entries': [
                {
                    'name': 'param1',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['abc']
                },
                {
                    'name': 'param2',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['11.0']
                }
            ]
        }
        self.set_step_input(procedure_url, StepTypes.MANUAL_INPUT, step_id_1, user_input_1)

        version_dict = self.create_procedure_version(procedure_id, 'first version')
        version_1 = version_dict['version']

        elements = self.get_elements(procedure_url)
        proc_step_1 = elements[0]

        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, 'test execution')
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'title': 'Procedure Section 1'}
        res_dict = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)
        procedure_section_id = res_dict['elem']['elem_id']

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        wait_step_id = res_dict['elem']['elem_id']

        outline_elems = self.get_outline(procedure_url, version_1)

        procedure_section_input = {
            'callable': False,
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': True,
            'tag_selections': []            
        }

        #
        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)
        self.import_procedure_section(execution_id, procedure_section_id)

        elements = self.get_elements(execution_url)
        exec_elem_id_1 = elements[1]['elem_id']

        self.modify_element(execution_id, exec_elem_id_1)

        elements = self.get_elements(execution_url)
        redline_elem_id_1 = elements[2]['elem_id']

        user_input_1_ex = {
            'entries': [
                {
                    'name': 'param1',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['abcd'],
                    'actual_value': 'abcd'
                },
                {
                    'name': 'param2',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['abcde'],
                    'actual_value': 'abcde'
                },
                {
                    'name': 'param3',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'EQUAL',
                    'verification_values': ['12.0'],
                    'actual_value': '12.0'
                }
            ]
        }
        self.set_step_input(execution_url, StepTypes.MANUAL_INPUT, redline_elem_id_1, user_input_1_ex)
        redline_title = 'step with redline'
        redline_description = 'this step was redlined'
        self.update_step(execution_url, StepTypes.MANUAL_INPUT, redline_elem_id_1, 
            {'title': redline_title, 'description': redline_description})

        approval_input = {
            'content': 'here I approve',
            'status': 'APPROVED'
        }
        self.approve_element(execution_id, redline_elem_id_1, approval_input)
        self.run_step_async(execution_id, redline_elem_id_1, 202)

        time.sleep(2)

        elements = self.get_elements(execution_url)
        exec_step_1 = elements[2]
        logger.debug('exec_step_1= %s', json.dumps(exec_step_1, indent=4))

        url = shared_dict['host'] + f'/procedures/{procedure_id}/elements/{step_id_1}/replace'

        # incorrect input
        replace_element_input = {
            'execution_id': execution_id
        }
        res = requests.post(url, json=replace_element_input, headers=shared_dict['headers'])
        self.assertEqual(res.status_code, 400)
        
        # incorrect input
        replace_element_input = {
            'elem_id': redline_elem_id_1
        }
        res = requests.post(url, json=replace_element_input, headers=shared_dict['headers'])
        self.assertEqual(res.status_code, 400)

        # incorrect input
        replace_element_input = {
            'execution_id': execution_id,
            'elem_id': procedure_section_id
        }
        res = requests.post(url, json=replace_element_input, headers=shared_dict['headers'])
        self.assertEqual(res.status_code, 400)

        # incorrect input
        replace_element_input = {
            'execution_id': execution_id,
            'elem_id': wait_step_id
        }
        res = requests.post(url, json=replace_element_input, headers=shared_dict['headers'])
        self.assertEqual(res.status_code, 400)
        res_dict = res.json()
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))

        # replace
        replace_element_input = {
            'execution_id': execution_id,
            'elem_id': redline_elem_id_1
        }
        res = requests.post(url, json=replace_element_input, headers=shared_dict['headers'])
        self.assertEqual(res.status_code, 200)
        res_dict = res.json()
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))
        
        self.assertEqual(res_dict['title'], redline_title)
        self.assertEqual(res_dict['description'], redline_description)

        auth_input = copy.deepcopy(user_input_1_ex)
        for entry in auth_input['entries']:
            del entry['actual_value']

        self.assertDictEqual(res_dict['authoring_user_input'], auth_input)
        self.assertDictEqual(res_dict['execution_user_input'], proc_step_1['execution_user_input'])
        self.assertDictEqual(res_dict['specification'], proc_step_1['specification'])
        self.assertDictEqual(res_dict['execution'], proc_step_1['execution'])


    def check_as_run(self, res_dict):
        self.assertEqual(res_dict['children'][0]['title'], 'Section 1')
        self.assertEqual(res_dict['children'][0]['number'], '1')
        self.assertEqual(res_dict['children'][0]['children'][0]['title'], 'Step 1-1')
        self.assertEqual(res_dict['children'][0]['children'][0]['number'], '1-1')
        self.assertEqual(res_dict['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(res_dict['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(res_dict['children'][1]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict['children'][1]['number'], '2')     # paragraph should not be numbered
        self.assertEqual(res_dict['children'][2]['title'], 'Section 3')
        self.assertEqual(res_dict['children'][2]['number'], '3')
        self.assertEqual(res_dict['children'][2]['children'][0]['title'], 'Step 3-1')
        self.assertEqual(res_dict['children'][2]['children'][0]['number'], '3-1')
        self.assertEqual(res_dict['children'][2]['children'][1]['title'], 'Step 3-2')
        self.assertEqual(res_dict['children'][2]['children'][1]['number'], '3-2')


    def test_get_executions(self):
        ## Add executions with unique description
        random_name1 = random_string(8)
        random_name2 = random_string(8)

        procedure_title_1 = 'My procedure 1 ' + random_name1
        procedure_description_1 = 'My procedure 1 description ' + random_name1
        institutional_id_1 = 'ins_1_' + random_name1
        institutional_release_id_1_1 = 'rel_1_1_' + random_name1

        procedure_title_2 = 'My procedure 2 ' + random_name2
        procedure_description_2 = 'My procedure 2 description ' + random_name2
        institutional_id_2 = 'ins_2_' + random_name2
        institutional_release_id_2_1 = 'rel_2_1_' + random_name2

        procedure_1 = self.create_procedure(procedure_title_1, procedure_description_1,
            institutional_id_1)
        procedure_id_1 = procedure_1['procedure_id']

        self.create_procedure_version(procedure_id_1, 'version 1')
        self.update_procedure_version(procedure_id_1, 1, {'institutional_release_id': institutional_release_id_1_1})
        self.update_procedure_version_status(procedure_id_1, 1, {'action': 'RELEASE'})

        self.create_procedure_version(procedure_id_1, 'version 2')

        procedure_2 = self.create_procedure(procedure_title_2, procedure_description_2,
            institutional_id_2)
        procedure_id_2 = procedure_2['procedure_id']

        procedure_2_version_1 = self.create_procedure_version(procedure_id_2, 'version 1')
        self.update_procedure_version(procedure_id_2, 1, {'institutional_release_id': institutional_release_id_2_1})
        self.update_procedure_version_status(procedure_id_2, 1, {'action': 'RELEASE'})

        description1 = 'My execution 1 name ' + random_name1
        res_dict = self.create_venue('WSTS')
        venue_id_1 = res_dict['venue_id']
        venue_name_1 = res_dict['name']             
        execution_dict = self.create_execution(venue_id_1, description1)
        execution_id_1 = execution_dict['execution_id']
        time_started_1 = execution_dict['time_started']
        test_conductor_1 = 'hpotter_' + random_name1
        test_conductor_2 = 'hsimpson_' + random_name2
        self.update_execution(execution_id_1,
            {
                'test_conductors': [test_conductor_1],
                'time_completed': '',
                'used_procedures': []
            },
            code_expected=200
        )
        time.sleep(0.01)   # To make it sure create time is different

        description2 = 'My execution 2 name ' + random_name1
        res_dict = self.create_venue('WSTS')
        venue_id_2 = res_dict['venue_id']
        venue_name_2 = res_dict['name']             
        execution_dict = self.create_execution(venue_id_2, description2)
        execution_id_2 = execution_dict['execution_id']
        time_started_2 = execution_dict['time_started']
        self.update_execution(execution_id_2,
            {
                'test_conductors': [test_conductor_1, test_conductor_2],
                'time_completed': '2018-04-25T21:39:24.232Z',
                'used_procedures': []
            },
            code_expected=200
        )
        time.sleep(0.01)   # To make it sure create time is different

        description3 = 'My execution 3 name ' + random_name2
        res_dict = self.create_venue('Testbed')
        venue_id_3 = res_dict['venue_id']
        venue_name_3 = res_dict['name']     

        execution_dict = self.create_execution(venue_id_3, description3)
        execution_id_3 = execution_dict['execution_id']
        time_started_3 = execution_dict['time_started']
        self.update_execution(execution_id_3,
            {
                'test_conductors': [test_conductor_2],
                'time_completed': '2018-04-26T21:39:24.232Z',
                'status': 'IDLE',
                'used_procedures': [
                    {
                        'procedure_id': procedure_id_1, 
                        'version': 1, 
                        'institutional_id': institutional_id_1,
                        'institutional_release_id': institutional_release_id_1_1
                    }
                ]
            },
            code_expected=200
        )
        time.sleep(0.01)   # To make it sure create time is different

        description4 = 'My execution 4 name ' + random_name2
        res_dict = self.create_venue('Testbed')
        venue_id_4 = res_dict['venue_id']
        venue_name_4 = res_dict['name']        
        execution_dict = self.create_execution(venue_id_4, description4)
        execution_id_4 = execution_dict['execution_id']
        self.update_execution(execution_id_4,
            {
                'test_conductors': [test_conductor_2],
                'time_completed': '2018-04-27T21:39:24.232Z',
                'status': 'RUNNING',
                'used_procedures': [
                    {
                        'procedure_id': procedure_id_1, 
                        'version': 2,
                        'institutional_id': institutional_id_1,
                        'institutional_release_id': ''
                    },
                    {
                        'procedure_id': procedure_id_2, 
                        'version': 1,
                        'institutional_id': institutional_id_2,
                        'institutional_release_id': institutional_release_id_2_1
                    }
                ]
            },
            code_expected=200
        )
        time.sleep(0.01)   # To make it sure create time is different

        description5 = 'My execution 5 name ' + random_name2
        res_dict = self.create_venue('ATLO')
        venue_id_5 = res_dict['venue_id']
        venue_name_5 = res_dict['name']          
        execution_dict = self.create_execution(venue_id_5, description5)
        execution_id_5 = execution_dict['execution_id']
        self.update_execution(execution_id_5,
            {
                'test_conductors': [test_conductor_2],
                'time_completed': '2018-04-28T21:39:24.232Z',
                'status': 'CLOSED',
                'used_procedures': [
                    {
                        'procedure_id': procedure_id_1, 
                        'version': 1,
                        'institutional_id': institutional_id_1,
                        'institutional_release_id': institutional_release_id_1_1                        
                    },
                    {
                        'procedure_id': procedure_id_2, 
                        'version': 1,
                        'institutional_id': institutional_id_2,
                        'institutional_release_id': institutional_release_id_2_1                        
                    }
                ]
            },
            code_expected=200
        )
        time.sleep(0.01)   # To make it sure create time is different

        ## Get executions
        url = shared_dict['host'] + '/executions'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        executions_dict = json.loads(result.text)
        # print 'executions_dict=', json.dumps(executions_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertGreater(len(executions_dict), 0)

        ## Get executions in ASC order
        url = shared_dict['host'] + '/executions'
        params = {'sort': 'ASC'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        executions_dict_asc = json.loads(result.text)
        # print 'executions_dict_asc=', json.dumps(executions_dict_asc, indent=4)
        self.assertGreater(len(executions_dict), 0)

        ## Get executions in DESC order
        url = shared_dict['host'] + '/executions'
        params = {'sort': 'DESC'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        executions_dict_desc = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertGreater(len(executions_dict), 0)

        # The default sorting is DESC
        self.assertEqual(executions_dict[0]['execution_id'], executions_dict_desc[0]['execution_id'])
        self.assertEqual(executions_dict[-1]['execution_id'], executions_dict_desc[-1]['execution_id'])

        if len(executions_dict_desc) < 50:
            # This makes sense only the total count is less than 50 which is the default return size
            # Check the sorting
            self.assertEqual(executions_dict_asc[0]['execution_id'], executions_dict_desc[-1]['execution_id'])
            self.assertEqual(executions_dict_asc[-1]['execution_id'], executions_dict_desc[0]['execution_id'])

        ## sort by EXECUTION_ID ASC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'ASC', 'sort_by': 'EXECUTION_ID'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_3)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_5)

        ## sort by EXECUTION_ID DESC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'DESC', 'sort_by': 'EXECUTION_ID'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_5)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_3)

        ## sort by TIME_STARTED ASC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'ASC', 'sort_by': 'TIME_STARTED'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_3)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_5)

        ## sort by TIME_STARTED DESC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'DESC', 'sort_by': 'TIME_STARTED'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_5)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_3)

        ## sort by TIME_COMPLETED ASC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'ASC', 'sort_by': 'TIME_COMPLETED'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_3)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_5)

        ## sort by TIME_COMPLETED DESC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'DESC', 'sort_by': 'TIME_COMPLETED'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], execution_id_5)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_4)
        self.assertEqual(res_dict[2]['execution_id'], execution_id_3)

        ## sort by VENUE_NAME ASC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'ASC', 'sort_by': 'VENUE_NAME'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        id_1 = res_dict[0]['execution_id']
        id_2 = res_dict[1]['execution_id']
        id_3 = res_dict[2]['execution_id']

        ## sort by VENUE_NAME DESC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'DESC', 'sort_by': 'VENUE_NAME'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], id_3)
        self.assertEqual(res_dict[1]['execution_id'], id_2)
        self.assertEqual(res_dict[2]['execution_id'], id_1)

        ## sort by STATUS ASC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'ASC', 'sort_by': 'STATUS'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        id_1 = res_dict[0]['execution_id']
        id_2 = res_dict[1]['execution_id']
        id_3 = res_dict[2]['execution_id']

        ## sort by STATUS DESC
        url = shared_dict['host'] + '/executions'
        params = {'description': random_name2, 'sort': 'DESC', 'sort_by': 'STATUS'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions_dict_desc=', json.dumps(executions_dict_desc, indent=4)
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')
        self.assertEqual(res_dict[0]['execution_id'], id_3)
        self.assertEqual(res_dict[1]['execution_id'], id_2)
        self.assertEqual(res_dict[2]['execution_id'], id_1)

        ## Get executions with offset
        url = shared_dict['host'] + '/executions'
        params = {'offset': 1, 'limit': 3}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(len(res_dict), 3)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)

        logger.debug('result.headers= %s', result.headers)
        self.assertGreater(int(result.headers['x-total-count']), 3)

        self.assertEqual(res_dict[0]['execution_id'], executions_dict[1]['execution_id'])

        ## Get executions with execution_id filter
        url = shared_dict['host'] + '/executions'
        params = {'execution_id': id_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(len(res_dict), 1)
        self.assertEqual(res_dict[0]['execution_id'], id_1)
        self.assertEqual(result.headers['x-total-count'], '1')

        ## Get executions with description filter
        url = shared_dict['host'] + '/executions'
        result = requests.get(url, headers=shared_dict['headers'])
        params = {'description': random_name1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        ## Get executions with description filter. With space in the description.
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')

        ## Get executions with status filter
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'status': 'CLOSED'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(len(res_dict), 1)
        self.assertEqual(res_dict[0]['execution_id'], execution_id_5)
        self.assertEqual(result.headers['x-total-count'], '1')

        ## Get executions with status filter
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'status': 'IDLE', 'statuses': 'CLOSED'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.headers['x-total-count'], '2')
        res_dict = json.loads(result.text)
        # print('executions res_dict=', json.dumps(res_dict, indent=4))
        self.assertEqual(len(res_dict), 2)
        for execution in res_dict:
            self.assertTrue(execution['status'] in ['IDLE', 'CLOSED'])

        ## Get executions with status filter
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'statuses': 'IDLE,CLOSED'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.headers['x-total-count'], '2')
        res_dict = json.loads(result.text)
        # print('executions res_dict=', json.dumps(res_dict, indent=4))
        self.assertEqual(len(res_dict), 2)
        for execution in res_dict:
            self.assertTrue(execution['status'] in ['IDLE', 'CLOSED'])


        ## Get executions with completed filter: True
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name1, 'completed': 'true'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 1)
        self.assertTrue(res_dict[0]['time_completed'] != '')
        self.assertEqual(result.headers['x-total-count'], '1')

        ## Get executions with completed filter: False
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name1, 'completed': 'false'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertTrue(res_dict[0]['time_completed'] == '')
        self.assertEqual(result.headers['x-total-count'], '1')

        ## Get executions with from_time and to_time filters
        url = shared_dict['host'] + '/executions'
        params = {'from_time': time_started_2, 'to_time': time_started_3, 'sort_by': 'EXECUTION_ID', 'sort': 'ASC'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(res_dict[0]['execution_id'], execution_id_2)
        self.assertEqual(res_dict[1]['execution_id'], execution_id_3)
        self.assertEqual(result.headers['x-total-count'], '2')     
        
        ## venue_id filter
        url = shared_dict['host'] + '/executions'
        params = {'venue_id': venue_id_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 1)
        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertTrue(res_dict[0]['venue_id'] == venue_id_1)

        ## venue_name filter
        url = shared_dict['host'] + '/executions'
        params = {'venue_name': venue_name_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 1)
        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertTrue(res_dict[0]['venue_name'] == venue_name_1)

        ## venue_type filter
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name1, 'venue_type': 'WSTS'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        ## venue_type filter (specify a type for which there is no execution)
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'venue_type': 'Other'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 0)
        self.assertEqual(result.headers['x-total-count'], '0')

         ## Get executions with run_for_score filter: True
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'run_for_score': 'true'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 0)
        self.assertEqual(result.headers['x-total-count'], '0')

        ## Get executions with run_for_score filter: False
        url = shared_dict['host'] + '/executions'
        params = {'description': 'name ' + random_name2, 'run_for_score': 'false'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 3)
        self.assertTrue(res_dict[0]['run_for_score'] == False)
        self.assertTrue(res_dict[1]['run_for_score'] == False)
        self.assertTrue(res_dict[2]['run_for_score'] == False)
        self.assertEqual(result.headers['x-total-count'], '3')

        # test conductor filter
        url = shared_dict['host'] + '/executions'
        params = {'test_conductor': test_conductor_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        url = shared_dict['host'] + '/executions'
        params = {'test_conductor': test_conductor_2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 4)
        self.assertEqual(result.headers['x-total-count'], '4')

        # use procedure filter
        url = shared_dict['host'] + '/executions'
        params = {'procedure_id': procedure_id_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')

        url = shared_dict['host'] + '/executions'
        params = {'procedure_id': procedure_id_2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        # procedure version filter
        url = shared_dict['host'] + '/executions'
        params = {'procedure_id': procedure_id_2, 'version': 1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        url = shared_dict['host'] + '/executions'
        params = {'procedure_id': procedure_id_2, 'version': 2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 0)
        self.assertEqual(result.headers['x-total-count'], '0')

        # institutional_id filter
        url = shared_dict['host'] + '/executions'
        params = {'institutional_id': institutional_id_1}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 3)
        self.assertEqual(result.headers['x-total-count'], '3')

        url = shared_dict['host'] + '/executions'
        params = {'institutional_id': institutional_id_2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        # institutional_release_id filter
        url = shared_dict['host'] + '/executions'
        params = {'institutional_id': institutional_id_2,
            'institutional_release_id': institutional_release_id_2_1
        }
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(result.headers['x-total-count'], '2')

        url = shared_dict['host'] + '/executions'
        params = {'institutional_id': institutional_id_2,
            'institutional_release_id': 'non_existing_id'
        }
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        # print 'result.headers=', result.headers
        self.assertEqual(len(res_dict), 0)
        self.assertEqual(result.headers['x-total-count'], '0')

        ## Get executions with limit
        url = shared_dict['host'] + '/executions'
        params = {'limit': 3}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        # print 'executions res_dict=', json.dumps(res_dict, indent=4)
        logger.debug('result.headers= %s', result.headers)
        self.assertEqual(len(res_dict), 3)
        self.assertGreater(int(result.headers['x-total-count']), 3)

    def test_create_execution_error(self):


        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution('venue_id_non_existent', description, 400)


        self.assertTrue(len(res_dict['message']) > 0)


        #### Create an execution
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']          
        exe_description = 'My proper execution name ' + random_string(8)
        execution_dict = self.create_execution(venue_id, exe_description)
        execution_id = execution_dict['execution_id']

        ## Try to create another execution for the venue in use.
        description = 'Another execution for a venue in use'
        res_dict = self.create_execution(venue_id, description, 400)


        # self.assertTrue(len(res_dict['message']) > 0)



    def test_create_element_error(self):


        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        #

        ## Try to add an element to a section
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_id_1,
            level='CHILD',
            description='Paragraph under section 1')


        paragraph_id = res_dict['elem']['elem_id']

        ## Try to add an element to a step
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=step_id_3_2,
            level='CHILD',
            description='Paragraph that cannot be added to step',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Try to add an element to a paragraph
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=paragraph_id,
            level='CHILD',
            description='Paragraph that cannot be added to paragraph',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Use insert_after_id that does not belong to execution_id
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']  
        exe_description = 'My temp execution name ' + random_string(8)
        execution_dict = self.create_execution(venue_id, exe_description)
        execution_id_other = execution_dict['execution_id']

        res_dict = self.add_section(base_url='{0}/executions/{1}'.format(shared_dict['host'], execution_id_other),
            insert_after_id=section_id_1,
            level='CHILD',
            description='Section cannot be added to other execution',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Use wrong execution_id
        res_dict = self.add_section(base_url='{0}/executions/{1}'.format(shared_dict['host'], 'no_execution_id'),
            insert_after_id=section_id_1,
            level='SIBLING',
            description='Section cannot be added to non existent execution',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Use wrong insert_after_id
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='no_id',
            level='SIBLING',
            description='Section that cannot be added',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Use wrong insert_after_id
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id='not_an_id',
            level='CHILD',
            description='Step that cannot be added',
            guard='',
            variable_name='manual_input_1_2_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[],
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Use wrong insert_after_id
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id='no_id',
            level='SIBLING',
            description='Paragraph that cannot be added',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

    def test_move_element_error(self):


        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']
        
        # Cannot move to itself
        res_dict = self.move_element(execution_url, section_id_1, section_id_1, 'CHILD', code_expected=400)
        logger.debug('move res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(len(res_dict['details']), 2)
        self.assertEqual(res_dict['details'][0], 'Cannot move an element to itself or its child')        

        ## Try to move an element as a child of a step
        res_dict = self.move_element(base_url=execution_url,
            elem_id=step_id_3_1,
            insert_after_id=step_id_1_2,
            level='CHILD',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Try to move an element that does not exist
        res_dict = self.move_element(base_url=execution_url,
            elem_id='not an id',
            insert_after_id=section_id_3,
            level='CHILD',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Try to move an element to an element that does not exist
        res_dict = self.move_element(base_url=execution_url,
            elem_id=step_id_3_1,
            insert_after_id='not an id',
            level='CHILD',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)

        ## Invalid execution id
        res_dict = self.move_element(base_url=execution_url + 'not an id',
            elem_id=step_id_3_1,
            insert_after_id=section_id_1,
            level='CHILD',
            code_expected=400)


        self.assertTrue(len(res_dict['message']) > 0)


    def test_execution_structure(self):


        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        ## Add section 1-3
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=step_id_1_2,
            level='SIBLING',
            title='Section 1-3')


        section_id_1_3 = res_dict['elem']['elem_id']

        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=section_id_1_3,
            level='CHILD',
            title='Step 1-3-1',
            guard='',
            variable_name='manual_input_1_2_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])


        step_id_1_3_1 = res_dict['elem']['elem_id']

        ## Get As Run
        url = shared_dict['host'] + '/executions/' + execution_id + '/as_run'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)


        self.assertEqual(res_dict['children'][0]['title'], 'Section 1')
        self.assertEqual(res_dict['children'][0]['number'], '1')
        self.assertEqual(res_dict['children'][0]['children'][0]['title'], 'Step 1-1')
        self.assertEqual(res_dict['children'][0]['children'][0]['number'], '1-1')
        self.assertEqual(res_dict['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(res_dict['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(res_dict['children'][0]['children'][2]['number'], '1-3')
        self.assertEqual(res_dict['children'][0]['children'][2]['children'][0]['title'], 'Step 1-3-1')
        self.assertEqual(res_dict['children'][0]['children'][2]['children'][0]['number'], '1-3-1')
        self.assertEqual(res_dict['children'][1]['title'], 'Paragraph Section 2')
        self.assertEqual(res_dict['children'][2]['title'], 'Section 3')
        self.assertEqual(res_dict['children'][2]['number'], '3')
        self.assertEqual(res_dict['children'][2]['children'][0]['title'], 'Step 3-1')
        self.assertEqual(res_dict['children'][2]['children'][0]['number'], '3-1')
        self.assertEqual(res_dict['children'][2]['children'][1]['title'], 'Step 3-2')
        self.assertEqual(res_dict['children'][2]['children'][1]['number'], '3-2')

    def test_update_execution(self):

        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']  

        ## Add an execution
        description = 'My new execution'
        execution_dict = self.create_execution(venue_id, description)
        execution_id = execution_dict['execution_id']
        ## Update
        new_description = 'My updated description for this'
        test_conductors = ['hpotter']
        input_dict = {'description': new_description,
            'test_conductors': test_conductors}
        self.update_execution(execution_id, input_dict, code_expected=200)

        # Check
        url = shared_dict['host'] + '/executions/' + execution_id
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        execution_dict_updated = json.loads(result.text)


        self.assertEqual(execution_dict_updated['description'], new_description)
        self.assertListEqual(execution_dict_updated['test_conductors'], test_conductors)

    def test_step_result(self):


        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My execution with results'
        execution_dict = self.create_execution(venue_id, description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            description='Section 1')


        section_id_1 = res_dict['elem']['elem_id']
        self.assertEqual(res_dict['elem']['number'], '1')

        ## Add step 1-1
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=section_id_1,
            level='CHILD',
            description='Step 1-1',
            guard='',
            variable_name='manual_input_1_1_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])


        step_id_1_1 = res_dict['elem']['elem_id']
        self.assertEqual(res_dict['elem']['number'], '1-1')

        self.update_element(execution_url, step_id_1_1, {'executable': 'EXECUTED'})

        ## Add step 1-2
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_1_1,
            level='SIBLING',
            description='Step 1-2',
            guard='',
            variable_name='manual_input_1_2_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])


        step_id_1_2 = res_dict['elem']['elem_id']
        self.assertEqual(res_dict['elem']['number'], '1-2')

        self.update_element(execution_url, step_id_1_2, {'executable': 'EXECUTED'})

        # Set user input
        user_input_1_1_first = {
            'entries': [
                {
                    'name': 'var1',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 11.0
                },
                {
                    'name': 'var2',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 'abc'
                }
            ]
        }
        self.set_step_input_generic(base_url=execution_url, elem_id=step_id_1_1,
            user_input=user_input_1_1_first)

        # Get user input
        user_input_actual = self.get_step_input_generic(base_url=execution_url, elem_id=step_id_1_1)


        self.assertDictEqual(user_input_1_1_first, user_input_actual)

        # Set result
        step_result_1_1_first = {
            'meta_data': {
                'test_conductor': 'Homer Simpson',
                'status': 'PASS',
                'error': {},
                'status_message': '',
                'time_completed': '2020-12-05T00:42:22.503Z',
                'time_started': '2020-12-05T00:42:11.832Z',
                'time_updated': '2020-12-05T00:42:22.503Z'
            },
            'results': {
                'entries': [
                    {
                        'name': 'var1',
                        'type': 'FLOAT',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 11.0,
                        'verification_status': 'PASS'
                    },
                    {
                        'name': 'var2',
                        'type': 'STRING',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 'abc',
                        'verification_status': 'PASS'
                    }
                ]
            }
        }
        self.set_step_output_generic(base_url=execution_url, elem_id=step_id_1_1,
            output=step_result_1_1_first, code_expected=200)

        # Get step output
        step_result_actual = self.get_step_output_generic(base_url=execution_url, elem_id=step_id_1_1)
 
        logger.debug('step_result_actual: %s', json.dumps(step_result_actual, indent=4))

        self.assertDictEqual(step_result_actual['results'], step_result_1_1_first['results'])

        #
        step = self.get_step(base_url=execution_url, step_type=StepTypes.MANUAL_INPUT, elem_id=step_id_1_1)
 
        logger.debug('step: %s', json.dumps(step, indent=4))


        ## set results one more time

        # First create a new run

        res_dict = self.create_new_run(execution_id=execution_id, elem_id=step_id_1_1)
        # logger.debug('create_new_run res_dict= %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['elem_id'], step_id_1_1)
        self.assertEqual(len(res_dict['run_records']), 1)
        self.assertNotEqual(res_dict['run_records'][0]['elem_id'], step_id_1_1)

        # Set user input
        user_input_1_1 = {
            'entries': [
                {
                    'name': 'var1',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 12.0
                },
                {
                    'name': 'var2',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 'abcd'
                }
            ]
        }
        self.set_step_input_generic(base_url=execution_url, elem_id=step_id_1_1,
            user_input=user_input_1_1)

        # Get user input
        user_input_actual = self.get_step_input_generic(base_url=execution_url, elem_id=step_id_1_1)


        self.assertDictEqual(user_input_1_1, user_input_actual)

        # Set result
        step_result_1_1 = {
            'meta_data': {
                'error': {},
                'status': 'PASS',
                'status_message': '',
                'test_conductor': 'Homer Simpson',
                'time_completed': '2020-12-05T00:43:22.503Z',
                'time_started': '2020-12-05T00:43:11.832Z',
                'time_updated': '2020-12-05T00:43:22.503Z'
            }, 
            'results': {
                'entries': [
                    {
                        'name': 'var1',
                        'type': 'FLOAT',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 12.0,
                        'verification_status': 'PASS'
                    },
                    {
                        'name': 'var2',
                        'type': 'STRING',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 'abcd',
                        'verification_status': 'PASS'
                    }
                ]
            }
        }
        self.set_step_output_generic(base_url=execution_url, elem_id=step_id_1_1,
            output=step_result_1_1, code_expected=200)

        # Get step output
        step_result_actual = self.get_step_output_generic(base_url=execution_url, elem_id=step_id_1_1)
        logger.debug('step_result_actual: %s', json.dumps(step_result_actual, indent=4))

        self.assertDictEqual(step_result_1_1['results'], step_result_actual['results'])

        # Get step with input and result
        step_actual = self.get_step_generic(execution_url, elem_id=step_id_1_1)


        self.assertDictEqual(step_actual['execution_user_input'], user_input_1_1)
        self.assertDictEqual(step_actual['execution']['results'], step_result_1_1['results'])

        # Set user input for step 1-2
        user_input_1_2 = {
            'entries': [
                {
                    'name': 'var1',
                    'type': 'FLOAT',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 21.0
                },
                {
                    'name': 'var2',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 'ABC'
                }
            ]
        }
        self.set_step_input_generic(base_url=execution_url, elem_id=step_id_1_2,
            user_input=user_input_1_2)

        # Get user input
        user_input_actual = self.get_step_input_generic(base_url=execution_url, elem_id=step_id_1_2)

        self.assertDictEqual(user_input_actual, user_input_1_2)

        # Set result for step 1-2
        step_result_1_2 = {
            'meta_data': {
                'test_conductor': 'Homer Simpson',
                'status': 'PASS',
                'time_completed': '2020-12-05T00:45:22.503Z',
                'time_started': '2020-12-05T00:45:11.832Z',
                'time_updated': '2020-12-05T00:45:22.503Z'
            },
            'results': {
                'entries': [
                    {
                        'name': 'var1',
                        'type': 'FLOAT',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 21.0,
                        'verification_status': 'PASS'
                    },
                    {
                        'name': 'var2',
                        'type': 'STRING',
                        'verify_on': 'VALUE',
                        'verification_condition': 'RECORD',
                        'verification_values': [],
                        'actual_value': 'ABC',
                        'verification_status': 'PASS'
                    }
                ]
            }
        }
        self.set_step_output_generic(base_url=execution_url, elem_id=step_id_1_2,
            output=step_result_1_2, code_expected=200)

        # Get step output
        step_result_actual = self.get_step_output_generic(base_url=execution_url, elem_id=step_id_1_2)

        self.assertDictEqual(step_result_actual['results'], step_result_1_2['results'])

        # check as run
        res_dict = self.get_as_run(execution_id)


        self.assertDictEqual(res_dict['children'][0]['children'][0]['execution_user_input'], user_input_1_1)
        self.assertDictEqual(res_dict['children'][0]['children'][0]['execution']['results'], step_result_1_1['results'])
        self.assertEqual(res_dict['children'][0]['children'][0]['executed'], True)

        self.assertDictEqual(res_dict['children'][0]['children'][1]['execution_user_input'], user_input_1_2)
        self.assertDictEqual(res_dict['children'][0]['children'][1]['execution']['results'], step_result_1_2['results'])
        self.assertEqual(res_dict['children'][0]['children'][1]['executed'], True)

        # check history
        res_dict = self.get_history(execution_id)


        self.assertEqual(len(res_dict), 3)

        # previous execution record is stored as a new element with a different elem_id
        # self.assertEqual(res_dict[0]['elem_id'], step_id_1_1)
        self.assertDictEqual(res_dict[0]['execution']['results'], step_result_1_1_first['results'])

        # previous execution record is stored as a new element with a different elem_id
        # self.assertEqual(res_dict[1]['elem_id'], step_id_1_1)
        self.assertDictEqual(res_dict[1]['execution']['results'], step_result_1_1['results'])

        self.assertEqual(res_dict[2]['elem_id'], step_id_1_2)
        self.assertDictEqual(res_dict[2]['execution']['results'], step_result_1_2['results'])

    def run_get_elements(self, execution_id):
        # Get elements
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        result = requests.get(url, headers=shared_dict['headers'])
        logger.debug('url=%s', result.url)
        self.assertEqual(result.status_code, 200)
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        logger.debug('x-total-count= %s', result.headers['x-total-count'])
        self.assertEqual(result.headers['x-total-count'], '8')
        self.assertEqual(len(elems), 8)
        self.assertEqual(elems[0]['number'], "1")
        self.assertEqual(elems[1]['number'], "1-1")
        self.assertEqual(elems[2]['number'], "1-2")
        self.assertEqual(elems[3]['number'], "2")
        self.assertEqual(elems[4]['number'], "3")
        self.assertEqual(elems[5]['number'], "3-1")
        self.assertEqual(elems[6]['number'], "3-2")
        self.assertEqual(elems[7]['number'], "3-3")

        # description filter
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'description': 'TIO'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(elems), 1)


        # Get steps
        url = shared_dict['host'] + '/executions/' + execution_id + '/steps'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        steps = json.loads(result.text)
        self.assertEqual(result.headers['x-total-count'], '5')
        self.assertEqual(len(steps), 5)


        for step in steps:
            self.assertEqual(step['elem_type'], 'STEP')

        # filters
        url = shared_dict['host'] + '/executions/' + execution_id + '/steps'
        params = {'offset': 1, 'limit': 2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        steps = json.loads(result.text)

        self.assertEqual(result.headers['x-total-count'], '5')
        self.assertEqual(len(steps), 2)

        for step in steps:
            self.assertEqual(step['elem_type'], 'STEP')

        # Get sections
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'elem_type': 'SECTION'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        sections = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '2')
        self.assertEqual(len(sections), 2)

        for section in sections:
            self.assertEqual(section['elem_type'], 'SECTION')

        # Get sections
        url = shared_dict['host'] + '/executions/' + execution_id + '/sections'
        result = requests.get(url, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        sections = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '2')
        self.assertEqual(len(sections), 2)

        for section in sections:
            self.assertEqual(section['elem_type'], 'SECTION')

        # Get paragraphs
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'elem_type': 'PARAGRAPH'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        paragraphs = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(paragraphs), 1)

        for paragraph in paragraphs:
            self.assertEqual(paragraph['elem_type'], 'PARAGRAPH')

        # Get paragraphs
        url = shared_dict['host'] + '/executions/' + execution_id + '/paragraphs'
        result = requests.get(url, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        paragraphs = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(paragraphs), 1)

        for paragraph in paragraphs:
            self.assertEqual(paragraph['elem_type'], 'PARAGRAPH')

    def run_get_elements2(self, execution_id):
        # Get elements
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        result = requests.get(url, headers=shared_dict['headers'])
        logger.debug('url=%s', result.url)
        self.assertEqual(result.status_code, 200)
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        logger.debug('x-total-count= %s', result.headers['x-total-count'])
        self.assertEqual(result.headers['x-total-count'], '7')
        self.assertEqual(len(elems), 7)
        self.assertEqual(elems[0]['number'], "1")
        self.assertEqual(elems[1]['number'], "1-1")
        self.assertEqual(elems[2]['number'], "1-2")
        self.assertEqual(elems[3]['number'], "2")
        self.assertEqual(elems[4]['number'], "3")
        self.assertEqual(elems[5]['number'], "3-1")
        self.assertEqual(elems[6]['number'], "3-2")

        # description filter
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'description': 'TIO'}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        elems = json.loads(result.text)
        logger.debug('elems= %s', json.dumps(elems, indent=4))
        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(elems), 1)


        # Get steps
        url = shared_dict['host'] + '/executions/' + execution_id + '/steps'
        result = requests.get(url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        steps = json.loads(result.text)
        self.assertEqual(result.headers['x-total-count'], '4')
        self.assertEqual(len(steps), 4)


        for step in steps:
            self.assertEqual(step['elem_type'], 'STEP')

        # filters
        url = shared_dict['host'] + '/executions/' + execution_id + '/steps'
        params = {'offset': 1, 'limit': 2}
        result = requests.get(url, params = params, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        steps = json.loads(result.text)

        self.assertEqual(result.headers['x-total-count'], '4')
        self.assertEqual(len(steps), 2)

        for step in steps:
            self.assertEqual(step['elem_type'], 'STEP')

        # Get sections
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'elem_type': 'SECTION'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        sections = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '2')
        self.assertEqual(len(sections), 2)

        for section in sections:
            self.assertEqual(section['elem_type'], 'SECTION')

        # Get sections
        url = shared_dict['host'] + '/executions/' + execution_id + '/sections'
        result = requests.get(url, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        sections = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '2')
        self.assertEqual(len(sections), 2)

        for section in sections:
            self.assertEqual(section['elem_type'], 'SECTION')

        # Get paragraphs
        url = shared_dict['host'] + '/executions/' + execution_id + '/elements'
        params = {'elem_type': 'PARAGRAPH'}
        result = requests.get(url, params=params, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        paragraphs = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(paragraphs), 1)

        for paragraph in paragraphs:
            self.assertEqual(paragraph['elem_type'], 'PARAGRAPH')

        # Get paragraphs
        url = shared_dict['host'] + '/executions/' + execution_id + '/paragraphs'
        result = requests.get(url, headers=shared_dict['headers'])
        #
        self.assertEqual(result.status_code, 200)
        paragraphs = json.loads(result.text)


        self.assertEqual(result.headers['x-total-count'], '1')
        self.assertEqual(len(paragraphs), 1)

        for paragraph in paragraphs:
            self.assertEqual(paragraph['elem_type'], 'PARAGRAPH')


    @unittest.skip("Run only to delete all executions.")
    def test_delete_executions(self):

        ## Get list of executions
        url = shared_dict['host'] + '/executions'
        result = requests.get(url,
            headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)



        for execution in res_dict:
            url = shared_dict['host'] + '/executions/' + execution['execution_id']

            result = requests.delete(url,
                headers=shared_dict['headers'])

            self.assertEqual(result.status_code, 204)

    def test_delete_execution(self):

        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        if False:
            self.delete_element(execution_url, section_id_1)
        if False:
            self.delete_element(execution_url, step_id_1_2)
        if False:
            res_dict = self.move_element(base_url=execution_url,
            elem_id=step_id_1_1, insert_after_id=section_id_3, level='CHILD')

        # Set user input
        execution_user_input = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 21.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }
        self.set_step_input_generic(base_url=execution_url, elem_id=step_id_1_1,
            user_input=execution_user_input)

        # Set result
        step_result = {
            'meta_data': {
                'test_conductor': 'Homer Simpson',
                'status': 'PASS'
            },
            'results': {
                'temperature': {
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 21.0,
                    'verification_status': 'PASS'
                },
                'humidity': {
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 41.0,
                    'verification_status': 'PASS'
                }
            }
        }
        self.set_step_output_generic(base_url=execution_url, elem_id=step_id_1_1,
            output=step_result, code_expected=200)

        # now delete the execution

        url = '{0}/executions/{1}'.format(shared_dict['host'], execution_id)

        result = requests.delete(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 204)

    def test_steps(self):
        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        url = '{0}/steps/{1}'.format(execution_url, step_id_1_1)
        result = requests.get(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], step_id_1_1)

        url = '{0}/steps/{1}'.format(execution_url, step_id_1_1)
        new_description = 'new description'
        step_dict = {'description': new_description}
        result = requests.patch(url,
            headers=shared_dict['headers'],
            data=json.dumps(step_dict))

        self.assertEqual(result.status_code, 200)

        url = '{0}/steps/{1}'.format(execution_url, step_id_1_1)
        result = requests.get(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], step_id_1_1)
        self.assertEqual(res_dict['description'], new_description)

        url = '{0}/elements/{1}'.format(execution_url, step_id_1_1)
        step_dict = {'description': new_description}
        result = requests.delete(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)

        self.assertEqual(len(res_dict['numbers']), 1)

    def test_sections(self):
        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        url = '{0}/sections/{1}'.format(execution_url, section_id_1)
        result = requests.get(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], section_id_1)

        url = '{0}/sections/{1}'.format(execution_url, section_id_1)
        new_description = 'new description'
        step_dict = {'description': new_description}
        result = requests.patch(url,
            headers=shared_dict['headers'],
            data=json.dumps(step_dict))

        self.assertEqual(result.status_code, 200)

        url = '{0}/sections/{1}'.format(execution_url, section_id_1)
        result = requests.get(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], section_id_1)
        self.assertEqual(res_dict['description'], new_description)

        url = '{0}/elements/{1}'.format(execution_url, section_id_1)
        step_dict = {'description': new_description}
        result = requests.delete(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)

        self.assertEqual(len(res_dict['numbers']), 5)

    def test_paragraphs(self):
        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']
        paragraph_id_2 = id_dict['paragraph_id_2']

        url = '{0}/paragraphs/{1}'.format(execution_url, paragraph_id_2)
        result = requests.get(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], paragraph_id_2)

        url = '{0}/paragraphs/{1}'.format(execution_url, paragraph_id_2)
        new_description = 'new description'
        step_dict = {'description': new_description}
        result = requests.patch(url,
            headers=shared_dict['headers'],
            data=json.dumps(step_dict))

        self.assertEqual(result.status_code, 200)

        url = '{0}/paragraphs/{1}'.format(execution_url, paragraph_id_2)
        result = requests.get(url,
            headers=shared_dict['headers'])


        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['elem_id'], paragraph_id_2)
        self.assertEqual(res_dict['description'], new_description)

        url = '{0}/elements/{1}'.format(execution_url, paragraph_id_2)
        logger.debug('delete url: %s', url)
        step_dict = {'description': new_description}
        result = requests.delete(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))

        self.assertEqual(len(res_dict['numbers']), 4)

    def test_comments(self):
        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        # Add comment to section
        content1 = 'This is the first comment for the section'
        res_dict = self.add_conversation(execution_url, section_id_1, {'type': 'DATA_REVIEW_COMMENT'})
        conversation_id_1 = res_dict['conversation_id']
        # should have an empty comment
        self.assertEqual(len(res_dict['comments']), 1)
        comment_1 = res_dict['comments'][0]
        comment_id_1 = comment_1['comment_id']
        time_updated_1 = comment_1['time_updated']
        self.assertEqual(comment_1['content'], '')
        self.assertEqual('type' in comment_1, False)
        self.assertTrue(len(comment_1['user_name']) > 0)        
        
        res_dict = self.update_comment(execution_url, section_id_1, conversation_id_1, comment_id_1, content1)
        self.assertEqual(res_dict['content'], content1)
        
        time.sleep(0.01)

        # update comment
        content1b = 'This is the first comment for the section and updated'

        res_dict = self.update_comment(execution_url, section_id_1, conversation_id_1, comment_id_1, content1b)

        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['content'], content1b)        
        time_updated_1b = res_dict['time_updated']      
        self.assertGreater(time_updated_1b, time_updated_1)   
        self.assertTrue(len(res_dict['user_name']) > 0)        

        # set it back
        res_dict = self.update_comment(execution_url, section_id_1, conversation_id_1, comment_id_1, content1)
        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['content'], content1)                   

        # check the section
        section_dict = self.get_section(execution_url, section_id_1)
        self.assertEqual(len(section_dict['conversations']), 1)
        self.assertEqual(len(section_dict['conversations'][0]['comments']), 1)
        self.assertEqual(section_dict['conversations'][0]['comments'][0]['content'], content1)

        # Add another comment to section
        content2 = 'This is the second comment for the section'
        res_dict = self.add_comment(execution_url, section_id_1, conversation_id_1, content2)
        comment_id_2 = res_dict['comment_id']
        self.assertEqual(res_dict['content'], content2)

        # check the section
        section_dict = self.get_section(execution_url, section_id_1)
        self.assertEqual(len(section_dict['conversations']), 1)
        self.assertEqual(len(section_dict['conversations'][0]['comments']), 2)        
        self.assertEqual(section_dict['conversations'][0]['comments'][0]['content'], content1)
        self.assertEqual(section_dict['conversations'][0]['comments'][1]['content'], content2)

        # get comments
        comments_dict = self.get_comments(execution_url, section_id_1, conversation_id_1)
        self.assertEqual(len(comments_dict), 2)
        self.assertEqual(comments_dict[0]['content'], content1)
        self.assertEqual(comments_dict[1]['content'], content2)

        # get comment
        comment1_dict = self.get_comment(execution_url, section_id_1, conversation_id_1, comment_id_1)
        self.assertEqual(comment1_dict['content'], content1)

        # get comment
        comment2_dict = self.get_comment(execution_url, section_id_1, conversation_id_1, comment_id_2)
        self.assertEqual(comment2_dict['content'], content2)

        # delete comment
        self.delete_comment(execution_url, section_id_1, conversation_id_1, comment_id_1)

        # delete a non-existing comment
        self.delete_comment(execution_url, 'not_an_elem_id', conversation_id_1, 'not_a_comment_id', 400)

        # delete a non-existing comment
        self.delete_comment(execution_url, section_id_1, conversation_id_1, 'not_a_comment_id', 400)

        # get comments
        comments_dict = self.get_comments(execution_url, section_id_1, conversation_id_1)
        logger.debug('comments_dict: %s', json.dumps(comments_dict, indent=4))
        self.assertEqual(len(comments_dict), 1)
        self.assertEqual(comments_dict[0]['content'], content2)
        
        # add another conversation
        content_2_1 = 'This is the first comment of the second conversation'
        res_dict = self.add_conversation(execution_url, section_id_1, {'type': 'DATA_REVIEW_COMMENT'})
        conversation_id_2 = res_dict['conversation_id']
        comment_2_1 = res_dict['comments'][0]
        comment_id_2_1 = comment_2_1['comment_id']        
         
        res_dict = self.update_comment(execution_url, section_id_1, conversation_id_2, comment_id_2_1, content_2_1)
        self.assertEqual(res_dict['content'], content_2_1)         
        
        # add another comment
        content_2_2 = 'This is the second comment of the second conversation'
        res_dict = self.add_comment(execution_url, section_id_1, conversation_id_2, content_2_2)
        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))
        comment_id_2_2 = res_dict['comment_id']
        self.assertEqual(res_dict['content'], content_2_2)
        
        # get conversations
        res_dict = self.get_conversations(execution_url, section_id_1)
        self.assertEqual(len(res_dict), 2)
        self.assertEqual(len(res_dict[1]['comments']), 2)
        self.assertEqual(res_dict[1]['comments'][0]['content'], content_2_1)
        self.assertEqual(res_dict[1]['comments'][1]['content'], content_2_2)
        
        # get conversation
        res_dict = self.get_conversation(execution_url, section_id_1, conversation_id_2)
        self.assertEqual(len(res_dict['comments']), 2)
        self.assertEqual(res_dict['comments'][0]['content'], content_2_1)
        self.assertEqual(res_dict['comments'][1]['content'], content_2_2)     
        self.assertEqual(res_dict['status'], 'UNRESOLVED') 
        self.assertEqual(res_dict['time_resolved'], '')
        self.assertEqual(res_dict['resolved_by'], '')
        
        # resolve conversation
        res_dict = self.update_conversation(execution_url, section_id_1, conversation_id_2, {'status': 'RESOLVED'})
        # check conversation
        res_dict = self.get_conversation(execution_url, section_id_1, conversation_id_2)
        self.assertEqual(len(res_dict['comments']), 2)
        self.assertEqual(res_dict['comments'][0]['content'], content_2_1)
        self.assertEqual(res_dict['comments'][1]['content'], content_2_2)     
        self.assertEqual(res_dict['status'], 'RESOLVED') 
        self.assertTrue(len(res_dict['time_resolved']) > 0)
        self.assertTrue(len(res_dict['resolved_by']) > 0) 
        
        # unresolve conversation
        res_dict = self.update_conversation(execution_url, section_id_1, conversation_id_2, {'status': 'UNRESOLVED'})
        # check conversation
        res_dict = self.get_conversation(execution_url, section_id_1, conversation_id_2)
        self.assertEqual(len(res_dict['comments']), 2)
        self.assertEqual(res_dict['comments'][0]['content'], content_2_1)
        self.assertEqual(res_dict['comments'][1]['content'], content_2_2)     
        self.assertEqual(res_dict['status'], 'UNRESOLVED') 
        self.assertEqual(res_dict['time_resolved'], '')
        self.assertEqual(res_dict['resolved_by'], '')
        
        # delete conversation
        res_dict = self.delete_conversation(execution_url, section_id_1, conversation_id_1)
        
        # check conversations
        res_dict = self.get_conversations(execution_url, section_id_1)
        self.assertEqual(len(res_dict), 1)
        self.assertEqual(len(res_dict[0]['comments']), 2)
        self.assertEqual(res_dict[0]['comments'][0]['content'], content_2_1)
        self.assertEqual(res_dict[0]['comments'][1]['content'], content_2_2)

    def test_comments_filter(self):
        
        id_dict = self.create_execution_example()
        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        paragraph_id_2 = id_dict['paragraph_id_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']
        step_id_3_3 = id_dict['step_id_3_3']
        
        outline_elems = self.get_execution_outline(execution_url)
        # logger.debug('outline_elems: %s', json.dumps(outline_elems, indent=4))
        self.assertEqual(len(outline_elems), 8)        
        self.assertEqual(outline_elems[0]['elem_id'], section_id_1)
        self.assertEqual(outline_elems[1]['elem_id'], step_id_1_1)
        self.assertEqual(outline_elems[2]['elem_id'], step_id_1_2)   
        self.assertEqual(outline_elems[3]['elem_id'], paragraph_id_2) 
        self.assertEqual(outline_elems[4]['elem_id'], section_id_3)
        self.assertEqual(outline_elems[5]['elem_id'], step_id_3_1)
        self.assertEqual(outline_elems[6]['elem_id'], step_id_3_2)
        self.assertEqual(outline_elems[7]['elem_id'], step_id_3_3)
        
        elements = self.get_elements(execution_url)
        # logger.debug('elements res_dict= %s', json.dumps(elements, indent=4))
        
        res_dict = self.add_conversation(execution_url, step_id_1_1, {'type': 'COMMENT'})
        res_dict = self.add_conversation(execution_url, section_id_3, {'type': 'COMMENT'})
        res_dict = self.add_conversation(execution_url, step_id_3_1, {'type': 'COMMENT'})
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], section_id_3)
        self.assertEqual(elements[2]['elem_id'], step_id_3_1)     
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'OFF'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(outline_elems), 8)        
        self.assertEqual(outline_elems[0]['elem_id'], section_id_1)
        self.assertEqual(outline_elems[1]['elem_id'], step_id_1_1)
        self.assertEqual(outline_elems[2]['elem_id'], step_id_1_2)   
        self.assertEqual(outline_elems[3]['elem_id'], paragraph_id_2) 
        self.assertEqual(outline_elems[4]['elem_id'], section_id_3)
        self.assertEqual(outline_elems[5]['elem_id'], step_id_3_1)
        self.assertEqual(outline_elems[6]['elem_id'], step_id_3_2)
        self.assertEqual(outline_elems[7]['elem_id'], step_id_3_3)             
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON', 'limit': 2})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], section_id_3)          
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON', 'offset': 1, 'limit': 2})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], section_id_3)
        self.assertEqual(elements[1]['elem_id'], step_id_3_1)    
        
        elements = self.get_elements(execution_url, params={'all_elements': 'ON', 'comment_filter': 'OFF'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(outline_elems), 8)        
        self.assertEqual(outline_elems[0]['elem_id'], section_id_1)
        self.assertEqual(outline_elems[1]['elem_id'], step_id_1_1)
        self.assertEqual(outline_elems[2]['elem_id'], step_id_1_2)   
        self.assertEqual(outline_elems[3]['elem_id'], paragraph_id_2) 
        self.assertEqual(outline_elems[4]['elem_id'], section_id_3)
        self.assertEqual(outline_elems[5]['elem_id'], step_id_3_1)
        self.assertEqual(outline_elems[6]['elem_id'], step_id_3_2)
        self.assertEqual(outline_elems[7]['elem_id'], step_id_3_3)
        
        elements = self.get_elements(execution_url, params={'all_elements': 'ON', 'comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(outline_elems), 8)        
        self.assertEqual(outline_elems[0]['elem_id'], section_id_1)
        self.assertEqual(outline_elems[1]['elem_id'], step_id_1_1)
        self.assertEqual(outline_elems[2]['elem_id'], step_id_1_2)   
        self.assertEqual(outline_elems[3]['elem_id'], paragraph_id_2) 
        self.assertEqual(outline_elems[4]['elem_id'], section_id_3)
        self.assertEqual(outline_elems[5]['elem_id'], step_id_3_1)
        self.assertEqual(outline_elems[6]['elem_id'], step_id_3_2)
        self.assertEqual(outline_elems[7]['elem_id'], step_id_3_3)           
        
        elements = self.get_elements(execution_url, params={'all_elements': 'ON', 'comment_filter': 'ON', 'limit': 2})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], section_id_1)
        self.assertEqual(elements[1]['elem_id'], step_id_1_1)
        
        elements = self.get_elements(execution_url, params={'all_elements': 'ON', 'comment_filter': 'ON', 'offset': 1, 'limit': 2})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], step_id_1_2)          
        
        # add AR comment  
        res_dict = self.add_conversation(execution_url, step_id_1_1, {'type': 'ACTIVITY_REPORT_COMMENT'})
        res_dict = self.add_conversation(execution_url, step_id_1_2, {'type': 'ACTIVITY_REPORT_COMMENT'})
        
        # add DR comment  
        res_dict = self.add_conversation(execution_url, section_id_1, {'type': 'DATA_REVIEW_COMMENT'})
        res_dict = self.add_conversation(execution_url, paragraph_id_2, {'type': 'DATA_REVIEW_COMMENT'})   
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], section_id_3)
        self.assertEqual(elements[2]['elem_id'], step_id_3_1)         
        
        elements = self.get_elements(execution_url, params={'ar_comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], step_id_1_2)
        
        elements = self.get_elements(execution_url, params={'dr_comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[0]['elem_id'], section_id_1)
        self.assertEqual(elements[1]['elem_id'], paragraph_id_2)
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON', 'ar_comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 4)
        self.assertEqual(elements[0]['elem_id'], step_id_1_1)
        self.assertEqual(elements[1]['elem_id'], step_id_1_2)
        self.assertEqual(elements[2]['elem_id'], section_id_3)
        self.assertEqual(elements[3]['elem_id'], step_id_3_1)
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON', 
            'ar_comment_filter': 'ON', 
            'dr_comment_filter': 'ON'})
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 6)
        self.assertEqual(elements[0]['elem_id'], section_id_1)
        self.assertEqual(elements[1]['elem_id'], step_id_1_1)
        self.assertEqual(elements[2]['elem_id'], step_id_1_2)
        self.assertEqual(elements[3]['elem_id'], paragraph_id_2)         
        self.assertEqual(elements[4]['elem_id'], section_id_3)
        self.assertEqual(elements[5]['elem_id'], step_id_3_1)  
        
        elements = self.get_elements(execution_url, params={'comment_filter': 'ON', 
            'ar_comment_filter': 'ON', 
            'dr_comment_filter': 'ON',
            'offset': 2,
            'limit': 3})        
        # logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[0]['elem_id'], step_id_1_2)
        self.assertEqual(elements[1]['elem_id'], paragraph_id_2)         
        self.assertEqual(elements[2]['elem_id'], section_id_3)           

        
    def test_files(self):
        id_dict = self.create_execution_example()

        execution_url = id_dict['execution_url']
        execution_id = id_dict['execution_id']
        section_id_1 = id_dict['section_id_1']
        step_id_1_1 = id_dict['step_id_1_1']
        step_id_1_2 = id_dict['step_id_1_2']
        section_id_3 = id_dict['section_id_3']
        step_id_3_1 = id_dict['step_id_3_1']
        step_id_3_2 = id_dict['step_id_3_2']

        # Add comment to section
        content1 = 'This is the first comment for the section'
        res_dict = self.add_conversation(execution_url, section_id_1, {'type': 'COMMENT'})
        conversation_id = res_dict['conversation_id']
        # should have an empty comment
        self.assertEqual(len(res_dict['comments']), 1)
        comment = res_dict['comments'][0]
        comment_id = comment['comment_id']
        time_updated_1 = comment['time_updated']     
        
        res_dict = self.update_comment(execution_url, section_id_1, conversation_id, comment_id, content1)
        self.assertEqual(res_dict['content'], content1)
        
        time.sleep(0.01)

        # Assume that the test is running from "tests" folder
        with open('rocket.png','rb') as file:         
            files = {'file_content': file}

            file_info_1 = self.add_elem_file(execution_url, section_id_1, files, "testfile")

            file.seek(0)
            file_info_2 = self.add_elem_file(execution_url, section_id_1, files)

            file.seek(0)
            file_info_3 = self.add_elem_file(execution_url, section_id_1, files)
            
            logger.debug('file_info_1: %s', json.dumps(file_info_1, indent=4))
            logger.debug('file_info_2: %s', json.dumps(file_info_2, indent=4))
            logger.debug('file_info_3: %s', json.dumps(file_info_3, indent=4))

            file_info = self.get_elem_file(execution_url, section_id_1, file_info_1['file_id'])
            self.assertEqual(file_info, file_info_1)

            url = '{0}/executions/{1}/elements/{2}/files'.format(shared_dict['host'], execution_id, section_id_1)
            result = requests.get(url,
                params = {'offset': 1, 'limit' : 2},
                headers=shared_dict['headers'])
            res_dict = json.loads(result.text)
            logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))
            self.assertEqual(int(result.headers['x-total-count']), 3)
            self.assertEqual(len(res_dict), 2)
            self.assertEqual(res_dict[0]['file_id'], file_info_2['file_id'])

            self.delete_elem_file(execution_url, section_id_1, file_info_1['file_id'], 204)
            self.delete_elem_file(execution_url, section_id_1, file_info_2['file_id'], 204)
            self.delete_elem_file(execution_url, section_id_1, file_info_3['file_id'], 204)

            file.seek(0)
            file_info_1 = self.add_exec_file(execution_id, files, "testfile") # section_id_1, execution_id, url, code_expected, name=""
            file.seek(0)
            file_info_2 = self.add_exec_file(execution_id, files)
            file.seek(0)
            file_info_3 = self.add_exec_file(execution_id, files)

            file_info = self.get_exec_file(execution_id, file_info_1['file_id'])
            self.assertEqual(file_info, file_info_1)

            url = '{0}/executions/{1}/files'.format(shared_dict['host'], execution_id)
            result = requests.get(url,
                params = {'offset': 1, 'limit' : 2},
                headers=shared_dict['headers'])
            res_dict = json.loads(result.text)
            self.assertEqual(int(result.headers['x-total-count']), 3)
            self.assertEqual(res_dict[0]['file_id'], file_info_2['file_id'])

            self.delete_exec_file(execution_id, file_info_1['file_id'], 204)
            self.delete_exec_file(execution_id, file_info_2['file_id'], 204)
            self.delete_exec_file(execution_id, file_info_3['file_id'], 204)

            file.seek(0)
            logger.debug(f'conversation_id : {conversation_id} comment_id: {comment_id}')
            file_info_1 = self.add_comment_file(execution_url, section_id_1, conversation_id, comment_id, files, "testfile") # section_id_1, execution_id, url, code_expected, name=""
            file.seek(0)
            file_info_2 = self.add_comment_file(execution_url, section_id_1, conversation_id, comment_id, files)
            file.seek(0)
            file_info_3 = self.add_comment_file(execution_url, section_id_1, conversation_id, comment_id, files)

            file_info = self.get_comment_file(execution_url, section_id_1, conversation_id, comment_id, file_info_1['file_id'])
            self.assertEqual(file_info, file_info_1)

            url = '{0}/executions/{1}/elements/{2}/conversations/{3}/comments/{4}/files'.format(shared_dict['host'],
                execution_id, section_id_1, conversation_id, comment_id)
            result = requests.get(url,
                params = {'offset': 1, 'limit' : 2},
                headers=shared_dict['headers'])
            res_dict = json.loads(result.text)
            self.assertEqual(int(result.headers['x-total-count']), 3)
            self.assertEqual(len(res_dict), 2)
            self.assertEqual(res_dict[0]['file_id'], file_info_2['file_id'])

            self.delete_comment_file(execution_url, section_id_1, conversation_id, comment_id, file_info_1['file_id'], 204)
            # self.assertEqual(os.path.isfile(file_info_1['url']), False)

            self.delete_comment_file(execution_url, section_id_1, conversation_id, comment_id, file_info_2['file_id'], 204)
            # self.assertEqual(os.path.isfile(file_info_2['url']), False)

            self.delete_comment_file(execution_url, section_id_1, conversation_id, comment_id, file_info_3['file_id'], 204)
            # self.assertEqual(os.path.isfile(file_info_3['url']), False)

            self.close_execution(execution_id)        

    def create_execution_example_using_core(self):
        id_dict = {}

        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)


        ## Check execution
        execution_id = res_dict['execution_id']
        id_dict['execution_id'] = execution_id
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        id_dict['execution_url'] = execution_url

        time_started_str = res_dict['time_started']
        time_started = parser.parse(time_started_str)
        time_now_utc = datetime.now(dateutil.tz.tzutc())



        time_delta = time_started - time_now_utc if time_started > time_now_utc else time_now_utc - time_started



        self.assertEqual(res_dict['venue_id'], venue_id)
        self.assertEqual(res_dict['description'], description)

        #self.assertLess(math.fabs(time_delta.seconds)+24*3600*math.fabs(time_delta.days), 50910.0)
        self.assertEqual(res_dict['venue_name'], venue_name)
        # self.assertEqual(res_dict['url'], execution_url)

        result = requests.get(execution_url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)
        self.assertEqual(res_dict['venue_id'], venue_id)
        self.assertEqual(res_dict['description'], description)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')

        section_id_1 = res_dict['elem']['elem_id']
        id_dict['section_id_1'] = section_id_1
        self.assertEqual(res_dict['elem']['number'], '1')
        self.assertEqual(len(res_dict['numbers']), 1)
        self.assertEqual(len(res_dict['elem_ids']), 1)

        # update
        self.update_section(execution_url, section_id_1, {'title': 'Section 1'})

        ## Add step 1-1

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.MANUAL_INPUT,
            insert_after_id=section_id_1,
            level='CHILD')

        logger.debug('new step res_dict= %s', json.dumps(res_dict, indent=4))

        step_id_1_1 = res_dict['elem']['elem_id']
        id_dict['step_id_1_1'] = step_id_1_1
        self.assertEqual(res_dict['elem']['number'], '1-1')

        self.assertEqual(res_dict['elem']['execution']['meta_data']['status'], 'NONE')
        self.assertEqual(len(res_dict['elem']['execution']['results']['entries']), 1)

        # check the step
        res_dict = self.get_step(execution_url, StepTypes.MANUAL_INPUT, step_id_1_1)
        self.assertEqual(res_dict['elem_id'], step_id_1_1)

        # check the steps
        res_dict = self.get_steps(execution_url, StepTypes.MANUAL_INPUT)
        self.assertEqual(len(res_dict), 1)

        # update
        self.update_step(execution_url, StepTypes.MANUAL_INPUT, step_id_1_1, {'title': 'Step 1-1'})

        ## Add step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.VENUE_CONFIG_MANUAL,
            insert_after_id=step_id_1_1,
            level='SIBLING')


        step_id_1_2 = res_dict['elem']['elem_id']
        id_dict['step_id_1_2'] = step_id_1_2
        self.assertEqual(res_dict['elem']['number'], '1-2')

        # check the step
        res_dict = self.get_step(execution_url, StepTypes.VENUE_CONFIG_MANUAL, step_id_1_2)
        self.assertEqual(res_dict['elem_id'], step_id_1_2)

        # check the steps
        res_dict = self.get_steps(execution_url, StepTypes.VENUE_CONFIG_MANUAL)
        self.assertEqual(len(res_dict), 1)

        # update
        self.update_step(execution_url, StepTypes.VENUE_CONFIG_MANUAL, step_id_1_2, {'title': 'Step 1-2'})

        ## Add section 3
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 3')


        section_id_3 = res_dict['elem']['elem_id']
        id_dict['section_id_3'] = section_id_3
        self.assertEqual(res_dict['elem']['number'], '2')
        # update
        self.update_section(execution_url, section_id_3, {'title': 'Section 3'})

        ## Add step 3-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.GDS_MANUAL,
            insert_after_id=section_id_3,
            level='CHILD')
        step_id_3_1 = res_dict['elem']['elem_id']
        id_dict['step_id_3_1'] = step_id_3_1


        self.assertEqual(res_dict['elem']['number'], '2-1')

        # check the step
        res_dict = self.get_step(execution_url, StepTypes.GDS_MANUAL, step_id_3_1)
        self.assertEqual(res_dict['elem_id'], step_id_3_1)

        # check the steps
        res_dict = self.get_steps(execution_url, StepTypes.GDS_MANUAL)
        self.assertEqual(len(res_dict), 1)

        # update it
        self.update_step(execution_url, StepTypes.GDS_MANUAL, step_id_3_1, {'title': 'Step 3-1'})

        ## Add step 3-2

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_3_1,
            level='SIBLING')

        step_id_3_2 = res_dict['elem']['elem_id']
        id_dict['step_id_3_2'] = step_id_3_2
        self.assertEqual(res_dict['elem']['number'], '2-2')

        # check the step
        res_dict = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_3_2)
        self.assertEqual(res_dict['elem_id'], step_id_3_2)

        # check the steps
        res_dict = self.get_steps(execution_url, StepTypes.ENVIRONMENT_MANUAL)
        self.assertEqual(len(res_dict), 1)

        # update
        self.update_step(execution_url,
            StepTypes.ENVIRONMENT_MANUAL,
            step_id_3_2,
            {'title': 'Step 3-2'}
        )

        ## add paragraph
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Paragraph Section 2')

        paragraph_id_2 = res_dict['elem']['elem_id']
        id_dict['paragraph_id_2'] = paragraph_id_2
        self.assertEqual(res_dict['elem']['number'], '2')

        return id_dict

    def create_execution_example(self):
        id_dict = {}

        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)


        ## Check execution
        execution_id = res_dict['execution_id']
        id_dict['execution_id'] = execution_id
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        id_dict['execution_url'] = execution_url

        time_started_str = res_dict['time_started']
        time_started = parser.parse(time_started_str)
        time_now_utc = datetime.now(dateutil.tz.tzutc())



        time_delta = time_started - time_now_utc if time_started > time_now_utc else time_now_utc - time_started



        self.assertEqual(res_dict['venue_id'], venue_id)
        self.assertEqual(res_dict['description'], description)

        #self.assertLess(math.fabs(time_delta.seconds)+24*3600*math.fabs(time_delta.days), 50910.0)
        self.assertEqual(res_dict['venue_name'], venue_name)
        # self.assertEqual(res_dict['url'], execution_url)

        result = requests.get(execution_url, headers=shared_dict['headers'])
        self.assertEqual(result.status_code, 200)
        res_dict = json.loads(result.text)

        self.assertEqual(res_dict['venue_id'], venue_id)
        self.assertEqual(res_dict['description'], description)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')


        section_id_1 = res_dict['elem']['elem_id']
        id_dict['section_id_1'] = section_id_1
        self.assertEqual(res_dict['elem']['parent_id'], '')
        self.assertEqual(res_dict['elem']['number'], '1')

        ## Add step 1-1
        notices = [
            {
                'category': 'TESTBED_WARNING',
                'message': 'This is a warning for test bed'
            },
            {
                "category": "PERSONNEL_CAUTION",
                "message": "This is a caution for personnel"
            }
        ]

        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=section_id_1,
            level='CHILD',
            title='Step 1-1',
            guard='',
            variable_name='manual_input_1_1_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=notices)


        step_id_1_1 = res_dict['elem']['elem_id']
        id_dict['step_id_1_1'] = step_id_1_1
        self.assertEqual(res_dict['elem']['parent_id'], section_id_1)
        self.assertEqual(res_dict['elem']['number'], '1-1')

        ## Add step 1-2
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_1_1,
            level='SIBLING',
            title='Step 1-2',
            guard='',
            variable_name='manual_input_1_2_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])


        step_id_1_2 = res_dict['elem']['elem_id']
        id_dict['step_id_1_2'] = step_id_1_2
        self.assertEqual(res_dict['elem']['parent_id'], section_id_1)
        self.assertEqual(res_dict['elem']['number'], '1-2')

        ## Add section 3
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 3')


        section_id_3 = res_dict['elem']['elem_id']
        id_dict['section_id_3'] = section_id_3
        self.assertEqual(res_dict['elem']['parent_id'], '')
        self.assertEqual(res_dict['elem']['number'], '2')

        ## Add step 3-1
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=section_id_3,
            level='CHILD',
            title='Step 3-1',
            guard='',
            variable_name='manual_input_3_1_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])
        step_id_3_1 = res_dict['elem']['elem_id']
        id_dict['step_id_3_1'] = step_id_3_1

        self.assertEqual(res_dict['elem']['parent_id'], section_id_3)
        self.assertEqual(res_dict['elem']['number'], '2-1')

        ## Add step 3-2
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_3_1,
            level='SIBLING',
            title='Step 3-2',
            guard='',
            variable_name='manual_input_3_2_var',
            code_name='manual_input_step.run',
            code_commit='commit-hash-3dfaea',
            code_release='1.0',
            notices=[])


        step_id_3_2 = res_dict['elem']['elem_id']
        id_dict['step_id_3_2'] = step_id_3_2
        self.assertEqual(res_dict['elem']['parent_id'], section_id_3)
        self.assertEqual(res_dict['elem']['number'], '2-2')
        self.assertEqual(len(res_dict['numbers']), 1)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], step_id_3_2)  
        self.assertEqual(res_dict['numbers'][0]['number'], '2-2')           
        self.assertEqual(len(res_dict['elem_ids']), 6)
        self.assertEqual(res_dict['elem_ids'][0], section_id_1)
        self.assertEqual(res_dict['elem_ids'][1], step_id_1_1)
        self.assertEqual(res_dict['elem_ids'][2], step_id_1_2)
        self.assertEqual(res_dict['elem_ids'][3], section_id_3)
        self.assertEqual(res_dict['elem_ids'][4], step_id_3_1)
        self.assertEqual(res_dict['elem_ids'][5], step_id_3_2)        

        ## Add step 3-3
        res_dict = self.add_step_generic(base_url=execution_url,
            step_type = StepTypes.VERIFICATION_ITEM,
            insert_after_id=step_id_3_2,
            level='SIBLING',
            title='Step 3-3',
            guard='',
            variable_name='',
            code_name='',
            code_commit='',
            code_release='',
            notices=[])
        step_id_3_3 = res_dict['elem']['elem_id']
        id_dict['step_id_3_3'] = step_id_3_3
        self.assertEqual(res_dict['elem']['parent_id'], section_id_3)
        self.assertEqual(res_dict['elem']['number'], '2-3')


        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Paragraph Section 2')

        paragraph_id_2 = res_dict['elem']['elem_id']
        id_dict['paragraph_id_2'] = paragraph_id_2
        self.assertEqual(res_dict['elem']['parent_id'], '')
        self.assertEqual(res_dict['elem']['number'], '2')
        self.assertEqual(len(res_dict['numbers']), 5)
        self.assertEqual(res_dict['numbers'][0]['elem_id'], paragraph_id_2)  
        self.assertEqual(res_dict['numbers'][0]['number'], '2')           
        self.assertEqual(len(res_dict['elem_ids']), 8)
        self.assertEqual(res_dict['elem_ids'][0], section_id_1)
        self.assertEqual(res_dict['elem_ids'][1], step_id_1_1)
        self.assertEqual(res_dict['elem_ids'][2], step_id_1_2)
        self.assertEqual(res_dict['elem_ids'][3], paragraph_id_2)
        self.assertEqual(res_dict['elem_ids'][4], section_id_3)
        self.assertEqual(res_dict['elem_ids'][5], step_id_3_1)
        self.assertEqual(res_dict['elem_ids'][6], step_id_3_2)
        self.assertEqual(res_dict['elem_ids'][7], step_id_3_3)

        return id_dict

    #### Execution status TESTS

    def test_set_execution_status(self):

        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution to set its status'
        res_dict = self.create_execution(venue_id, description)


        execution_id = res_dict['execution_id']

        ## get status
        url = shared_dict['host'] + '/executions/' + execution_id + '/status'

        result = requests.get(url,
            headers=shared_dict['headers'])
        res_dict = json.loads(result.text)


        self.assertEqual(result.status_code, 200)
        self.assertEqual(res_dict['status'], 'IDLE')

        ## set status
        status_dict = {'status': 'CLOSED'}
        result = requests.post(url,
            headers=shared_dict['headers'],
            data=json.dumps(status_dict))


        self.assertEqual(result.status_code, 200)

        ## get status again
        result = requests.get(url,
            headers=shared_dict['headers'])
        res_dict = json.loads(result.text)


        self.assertEqual(res_dict['status'], 'CLOSED')
        self.assertEqual(result.status_code, 200)

    def create_procedure_section_example(self):
        rand_1 = random_string()
        title_1 = 'title_' + rand_1
        procedure_dict = self.create_procedure(title_1, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_title = procedure_dict['title']        
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        # Add section
        res = self.add_section(base_url=procedure_url,
            insert_after_id=-1,
            level='CHILD',
            title='Section 1'
            )

        section_1 = res['elem']
        section_1_id = section_1['elem_id']

        res = self.add_section(base_url=procedure_url,
            insert_after_id=section_1_id,
            level='SIBLING',
            title='Section 2'
            )

        section_2 = res['elem']
        section_2_id = section_2['elem_id']

        # add paragraph
        res = self.add_paragraph(base_url=procedure_url,
            insert_after_id=section_1_id,
            level='CHILD',
            title='Paragraph 1-1'
            )

        paragraph_1_1 = res['elem']
        paragraph_1_1_id = paragraph_1_1['elem_id']

        # add steps to section 1
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=paragraph_1_1_id,
            level='SIBLING'
            )
        step_1_2 = res['elem']
        step_1_2_id = step_1_2['elem_id']
        logger.debug('res= %s', json.dumps(res, indent=4))

        self.update_step(procedure_url, StepTypes.WAIT, step_1_2_id, {'title': 'Step 1-2'})

        user_input_0 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }
        self.set_step_input(procedure_url, StepTypes.WAIT, step_1_2_id, user_input_0)

        #
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_1_2_id,
            level='SIBLING'
            )
        step_1_3 = res['elem']
        step_1_3_id = step_1_3['elem_id']
        self.update_step(procedure_url, StepTypes.WAIT, step_1_3_id, {'title': 'Step 1-3'})
        self.set_step_input(procedure_url, StepTypes.WAIT, step_1_3_id, user_input_0)

        # add steps to section 2
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_2_id,
            level='CHILD'
            )

        step_2_1 = res['elem']
        step_2_1_id = step_2_1['elem_id']
        self.update_step(procedure_url, StepTypes.WAIT, step_2_1_id, {'title': 'Step 2-1'})
        self.set_step_input(procedure_url, StepTypes.WAIT, step_2_1_id, user_input_0)

        #
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_2_1_id,
            level='SIBLING'
            )

        step_2_2 = res['elem']
        step_2_2_id = step_2_2['elem_id']
        self.update_step(procedure_url, StepTypes.WAIT, step_2_2_id, {'title': 'Step 2-2'})
        self.set_step_input(procedure_url, StepTypes.WAIT, step_2_2_id, user_input_0)

        # add version 1
        version_dict = self.create_procedure_version(procedure_id, 'First version')
        version_1_1 = version_dict['version']
        self.assertEqual(version_1_1, 1)

        # check structure
        procedure_dict = self.get_version_structure(procedure_id, version_1_1)
        logger.debug('procedure_dict= %s', json.dumps(procedure_dict, indent=4))

        self.assertEqual(procedure_dict['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(procedure_dict['children'][0]['children'][1]['authoring_user_input']['wait_type'], 'DURATION')

        # add a comment to a step
        procedure_version_url = '{0}/versions/1'.format(procedure_url)
        version_1_step_1_2_id = procedure_dict['children'][0]['children'][1]['elem_id']
        res_dict = self.add_conversation(procedure_version_url, version_1_step_1_2_id, {'type': 'COMMENT'})     
        conversation_id = res_dict['conversation_id']
        comment = res_dict['comments'][0]
        comment_id = comment['comment_id']          
        
        content = 'This is the first comment for the step'        
        res_dict = self.update_comment(procedure_version_url, version_1_step_1_2_id, conversation_id, comment_id, content)
        logger.debug('res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['content'], content)         

        ### now add more elements and create version 2
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_2_2_id,
            level='SIBLING'
            )
        self.update_step(procedure_url, StepTypes.WAIT, res['elem']['elem_id'], {'title': 'Step 2-3'})
        self.set_step_input(procedure_url, StepTypes.WAIT, res['elem']['elem_id'], user_input_0) 

        step_2_3 = res['elem']
        step_2_3_id = step_2_2['elem_id']

        # add version 2
        version_dict = self.create_procedure_version(procedure_id, 'Second version')
        version_1_2 = version_dict['version']
        self.assertEqual(version_1_2, 2)        

        return procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2



    def test_procedure_sections(self):

        rand = random_string()
        title = 'title_' + rand
        procedure_dict = self.create_procedure(title, 'Test procedure')
        procedure_id_1 = procedure_dict['procedure_id']

        rand = random_string()
        description = 'description_' + rand
        version_dict_1 = self.create_procedure_version(procedure_id_1, description)
        self.assertEqual(version_dict_1['version'], 1)

        rand = random_string()
        title = 'title_' + rand
        procedure_dict = self.create_procedure(title, 'Test procedure')
        procedure_id_2 = procedure_dict['procedure_id']

        rand = random_string()
        description = 'description_' + rand
        version_dict_2 = self.create_procedure_version(procedure_id_2, description)
        self.assertEqual(version_dict_2['version'], 1)

        description4 = 'My execution is dope'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        execution_dict = self.create_execution(venue_id, description4)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data_1 = {"reference_procedure_id" : procedure_id_1, "reference_procedure_version" : version_dict_1['version'], 'description': "this is a description", 'title': 'this is a section title'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data_1)

        procedure_section_1_id = res['elem']['elem_id']
        procedure_section_1 = self.get_procedure_section(execution_url, procedure_section_1_id)

        self.assertEqual(procedure_section_1['title'], procedure_section_data_1['title'])


        procedure_section_data_2 = {"reference_procedure_id" : procedure_id_2, "reference_procedure_version" : version_dict_2['version'], 'description': "this is a description", 'title': 'this is a section title'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=procedure_section_1_id,
            level='SIBLING',
            procedure_section=procedure_section_data_2)

        execution_url = shared_dict['host'] + '/executions/' + execution_id
        procedure_sections = self.get_procedure_sections(execution_url)
        self.assertEqual(len(procedure_sections), 2)


        procedure_section_update = {'description': "this is a NEW description"}
        self.update_procedure_section(execution_url, procedure_section_1_id, procedure_section_update)

        procedure_section_1 = self.get_procedure_section(execution_url, procedure_section_1_id)
        self.assertEqual(procedure_section_1['title'], procedure_section_data_1['title'])
        self.assertEqual(procedure_section_1['description'], procedure_section_update['description'])

        self.delete_element(execution_url, procedure_section_1_id)

        procedure_sections = self.get_procedure_sections(execution_url)
        self.assertEqual(len(procedure_sections), 1)

    def create_procedure_example(self):

        id_dict = {}

        rand_1 = random_string()
        procedure_title = 'title_' + rand_1
        procedure_dict = self.create_procedure(procedure_title, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        # Add section
        res = self.add_section(base_url=procedure_url,
            insert_after_id=-1,
            level='CHILD',
            title='Section 1'
            )

        section_1 = res['elem']
        section_1_id = section_1['elem_id']

        res = self.add_section(base_url=procedure_url,
            insert_after_id=section_1_id,
            level='SIBLING',
            title='Section 2'
            )

        section_2 = res['elem']
        section_2_id = section_2['elem_id']

        # add paragraph
        res = self.add_paragraph(base_url=procedure_url,
            insert_after_id=section_1_id,
            level='CHILD',
            title='Paragraph 1-1'
            )

        paragraph_1_1 = res['elem']
        paragraph_1_1_id = paragraph_1_1['elem_id']

        # add steps to section 1
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=paragraph_1_1_id,
            level='SIBLING'
            )
        step_1_2 = res['elem']
        step_1_2_id = step_1_2['elem_id']
        logger.debug('res= %s', json.dumps(res, indent=4))

        self.update_step(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_1_2_id, {'title': 'Step 1-2'})

        authoring_user_input = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': []
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': []
            }
        }
        self.set_step_input(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_1_2_id, authoring_user_input)

        #
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_1_2_id,
            level='SIBLING'
            )
        step_1_3 = res['elem']
        step_1_3_id = step_1_3['elem_id']
        self.update_step(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_1_3_id, {'title': 'Step 1-3'})


        # add steps to section 2
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_2_id,
            level='CHILD'
            )

        step_2_1 = res['elem']
        step_2_1_id = step_2_1['elem_id']
        self.update_step(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_2_1_id, {'title': 'Step 2-1'})

        #
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_2_1_id,
            level='SIBLING'
            )

        step_2_2 = res['elem']
        step_2_2_id = step_2_2['elem_id']
        self.update_step(procedure_url, StepTypes.ENVIRONMENT_MANUAL, step_2_2_id, {'title': 'Step 2-2'})

        # add version 1
        version_description = 'First version'
        version_dict = self.create_procedure_version(procedure_id, version_description)
        version_1_1 = version_dict['version']
        self.assertEqual(version_1_1, 1)

        # check structure
        procedure_dict = self.get_version_structure(procedure_id, version_1_1)
        logger.debug('procedure_dict= %s', json.dumps(procedure_dict, indent=4))

        self.assertEqual(procedure_dict['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(procedure_dict['children'][0]['children'][1]['authoring_user_input']['temperature']['verification_condition'], 'RECORD')
        self.assertTrue(len(procedure_dict['children'][0]['children'][1]['execution_user_input']) > 0)

        # return version 0 so that it can be used as a target of copy
        id_dict = {
            'procedure_url': procedure_url,
            'procedure_title': procedure_title,            
            'procedure_id': procedure_id,
            'version': 0,
            'version_description': version_description,
            'section_1_id': section_1_id,
            'paragraph_1_1_id': paragraph_1_1_id,
            'step_1_2_id': step_1_2_id,
            'step_1_3_id': step_1_3_id,
            'section_2_id': section_2_id,
            'step_2_1_id': step_2_1_id,
            'step_2_2_id': step_2_2_id
        }

        return id_dict 

    def test_procedure_section(self):
        self.check_procedure_section(run_auto=False)
        self.check_procedure_section(run_auto=True)

    def check_procedure_section(self, run_auto=False):    

        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        # venue_id = '233a0784-0b72-4cac-99aa-be7d2836803d'
        # venue_name = 'HK Venue 3'

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'callable': False,
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)

        logger.debug('procedure_section_input= %s', json.dumps(procedure_section_input, indent=4))
        logger.debug('user_input= %s', json.dumps(user_input, indent=4))

        self.assertDictEqual(procedure_section_input, user_input)

        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))
        for proc_section_elem in proc_section_elems:
            self.assertEqual(len(proc_section_elem['conversations']), 0)        

        self.assertEqual(proc_section_elems[3]['title'], 'Step 1-2')
        self.assertEqual(proc_section_elems[3]['number'], '1-2')
        self.assertEqual(proc_section_elems[3]['authoring_user_input']['wait_type'], 'DURATION')
        self.assertEqual(proc_section_elems[3]['execution_user_input']['wait_type'], 'DURATION')
        self.assertEqual(proc_section_elems[7]['title'], 'Step 2-2')
        self.assertEqual(proc_section_elems[7]['number'], '2-2')

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(as_run_dict['children'][0]['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['execution_user_input']['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['authoring_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['execution_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')

        # add a paragraph to procedure section
        proc_section_secion_1_id = as_run_dict['children'][0]['children'][0]['elem_id']
        logger.debug('proc_section_secion_1_id= %s', proc_section_secion_1_id)

        proc_section_step_1_2_id = as_run_dict['children'][0]['children'][0]['children'][1]['elem_id']
        logger.debug('proc_section_step_1_2_id= %s', proc_section_step_1_2_id)

        res = self.add_paragraph(base_url=execution_url,
            insert_after_id=proc_section_step_1_2_id,
            level='SIBLING',
            title='Paragraph 1-2.1 in Procedure Section')
        logger.debug('res= %s', json.dumps(res, indent=4))

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))        

        proc_section_paragraph_1_2__1 = res['elem']
        numbers = res['numbers']
        proc_section_paragraph_1_2__1_id = proc_section_paragraph_1_2__1['elem_id']

        self.assertEqual(len(numbers), 1)
        self.assertEqual(proc_section_paragraph_1_2__1['number'], '1-2.1') 

        # add steps to procedure section
        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=proc_section_paragraph_1_2__1_id,
            level='SIBLING')
        logger.debug('res= %s', json.dumps(res, indent=4))
        self.update_step(execution_url, StepTypes.WAIT, res['elem']['elem_id'], {'title': 'Step 1-2.3'})
        self.set_step_input(execution_url, StepTypes.WAIT, res['elem']['elem_id'], user_input_0)

        step_1_2__3 = res['elem']
        numbers = res['numbers']
        self.assertEqual(len(numbers), 1)
        self.assertEqual(step_1_2__3['number'], '1-2.2')
        step_1_2__3_id = step_1_2__3['elem_id']

        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=proc_section_paragraph_1_2__1_id,
            level='SIBLING')
        logger.debug('res= %s', json.dumps(res, indent=4))
        self.update_step(execution_url, StepTypes.WAIT, res['elem']['elem_id'], {'title': 'Step 1-2.2'})
        self.set_step_input(execution_url, StepTypes.WAIT, res['elem']['elem_id'], user_input_0)

        step_1_2__2 = res['elem']
        numbers = res['numbers']
        self.assertEqual(len(numbers), 2)
        self.assertEqual(step_1_2__2['number'], '1-2.2')
        step_1_2__2_id = step_1_2__2['elem_id']

        #
        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))

        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['title'], 'Section 1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['number'], "1-1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['title'], 'Paragraph 1-1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['number'], "1-2.1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['title'], 'Paragraph 1-2.1 in Procedure Section')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['number'], '1-2.2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['title'], 'Step 1-2.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['number'], '1-2.3')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['title'], 'Step 1-2.3')

        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')

        # add step as the first element of a section
        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=proc_section_secion_1_id,
            level='CHILD')
        logger.debug('res Step 1-0.1= %s', json.dumps(res, indent=4))
        self.update_step(execution_url, StepTypes.WAIT, res['elem']['elem_id'], {'title': 'Step 1-0.1'}) 

        step_1_0__1 = res['elem']
        numbers = res['numbers']
        self.assertEqual(len(numbers), 1)
        self.assertEqual(step_1_0__1['number'], '1-0.1')
        step_1_0__1_id = step_1_0__1['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_1_0__1_id, user_input_0)        

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['title'], 'Section 1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['number'], '1-0.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['title'], 'Step 1-0.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], "1-1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Paragraph 1-1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['title'], 'Step 1-2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['number'], "1-2.1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['title'], 'Paragraph 1-2.1 in Procedure Section')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['number'], '1-2.2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['title'], 'Step 1-2.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['number'], '1-2.3')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['title'], 'Step 1-2.3')

        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')

        # add a section
        res = self.add_section(base_url=execution_url,
            insert_after_id=proc_section_step_1_2_id,
            level='SIBLING',
            title='Section 1-2.1')

        logger.debug('res Section 1-2.1= %s', json.dumps(res, indent=4))
        proc_section_section_1_2__1_id = res['elem']['elem_id']
        self.assertEqual(len(res['numbers']), 4)

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['title'], 'Section 1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['number'], '1-0.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['title'], 'Step 1-0.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], "1-1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Paragraph 1-1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['title'], 'Step 1-2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['number'], '1-2.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['title'], 'Section 1-2.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['number'], "1-2.2")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['title'], 'Paragraph 1-2.1 in Procedure Section')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['number'], '1-2.3')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['title'], 'Step 1-2.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['number'], '1-2.4')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['title'], 'Step 1-2.3')

        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')

        # add steps to the section
        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=proc_section_section_1_2__1_id,
            level='CHILD')
        logger.debug('res Step 1-2.1.1= %s', json.dumps(res, indent=4))
        proc_section_step_1_2__1__1_id = res['elem']['elem_id']
        self.assertEqual(len(res['numbers']), 1)
        self.assertEqual(res['numbers'][0]['elem_id'], proc_section_step_1_2__1__1_id)
        self.update_step(execution_url, StepTypes.MANUAL_INPUT, proc_section_step_1_2__1__1_id, {'title': 'Step 1-2.1.1'})
        self.set_step_input(execution_url, StepTypes.WAIT, proc_section_step_1_2__1__1_id, user_input_0)  

        res = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=proc_section_step_1_2__1__1_id,
            level='SIBLING')
        logger.debug('res Step 1-2.1.2= %s', json.dumps(res, indent=4))
        proc_section_step_1_2__1__2_id = res['elem']['elem_id']
        self.assertEqual(len(res['numbers']), 1)
        self.assertEqual(res['numbers'][0]['elem_id'], proc_section_step_1_2__1__2_id)

        self.update_step(execution_url, StepTypes.WAIT, proc_section_step_1_2__1__2_id, {'title': 'Step 1-2.1.2'})
        self.set_step_input(execution_url, StepTypes.WAIT, proc_section_step_1_2__1__2_id, user_input_0) 

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['title'], 'Section 1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['number'], '1-0.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['title'], 'Step 1-0.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], "1-1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Paragraph 1-1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['title'], 'Step 1-2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['number'], '1-2.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['title'], 'Section 1-2.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][0]['number'], '1-2.1.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][0]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][0]['title'], 'Step 1-2.1.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][1]['number'], '1-2.1.2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['children'][1]['title'], 'Step 1-2.1.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['number'], "1-2.2")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['title'], 'Paragraph 1-2.1 in Procedure Section')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['number'], '1-2.3')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['title'], 'Step 1-2.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['number'], '1-2.4')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][6]['title'], 'Step 1-2.3')

        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')


        # delete section
        res = self.delete_element(execution_url, proc_section_section_1_2__1_id)

        logger.debug('res delete Section 1-1.1= %s', json.dumps(res, indent=4))

        self.assertEqual(len(res['numbers']), 3)

        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['elem_type'], 'SECTION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['title'], 'Section 1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['number'], '1-0.1')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][0]['title'], 'Step 1-0.1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], "1-1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Paragraph 1-1')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][2]['title'], 'Step 1-2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['number'], "1-2.1")
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['elem_type'], 'PARAGRAPH')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][3]['title'], 'Paragraph 1-2.1 in Procedure Section')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['number'], '1-2.2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][4]['title'], 'Step 1-2.2')

        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['number'], '1-2.3')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][5]['title'], 'Step 1-2.3')

        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['elem_type'], 'STEP')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')



        # update procedure section
        outline_elems = self.get_outline(procedure_url, version_1_2)

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version_1_2,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False         
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        # Cannot import procedure again
        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id, 400)

        # Add another procedure section
        procedure_section_data_2 = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 2'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=procedure_section_id,
            level='SIBLING',
            procedure_section=procedure_section_data_2)

        procedure_section_id_2 = res['elem']['elem_id']
        procedure_section_2 = self.get_procedure_section(execution_url, procedure_section_id_2)
        logger.debug('procedure_section_2= %s', json.dumps(procedure_section_2, indent=4))


        ### create another procedure and version
        rand_2 = random_string()
        title_2 = 'title_' + rand_2
        procedure_dict = self.create_procedure(title_2, 'Test procedure 2')

        procedure_id_2 = procedure_dict['procedure_id']
        procedure_url_2 = shared_dict['host'] + '/procedures/' + procedure_id_2

        # Add section
        res = self.add_section(base_url=procedure_url_2,
            insert_after_id=-1,
            level='CHILD')

        section_1 = res['elem']
        section_1_id = section_1['elem_id']
        self.update_step(procedure_url_2, StepTypes.MANUAL_INPUT, section_1_id, {'title': 'Section 1 New'})

        # add steps to section 1
        res = self.add_step(base_url=procedure_url_2,
            step_type=StepTypes.WAIT,
            insert_after_id=section_1_id,
            level='CHILD')

        step_1_1 = res['elem']
        step_1_1_id = step_1_1['elem_id']
        self.update_step(procedure_url_2, StepTypes.WAIT, step_1_1_id, {'title': 'Step 1-1 New'})
        self.set_step_input(procedure_url_2, StepTypes.WAIT, step_1_1_id, user_input_0) 

        # add version 1
        version_dict = self.create_procedure_version(procedure_id_2, 'First version')
        version_2_1 = version_dict['version']
        self.assertEqual(version_2_1, 1)

        # update procedure section using procedure 2
        outline_elems = self.get_outline(procedure_url_2, version_2_1)

        procedure_section_input = {
            'reference_procedure_id': procedure_id_2,
            'reference_procedure_version': version_2_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False
        }

        self.update_procedure_section_input(execution_url, procedure_section_id_2, procedure_section_input)

        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id_2)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        self.assertEqual(proc_section_elems[2]['title'], 'Step 1-1 New')
        self.assertEqual(proc_section_elems[2]['number'], '1-1')


        as_run_dict = self.get_as_run(execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][1]['number'], '2')
        self.assertEqual(as_run_dict['children'][1]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(len(as_run_dict['children'][1]['children'][0]['children']), 1)
        self.assertEqual(as_run_dict['children'][1]['children'][0]['children'][0]['title'], 'Step 1-1 New')
        self.assertEqual(as_run_dict['children'][1]['children'][0]['children'][0]['number'], '1-1')

        # get structure of selected elems
        outline_elems = self.get_outline(procedure_url, version_2_1)
        logger.debug('outline_elems= %s', json.dumps(outline_elems, indent=4))

        # Add another procedure section
        procedure_section_data_3 = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 3'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=procedure_section_id_2,
            level='SIBLING',
            procedure_section=procedure_section_data_3)

        procedure_section_id_3 = res['elem']['elem_id']
        procedure_section_3 = self.get_procedure_section(execution_url, procedure_section_id_3)
        logger.debug('procedure_section_3= %s', json.dumps(procedure_section_3, indent=4))


        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': True
        }


        self.update_procedure_section_input(execution_url, procedure_section_id_3, procedure_section_input)
        procedure_section_structure = self.get_procedure_section_structure(base_url=execution_url, elem_id=procedure_section_id_3)

        logger.debug('all procedure_section_structure= %s', json.dumps(procedure_section_structure, indent=4))
        self.assertEqual(len(procedure_section_structure['children']), 2)
        self.assertEqual(procedure_section_structure['children'][0]['title'], 'Section 1')
        self.assertEqual(procedure_section_structure['children'][1]['title'], 'Section 2')

        procedure_section_elements = self.get_procedure_section_elements(base_url=execution_url, elem_id=procedure_section_id_3)

        logger.debug('all procedure_section_elements= %s', json.dumps(procedure_section_elements, indent=4))
        self.assertEqual(len(procedure_section_elements), 7)
        self.assertEqual(procedure_section_elements[0]['title'], 'Section 1')
        self.assertEqual(procedure_section_elements[4]['title'], 'Section 2')         

        outline_elems[0]['selected'] = False
        self.update_procedure_section_input(execution_url, procedure_section_id_3, procedure_section_input)
        procedure_section_structure = self.get_procedure_section_structure(base_url=execution_url, elem_id=procedure_section_id_3, code_expected=200)
        logger.debug('selected procedure_section_structure= %s', json.dumps(procedure_section_structure, indent=4))
        self.assertEqual(len(procedure_section_structure['children']), 1)
        self.assertEqual(procedure_section_structure['children'][0]['title'], 'Section 2')

        procedure_section_elements = self.get_procedure_section_elements(base_url=execution_url, elem_id=procedure_section_id_3)

        logger.debug('selected procedure_section_elements= %s', json.dumps(procedure_section_elements, indent=4))
        self.assertEqual(len(procedure_section_elements), 3)
        self.assertEqual(procedure_section_elements[0]['title'], 'Section 2')  
        
        execution = self.get_execution(execution_id)
        self.assertEqual(len(execution['used_procedures']), 2)
        count = 0
        for used_procedure in execution['used_procedures']:
            if used_procedure['procedure_id'] == procedure_id and used_procedure['version'] == 1 and used_procedure['run_for_score'] == True:
                count = count + 1
            elif used_procedure['procedure_id'] == procedure_id and used_procedure['version'] == 2 and used_procedure['run_for_score'] == False:
                count = count + 1       

        if run_auto:
            execution_info = {
                'mode': 'AUTO', 
                'pause_conditions': {
                    'on_error': False, 
                    'on_fail': False, 
                    'on_section_end': False, 
                    'on_procedure_end': False,
                    'on_manual_input': False,
                    'on_break_point': True                
                }
            }            
            self.update_execution(execution_id, execution_info, code_expected=200)            
            self.run_step_async(execution_id, '', 202)
            time.sleep(15)

        elements = self.get_elements(execution_url)
        logger.info('elements: %s', json.dumps(elements, indent=4))

        self.close_execution(execution_id)

        execution = self.get_execution(execution_id)
        logger.info('execution: %s', json.dumps(execution, indent=4))

        if run_auto:
            self.assertEqual(len(execution['used_procedures']), 3)
            count = 0
            for used_procedure in execution['used_procedures']:
                if used_procedure['procedure_id'] == procedure_id and used_procedure['version'] == 1 and used_procedure['run_for_score'] == True:
                    count = count + 1
                elif used_procedure['procedure_id'] == procedure_id and used_procedure['version'] == 2 and used_procedure['run_for_score'] == False:
                    count = count + 1
                elif used_procedure['procedure_id'] == procedure_id_2 and used_procedure['version'] == 1 and used_procedure['run_for_score'] == False:
                    count = count + 1

            self.assertEqual(count, 3)
        else:
            self.assertEqual(len(execution['used_procedures']), 2)
            count = 0
            for used_procedure in execution['used_procedures']:
                if used_procedure['procedure_id'] == procedure_id and used_procedure['version'] == 2 and used_procedure['run_for_score'] == False:
                    count = count + 1   
                elif used_procedure['procedure_id'] == procedure_id_2 and used_procedure['version'] == 1 and used_procedure['run_for_score'] == False:
                    count = count + 1        
            self.assertEqual(count, 2)   



    def test_procedure_section_nested(self):

        rand_1 = random_string()
        title_1 = 'title_' + rand_1
        procedure_dict_1 = self.create_procedure(title_1, 'Test procedure')

        procedure_id_1 = procedure_dict_1['procedure_id']
        procedure_url_1 = shared_dict['host'] + '/procedures/' + procedure_id_1

        # Add section
        res = self.add_section(base_url=procedure_url_1,
            insert_after_id=-1,
            level='CHILD',
            title='Section 1'
            )

        section_1 = res['elem']
        section_1_id = section_1['elem_id']

        res = self.add_section(base_url=procedure_url_1,
            insert_after_id=section_1_id,
            level='SIBLING',
            title='Section 2'
            )

        section_2 = res['elem']
        section_2_id = section_2['elem_id']

        # add paragraph
        res = self.add_paragraph(base_url=procedure_url_1,
            insert_after_id=section_1_id,
            level='CHILD',
            title='Paragraph A'
            )

        paragraph_a = res['elem']
        paragraph_a_id = paragraph_a['elem_id']

        # add steps to section 1
        res = self.add_step(base_url=procedure_url_1,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=paragraph_a_id,
            level='SIBLING'
            )
        logger.debug('res= %s', json.dumps(res, indent=4))

        step_1_1 = res['elem']
        step_1_1_id = step_1_1['elem_id']

        authoring_user_input = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': []
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': []
            }
        }
        self.set_step_input(procedure_url_1, StepTypes.ENVIRONMENT_MANUAL, step_1_1_id, authoring_user_input)

        #
        res = self.add_step(base_url=procedure_url_1,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_1_1_id,
            level='SIBLING'
            )

        step_1_2 = res['elem']
        step_1_2_id = step_1_2['elem_id']

        # add steps to section 2
        res = self.add_step(base_url=procedure_url_1,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_2_id,
            level='CHILD'
            )

        step_2_1 = res['elem']
        step_2_1_id = step_2_1['elem_id']

        #
        res = self.add_step(base_url=procedure_url_1,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_2_1_id,
            level='SIBLING'
            )

        step_2_2 = res['elem']
        step_2_2_id = step_2_2['elem_id']

        # add version 1
        version_dict = self.create_procedure_version(procedure_id_1, 'First version')
        version = version_dict['version']
        self.assertEqual(version, 1)

        ### create parent procedure
        rand_2 = random_string()
        title_2 = 'title_' + rand_2
        procedure_dict_2 = self.create_procedure(title_1, 'Parent procedure')

        procedure_id_2 = procedure_dict_2['procedure_id']
        procedure_url_2 = shared_dict['host'] + '/procedures/' + procedure_id_2

        # Add procedure section to procedure
        version = 1
        procedure_section_data_2 = {"reference_procedure_id" : procedure_id_1, "reference_procedure_version" : version, 'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'ProcedureSection 1'}

        res = self.add_procedure_section(base_url=procedure_url_2,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data_2)

        procedure_section_2 = res['elem']
        procedure_section_id_2 = procedure_section_2['elem_id']

        # check structure
        outline_elems = self.get_outline(procedure_url_1, version)
        logger.debug('outline_elems= %s', json.dumps(outline_elems, indent=4))

        procedure_section_input = {
            'reference_procedure_id': procedure_id_1,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False
        }

        self.update_procedure_section_input(procedure_url_2, procedure_section_id_2, procedure_section_input)
        procedure_section_structure = self.get_procedure_section_structure(base_url=procedure_url_2, elem_id=procedure_section_id_2, code_expected=200)
        logger.debug('all procedure_section_structure= %s', json.dumps(procedure_section_structure, indent=4))
        self.assertEqual(len(procedure_section_structure['children']), 2)
        self.assertEqual(procedure_section_structure['children'][0]['title'], 'Section 1')
        self.assertEqual(procedure_section_structure['children'][1]['title'], 'Section 2')

        procedure_section_elements = self.get_procedure_section_elements(base_url=procedure_url_2, elem_id=procedure_section_id_2, code_expected=200)
        logger.debug('all procedure_section_elements= %s', json.dumps(procedure_section_elements, indent=4))
        self.assertEqual(len(procedure_section_elements), 7)
        self.assertEqual(procedure_section_elements[0]['title'], 'Section 1')
        self.assertEqual(procedure_section_elements[4]['title'], 'Section 2')           

        outline_elems[0]['selected'] = False
        self.update_procedure_section_input(procedure_url_2, procedure_section_id_2, procedure_section_input)
        procedure_section_structure = self.get_procedure_section_structure(base_url=procedure_url_2, elem_id=procedure_section_id_2, code_expected=200)
        logger.debug('selected procedure_section_structure= %s', json.dumps(procedure_section_structure, indent=4))
        self.assertEqual(len(procedure_section_structure['children']), 1)
        self.assertEqual(procedure_section_structure['children'][0]['title'], 'Section 2')

        procedure_section_elements = self.get_procedure_section_elements(base_url=procedure_url_2, elem_id=procedure_section_id_2, code_expected=200)
        logger.debug('selected procedure_section_elements= %s', json.dumps(procedure_section_elements, indent=4))
        self.assertEqual(len(procedure_section_elements), 3)
        self.assertEqual(procedure_section_elements[0]['title'], 'Section 2')  

    def test_call_procedure(self):

        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'callable': True,
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)

        logger.debug('procedure_section_input= %s', json.dumps(procedure_section_input, indent=4))
        logger.debug('user_input= %s', json.dumps(user_input, indent=4))

        self.assertDictEqual(procedure_section_input, user_input)

        new_execution_info = self.call_procedure_section(execution_id, procedure_section_id)
        new_execution_id = new_execution_info['execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id
 
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertNotEqual(new_execution_id, execution_id)

        as_run_dict = self.get_as_run(new_execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(as_run_dict['children'][0]['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['execution_user_input']['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['execution_user_input']['callable'], False)        
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['authoring_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['execution_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')

        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'IDLE')
        # Try suspend/resume the parent execution. Should not be allowed.
        res = self.suspend_resume_execution(execution_id, {'target_execution_id': new_execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot suspend execution that is not idle'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'IDLE')           

        # this should work
        res = self.suspend_resume_execution(new_execution_id, {'target_execution_id': execution_id})
        self.assertEqual(res['status'], 'IDLE')
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # suspend the parent
        res = self.update_execution_status(execution_id, {'status': 'SUSPENDED', 'comment': 'manually suspended'}, code_expected=200)
        self.assertEqual(res['status'], 'SUSPENDED')
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')       

        # Both are suspended. suspend/resume is not allowed.
        res = self.suspend_resume_execution(execution_id, {'target_execution_id': new_execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot suspend execution that is not idle'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # Both are suspended. suspend/resume is not allowed.
        res = self.suspend_resume_execution(new_execution_id, {'target_execution_id': execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot suspend execution that is not idle'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        
        # Resume the parent
        res = self.resume_execution(execution_id, {'venue_id': venue_id})
        self.assertEqual(res['status'], 'IDLE')
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')     

        # Should not be able to resume the child on the same venue
        res = self.resume_execution(execution_id, {'venue_id': venue_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot resume execution that is not suspended'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # resume the child on another venue
        res_dict = self.create_venue()
        new_venue_id = res_dict['venue_id']
        new_venue_name = res_dict['name']        

        res = self.resume_execution(new_execution_id, {'venue_id': new_venue_id})
        self.assertEqual(res['status'], 'IDLE')
        self.assertEqual(res['venue_id'], new_venue_id)
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'IDLE')

        # Both are idle. suspend/resume is not allowed.
        res = self.suspend_resume_execution(execution_id, {'target_execution_id': new_execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot resume execution that is not suspended'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'IDLE')

        # Both are idle. suspend/resume is not allowed.
        res = self.suspend_resume_execution(new_execution_id, {'target_execution_id': execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot resume execution that is not suspended'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'IDLE')

        # suspend the child
        res = self.update_execution_status(new_execution_id, {'status': 'SUSPENDED', 'comment': 'manually suspended'}, code_expected=200)
        self.assertEqual(res['status'], 'SUSPENDED')
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')   

        # venues are different. cannot suspend/resume
        res = self.suspend_resume_execution(new_execution_id, {'target_execution_id': execution_id}, 400)
        self.assertTrue(res['details'][0].startswith('Cannot suspend execution that is not idle'))
        execution_info = self.get_execution(execution_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        new_execution_info = self.get_execution(new_execution_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # close executions
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_auto(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '5'
        }        

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        # start the parent 
        self.run_step_async(execution_id, '', 202)
        time.sleep(2)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        new_execution_id = elements[0]['child_execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id        

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        # To give 10 seconds for child execution to start)
        time.sleep(10)

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        
        # account for 5 of 10 seconds wait before starting parent execution
        time.sleep(5)        
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # account for 5 of 10 seconds wait before starting parent execution
        time.sleep(5)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')          

        # wait for the step complete
        time.sleep(5)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')         

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')        

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### Run executions again
        self.run_step_async(execution_id, procedure_section_id, 202)
        time.sleep(2)
     
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        # wait until the child executon starts
        time.sleep(10)

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4.5)
        
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        
        # account for 5 of 10 seconds wait before starting parent execution
        time.sleep(5)        
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # account for 5 of 10 seconds wait before starting parent execution
        time.sleep(5)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')          

        # wait for the step complete
        time.sleep(5.5)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')       

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')        

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### close executions
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_auto_no_switch_delay(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '5'
        }        

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        # switch wait secs 
        res_dict = self.get_switch_wait(execution_id)
        self.assertEqual(res_dict['switch_wait_secs'], 10)

        res_dict = self.set_switch_wait(execution_id, {'switch_wait_secs': 0})
        self.assertEqual(res_dict['switch_wait_secs'], 0)

        res_dict = self.get_switch_wait(execution_id)
        self.assertEqual(res_dict['switch_wait_secs'], 0)     

        # switch wait flag 
        res_dict = self.get_switch_wait_flag(execution_id)
        self.assertEqual(res_dict['switch_wait_flag'], '')

        res_dict = self.delete_switch_wait_flag(execution_id)
        self.assertEqual(res_dict['switch_wait_flag'], '')

        res_dict = self.get_switch_wait_flag(execution_id)
        self.assertEqual(res_dict['switch_wait_flag'], '')

        # start the parent
        self.run_step_async(execution_id, '', 202)
        time.sleep(2)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        new_execution_id = elements[0]['child_execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id        

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', execution_info['status'])
        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', new_execution_info['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')       

        # wait for the step complete
        time.sleep(5)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')         

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')        

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### Run executions again
        self.run_step_async(execution_id, procedure_section_id, 202)
        time.sleep(2)
     
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4.5)
        
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')        

        # wait for the step complete
        time.sleep(5.5)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')       

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')        

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### close executions
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_auto_reset_delay(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '5'
        }        

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        def run_delete_child_switch_wait_flag(execution_id):
            time.sleep(2)
            # clear wait flag
            segs = execution_id.split('-')
            segs[-1] = str(int(segs[-1]) + 1)

            child_execution_id = '-'.join(segs)
            self.delete_switch_wait_flag(child_execution_id)


        threading.Thread(target=run_delete_child_switch_wait_flag, args=(execution_id,)).start()
        # start the parent
        self.run_step_async(execution_id, '', 202)
        
        time.sleep(3)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        new_execution_id = elements[0]['child_execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id       

        logger.info(f'new_execution_url: {new_execution_url}') 

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', execution_info['status'])      
        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', new_execution_info['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')            

        # runing steps of child execution
        time.sleep(2)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')

        # finish steps of child execution
        time.sleep(3)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', execution_info['status'])        
        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', new_execution_info['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # clear wait flag
        res = self.delete_switch_wait_flag(execution_info['execution_id'])
        logger.info('res: %s', json.dumps(res, indent=4))

        # running parent step
        time.sleep(2)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # wait for the step complete
        time.sleep(5)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')         

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')        

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### Run executions again
        threading.Thread(target=run_delete_child_switch_wait_flag, args=(execution_id,)).start()
        # start the parent
        self.run_step_async(execution_id, procedure_section_id, 202)
        time.sleep(3)
     
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', execution_info['status'])        
        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', new_execution_info['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                     

        # runing steps of child execution
        time.sleep(3)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')

        # finish steps of child execution
        time.sleep(2)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # clear wait flag
        self.delete_switch_wait_flag(execution_info['execution_id'])
        logger.info('res: %s', json.dumps(res, indent=4))

        # running parent step
        time.sleep(2)
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'RUNNING')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # wait for the step complete
        time.sleep(5)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')     
        self.assertEqual(len(elements[1]['run_records']), 1)    

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')         


        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### close executions
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_auto_middle(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '0'
        }                

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']
        self.update_step(execution_url, StepTypes.WAIT, step_id_1, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1, user_input)       

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=step_id_1,
            level='SIBLING',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        # start the parent (this call won't block)
        self.run_step_async(execution_id, '', 202)
        time.sleep(3)

        # wait for the child execution to start
        time.sleep(10)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        new_execution_id = elements[1]['child_execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id        

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        
        # account for 10 seconds wait before starting parent execution
        time.sleep(10)

        # to execute the last step in parent
        time.sleep(1)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')   

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[0]['execution']['meta_data']['status'], 'PASS')       
        self.assertEqual(elements[2]['execution']['meta_data']['status'], 'PASS')  

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        ### Run executions again
        self.run_step_async(execution_id, procedure_section_id, 202)
        time.sleep(10)

        time.sleep(3)
     
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')                

        # to run steps of child execution
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        
        # account for 10 seconds wait before starting parent execution
        time.sleep(10)

        # to execute the last step in parent
        time.sleep(1)        
        
        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')  

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[0]['execution']['meta_data']['status'], 'PASS')    
        self.assertEqual(elements[2]['execution']['meta_data']['status'], 'PASS')     

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')        
    
        ### close executions
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_auto_back2back(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        # add first call procedure
        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id_1 = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id_1, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id_1)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id_1, procedure_section_input)

        # add second call procedure
        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 2'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=procedure_section_id_1,
            level='SIBLING',
            procedure_section=procedure_section_data)

        procedure_section_id_2 = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id_2, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id_2)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)        

        self.update_procedure_section_input(execution_url, procedure_section_id_2, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id_2,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '0'
        }        

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        # start the parent
        self.run_step_async(execution_id, '', 202)
        time.sleep(2)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        new_execution_id_1 = elements[0]['child_execution_id']
        new_execution_url_1 = shared_dict['host'] + '/executions/' + new_execution_id_1        

        # account for 10 seconds wait before starting the child execution
        time.sleep(10)

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')

        # to run steps of child execution 1
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # account for 10 seconds wait before starting parent execution
        time.sleep(10)

        # account for 10 seconds wait before starting child execution 2
        time.sleep(10.5)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        new_execution_id_2 = elements[1]['child_execution_id']
        new_execution_url_2 = shared_dict['host'] + '/executions/' + new_execution_id_2

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id_2)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')
 
        # Wait until the execution2 is completed
        time.sleep(5.5)


        execution_info = self.get_execution(execution_id)
        logger.info('1 execution_info: %s', execution_info['status'])        
        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('1 new_execution_info: %s', new_execution_info['status'])
        new_execution_info_2 = self.get_execution(new_execution_id_2)
        logger.info('1 new_execution_info_2: %s', new_execution_info_2['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        self.assertEqual(new_execution_info_2['venue_id'], venue_id)
        self.assertEqual(new_execution_info_2['status'], 'SUSPENDED')

        # wait until the parent execution to complete
        time.sleep(11)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')   

        new_execution_info = self.get_execution(new_execution_id_2)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')                

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[2]['execution']['meta_data']['status'], 'PASS')

        new_elements = self.get_elements(new_execution_url_1)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        new_elements = self.get_elements(new_execution_url_2)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS') 

        ### Run executions again
        self.run_step_async(execution_id, procedure_section_id_1, 202)
        # give 10 seconds for the child to start
        time.sleep(10)

        time.sleep(2)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        new_execution_id_1 = elements[0]['child_execution_id']
        new_execution_url_1 = shared_dict['host'] + '/executions/' + new_execution_id_1        

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')

        # to run steps of child execution 1
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # account for 10 seconds wait before starting parent execution
        time.sleep(10)

        # account for 10 + 1 seconds wait before starting child execution 2
        time.sleep(11)

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        new_execution_id_2 = elements[1]['child_execution_id']
        new_execution_url_2 = shared_dict['host'] + '/executions/' + new_execution_id_2

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id_2)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')

        
        # wait until the execution2 is completed
        time.sleep(6)

        execution_info = self.get_execution(execution_id)
        logger.info('1 execution_info: %s', execution_info['status'])        
        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('1 new_execution_info: %s', new_execution_info['status'])
        new_execution_info_2 = self.get_execution(new_execution_id_2)
        logger.info('1 new_execution_info_2: %s', new_execution_info_2['status'])

        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')
        self.assertEqual(new_execution_info_2['venue_id'], venue_id)
        self.assertEqual(new_execution_info_2['status'], 'SUSPENDED')

        # wait until the parent to complete
        time.sleep(11)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id_1)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')   

        new_execution_info = self.get_execution(new_execution_id_2)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')                

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 3)
        self.assertEqual(elements[2]['execution']['meta_data']['status'], 'PASS')

        new_elements = self.get_elements(new_execution_url_1)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        new_elements = self.get_elements(new_execution_url_2)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')
    
        ### close executions
        self.close_execution(new_execution_id_1)
        self.close_execution(new_execution_id_2)
        self.close_execution(execution_id)

    def test_call_procedure_auto_preimport(self):
        procedure_id, procedure_url, procedure_title, version_1_1, user_input_0, version_1_2 = \
            self.create_procedure_section_example()
        
        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']

        self.update_procedure_section_input(execution_url, procedure_section_id, {'callable': True})
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['callable'], True)

        outline_elems = self.get_outline(procedure_url, version_1_1)
        self.assertEqual(len(outline_elems), 7)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], outline_elems[0]['elem_id'])

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=procedure_section_id,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '0'
        }        

        self.update_step(execution_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)         

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)    

        #
        new_execution_info = self.call_procedure_section(execution_id, procedure_section_id)
        new_execution_id = new_execution_info['execution_id']
        new_execution_url = shared_dict['host'] + '/executions/' + new_execution_id
        self.assertEqual(new_execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['execution_id'], new_execution_id)
        self.assertNotEqual(new_execution_id, execution_id)      
        self.assertEqual(new_execution_info['status'], 'IDLE')  

        execution_info = self.get_execution(execution_id)
        logger.info('new_execution: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        as_run_dict = self.get_as_run(new_execution_id)
        logger.debug('as_run_dict= %s', json.dumps(as_run_dict, indent=4))
        self.assertEqual(as_run_dict['children'][0]['number'], '1')
        self.assertEqual(as_run_dict['children'][0]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(as_run_dict['children'][0]['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['execution_user_input']['run_for_score'], False)
        self.assertEqual(as_run_dict['children'][0]['execution_user_input']['callable'], False)        
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['title'], 'Step 1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['authoring_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][0]['children'][1]['execution_user_input']['wait_type'], 'DURATION')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['title'], 'Step 2-2')
        self.assertEqual(as_run_dict['children'][0]['children'][1]['children'][1]['number'], '2-2')

        new_procedure_section_id = as_run_dict['children'][0]['elem_id']        

        # When the child procedure was called, the parent was suspended.
        # resume the parent
        self.suspend_resume_execution(new_execution_id, {'target_execution_id': execution_id})

        # start the parent
        self.run_step_async(execution_id, '', 202)
        time.sleep(10)
        time.sleep(2)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'SUSPENDED')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'RUNNING')   

        # to run steps of child execution
        time.sleep(4)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))        
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        # account for 10 seconds wait before starting parent execution
        time.sleep(10)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

        new_execution_info = self.get_execution(new_execution_id)
        logger.info('new_execution_info: %s', json.dumps(new_execution_info, indent=4))
        self.assertEqual(new_execution_info['venue_id'], venue_id)
        self.assertEqual(new_execution_info['status'], 'SUSPENDED')

        new_elements = self.get_elements(new_execution_url)
        logger.debug('new_elements= %s', json.dumps(new_elements, indent=4))
        self.assertEqual(len(new_elements), 8)
        self.assertEqual(new_elements[3]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[4]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[6]['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(new_elements[7]['execution']['meta_data']['status'], 'PASS')

        elements = self.get_elements(execution_url)
        logger.debug('elements= %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 2)
        self.assertEqual(elements[1]['execution']['meta_data']['status'], 'PASS')
    
        self.close_execution(new_execution_id)
        self.close_execution(execution_id)

    def test_call_procedure_fail_auto(self):
        """
        Test for ING-3828
        """

        ### Create Procedure
        rand_1 = random_string()
        procedure_title = 'title_' + rand_1
        procedure_dict = self.create_procedure(procedure_title, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        # add step 1
        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }
        self.update_step(procedure_url, StepTypes.WAIT, step_id_1, {'title': 'Wait Step 1'})
        self.set_step_input(procedure_url, StepTypes.WAIT, step_id_1, user_input)    

        # add step 2
        res_dict = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }
        self.update_step(procedure_url, StepTypes.WAIT, step_id_2, {'title': 'Wait Step 2'})
        self.set_step_input(procedure_url, StepTypes.WAIT, step_id_2, user_input)   

        # create a version
        version_dict = self.create_procedure_version(procedure_id, 'First version')
        version_1 = version_dict['version']
        self.assertEqual(version_1, 1)


        ### Create Execution
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        execution_description = 'Execution with procedure section'
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        # add wait
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }
        self.update_step(execution_url, StepTypes.WAIT, step_id_1, {'title': 'Wait Step'})
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1, user_input)   

        # add manual verification
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.MANUAL_VERIFICATION,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']
        self.update_step(execution_url, StepTypes.MANUAL_VERIFICATION, step_id_2, {'title': 'MV'})
 
        # add call procedure
        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=step_id_2,
            level='SIBLING',
            procedure_section=procedure_section_data)

        procedure_section_id_1 = res['elem']['elem_id']

        outline_elems = self.get_outline(procedure_url, version_1)
        self.assertEqual(len(outline_elems), 2)

        procedure_section_input = {
            'callable': True,
            'reference_procedure_id': procedure_id,
            'reference_procedure_title': procedure_title,
            'reference_procedure_version': version_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []            
        }

        self.update_procedure_section_input(execution_url, procedure_section_id_1, procedure_section_input)

        ### Execute in AUTO mode
        self.update_execution(execution_id, {'mode': 'AUTO'}, code_expected=200)
        
        self.run_step_async(execution_id, step_id_1, 202)

        time.sleep(3)

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')   

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        # Execution has stopped for manual step. Start execution again.

        self.run_step_async(execution_id, step_id_2, 202)

        # wait because core waits for 10 seconds before starting the child execution
        time.sleep(15)

        step = self.get_step(execution_url, StepTypes.MANUAL_VERIFICATION, step_id_2)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'FAIL')

        procedure_section = self.get_procedure_section(execution_url, procedure_section_id_1)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['imported'], False)
        self.assertEqual(procedure_section['child_execution_id'], '')

        execution_info = self.get_execution(execution_id)
        logger.info('execution_info: %s', json.dumps(execution_info, indent=4))
        self.assertEqual(execution_info['venue_id'], venue_id)
        self.assertEqual(execution_info['status'], 'IDLE')

    def test_procedure_and_execution_inputs(self):

        rand_1 = random_string()
        title_1 = 'title_' + rand_1
        procedure_dict = self.create_procedure(title_1, 'Test procedure')

        procedure_id = procedure_dict['procedure_id']
        procedure_url = shared_dict['host'] + '/procedures/' + procedure_id

        #
        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.VENUE_CONFIG_MANUAL,
            insert_after_id='-1',
            level='CHILD'
            )
        step_1 = res['elem']
        step_1_id = step_1['elem_id']

        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.GDS_MANUAL,
            insert_after_id=step_1_id,
            level='SIBLING'
            )
        step_2 = res['elem']
        step_2_id = step_2['elem_id']  

        res = self.add_step(base_url=procedure_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_2_id,
            level='SIBLING'
            )
        step_3 = res['elem']
        step_3_id = step_3['elem_id']              

        # add version 1
        version_dict = self.create_procedure_version(procedure_id, 'First version')
        version_1 = version_dict['version']
        self.assertEqual(version_1, 1)

        #
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue('ATLO')
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']       

        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
        logger.debug('procedure_section= %s', json.dumps(procedure_section, indent=4))
        self.assertEqual(procedure_section['title'], procedure_section_data['title'])
        self.assertEqual(procedure_section['run_for_score'], False)
        self.assertEqual(procedure_section['execution_user_input']['run_for_score'], True)

        outline_elems = self.get_outline(procedure_url, version_1)
        self.assertEqual(len(outline_elems), 3)
        self.assertEqual(outline_elems[0]['parent_id'], '')
        self.assertEqual(outline_elems[1]['parent_id'], '')
        self.assertEqual(outline_elems[2]['parent_id'], '')

        procedure_section_input = {
            'callable': False,
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version_1,
            'elements': outline_elems,
            'reference_procedure_version_description': '',
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': '',
            'run_for_score': False,
            'tag_selections': []
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)

        logger.debug('procedure_section_input= %s', json.dumps(procedure_section_input, indent=4))
        logger.debug('user_input= %s', json.dumps(user_input, indent=4))

        self.assertDictEqual(procedure_section_input, user_input)

        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        self.assertEqual(proc_section_elems[1]['number'], '1')
        self.assertEqual(len(proc_section_elems[1]['authoring_user_input']), 0)
        self.assertEqual(proc_section_elems[1]['execution_user_input']['fsw_version'], '')


    def test_run_async(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My async execution'
        execution_dict = self.create_execution(venue_id, description)

        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id        

        ## Add step 1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='CHILD')
        step_id_1 = res_dict['elem']['elem_id']

        logger.debug('step_1_id: %s', step_id_1)

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '15'
        }

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1, user_input_1)

        res_dict = self.run_step_async(execution_id, step_id_1, 202)
        logger.debug('run_step res_dict: %s', json.dumps(res_dict, indent=4))


        time.sleep(11.0)

        res_dict = self.get_step(execution_url, StepTypes.WAIT, step_id_1)
        logger.debug('run_step status 1 res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['execution']['meta_data']['status'], 'RUNNING')
        self.assertEqual(res_dict['execution']['meta_data']['status_message'], '5.0 seconds left')       
        self.assertTrue(len(res_dict['execution']['meta_data']['time_started']) > 0)
        self.assertTrue(len(res_dict['execution']['meta_data']['time_updated']) > 0)
        self.assertGreater(res_dict['execution']['meta_data']['time_updated'], res_dict['execution']['meta_data']['time_started'])    
        self.assertEqual(res_dict['execution']['meta_data']['time_completed'], '')      
        self.assertEqual(res_dict['executed'], False)  

        time.sleep(6.0)

        res_dict = self.get_step(execution_url, StepTypes.WAIT, step_id_1)
        logger.debug('run_step status 2 res_dict: %s', json.dumps(res_dict, indent=4))
        self.assertEqual(res_dict['execution']['meta_data']['status'], 'PASS')
        self.assertEqual(res_dict['execution']['meta_data']['status_message'], '')    
        self.assertTrue(len(res_dict['execution']['meta_data']['time_started']) > 0)
        self.assertTrue(len(res_dict['execution']['meta_data']['time_updated']) > 0)
        self.assertTrue(len(res_dict['execution']['meta_data']['time_completed']) > 0)     
        self.assertGreater(res_dict['execution']['meta_data']['time_updated'], res_dict['execution']['meta_data']['time_started'])   
        self.assertEqual(res_dict['execution']['meta_data']['time_updated'], res_dict['execution']['meta_data']['time_completed'])  
        self.assertEqual(res_dict['executed'], True)         

    def run_step_async(self, execution_id, current_step_id, code_expected=200):

        url = '{0}/executions/{1}/run'.format(shared_dict['host'],
                                              execution_id)

        if current_step_id:
            params = {'current_step_id': current_step_id, 'run_mode': 'ASYNC'}
        else:
            params = {'run_mode': 'ASYNC'}  
        result = requests.post(url,
                               headers=shared_dict['headers'],
                               params=params)
            
        return self.check_response(result, code_expected)  

    def test_run_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        self.update_execution(execution_id, {'mode': 'AUTO'}, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input)                    

        self.run_step_async(execution_id, step_id_1_1, 202)
        time.sleep(1)
        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'RUNNING')

        time.sleep(5)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)              

    def test_run_env_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  
        
        execution_info = {
            'mode': 'AUTO'
        }
        self.update_execution(execution_id, execution_info, code_expected=200)        

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
                         
        self.run_step_async(execution_id, section_id_1, 202)
        
        time.sleep(3)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')
        self.assertEqual(execution_dict['current_step_id'], step_id_1_1)
        
        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        
        
    def test_run_env_auto_first(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  
        
        execution_info = {
            'mode': 'AUTO'
        }
        self.update_execution(execution_id, execution_info, code_expected=200)          


        ## step 1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id='-1',
            level='')
        step_id_1 = res_dict['elem']['elem_id']
        
        ## step 2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']        
                         
        self.run_step_async(execution_id, step_id_1, 202)
        
        time.sleep(3)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')
        self.assertEqual(execution_dict['current_step_id'], step_id_2)   

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')   

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')                

        
    def test_run_env_full_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_manual_input': False
            }
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 11.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }        

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1, user_input)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_2, user_input) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2_1, user_input) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2_2, user_input)                    

        self.run_step_async(execution_id, step_id_1_1, 202)
        time.sleep(3)
        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')   

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)      

    def test_run_error_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': False, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True
            }
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 11.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }        

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1, user_input_1)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.MANUAL_INPUT,
            insert_after_id=step_id_1_1,
            level='SIBLING')

        step_id_1_2 = res_dict['elem']['elem_id']
        user_input_2 = {
            'entries': [
                {
                    'name': '_TEST_MODE_',
                    'type': 'STRING',
                    'verify_on': 'VALUE',
                    'verification_condition': 'RECORD',
                    'verification_values': [],
                    'actual_value': 'RUN_ERROR'
                }
            ]
        }

        res_dict = self.set_step_input(execution_url, StepTypes.MANUAL_INPUT, step_id_1_2, user_input_2)

        ## Step 1-3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1_2,
            level='SIBLING')
        step_id_1_3 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3, user_input_1) 

        self.run_step_async(execution_id, step_id_1_1, 202)
        time.sleep(3)

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.MANUAL_INPUT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'ERROR')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 1)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 1)        

    def test_run_fail_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': False, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        user_input_1 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 11.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }              

        user_input_2 = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [20.0],
                'actual_value': 11.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }           

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
  
        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1, user_input_1)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_2, user_input_1)

        ## Step 1-3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1_2,
            level='SIBLING')
        step_id_1_3 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3, user_input_2) 

        ## Step 1-4
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1_3,
            level='SIBLING')
        step_id_1_4 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_4, user_input_1)         

        # First run
        self.run_step_async(execution_id, step_id_1_1, 202) 

        time.sleep(3)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')       

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'FAIL')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_4)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 3)  
        self.assertEqual(execution['num_steps_passed'], 2)
        self.assertEqual(execution['num_steps_failed'], 1) 
        self.assertEqual(execution['num_steps_errored'], 0)       

        #### run steps from the first step   
        
        # create new run for the first step      
        self.create_new_run(execution_id, step_id_1_1)

        # create new run for the third step to fix the input
        self.create_new_run(execution_id, step_id_1_3)

        # Fix the input of the third step
        res_dict = self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3, user_input_1)

        # run again
        self.run_step_async(execution_id, step_id_1_1, 202)    

        time.sleep(3)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')    

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_4)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)      

        history = self.get_history(execution_id)     
        logger.debug('history: %s', json.dumps(history, indent=4))
        self.assertEqual(len(history), 7)
        self.assertEqual(history[0]['number'], '1-1')
        self.assertEqual(history[1]['number'], '1-2')
        self.assertEqual(history[2]['number'], '1-3')
        self.assertEqual(history[3]['number'], '1-1')
        self.assertEqual(history[4]['number'], '1-2')
        self.assertEqual(history[5]['number'], '1-3')
        self.assertEqual(history[6]['number'], '1-4')                

        as_run = self.get_as_run(execution_id)     
        logger.debug('as_run: %s', json.dumps(as_run, indent=4))   
        self.assertEqual(len(as_run['children'][0]['children']), 4)
        self.assertEqual(as_run['children'][0]['children'][0]['number'], '1-1')        
        self.assertEqual(as_run['children'][0]['children'][1]['number'], '1-2')
        self.assertEqual(as_run['children'][0]['children'][2]['number'], '1-3')
        self.assertEqual(as_run['children'][0]['children'][3]['number'], '1-4')

        self.assertEqual(len(as_run['children'][0]['children'][0]['run_records']), 1)
        self.assertEqual(len(as_run['children'][0]['children'][1]['run_records']), 1)        
        self.assertEqual(len(as_run['children'][0]['children'][2]['run_records']), 1)
        self.assertEqual(len(as_run['children'][0]['children'][3]['run_records']), 0)
    
    def test_break_manual_input_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO',
            'pause_conditions': {
                'on_manual_input': True
            }
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }                   

        user_input_env = {
            'temperature': {
                'verify_on': 'VALUE',
                'verification_condition': 'GREATER_THAN',
                'verification_values': [20.0],
                'actual_value': 31.0
            },
            'humidity': {
                'verify_on': 'VALUE',
                'verification_condition': 'RECORD',
                'verification_values': [],
                'actual_value': 41.0
            }
        }          

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
  
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_1)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input_1)

        ## Step 1-3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=step_id_1_2,
            level='SIBLING')
        step_id_1_3 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3, user_input_env) 

        ## Step 1-4
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1_3,
            level='SIBLING')
        step_id_1_4 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_4, user_input_1)         

        # First run
        self.run_step_async(execution_id, step_id_1_1, 202)

        time.sleep(3)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'IDLE')   

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.ENVIRONMENT_MANUAL, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_4)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 2)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], step_id_1_3)    

        # Second run
        self.run_step_async(execution_id, step_id_1_3, 202)     

        time.sleep(2)        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], '')           
        
        self.close_execution(execution_id)

    def test_break_point_auto(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO'
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }                   

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
  
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_1)

        ## paragraph 1-2
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=step_id_1_1,
            level='SIBLING',
            title='Paragraph 1-2')
        paragraph_id_1_2 = res_dict['elem']['elem_id']    

        ## step 1-3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=paragraph_id_1_2,
            level='SIBLING')
        step_id_1_3 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_3, user_input_1)

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']        

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_1) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_1)         

        # set break points
        self.update_paragraph(execution_url, section_id_1, {'break_point': 'ACTIVE'})
        self.update_paragraph(execution_url, paragraph_id_1_2, {'break_point': 'ACTIVE'})
        self.update_section(execution_url, section_id_2, {'break_point': 'ACTIVE'})
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_2_1, {'break_point': 'ACTIVE'})

        # First run
        self.run_step_async(execution_id, '', 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')        
        self.assertEqual(execution['num_steps_executed'], 0)  
        self.assertEqual(execution['num_steps_passed'], 0)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], section_id_1)   

        # Second run
        self.run_step_async(execution_id, '', 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')        

        time.sleep(2)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 1)  
        self.assertEqual(execution['num_steps_passed'], 1)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], paragraph_id_1_2)    

        # Third run
        self.run_step_async(execution_id, '', 202)
        time.sleep(1)   

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')        

        time.sleep(2)        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 2)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], section_id_2)  

        # Fourth run
        self.run_step_async(execution_id, '', 202)
        time.sleep(1)  

        elems = self.get_elements(execution_url)
        for elem in elems:
            logger.debug(f'number: {elem.get("number")} elem_id: {elem.get("elem_id")}')

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'RUNNING')        

        time.sleep(2)        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], '')                            

        # Clear break points
        #  
        res_dict = self.clear_break_points(execution_id)
        self.assertEqual(len(res_dict), 7)
        for entry in res_dict:
            self.assertEqual(entry['break_point'], 'NONE')

        elements = self.get_elements(execution_url)
        self.assertEqual(len(elements), 7)
        for element in elements:
            self.assertEqual(element['break_point'], 'NONE')

        self.close_execution(execution_id)
        

    def test_break_point_break_step(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        execution_info = {
            'mode': 'AUTO'
        }

        self.update_execution(execution_id, execution_info, code_expected=200)

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }                   

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
  
        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_1)

        ## paragraph 1-2
        res_dict = self.add_paragraph(base_url=execution_url,
            insert_after_id=step_id_1_1,
            level='SIBLING',
            title='Paragraph 1-2')
        paragraph_id_1_2 = res_dict['elem']['elem_id']    

        ## step 1-3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=paragraph_id_1_2,
            level='SIBLING')
        step_id_1_3 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_3, user_input_1)

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']        

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_1) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_1)         

        # set break points
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_1_1, {'break_point': 'ACTIVE'})

        # First run
        self.run_step_async(execution_id, '', 202)
        time.sleep(2)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')        
        self.assertEqual(execution['num_steps_executed'], 0)  
        self.assertEqual(execution['num_steps_passed'], 0)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], step_id_1_1)        

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')          

        # Second run
        self.run_step_async(execution_id, '', 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')        

        time.sleep(4.5)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_3)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)     
        self.assertEqual(execution['current_step_id'], '')   

        self.close_execution(execution_id)
                

    def test_move_procedure_elements(self):
        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
   
        outline_elems = self.get_outline(procedure_url, version)

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title,
            'run_for_score': False
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)


        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        p_elem_id_1 = proc_section_elems[1]['elem_id']
        p_elem_id_1_1 = proc_section_elems[2]['elem_id']
        p_elem_id_1_2 = proc_section_elems[3]['elem_id']
        p_elem_id_1_3 = proc_section_elems[4]['elem_id']
        p_elem_id_2 = proc_section_elems[5]['elem_id']
        p_elem_id_2_1 = proc_section_elems[6]['elem_id']
        p_elem_id_2_2 = proc_section_elems[7]['elem_id']

        res_dict = self.move_element(base_url=execution_url,
            elem_id=p_elem_id_1, insert_after_id=procedure_section_id, level='SIBLING',
            code_expected=200)

        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))    

        self.assertEqual(len(res_dict['elem_ids']), 8)
        self.assertEqual(res_dict['elem_ids'][0], procedure_section_id)
        self.assertEqual(res_dict['elem_ids'][1], p_elem_id_2)
        self.assertEqual(res_dict['elem_ids'][2], p_elem_id_2_1)
        self.assertEqual(res_dict['elem_ids'][3], p_elem_id_2_2)
        self.assertEqual(res_dict['elem_ids'][4], p_elem_id_1)
        self.assertEqual(res_dict['elem_ids'][5], p_elem_id_1_1)
        self.assertEqual(res_dict['elem_ids'][6], p_elem_id_1_2)
        self.assertEqual(res_dict['elem_ids'][7], p_elem_id_1_3)

        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['number'], '2')
        self.assertEqual(res_dict['numbers'][1]['number'], '2-1')
        self.assertEqual(res_dict['numbers'][2]['number'], '2-2')
        self.assertEqual(res_dict['numbers'][3]['number'], '2-3')

        self.assertEqual(res_dict['numbers'][0]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][1]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][2]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][3]['procedure_modification_status'], 'NONE')     

        self.assertEqual(res_dict['numbers'][0]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][1]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][2]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][3]['procedure_title'], '')        

    def test_copy_procedure_elements(self):
        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)
   
        outline_elems = self.get_outline(procedure_url, version)

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title,
            'run_for_score': True
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        user_input = self.get_procedure_section_input(execution_url, procedure_section_id)


        proc_section_elems = self.import_procedure_section(execution_id, procedure_section_id)
        logger.debug('proc_section_elems= %s', json.dumps(proc_section_elems, indent=4))

        p_elem_id_1 = proc_section_elems[1]['elem_id']
        p_elem_id_1_1 = proc_section_elems[2]['elem_id']
        p_elem_id_1_2 = proc_section_elems[3]['elem_id']
        p_elem_id_1_3 = proc_section_elems[4]['elem_id']
        p_elem_id_2 = proc_section_elems[5]['elem_id']
        p_elem_id_2_1 = proc_section_elems[6]['elem_id']
        p_elem_id_2_2 = proc_section_elems[7]['elem_id']

        self.assertEqual(proc_section_elems[1]['run_for_score'], True)

        res_dict = self.copy_element(base_url=execution_url,
            elem_id=p_elem_id_1, insert_after_id=procedure_section_id, level='SIBLING',
            code_expected=200)

        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))    

        self.assertEqual(len(res_dict['elem_ids']), 12)
        self.assertEqual(res_dict['elem_ids'][0], procedure_section_id)
        self.assertEqual(res_dict['elem_ids'][1], p_elem_id_1)
        self.assertEqual(res_dict['elem_ids'][2], p_elem_id_1_1)
        self.assertEqual(res_dict['elem_ids'][3], p_elem_id_1_2)
        self.assertEqual(res_dict['elem_ids'][4], p_elem_id_1_3)
        self.assertEqual(res_dict['elem_ids'][5], p_elem_id_2)
        self.assertEqual(res_dict['elem_ids'][6], p_elem_id_2_1)
        self.assertEqual(res_dict['elem_ids'][7], p_elem_id_2_2)

        self.assertEqual(len(res_dict['numbers']), 4)
        self.assertEqual(res_dict['numbers'][0]['number'], '2')
        self.assertEqual(res_dict['numbers'][1]['number'], '2-1')
        self.assertEqual(res_dict['numbers'][2]['number'], '2-2')
        self.assertEqual(res_dict['numbers'][3]['number'], '2-3')

        self.assertEqual(res_dict['numbers'][0]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][1]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][2]['procedure_modification_status'], 'NONE')
        self.assertEqual(res_dict['numbers'][3]['procedure_modification_status'], 'NONE')     

        self.assertEqual(res_dict['numbers'][0]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][1]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][2]['procedure_title'], '')
        self.assertEqual(res_dict['numbers'][3]['procedure_title'], '')  

        self.assertEqual(res_dict['numbers'][0]['run_for_score'], False)
        self.assertEqual(res_dict['numbers'][1]['run_for_score'], False)
        self.assertEqual(res_dict['numbers'][2]['run_for_score'], False)
        self.assertEqual(res_dict['numbers'][3]['run_for_score'], False)               
         


    def test_run_env_manual_procedure(self):
        ## Create a procedure
        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        # The default mode is MANUAL.
        # self.update_execution(execution_id, {'mode': 'MANUAL'}, code_expected=200)  
        # 

        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']                   

        # add procedure section as a child
        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)  
        outline_elems = self.get_outline(procedure_url, version)

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title,
            'run_for_score': True
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        # Do no provide current_step_id. Core will start from the first element
        # The procedure will be imported automatically.
        self.run_step_async(execution_id, '', 202)

        time.sleep(0.1)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'RUNNING')        

        time.sleep(0.9)
 
        elements = self.get_elements(execution_url)
        logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 9)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[0]['elem_type'], 'SECTION')        
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[1]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(elements[2]['number'], '1')
        self.assertEqual(elements[2]['elem_type'], 'SECTION')
        self.assertEqual(elements[3]['number'], '1-1')
        self.assertEqual(elements[3]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[4]['number'], '1-2')
        self.assertEqual(elements[4]['elem_type'], 'STEP')
        self.assertEqual(elements[5]['number'], '1-3')
        self.assertEqual(elements[5]['elem_type'], 'STEP')
        self.assertEqual(elements[6]['number'], '2')
        self.assertEqual(elements[6]['elem_type'], 'SECTION')
        self.assertEqual(elements[7]['number'], '2-1')
        self.assertEqual(elements[7]['elem_type'], 'STEP')
        self.assertEqual(elements[8]['number'], '2-2')
        self.assertEqual(elements[8]['elem_type'], 'STEP')

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], elements[5]['elem_id'])
        self.assertEqual(execution['num_steps_executed'], 1)  
        self.assertEqual(execution['num_steps_passed'], 1)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)            

    def test_run_env_auto_procedure(self):
        ## Create a procedure
        id_dict = self.create_procedure_example()
        procedure_id = id_dict['procedure_id']
        procedure_url = id_dict['procedure_url']
        procedure_title = id_dict['procedure_title']
        version = id_dict['version']
        version_description = id_dict['version_description']

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_manual_input': False
            }
        }
        self.update_execution(execution_id, execution_info, code_expected=200)    

        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']                 

        # add procedure section as a child
        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)  
        outline_elems = self.get_outline(procedure_url, version)

        procedure_section_input = {
            'reference_procedure_id': procedure_id,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title,
            'run_for_score': True
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        # start from the procedure section. 
        # The procedure will be imported automatically.
        self.run_step_async(execution_id, procedure_section_id, 202)
        time.sleep(0.2)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'RUNNING')        

        time.sleep(2.8)
 
        elements = self.get_elements(execution_url)
        logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 9)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[0]['elem_type'], 'SECTION')        
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[1]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(elements[2]['number'], '1')
        self.assertEqual(elements[2]['elem_type'], 'SECTION')
        self.assertEqual(elements[3]['number'], '1-1')
        self.assertEqual(elements[3]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[4]['number'], '1-2')
        self.assertEqual(elements[4]['elem_type'], 'STEP')
        self.assertEqual(elements[5]['number'], '1-3')
        self.assertEqual(elements[5]['elem_type'], 'STEP')
        self.assertEqual(elements[6]['number'], '2')
        self.assertEqual(elements[6]['elem_type'], 'SECTION')
        self.assertEqual(elements[7]['number'], '2-1')
        self.assertEqual(elements[7]['elem_type'], 'STEP')
        self.assertEqual(elements[8]['number'], '2-2')
        self.assertEqual(elements[8]['elem_type'], 'STEP')

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)           

    def test_run_env_auto_procedure_nested(self):
        ## Create procedures
        id_dict_1 = self.create_procedure_example()
        procedure_id_1 = id_dict_1['procedure_id']
        procedure_url_1 = id_dict_1['procedure_url']
        procedure_title_1 = id_dict_1['procedure_title']
        version_1 = id_dict_1['version']
        version_description_1 = id_dict_1['version_description']

        id_dict_2 = self.create_procedure_example()
        procedure_id_2 = id_dict_2['procedure_id']
        procedure_url_2 = id_dict_2['procedure_url']
        procedure_title_2 = id_dict_2['procedure_title']
        version_2 = id_dict_2['version']
        version_description_2 = id_dict_2['version_description']

        version = 1

        procedure_section_data_1 = {
            "reference_procedure_id" : procedure_id_2, 
            "reference_procedure_version" : version, 
            'description': "this is a description", 
            'title': 'this is a section title'
        }

        res = self.add_procedure_section(base_url=procedure_url_1,
            insert_after_id="-1",
            level='CHILD',
            procedure_section=procedure_section_data_1)

        procedure_section_id_1 = res['elem']['elem_id']
        
        outline_elems = self.get_outline(procedure_url_2, version)

        procedure_section_input = {
            'reference_procedure_id': procedure_id_2,
            'reference_procedure_version': version,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description_2,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title_2,
            'run_for_score': True
        }            
        self.update_procedure_section_input(procedure_url_1, procedure_section_id_1, procedure_section_input)
        
        version_dict = self.create_procedure_version(procedure_id_1, 'second version')
        version_2 = version_dict['version']
        self.assertEqual(version_2, 2)

        #####
        execution_description = 'Execution with procedure section'
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']            
        execution_dict = self.create_execution(venue_id, execution_description)
        execution_id = execution_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id      

        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']     

        procedure_section_data = {'elem_type': 'PROCEDURE_SECTION',
                                    'title': 'Procedure Section 1'}
        res = self.add_procedure_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='CHILD',
            procedure_section=procedure_section_data)

        procedure_section_id = res['elem']['elem_id']
        procedure_section = self.get_procedure_section(execution_url, procedure_section_id)  
        outline_elems = self.get_outline(procedure_url_1, version_2)

        procedure_section_input = {
            'reference_procedure_id': procedure_id_1,
            'reference_procedure_version': version_2,
            'elements': outline_elems,
            'reference_procedure_version_description': version_description_1,
            'reference_procedure_institutional_id': '',
            'reference_procedure_institutional_release_id': '',            
            'reference_procedure_title': procedure_title_1,
            'run_for_score': True
        }

        self.update_procedure_section_input(execution_url, procedure_section_id, procedure_section_input)

        #
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.ENVIRONMENT_MANUAL,
            insert_after_id=section_id_2,
            level='CHILD')
        logger.debug('res_dict= %s', json.dumps(res_dict, indent=4))

        ### set execution mode
        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': False, 
                'on_fail': False, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': False,
                'on_break_point': True                
            }
        }
        execution_dict = self.get_execution(execution_id)
        logger.debug('execution_dict before: %s', json.dumps(execution_dict, indent=4))

        self.update_execution(execution_id, execution_info, code_expected=200)      
        execution_dict = self.get_execution(execution_id)    
        logger.debug('execution_dict after: %s', json.dumps(execution_dict, indent=4))

        # start from the section that contains the procedure section.
        # In AUTO execution mode, the procedure will be imported automatically.
        logger.debug('section_id_1: %s', section_id_1)
        self.run_step_async(execution_id, section_id_1, 202)
        time.sleep(0.2)

        execution_dict = self.get_execution(execution_id)
        self.assertEqual(execution_dict['status'], 'RUNNING')        

        time.sleep(2.8)
 
        elements = self.get_elements(execution_url)
        logger.debug('elements: %s', json.dumps(elements, indent=4))
        self.assertEqual(len(elements), 19)
        self.assertEqual(elements[0]['number'], '1')
        self.assertEqual(elements[0]['elem_type'], 'SECTION')
        self.assertEqual(elements[0]['procedure_id'], '')        
        self.assertEqual(elements[1]['number'], '1-1')
        self.assertEqual(elements[1]['elem_type'], 'PROCEDURE_SECTION')
        self.assertEqual(elements[1]['procedure_id'], '')
        self.assertEqual(elements[2]['number'], '1')
        self.assertEqual(elements[2]['elem_type'], 'PROCEDURE_SECTION')   
        self.assertEqual(elements[2]['procedure_id'], procedure_id_1)     
        self.assertEqual(elements[3]['number'], '1')
        self.assertEqual(elements[3]['elem_type'], 'SECTION')
        self.assertEqual(elements[3]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[4]['number'], '1-1')
        self.assertEqual(elements[4]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[4]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[5]['number'], '1-2')
        self.assertEqual(elements[5]['elem_type'], 'STEP')
        self.assertEqual(elements[5]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[6]['number'], '1-3')
        self.assertEqual(elements[6]['elem_type'], 'STEP')
        self.assertEqual(elements[6]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[7]['number'], '2')
        self.assertEqual(elements[7]['elem_type'], 'SECTION')
        self.assertEqual(elements[7]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[8]['number'], '2-1')
        self.assertEqual(elements[8]['elem_type'], 'STEP')
        self.assertEqual(elements[8]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[9]['number'], '2-2')
        self.assertEqual(elements[9]['elem_type'], 'STEP')
        self.assertEqual(elements[9]['procedure_id'], procedure_id_2)
        self.assertEqual(elements[10]['number'], '2')
        self.assertEqual(elements[10]['elem_type'], 'SECTION')
        self.assertEqual(elements[10]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[11]['number'], '2-1')
        self.assertEqual(elements[11]['elem_type'], 'PARAGRAPH')
        self.assertEqual(elements[11]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[12]['number'], '2-2')
        self.assertEqual(elements[12]['elem_type'], 'STEP')
        self.assertEqual(elements[12]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[13]['number'], '2-3')
        self.assertEqual(elements[13]['elem_type'], 'STEP')
        self.assertEqual(elements[13]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[14]['number'], '3')
        self.assertEqual(elements[14]['elem_type'], 'SECTION')
        self.assertEqual(elements[14]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[15]['number'], '3-1')
        self.assertEqual(elements[15]['elem_type'], 'STEP')
        self.assertEqual(elements[15]['procedure_id'], procedure_id_1)
        self.assertEqual(elements[16]['number'], '3-2')
        self.assertEqual(elements[16]['elem_type'], 'STEP')   
        self.assertEqual(elements[16]['procedure_id'], procedure_id_1)     
        self.assertEqual(elements[17]['number'], '2')
        self.assertEqual(elements[17]['elem_type'], 'SECTION')
        self.assertEqual(elements[17]['procedure_id'], '')  
        self.assertEqual(elements[17]['executed'], False)
        self.assertEqual(elements[18]['number'], '2-1')
        self.assertEqual(elements[18]['elem_type'], 'STEP')
        self.assertEqual(elements[18]['procedure_id'], '')     
        self.assertEqual(elements[18]['executed'], True)     


        as_run = self.get_as_run(execution_id)
        logger.debug('as_run: %s', json.dumps(as_run, indent=4))


        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['num_steps_executed'], 9)  
        self.assertEqual(execution['num_steps_passed'], 9)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)           

    def test_run_auto_pause(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        self.update_execution(execution_id, {'mode': 'AUTO'}, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input_3 = {
            'wait_type': 'DURATION',
            'time_value': '3'
        }      

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }           

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_3)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input_3) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_1) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_1)                    

        self.run_step_async(execution_id, step_id_1_1, 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')

        time.sleep(3)

        execution = self.pause_execution(execution_id, 200)

        self.assertEqual(execution['status'], 'PAUSED')
        self.assertEqual(execution['current_step_id'], step_id_1_2)
        self.assertEqual(execution['current_step_number'], '1-2')

        time.sleep(4)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], step_id_2_1)
        self.assertEqual(execution['current_step_number'], '2-1')
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 2)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)   

        # start from the current_step_id that is already set
        self.run_step_async(execution_id, None, 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'RUNNING')
        self.assertEqual(execution['current_step_id'], step_id_2_1)        

        time.sleep(2)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['current_step_number'], '')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)           

    def test_run_auto_halt(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        self.update_execution(execution_id, {'mode': 'AUTO'}, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input_3 = {
            'wait_type': 'DURATION',
            'time_value': '3'
        }      

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }           

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_3)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input_3) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_1) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_1)                    

        self.run_step_async(execution_id, step_id_1_1, 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        self.assertEqual(execution['status'], 'RUNNING')

        elements = self.get_elements(execution_url)
        logger.debug('elements before halt: %s', json.dumps(elements, indent=4)) 

        time.sleep(3)

        execution = self.halt_execution(execution_id, 200)

        time.sleep(1)

        elements = self.get_elements(execution_url)
        logger.debug('elements after halt: %s', json.dumps(elements, indent=4))         

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'FAIL')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))
        logger.debug('step_id_1_2: %s', step_id_1_2)
        logger.debug('step_id_2_1: %s', step_id_2_1)

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], step_id_1_2)
        self.assertEqual(execution['current_step_number'], '1-2')
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 1)
        self.assertEqual(execution['num_steps_failed'], 1) 
        self.assertEqual(execution['num_steps_errored'], 0)   

        # start from the next step
        self.update_execution(execution_id, {'current_step_id': step_id_2_1}, code_expected=200)
        self.run_step_async(execution_id, None, 202)
        time.sleep(1)

        execution = self.get_execution(execution_id)
        logger.debug('execution: %s', json.dumps(execution, indent=4))
        self.assertEqual(execution['status'], 'RUNNING')
        self.assertEqual(execution['current_step_id'], step_id_2_1)        

        time.sleep(2)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'FAIL')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 3)
        self.assertEqual(execution['num_steps_failed'], 1) 
        self.assertEqual(execution['num_steps_errored'], 0)    

    def test_run_auto_delay(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        self.update_execution(execution_id, {'mode': 'AUTO', 'delay': 2}, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input_0 = {
            'wait_type': 'DURATION',
            'time_value': '0'
        }              

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_0)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input_0) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_0) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_0)                    

        self.run_step_async(execution_id, step_id_1_1, 202)
        
        time.sleep(0.2)

        execution = self.get_execution(execution_id)

        self.assertEqual(execution['status'], 'RUNNING')

        time.sleep(2.8)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'NONE')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'RUNNING')
        self.assertEqual(execution['current_step_id'], step_id_2_1)
        self.assertEqual(execution['num_steps_executed'], 2)  
        self.assertEqual(execution['num_steps_passed'], 2)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)   

        time.sleep(7)

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_1)
        logger.debug('step: %s', json.dumps(step, indent=4))
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_1_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_1)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')

        step = self.get_step(execution_url, StepTypes.WAIT, step_id_2_2)
        logger.debug('step: %s', json.dumps(step, indent=4))        
        self.assertEqual(step['execution']['meta_data']['status'], 'PASS')        

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)                    

    def test_no_current_step_id(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        self.update_execution(execution_id, {'mode': 'AUTO'}, code_expected=200)

        ## Add section 1
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id='-1',
            level='',
            title='Section 1',
            description='Section 1')
        section_id_1 = res_dict['elem']['elem_id']

        ## step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')
        step_id_1_1 = res_dict['elem']['elem_id']
        
        user_input_3 = {
            'wait_type': 'DURATION',
            'time_value': '3'
        }      

        user_input_1 = {
            'wait_type': 'DURATION',
            'time_value': '1'
        }           

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input_1)

        ## step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,          
            insert_after_id=step_id_1_1,
            level='SIBLING')
        step_id_1_2 = res_dict['elem']['elem_id']    

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input_1) 

        ## Add section 2
        res_dict = self.add_section(base_url=execution_url,
            insert_after_id=section_id_1,
            level='SIBLING',
            title='Section 2',
            description='Section 2')
        section_id_2 = res_dict['elem']['elem_id']

        ## Step 2-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_2,
            level='CHILD')
        step_id_2_1 = res_dict['elem']['elem_id']

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_1, user_input_1) 

        ## Step 2-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,           
            insert_after_id=step_id_2_1,
            level='SIBLING')
        step_id_2_2 = res_dict['elem']['elem_id']     

        self.set_step_input(execution_url, StepTypes.WAIT, step_id_2_2, user_input_1)                    

        res = self.run_step_async(execution_id, None, 202)

        time.sleep(5.5)

        execution = self.get_execution(execution_id)

        logger.debug('execution: %s', json.dumps(execution, indent=4))

        self.assertEqual(execution['status'], 'IDLE')
        self.assertEqual(execution['current_step_id'], '')
        self.assertEqual(execution['num_steps_executed'], 4)  
        self.assertEqual(execution['num_steps_passed'], 4)
        self.assertEqual(execution['num_steps_failed'], 0) 
        self.assertEqual(execution['num_steps_errored'], 0)          
        
    def test_search(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']
        venue_name = res_dict['name']

        ## Add an execution
        description = 'My new execution'
        res_dict = self.create_execution(venue_id, description)

        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id  

        user_input = {
            'wait_type': 'DURATION',
            'time_value': '0'
        } 
        
        ## step 1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id='-1',
            level='')
        step_id_1 = res_dict['elem']['elem_id']
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_1, {'title': 'Step 1', 'description': '<p>This is abc. That is tom.</p>'})        
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_1, user_input)
        
        ## Step 2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1,
            level='SIBLING')
        step_id_2 = res_dict['elem']['elem_id']
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_2, {'title': 'Step 2', 'description': '<p>This is ABC. That is TOM.</p>'})           
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_2, user_input)   
        
        ## Step 3
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_2,
            level='SIBLING')
        step_id_3 = res_dict['elem']['elem_id']
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_3, {'title': 'Step 3', 'description': '<p>This is Abc. That is Tom.</p>'})           
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_3, user_input)
        
        ## Step 4
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_3,
            level='SIBLING')
        step_id_4 = res_dict['elem']['elem_id']
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_4, {'title': 'Step 4', 'description': '<p>This is abc. That is Jack.</p>'})         
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_4, user_input)        
        
        ## Step 5
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_4,
            level='SIBLING')
        step_id_5 = res_dict['elem']['elem_id']
        self.update_step(execution_url,
            StepTypes.WAIT, step_id_5, {'title': 'Step 5', 'description': '<p>This is abcD. That is Toms.</p>'})         
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_5, user_input)   
        
    
        time_start_utc = datetime.now(dateutil.tz.tzutc())
        time_start_utc_str = time_start_utc.isoformat()[:-9] + 'Z'
        # run the step 
        res_dict = self.run_step(execution_id, step_id_2)
        time.sleep(2)
        time_mid_utc = datetime.now(dateutil.tz.tzutc()) 
        time_mid_utc_str = time_mid_utc.isoformat()[:-9] + 'Z'        
        # run the step
        res_dict = self.run_step(execution_id, step_id_3)
        time.sleep(2)     
        # run the step
        res_dict = self.run_step(execution_id, step_id_4)
        time.sleep(2)     
        time_end_utc = datetime.now(dateutil.tz.tzutc())   
        time_end_utc_str = time_end_utc.isoformat()[:-9] + 'Z'  
        
        print('time_start_utc_str:', time_start_utc_str)
        print('time_mid_utc_str:', time_mid_utc_str)
        print('time_end_utc_str:', time_end_utc_str)
        
        # Search
        url = '{0}/search'.format(execution_url)

        search_input = {
            'search_for': 'abc',
            'match_case': False,
            'match_whole_word': False,
            'step_type_filters': [],
            'field_filters': [],
            'start_elem_id': '',
            'end_elem_id': ''
        }        
        res = requests.post(url, json=search_input, headers=shared_dict['headers'])
        logger.debug('status_code: %s', res.status_code)
        res_dict = json.loads(res.text)
        logger.debug('res= %s', json.dumps(res_dict, indent=4))   
        self.assertEqual(res_dict['total_count'], 5)
        
        self.assertEqual(res_dict['matches'][0]['number'], '1')
        self.assertEqual(res_dict['matches'][0]['field_path'], 'description')
        self.assertEqual(res_dict['matches'][0]['is_html'], True)
        self.assertEqual(res_dict['matches'][0]['replaceable'], False)
        self.assertEqual(len(res_dict['matches'][0]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][1]['number'], '2')
        self.assertEqual(res_dict['matches'][1]['field_path'], 'description')
        self.assertEqual(res_dict['matches'][1]['is_html'], True)
        self.assertEqual(res_dict['matches'][1]['replaceable'], False)        
        self.assertEqual(len(res_dict['matches'][1]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][2]['number'], '3')
        self.assertEqual(res_dict['matches'][2]['field_path'], 'description')
        self.assertEqual(res_dict['matches'][2]['is_html'], True)
        self.assertEqual(res_dict['matches'][2]['replaceable'], False)        
        self.assertEqual(len(res_dict['matches'][2]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][3]['number'], '4')
        self.assertEqual(res_dict['matches'][3]['field_path'], 'description')
        self.assertEqual(res_dict['matches'][3]['is_html'], True)
        self.assertEqual(res_dict['matches'][3]['replaceable'], False)        
        self.assertEqual(len(res_dict['matches'][3]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][4]['number'], '5')
        self.assertEqual(res_dict['matches'][4]['field_path'], 'description')
        self.assertEqual(res_dict['matches'][4]['is_html'], True)
        self.assertEqual(res_dict['matches'][4]['replaceable'], False)        
        self.assertEqual(len(res_dict['matches'][4]['match_texts']), 1)                            
        
        # Search based on status
        url = '{0}/search'.format(execution_url)

        search_input = {
            'search_for': 'abc',
            'match_case': False,
            'match_whole_word': False,
            'step_type_filters': [],
            'field_filters': [],
            'status_filters': ['PASS'],
            'start_elem_id': '',
            'end_elem_id': ''
        }        
        res = requests.post(url, json=search_input, headers=shared_dict['headers'])
        logger.debug('status_code: %s', res.status_code)
        res_dict = json.loads(res.text)
        logger.debug('res= %s', json.dumps(res_dict, indent=4))   
        self.assertEqual(res_dict['total_count'], 3)

        self.assertEqual(res_dict['matches'][0]['number'], '2')
        self.assertEqual(res_dict['matches'][0]['field_path'], 'description')
        self.assertEqual(len(res_dict['matches'][0]['match_texts']), 1)
                
        self.assertEqual(res_dict['matches'][1]['number'], '3')
        self.assertEqual(res_dict['matches'][1]['field_path'], 'description')
        self.assertEqual(len(res_dict['matches'][1]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][2]['number'], '4')
        self.assertEqual(res_dict['matches'][2]['field_path'], 'description')
        self.assertEqual(len(res_dict['matches'][2]['match_texts']), 1)
        
        # Search based on time
        url = '{0}/search'.format(execution_url)

        search_input = {
            'search_for': 'abc',
            'match_case': False,
            'match_whole_word': False,
            'step_type_filters': [],
            'field_filters': [],
            'start_elem_id': '',
            'end_elem_id': '',
            'from_time': time_mid_utc_str,
            'to_time': time_end_utc_str,
        }        
        res = requests.post(url, json=search_input, headers=shared_dict['headers'])
        logger.debug('status_code: %s', res.status_code)
        res_dict = json.loads(res.text)
        logger.debug('res= %s', json.dumps(res_dict, indent=4))   
        self.assertEqual(res_dict['total_count'], 2)
        
        self.assertEqual(res_dict['matches'][0]['number'], '3')
        self.assertEqual(res_dict['matches'][0]['field_path'], 'description')
        self.assertEqual(len(res_dict['matches'][0]['match_texts']), 1)
        
        self.assertEqual(res_dict['matches'][1]['number'], '4')
        self.assertEqual(res_dict['matches'][1]['field_path'], 'description')
        self.assertEqual(len(res_dict['matches'][1]['match_texts']), 1)
        
    def test_execution_export_import(self):
        ## Add a venue
        res_dict = self.create_venue()
        venue_id = res_dict['venue_id']

        ## Add an execution
        description = 'My execution for export'
        res_dict = self.create_execution(venue_id, description)

        ## Check execution
        execution_id = res_dict['execution_id']
        execution_url = shared_dict['host'] + '/executions/' + execution_id

        # Add section
        res = self.add_section(base_url=execution_url,
            insert_after_id=-1,
            level='CHILD',
            description='Section 1')

        section_1 = res['elem']
        section_id_1 = section_1['elem_id']

        with open('rocket.png','rb') as file:         
            file_data = {'file_content': file}
            self.add_elem_file(execution_url, section_id_1, file_data)

        section_1 = self.get_section(execution_url, section_id_1)
        description_1 = '<p>'
        for file in section_1['files']:
            file_url = file['url']
            link_segment = '''<p>Image:<img src=\"/file_server/{0}\"></p>'''.format(file_url)
            description_1 = description_1 + link_segment

        description_1 = description_1 + '</p>'

        self.update_section(execution_url, section_id_1, {'description': description_1})

        ## Add step 1-1
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=section_id_1,
            level='CHILD')

        step_id_1_1 = res_dict['elem']['elem_id']
        user_input = {
            "wait_type": "DURATION",
            "time_value": "1"
        }
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_1, user_input)
        
        # Add comment to step
        res_dict = self.add_conversation(execution_url, step_id_1_1, {'type': 'COMMENT'})
        conversation_id = res_dict['conversation_id']
        comment = res_dict['comments'][0]
        comment_id = comment['comment_id']

        with open('rocket.png','rb') as file:         
            files = {'file_content': file}
            file_info = self.add_comment_file(execution_url, step_id_1_1, conversation_id, comment_id, files, "testfile")
            content1 = '''<p>This is a comment. <img src=\"/file_server/{0}\"></p>'''.format(file_info['url'])
            res_dict = self.update_comment(execution_url, step_id_1_1, conversation_id, comment_id, content1)

        ## Add step 1-2
        res_dict = self.add_step(base_url=execution_url,
            step_type=StepTypes.WAIT,
            insert_after_id=step_id_1_1,
            level='SIBLING')

        step_id_1_2 = res_dict['elem']['elem_id']
        user_input = {
            "wait_type": "DURATION",
            "time_value": "1"
        }
        res_dict = self.set_step_input(execution_url, StepTypes.WAIT, step_id_1_2, user_input)
   
        # add images
        with open('rocket.png','rb') as file:         
            file_data = {'file_content': file}
            self.add_elem_file(execution_url, step_id_1_1, file_data)    

        with open('rocket.png','rb') as file:         
            file_data = {'file_content': file}
            self.add_elem_file(execution_url, step_id_1_1, file_data)      

        with open('rocket.png','rb') as file:         
            file_data = {'file_content': file}
            self.add_elem_file(execution_url, step_id_1_1, file_data)
  
        step_1_1 = self.get_step(base_url=execution_url, step_type=StepTypes.WAIT, elem_id=step_id_1_1) 
        title_1_1 = 'First step title'
        description_1_1 = '<p>'
        for file in step_1_1['files']:
            file_url = file['url']
            link_segment = '''<p>Image:<img src=\"/file_server/{0}\"></p>'''.format(file_url)
            description_1_1 = description_1_1 + link_segment

        description_1_1 = description_1_1 + '</p>'

        self.update_step(base_url=execution_url, step_type=StepTypes.WAIT, elem_id=step_id_1_1, 
            step_dict={'description': description_1_1, 'title': title_1_1})

        # cache execution state
        execution_info_1 = self.get_execution(execution_id)
        elements_1 = self.get_elements(execution_url)
        self.assertEqual(len(elements_1), 3)
        history_1 = self.get_history(execution_id)
        self.assertEqual(len(history_1), 0)
        
        # export execution
        zname = self.export_execution(execution_id)
        zname_1 = f'1-{zname}'
        shutil.copy2(zname, zname_1)

        # execute steps
        execution_info = {
            'mode': 'AUTO', 
            'pause_conditions': {
                'on_error': True, 
                'on_fail': True, 
                'on_section_end': False, 
                'on_procedure_end': False,
                'on_manual_input': True,
                'on_break_point': True                
            }
        }            
        self.update_execution(execution_id, execution_info, code_expected=200)            
        self.run_step_async(execution_id, '', 202)
        time.sleep(4)

        # execute again from the second step
        res_dict = self.create_new_run(execution_id, step_id_1_2)
        self.run_step_async(execution_id, step_id_1_2, 202)
        time.sleep(2)

        # execute again from the second step
        res_dict = self.create_new_run(execution_id, step_id_1_2)
        self.run_step_async(execution_id, step_id_1_2, 202)
        time.sleep(2)        

        # cache execution state
        execution_info_2 = self.get_execution(execution_id)
        elements_2 = self.get_elements(execution_url)
        self.assertEqual(len(elements_2), 3)
        history_2 = self.get_history(execution_id)
        self.assertEqual(len(history_2), 4)

        # export execution
        zname = self.export_execution(execution_id)
        zname_2 = f'2-{zname}'
        shutil.copy2(zname, zname_2)

        # delete
        self.delete_execution(execution_id)
        self.get_execution(execution_id, code_expected=400)

        ##### import
        res_dict = self.import_execution(zname_1)

        self.assertEqual(res_dict['execution_info']['execution_id'], 
            execution_id)
    
        self.assertEqual(len(res_dict['messages']), 0)

        # check execution
        execution_info_ = self.get_execution(execution_id)
        self.assertDictEqual(execution_info_1, execution_info_)

        elements_ = self.get_elements(execution_url)

        self.assertEqual(len(elements_1), len(elements_))
        self.assertListEqual(elements_1, elements_)

        history_ = self.get_history(execution_id)
        self.assertListEqual(history_1, history_)

        # import again to overwrite
        res_dict = self.import_execution(zname_2)

        self.assertEqual(res_dict['execution_info']['execution_id'], 
            execution_id)
    
        self.assertEqual(len(res_dict['messages']), 0)

        # check execution
        execution_info_ = self.get_execution(execution_id)
        self.assertDictEqual(execution_info_2, execution_info_)

        elements_ = self.get_elements(execution_url)

        self.assertEqual(len(elements_2), len(elements_))
        self.assertListEqual(elements_2, elements_)

        history_ = self.get_history(execution_id)
        self.assertListEqual(history_2, history_)

    def export_execution(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/export'.format(shared_dict['host'], execution_id)

        logger.debug('GET: %s', url)
        res = requests.get(url,
            headers=shared_dict['headers'])

        self.assertEqual(res.status_code, code_expected)

        zname = f'execution-{execution_id}.tar.gz'
        zfile = open(zname, 'wb')
        zfile.write(res.content)
        zfile.close()

        return zname 

    def import_execution(self, zname, code_expected=200):
        url = '{0}/executions/import'.format(shared_dict['host'])
        with open(zname,'rb') as file:         
            file_payload = {'execution_file': file}

            headers =  copy.deepcopy(shared_dict['headers'])
            headers.pop('Content-Type', None)
            # headers['content-encoding'] = 'gzip'
            res = requests.post(url,
                headers=headers,
                files=file_payload)
            self.assertEqual(res.status_code, code_expected)
            self.assertEqual(res.status_code, 200)
            res_dict = json.loads(res.text)
            return res_dict

    def pause_execution(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/pause'.format(shared_dict['host'], execution_id)

        logger.debug('POST: %s', url)
        result = requests.post(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = json.loads(result.text)

        return res_dict        

    def clear_break_points(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/break_points'.format(shared_dict['host'], execution_id)

        logger.debug('DELETE: %s', url)
        result = requests.delete(url,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = json.loads(result.text)

        return res_dict         

    def resume_execution(self, execution_id, resume_input, code_expected=200):
        url = '{0}/executions/{1}/resume'.format(shared_dict['host'], execution_id)

        logger.debug('POST: %s', url)
        result = requests.post(url, json=resume_input,
            headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict

    def suspend_resume_execution(self, execution_id, suspend_resume_input, code_expected=200):
        url = '{0}/executions/{1}/suspend_resume'.format(shared_dict['host'], execution_id)

        logger.debug('POST: %s', url)
        result = requests.post(url, json=suspend_resume_input,
            headers=shared_dict['headers'])
        logger.debug('status_code: %s', result.status_code)
        logger.debug('text: %s', result.text)

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict        

    def call_procedure_section(self, execution_id, elem_id, code_expected=200):
        url = '{0}/executions/{1}/procedure_sections/{2}/call'.format(shared_dict['host'], execution_id, elem_id)

        logger.debug('POST: %s', url)
        result = requests.post(url, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict

    def get_switch_wait(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/switch_wait'.format(shared_dict['host'], execution_id)

        logger.debug('GET: %s', url)
        result = requests.get(url, headers=shared_dict['headers'])
        logger.debug(result.text)

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict

    def set_switch_wait(self, execution_id, switch_wait_input, code_expected=200):
        url = '{0}/executions/{1}/switch_wait'.format(shared_dict['host'], execution_id)

        logger.debug('PUT: %s', url)
        result = requests.put(url, json=switch_wait_input, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict

    def get_switch_wait_flag(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/switch_wait_flag'.format(shared_dict['host'], execution_id)

        logger.debug('GET: %s', url)
        result = requests.get(url, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        return res_dict

    def delete_switch_wait_flag(self, execution_id, code_expected=200):
        url = '{0}/executions/{1}/switch_wait_flag'.format(shared_dict['host'], execution_id)

        logger.debug('DELETE: %s', url)
        result = requests.delete(url, headers=shared_dict['headers'])

        self.assertEqual(result.status_code, code_expected)

        res_dict = result.json()

        logger.debug('delete_switch_wait_flag res_dict: %s', json.dumps(res_dict))

        return res_dict

if __name__ == '__main__':
    unittest.main(testRunner=xmlrunner.XMLTestRunner(output="./test-reports/"))
