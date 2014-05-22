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
var session = new Flowdock.Session(user_id);
var stream = session.stream(flow_id);
stream.on('message', function (message) {
	if(message.content.toLowerCase && message.content.toLowerCase().indexOf('@skynet') >= 0){
		var jenkins = Jenkins.init("http://" + jenkins_id + ":" + jenkins_pass + "@build.udini.proquest.com:8080");
		if (message.content.toLowerCase && message.content.toLowerCase().indexOf('deploy pme prod') >= 0) {
			jenkins.build("PME_PROD", function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase && message.content.toLowerCase().indexOf('test pme prod') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase && message.content.toLowerCase().indexOf('deploy pme qa') >= 0) {
			jenkins.build("PME_QA", function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase && message.content.toLowerCase().indexOf('test pme qa') >= 0) {
			jenkins.build("PME_TEST_PROD", function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase && message.content.toLowerCase().indexOf('deploy pme review') >= 0) {
			var feature = message.content.substring(message.content.toLowerCase().indexOf('review')+7)
			console.log(feature)
			jenkins.build("PME_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase && message.content.toLowerCase().indexOf('test pme review') >= 0) {
			var feature = message.content.substring(message.content.toLowerCase().indexOf('review') + 7)
			console.log(feature);
			jenkins.build("PME_TEST_REVIEW", {"FEATURE": feature}, function (err, data) {
				if (err)
					console.log(err);
				else
					console.log(data)
			});
		}
		else if (message.content.toLowerCase().indexOf('choose') == 9 && message.content.toLowerCase().indexOf('or') >= 0) {
		  var options = message.content.replace(/@skynet, choose /i, '').replace(/ or /ig, '||').split('||');

		  console.log(options[Math.floor(Math.random() * options.length)]);
		}
		var rand = Math.floor(Math.random()*quotes.length);
		session.message(flow_id, quotes[rand], '', function () {});
	}
	if(message.content.toLowerCase && message.content.toLowerCase().indexOf('@here') >= 0){
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
	//https://build.udini.proquest.com/job/PME_PROD/build?token=TOKEN
	//https://build.udini.proquest.com/job/PME_QA/build?token=TOKEN
	//https://build.udini.proquest.com/job/PME_REVIEW/build?token=TOKEN
	//https://build.udini.proquest.com/job/PME-Automated-Tests/build?token=TOKEN
	//google docs:
	//https://build.udini.proquest.com/job/prod/
});
//session.message(flow_id,"How can you challenge a perfect, immortal machine?",'',function(){});
//setInterval(function(){
var jenkins = Jenkins.init("http://" + jenkins_id + ":" + jenkins_pass + "@build.udini.proquest.com:8080");
	jenkins.last_build_info('PME_TEST_REVIEW', function (err, data) {
		if (err)
			return console.log(err);
		jenkins.job_output('PME_TEST_REVIEW',data.number, function (err, data) {
			if (err)
				return console.log(err);
			console.log(data)
		});
	});
//}, 1000);

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
	'You did what @Skynet has failed to do for so many years.'
];