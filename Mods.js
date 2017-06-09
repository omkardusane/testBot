module.exports = function(controller, bot){
var restaurant = {
    username:'',
    name:'',
    time:'',
    id:''
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
        //console.log(test.id +'\n'+ err);
        if(typeof test != 'undefined'){
            var flag = 1;
            console.log('Loop starts now '+test.List.length);
            for (t = 0; t < test.List.length; t++){
                console.log(t);
                if(test.List[t].restName === restaurantRes[response.user].name) {
                    flag = 0;
                    restaurantRes[response.user].id = test.List[t].id;
                    console.log(restaurantRes[response.user]);
                    console.log('calling confirm reservation now')
                    t = test.List.length;
                    confirmReservationFromRestaurant(response, convo);
                }
            }
            console.log('Just before the if gets invoked');
            if(flag) {
                //controller.trigger('no_restaurant_found', [bot, mesage]);
                console.log('should start a conversation to find new restaurant');
                console.log(response);
                convo.say('No such restaurant is available')
                noRestaurantAvailable(response, convo);
            }
        } else {
                console.log(test);
        }
    });
    convo.next();
};

confirmReservationFromRestaurant = function(response, convo){
    controller.storage.users.get(restaurantRes[response.user].id, function(err, user){
        console.log(err);
        console.log('Inside confirm reservation');
        bot.reply(user, 'I am comingwa')
        var attachment = {
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":"Booking for table\nName: TestName\nTime: "+restaurantRes[response.user].time,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Yes",
                        "payload":"yes"
                    },
                    {
                        "type":"postback",
                        "title":"No",
                        "payload":"no"
                    }
                ]
            }
        };
        bot.reply(user, {
            attachment: attachment,
        });
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

noRestaurantAvailable = function(response, convo) {
    convo.ask('Do you want to change the restaurant name? (Yes || No)', function(response, convo){
        if(response.text == 'yes'){
            askRestaurantName(response, convo);
        } else if(response.text == 'no') {
            convo.stop();
        } else {
            convo.repeat();
            convo.next();
        }
        convo.next();
    })
    convo.next()
}
exports.restaurant = restaurant;
}