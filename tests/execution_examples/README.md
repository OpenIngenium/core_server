# Generate Execution Examples
Two examples can be used depending on your needs. The first is an execution with various steps and their execution results are populated.  The second is an execution with redline modifications.

## Generate an execution with various step types using a script

This is an example to generate an execution with steps with results. 
This script was created as a shortcut to create steps of different status (PASS, FAIL, ERROR).  
The script needs only Core and Archive services and does not need execution or venue service.
It is based on an execution on Ingenium R3.1 and the data was modified according to the latest specs.

### Files
* as_run.json.original:  the original as_run data. Not used by the script.
* as_run.json: modified as_run data according to the latest API specs. This is used by the script.
* create_execution_example.py: script to create a new execution using the "as run" data.

### How to run

First you need to have Core and Archive service running. If you are using the single node deployment, start Core and its dependencies.

https://github.jpl.nasa.gov/Ingenium/ingenium-dep/tree/devel/compose_single_node

Set the "test_conductor" of the dummy execution. Be default, "hongmank" will be used as the test conductor.
Since the execution will be owned by the default user, you may not be able to continue its execution.
You can set the test conductor as yourself in [tests/config.py](https://github.jpl.nasa.gov/Ingenium/core_server/blob/devel/tests/config.py#L29)

To run the script.

```
$ cd core_server/tests
$ virtualenv -p python3 ve3 
$ source ve3/bin/activate
(ve3) $ pip install -r requirements.txt
(ve3) $ cd execution_examples
(ve3) $ export CORE_API_PATH=http://localhost:8002/api/v5
(ve3) $ export PRIVATE_PEM="......"   (you may already have this if you are running the single node deployment)
(ve3) $ python create_execution_example.py

```
The script will print the execution_id of the new execution. 
If you open the UI, you will find a new venue for the execution. and you can continue the execution.

## Take over an execution

If an execution is started by another user, you can only watch it. If you want to take over such execution for debugging purpose,
you can use the following script to change the test conductor to yourself.


```
python change_test_conductor.py <execution_id> <user_name>

```
Example:

```
$ cd core_server/tests
$ virtualenv -p python3 ve3 
$ source ve3/bin/activate
(ve3) $ cd execution_examples
(ve3) $ export CORE_API_PATH=http://localhost:8002/api/v5
(ve3) $ export PRIVATE_PEM="......"   (you may already have this if you are running the single node deployment)
(ve3) $ python change_test_conductor.py m2020-ingenium-10001 hongmank
```

## Generate an execution with redline modifications
You can run a core test to generate an execution with redline modifications.

```
$ cd core_server/tests
$ virtualenv -p python3 ve3 
$ source ve3/bin/activate
(ve3) $ pip install -r requirements.txt
(ve3) $ export CORE_API_PATH=http://localhost:8002/api/v5
(ve3) $ export PRIVATE_PEM="......"   (you may already have this if you are running the single node deployment)
(ve3) $ python test_ci_executions.py ExecutionsTest.test_redline

```
The test script will print out execution_id and venue information for the execution.

## Generate a Procedure with EIP Steps

You can use a script to generate a procedure with many EIP steps.

Set up environment.
```
$ cd core_server/tests
$ virtualenv -p python3 ve3 
$ source ve3/bin/activate
(ve3) $ pip install -r requirements.txt
(ve3) $ export CORE_API_PATH=http://localhost:8002/api/v5
(ve3) $ export PRIVATE_PEM="......"   (you may already have this if you are running the single node deployment)

```

To see the instruction, run the script with no arguments.
```
cd execution_examples
$ python create_eip_executions.py
USAGE: python create_eip_procedure.py num_sections num_steps_per_section num_entries
Example: python create_eip_procedure.py 100 10 50
```

The script will return the procedure_id of the newly created procedure. In Ingenium UI, open the
working copy of the procedure.
```
$ python create_eip_procedure.py 3 5 20
[DEBUG]: [2020-04-02T05:25:37.348Z] - api_path: http://localhost:8002/api/v5
procedure_id: clipper-procedure-11152
```
