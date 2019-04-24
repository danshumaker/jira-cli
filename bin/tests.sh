#!/bin/bash -xv

# Test Examples
# NOTE: the send command requires a manual edit of this file to work - Change the -x password

j='bin/jira.js'
$j -h
$j config -c
$j config -t ~/.jira-cmd-config-default.json
$j ls
$j create -v -p MTIE -T 1 -S "Test issue" -d "test description"
$j new MTIE -S "Testing from jira-cli"
$j release -p MTIE -d "Test release unreleased" 2.9.9
$j release -p MTIE -d "Test release released" 3.0.0 -r
$j jql "assignee = dshumaker and status not in (\"Closed\", \"Ready for Client\") and sprint in openSprints()"
$j jql 'key in ( "MTIE-1102","MTIE-1508","MTIE-1530","MTIE-1545","MTIE-1566","MTIE-1584","MTIE-1617" ) ORDER BY Key'
$j jql 'project = "MTI: E-Commerce" AND Status = "In Test" AND (fixVersion is EMPTY OR fixVersion not in releasedVersions()) ORDER BY Rank'

# This test must be last because of the lame Control-C mandate -- TODO fix this
$j send -i 12306 -p MTIE -v 14140 -n 2.2.5 -t dshumaker@phase2technology.com -s 'MTIE Code Release to AWS servers 2.2.5' -f 'Dan Shumaker' -e /Users/dan/work/Phase2/mti/mti_cms/admin/release_template.html -x you-need-to-change-this-to-your-gmail-password
