var Configurations = function() {};

// we will pretend that the row id is the ID for now.
Configurations.prototype.configurations = [];
for(var i=0; i<100; i++) {
  conf = {
    "id": i,
    "name": `host${i}`,
    "hostname": `my_host_${i}.example.com`,
    "port": 1000+i,
    "username": `user${i}`
  }
  Configurations.prototype.configurations.push(conf);
}

Configurations.prototype._get = function(id) {
  for(var i in this.configurations) {
    if(this.configurations[i].id == id)
    { return this.configurations[i]; }
  }
  return null;
}

Configurations.prototype._save = function(conf) {
  for(var i in this.configurations) {
    if(this.configurations[i].id == conf.id)
    { this.configurations[i] = conf; break; }
  }
  return null;
};

Configurations.prototype._delete = function(id) {
  var conf = null; var position = -1;
  for(var i in this.configurations) {
    if(this.configurations[i].id == id)
    { conf = this.configurations[i]; position = i; }
  }

  if(conf) {
    this.configurations.splice(position, 1);
  }
  return conf;
};

Configurations.prototype._map = function(field) {
  return this.configurations.map(function(c, i) {
    return { index: i, value: c[field] }
  });
};

Configurations.prototype._expand = function(mapped) {
  var confs = this.configurations;
  return mapped.map(function(x) { return confs[x.index]; });
}

Configurations.prototype.index = function(args) {
  if(!args) args = {};

  // TODO: Change this to some sort of database.
  var start = 0
  var limit = parseInt(args.limit) || 10;
  if("page" in args) start = (parseInt(args.page)-1) * limit;
  var end = start + limit;

  // sort by id by default.
  var field = args.sort || "id";
  var ascending = true;
  if("ascending" in args)
  { if(args.ascending.toLowerCase().indexOf("false") != -1) ascending = false; }

  var confs = this._map(field);
  confs.sort(function(a, b) {
    if(a.value < b.value) { return -1; }
    else if(a.value > b.value) { return 1; }
    else { return 0; }
  });
  if(!ascending) confs.reverse();

  return this._expand(
    confs.slice(start, end)
  );
};

Configurations.prototype.create = function(args) {
  args.data.id = this.configurations.length;
  this.configurations.push(args.data);
  return this._get(args.data.id);
};

Configurations.prototype.show = function(args) {
  return this._get(args.id);
};

Configurations.prototype.update = function(args) {
  var conf = this._get(args.id);
  if(!conf) { return null; }
  for(i in Object.keys(conf))
  {
    var key = Object.keys(conf)[i];
    if(key in args.data)
    { conf[key] = args.data[key]; }
  }
  this._save(conf);
  return this._get(args.id);
};

Configurations.prototype.destroy = function(args) {
  return this._delete(args.id);
};

module.exports = Configurations;
