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
import GPX from 'ol/format/GPX';
import {Control, defaults as defaultControls} from 'ol/control';
var arc = require('arc');
var fs = require('fs');
var JSZip = require("jszip");
var zip = new JSZip();
import { saveAs } from 'file-saver';

require('dotenv').config();
var maptiler_key = process.env.MAPTILER_KEY

/*
Orte: https://www.latlong.net/place/cologne-germany-14658.html
    Köln: [50.935173, 6.953101] 
    Mauritius: [-20.244959, 57.561768]
    Po
*/
/* get gpx from

*/
/*
var trip_name = "2020_atlantik"
var color = "#3399cc"
*/

var trip_name = "2019_china"
var color = "#CC334C"


/* other colors https://www.htmlcsscolor.com/hex/3399CC#:~:text=HEX%20color%20%233399CC%2C%20Color%20name,%2D%20HTML%20CSS%20Color
Triadic Colors
 #CC3399 #99CC33
Analogous Colors
 #334CCC #33CCB2
Split complements Colors
 #CC334C #CCB233
Complementary Color
 #CC6633
*/
var numArcPoints = 100
var trip = JSON.parse(fs.readFileSync('static/data/trips/' + trip_name + '/trip.json'))
var loc = JSON.parse(fs.readFileSync('static/data/trips/' + trip_name + '/locations.json'))

// Marker with number
var vectorSourceIcon = new VectorSource();
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
    'LineString': lineStyle,
    'MultiLineString': lineStyle
};
var styleFunctionLine = function (feature) {
    return styleLine[feature.getGeometry().getType()];
};
var radiusIcon = 10;

var drawnIcons = []
var iSkipped = 0

var vectorLayersGPX = []

window.onload = function () {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    }

    // Canvas setup
    var { createCanvas, loadImage } = require('canvas');
    var dist = 25
    var max_width = 100

    var canvas_legend = document.getElementById("canvas-legend")
    canvas_legend.width = 300
    canvas_legend.height = (trip.length + 1) * dist
    var ctx_legend = canvas_legend.getContext('2d');

    var canvas_icon = document.getElementById("canvas-icon")
    canvas_icon.width = radiusIcon * 2 + 2
    canvas_icon.height = canvas_icon.width
    var ctx_icon = canvas_icon.getContext('2d');

    var canvas_icon_hd = document.getElementById("canvas-icon-hd")
    canvas_icon_hd.width = radiusIcon * 8 + 16
    canvas_icon_hd.height = canvas_icon_hd.width
    var ctx_icon_hd = canvas_icon_hd.getContext('2d');


    // iteration
    for (var i = 0; i < trip.length; i++) {
        
        // generate icon
        ctx_icon.beginPath();
        ctx_icon.fillStyle = color;
        ctx_icon.arc(canvas_icon.width / 2, canvas_icon.width / 2, radiusIcon, 0, 2.0 * Math.PI);
        ctx_icon.fill();
        ctx_icon.beginPath();
        ctx_icon.strokeStyle = "#fff";
        ctx_icon.arc(canvas_icon.width / 2, canvas_icon.width / 2, radiusIcon, 0, 2.0 * Math.PI);
        ctx_icon.stroke();

        ctx_icon.beginPath();
        ctx_icon.fillStyle = "white";
        ctx_icon.font = "bold 14px sans-serif";
        ctx_icon.textAlign = "center";
        ctx_icon.fillText((i - iSkipped + 1).toString(), canvas_icon.width / 2, canvas_icon.width / 2 + 5);

        
        // generate icon_hd hd
        ctx_icon_hd.beginPath();
        ctx_icon_hd.fillStyle = color;
        ctx_icon_hd.arc(canvas_icon_hd.width / 2, canvas_icon_hd.width / 2, radiusIcon*4, 0, 2.0 * Math.PI);
        ctx_icon_hd.fill();
        ctx_icon_hd.beginPath();
        ctx_icon_hd.strokeStyle = "#fff";
        ctx_icon_hd.lineWidth = 4;
        ctx_icon_hd.arc(canvas_icon_hd.width / 2, canvas_icon_hd.width / 2, radiusIcon*4, 0, 2.0 * Math.PI);
        ctx_icon_hd.stroke();

        ctx_icon_hd.beginPath();
        ctx_icon_hd.fillStyle = "white";
        ctx_icon_hd.font = "bold 56px sans-serif";
        ctx_icon_hd.textAlign = "center";
        ctx_icon_hd.fillText((i - iSkipped + 1).toString(), canvas_icon_hd.width / 2, canvas_icon_hd.width / 2 + 20);

        zip.file(i.toString()+"_"+trip[i].name+".png", canvas_icon_hd.toDataURL('image/png').split('base64,')[1], {base64: true})
        // draw icon on map if not skipped
        if (trip[i].skip) { 
            iSkipped++
        } else {
            // draw icon in legend
            ctx_legend.beginPath();
            ctx_legend.fillStyle = color;
            ctx_legend.arc(dist * 0.75, (i - iSkipped + 0.75) * dist, radiusIcon, 0, 2.0 * Math.PI);
            ctx_legend.fill();
            ctx_legend.beginPath();
            ctx_legend.strokeStyle = "#fff";
            ctx_legend.arc(dist * 0.75, (i - iSkipped + 0.75) * dist, radiusIcon, 0, 2.0 * Math.PI);
            ctx_legend.stroke();

            ctx_legend.beginPath();
            ctx_legend.fillStyle = "white";
            ctx_legend.font = "bold 14px sans-serif";
            ctx_legend.textAlign = "center";
            ctx_legend.fillText((i - iSkipped + 1).toString(), dist * 0.75, (i - iSkipped + 0.75) * dist + 5);
            //ctx.textBaseline = "middle";

            ctx_legend.beginPath();
            ctx_legend.fillStyle = "black";
            ctx_legend.font = "bold 14px sans-serif";
            ctx_legend.textAlign = "left";
            ctx_legend.fillText(trip[i].name, dist * 1.25, (i - iSkipped + 0.75) * dist + 5);
            max_width = Math.max(ctx_legend.measureText(trip[i].name).width, max_width)

            // draw icon on map
            if (!drawnIcons.includes(trip[i].name)) {
                // only if it has not been drawn with previous number

                //draw on map
                var iconNumberFeature = new Feature({
                    geometry: new Point([loc[trip[i].name][1], loc[trip[i].name][0]]).transform('EPSG:4326', 'EPSG:3857'),
                    type: 'icon',
                });

                var iconNumberStyle = new Style({
                    image: new Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        src: canvas_icon.toDataURL('image/png'),//'data/icon.png',
                    }),/*circleStyle,
                    text: new Text({
                        text: i.toString(),
                        fill: new Fill({
                            color: '#fff',
                        }),
                        font: 'bold 14px sans-serif'
                    }),*/
                });
                iconNumberFeature.setStyle(iconNumberStyle)
                vectorSourceIcon.addFeature(iconNumberFeature)
                drawnIcons.push(trip[i].name)
            }
        }
        // draw line for all but last
        if (i != trip.length - 1) {
            if (trip[i].route && trip[i].route != "flight") {
                // trip data available

                vectorLayersGPX.push(new VectorLayer({
                    source: new VectorSource({
                        url: 'data/trips/2020_atlantik/' + trip[i].route + '.gpx',
                        format: new GPX(),
                    }),
                    style: styleFunctionLine
                }))
            } else {
                // trip data not available
                // convert line to arc
                var arcGenerator = new arc.GreatCircle(
                    { x: loc[trip[i].name][1], y: loc[trip[i].name][0] },
                    { x: loc[trip[i + 1].name][1], y: loc[trip[i + 1].name][0] }
                );
                var arcLine = arcGenerator.Arc(numArcPoints, { offset: 10 });
                var line = new LineString(arcLine.geometries[0].coords);
                line.transform('EPSG:4326', 'EPSG:3857');
                if (trip[i].route == "flight") {
                    // trip is flight
                    vectorSourceLineShadows.addFeature(new Feature({
                        geometry: line,
                        finished: false
                    }))

                    var lineAir = new LineString(arcLine.geometries[0].coords);
                    lineAir.transform('EPSG:4326', 'EPSG:3857');
                    lineAir.flatCoordinates = shiftLine(lineAir.flatCoordinates, 5e5)

                    vectorSourceLines.addFeature(new Feature({
                        geometry: lineAir,
                        finished: false,
                        style: lineStyle
                    }))
                } else {
                    // trip is not flight
                    vectorSourceLines.addFeature(new Feature({
                        geometry: line,
                        finished: false,
                        style: lineStyle
                    }))
                }
            }
        }
    }
    // assign vectors to layers
    var vectorLayerIcon = new VectorLayer({
        source: vectorSourceIcon,
    });

    var vectorLayerLineShadows = new VectorLayer({
        source: vectorSourceLineShadows,
        style: styleFunctionShadow
    });

    var vectorLayerLines = new VectorLayer({
        source: vectorSourceLines,
        style: styleFunctionLine
    });

    var view = new View({
        center: [0, 0],
        zoom: 0.5
    })

    // create map based on layers
    const map = new Map({
        target: 'map',
        layers: [
            /*new TileLayer({
                source: new OSM()
            }),*/
            /*new TileLayer({
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
            }),*/
            new TileLayer({
                source: new XYZ({
                    url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + maptiler_key,
                    //url: 'https://api.maptiler.com/maps/fd2908cc-7de9-44b0-a421-ac67b1026961/?key=' + maptiler_key + '#{z}/{x}/{y}',
                    maxZoom: 7,
                    crossOrigin: "anonymous"
                })
            }),
            //https://api.maptiler.com/maps/fd2908cc-7de9-44b0-a421-ac67b1026961/
            /*new TileLayer({
                source: new XYZ({
                    url: 'https://api.maptiler.com/tiles/hillshades/{z}/{x}/{y}.png?key=' + maptiler_key,
                    maxZoom: 23,
                })
            }),*/
            vectorLayerLineShadows,
            vectorLayerLines,
            ...vectorLayersGPX,
            vectorLayerIcon,
        ],
        view: view
    });


    //map.getView().fit(vectorSourceLines.getExtent(), {padding: [100, 100, 100, 100]});
    map.getView().fit(vectorSourceIcon.getExtent(), { padding: [300, 300, 300, 300] });


    ctx_legend.fillStyle = "rgba(255,255,255,0.5)";
    ctx_legend.globalCompositeOperation = 'destination-over';
    ctx_legend.roundRect(dist * 0.2, dist * 0.2, max_width + dist * 1.2, (trip.length - iSkipped) * dist + 0.1 * dist, 10).fill(); //or .fill() for a filled rect
    //loadImage('data/icon.png').then((image) => {
    //   ctx.drawImage(image, 50, 0, 70, 70)

    /*var image = canvas_legend.toDataURL().replace("image/png", "image/octet-stream");
    download.setAttribute("href", image);
    window.open(canvas_legend.toDataURL('image/png'));*/

    
    //Download not possible for canvas with external sources
    //var image = mapCanvas.toDataURL().replace("image/png", "image/octet-stream");
    //window.open(mapCanvas.toDataURL('image/png'));
    //mapCanvas.toBlob(function (blob) {
    //    saveAs(blob, 'map.png');
    //})
    
    //Download not possible for canvas with external sources
    //var mapCanvas = document.getElementsByTagName('canvas')[0]
    //zip.file("_canvas_" + trip_name + ".png", mapCanvas.toDataURL('image/png').split('base64,')[1], {base64: true})
    zip.file("_legend_" + trip_name + ".png", canvas_legend.toDataURL('image/png').split('base64,')[1], {base64: true})
        // Generate the zip file asynchronously
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        // Force down of the Zip file
        saveAs(content, trip_name + ".zip");
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
        distance = distance / 1e7 * Math.sqrt(Math.pow(li[0] - li[len * 2 - 2], 2) + Math.pow(li[1] - li[len * 2 - 1], 2))
        for (var i = 1; i < len; i++) {
            var fac = 1 - Math.pow((i * 2 / (len - 1) - 1), 8)
            var distance_bowed = distance * fac
            rotpoint = shiftPoint(li[i * 2], li[i * 2 + 1], distance_bowed, li[0], li[1])
            rotli.push(rotpoint[0])
            rotli.push(rotpoint[1])
        }
        return rotli
    }
}



//https://openlayers.org/en/latest/examples/custom-controls.html
var btnDownload = document.getElementById('download')


btnDownload.addEventListener('click', () => {
    console.log(map)
    console.log(view)
    view.fit(vectorSourceLines.getExtent(), { padding: [100, 100, 100, 100] });
})
document.getElementById('testButton').click(function(){
    console.log(map)
    console.log(view)
    view.fit(vectorSourceLines.getExtent(), { padding: [100, 100, 100, 100] });
});