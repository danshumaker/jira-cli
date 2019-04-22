/*global path, define*/
define([
  'path',
  'fs'
], function (path,fs) {

  var dest_dir = '/.jira-cmd';
  cfile = getCfgFile(dest_dir);

  if (fs.existsSync(cfile)) {
    return {
      cfgPath: path.basename(cfile),
      cfgFilePath: cfile,
      auth: {},
      options: {}
    };
  }
  return createCfgFile(dest_dir);

  function createCfgFile(dest) {
    currentwd = process.cwd();
    console.log("\n\nDid not find config file from JIRA_CONFIG environment variable or " + currentwd + dest + "/config.json.\n");
    console.log("Setting one up in "+  currentwd + dest + "/config.json\n");
    dest_dir = currentwd + dest;
    cfile = dest_dir + '/config.json';
    if (! fs.existsSync(dest_dir)) {
      console.log("Making directory ", dest_dir);
      fs.mkdir(dest_dir, function(e) { console.log(e)} );
    }
    return {
      cfgPath: path.basename(cfile),
      cfgFilePath: cfile,
      auth: {},
      options: {}
    };
  }

  function getCfgPath() {
    return this.dest_dir;
  }

  function getCfgFile(dest_dir) {
    cfile = process.env['JIRA_CONFIG'];

    if (fs.existsSync(cfile)) {
      return cfile;
    } else {
      cwd_config = process.cwd() + dest_dir + '/config.json';
      if (fs.existsSync(cwd_config)) {
        return cwd_config;
      } else {
        return false;
      }
    }
  }

});
