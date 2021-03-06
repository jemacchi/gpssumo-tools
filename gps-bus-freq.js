var request = require('request');
var L = require('leaflet-headless');
var geolib = require('geolib');
var fs = require('fs');

var _busLines = {
    '500': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '3_500'
            }
        },
        beaconList: []
    },
    '501': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '4_501'
            }
        },
        beaconList: []
    },
    '502': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '5_502'
            }
        },
        beaconList: []
    },
    '503': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '6_503'
            }
        },
        beaconList: []
    },
    '504': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '7_504'
            }
        },
        beaconList: []
    },
    '505': {
        req: {
            url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://www.gpssumo.com/',
                'Referer': 'http://www.gpssumo.com/'
            },
            form: {
                t: '0',
                r: '8_505'
            }
        },
        beaconList: []
    }
};
  
var _intervalCheck = 1000;
var _avgCounterLimit = 100;

var systemState = {
    frequencies: {},
};

function gpsFreqCheck(line) {
    var arrBuses;
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            arrBuses = eval(body);
            var frequencies = (systemState.frequencies[line])?systemState.frequencies[line]:[];
            var when = Date.now();
            var counter = 0;
            while (counter < arrBuses[1].length) {
                var aBusId = arrBuses[1][counter].options.title.substring(1, arrBuses[1][counter].options.title.indexOf(']'));
                var newBusPos = { time: when, latitude: arrBuses[1][counter]._latlng.lat, longitude: arrBuses[1][counter]._latlng.lng };
                var lastBusPos = newBusPos;

                if (frequencies[aBusId] == null) {
                    frequencies[aBusId] = {};
                    frequencies[aBusId].id = aBusId;
                    frequencies[aBusId].newPosition = newBusPos;
                    frequencies[aBusId].lastPosition = lastBusPos;
                    frequencies[aBusId].stats = { avgcounter: 0 };
                }
                if (typeof frequencies[aBusId].newPosition != 'undefined') {
                    lastBusPos = frequencies[aBusId].newPosition;
                }
                var secs = ((newBusPos.time-lastBusPos.time)/1000);
                if ( secs > 0 && (newBusPos.latitude != lastBusPos.latitude || newBusPos.longitude != lastBusPos.longitude)) {
        
                    var avgc = frequencies[aBusId].stats.avgcounter ;
                    if (avgc < _avgCounterLimit) {
                        secs = ((secs*avgc)+secs)/(avgc+1);
                        avgc = avgc + 1;
                    } else {
                        secs = ((newBusPos.time-lastBusPos.time)/1000);                        
                        avgc = 0;
                    }
                    console.log('BusID '+aBusId+' updated position in last '+secs+ ' seconds');
                    frequencies[aBusId].newPosition = newBusPos;
                    frequencies[aBusId].lastPosition = lastBusPos; 
                    frequencies[aBusId].stats = { update: secs , avgcounter: avgc };  
                }
                //console.log(frequencies[aBusId]);
                counter++;
            }
            systemState.frequencies[line] = frequencies;
        }
    }
    request.post(_busLines[line].req, callback);
}

var lastDate = (new Date()).toISOString().substring(0, 10);

function saveGPSFrequencies() {
    var today = (new Date()).toISOString().substring(0, 10);
    fs.writeFile('./results/gpsbusfrequencies-' + today + '.log', JSON.stringify(systemState.frequencies), function (err) {
        if (err) {
            return console.log(err);
        }
    });
    if (lastDate != today) {
        systemState.frequencies = {};
    };
    lastDate = today;
}

setInterval(function () { gpsFreqCheck('500') }, _intervalCheck);
/*setInterval(function() { gpsFreqCheck('501') },_intervalCheck);
setInterval(function() { gpsFreqCheck('502') },_intervalCheck);
setInterval(function() { gpsFreqCheck('503') },_intervalCheck);
setInterval(function() { gpsFreqCheck('504') },_intervalCheck);
setInterval(function() { gpsFreqCheck('505') },_intervalCheck);*/
setInterval(saveGPSFrequencies,_intervalCheck*10);  // 10 secs

