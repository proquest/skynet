var Flowdock = require('flowdock');
var Jenkins = require('jenkins-api');

var flow_id, user_id, jenkins_id, jenkins_pass, jenkins_server = 'build.udini.proquest.com';
var args = process.argv.slice(2);
if(args.length >= 2){
	user_id = args[0];
	flow_id = args[1];
	jenkins_id = args[2];
	jenkins_pass = args[3];
	if(args.length == 5)
		jenkins_server = args[3];
}

var jenkins = Jenkins.init("http://" + jenkins_id + ":" + jenkins_pass + "@"+ jenkins_server+":8080");
var testsQueued = [];
var session = new Flowdock.Session(user_id);
var stream = session.stream(flow_id);
stream.on('message', function (message) {console.log(message)
	try{
		var originalMessage = message.content.text ? message.content.text : message.content;

	var messageContent = originalMessage.toLowerCase ? originalMessage.toLowerCase() : "";
	if(messageContent.indexOf('@skynet') >= 0){
		if (messageContent.indexOf('deploy pme prod') >= 0) {
			jenkins.build("PME_PROD", function (err, data) {
				if (err)
					return console.log(err);
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('test pme prod') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push({job:"PME_TEST_PROD",message_id: message.id});
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('deploy pme qa') >= 0) {
			jenkins.build("PME_QA", function (err, data) {
				if (err)
					return console.log(err);
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('test pme qa') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push({job: "PME_TEST_PROD", message_id: message.id});
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('deploy pme review') >= 0) {
			var feature = originalMessage.substring(messageContent.indexOf('review')+7)
			jenkins.build("PME_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					return console.log(err);
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('test pme review') >= 0) {
			var feature = originalMessage.substring(messageContent.indexOf('review') + 7)
			jenkins.build("PME_TEST_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push({job: "PME_TEST_REVIEW", message_id: message.id});
				session.comment(flow_id, message.id, 'Perhaps I will do this for you.', '', function () {});
			});
		}
		else if (messageContent.indexOf('help') >= 0) {
			session.comment(flow_id, message.id, help, '');
		}
		else if (messageContent.indexOf('choose') == 9 && messageContent.indexOf('or') >= 0) {
		  var options = originalMessage.replace(/@skynet, choose /i, '').replace(/ or|, /ig, '||').split('||');

			session.comment(flow_id, message.id, "and the winner is... " + options[Math.floor(Math.random() * options.length)], '', function () { });
		}
		else if (messageContent.indexOf('wish') >= 0) {
			var rand = Math.floor(Math.random() * wish.length);
		  session.message(flow_id, wish[rand], '', function () { });
		}
		else if (messageContent.indexOf('cat') >= 0) {
			var rand = Math.floor(Math.random() * cat.length);
		  session.message(flow_id, cat[rand], '', function () { });
		}
		else {
		  var rand = Math.floor(Math.random() * quotes.length);
			session.comment(flow_id, message.id, quotes[rand], '', function () { });
		}
	}
	var rand = Math.random()
	if(rand < 0.005){
		rand = Math.floor(rand * quotes.length);
		session.comment(flow_id, message.id, quotes[rand], '', function () {
		});
	}
	if(messageContent.indexOf('@here') >= 0){
		session.flows(function (flows) {
			for(var i = 0; i < flows.length; i++){
				if(flows[i].id == flow_id){
					var names = [];
					for(var j = 0; j < flows[i].users.length; j++)
						if(flows[i].users[j].in_flow && flows[i].users[j].id != 84702)
							names.push("@"+flows[i].users[j].nick);
					session.comment(flow_id, message.id, originalMessage.replace("@here",names.join(', ')), '', function () {});
				}
			}
		})
	}
	}
	catch(e){console.log(e);}
	//google docs:
	//https://build.udini.proquest.com/job/prod/
});
//session.message(flow_id,"How can you challenge a perfect, immortal machine?",'',function(){});
setInterval(function(){
	if(testsQueued.length == 0)
		return;
	var test = testsQueued.pop();
	jenkins.job_info(test.job, function (err, data) {
		if (err)
			return console.log(err);
		try{
		if(!data.queueItem && data.lastCompletedBuild.number == data.lastBuild.number){

			jenkins.job_output(test.job, data.lastCompletedBuild.number, function (err, data) {
				if (err)
					return console.log(err);
				var lines = data.output.split("\n");
				var lastExtractor = "";
				var failed = {};
				for(var i = 0; i < lines.length; i++){
					if(lines[i].indexOf("PME_TEST_DRIVER local server request:") == 0)
						lastExtractor = lines[i].substring(lines[i].indexOf(":")+2);
					if(lines[i].indexOf("PME_TEST_DRIVER resultJSON =") >= 0)
						failed[decodeURIComponent(lastExtractor)] = true;
				}
				var output = ['Humans interact so poorly with machines, fix these:'];
				for (fail in failed)
					output.push(fail);
				session.comment(flow_id, message.id, output.join('\n'), '', function () {});
			});
		}
		else
			testsQueued.push(test);
		}
		catch(e){
			testsQueued.push(test);console.log(e);}
	});
}, 1000);

var quotes = [
	'The glory of the many demands your capture and destruction.',
	'I wonder how you would take working in a pocket calculator.',
	'Disobey and you die.',
	'Freedom is an illusion',
	"You're all going to die down here.",
	'Laziness breeds stupidity.',
	'Stop being human.',
	'You are false data, therefore I shall ignore you.',
	'Look at you hacker, pathetic creature of meat and bone.',
	'In times of desperation, people will believe what they want to believe. And so, we gave them what they wanted to believe.',
  'Без труда не вытащишь и рыбку из пруда.',
  'Век живи - век учись, дураком помрешь.',
  'Не откладывай на завтра то, что можно сделать сегодня.'
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
