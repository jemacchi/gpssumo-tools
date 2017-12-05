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
        beaconList: [
            { id: 'y-1', pos: { latitude: -37.290099, longitude: -59.155830 }, radius: 50 },
            { id: 'y-2', pos: { latitude: -37.292506, longitude: -59.156345 }, radius: 50 },
            { id: 'y-3', pos: { latitude: -37.298156, longitude: -59.138428 }, radius: 50 },
            { id: 'y-4', pos: { latitude: -37.301877, longitude: -59.142934 }, radius: 50 },
            { id: 'y-5', pos: { latitude: -37.304540, longitude: -59.139372 }, radius: 50 },
            { id: 'y-6', pos: { latitude: -37.303772, longitude: -59.142827 }, radius: 50 },
            { id: 'y-7', pos: { latitude: -37.309711, longitude: -59.135209 }, radius: 50 },
            { id: 'y-8', pos: { latitude: -37.308260, longitude: -59.139415 }, radius: 50 },
            { id: 'y-9', pos: { latitude: -37.323363, longitude: -59.136583 }, radius: 50 },
            { id: 'y-10', pos: { latitude: -37.323449, longitude: -59.133085 }, radius: 50 },
            { id: 'y-11', pos: { latitude: -37.327459, longitude: -59.136068 }, radius: 50 },
            { id: 'y-12', pos: { latitude: -37.328022, longitude: -59.137462 }, radius: 50 },
            { id: 'y-13', pos: { latitude: -37.334607, longitude: -59.134952 }, radius: 50 },
            { id: 'y-14', pos: { latitude: -37.333106, longitude: -59.130918 }, radius: 50 },
            { id: 'y-15', pos: { latitude: -37.338446, longitude: -59.126004 }, radius: 50 },
            { id: 'y-16', pos: { latitude: -37.334915, longitude: -59.124266 }, radius: 50 },
            { id: 'y-17', pos: { latitude: -37.332748, longitude: -59.114760 }, radius: 50 },
            { id: 'y-18', pos: { latitude: -37.332134, longitude: -59.116906 }, radius: 50 },
            { id: 'y-19', pos: { latitude: -37.330462, longitude: -59.112421 }, radius: 50 },
            { id: 'y-20', pos: { latitude: -37.329830, longitude: -59.114653 }, radius: 50 },
        ]
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

var _intervalBetweenBusesMin = 12;  // 12 min 
var _intervalBetweenBuses = _intervalBetweenBusesMin*60*1000;  
var _intervalCheck = 5000;
var _maxLogsByProx = 5;

var systemState = {
    distances: {},
    proximityLog: {},
};

function lineCheck(line) {
    var arrBuses;
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            arrBuses = eval(body);
            var distances = [];
            var proximityLog = (systemState.proximityLog[line])?systemState.proximityLog[line]:[];
            var when = Date.now();
            var counter = 0;
            while (counter < arrBuses[1].length) {
                var aBusPos = { latitude: arrBuses[1][counter]._latlng.lat, longitude: arrBuses[1][counter]._latlng.lng };
                var aBusId = arrBuses[1][counter].options.title.substring(1, arrBuses[1][counter].options.title.indexOf(']'));

                var bcounter = 0;
                while (bcounter < _busLines[line].beaconList.length) {
                    var isInsideBeacon = geolib.isPointInCircle(
                        aBusPos,
                        _busLines[line].beaconList[bcounter].pos,
                        _busLines[line].beaconList[bcounter].radius
                    );
                    var d = geolib.getDistance(
                        aBusPos,
                        _busLines[line].beaconList[bcounter].pos
                    );
                    var beaconId = _busLines[line].beaconList[bcounter].id;
                    if (isInsideBeacon) {
                        //console.log('Bus ' + aBusId +' ('+line+') in proximity of beacon ' + beaconId);
                        // Save  { time, busLine, busId, beaconId, distanceToBeacon } to proximityLog
                        if (proximityLog[beaconId] == null) {
                            proximityLog[beaconId] = [];
                        }
                        if (proximityLog[beaconId].length > 0) {
                            // Check if it's same Bus as last recorded Bus
                            if (proximityLog[beaconId][0].bus != aBusId.toString()) {
                                    //console.log('Inserting new proximities (it is a different bus)');
                                    if (proximityLog[beaconId].length == _maxLogsByProx) {
                                        proximityLog[beaconId].pop();
                                    }
                                    proximityLog[beaconId].unshift({ time: when, line: line, bus: aBusId, beacon: beaconId, dist: d });   
                            }
                        } else {
                            //console.log('Inserting the first proximity');
                            // It's the first one
                            proximityLog[beaconId].push({ time: when, line: line, bus: aBusId, beacon: beaconId, dist: d });
                        }
                        //console.log(proximityLog);
                        //console.log('------------------------------------');
                    }
                    // Distances to beacons at last check
                    distances.push({ time: when, line: line, bus: aBusId, beacon: beaconId, dist: d });
                    ++bcounter;
                }
                ++counter;
            }
            systemState.distances[line] = distances;
            systemState.proximityLog[line] = proximityLog;
        }
    }
    request.post(_busLines[line].req, callback);
}

var alertLog = {};

function checkTiming() {
    var pLog = systemState.proximityLog ;
    for (cLineKey in pLog) {
        //console.log('--------- '+cLineKey+' ---------');
        byBeaconLog = pLog[cLineKey];
        for (cbeacon in byBeaconLog) {
            //console.log('--------- '+cbeacon+' ---------');
            proximities = byBeaconLog[cbeacon];
            var cprox = 0;
            //while (cprox < proximities.length) {
                if (cprox+1 < proximities.length) {
                    var freq = proximities[cprox].time - proximities[cprox+1].time ;
                    var fKey = cLineKey+'-'+proximities[cprox].time+'-'+proximities[cprox+1].time ;
                    //console.log('Last Freq: '+ freq/1000/60 + ' min');
                    if ( freq > _intervalBetweenBuses ){
                        var log = '--------------------------------------------------- \n'+
                                   'Timing Alert !!! - Frequency between last 2 buses ('+freq/1000/60+' min) \n'+
                                   'At line: '+cLineKey+' between BusID: '+proximities[cprox].bus+' and BusID: '+proximities[cprox+1].bus+' in Beacon '+cbeacon+'\n';
                        console.log(log);
                        alertLog[fKey] = {log};
                    }
                } 
            //    cprox++;
            //}
        };
    };
}

var lastDate = (new Date()).toISOString().substring(0, 10);

function saveAlerts() {
    var today = (new Date()).toISOString().substring(0, 10);
    fs.writeFile('./results/checktiming-alerts-' + today + '.log', JSON.stringify(alertLog), function (err) {
        if (err) {
            return console.log(err);
        }
    });
    if (lastDate != today) {
        alertLog = {};
    };
    lastDate = today;
}

setInterval(function () { lineCheck('500') }, _intervalCheck);
/*setInterval(function() { lineCheck('501') },_intervalCheck);
setInterval(function() { lineCheck('502') },_intervalCheck);
setInterval(function() { lineCheck('503') },_intervalCheck);
setInterval(function() { lineCheck('504') },_intervalCheck);
setInterval(function() { lineCheck('505') },_intervalCheck);*/
setInterval(checkTiming,_intervalCheck*3);  // 15 secs
setInterval(saveAlerts,_intervalCheck);  // 1 min

