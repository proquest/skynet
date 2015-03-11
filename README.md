# Skynet

Skynet is a tool that uses Node for some team automation by:
  * monitoring [Flowdock](https://www.flowdock.com/)
  * starting build on [Jenkins](http://jenkins-ci.org/)
  * reporting on card in [Trello](https://trello.com)
  
There are no keys in this repo so all private config must be pass on the command line when start the process.

```bash
node skynet.js $FLOWDOCK_USERID $FLOWDOCK_ROOM $JENKINS_ID $JENKINS_PASS $TRELLO_KEY $TRELLO_TOKEN
```

We're planning to integrate it with a differnt codebase soon and will then remove or deprecate this repo. 

