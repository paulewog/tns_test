// create a simple routing framework.
// probably outside.
const querystring = require('querystring');
var Router = function(error_callback) {
  this.error = error_callback;
};

Router.prototype.routes = {};
Router.prototype.new = function(verb, route, callback) {
  verb = verb.toUpperCase();
  if(!this.routes.verb) {
    this.routes[verb] = {};
  }

  this.routes[verb][route] = {
    route: route,
    verb: verb,
    callback: callback
  };

  return this.routes[verb][route];
}

Router.prototype.post = function(route, callback) {
  return this.new('POST', route, callback);
}

Router.prototype.get = function(route, callback) {
  return this.new('GET', route, callback);
}

Router.prototype.delete = function(route, callback) {
  return this.new('DELETE', route, callback);
}

Router.prototype.put = function(route, callback) {
  return this.new('PUT', route, callback);
}

Router.prototype.process = function(req, data) {
  var url_stuff = url.parse(req.url);
  var verb = req.method;
  var route = url_stuff.pathname;
  var args = querystring.parse(url_stuff.search);
  args.token = req.headers.authorization;
  args.data = data;

  // TODO: Parse the query string better.  Probably a lot of libraries to do that :)
  if(! (verb in this.routes) || !(route in this.routes[verb])) {
    if(this.error) {
      this.error("The route " + route + " was not found.", 404)
    } else {
      console.error("Could not find the error() function.");
    }
  } else {
    this.routes[verb][route].callback(args);
  }
}

module.exports = Router;
