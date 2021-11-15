// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.



var CurrCon = "";
const {
  networkInterfaces
} = require('os');

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);

    }
  }
}

console.log(results)
var wifi = require('node-wifi');
const { Console } = require('console');

// Initialize wifi module
// Absolutely necessary even to set interface to null
wifi.init({
  iface: null // network interface, choose a random wifi interface if set to null
});

wifi.getCurrentConnections((error, currentConnections) => {
  if (error) {
    console.log(error);
  } else {
    console.log(currentConnections);
    console.log(currentConnections[0].ssid);
    CurrCon = currentConnections[0].ssid;
    /*
    // you may have several connections
    [
        {
            iface: '...', // network interface used for the connection, not available on macOS
            ssid: '...',
            bssid: '...',
            mac: '...', // equals to bssid (for retrocompatibility)
            channel: <number>,
            frequency: <number>, // in MHz
            signal_level: <number>, // in dB
            quality: <number>, // same as signal level but in %
            security: '...' //
            security_flags: '...' // encryption protocols (format currently depending of the OS)
            mode: '...' // network mode like Infra (format currently depending of the OS)
        }
    ]
    */
  }
});


const view = new ol.View({
  center: ol.proj.fromLonLat([29.00000095367432, 41.09046229684542]),
  zoom: 20
})

var map = new ol.Map({
  controls: ol.control.defaults({
    attribution: false,
    zoom: false,
  }),
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: view
});


function saveAs(uri, filename) {
  var link = document.createElement('a');
  if (typeof link.download === 'string') {
    link.href = uri;
    link.download = filename;
    localStorage.setItem('Exported img', uri);

    //Firefox requires the link to be in the body
    document.body.appendChild(link);

    //simulate click
    link.click();

    //remove the link when done
    document.body.removeChild(link);
  } else {
    window.open(uri);
  }
}
//Qrcode gen
var locations = []
window.onload = function () {
  var QRmsg = "SMM,Wifi:" + CurrCon + ";IPv4:" + results.en0[0] + ";";
  console.log(QRmsg);
  var qrcode = new QRCode(document.getElementById("qrcodeholder"), {
    text: QRmsg,
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

var routeFeature;
//polyline data test 
function test() {

  $.getJSON('test_data.json', function (data) {
    console.log(data.coordinates[0])
    locations = data.coordinates[0]
    var route = new ol.geom.LineString(locations)
      .transform('EPSG:4326', 'EPSG:3857');

    var routeCoords = route.getCoordinates();

    routeFeature = new ol.Feature({
      type: 'route',
      geometry: route
    });

    var styles = {
      'route': new ol.style.Style({
        stroke: new ol.style.Stroke({
          width: 6,
          color: 'purple'
        })
      }),
      'icon': new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: 'https://openlayers.org/en/v3.20.1/examples/data/icon.png'
        })
      }),
      'geoMarker': new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          snapToPixel: false,
          fill: new ol.style.Fill({
            color: 'black'
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2
          })
        })
      })
    };


    var vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [routeFeature]
      }),
      style: function(feature) {
        // hide geoMarker if animation is active
        
        return styles[feature.get('type')];
      }
    
    });
    map.addLayer(vectorLayer);
    var poly = routeFeature.getGeometry()
    map.getView().fit(poly,{ duration: 1000,padding:[50, 50, 50, 50],easing:ol.easing.upAndDown(1) });


  });
}

function test2()
{
  map.once('rendercomplete', function () {
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];
    const mapContext = mapCanvas.getContext('2d');
    Array.prototype.forEach.call(
      document.querySelectorAll('.ol-layer canvas'),
      function (canvas) {
        if (canvas.width > 0) {
          const opacity = canvas.parentNode.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          const matrix = transform
            .match(/^matrix\(([^\(]*)\)$/)[1]
            .split(',')
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
          mapContext.drawImage(canvas, 0, 0);
        }
      }
    );
    if (navigator.msSaveBlob) {
      // link download attribute does not work on MS browsers
      navigator.msSaveBlob(mapCanvas.msToBlob(), 'map.png');
    } else {
      saveAs(mapCanvas.toDataURL(),"test.png");
    }
  });
  map.renderSync();
}

async function testing(){

   test();
   setTimeout(function (){//if it work it ain't stupid.

    //test2();
    test3();

  }, 1500);
}

function test3(){
  for (let i = 0; i < locations.length; i++) {
    
    setTimeout(function (){//if it work it ain't stupid. V2
      map.getView().fit(new ol.geom.Point(locations[i]).transform('EPSG:4326', 'EPSG:3857'),{padding: [170, 50, 30, 150], minResolution: 0.25,duration:200, easing: ol.easing.linear});//important to understand, just like why i don't have a girlfriend yet.
      $('#progress').val(i);
    }, 200*i);
  }
  $('#progress').prop("disabled", false);
  $('#progress').prop("step", 1);
  $('#progress').prop("min", 0);
  $('#progress').prop("max", locations.length-1);
  $('#progress').val(0);
  $('#progress').on('input change', function() {
    var i =  $('#progress').val();
    console.log("Progress value is "+ i);
    map.getView().fit(new ol.geom.Point(locations[i]).transform('EPSG:4326', 'EPSG:3857'),{padding: [170, 50, 30, 150], minResolution: 0.25,duration:200, easing: ol.easing.linear});//important to understand, just like why i don't have a girlfriend yet.V2

  });
}



$('#myModal').on('shown.bs.modal', function () {
  $('#myInput').trigger('focus')
})
$('#genvidBTN').on('click',function(){
  
});