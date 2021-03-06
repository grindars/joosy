(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Joosy.Resources.Base = (function(_super) {
    __extends(Base, _super);

    Base.include(Joosy.Modules.Log);

    Base.include(Joosy.Modules.Events);

    Base.include(Joosy.Modules.Filters);

    Base.prototype.__primaryKey = 'id';

    Base.resetIdentity = function() {
      return Joosy.Resources.Base.identity = {};
    };

    Base.registerPlainFilters('beforeLoad');

    Base.primaryKey = function(primaryKey) {
      return this.prototype.__primaryKey = primaryKey;
    };

    Base.entity = function(name) {
      return this.prototype.__entityName = name;
    };

    Base.collection = function(klass) {
      return this.prototype.__collection = function() {
        return klass;
      };
    };

    Base.prototype.__collection = function() {
      var named;
      named = this.__entityName.camelize().pluralize() + 'Collection';
      if (window[named]) {
        return window[named];
      } else {
        return Joosy.Resources.Collection;
      }
    };

    Base.map = function(name, klass) {
      if (klass == null) {
        klass = false;
      }
      if (!klass) {
        klass = window[name.singularize().camelize()];
      }
      if (!klass) {
        throw new Error("" + (Joosy.Module.__className(this)) + "> class can not be detected for '" + name + "' mapping");
      }
      return this.beforeLoad(function(data) {
        if (!Joosy.Module.hasAncestor(klass, Joosy.Resources.Base)) {
          klass = klass();
        }
        return this.__map(data, name, klass);
      });
    };

    Base.build = function(data) {
      var id, klass, shim, _base, _base1;
      if (data == null) {
        data = {};
      }
      klass = this.prototype.__entityName;
      (_base = Joosy.Resources.Base).identity || (_base.identity = {});
      (_base1 = Joosy.Resources.Base.identity)[klass] || (_base1[klass] = {});
      shim = this.__makeShim(this.prototype);
      if (Object.isNumber(data) || Object.isString(data)) {
        id = data;
        data = {};
        data[shim.__primaryKey] = id;
      }
      if (Joosy.Resources.Base.identity) {
        id = data[shim.__primaryKey];
        if ((id != null) && Joosy.Resources.Base.identity[klass][id]) {
          shim = Joosy.Resources.Base.identity[klass][id];
          shim.load(data);
        } else {
          Joosy.Resources.Base.identity[klass][id] = shim;
          this.apply(shim, [data]);
        }
      } else {
        this.apply(shim, [data]);
      }
      return shim;
    };

    Base.grab = function(form) {
      return this.build({}).grab(form);
    };

    Base.__makeShim = function(proto) {
      var key, shim, value;
      shim = function() {
        return shim.__call.apply(shim, arguments);
      };
      if (shim.__proto__) {
        shim.__proto__ = proto;
      } else {
        for (key in proto) {
          value = proto[key];
          shim[key] = value;
        }
      }
      shim.constructor = this;
      return shim;
    };

    function Base(data) {
      if (data == null) {
        data = {};
      }
      this.__fillData(data, false);
    }

    Base.prototype.id = function() {
      var _ref;
      return (_ref = this.data) != null ? _ref[this.__primaryKey] : void 0;
    };

    Base.prototype.knownAttributes = function() {
      return Object.keys(this.data);
    };

    Base.prototype.load = function(data, clear) {
      if (clear == null) {
        clear = false;
      }
      if (clear) {
        this.data = {};
      }
      this.__fillData(data);
      return this;
    };

    Base.prototype.grab = function(form) {
      var data, field, _i, _len, _ref;
      data = {};
      _ref = $(form).serializeArray();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        if (!data[field.name]) {
          data[field.name] = field.value;
        } else {
          if (!(data[field.name] instanceof Array)) {
            data[field.name] = [data[field.name]];
          }
          data[field.name].push(field.value);
        }
      }
      return this.load(data);
    };

    Base.prototype.__get = function(path) {
      var target;
      target = this.__callTarget(path, true);
      if (!target) {
        return void 0;
      } else if (target[0] instanceof Joosy.Resources.Base) {
        return target[0](target[1]);
      } else {
        return target[0][target[1]];
      }
    };

    Base.prototype.__set = function(path, value) {
      var target;
      target = this.__callTarget(path);
      if (target[0] instanceof Joosy.Resources.Base) {
        target[0](target[1], value);
      } else {
        target[0][target[1]] = value;
      }
      this.trigger('changed');
      return null;
    };

    Base.prototype.__callTarget = function(path, safe) {
      var keyword, part, target, _i, _len;
      if (safe == null) {
        safe = false;
      }
      if (path.has(/\./) && (this.data[path] == null)) {
        path = path.split('.');
        keyword = path.pop();
        target = this.data;
        for (_i = 0, _len = path.length; _i < _len; _i++) {
          part = path[_i];
          if (safe && (target[part] == null)) {
            return false;
          }
          target[part] || (target[part] = {});
          if (target instanceof Joosy.Resources.Base) {
            target = target(part);
          } else {
            target = target[part];
          }
        }
        return [target, keyword];
      } else {
        return [this.data, path];
      }
    };

    Base.prototype.__call = function(path, value) {
      if (arguments.length > 1) {
        return this.__set(path, value);
      } else {
        return this.__get(path);
      }
    };

    Base.prototype.__fillData = function(data, notify) {
      if (notify == null) {
        notify = true;
      }
      this.raw = data;
      if (!this.hasOwnProperty('data')) {
        this.data = {};
      }
      Joosy.Module.merge(this.data, this.__prepareData(data));
      if (notify) {
        this.trigger('changed');
      }
      return null;
    };

    Base.prototype.__prepareData = function(data) {
      var bl, name, _i, _len, _ref;
      if (Object.isObject(data) && Object.keys(data).length === 1 && this.__entityName) {
        name = this.__entityName.camelize(false);
        if (data[name]) {
          data = data[name];
        }
      }
      if (this.__beforeLoads != null) {
        _ref = this.__beforeLoads;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bl = _ref[_i];
          data = bl.call(this, data);
        }
      }
      return data;
    };

    Base.prototype.__map = function(data, name, klass) {
      var entry;
      if (Object.isArray(data[name])) {
        entry = new (klass.prototype.__collection())(klass);
        entry.load(data[name]);
        data[name] = entry;
      } else if (Object.isObject(data[name])) {
        data[name] = klass.build(data[name]);
      }
      return data;
    };

    return Base;

  })(Joosy.Module);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Joosy.Resources.Collection = (function(_super) {
    __extends(Collection, _super);

    Collection.include(Joosy.Modules.Events);

    Collection.beforeLoad = function(action) {
      return this.prototype.__beforeLoad = action;
    };

    Collection.model = function(model) {
      return this.prototype.model = model;
    };

    function Collection(model, findOptions) {
      if (model == null) {
        model = false;
      }
      this.findOptions = findOptions;
      if (model) {
        this.model = model;
      }
      this.data = [];
      if (!this.model) {
        throw new Error("" + (Joosy.Module.__className(this)) + "> model can't be empty");
      }
    }

    Collection.prototype.load = function(entities, notify) {
      if (notify == null) {
        notify = true;
      }
      if (this.__beforeLoad != null) {
        entities = this.__beforeLoad(entities);
      }
      this.data = this.modelize(entities);
      if (notify) {
        this.trigger('changed');
      }
      return this;
    };

    Collection.prototype.modelize = function(collection) {
      var root,
        _this = this;
      root = this.model.prototype.__entityName.pluralize();
      if (!(collection instanceof Array)) {
        collection = collection != null ? collection[root.camelize(false)] : void 0;
        if (!(collection instanceof Array)) {
          throw new Error("Can not read incoming JSON");
        }
      }
      return collection.map(function(x) {
        return _this.model.build(x);
      });
    };

    Collection.prototype.each = function(callback) {
      return this.data.each(callback);
    };

    Collection.prototype.size = function() {
      return this.data.length;
    };

    Collection.prototype.find = function(description) {
      return this.data.find(description);
    };

    Collection.prototype.sortBy = function() {
      var params, _ref;
      params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.data).sortBy.apply(_ref, params);
    };

    Collection.prototype.findById = function(id) {
      return this.data.find(function(x) {
        return x.id().toString() === id.toString();
      });
    };

    Collection.prototype.at = function(i) {
      return this.data[i];
    };

    Collection.prototype.remove = function(target, notify) {
      var index, result;
      if (notify == null) {
        notify = true;
      }
      if (Object.isNumber(target)) {
        index = target;
      } else {
        index = this.data.indexOf(target);
      }
      if (index >= 0) {
        result = this.data.splice(index, 1)[0];
        if (notify) {
          this.trigger('changed');
        }
      }
      return result;
    };

    Collection.prototype.add = function(element, index, notify) {
      if (index == null) {
        index = false;
      }
      if (notify == null) {
        notify = true;
      }
      if (typeof index === 'number') {
        this.data.splice(index, 0, element);
      } else {
        this.data.push(element);
      }
      if (notify) {
        this.trigger('changed');
      }
      return element;
    };

    return Collection;

  })(Joosy.Module);

}).call(this);
(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Joosy.Resources.RESTCollection = (function(_super) {
    __extends(RESTCollection, _super);

    function RESTCollection() {
      _ref = RESTCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RESTCollection.include(Joosy.Modules.Log);

    RESTCollection.include(Joosy.Modules.Events);

    RESTCollection.prototype.reload = function(options, callback) {
      var _this = this;
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = false;
      }
      if (Object.isFunction(options)) {
        callback = options;
        options = {};
      }
      return this.model.__query(this.model.collectionPath(options, this.__source), 'GET', options.params, function(error, data, xhr) {
        if (data != null) {
          _this.load(data);
        }
        return typeof callback === "function" ? callback(error, _this, data, xhr) : void 0;
      });
    };

    RESTCollection.prototype.load = function() {
      var args, res,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      res = RESTCollection.__super__.load.apply(this, args);
      this.data.each(function(x) {
        return x.__source = _this.__source;
      });
      return res;
    };

    return RESTCollection;

  })(Joosy.Resources.Collection);

}).call(this);
(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Joosy.Resources.REST = (function(_super) {
    __extends(REST, _super);

    function REST() {
      _ref = REST.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    REST.requestOptions = function(options) {
      return this.prototype.__requestOptions = options;
    };

    REST.source = function(location) {
      return this.__source = location;
    };

    REST.__atWrapper = function() {
      var args, definer,
        _this = this;
      definer = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (args.length === 1 && Object.isArray(args[0])) {
        return this.__atWrapper.apply(this, [definer].concat(__slice.call(args[0])));
      } else {
        return definer(function(clone) {
          clone.__source = args.reduce(function(path, arg) {
            return path += arg instanceof Joosy.Resources.REST ? arg.memberPath() : arg.replace(/^\/?/, '/');
          }, '');
          return clone.__source += '/' + _this.prototype.__entityName.pluralize();
        });
      }
    };

    REST.at = function() {
      var args,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.__atWrapper.apply(this, [function(callback) {
        var Clone, _ref1;
        return Clone = (function(_super1) {
          __extends(Clone, _super1);

          function Clone() {
            _ref1 = Clone.__super__.constructor.apply(this, arguments);
            return _ref1;
          }

          callback(Clone);

          return Clone;

        })(_this);
      }].concat(__slice.call(args)));
    };

    REST.prototype.at = function() {
      var args, _ref1,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.constructor).__atWrapper.apply(_ref1, [function(callback) {
        return Object.tap(_this.constructor.__makeShim(_this), callback);
      }].concat(__slice.call(args)));
    };

    REST.prototype.__collection = function() {
      var named;
      named = this.__entityName.camelize().pluralize() + 'Collection';
      if (window[named]) {
        return window[named];
      } else {
        return Joosy.Resources.RESTCollection;
      }
    };

    REST.prototype.__interpolatePath = function(source, ids) {
      if (!Object.isArray(ids)) {
        ids = [ids];
      }
      return ids.reduce(function(path, id) {
        if (id instanceof Joosy.Resources.REST) {
          id = id.id();
        }
        return path.replace(/:[^\/]+/, id);
      }, source);
    };

    REST.collectionPath = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.prototype).collectionPath.apply(_ref1, args);
    };

    REST.prototype.collectionPath = function(ids, options) {
      var path, source;
      if (ids == null) {
        ids = [];
      }
      if (options == null) {
        options = {};
      }
      if (Object.isObject(ids)) {
        options = ids;
        ids = [];
      }
      if (options.url) {
        return options.url;
      }
      source = this.__source || this.constructor.__source;
      if (source) {
        path = this.__interpolatePath(source, ids);
      } else {
        path = '/';
        if (this.constructor.__namespace__.length > 0) {
          path += this.constructor.__namespace__.map(String.prototype.underscore).join('/') + '/';
        }
        path += this.__entityName.pluralize();
      }
      if (options.action) {
        path += "/" + options.action;
      }
      return path;
    };

    REST.memberPath = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref1 = this.prototype).memberPath.apply(_ref1, args);
    };

    REST.prototype.memberPath = function(ids, options) {
      var action, id, path;
      if (ids == null) {
        ids = [];
      }
      if (options == null) {
        options = {};
      }
      if (Object.isObject(ids)) {
        options = ids;
        ids = [];
      }
      if (options.url) {
        return options.url;
      }
      if (!Object.isArray(ids)) {
        ids = [ids];
      }
      id = this.id() || ids.pop();
      action = options.action;
      ids.push(this.id());
      path = this.collectionPath(ids, Object.merge(options, {
        action: void 0
      })) + ("/" + id);
      if (action != null) {
        path += "/" + action;
      }
      return path;
    };

    REST.get = function(options, callback) {
      var _ref1;
      _ref1 = this.prototype.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.__query(this.collectionPath(options), 'GET', options.params, callback);
    };

    REST.post = function(options, callback) {
      var _ref1;
      _ref1 = this.prototype.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.__query(this.collectionPath(options), 'POST', options.params, callback);
    };

    REST.put = function(options, callback) {
      var _ref1;
      _ref1 = this.prototype.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.__query(this.collectionPath(options), 'PUT', options.params, callback);
    };

    REST["delete"] = function(options, callback) {
      var _ref1;
      _ref1 = this.prototype.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.__query(this.collectionPath(options), 'DELETE', options.params, callback);
    };

    REST.prototype.get = function(options, callback) {
      var _ref1;
      _ref1 = this.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.constructor.__query(this.memberPath(options), 'GET', options.params, callback);
    };

    REST.prototype.post = function(options, callback) {
      var _ref1;
      _ref1 = this.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.constructor.__query(this.memberPath(options), 'POST', options.params, callback);
    };

    REST.prototype.put = function(options, callback) {
      var _ref1;
      _ref1 = this.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.constructor.__query(this.memberPath(options), 'PUT', options.params, callback);
    };

    REST.prototype["delete"] = function(options, callback) {
      var _ref1;
      _ref1 = this.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.constructor.__query(this.memberPath(options), 'DELETE', options.params, callback);
    };

    REST.find = function(where, options, callback) {
      var id, path, result, _ref1,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = false;
      }
      _ref1 = this.prototype.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      id = Object.isArray(where) ? where.last() : where;
      if (id === 'all') {
        result = new (this.prototype.__collection())(this, options);
        path = this.collectionPath(where, options);
      } else {
        result = this.build(id);
        path = this.memberPath(where, options);
      }
      if (Object.isArray(where) && where.length > 1) {
        result.__source = this.collectionPath(where);
      }
      this.__query(path, 'GET', options.params, function(error, data, xhr) {
        if (data != null) {
          result.load(data);
        }
        return typeof callback === "function" ? callback(error, result, data, xhr) : void 0;
      });
      return result;
    };

    REST.__query = function(path, method, params, callback) {
      var options;
      options = {
        url: path,
        data: params,
        type: method,
        cache: false,
        dataType: 'json'
      };
      if (Object.isFunction(callback)) {
        options.success = function(data, _, xhr) {
          return callback(false, data, xhr);
        };
        options.error = function(xhr) {
          return callback(xhr);
        };
      } else {
        Joosy.Module.merge(options, callback);
      }
      if (this.prototype.__requestOptions instanceof Function) {
        this.prototype.__requestOptions(options);
      } else if (this.prototype.__requestOptions) {
        Joosy.Module.merge(options, this.prototype.__requestOptions);
      }
      return $.ajax(options);
    };

    REST.prototype.reload = function(options, callback) {
      var _ref1,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = false;
      }
      _ref1 = this.__extractOptionsAndCallback(options, callback), options = _ref1[0], callback = _ref1[1];
      return this.constructor.__query(this.memberPath(options), 'GET', options.params, function(error, data, xhr) {
        if (data != null) {
          _this.load(data);
        }
        return typeof callback === "function" ? callback(error, _this, data, xhr) : void 0;
      });
    };

    REST.prototype.__extractOptionsAndCallback = function(options, callback) {
      if (Object.isFunction(options)) {
        callback = options;
        options = {};
      }
      return [options, callback];
    };

    return REST;

  })(Joosy.Resources.Base);

}).call(this);
(function() {


}).call(this);
