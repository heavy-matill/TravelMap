import 'ol/ol.css';
import Point from 'ol/geom/Point'
import XYZ from 'ol/source/XYZ';
import { Map, View } from 'ol';
import Circle from 'ol/geom/Circle';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import LineString from 'ol/geom/LineString';
import Overlay from 'ol/Overlay';
import Icon from 'ol/style/Icon';
import { makeRegular } from 'ol/geom/Polygon';
var arc = require('arc');
var fs = require('fs');

var trip = JSON.parse(fs.readFileSync('2019_china.json'))
var locations = JSON.parse(fs.readFileSync('locations.json'))
console.log(trip)

/*
Orte: https://www.latlong.net/place/cologne-germany-14658.html
    Köln: [50.935173, 6.953101] 
    Mauritius: [-20.244959, 57.561768]
    Po
*/

/* Testdatavar lin = [[50.935173, 6.953101], [-20.244959, 57.561768], [0, 0],[50.935173, 6.953101]]
var b_air = [true, false, false, true] */

/* 2019 China */
var lin = [[52.375893,9.732010],[31.230391, 121.473701],[31.302420, 120.618070],[31.230391, 121.473701],[43.817070, 125.323547],
[ 22.5431, 114.0579],[31.230391, 121.473701,],[29.8683, 121.5440, ],[29.0792, 119.6474, ],[39.9042, 116.4074, ],
[39.3434, 117.3616, ],[43.817070, 125.323547, ],[52.375893,9.732010],]
var loc = ['Hannover', 'Shanghai', 'Shuzhou', 'Shanghai', 'Changchun', 
'Shenzhen', 'Shanghai', 'Ningbo', 'Jinhua', 'Beijing', 
'Tianjin', 'Changchun', 'München']
var b_air = [true, false, false, true, true, 
    true, true, false, false, true,
    true, true, true]
var b_draw = [false, true, true, false, true, true, false]
/* 2020 Atlantik Campen 
var lin = [[50.935173, 6.953101], [49.303449, 1.158169], [43.951503, -1.363952], [46.434123, 1.611364], [50.935173, 6.953101]]
var loc = ['Köln', 'Pont de l\'Arche', 'Saint-Girons Plage', 'Éguzon-Chantôme', 'Köln']
var b_air = lin == 0
var b_draw = !b_air*/
var color = "#3399cc"

// Marker with number
var vectorSourceIcon = new VectorSource();
for (var i = 1; i < lin.length - 1; i++) {
    var iconNumberFeature = new Feature({
        geometry: new Point([lin[i][1], lin[i][0]]).transform('EPSG:4326', 'EPSG:3857'),
        type: 'icon',
    });
    var iconNumberStyle = new Style({
        image: new CircleStyle({
            radius: 10,
            snapToPixel: false,
            stroke: new Stroke({
                color: '#fff',
            }),
            fill: new Fill({
                color: color,
            }),
        }),
        text: new Text({
            text: i.toString(),
            fill: new Fill({
                color: '#fff',
            }),
            font: 'bold 14px sans-serif'
        }),
    });
    iconNumberFeature.setStyle(iconNumberStyle)
    vectorSourceIcon.addFeature(iconNumberFeature)
}
var vectorLayerIcon = new VectorLayer({
    source: vectorSourceIcon,
});

// Lines
var vectorSourceLines = new VectorSource();
var vectorSourceLineShadows = new VectorSource();
var lineStyle = new Style({
    stroke: new Stroke({
        color: color,
        width: 3,
    }),
})

var styleShadow = {
    'LineString': new Style({
        stroke: new Stroke({
            color: 'rgba(0,0,0,0.25)',
            width: 5
        }),
    })
};
var styleFunctionShadow = function (feature) {
    return styleShadow[feature.getGeometry().getType()];
};
var styleLine = {
    'LineString': lineStyle
};
var styleFunctionLine = function (feature) {
    return styleLine[feature.getGeometry().getType()];
};

var numPoints = 100
for (var i = 0; i < lin.length - 1; i++) {
    var arcGenerator = new arc.GreatCircle(
        { x: lin[i][1], y: lin[i][0] },
        { x: lin[i + 1][1], y: lin[i + 1][0] }
    );
    var arcLine = arcGenerator.Arc(numPoints, { offset: 10 });
    var line = new LineString(arcLine.geometries[0].coords);
    line.transform('EPSG:4326', 'EPSG:3857');
    if (b_air[i]) {
        var lineShadowFeature = new Feature({
            geometry: line,
            finished: false
        })
        vectorSourceLineShadows.addFeature(lineShadowFeature)

        var lineAir = new LineString(arcLine.geometries[0].coords);
        lineAir.transform('EPSG:4326', 'EPSG:3857');
        lineAir.flatCoordinates = shiftLine(lineAir.flatCoordinates, 5e5)

        var lineFeature = new Feature({
            geometry: lineAir,
            finished: false,
            style: lineStyle
        })
        vectorSourceLines.addFeature(lineFeature)
    } else {
        var lineFeature = new Feature({
            geometry: line,
            finished: false,
            style: lineStyle
        })
        vectorSourceLines.addFeature(lineFeature)
    }
}
var vectorLayerLineShadows = new VectorLayer({
    source: vectorSourceLineShadows,
    style: styleFunctionShadow
});

var vectorLayerLines = new VectorLayer({
    source: vectorSourceLines,
    style: styleFunctionLine
});


// Flight path Layer

const map = new Map({
    target: 'map',
    layers: [
        /*new TileLayer({
            source: new OSM()
        }),*/
        new TileLayer({
            source: new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 19
            })
        }),
        vectorLayerLineShadows,
        vectorLayerLines,
        new TileLayer({
            source: new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 19
            })
        }),
        vectorLayerIcon,
    ],
    view: new View({
        center: [0, 0],
        zoom: 0
    })
});

function shiftPoint(p_x, p_y, distance, b_x, b_y) {
    var x = p_x - b_x
    var y = p_y - b_y
    var alpha = Math.atan(y / x)
    p_x -= Math.sin(alpha) * distance
    p_y += Math.abs(Math.cos(alpha)) * distance
    return [p_x, p_y]
}

function shiftLine(li, distance) {
    var rotli = [li[0], li[1]]
    var rotpoint = []
    var len = li.length / 2
    distance = distance / 1e7 * Math.sqrt(Math.pow(li[0] - li[len*2-2],2)+Math.pow(li[1] - li[len*2-1],2))
    for (var i = 1; i < len; i++) {
        var fac = 1 - Math.pow((i * 2 / (len - 1) - 1), 8)
        var distance_bowed = distance * fac
        rotpoint = shiftPoint(li[i * 2], li[i * 2 + 1], distance_bowed, li[0], li[1])
        rotli.push(rotpoint[0])
        rotli.push(rotpoint[1])
    }
    return rotli
}

var { createCanvas, loadImage } = require('canvas');
var dist = 25
var max_width = 100
var canvas = createCanvas(300, (lin.length-1) * dist);
var ctx = canvas.getContext('2d');


// draw box
// Draw opaque blue circle
for (var i = 1; i < lin.length - 1; i++) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(dist*0.75, (i-0.25) * dist, 10, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.arc(dist*0.75, (i-0.25) * dist, 10, 0, 2 * Math.PI, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(i.toString(), dist*0.75, (i-0.25) * dist + 5);
    //ctx.textBaseline = "middle";

    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(loc[i], dist*1.25, (i-0.25) * dist + 5);
    max_width = Math.max(ctx.measureText(loc[i]).width, max_width)
    console.log(max_width)

}
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.globalCompositeOperation='destination-over';
  ctx.roundRect(dist*0.2, dist*0.2, max_width+ dist*1.2, (lin.length-2) * dist + 0.1*dist, 10).fill(); //or .fill() for a filled rect
//loadImage('data/icon.png').then((image) => {
//   ctx.drawImage(image, 50, 0, 70, 70)

//Create the element using the createElement method.
var myDiv = document.createElement("div");

//Set its unique ID.
myDiv.id = 'div_canvas';

//Add your content to the DIV
myDiv.innerHTML = '<img src="' + canvas.toDataURL() + '" />';

//Finally, append the element to the HTML body
document.body.appendChild(myDiv);
var download = document.getElementById("download");
var image = canvas.toDataURL().replace("image/png", "image/octet-stream");
download.setAttribute("href", image);
window.open(canvas.toDataURL('image/png'));