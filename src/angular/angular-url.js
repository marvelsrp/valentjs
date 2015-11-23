import isObject from 'lodash/lang/isObject';
import isEqual from 'lodash/lang/isEqual';
import cloneDeep from 'lodash/lang/cloneDeep';

import transform from 'lodash/object/transform';

import Url from '../url';

import Scope from './services/scope';
import Injector from './services/injector';

let _scope = Symbol('scope');
let _state = Symbol('state');

export default class AngularUrl extends Url {
  constructor(pattern, struct) {
    super(pattern, struct);

    this[_state] = {};
    this[_scope] = null;
  }

  attachScope($scope) {
    this[_scope] = $scope;
  }

  hasScope() {
    return !!this[_scope];
  }

  parse() {
    let $location = Injector.get('$location');
    let decoded = this.decode($location.$$url);

    this.cacheParams(decoded);

    return decoded;
  }

  go(params, options) {
    let isChanged = this.isEqual(params);

    if (!isChanged) {
      let $location = Injector.get('$location');

      if (options) {
        let $rootScope = Injector.get('$rootScope');

        let unsubscribe = $rootScope.$on('$routeUpdate', event => {

          Object.assign(event, {
            $valentEvent: options
          });

          unsubscribe();
        });
      }

      let url = this.stringify(params);
      $location.url(url);
    }

    return isChanged;
  }

  redirect(params = {}) {
    if (!isObject(params)) {
      throw new Error('params should be an object');
    }

    let url = this.stringify(params);
    let $window = Injector.get('$window');

    $window.location.href = url;
  }

  stringify(params) {
    let url = super.stringify(params);

    let $browser = Injector.get('$browser');
    let base = $browser.baseHref();

    return base ? url.replace(/^\//, '') : url;
  }

  watch(callback) {
    let context = this[_scope];
    let off = null;
    let unsubscribed = false;

    Scope.get(context).then($scope => {
      if (!unsubscribed) {
        off = $scope.$on('$routeUpdate', (event) => {
          let valentEvent = event.$valentEvent;

          let params = this.parse();

          let diff = transform(params, (result, n, key) => {
            // TODO: use cached params instead of state
            let state = this[_state][key];

            if (!isEqual(n, state)) {
              result[key] = n;
            }
          });

          this[_state] = cloneDeep(params);

          callback(params, diff, valentEvent);
        });
      }
    });

    return () => {
      if (off) {
        off();
      } else {
        unsubscribed = true;
      }
    };
  }
}
