var WebSocket_MQTT_Broker_URL = "ws://broker.hivemq.com:8000/mqtt";
var MQTT_Client_ID = "";
var MQTT_Topic = "";
var MQTT_Client = "";
var MQTT_topic_root = "hwsb/";
var rtt1 = "??";
var rtt2 = "??";
var rtt3 = "??";
const temp_max = 40;
const temp_min = 0;
//
// const room_element = ' <div class="well row">\n' +
//     '                        <h4 class="col-sm-8">Room 1</h4>\n' +
//     '                        <label class="col-sm-8" for="room_1_temperature_current">Current Temp: </label>\n' +
//     '                        <p class="col-sm-4" id="room_1_temperature_current">???</p>\n' +
//     '                        <label class="col-sm-8" for="room_1_temperature_spinbox">setpoint Temp: </label>\n' +
//     '                        <div class="col-sm-4">\n' +
//     '                        <input disabled class="form-control" onchange=\'send_setpoint("room1", this.value)\' id="room_1_temperature_spinbox" type="number" min="0" max="40" step="2"\n' +
//     '                        value="16">\n' +
//     '                        </div>\n' +
//     '                        <label class="col-sm-8" for="room_1_button_status">Button Status: </label>\n' +
//     '                        <font class="col-sm-4" id="room_1_button_status" size=\'6\' color=0><b> O </b></font>\n' +
//     '                        </div>';

var room_numbers = 0;
var room_list = [];

class Room {
    constructor(new_room_id) {
        room_numbers++;
        if(new_room_id == null){
            this.roomid = 'kamer_' + room_numbers;
        } else{
            this.roomid =  new_room_id;
        }
        this.room_element = '<div class="well row">\n' +
            '                        <h4 class="col-sm-8" id="room_name">' + this.roomid + '</h4>\n' +
            '                        <label class="col-sm-8" for="temperature_current">Current Temp: </label>\n' +
            '                        <p class="col-sm-4 temperature_current_' + this.roomid + ' " id="temperature_current">???</p>\n' +
            '                        <label class="col-sm-8" for="temperature_spinbox">setpoint Temp: </label>\n' +
            '                        <div class="col-sm-4">\n' +
            '                        <input disabled class="form-control temperature_spinbox_' + this.roomid + '" onchange=\'send_setpoint(\"' + this.roomid + '\", this.value)\' id="temperature_spinbox" type="number" min="0" max="40" step="2"\n' +
            '                        value="16">\n' +
            '                        </div>\n' +
            '                        <label class="col-sm-8" for="button_status">Button Status: </label>\n' +
            '                        <font class="col-sm-4 button_status_' + this.roomid + '" id="button_status" size=\'6\' color=0><b> O </b></font>\n' +
            '                        </div>';

    }

    get_ID() {
        return this.roomid;
    }

    get_element(){
        return this.room_element;
    }
    
    enable_spinbox(){
        $(".temperature_spinbox_" + this.get_ID()).prop('disabled', false);
    }

    disable_spinbox(){

        $(".temperature_spinbox_" + this.get_ID()).prop('disabled', true);
    }

    set_temperature(current_temperature){
        $(".temperature_current_" + this.get_ID()).text(current_temperature);
        this.temperature_color(current_temperature);
    }

    temperature_color(){
        var current_temperature = parseInt($(".temperature_spinbox_" + this.get_ID()).val());
        var set_temperature = parseInt($(".temperature_current_" + this.get_ID()).text());
        
        if( current_temperature > set_temperature){
            $(".temperature_current_" + this.get_ID()).css('color' , 'red');
        } else if ( current_temperature < set_temperature){
            $(".temperature_current_" + this.get_ID()).css('color' , 'blue');
        } else{
            $(".temperature_current_" + this.get_ID()).css('color' , 'green');
        }
    }

    set_button_status(button_status){
        if (button_status === true) {
        $(".button_status_" + this.get_ID()).css('color' , 'green');
        }else if (button_status === false){
            $(".button_status_" + this.get_ID()).css('color' , 'red');
        } else{
            $(".button_status_" + this.get_ID()).css('color' , 'white');
        }
    }
}

function add_room(new_roomid){

    var r1 = new Room(new_roomid);

    $('.rooms').append(r1.get_element());
    r1.enable_spinbox();
    room_list.push(r1);

}

function delete_room(delete_roomid){
    for(var i = 0; i < room_list.length; i++) {
        if (delete_roomid === room_list[i].get_ID()) {
            room_list.splice(i, 1);
            $('.rooms').empty();
            for(var ii = 0; i < room_list.length; i++){
                $('.rooms').append(room_list[ii].get_element());
                room_list[ii].enable_spinbox();
            }
            return;
        }
    }
}

function send_setpoint(room_name, setpoint) {
    var sp = parseInt(setpoint);
    if (sp < temp_min || sp > temp_max) {
        alert("value is invalid: " + sp);
    }
    var message = new Paho.MQTT.Message("set_target_temperature " + JSON.stringify({"value": sp}));
    message.destinationName = MQTT_topic_root + "/" + room_name + "/thermostat/command";
    message.retained = true;
    MQTT_Client.send(message);
    console.log(
        "MQTT message send: " + "\"" + message.payloadString + "\"" +
        " MQTT topic: " + "\"" + message.destinationName + "\"" +
        " QoS: " + "\"" + message.qos + "\"" +
        " Retained: " + "\"" + message.retained + "\"");
}

$(document).ready(function () {
    // Set variables
    //Generate Random MQTT Clinet ID
    MQTT_Client_ID = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // MQTT_Client_ID = "900000000000";
    // Create a MQTT Client nstance
    MQTT_Client =
        new Paho.MQTT.Client(WebSocket_MQTT_Broker_URL, MQTT_Client_ID);

    // set callback handlers
    MQTT_Client.onConnectionLost = onConnectionLost;
    MQTT_Client.onMessageArrived = onMessageArrived;

    var options = {
        // Connection attempt timeout in seconds
        timeout: 3,
        onSuccess: onConnect,
        onFailure: function (message) {
            alert("Connection to MQTT broker failed: " + message.errorMessage);
        }
    };

    MQTT_Client.connect(options);
});

function initVars() {
    console.log("initVars");
    MQTT_device = "webapp";
    MQTT_topic_root = "hwsb";
}

// Called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription.
    console.log("Connected to " + WebSocket_MQTT_Broker_URL);
    console.log("Client ID: " + MQTT_Client_ID);
    MQTT_Client.subscribe("hwsb/+/thermostat/temperature");
    MQTT_Client.subscribe("hwsb/ping/#");
    MQTT_Client.subscribe("hwsb/disconnect");
    MQTT_Client.subscribe("hwsb/+/switch/state");
}

// Called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("ERROR: connection lost with MQTT Broker: " +
            "\"" + responseObject.errorMessage + "\"");
            $(".temperature_current").prop('disabled',true);
            $(".temperature_spinbox").prop('disabled',true);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    console.log(
        "MQTT message recieved: " + "\"" + message.payloadString + "\"" +
        " MQTT topic: " + "\"" + message.destinationName + "\"" +
        " QoS: " + "\"" + message.qos + "\"" +
        " Retained: " + "\"" + message.retained + "\"");

    if (message.destinationName.includes("/disconnect")) {
        var jmessage = JSON.parse(message.payloadString);
        delete_room(jmessage.id);
    }
    if (message.destinationName.includes("/thermostat/temperature")) {
        var jmessage = JSON.parse(message.payloadString);

        for(var i = 0; i < room_list.length; i++){
            if (jmessage.id === room_list[i].get_ID()){
                room_list[i].set_temperature(jmessage.unit.celsius);
                return;
            }
        }
    }
    if (message.destinationName.includes("/switch/state")) {
        var jmessage = JSON.parse(message.payloadString);

        for(var i = 0; i < room_list.length; i++){
            if (jmessage.id === room_list[i].get_ID()){
                room_list[i].set_button_status(jmessage.state);
                return;
            }
        }
    }
    if (message.destinationName.includes("/ping/")) {
        var jmessage = JSON.parse(message.payloadString);

        for(var i = 0; i < room_list.length; i++){
            if (jmessage.id === room_list[i].get_ID()){
                return;
            }
        }

        add_room(jmessage.id);
    }
}


// function led(color, msg) {
//     var message = new Paho.MQTT.Message(msg);
//     message.destinationName = MQTT_topic_root + "led" + color;
//     if (color == 'green') {
//         rtt1 = (new Date()).getTime();
//         message.qos = 0;
//     }
//     if (color == 'yellow') {
//         rtt2 = (new Date()).getTime();
//         message.qos = 1;
//     }
//     if (color == 'red') {
//         rtt3 = (new Date()).getTime();
//         message.qos = 2;
//     }
//     MQTT_Client.send(message);
//     console.log(
//         "MQTT message send: " + "\"" + message.payloadString + "\"" +
//         " MQTT topic: " + "\"" + message.destinationName + "\"" +
//         " QoS: " + "\"" + message.qos + "\"" +
//         " Retained: " + "\"" + message.retained + "\"");
// }

