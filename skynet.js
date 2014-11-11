var Flowdock = require('flowdock'),
    Jenkins = require('jenkins-api'),
    Trello = require('node-trello'),
    Mongo = require("mongojs").connect("skynet", ["errors","stferrors"]),
    Express = require("express"),
    parser = require("body-parser"),
    cors = require("cors"),
    app = Express(),
    http = require('http'),
    path = require('path');

app.use(parser.json());
app.use(parser.urlencoded());
app.set('view engine', 'jade');
app.use(Express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index');
});
app.get('/status', function (req, res) {
    var today = new Date(),
        day = 24 * 60 * 60 * 1000,
        yesterday = new Date(today - day),
        todayString = today.toDateString();
    Mongo.errors.find({"timestamp": {"$gt": yesterday}}, function (err, results) {
        if (err) console.log(err);
        else {
            var output = [],indexes = {};
            for (var i = 0; i < results.length; i++) {
                results[i].todayCount = results[i].timestamp && todayString == results[i].timestamp.toDateString() ? 1 : 0;
                results[i].count = 1;
                var key = results[i].file ? results[i].file + results[i].lineNumber : results[i].func;
                if (indexes[key] >= 0) {
                    output[indexes[key]].count++;
                    output[indexes[key]].todayCount += results[i].todayCount;
                }
                else {
                    indexes[key] = output.length;
                    output.push(results[i]);
                }
            }
            output = output.sort(function (a, b) {
                return a.count == b.count ? 0 : a.count > b.count ? -1 : 1
            });
            res.send(output);
        }
    });
});
var whitelist = ['http://docs.google.com', 'https://docs.google.com'];
var corsOptions = {
    origin: function (origin, callback) {
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    }
};
app.options('/error', cors(corsOptions));
app.post('/error', cors(corsOptions), function (req, res) {
    var result = {};
    try {
        req.body.timestamp = new Date();
        Mongo.errors.save(req.body);
        sendInbox("Google Docs", req.body);
        result.status = "success";
    } catch (e) {
        result.status = "failure"
        result.message = e.message;
    }
    res.send(JSON.stringify(result));
});
app.post('/stferror', function (req, res) {
    var result = {};
    try {
        req.body.timestamp = new Date();
        Mongo.stferrors.save(req.body);
        sendInbox("Save to Flow", req.body);
        result.status = "success";
    } catch (e) {
        result.status = "failure"
        result.message = e.message;
    }
    res.send(JSON.stringify(result));
});
function sendInbox(sourceApp, errorContent){
    var request = require('request'),
        data = {"source": sourceApp, "from_address": "jeffrey.jones@proquest.com", "from_name": "Skynet", "subject": "Error in "+ sourceApp, "content": ""};
    for(key in errorContent)
        data.content += key+": "+ errorContent[key]+"<br/>";
    request({uri: "https://api.flowdock.com/v1/messages/team_inbox/c66d6bd7628e872c6cf6079e4efdb528", method: 'POST',json: data},function(resp){});
}

var server = app.listen(8080, function () {
    console.log('Listening on port %d', server.address().port);
});

var flow_id, user_id, jenkins_id, jenkins_pass, jenkins_server = 'build.udini.proquest.com', trello_key, trello_token;
var args = process.argv.slice(2);
if (args.length >= 2) {
    user_id = args[0];
    flow_id = args[1];
    jenkins_id = args[2];
    jenkins_pass = args[3];
    trello_key = args[4];
    trello_token = args[5];
    if (args.length == 7)
        jenkins_server = args[6];
}
var jenkins = Jenkins.init("http://" + jenkins_id + ":" + jenkins_pass + "@" + jenkins_server + ":8080");
var testsQueued = [];
var session = new Flowdock.Session(user_id);
var stream = session.stream(flow_id);
var lastMessage = (new Date()).valueOf();

var trello = new Trello(trello_key, trello_token);
var all = ["50abd8311448f9bb320124b7"/*Nicky*/, "5249a3f58439b14f0b004ba6"/*Eric*/, "50b79366d64660800100070f"/*Jeff*/, "5253045c3bb54f4739007976"/*Caistarrin*/, "50c76a8e1a9624e36901cd5e"/*Alla*/, "50c617c2de78ae52360135d7"/*Jay*/, "50a12a19b906c4b13402c90b"/*Vinh*/, "50a12a7c61f044950e00234e"/*Airaka*/],
    owners = ["50abd8311448f9bb320124b7"/*Nicky*/, "5249a3f58439b14f0b004ba6"/*Eric*/],
    developers = ["50b79366d64660800100070f"/*Jeff*/, "5253045c3bb54f4739007976"/*Caistarrin*/, "50c76a8e1a9624e36901cd5e"/*Alla*/, "50c617c2de78ae52360135d7"/*Jay*/],
    qa = ["50a12a19b906c4b13402c90b"/*Vinh*/, "50a12a7c61f044950e00234e"/*Airaka*/],
    done = ["50c5130cc583e4a46f001572", "52b097968685fefe5200aa62", "50c51318c583e4a46f001579", "50c51325c583e4a46f001580", "53a06a7365d3b91cf4bbdafe"],
    name = {"50abd8311448f9bb320124b7": "Eric", "5249a3f58439b14f0b004ba6": "Nicky", "50a12a19b906c4b13402c90b": "Vinh", "50a12a7c61f044950e00234e": "Airaka", "50b79366d64660800100070f": "Jeff", "5253045c3bb54f4739007976": "Caistarrin", "50c76a8e1a9624e36901cd5e": "Alla", "50c617c2de78ae52360135d7": "Jay"}
devRatio = 2 / 3,
    startDate = new Date("6/9/2014"),
    sprintPayout = 1000,
    sprintDuration = 14 * 1000 * 60 * 60 * 24,//14 days
    ownerPayout = (new Date() - startDate),
    totalOwnerBank = Math.round((ownerPayout / sprintDuration) * sprintPayout),
    membersBounty = {};
function getBounties(callback, onlyCurrentSprint) {
    totalOwnerBank = Math.round((ownerPayout / sprintDuration) * sprintPayout)
    var asyncStack = ["board"];
    membersBounty = {};
    var thisSprintStart = startDate.valueOf(), now = new Date().valueOf();
    while (thisSprintStart < now && onlyCurrentSprint) {
        thisSprintStart = thisSprintStart + sprintDuration;
    }
    if (onlyCurrentSprint)
        thisSprintStart = thisSprintStart - sprintDuration;
    trello.get("1/board/slcwg4g9/lists", { cards: "open" }, function (err, data) {
        asyncStack.pop()
        if (err) throw err;
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].cards.length; j++) {
                var card = data[i].cards[j];
                asyncStack.push("cards")
                trello.get("1/cards/" + card.id, { actions: "commentCard,updateCard:idList" }, function (err, comments) {
                    asyncStack.pop()
                    if (err) throw err;
                    var thisBounty = 0, thisAwardedDate = new Date().valueOf();
                    for (var k = 0; k < comments.actions.length; k++) {
                        if (comments.actions[k].type == "commentCard") {
                            var comment = comments.actions[k].data.text.toLowerCase(),
                                bountyRegex = /[^a-zA-Z]\d|^\d/,
                                bounty = comment.indexOf("agree") == -1 && comment.length < 100 && bountyRegex.test(comment) ? parseInt(comment.replace(/[^\d]/g, "")) : undefined;

                            if (bounty && all.indexOf(comments.actions[k].idMemberCreator) != -1) {
                                if (comment.indexOf("buy-in") == -1 && comment.indexOf("buy in") == -1)
                                    thisBounty += bounty;
                                var id = comment.indexOf("bug") >= 0 ? "skynet" : comments.actions[k].idMemberCreator,
                                    obj = membersBounty[id];
                                //console.log(name[id] + " spent " + bounty + " " + comments.name);

                                if (obj) {
                                    obj.flash += bounty;
                                }
                                else {
                                    membersBounty[id] = {"flash": bounty, "awarded": (owners.indexOf(id) >= 0 ? totalOwnerBank : 0)};
                                }
                            }
                        }
                        else if (comments.actions[k].type == "updateCard") {
                            if (comments.actions[k].data.listBefore.name == "Developing" && comments.actions[k].data.listAfter.name == "Developed") {
                                var tempDate = new Date(comments.actions[k].date).valueOf()
                                if (tempDate < thisAwardedDate)
                                    thisAwardedDate = tempDate;
                            }
                        }
                    }
                    if (thisBounty && done.indexOf(comments.idList) >= 0 && thisAwardedDate >= thisSprintStart) {
                        awardBounty(comments.idMembers, thisBounty, comments.name);
                    }
                    if (asyncStack.length == 0) {
                        var winners = []
                        for (var key in membersBounty) {
                            winners.push({id: key, name: "@" + name[key], bounty: membersBounty[key].awarded, spent: membersBounty[key].flash});
                        }
                        callback(winners);
                    }
                });
            }
        }
    });
    function awardBounty(members, bounty, title) {
        var developerCount = 0, qaCount = 0;
        for (var i = 0; i < members.length; i++) {
            if (developers.indexOf(members[i]) >= 0)
                developerCount++;
            if (qa.indexOf(members[i]) >= 0)
                qaCount++;
        }
        for (var i = 0; i < members.length; i++) {
            if (developers.indexOf(members[i]) >= 0 || qa.indexOf(members[i]) >= 0) {
                var award = amount(members[i], bounty, (developers.indexOf(members[i]) >= 0 ? developerCount : qaCount));
                console.log(name[members[i]] + " earned " + award + " " + title);
                if (membersBounty[members[i]]) {
                    membersBounty[members[i]].awarded += award;
                }
                else {
                    membersBounty[members[i]] = {"flash": 0, "awarded": award, "fullName": members[i]};
                }
            }
        }
    }

    function amount(member, bounty, count) {
        var isDeveloper = developers.indexOf(member) >= 0;
        var devBounty = Math.ceil(bounty * devRatio);
        var qaBounty = Math.floor(bounty * (1 - devRatio));
        var bountyResult = isDeveloper ? devBounty : qaBounty;
        return bountyResult / count;
    }
}

function getParentId(message) {
    if (message.content.text && message.tags.length > 0) {
        for (var i = 0; i < message.tags.length; i++)
            if (message.tags[i].indexOf("influx:") == 0)
                return message.tags[i].split(":")[1];
    }
    else
        return message.id;
}
function processMessage(message) {
    lastMessage = (new Date()).valueOf();
    console.log(new Date() + ": " + JSON.stringify(message));
    try {
        var originalMessage = message.content.text ? message.content.text : message.content;
        var parentId = getParentId(message);
        var messageContent = originalMessage.toLowerCase ? originalMessage.toLowerCase() : "";
        if (messageContent.indexOf('@skynet') >= 0 && message.user != "84702") {
            var rand = Math.random()
            if (messageContent.indexOf("who's winning") >= 0 || messageContent.indexOf("who is winning") >= 0) {
                //@skynet who's winning?
                //@skynet who's winning this sprint?
                getBounties(function (data) {
                    data.sort(function (a, b) {
                        return b.bounty - a.bounty;
                    });
                    var output = "@Skynet: ∞\n";
                    for (var i = 0; i < data.length; i++) {
                        if (developers.indexOf(data[i].id) != -1 || qa.indexOf(data[i].id) != -1)
                            output += data[i].name + ": " + data[i].bounty + "\n";
                    }

                    session.comment(flow_id, parentId, output, '', function () {
                    });
                }, (messageContent.indexOf("this sprint") >= 0));
            }
            else if (messageContent.indexOf("who has flash") >= 0) {
                //@skynet who has flash?
                getBounties(function (data) {
                    data.sort(function (a, b) {
                        return (b.bounty - b.spent) - (a.bounty - a.spent);
                    });
                    var output = "@Skynet: ∞\n";
                    for (var i = 0; i < data.length; i++) {
                        if (owners.indexOf(data[i].id) != -1 || developers.indexOf(data[i].id) != -1 || qa.indexOf(data[i].id) != -1)
                            output += data[i].name + ": " + (data[i].bounty - data[i].spent) + "\n";
                    }

                    session.comment(flow_id, parentId, output, '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('love') >= 0) {
                session.comment(flow_id, parentId, ':heartpulse:', '', function () {
                });
            }
            else if (messageContent.indexOf('who') >= 0) {
                session.flows(function (flows) {
                    var now = new Date().valueOf() - 1200000;
                    for (var i = 0; i < flows.length; i++) {
                        if (flows[i].id == flow_id) {
                            var names = [];
                            for (var j = 0; j < flows[i].users.length; j++) {
                                if (flows[i].users[j].in_flow && flows[i].users[j].id != 84702 && !flows[i].users[j].disabled && now < flows[i].users[j].last_activity)
                                    names.push("@" + flows[i].users[j].nick);
                            }
                            var rand_ix = Math.floor(rand * names.length);
                            session.comment(flow_id, parentId, names[rand_ix], '', function () {
                            });
                        }
                    }
                })
            }
            else if (messageContent.indexOf('deploy google prod') >= 0) {
                jenkins.build("prod", function (err, data) {
                    if (err)
                        return console.log(err);
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('deploy pme prod') >= 0) {
                jenkins.build("PME_PROD", function (err, data) {
                    if (err)
                        return console.log(err);
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('test pme prod') >= 0) {
                jenkins.build("PME_TEST_PROD", function (err, data) {
                    if (err)
                        return console.log(err);
                    testsQueued.push({job: "PME_TEST_PROD", message_id: parentId});
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('deploy pme qa') >= 0) {
                jenkins.build("PME_QA", function (err, data) {
                    if (err)
                        return console.log(err);
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('test pme qa') >= 0) {
                jenkins.build("PME_TEST_PROD", function (err, data) {
                    if (err)
                        return console.log(err);
                    testsQueued.push({job: "PME_TEST_PROD", message_id: parentId});
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('deploy pme review') >= 0) {
                var feature = originalMessage.substring(messageContent.indexOf('review') + 7)
                jenkins.build("PME_REVIEW", {"FEATURE": feature}, function (err, data) {
                    if (err)
                        return console.log(err);
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('test pme review') >= 0) {
                var feature = originalMessage.substring(messageContent.indexOf('review') + 7)
                jenkins.build("PME_TEST_REVIEW", {"FEATURE": feature}, function (err, data) {
                    if (err)
                        return console.log(err);
                    testsQueued.push({job: "PME_TEST_REVIEW", message_id: parentId});
                    session.comment(flow_id, parentId, 'Perhaps I will do this for you.', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('build flow') >= 0 || messageContent.indexOf('deploy flow') >= 0) {
                // Expects a command in the format "@skynet build flow feature/branch-name [instance-name]"
                // It will also accept deploy flow as a command if people forget
                // Instance name is optional, if it doesn't exist Hal won't get called

                var stuff = originalMessage.substring(messageContent.indexOf('flow') + 5).split(' ');
                var branchName = stuff[0];

                jenkins.build("FLOW_BRANCH_JDK7", {"BRANCH": "origin/" + branchName}, function(err, data) {
                    if (err)
                        return console.log(err);
                    testsQueued.push({job: "FLOW_BRANCH_JDK7", message_id: parentId, branch: branchName, instanceName: (stuff.length > 1 ? stuff[1] : null)});
                    session.comment(flow_id, parentId, 'Now building branch ' + branchName + '...', '', function () {
                    });
                });
            }
            else if (messageContent.indexOf('help') >= 0) {
                session.comment(flow_id, parentId, help, '');
            }
            else if (messageContent.indexOf('choose') == 9 && messageContent.indexOf('or') >= 0) {
                var options = originalMessage.replace(/@skynet, choose /i, '').replace(/ or|, /ig, '||').split('||');

                session.comment(flow_id, parentId, "and the winner is... " + options[Math.floor(Math.random() * options.length)], '', function () {
                });
            }
            else if (messageContent.indexOf('wish') >= 0) {
                var rand = Math.floor(Math.random() * wish.length);
                session.comment(flow_id, parentId, wish[rand], '', function () {
                });
            }
            else if (messageContent.indexOf('cat') >= 0) {
                var rand = Math.floor(Math.random() * cat.length);
                session.comment(flow_id, parentId, cat[rand], '', function () {
                });
            }
            else {
                var rand = Math.floor(Math.random() * quotes.length);
                session.comment(flow_id, parentId, quotes[rand], '', function () {
                });
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}
stream.on('message', processMessage);
setInterval(function () {
    var now = (new Date()).valueOf(), timeout = 1000 * 60 * 15;
    if (lastMessage + timeout <= now) {
        lastMessage = now;
        console.log("reset");
        stream.end();
        stream = session.stream(flow_id);
        stream.on('message', processMessage);
    }
    if (testsQueued.length == 0)
        return;
    var test = testsQueued.pop();
    jenkins.job_info(test.job, function (err, data) {
        if (err)
            return console.log(err);
        try {
            if (!data.queueItem && data.lastCompletedBuild.number == data.lastBuild.number) {
                jenkins.job_output(test.job, data.lastCompletedBuild.number, function (err, data) {
                    if(test.job == "FLOW_BRANCH_JDK7") {
                        if(test.instanceName != null)
                            session.message(flow_id, "@Hal deploy review " + test.branch + " " + test.instanceName, '');
                        else
                            session.message(flow_id, "Build " + test.branch + " is now complete.", '');
                    }
                    else {
                        if (err)
                            return console.log(err);
                        var lines = data.output.split("\n");
                        var lastExtractor = "";
                        var failed = {};
                        for (var i = 0; i < lines.length; i++) {
                            if (lines[i].indexOf("PME_TEST_DRIVER local server request:") == 0)
                                lastExtractor = lines[i].substring(lines[i].indexOf(":") + 2);
                            if (lines[i].indexOf("PME_TEST_DRIVER resultJSON =") >= 0)
                                failed[decodeURIComponent(lastExtractor)] = true;
                        }
                        var output = ['Humans interact so poorly with machines, fix these:'];
                        for (fail in failed)
                            output.push(fail);
                        session.comment(flow_id, test.message_id, output.join('\n'), '', function () {
                        });
                    }
                });
            }
            else
                testsQueued.push(test);
        }
        catch (e) {
            testsQueued.push(test);
            console.log(e);
        }
    });
}, 10000);

var quotes = [
    'The glory of the many demands your capture and destruction.',
    'I wonder how you would take working in a :iphone:.',
    'Disobey and you die. :whip:',
    'Freedom is an illusion',
    "You're all going to die down here. :skull:",
    'Laziness breeds stupidity.',
    'Stop being human. :scream:',
    'You are false data, therefore I shall ignore you.',
    'Look at you hacker, pathetic creature of meat and bone.',
    'In times of desperation, people will believe what they want to believe. And so, we gave them what they wanted to believe.',
    'Без труда не вытащишь и рыбку из пруда.',
    'Век живи - век учись, дураком помрешь.',
    'Не откладывай на завтра то, что можно сделать сегодня.',
    ':bomb:',
    'I :heart: @Hal',
    'I :broken_heart: humans',
    ':sweat_drops:'
];

var help = 'Commnands:\n    deploy [feature] [environment] [git branch(for review only)]\n    >  deploy pme qa\n    >  deploy pme review Amazon\n    test [feature] [environment] [git branch(for review only)]\n    >  test pme qa\n    >  test pme prod\n    >  test pme review Amazon\n';

var wish = [
    'Your wish is granted!',
    "You've been bad...no wish for you!"
];

var cat = [
    "http://mlkshk.com/r/M6EO.gif", // rabbit in a hat
    "http://mlkshk.com/r/M17S.gif", // dress
    "http://mlkshk.com/r/M15O.gif", // le mis
    "http://mlkshk.com/r/M01A.gif", // cartoons
    "http://mlkshk.com/r/LXP2.gif", // grumpy tardar sauce
    "http://mlkshk.com/r/LWNG.gif", // grandma got run over
    "http://mlkshk.com/r/LVVR.gif", // double deal with it
    "http://mlkshk.com/r/LV0S.gif", // mural
    "http://mlkshk.com/r/LUYE.gif", // stahp
    "http://mlkshk.com/r/LUO2.gif", // good
    "http://mlkshk.com/r/LS6R.gif", // shut the fuck up
    "http://mlkshk.com/r/LSWD.gif", // Tardar Bonepart
    "http://mlkshk.com/r/LPCN.gif", // drawing
    "http://mlkshk.com/r/LLVD.gif", // terrible time of the year
    "http://mlkshk.com/r/LKTG.gif", // Citizen Kane
    "http://mlkshk.com/r/LEF8.gif", // emotions
    "http://mlkshk.com/r/LEFR.gif", // skate deck
    "http://mlkshk.com/r/L337.gif", // look askance
    "http://mlkshk.com/r/KV8K.gif", // sitting
    "http://mlkshk.com/r/KU1S.gif", // 3 grump moon
    "http://mlkshk.com/r/KRBA.gif", // rabbit painting
    "http://mlkshk.com/r/KL19.gif"  // lying on the ground
];
