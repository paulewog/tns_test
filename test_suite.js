// run some tests.
const http = require('http');
const Tests = require('./libs/tests.js');

var test_suite = new Tests();

const HOSTNAME = "localhost";
const PORT = "8000";
function rest_request(verb, route, payload, headers, callback) {
  if(!headers) { headers = {}; }
  var response = "";
  var req = http.request({
      method: verb,
      hostname: HOSTNAME,
      port: PORT,
      path: route,
      headers: headers
    },
    (res) => {
      var chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        response = Buffer.concat(chunks).toString();
        try { response = JSON.parse(response); } catch(e) { }
        callback(response);
      });
    }
  );

  if(payload)
  {
    req.write(JSON.stringify(payload));
  }

  // req.on('close')
  req.end();
}

function error(rv, msg) {
  rv.failed = true;
  rv.error = msg;
  return rv;
};

// make sure we require a login.
test_suite.test("Login required test", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/", null, null, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(!("error" in result)) {
      done(error(rv, "Response did not include the error message"))
    } else {
      done(rv);
    }
  });
});

// make sure we can login and get an auth
// we will store this for future tests.
var headers = {};

test_suite.test("Login test", function(done) {
  var rv = { failed: false }
  var result = rest_request("POST", "/login", {email: "admin@example.com", password: "changeme"}, null, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(!("token" in result)) {
      done(error(rv, "Response did not include the appropriate token"))
    } else {
      headers.Authorization = result.token;
      done(rv);
    }
  });
});

test_suite.test("Logged in test", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/", null, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if("error" in result) {
      done(error(rv, "Response included an error: " + result.error))
    } else {
      done(rv);
    }
  });
});

test_suite.test("Logout test", function(done) {
  var rv = { failed: false }
  var result = rest_request("POST", "/logout", {}, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if("error" in result) {
      done(error(rv, "Response included an error: " + result.error))
    } else {
      done(rv);
    }
  });
});

test_suite.test("Should require login again", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/", null, null, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(!("error" in result)) {
      done(error(rv, "Response did not include the error message"))
    } else {
      done(rv);
    }
  });
});

test_suite.test("Getting configurations should require login", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/configurations", null, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(!("error" in result)) {
      done(error(rv, "Response did not include the error message"))
    } else {
      done(rv);
    }
  });
});

test_suite.test("Login ... again ... test", function(done) {
  var rv = { failed: false }
  var result = rest_request("POST", "/login", {email: "admin@example.com", password: "changeme"}, null, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(!("token" in result)) {
      done(error(rv, "Response did not include the appropriate token"))
    } else {
      headers.Authorization = result.token;
      done(rv);
    }
  });
});

test_suite.test("List configurations, defaulting to 10 test", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/configurations", null, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(result.length != 10) {
      done(error(rv, "Response did not have 10 configurations."));
    } else {
      done(rv);
    }
  });
});

test_suite.test("List configurations 20 per page", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/configurations?limit=20", null, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(result.length != 20) {
      done(error(rv, "Response did not have 20 configurations."));
    } else {
      done(rv);
    }
  });
});

test_suite.test("List configurations 5 per page, page 2", function(done) {
  var rv = { failed: false }
  var result = rest_request("GET", "/configurations?limit=5&page=2", null, headers, (result) => {
    if(!result) {
      done(error(rv, "Response was null"));
    } else if(result.length != 5) {
      done(error(rv, "Response did not have 20 configurations."));
    } else if(result[0].id != 5) {
      done(error(rv, `Response did not start with ID number 5, it was ${result[0].id}.`));
    } else {
      done(rv);
    }
  });
});

test_suite.test("Add a new configuration", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "POST",
      "/configurations",
      {
        name: "new_host",
        hostname: "new_hostname.example.com",
        port: 2000,
        username: "crazyuser"
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?limit=150&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result.length != 101) {
        done(error(rv, "Response did not have 101 configurations."));
      } else if(result[0].id != 100) {
        done(error(rv, `Response did not start with ID number 101, it was ${result[0].id}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Update a configuration name", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/1",
      {
        name: "all_new",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations/1", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result.id != 1) {
        done(error(rv, `Response did not have ID number 1, it was ${result.id}.`));
      } else if(result.name != "all_new") {
        done(error(rv, `Response did not have the right name "all_new", it was ${result.name}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Delete a configuration", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "DELETE",
      "/configurations/1",
      null,
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations/1", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(!("error" in result)) {
        done(error(rv, `Response did not have an error`));
      } else {
        step3();
      }
    });
  };

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?limit=150&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result.length != 100) {
        done(error(rv, "Response did not have 100 configurations."));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by name", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/2",
      {
        name: "a",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=name", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].name != "a") {
        done(error(rv, `Response did not have the right name "a", it was ${result[0].name}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by name descending", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/2",
      {
        name: "zzzz",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=name&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].name != "zzzz") {
        done(error(rv, `Response did not have the right name "zzzz", it was ${result[0].name}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by hostname", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/3",
      {
        hostname: "a",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=hostname", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].hostname != "a") {
        done(error(rv, `Response did not have the right hostname "a", it was ${result[0].hostname}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by hostname descending", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/3",
      {
        hostname: "zzzz",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=hostname&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].hostname != "zzzz") {
        done(error(rv, `Response did not have the right hostname "zzzz", it was ${result[0].hostname}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by port", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/3",
      {
        port: 1,
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=port", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].id != 3 || result[0].port != 1) {
        done(error(rv, `Response did not have the id 3 and port 1, it was ID${result[0].id} and port${result[0].port}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by port", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/3",
      {
        port: 9999,
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=port&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].id != 3 || result[0].port != 9999) {
        done(error(rv, `Response did not have the id 3 and port 9999, it was ID${result[0].id} and port${result[0].port}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by username", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/4",
      {
        username: "a",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=username", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].id != 4 || result[0].username != "a") {
        done(error(rv, `Response did not have the id 4 and username a, it was ID${result[0].id} and port${result[0].username}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});

test_suite.test("Sort by username descending", function(done) {
  var rv = { failed: false }

  var step1 = function(rv) {
    var result = rest_request(
      "PUT",
      "/configurations/4",
      {
        username: "z",
      },
      headers,
      (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(! result.id) {
        done(error(rv, "Response did not have an ID."));
      } else {
        step2(rv);
      }
    });
  }

  var step2 = function(rv) {
    var result = rest_request("GET", "/configurations?sort=username&ascending=false", null, headers, (result) => {
      if(!result) {
        done(error(rv, "Response was null"));
      } else if(result[0].id != 4 || result[0].username != "z") {
        done(error(rv, `Response did not have the id 4 and username z, it was ID${result[0].id} and port${result[0].username}.`));
      } else {
        done(rv);
      }
    });
  };

  step1(rv);
});


test_suite.execute();
