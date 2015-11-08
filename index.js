// The configuration is stored inside the ../config.json
// {
//     "accessory": "MarantzAVR",
//     "name" : "MarantzAVR",
//     "ip" : "ip"
// }
var request = require("request");
var parser = require("xml2json");
var inherits = require('util').inherits;
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-marantzavr", "MarantzAVR", MarantzAVR);


  function MarantzAVR(log, config) {
    // configuration
    this.ip = config['ip'];
    this.name = config['name'];

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
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      maxValue: 35,	// !!! this needs to be configured! Dangerous volume level!
      minValue: -80,
      minStep: 1,
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

    // Volume Characteristics
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
        this.log(jsonObject.item.Power);

      }.bind(this))

      callback(true);
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
      callback(true);
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
        	this.log('HTTP power function failed: %s');
        	callback(error);
      	}
      	else {
        	this.log('HTTP power function succeeded!');
        	callback();
      		}
    	}.bind(this));
  	},

  	getVolume: function(callback) {
  		callback(null, Number(-48.0));
  	},

  	setVolume: function(value, callback) {
  		this.log("Set volume to", value, "db");
  		callback();
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
