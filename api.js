// var console = require('console'),
fs = require('fs');
http = require('http');
url = require('url');
const Configurations = require('./libs/configurations.js');
const Router = require('./libs/routing.js');
const Authentication = require('./libs/authentication.js');

var configurations = new Configurations();
var routing = new Router();
var auth = new Authentication();

http.createServer(function (req, res) {
  // just some helper functions for writing things
  // to the browser in JSON format.
  function message_response(message, statusNumber) {
    if(!statusNumber) statusNumber = 200;
    write_response({message: message}, statusNumber);
  }

  function error_response(message, statusNumber) {
    if(!statusNumber) statusNumber = 400;
    write_response({error: message}, statusNumber);
  }

  function write_response(output, statusNumber) {
    if(!statusNumber) { statusNumber = 200; }
    res.writeHead(statusNumber, {'Content-Type': 'text/json'});
    res.end(JSON.stringify(output));
  };

  // now that we have our response functions, we can provide an error handler
  // to the router as well.
  routing.error = error_response;

  // Setup a default / route.
  routing.get('/', function(args) {
    if(!auth.authenticate(null, null, args.token))
    { error_response("You are not logged in."); }
    message_response("Hello world!");
  })

  // Setup the credential related routes.
  routing.post('/login', function(args) {
    write_response(auth.login(args.data.email, args.data.password));
  })

  routing.post('/logout', function(args) {
    write_response(auth.logout(args.token));
  });

  // Setup resources routes for /configurations
  routing.get('/configurations', function(args) {
    if(!auth.authenticate(null, null, args.token))
    { error_response("You are not logged in."); }

    write_response(configurations.index());
  });

  routing.resources(
    "/configurations",
    configurations,
    function(args) {
      if(!auth.authenticate(null, null, args.token))
      { error_response("You are not logged in."); }
    },
    function(output) {
      if(output) { write_response(output); }
      else { error_response ("Configuration not found", 404); }
    }
  );


  // get the request data
  var json_data = '';
  req.on('data', (chunk) => {
    json_data += chunk.toString();
  });
  req.on('end', () => {
    try {
      if(json_data) {
        json_data = JSON.parse(json_data);
      } else {
        json_data = {};
      }
    } catch(e) {
      error_response("Invalid JSON data: " + json_data);
    }

    // handle the route
    routing.process(req, json_data);
  })

}).listen(8000);
