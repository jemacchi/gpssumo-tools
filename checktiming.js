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
            { id: 'test-1', pos: { latitude: -37.321744950784435, longitude: -59.132108688354485 }, radius: 100 },
            { id: 'test-2', pos: { latitude: -37.31063541829835, longitude: -59.137430191040046 }, radius: 100 },
            { id: 'test-3', pos: { latitude: -37.29725401710591, longitude: -59.13719415664673 }, radius: 100 },
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

var _intervalBetweenBuses = 10*60*1000;  // 10 min
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

var tprox= [];
tprox['test-1'] = [ { time: 1512169401035, line: '500', bus: '13', beacon: 'test-1', dist: 14 },
  { time: 1512069250837, line: '500', bus: '9', beacon: 'test-1',  dist: 99 },
  { time: 1512068840522, line: '500', bus: '12',beacon: 'test-1',  dist: 15 },
  { time: 1512068690417, line: '500', bus: '8', beacon: 'test-1',  dist: 21 },
  { time: 1512068315108, line: '500', bus: '11',beacon: 'test-1',  dist: 89 } ];
tprox['test-3'] = [ { time: 1512069405946, line: '500', bus: '8', beacon: 'test-3', dist: 9 },
  { time: 1512068680420, line: '500', bus: '6', beacon: 'test-3', dist: 35 },
  { time: 1512068220032, line: '500', bus: '4', beacon: 'test-3', dist: 92 } ];
tprox['test-2'] = [ { time: 1512069516049, line: '500', bus: '2', beacon: 'test-2', dist: 67 },
  { time: 1512069075708, line: '500', bus: '8', beacon: 'test-2', dist: 70 },
  { time: 1512068875545, line: '500', bus: '13',beacon: 'test-2', dist: 67 },
  { time: 1512068340121, line: '500', bus: '12',beacon: 'test-2', dist: 56 },
  { time: 1512068335140, line: '500', bus: '6', beacon: 'test-2', dist: 48 } ] ;

systemState.proximityLog['500'] = tprox ;

function checkTiming() {
    var pLog = systemState.proximityLog ;
    var cline = 0;
    while (cline < pLog.length) {
        byBeaconLog = pLog[cline];
        var cbeacon = 0;
        while (cbeacon < byBeaconLog.length) {
            if (cbeacon+1 < 5) {
                if ( ((byBeaconLog[cbeacon].time - byBeaconLog[cbeacon+1].time)/1000) > _intervalBetweenBuses ){
                    console.log('Timing Alert !!! - Delayed: ' + byBeaconLog[0]);
                }
            }
            ++cbeacon;
        } 
        ++cline;
    };
}

function saveStatus() {
    var today = (new Date()).toISOString().substring(0, 10);
    fs.writeFile('./results/checktiming-' + today + '.log', JSON.stringify(systemState.proximityLog), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

setInterval(function () { lineCheck('500') }, _intervalCheck);
setInterval(function() { lineCheck('501') },_intervalCheck);
setInterval(function() { lineCheck('502') },_intervalCheck);
setInterval(function() { lineCheck('503') },_intervalCheck);
setInterval(function() { lineCheck('504') },_intervalCheck);
setInterval(function() { lineCheck('505') },_intervalCheck);
setInterval(checkTiming,_intervalCheck*3);