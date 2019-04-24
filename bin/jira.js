#!/usr/bin/env node

var requirejs = require('requirejs');

// API Documenation Links:
//
// Main API       : https://docs.atlassian.com/software/jira/docs/api/REST/8.1.0/
// Creating Issues: https://developer.atlassian.com/jiradev/jira-apis/about-the-jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-examples#JIRARESTAPIexamples-Creatinganissueusingcustomfields
// Issue Links    : https://docs.atlassian.com/jira/REST/server/?_ga=2.55654315.1871534859.1501779326-1034760119.1468908320#api/2/issueLink-linkIssues
// Required Fields: https://jira.mypaytm.com/rest/api/2/issue/createmeta?projectKeys=MDO&expand=projects.issuetypes.fields&
// Meta-data      : http://localhost:8080/rest/api/2/issue/JRA-13/editmeta
//

requirejs.config({
    baseUrl: __dirname
});

requirejs([
    'commander',
    '../lib/config',
    '../lib/auth',
    '../lib/jira/ls',
    '../lib/jira/describe',
    '../lib/jira/assign',
    '../lib/jira/fix',
    '../lib/jira/release',
    '../lib/jira/send',
    '../lib/jira/comment',
    '../lib/jira/create',
    '../lib/jira/sprint',
    '../lib/jira/transitions',
    '../lib/jira/worklog',
    '../lib/jira/link',
    '../lib/jira/watch',
    '../lib/jira/add_to_sprint',
    '../lib/jira/new',
    '../lib/jira/edit'
], function(program, config, auth, ls, describe, assign, fix, release, send, comment, create, sprint, transitions, worklog, link, watch, add_to_sprint, new_create, edit) {

    function finalCb(err) {
        if (err) {
            console.log(err.toString());
        }
        process.exit(1);
    }

    program
        .version('v1.0.0');

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
            transitions.start(issue);
        });

    program
        .command('stop <issue>')
        .description('Stop working on an issue.')
        .action(function(issue) {
            transitions.stop(issue);
        });

    program
        .command('review <issue> [assignee]')
        .description('Mark issue as being reviewed [by assignee(optional)].')
        .action(function(issue, assignee) {
            transitions.review(issue);
            if (assignee) {
                assign.to(issue, assignee);
            }
        });

    program
        .command('done <issue>')
        .option('-r, --resolution <name>', 'resolution name (e.g. \'Resolved\')', String)
        .option('-t, --timeSpent <time>', 'how much time spent (e.g. \'3h 30m\')', String)
        .description('Mark issue as finished.')
        .action(function(issue, options) {
            if (options.timeSpent) {
                worklog.add(issue, options.timeSpent, "auto worklog", new Date());
            }
            transitions.done(issue, options.resolution);
        });

    program
        .command('invalid <issue>')
        .description('Mark issue as finished.')
        .action(function(issue) {
            transitions.invalid(issue, options);
        });

    program
        .command('mark <issue>')
        .description('Mark issue as.')
        .action(function(issue) {
            transitions.makeTransition(issue, finalCb);
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
        .command('jql [query]')
        .description('Run JQL query')
        .option('-c, --custom <name>', 'Filter by custom jql saved in jira config', String)
        .option('-s, --custom_sql <name>', 'Filter by custom alasql saved in jira config', String)
        .option('-j, --json <value>', 'Output in json', String, 0)
        .action(function(query, options) {
            if (options.custom_sql) {
                ls.aggregateResults(query, options, finalCb);
            } else {
                ls.jqlSearch(query, options, finalCb);
            }
        });

    program
        .command('link <from> <to> [link_value]')
        .description('link issues')
        .action(function(from, to, link_value, options) {
            link(from, to, link_value, options, finalCb);
        });

    program
        .command('search <term>')
        .description('Find issues.')
        .action(function(query) {
            ls.search(query, finalCb);
        });


    program
        .command('assign <issue> [user]')
        .description('Assign an issue to <user>. Provide only issue# to assign to me')
        .action(function(issue, user) {
            if (user) {
                user = config.user_alias[user];
                assign.to(issue, user);
            } else {
                assign.me(issue);
            }
        });

    program
        .command('watch <issue> [user]')
        .description('Watch an issue to <user>. Provide only issue# to watch to me')
        .action(function(issue, user) {
            if (user) {
                user = config.user_alias[user];
                watch.to(issue, user);
            } else {
                watch.me(issue);
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
                comment.to(issue, text);
            } else {
                comment.show(issue);
            }
        });

    program
        .command('show <issue>')
        .description('Show info about an issue')
        .option('-o, --output <field>', 'Output field content', String)
        .action(function(issue, options) {
            if (options.output) {
                describe.show(issue, options.output);
            } else {
                describe.show(issue);
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
            worklog.show(issue);
        });

    program
        .command('worklogadd <issue> <timeSpent> [comment]')
        .description('Log work for an issue')
        .option("-s, --startedAt [value]", "Set date of work (default is now)")
        .action(function(issue, timeSpent, comment, p) {
            var o = p.startedAt || new Date().toString(),
                s = new Date(o);
            worklog.add(issue, timeSpent, comment, s);
        }).on('--help', function() {
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
            create.newIssue(project, options);
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
        .option('-v --verbose', 'Verbose debugging output')
        .action(function(key, options) {
            options.key = key;
            new_create.create(options, finalCb);
        });

    program
        .command('config')
        .description('Change configuration')
        .option('-c, --clear', 'Clear stored configuration')
        .option('-t, --template <template>', 'Start config with this given template', String)
        .option('-v, --verbose', 'verbose debugging output')
        .action(function(options) {
            if (options.clear) {
                auth.clearConfig();
            } else {
                auth.setup(options);
            }
        }).on('--help', function() {
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
        .description('Works with sprint boards\n' +
            '\t\t\t\tWith no arguments, displays all rapid boards\n' +
            '\t\t\t\tWith -r argument, attempt to find a single rapid board\n ' +
            '\t\t\t\tand display its active sprints\n' +
            '\t\t\t\tWith both -r and -s arguments\n ' +
            '\t\t\t\tattempt to get a single rapidboard/ sprint and show its issues. If\n ' +
            '\t\t\t\ta single sprint board isnt found, show all matching sprint boards\n')
        .option('-r, --rapidboard <name>', 'Rapidboard to show sprints for', String)
        .option('-s, --sprint <name>', 'Sprint to show the issues', String)
        .option('-a, --add <projIssue> ', 'Add project issue to sprint', String)
        .option('-i, --sprintId <sprintId> ', 'Id of the sprint which you want your issues to be added to', String)
        .option('-j, --jql <jql> ', 'jql of the issues which you want to add to the sprint', String)
        .action(function(options) {
            if (options.add) {
                add_to_sprint.addIssuesViaKey(options, finalCb);
            } else if (options.jql) {
                add_to_sprint.addAllJqlToSprint(options, finalCb)
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
                fix.append(issue, version);
            } else {
                fix.to(issue, version);
            }
        });

    program
        .command('release <version>')
        .description('Create a FixVersion/Release (see release -h for more details)')
        .option('-p, --project <name>', 'Project', String)
        .option('-d, --description <name>', 'Description', String)
        .option('-r, --released', 'Set released to true - default is false')
        .action(function(version, options) {
            release.create(version, options);
        });

    program
        .command('send')
        .description('Send email report (see send -h for more details)')
        .option('-i, --projectId <id>', 'Project ID', String)
        .option('-p, --project_prefix <XX>', 'Project Prefix', String)
        .option('-v, --version <number>', 'Version ID Number', String)
        .option('-n, --name <name>', 'release name', String)
        .option('-f, --from <name>', 'from name', String)
        .option('-t, --to <name>', 'recipient email', String)
        .option('-s, --subject <name>', 'email subject', String)
        .option('-x, --password <password>', 'email password', String)
        .option('-e, --template <file>', 'email template', String)
        .action(function(options) {
            send.send(options);
        });

    program.parse(process.argv);

    if (program.args.length === 0) {
        console.log("\nYour first step is to run the config option.\n");
        program.help();
    }

});
