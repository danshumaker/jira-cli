#!/usr/bin/env node
//
// Main API       : https://docs.atlassian.com/software/jira/docs/api/REST/8.1.0/
// Creating Issues: https://developer.atlassian.com/jiradev/jira-apis/about-the-jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-examples#JIRARESTAPIexamples-Creatinganissueusingcustomfields
// Issue Links    : https://docs.atlassian.com/jira/REST/server/?_ga=2.55654315.1871534859.1501779326-1034760119.1468908320#api/2/issueLink-linkIssues
// Required Fields: https://jira.mypaytm.com/rest/api/2/issue/createmeta?projectKeys=MDO&expand=projects.issuetypes.fields&
// Meta-data      : http://localhost:8080/rest/api/2/issue/JRA-13/editmeta
//

var program = require('commander');
var config = require('../lib/config');
var auth = require('../lib/auth');
var ls = require('../lib/jira/ls');
var describe = require('../lib/jira/describe');
var assign = require('../lib/jira/assign');
var fix = require('../lib/jira/fix');
var release = require('../lib/jira/release');
var send = require('../lib/jira/send');
var comment = require('../lib/jira/comment');
var sprint = require('../lib/jira/sprint');
var transitions = require('../lib/jira/transitions');
var worklog = require('../lib/jira/worklog');
var link = require('../lib/jira/link');
var watch = require('../lib/jira/watch');
var addToSprint = require('../lib/jira/addToSprint');
var newCreate = require('../lib/jira/new');
var _set = require('lodash.set');

var edit = require('../lib/jira/edit');

const pkg = require('../package.json');
const CreateIssue = require('../lib/jira/create');
const JiraClient = require('jira-connector');

function finalCb(err) {
  if (err) {
    console.log(err.toString());
  }

  process.exit(1);
}

// this code will ensure that in the event we're putting a large response to stdout (large json response for example)
//   that the process does not shutdown before stdout has finished processing the response
// https://github.com/pnp/cli-microsoft365/issues/1266
if (process.stdout._handle) {
  process.stdout._handle.setBlocking(true);
}

program.version(pkg.version);
program
  .command('ls')
  .description('List my issues')
  .option('-p, --project <name>', 'Filter by project', String)
  .option('-t, --type <name>', 'Filter by type', String)
  .option('-v, --verbose', 'verbose output')
  .action(function(options) {
    if (options.project) {
      ls.showByProject(options, finalCb);
    } else {
      ls.showAll(options, finalCb);
    }
  });
program
  .command('start <issue>')
  .description('Start working on an issue.')
  .action(function(issue) {
    transitions.start(issue, finalCb);
  });
program
  .command('stop <issue>')
  .description('Stop working on an issue.')
  .action(function(issue) {
    transitions.stop(issue, finalCb);
  });
program
  .command('review <issue> [assignee]')
  .description('Mark issue as being reviewed [by assignee(optional)].')
  .action(function(issue, assignee) {
    transitions.review(issue, finalCb);

    if (assignee) {
      assign.to(issue, assignee, finalCb);
    }
  });
program
  .command('done <issue>')
  .option('-r, --resolution <name>', 'resolution name (e.g. \'Resolved\')', String)
  .option('-t, --timeSpent <time>', 'how much time spent (e.g. \'3h 30m\')', String)
  .description('Mark issue as finished.')
  .action(function(issue, options) {
    if (options.timeSpent) {
      worklog.add(issue, options.timeSpent, 'auto worklog', new Date(), finalCb);
    }

    transitions.done(issue, options.resolution, finalCb);
  });
program
  .command('invalid <issue>')
  .description('Mark issue as finished.')
  .action(function(issue,options) {
    transitions.invalid(issue, options, finalCb);
  });
program
  .command('mark <issue> [transitionId]')
  .description('Mark issue as.')
  .action(function(issue, transitionId) {
    if (transitionId) { // if a transitionId is provided, go straight to transitioning the story
      transitions.doTransition(issue, transitionId, function (err) {
        if (err && err.includes('(502)')) { // if we get a 502 it's most likely because the transition isn't valid
          console.log('transition (' +  transitionId + ') not valid for this issue (' + issue + ')');
        } else {
          console.log('marked issue with transition ' + transitionId);
        }
        finalCb(err);
      });
    } else {
      transitions.makeTransition(issue, finalCb);
    }
  });
program
  .command('edit <issue> [input]')
  .description('edit issue.')
  .action(function(issue, input) {
    if (input) {
      edit.editWithInputPutBody(issue, input, finalCb);
    } else {
      edit.edit(issue, finalCb);
    }
  });
program
  .command('running')
  .description('List issues in progress.')
  .action(function() {
    ls.showInProgress(finalCb);
  });
program
  .command('jql <query>')
  .description('Run JQL query')
  .option('-c, --custom <name>', 'Filter by custom jql saved in jira config', String)
  .option('-s, --custom_sql <name>', 'Filter by custom alasql saved in jira config', String)
  .option('-j, --json <value>', 'Output in json', String, 0)
  .option('-v, --verbose', 'verbose output')
  .action(function(query, options) {
    if (options.custom_sql) {
      ls.aggregateResults(query, options, finalCb);
    } else if (options.json) {
      ls.jqlSearch(query, options, (err, issues) => {
        if (issues) {
          console.log(JSON.stringify(issues));
        }
        finalCb(err);
      });
    } else {
      ls.jqlSearch(query, options, finalCb);
    }
  });
program
  .command('link <from> <to> [linkValue]')
  .description('link issues')
  .action(function(from, to, linkValue, options) {
    link(from, to, linkValue, options, finalCb);
  });
program
  .command('search <term>')
  .description('Find issues.')
  .action(function(query) {
    ls.search(query, finalCb);
  });
program
  .command('assign <issue> [accountId]')
  .description(
    'Assign an issue to <user>. Provide only issue# to assign to me.\n' +
    'Use config (assign.unassignText) to choose what value to use to unassign an issue (default: \'null\').'
  )
  .action(function(issue, user) {
    if (user) {
      user = config.user_alias[user] || user;
      assign.to(issue, user, finalCb);
    } else {
      assign.me(issue, finalCb);
    }
  });
program
  .command('watch <issue> [user]')
  .description('Watch an issue to <user>. Provide only issue# to watch to me')
  .action(function(issue, user) {
    if (user) {
      user = config.user_alias[user];
      watch.to(issue, user, finalCb);
    } else {
      watch.me(issue, finalCb);
    }
  });
program
  .command('comment <issue> [text]')
  .description('Comment an issue.')
  .action(function(issue, text) {
    if (text) {
      //replace name in comment text if present in user_alias config
      //if vikas is nickname stored in user_alias config for vikas.sharma
      //then 'vikas has username [~vikas] [~ajitk] [~mohit] becomes 'vikas has username [~vikas.sharma] [~ajitk] [~mohit]
      //names which do not match any alias are not changed
      text = text.replace(/\[~(.*?)\]/g, function(match, tag, index) {
        if (config.user_alias[tag]) {
          return '[~' + config.user_alias[tag] + ']';
        } else {
          return tag;
        }
      });
      comment.to(issue, text, finalCb);
    } else {
      comment.show(issue, finalCb);
    }
  });
program
  .command('show <issue>')
  .description('Show info about an issue')
  .option('-o, --output <field>', 'Output field content', String)
  .action(function(issue, options) {
    if (options.output) {
      describe.show(issue, options.output, cb);
    } else {
      describe.show(issue, null, cb);
    }
  });
program
  .command('open <issue>')
  .description('Open an issue in a browser')
  .action(function(issue, options) {
    describe.open(issue);
  });
program
  .command('worklog <issue>')
  .description('Show worklog about an issue')
  .action(function(issue) {
    worklog.show(issue, finalCb);
  });
program
  .command('worklogadd <issue> <timeSpent> [comment]')
  .description('Log work for an issue')
  .option('-s, --startedAt [value]', 'Set date of work (default is now)')
  .action(function(issue, timeSpent, comment, p) {
    var o = p.startedAt || new Date().toString(),
      s = new Date(o);
    worklog.add(issue, timeSpent, comment, s, finalCb);
  })
  .on('--help', function() {
    console.log('  Worklog Add Help:');
    console.log();
    console.log('    <issue>: JIRA issue to log work for');
    console.log('    <timeSpent>: how much time spent (e.g. \'3h 30m\')');
    console.log('    <comment> (optional) comment');
    console.log();
  });
program
  .command('create [project[-issue]]')
  .description('Create an issue or a sub-task')
  .option('-p, --project <project>', 'Rapid board on which project is to be created', String)
  .option('-P, --priority <priority>', 'priority of the issue', String)
  .option('-T --type <type>', 'NUMERIC Issue type', parseInt)
  .option('-s --subtask <subtask>', 'Issue subtask', String)
  .option('-S --summary <summary>', 'Issue Summary', String)
  .option('-d --description <description>', 'Issue description', String)
  .option('-a --assignee <assignee>', 'Issue assignee', String)
  .option('-v --verbose', 'Verbose debugging output')
  .action(function(project, options) {
    if (config && config.authNew) {
      const jira = new JiraClient({
        host: config.authNew.host,
        // eslint-disable-next-line camelcase
        basic_auth: {
          base64: config.authNew.token
        }
      });
      const _create = new CreateIssue(jira);
      _create.newIssue(project, options);
    }
  });
program
  .command('new [key]')
  .description('Create an issue or a sub-task')
  .option('-p, --project <project>', 'Rapid board on which project is to be created', String)
  .option('-P, --priority <priority>', 'priority of the issue', String)
  .option('-T --type <type>', 'Issue type', String)
  .option('-s --subtask <subtask>', 'Issue subtask', String)
  .option('-S --summary <summary>', 'Issue summary', String)
  .option('-d --description <description>', 'Issue description', String)
  .option('-c --component <component>', 'Issue component', String)
  .option('-l --label <label>', 'Issue label', String)
  .option('-a --assignee <assignee>', 'Issue assignee', String)
  .option(
    '-f, --field <fields...>',
    'Define custom fields from the command line in key=value pairs',
    (value, previous) => {
      let values = {...previous};
      if(!values) {
        values = {};
      }
      // we can accept , separated notation or multi argument 
      // i.e. -f "parent.id=156199" -f "issueType.id=10101" or -f "parent.id=156199, issueType.id=10101"
      for(const fields of value.split(',')) {
        // get a single key=value pair
        const fieldName = fields.split('=')[0];
        let fieldValue = fields.split('=')[1];

        if (parseInt(fieldValue)) {
          // if it's an integer let's treat it as such
          fieldValue = parseInt(fieldValue);
        } else {
          // trim any strings so jira matches them properly
          fieldValue = fieldValue.trim();
          // powershell is weird about strings so sometimes it will result in fieldValue = ''string''
          if(fieldValue.includes('\'')){
            fieldValue = fieldValue.replaceAll('\'', '');
          }
        }
        if(fieldName && fieldValue) {
          if (fieldName.includes('.')) {
            // if we've used dot notation let's create the full object path
            _set(values, fieldName, fieldValue);
          } else {
            values[fieldName.trim()] = fieldValue;
          }
        }
      }
      return values;
    }
  )
  .option('-v --verbose', 'Verbose debugging output')
  .action(function(key, options) {
    options.key = key;
    newCreate.create(options, finalCb);
  });
program
  .command('config')
  .description('Change configuration')
  .option('-c, --clear', 'Clear stored configuration')
  .option('-u, --url', 'Print url in config')
  .option('-t, --template <template>', 'Start config with this given template', String)
  .option('-v, --verbose', 'verbose debugging output')
  .action(function(options) {
    if (options.clear) {
      auth.clearConfig();
    } else {
      if (options.url) {
        console.log(config.auth.url);
      } else {
        auth.setup(options);
      }
    }
  })
  .on('--help', function() {
    console.log('  Config Help:');
    console.log();
    console.log('    Jira URL: https://foo.atlassian.net/');
    console.log('    Username: user (for user@foo.bar)');
    console.log('    Password: Your password');
    console.log('');
    console.log('WARNING:After three failed login attempts Atlassian forces a CAPTCHA login');
    console.log('WARNING:  which can only be done via the browser.');
  });
program
  .command('sprint')
  .description(
    'Works with sprint boards\n' +
      '\t\t\t\tWith no arguments, displays all rapid boards\n' +
      '\t\t\t\tWith -r argument, attempt to find a single rapid board\n ' +
      '\t\t\t\tand display its active sprints\n' +
      '\t\t\t\tWith both -r and -s arguments\n ' +
      '\t\t\t\tattempt to get a single rapidboard/ sprint and show its issues. If\n ' +
      '\t\t\t\ta single sprint board isnt found, show all matching sprint boards\n'
  )
  .option('-r, --rapidboard <name>', 'Rapidboard to show sprints for', String)
  .option('-s, --sprint <name>', 'Sprint to show the issues', String)
  .option('-a, --add <projIssue> ', 'Add project issue to sprint', String)
  .option('-i, --sprintId <sprintId> ', 'Id of the sprint which you want your issues to be added to', String)
  .option('-j, --jql <jql> ', 'jql of the issues which you want to add to the sprint', String)
  .action(function(options) {
    if (options.add) {
      addToSprint.addIssuesViaKey(options, finalCb);
    } else if (options.jql) {
      addToSprint.addAllJqlToSprint(options, finalCb);
    } else {
      sprint(options.rapidboard, options.sprint, finalCb);
    }
  });
program
  .command('fix <issue> <version>')
  .description('Set FixVersion of an issue to <version>.')
  .option('-a, --append', 'Append fix instead of over-write')
  .action(function(issue, version, options) {
    if (options.append) {
      fix.append(issue, version, finalCb);
    } else {
      fix.to(issue, version, finalCb);
    }
  });
program
  .command('release <version>')
  .description('Create a FixVersion/Release (see release -h for more details)')
  .option('-p, --project <name>', 'Project', String)
  .option('-d, --description <name>', 'Description', String)
  .option('-r, --released', 'Set released to true - default is false')
  .action(function(version, options) {
    release.create(version, options, finalCb);
  });
program
  .command('send')
  .description('Send email report (see send -h for more details)')
  .option('-i, --projectId <id>', 'Project ID', String)
  .option('-p, --project_prefix <XX>', 'Project Prefix', String)
  .option('-v, --version <number>', 'Version ID Number', String)
  .option('-n, --name <name>', 'release name', String)
  .option('-f, --from <name>', 'from name', String)
  .option('-t, --to <name>', 'comma seperated email list', String)
  .option('-c, --cc <name>', 'comma seperated email list', String)
  .option('-s, --subject <name>', 'email subject', String)
  .option('-x, --password <password>', 'email password', String)
  .option('-e, --template <file>', 'email template', String)
  .action(function(options) {
    send.send(options);
  });
program.parse(process.argv);

if (program.args.length === 0) {
  console.log('\nYour first step is to run the config option.\n');
  program.help();
}
