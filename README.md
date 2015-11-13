# homebridge-marantzavr

This ia a plugin for homebridge. It is a partially-working implementation of Denon/Marantz recievers into HomeKit. This plugin is work in progress. Help is appreciated!

# Installation

This plugin is not yet on NPM. Insatllation only via GitHub at the moment...

1. Install homebridge using: npm install -g homebridge <br>
2. Install this plugin using npm install -g git+https://git@github.com/luc-ass/homebridge-marantzavr
3. Update your configuration file. See sample-config below for a sample. 

# Configuration

Configuration sample:

```
"accessories": [
        {
            "accessory": "MarantzAVR",
            "name": "MarantzAVR",
            "ip": "100.100.100.100",
            "maxVolume": -20.0,
            "minVolume": -79.0
        }
    ]
```

- accessory: MarantzAVR
- name: can be anything you want
- ip: IP of you AVR
- maxVolume: can be configured. Please be careful not to select very high values. -20.0 recomended
- minVolume: minimal Volume of your device, does not influence "mute"

# Roadmap

- ~~get power state~~
- ~~set power state~~
- ~~get mute state~~
- ~~set mute state~~
- ~~get volume~~
- ~~set volume~~ (does not include rate limiter! --> underscore.throttle)
- get input (no Characteristic yet)
 
