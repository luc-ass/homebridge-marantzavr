// Accessory for controlling Marantz and Denon AVR via HomeKit

var request = require("request");
var parser = require("xml2json");
var inherits = require('util').inherits;
var Service, Characteristic;

// need to be global to be used in constructor
var maxVolume;
var minVolume;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-marantzavr", "MarantzAVR", MarantzAVR);


  function MarantzAVR(log, config) {
    // configuration
    this.ip = config['ip'];
    this.name = config['name'];
    maxVolume = config['maxVolume'];
    minVolume = config['minVolume'];

    this.log = log;

    this.get_url = "http://" + this.ip + "/goform/formMainZone_MainZoneXml.xml";

    this.on_url = "http://" + this.ip + "/MainZone/index.put.asp?cmd0=PutZone_OnOff/ON";
    this.off_url = "http://" + this.ip + "/MainZone/index.put.asp?cmd0=PutZone_OnOff/OFF";

    this.mute_on = "http://" + this.ip + "/MainZone/index.put.asp?cmd0=PutVolumeMute/ON";
    this.mute_off = "http://" + this.ip + "/MainZone/index.put.asp?cmd0=PutVolumeMute/OFF";

    this.volume_url = "http://" + this.ip + "/MainZone/index.put.asp?cmd0=PutMasterVolumeSet/";
  }

  // Custom Characteristics and service...
  MarantzAVR.AudioVolume = function() {
    Characteristic.call(this, 'Volume', '00001001-0000-1000-8000-135D67EC4377');
    console.log("Maximum Volume", maxVolume);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      maxValue: maxVolume,
      minValue: minVolume,
      minStep: 0.5,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(MarantzAVR.AudioVolume, Characteristic);

  MarantzAVR.Muting = function() {
    Characteristic.call(this, 'Mute', '00001002-0000-1000-8000-135D67EC4377');
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(MarantzAVR.Muting, Characteristic);

  MarantzAVR.AudioDeviceService = function(displayName, subtype) {
    Service.call(this, displayName, '00000001-0000-1000-8000-135D67EC4377', subtype);
    this.addCharacteristic(MarantzAVR.AudioVolume);
    this.addCharacteristic(MarantzAVR.Muting);
  };
  inherits(MarantzAVR.AudioDeviceService, Service);

  MarantzAVR.prototype = {

    httpRequest: function(url, method, callback) {
		  var that = this;

		  request({
        url: url,
        method: method
		  },
		  function (error, response, body) {
        callback(error, response, body)
      })
    },

    getPowerState: function(callback) {
      var url;
      url = this.get_url;

      this.httpRequest(url, "GET", function(error, response, body) {
        json = parser.toJson(body);
        jsonObject = JSON.parse(json);

        response = jsonObject.item.Power.value;

        if (response === "ON") {
          callback(null, true);
        }
        else {
          callback(null, false);
        }
        this.log("Power state is:", response);

      }.bind(this))

    },

    setPowerState: function(powerOn, callback) {
      var url;

      if (powerOn) {
        url = this.on_url;
      	this.log("Set", this.name, "to on");
    	}
    	else {
      	url = this.off_url;
      	this.log("Set", this.name, "to off");
    	}

    	this.httpRequest(url, "GET", function(error, response, body) {
      	if (error) {
        	this.log('HTTP power function failed: %s');
        	callback(error);
      	}
      	else {
        	this.log('HTTP power function succeeded!');
        	callback();
      		}
    	}.bind(this));
  	},

    getMuteState: function(callback) {
      var url;
      url = this.get_url;

      this.httpRequest(url, "GET", function(error, response, body) {
        json = parser.toJson(body);
        jsonObject = JSON.parse(json);

        response = jsonObject.item.Mute.value;

        if (response === "on") {
          callback(null, true);
        }
        else {
          callback(null, false);
        }
        this.log("Mute state is:", response);

      }.bind(this))

    },

    setMuteState: function(muteOn, callback) {
    	var url;

    	if (muteOn) {
      	url = this.mute_on;
      	this.log(this.name, "muted");
    	}
    	else {
      	url = this.mute_off;
      	this.log(this.name, "unmuted");
    	}

    	this.httpRequest(url, "GET", function(error, response, body) {
      	if (error) {
        	this.log('HTTP mute function failed: %s');
        	callback(error);
      	}
      	else {
        	this.log('HTTP mute function succeeded!');
        	callback();
      		}
    	}.bind(this));
  	},

  	getVolume: function(callback) {
      var url;
      url = this.get_url;

      this.httpRequest(url, "GET", function(error, response, body) {
        json = parser.toJson(body);
        jsonObject = JSON.parse(json);

        response = jsonObject.item.MasterVolume.value;

        callback(null, Number(response));

        this.log("MasterVolume is:", response);

      }.bind(this))

    },

  	setVolume: function(value, callback) {
      url = this.volume_url + value

  		this.httpRequest(url, "GET", function(error, response, body) {
        if (error) {
          this.log('HTTP volume function failed: %s');
          callback(error);
        }
        else {
          this.log("Set volume to", value, "db");
          callback();
          }
      }.bind(this));
  	},

  getServices: function() {
		var that = this;
		
		var informationService = new Service.AccessoryInformation();
		informationService
			.setCharacteristic(Characteristic.Name, this.name)
	    		.setCharacteristic(Characteristic.Manufacturer, "Marantz")
	    		.setCharacteristic(Characteristic.Model, "Unknown")
	    		.setCharacteristic(Characteristic.SerialNumber, "1234567890");

		var switchService = new Service.Switch("Power State");
		switchService
			.getCharacteristic(Characteristic.On)
				.on('get', this.getPowerState.bind(this))
				.on('set', this.setPowerState.bind(this));

			var audioDeviceServie = new MarantzAVR.AudioDeviceService("Audio Functions");
			audioDeviceServie
				.getCharacteristic(MarantzAVR.Muting)
				.on('get', this.getMuteState.bind(this))
				.on('set', this.setMuteState.bind(this));

			audioDeviceServie
				.getCharacteristic(MarantzAVR.AudioVolume)
				.on('get', this.getVolume.bind(this))
				.on('set', this.setVolume.bind(this));

			return [informationService, switchService, audioDeviceServie];
		}
	}
}
