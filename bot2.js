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

var restaurant = {
    name:'',
    time:''
};

var restaurantRes = {};

var airplane = {
    name:'',
    date:''
}

var airplaneBook = {};

var restaurantDetails = {
    name:'',
    openingTime:'',
    closingTime:'',
}

var Rlist = {};

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
            bot.reply(message, 'Hello, Who is this\nI dont recognise you');
        }
    });
});

controller.hears(['50101'], 'message_received', function(bot, message) {
        bot.startConversation(message, askRestName);
});

controller.hears(['call me (.*)', 'my name is (.*)', 'I am (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {    
        if (!user) {
            user = {
                id: message.user,
                channel: message.channel,
                page: message.page,
                type: 'user'
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.on('ask_question', function(bot, message) {
    bot.startConversation(message, function(err,convo){
        if(!err){
            convo.ask("How can i help you today\n1. Reserve you a table\n2. Book you an airplane ticket", [
                {
                    pattern: "(.*) table",
                    callback: function(response , convo){
                        convo.next();
                        //controller.trigger('reserve_table', [bot, message]);
                        bot.startConversation(message, askRestaurantName);
                    }
                },
                {
                    pattern: "(.*) ticket",
                    callback: function(response , convo){
                        convo.next();
                        //controller.trigger('book_ticket', [bot, message]);
                        bot.startConversation(message, askAirlineName);
                    }
                },
                {
                    pattern: "nothing",
                    callback: function(response , convo){
                        convo.say('Okay let me know when you need help');
                        convo.stop();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.say("Sorry did not get you there, please choose one of the two options")
                        convo.repeat();
                        convo.next();
                    }
                }
            ]);
        }
    });
});

askRestaurantName = function(response, convo) {
  convo.ask('Which Restaurant would you like to reserve a table at?', function(response, convo) {
    convo.say('Awesome.');
    restaurant.name = response.text;
    restaurantRes[response.user] = restaurant;
    askTime(response, convo);
    convo.next();
  });
};

askTime = function(response, convo) {
  convo.ask('What time would you want the reservation to be ?', function(response, convo) {
    restaurant.time = response.text;
    restaurantRes[response.user] = restaurant;
    console.log('*********\n'+restaurantRes[response.user].name+'\n*********')
    convo.say('Your reservation at '+restaurantRes[response.user].name+' for ' +restaurantRes[response.user].time+ ' will be confirmed shortly');
    makeReservation(response, convo);
    convo.next();
  });
};

makeReservation = function(response, convo){
    controller.storage.users.get('RestaurantList', function(err, test){
        console.log(test);
        console.log(err);
        if(typeof test != 'undefined'){
                for (var t = 0; t < test.List.length; t++){
                    if(test.List[t].restName === restaurantRes[response.user].name){
                    confirmReservationFromRestaurant(response, convo , test.List[t].id);
                    t =  test.List.length+1; 
                    }
                }
            if(t == test.List.length) {
                convo.say('No such restaurant available')
                convo.ask('Do you want to change the restaurant name? (Yes or No)' [
                    {
                                    
                        pattern: bot.utterances.yes,
                        callback: function(response, convo) {
                            askRestaurantName(response, convo);
                            convo.next();
                        }
                    },
                    {
                        pattern: bot.utterances.no,
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
            } else {
                console.log(test);
            }
        convo.next();
        }
    });
};

confirmReservationFromRestaurant = function(response, convo, id){
    controller.storage.users.get(id, function(err, user){
        bot.reply(user, "This is a test to see if i made it or not");
    });
}  

askAirlineName = function(response, convo) {
  convo.ask('Which Airline would you like to book a ticket from?', function(response, convo) {
    convo.say('Awesome.');
    airplaneBook.name = response.text;
    askDate(response, convo);
    convo.next();
  });
};

askDate = function(response, convo) {
  convo.ask('What date do you want to fly?', function(response, convo) {
    airplaneBook.date = response.text; 
    convo.say('Your booking for '+airplaneBook.name+' on ' +airplaneBook.date+ ' will be confirmed shortly');
    convo.next();
  });
};

askRestName = function(response, convo) {
    convo.ask('What is the name of your restaurant?', function(response, convo) {
        restaurantDetails.name = response.text;
        Rlist[response.user] = restaurantDetails
        askTimings(response, convo);
        convo.next();
    });
};

askTimings = function(response, convo){
    convo.ask('What is your opening time?', function(response, convo) {
        restaurantDetails.openingTime = response.text;
        Rlist[response.user] = restaurantDetails
        convo.next();
    });
    convo.ask('What is your closing time?', function(response, convo) {
        restaurantDetails.closingTime = response.text;
        Rlist[response.user] = restaurantDetails
        saveRestaurantDetails(response, convo);
        convo.next();
    });
};

saveRestaurantDetails = function(response, convo){
    controller.storage.users.get(response.user, function(err, user) {
        if (!user) {
            user = {
                id: response.user,
                channel: response.channel,
                page: response.page,
                type: 'restaurant'
            };
            if(0) {    
                rest = {
                id:'RestaurantList',
                List: []
                }
            }
            rest.List.push({'restName':Rlist[response.user].name , 'id':response.user});
            controller.storage.users.save(rest, function(err, id) {
                console.log('Restaurant list updated')
            });
        }
        user.name = Rlist[response.user].name;
        user.openingTime = Rlist[response.user].openingTime;
        user.closingTime = Rlist[response.user].closingTime;

        controller.storage.users.save(user, function(err, id) {
            convo.say('You have been successfully registered with our system')
        });
    });
};

/*
controller.on('reserve_table', function(bot, message){
    bot.startConversation(message, function(err, convo){
        convo.ask("Where would you like to reserve a table", function(response , convo){
            convo.say("Your reservation at " +response.text+ " will be confirmed shortly");
        });
    })
});

controller.on('book_ticket', function(bot, message){
    bot.startConversation(message, function(err, convo){
        convo.ask("Which airline would you like to book a ticket from ", function(response , convo){
            convo.say("Your booking for " +response.text+ " will be confirmed shortly");
        });
    })
});

askWhereDeliver = function(response, convo) {
  convo.ask('So where do you want it delivered?', function(response, convo) {
    convo.say('Ok! Good bye.');
    convo.next();
  });
}
//use this to send a message to the user without receiving one in the first place
bot.startConversation({user:'1221286521326631', channel:'1221286521326631',page: '110927939505139'}, function(err , convo){
    if(!err){
        convo.say('hi')
    }
    convo.next();
});
*/