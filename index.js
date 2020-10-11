import 'ol/ol.css';
import XYZ from 'ol/source/XYZ';
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
var lin = [[-20.244959, 57.561768], [50.935173, 6.953101]]

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
        /*new TileLayer({
            source: new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 19
            })
        }),*/
        vectorLayerShadows,
        vectorLayer
    ],
    view: new View({
        center: [0, 0],
        zoom: 0
    })
});

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