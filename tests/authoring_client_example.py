import requests
import json
import random

from config import shared_dict
                    

def check_versions():
    print('check_versions starts')
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10008/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('m2020-procedure-10008:', json.dumps(res_dict, indent=4)) 
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10009/versions/1/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('m2020-procedure-10009 version 1:', json.dumps(res_dict, indent=4)) 
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10009/versions/2/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('m2020-procedure-10009 version 2:', json.dumps(res_dict, indent=4))   
    print('check_versions done')  
    
def run2():
    print('run2 starts')
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))
    
    params = {'released': 'false'}
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures', params = params,
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))       
    print('run2 done')  

    
def load_version_1():
    print('load_version_1 starts')
    res = requests.post('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10008/load', 
                       json={'procedure_id': 'm2020-procedure-10009', 'version': 1}, headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    print('res.text:', res.text)   
    print('load_version_1 done')  
    
def load_version_2():
    print('load_version_2 starts')
    res = requests.post('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10008/load', 
                       json={'procedure_id': 'm2020-procedure-10009', 'version': 2}, headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    print('res.text:', res.text)   
    print('load_version_2 done')    
    
def check_working_copy():
    print('check_working_copy starts')
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10008/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))     

    print('check_working_copy done')
    
def get_structure():
    print('get_structure')
    
    res = requests.get('http://localhost:8002/api/v5/procedures/m2020-procedure-10022/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))     

    print('get_structure done')    
    
def get_version_structure():
    print('get_structure')
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10022/versions/1/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))     
    
    res = requests.get('https://ingenium-ci.cld.jpl.nasa.gov/core_server/api/v5/procedures/m2020-procedure-10022/versions/2/structure', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))         

    print('get_structure done')       
    
def get_health():
    print('get_health')
    
    res = requests.get('http://localhost:8002/api/v5/health', 
                       headers=shared_dict['headers'], verify=False)
    print('res.status_code:', res.status_code)
    # print('res.text:', res.text)
    res_dict = json.loads(res.text)
    print('res:', json.dumps(res_dict, indent=4))     
    
    print('get_health done')       
        
    
if __name__ == "__main__":
    get_version_structure()