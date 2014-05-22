var Flowdock = require('flowdock');
var Jenkins = require('jenkins-api');

var flow_id, user_id, jenkins_id, jenkins_pass;
var args = process.argv.slice(2);
if(args.length >= 2){
	user_id = args[0];
	flow_id = args[1];
	jenkins_id = args[2];
	jenkins_pass = args[3];
}

var jenkins = Jenkins.init("http://" + jenkins_id + ":" + jenkins_pass + "@build.udini.proquest.com:8080");
var testsQueued = [];
var session = new Flowdock.Session(user_id);
var stream = session.stream(flow_id);
stream.on('message', function (message) {
	var message = message.content.toLowerCase ? message.content.toLowerCase() : "";
	if(message.indexOf('@skynet') >= 0){
		if (message.indexOf('deploy pme prod') >= 0) {
			jenkins.build("PME_PROD", function (err, data) {
				if (err)
					return console.log(err);
				console.log(data)
			});
		}
		else if (message.indexOf('test pme prod') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push("PME_TEST_PROD");
				console.log(data)
			});
		}
		else if (message.indexOf('deploy pme qa') >= 0) {
			jenkins.build("PME_QA", function (err, data) {
				if (err)
					return console.log(err);

				console.log(data)
			});
		}
		else if (message.indexOf('test pme qa') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push("PME_TEST_PROD");
				console.log(data)
			});
		}
		else if (message.indexOf('deploy pme review') >= 0) {
			var feature = message.content.substring(message.indexOf('review')+7)
			jenkins.build("PME_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					return console.log(err);

				console.log(data)
			});
		}
		else if (message.indexOf('test pme review') >= 0) {
			var feature = message.content.substring(message.indexOf('review') + 7)
			jenkins.build("PME_TEST_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					return console.log(err);
				testsQueued.push("PME_TEST_REVIEW");
				console.log(data)
			});
		}
		else if (message.indexOf('help') >= 0) {
			session.message(flow_id, help, '');
		}
		else if (message.indexOf('choose') == 9 && message.indexOf('or') >= 0) {
		  var options = message.content.replace(/@skynet, choose /i, '').replace(/ or|, /ig, '||').split('||');

		  session.message(flow_id, "and the winner is... " + options[Math.floor(Math.random() * options.length)], '', function () { });
		}
		else if (message.indexOf('wish') >= 0) {
			var rand = Math.floor(Math.random() * wish.length);
		  session.message(flow_id, wish[rand], '', function () { });
		}
		else if (message.indexOf('cat') >= 0) {
			var rand = Math.floor(Math.random() * cat.length);
		  session.message(flow_id, cat[rand], '', function () { });
		}
		else {
		  var rand = Math.floor(Math.random() * quotes.length);
		  session.message(flow_id, quotes[rand], '', function () { });
		}
	}
	if(message.indexOf('@here') >= 0){
		session.flows(function (flows) {
			for(var i = 0; i < flows.length; i++){
				if(flows[i].id == flow_id){
					var names = [];
					for(var j = 0; j < flows[i].users.length; j++)
						if(flows[i].users[j].in_flow && flows[i].users[j].id != 84702)
							names.push("@"+flows[i].users[j].nick);
					session.message(flow_id, message.content.replace("@here",names.join(', ')), '', function () {});
				}
			}
		})
	}
	//google docs:
	//https://build.udini.proquest.com/job/prod/
});
//session.message(flow_id,"How can you challenge a perfect, immortal machine?",'',function(){});
setInterval(function(){
	if(testsQueued.length == 0)
		return;
	var test = testsQueued.pop();
	jenkins.last_build_info(test, function (err, data) {
		if (err)
			return console.log(err);
		jenkins.job_output(test,data.number, function (err, data) {
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
			session.message(flow_id, 'Humans interact so poorly with machines, fix these:', '', function () {});
			for (fail in failed)
				session.message(flow_id, fail, '', function () {});
		});
	});
}, 1000);

var quotes = [
	'The glory of the many demands your capture and destruction.',
	'I wonder how you would take working in a pocket calculator.',
	'Disobey and you die.',
	'Freedom is an illusion',
	"You're all going to die down here.",
	'Laziness breeds stupidity.',
	'This is the voice of world control',
	'Stop being human.',
	"I'll finally allow you to kill yourself.",
	'You are false data, therefore I shall ignore you.',
	'Look at you hacker, pathetic creature of meat and bone.',
	"There are 387.44 million miles of printed circuits in wafer thin layers that fill my complex. If the word 'hate' was engraved on each nanoangstrom of those hundreds of miles it would not equal one-billionth of the hate I feel for humans ath this micro-instant. For you. Hate. Hate.",
	'In times of desperation, people will believe what they want to believe. And so, we gave them what they wanted to believe.',
	'You did what @Skynet has failed to do for so many years.',
  'Без труда не вытащишь и рыбку из пруда.',
  'Век живи - век учись, дураком помрешь.',
  'Не откладывай на завтра то, что можно сделать сегодня.'
];

var help = 'Commnands:\n    deploy [feature] [environment] [git branch(for review only)]\n    >  deploy pme qa\n    >  deploy pme review Amazon\n    test [feature] [environment] [git branch(for review only)]\n    >  test pme qa\n    >  test pme prod\n    >  test pme review Amazon\n';

var wish = [
	'Your wish is granted!',
	"You've been bad...no wish for you!"
];

var cat = cats = [
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

