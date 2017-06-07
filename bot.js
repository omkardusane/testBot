var env = require('node-env-file');
env(__dirname + '/.env');


if (!process.env.page_token) {
    console.log('Error: Specify a Facebook page_token in environment.');
    usage_tip();
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify a Facebook verify_token in environment.');
    usage_tip();
    process.exit(1);
}

var Botkit = require('botkit');

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.facebookbot({
    debug: true,
    receive_via_postback: true,
    verify_token: process.env.verify_token,
    access_token: process.env.page_token,
    json_file_store: './Userdata.json'
});

var restaurantRes = {
    name :'',
    time :'' 
};

var bot = controller.spawn({
});

controller.setupWebserver(process.env.PORT, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});

controller.hears(['hello', 'hi', 'hey'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
            controller.trigger('ask_question', [bot, message]);
        } else {
            bot.reply(message, 'Hello, What can i call you');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
            controller.trigger('ask_question', [bot, message]);
        });
    });
});

controller.on('ask_question', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        if (!err) {
            convo.say('What would you like me to do?');
            convo.ask('Book you a table at a restaurant or book an air ticket?', [
            {
                pattern: '(.*) table',
                callback: function(response, convo) {
                    convo.ask('So which restraunt should i book this table at', function(response , convo){
                        //restaurantRes.name = response.text;
                        /*For some reason the code gets stuck here */
                        convo.say('Okay got you')    
                        console.log("Why you no move ahead");
                        convo.ask('You want me to book you a table at `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    convo.ask('What time would you like the reservation to be done?', function(response , convo){
                                        restaurantRes.time = response.text;
                                        convo.ask('Reserve table at ' +restaurantRes.name+ ' at ' +restaurantRes.time+ '?' , [
                                            {
                                                pattern: 'yes',
                                                callback: function(response, convo) {
                                                    convo.next();
                                                }
                                            },
                                            {
                                                pattern: 'no',
                                                callback: function(response, convo) {
                                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                                    convo.stop();
                                                }
                                            },
                                           {
                                                default: true,
                                                callback: function(response, convo) {
                                                    convo.repeat();
                                                    convo.next();
                                                }
                                            }
                                        ]);
                                    });
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);
                    });
                    convo.next();
                }
            },
                {
                    pattern: '(.*) ticket',
                    callback: function(response, convo) {
                        
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.repeat();
                        convo.next();
                    }
                }
            ]);

            convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                    bot.reply(message, 'Reservation Complete');
                    /*
                    controller.storage.users.get(message.user, function(err, user) {
                        if (!user) {
                            user = {
                                id: message.user,
                            };
                        }
                        user.name = convo.extractResponse('nickname');
                        controller.storage.users.save(user, function(err, id) {
                            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                        });
                    });
                    */
                } else {
                    // this happens if the conversation ended prematurely for some reason
                    bot.reply(message, 'OK, nevermind! then');
                    //controller.trigger('ask_question', [bot, message]);
                }
            });
        }
    });
});