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

// just some helper functions for writing things
// to the browser in JSON format.
function message_response(message, statusNumber, res) {
  if(!statusNumber) statusNumber = 200;
  write_response({message: message}, statusNumber, res);
}

function error_response(message, statusNumber, res) {
  if(!statusNumber) statusNumber = 400;
  write_response({error: message}, statusNumber, res);
}

function write_response(output, statusNumber, res) {
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
  { error_response("You are not logged in.", 401, args.response); }
  message_response("Hi!", 200, args.response);
});

// Setup the credential related routes.
routing.post('/login', function(args) {
  write_response(auth.login(args.data.email, args.data.password), null, args.response);
});

routing.post('/logout', function(args) {
  if(!auth.authenticate(null, null, args.token))
  { error_response("You are not logged in.", 401, args.response); }
  write_response(auth.logout(args.token), null, args.response);
});

routing.resources(
  "/configurations",
  configurations,
  function(args) {
    if(!auth.authenticate(null, null, args.token))
    { error_response("You are not logged in.", 401, args.response); }
  },
  function(args, output) {
    if(output) { write_response(output, null, args.response); }
    else { error_response ("Configuration not found", 404, args.response); }
  }
);

http.createServer(function (req, res) {
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
    routing.process(req, json_data, res);
  })

}).listen(8000);
