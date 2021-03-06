// create a simple authentication mechanism for login and logout.
var Authentication = function() {};
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

// for mockup purposes, create some users and just use this hash as the "database"
Authentication.prototype.users = {
  'admin@example.com': {
    name: 'Admin User',
    password: crypto.createHash('sha256', 'changeme').digest('hex'),
    lastLoggedIn: null,
    token: ''
  },

  'testuser@example.com': {
    name: 'Test User',
    password: crypto.createHash('sha256', 'testuser').digest('hex'),
    lastLoggedIn: null,
    token: '' // an API token
  }
};

// user_by_token(): returns a user ... by the token.  fancy that!
Authentication.prototype.user_by_token = function(token) {
  if(!token)
  { return null; }

  for(var i in this.users) {
    var user = this.users[i];
    if(user.token == token)
    { return user; }
  }

  return null;
}

// authenticate(): returns true for successful authentication, false if not.
Authentication.prototype.authenticate = function(email, password, token) {
  var user = this.users[email];
  if(user && password && user.password == crypto.createHash('sha256', password).digest('hex'))
  { return true; }
  else if(user && token && user.token == token)
  { return true; }
  else if(token) {
    var user = this.user_by_token(token);
    if(user && user.token == token)
    { return true; }
  }

  return false;
}

// login(): returns a hash:
// { success: true/false, message: string, token: string }
// The token is only there on a successful login.
Authentication.prototype.login = function(email, password) {
  returnValue = { success: false, message: "Invalid credentials", token: null };
  if(!email || !password) return returnValue;

  // This would be replaced with the appropriate database call, of course.
  var user = this.users[email];
  if(!user) {
    return returnValue;
  } else {
    if(!this.authenticate(email, password))
    {
      return returnValue;
    }
    else {
      returnValue.success = true;
      returnValue.message = "Successfully logged in";

      // generate an API token on successful login if it is null or is more than
      // 24 hours old.
      // ... this would depend on how we would want to do user security... e.g.,
      // a token based security like this, where the token is inserted into
      // the header on subsequent calls, or use sessions to store the login information.
      if(user.token == '' || !user.lastLoggedIn || Date.now() > user.lastLoggedIn + (60 * 60 * 24))
      {
        const buf = crypto.randomBytes(64);
        user.token = buf.toString('hex');
      }

      returnValue.token = user.token;

      // would update the real persistent database.
      user.lastLoggedIn = Date.now();


      return returnValue;
    }

  }
}

// logout(): returns a hash:
// { success: true/false, message: string
Authentication.prototype.logout = function(token) {
  // need to make sure they are authenticated so you can't just randomly logout anyone.
  var returnValue = { success: false, message: "Not authenticated." };
  user = this.user_by_token(token);
  if(!user) {
    returnValue.message = "Invalid user or user is not logged in.";
    return returnValue;
  } else if(this.authenticate(null, null, token)) {
    // logout.
    user.token = '';
    returnValue.success = true;
    returnValue.message = "You have been logged out.";
    return returnValue;
  } else {
    return returnValue;
  }
}

module.exports = Authentication;
