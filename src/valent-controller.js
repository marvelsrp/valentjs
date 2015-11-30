import isFunction from 'lodash/lang/isFunction';
import isArray from 'lodash/lang/isArray';
import isObject from 'lodash/lang/isObject';
import isString from 'lodash/lang/isString';

import RegisterException from './exceptions/register';

let validate = (controller) => {
  let errors = [];

  // --- VALIDATE NAME -----
  let name = controller.getName();
  if (!name || name.indexOf(' ') != -1) {
    errors.push('controller\'s name could not be empty or contain spaces');
  }

  // --- VALIDATE CONTROLLER CONSTRUCTOR -----
  let Controller = controller.getController(); // :(
  if (!isFunction(Controller)) {
    errors.push('controller should be a constructor');
  }

  return errors;
};

export default class ValentController {
  route = null;

  constructor(name, Controller, options = {}) {
    this.name = name;
    this.options = options;
    this.Controller = Controller;

    let errors = validate(this);
    if (errors.length) {
      throw new RegisterException(name, 'valent-controller', errors);
    }

    if (this.options.url) {
      let routeOptions = this.options.options || {};

      Object.assign(routeOptions, {
        struct:  this.getStruct()
      });

      let module = this.options.module;
      if (module) {
        routeOptions.module = module;
      }

      if (this.hasResolvers()) {
        routeOptions.resolve = this.getResolvers();
      }

      if (this.hasTemplate()) {

        // set template
        routeOptions.template = this.getTemplate();
      } else if (this.hasTemplateUrl()) {

        // set templateUrl
        routeOptions.templateUrl = this.getTemplateUrl();
      } else if (this.hasTemplateMethod()) {

        // set template using Components method
        let method = this.getTemplateMethod();
        let template = method(this);

        if (!isString(template)) {
          // TODO: display controller name
          throw new RegisterException(name, 'result of Controller.render() should be a string');
        }

        routeOptions.template = template;
      }

      let url = this.getUrl();
      valent.route(this.name, url, routeOptions);
    }
  }

  getName() {
    return this.name;
  }

  getController() {
    return this.Controller;
  }

  hasTemplate() {
    return !!this.options.template;
  }

  getTemplate() {
    return this.options.template;
  }

  hasTemplateUrl() {
    return !!this.options.templateUrl;
  }

  getTemplateUrl() {
    return this.options.templateUrl;
  }

  hasTemplateMethod() {
    return isFunction(this.Controller.render);
  }

  getTemplateMethod() {
    return this.Controller.render;
  }

  withoutTemplate() {
    return !this.hasTemplate() && !this.hasTemplateUrl() && !this.hasTemplateMethod();
  }

  hasUrl() {
    return isArray(this.options.url) ? !!this.options.url.length : !!this.options.url;
  }

  getUrl() {
    return this.options.url;
  }

  getStruct() {
    return this.options.struct || {};
  }

  hasResolvers() {
    return this.options.resolve && !!Object.keys(this.options.resolve).length;
  }

  getResolvers() {
    return this.options.resolve;
  }
}