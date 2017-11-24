var request = require('request');
var L = require('leaflet-headless');
var geolib = require('geolib')

var options = {
  url: 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'http://www.gpssumo.com/',
    'Referer': 'http://www.gpssumo.com/'
  },
  form: {
    t:'0',
    r:'3_500'
  }
};

var intervalCheck = 5000;
var radius = 100;
var beacon = {latitude: -37.321744950784435, longitude: -59.132108688354485};

function yellowLineCheck() {
    var arrBuses;
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            arrBuses = eval(body);
            var distances = [];
            var counter = 0;
            while (counter < arrBuses[1].length) {
                var aBus = {latitude: arrBuses[1][counter]._latlng.lat,longitude: arrBuses[1][counter]._latlng.lng};
                var passed = geolib.isPointInCircle(
                    aBus,
                    beacon,
                    radius
                );
                if (passed) {
                    console.log('Bus '+arrBuses[1][counter].options.title+' passed close to beacon.')
                }
                
                var d = geolib.getDistance(
                    aBus,
                    beacon
                );
                var busId = arrBuses[1][counter].options.title;
                distances.push({ bus: busId.substring(1,busId.indexOf(']')), dist: d });
                ++counter;
            }
            console.log(distances);
        }
    }
    request.post(options, callback);
}

setInterval(yellowLineCheck,intervalCheck);