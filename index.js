import 'ol/ol.css';
var ol = require('ol');
import { transform } from 'ol/proj';
import { Map, View } from 'ol';
import Circle from 'ol/geom/Circle';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import LineString from 'ol/geom/LineString';
var arc = require('arc');

var image = new CircleStyle({
    radius: 5,
    fill: null,
    stroke: new Stroke({ color: 'red', width: 1 }),
});

var styles = {
    'Point': new Style({
        image: image,
    }),
    'LineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1,
        }),
    }),
    'Shadow': new Style({
        stroke: new Stroke({
            color: 'black',
            width: 3,
            opacity: 0.5
        }),
    }),
    'MultiLineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1,
        }),
    }),
    'MultiPoint': new Style({
        image: image,
    }),
    'MultiPolygon': new Style({
        stroke: new Stroke({
            color: 'yellow',
            width: 1,
        }),
        fill: new Fill({
            color: 'rgba(255, 255, 0, 0.1)',
        }),
    }),
    'Polygon': new Style({
        stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3,
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
        }),
    }),
    'GeometryCollection': new Style({
        stroke: new Stroke({
            color: 'magenta',
            width: 2,
        }),
        fill: new Fill({
            color: 'magenta',
        }),
        image: new CircleStyle({
            radius: 10,
            fill: null,
            stroke: new Stroke({
                color: 'magenta',
            }),
        }),
    }),
    'Circle': new Style({
        stroke: new Stroke({
            color: 'red',
            width: 2,
        }),
        fill: new Fill({
            color: 'rgba(255,0,0,0.2)',
        }),
    }),
};
var styleShadow = {
    'LineString': new Style({
        stroke: new Stroke({
            color: 'rgba(0,0,0,0.25)',
            width: 5
        }),
    })
};

var styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
};

var styleFunctionShadow = function (feature) {
    return styleShadow[feature.getGeometry().getType()];
};

// Flight path Layer
var vectorSource = new VectorSource();
var vectorSourceShadows = new VectorSource();
//vectorSource.addFeature(new Feature(new Circle([5e6, 7e6], 1e6)));
/*vectorSource.addFeature(new Feature(new LineString([
    [-5e6, -5e6],
    [0, -5e6]])));
var lin = [[50.935173, 6.953101], [-20.244959, 57.561768]]*/
var lin = [[-20.244959, 57.561768], [50.935173, 6.953101]] /*UTM Easting	356,176.13
UTM Northing	5,644,611.01
UTM Easting	558,673.15
UTM Northing	7,761,311.62*/

var arcGenerator = new arc.GreatCircle(
    { x: lin[0][1], y: lin[0][0] },
    { x: lin[1][1], y: lin[1][0] }
);
var numPoints = 100
var arcLine = arcGenerator.Arc(numPoints, { offset: 10 });
var line = new LineString(arcLine.geometries[0].coords);
var line2 = new LineString(arcLine.geometries[0].coords);
line.transform('EPSG:4326', 'EPSG:3857');
console.log(line)
line2.transform('EPSG:4326', 'EPSG:3857');
vectorSourceShadows.addFeature(new Feature({
    geometry: line,
    finished: false,
}))
line2.flatCoordinates = shiftLine(line2.flatCoordinates, 5e5)
console.log(line2.flatCoordinates)
vectorSource.addFeature(new Feature({
    geometry: line2,
    finished: false,
}))


var vectorLayerShadows = new VectorLayer({
    source: vectorSourceShadows,
    style: styleFunctionShadow,
});

var vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
});

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        }),
        vectorLayerShadows,
        vectorLayer
    ],
    view: new View({
        center: [0, 0],
        zoom: 0
    })
});

/*function lineAirplane(points, fac) {
    var n = points.length
    var points_out = points
    for (var i = 1; i < n; i++) {
        // equidistant points on straight line
        points_out[i] = arAdd(points[0], arMul(arSub(points[n - 1], points[0]), i / n))
        // add distance
        points_out[i] = arAdd(points_out[i], arMul(arSub(points[i], points_out[i]), fac))
    }
    return points_out
}

function arSub(A, B) {
    for (var i = 0; i < A.length; i++) {
        A[i] -= B[i]
    }
    return A
}
function arAdd(A, B) {
    for (var i = 0; i < A.length; i++) {
        A[i] += B[i]
    }
    return A
}
function arMul(A, fac) {
    for (var i = 0; i < A.length; i++) {
        A[i] *= fac
    }
    return A
}

function listToPointList(li) {
    var poli = []
    for (var i = 0; i < li.length / 2; i++) {
        poli.push([li[i * 2], li[i * 2 + 1]])
    }
    return poli
}

function pointListToList(poli) {
    var li = []
    for (var i = 0; i < poli.length; i++) {
        li.push(poli[i][0])
        li.push(poli[i][1])
    }
    return li
}*/

function rotatePoint(p_x, p_y, angle, b_x, b_y) {
    var x = p_x - b_x
    var y = p_y - b_y
    p_x = x * Math.cos(angle) - y * Math.sin(angle)
    p_y = x * Math.sin(angle) + y * Math.cos(angle)
    p_x += b_x
    p_y += b_y
    return [p_x, p_y]
}

function rotateLine(li, angle) {   
    var rotli = [] 
    var rotpoint = []
    var len = li.length / 2
    for (var i = 0; i < len; i++) {
        var angle_bowed = angle*Math.pow(1- (i*2/(len-1)-1),4)
        rotpoint = rotatePoint(li[i * 2], li[i * 2 + 1], angle_bowed, li[0], li[1])
        rotli.push(rotpoint[0])
        rotli.push(rotpoint[1])
    }
    return rotli
}

function shiftPoint(p_x, p_y, distance, b_x, b_y) {
    var x = p_x - b_x
    var y = p_y - b_y
    var alpha = Math.atan(y/x)
    p_x -= Math.sin(alpha)*distance
    p_y += Math.abs(Math.cos(alpha))*distance
    return [p_x, p_y]
}

function shiftLine(li, distance) {
    var rotli = [li[0], li[1]]
    var rotpoint = []
    var len = li.length / 2
    for (var i = 1; i < len; i++) {
        var fac = 1- Math.pow((i*2/(len-1)-1),8)
        var distance_bowed = distance*fac
        rotpoint = shiftPoint(li[i * 2], li[i * 2 + 1], distance_bowed, li[0], li[1])
        rotli.push(rotpoint[0])
        rotli.push(rotpoint[1])
    }
    return rotli
}