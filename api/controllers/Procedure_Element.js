'use strict';

var Procedure_Element = require('./Procedure_ElementService');

module.exports.validate_procedure_element = function validate_procedure_element (req, res, next) {
    Procedure_Element.validate_procedure_element(req.swagger.params, res, next, req['headers']);
};
