# homebridge-marantzavr

This ia a plugin for homebridge. It is a partially-working implementation of Denon/Marantz recievers into HomeKit. This plugin is work in progress. Help is appreciated!

# Installation

ATTENTION! This does not yet work! Project is not yet uploaded to npm.

> 1. Install homebridge using: npm install -g homebridge <br>
> 2. Install this plugin using: npm install -g homebridge-marantzavr <br>
> 3. Update your configuration file. See sample-config below for a sample. 

# Configuration

Configuration sample:

```
"accessories": [
        {
            "accessory": "MarantzAVR",
            "name": "MarantzAVR",
            "ip": "100.100.100.100"
        }
    ]
```

# Roadmap

- ~~get power state~~
- ~~set power state~~
- ~~get mute state~~
- ~~set mute state~~
- ~~get volume~~
- set volume (including rate limiter --> underscore.throttle)
- get input (no Characteristic yet)
 
