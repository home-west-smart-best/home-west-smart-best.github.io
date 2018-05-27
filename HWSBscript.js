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
    document.getElementById("room_1_temperature_current").disabled = false;
    document.getElementById("room_1_temperature_spinbox").disabled = false;
    
    MQTT_Client.subscribe("hwsb/room1/thermostat/temperature");
}

// Called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("ERROR: connection lost with MQTT Broker: " +
            "\"" + responseObject.errorMessage + "\"");
        document.getElementById("room_1_temperature_current").disabled = true;
        document.getElementById("room_1_temperature_spinbox").disabled = true;
    }
}

// called when a message arrives
function onMessageArrived(message) {
    console.log(
        "MQTT message recieved: " + "\"" + message.payloadString + "\"" +
        " MQTT topic: " + "\"" + message.destinationName + "\"" +
        " QoS: " + "\"" + message.qos + "\"" +
        " Retained: " + "\"" + message.retained + "\"");

    if (message.destinationName === MQTT_topic_root + "/room1/buttonstatus/") {
        document.getElementById("room_1_button_status").style.color = "red";
    }

    if (message.destinationName === (MQTT_topic_root + "/room1/thermostat/temperature")) {
        var jmessage = JSON.parse(message.payloadString);

        if (jmessage.unit.celsgitius < 100 && jmessage.unit.celsius > -20) {
            document.getElementById("room_1_temperature_current").innerHTML = jmessage.unit.celsius;
        }
    }

}