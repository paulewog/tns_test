/*
  This is a simple routing framework.  Usage:
    const Router = require('./libs/routing.js');
    var router = new Router(optional_error_handling_function);

  You can specify new routes using:
    router.post("/myroute", function myCallbackFunction(arguments) {} )
    router.get(...)
    router.delete(...)
    router.put(...)

  The callback function will be called with a single object as the argument.

  The object looks like this:
  {
    query_string_key: "query_string_value from, e.g., ?query_string_key=query_string_value",
    [...]
    data:  { this is a JSON parsed object from the request payload/body },
    token: "this is the value of the Authorization header of the request",
    my_route_key: "this is the value of /blah/:my_route_key"
  }

  Example: Given a POST request with { hi: "there" } as the body, /test/123?ice=crea as the URL,
    headers with an Authorization field value of "ABCD", and a matching route of "/test/:id",
    the object would look something like this:
  {
    data: {
      hi: "there",
    },
    id: "123",
    ice: "cream",
    token: "ABCD"
  }
*/
const querystring = require('querystring');
const inArray = function(array, value) {
  return array.indexOf(value) != -1;
}

var Router = function(error_callback) {
  if(error_callback) {
    this.error = error_callback;
  }
};

Router.prototype.error = function(message) {
  console.error("Error callback was not configured.  Error: " + message);
}
Router.prototype.routes = {};
Router.prototype.new = function(verb, route, callback) {
  verb = verb.toUpperCase();
  if(!(verb in this.routes)) {
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

// provide a way to quickly do a default (e.g., write out the JSON) function
// for all four default verbs and functions:
//   GET    /route      -> index
//   GET    /route/:id  -> show(x)
//   POST   /route      -> create
//   PUT    /route/:id  -> update
//   DELETE /route/:id  -> destroy
Router.prototype.resources = function(route_basis, object, pre_callback, post_callback) {
 this.new('GET', route_basis, function(args) {
   pre_callback(args);
   post_callback(object.index(args));
 });

 this.new('GET', route_basis + "/:id", function(args) {
   pre_callback(args);
   post_callback(object.show(args));
 });

 this.new('POST', route_basis, function(args) {
   pre_callback(args);
   post_callback(object.create(args));
 });

 this.new('PUT', route_basis + "/:id", function(args) {
   pre_callback(args);
   post_callback(object.update(args));
 });

 this.new('DELETE', route_basis + "/:id", function(args) {
   pre_callback(args);
   post_callback(object.destroy(args));
 });
};

Router.prototype.return_possible_routes = function(base_route) {
  var route_sections = base_route.split("/").slice(1);
  var possibilities = [base_route];
  for(var i in route_sections) {
    route_sections[i] = ":";
    var nr = "/" + route_sections.join("/");
    if(!inArray(possibilities, nr))
    { possibilities.push(nr); }
  }

  return possibilities;
}

Router.prototype.process = function(req, data) {
  var url_stuff = url.parse(req.url);
  var verb = req.method;
  var route = url_stuff.pathname;
  var args = {};
  if(url_stuff.search && url_stuff.search.length > 0 ) {
    args = querystring.parse(url_stuff.search.substr(1));
  }
  args.token = req.headers.authorization;
  args.data = data;

  if(! (verb in this.routes)) {
    this.error("The route " + route + " was not found.", 404)
  } else {
    // TODO: This doesn't really do what I would consider correct ordering
    // of the route lookups.
    // We need to find the route... it could be an exact match, but otherwise,
    // we need to search through each route that has a keyword matching in it,
    // such as /configurations/:id.
    // But we have to handle something like /configurations/:id/somethingelse
    // as well.

    /* /a/b/c
        /:/b/c  /:/:/c  /:/:/:
        /a/:/c  /:/:/c  /:/:/:
        /a/b/:  /:/b/:  /:/:/:
    */


    // put together all the permutations of the requested route.
    var permutations = [route];

    // slice(1) because it has a preceding /
    var route_parts = route.split("/").slice(1);
    for(var i = route_parts.length-1; i > 0; i--) {
      var orig = route_parts[i];
      route_parts[i] = ":";
      var base_route = "/" + route_parts.join("/");

      var routes = this.return_possible_routes(base_route);
      for(var j in routes) {
        if(!inArray(permutations, routes[j]))
        { permutations.push(routes[j]); }
      }
      route_parts[i] = orig;
    }

    var the_route = null;
    for(var r in this.routes[verb]) {
      // do a quick string comparison
      var r_parts = r.split("/").splice(1);
      var r_for_comparison = "";
      for(var i in r_parts) {
        if(r_parts[i].indexOf(":") == 0) {
          r_for_comparison += "/:";
        } else {
          r_for_comparison += "/" + r_parts[i];
        }
      }

      if(inArray(permutations, r_for_comparison))
      {
        // we have a winner.
        the_route = this.routes[verb][r];

        // update our args so they can get passed.
        for(var i in r_parts) {
          if(r_parts[i].indexOf(":") == 0) {
            var key = r_parts[i].substr(1);
            var value = route_parts[i];
            args[key] = value;
          }
        }
      }
    }

    if(!the_route) {
      this.error("The route " + route + " was not found.", 404)
    }
    else {
      the_route.callback(args);
    }
  }
}

module.exports = Router;
