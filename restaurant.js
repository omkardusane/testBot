var restaurant = []

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

/*
noRestaurantAvailable = function(response, convo) {
    convo.say('No such restaurant is available')
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
    convo.next();
}

controller.on('no_restaurant_found', function(bot, message){
    console.log('So i am here but it wont proceed further than this')
    convo.say('No such restaurant is available')
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
});*/


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
    convo.say('Your reservation at '+restaurantRes[response.user].name+' for ' +restaurantRes[response.user].time+ ' will be confirmed shortly');
    makeReservation(response, convo);
    convo.next();
  });
};

makeReservation = function(response, convo){
    controller.storage.users.get('RestaurantList', function(err, test){
        console.log(test.id +'\n'+ err);
        if(typeof test != 'undefined'){
            var flag = 1;
            console.log('Loop starts now '+test.List.length);
            for (t = 0; t < test.List.length; t++){
                console.log(t);
                if(test.List[t].restName.equalsIgnoreCase(restaurantRes[response.user].name)) {
                    flag = 0;
                    console.log('calling confirm reservation now')
                    confirmReservationFromRestaurant(response, convo , test.List[t].id);
                }
            }
            if(flag) {
                //controller.trigger('no_restaurant_found', [bot, mesage]);
                console.log('should start a conversation to find new restaurant');
                bot.startConversation(message, function(err, convo){
                    console.log(err);
                    convo.say('No such restaurant is available')
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
                });
            }
        convo.next();
        } else {
                console.log(test);
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