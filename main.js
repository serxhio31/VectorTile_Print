import './style.css';
import {Map, View} from 'ol';
import VectorTile  from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import {stylefunction,applyStyle} from 'ol-mapbox-style';
import jsPDF from 'jspdf';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {get as getProjection, addProjection} from 'ol/proj';

//assign new projection
proj4.defs("EPSG:6870","+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
register(proj4)
const albProj = new getProjection('EPSG:6870');

//passing the projectioin instance to the library
addProjection(albProj);


//projection centres
const center_6870 = [485450.770941,4577283.358735];
const center_4326 = [19.8,41.3];


const map = new Map({ target: "map" });
map.setView(
  new View({
    center:center_4326,// ol.proj.fromLonLat([41, 20]),
    zoom: 0,
  })
);   
const layer = new VectorTile({declutter: true,
source: new VectorTileSource({
    format: new MVT(),
    url: 'https://basemap.asig.gov.al/server/rest/services/Hosted/Basemap_VT_0909202/VectorTileServer/tile/{z}/{y}/{x}.pbf',
  })
});
map.addLayer(layer);
//olms.applyStyle(layer, 'http://localhost:84/basemap/server/rest/services/hosted/Basemap_VT_0909202/VectorTileServer/resources/styles/root.json','','');

fetch(
"https://basemap.asig.gov.al/server/rest/services/Hosted/Basemap_VT_0909202/VectorTileServer/resources/styles/root.json"
).then(function (response) {
response.json().then(function (glStyle) {
//glStyle.sprite='./sprites/sprite';
//glStyle.glyphs='http://localhost:84/basemap/server/rest/services/hosted/Basemap_VT_0909202/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf'
// glStyle.sources.esri.url='http://localhost:84/basemap/server/rest/services/hosted/Basemap_VT_0909202/VectorTileServer/';
console.log(glStyle);
var layerIDS=[];
for(var i=0;i<glStyle.layers.length;i++){
layerIDS.push(glStyle.layers[i].id);
}
console.log(layerIDS);
//applyStyle(layer, glStyle,layerIDS);
stylefunction(layer,glStyle,layerIDS);
//apply(map, glStyle);

})

});

const dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148],
};

const exportButton = document.getElementById('export-pdf');

exportButton.addEventListener(
  'click',
  function () {
    exportButton.disabled = true;
    document.body.style.cursor = 'progress';

    const format = document.getElementById('format').value;
    const resolution = document.getElementById('resolution').value;
    const dim = dims[format];
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const size = map.getSize();
    const viewResolution = map.getView().getResolution();

    map.once('rendercomplete', function () {
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
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
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      const pdf = new jsPDF('landscape', undefined, format);
      pdf.addImage(
        mapCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        dim[0],
        dim[1]
      );
      pdf.save('map.pdf');
      // Reset original map size
      map.setSize(size);
      map.getView().setResolution(viewResolution);
      exportButton.disabled = false;
      document.body.style.cursor = 'auto';
    });

    // Set print size
    const printSize = [width, height];
    map.setSize(printSize);
    const scaling = Math.min(width / size[0], height / size[1]);
    map.getView().setResolution(viewResolution / scaling);
  },
  false
);
