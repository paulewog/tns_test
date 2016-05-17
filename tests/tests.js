// A simple test framework.
var Tests = function() {};
Tests.prototype.tests = [];
Tests.prototype.test = function(name, testcase) {
  this.tests.push({name: name, execute: testcase});
};

Tests.prototype.stats = {
  current: 0,
  passed: 0,
  failed: 0,
  failures: []
};

Tests.prototype.post_execute = function(result) {
  var tc = this.tests[this.stats.current];
  if(result.failed)
  {
    this.stats.failed++;
    console.error("  FAIL: " + result.error);
    this.stats.failures.push({name: tc.name, error: result.error});
  } else {
    this.stats.passed++;
    console.log("  PASS")
  }

  this.stats.current++;
  if(this.stats.current > this.tests.length-1) { this.finished(); }
  else { this.execute_next(); }
};

Tests.prototype.execute = function() {
  this.stats.passed = 0;
  this.stats.failed = 0;
  this.stats.current = 0;
  this.execute_next();
};

Tests.prototype.execute_next = function() {
  var tc = this.tests[this.stats.current];
  console.log("\n* Starting test: " + tc.name);
  var self = this;
  try {
    tc.execute(function(result) { self.post_execute(result); });
  } catch(e) {
    self.stats.failed++;
    console.error("  ERROR: " + e.toString());
    self.stats.failures.push({name: tc.name, error: e.toString()});
  }
};

Tests.prototype.finished = function() {
  console.log(`\n\nTestcase Results\n${this.stats.passed} passed, ${this.stats.failed} failed`);
  // console.log("PASSED: " + this.stats.passed);
  // console.log("FAILED: " + this.stats.failed);

  if(this.stats.failures.length > 0) {
    console.log("\n** ERRORS **")
    for(var i in this.stats.failures) {
      var f = this.stats.failures[i];
      console.log(f.name + ": " + f.error);
    }
  }
};

module.exports = Tests;
