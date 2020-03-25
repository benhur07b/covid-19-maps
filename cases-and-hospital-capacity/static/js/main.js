mapboxgl.accessToken = 'pk.eyJ1IjoiYm5ociIsImEiOiJjazg2MXpuaTUwZDkzM2VycTJ3Nzd1aWJhIn0.m5u8w_MFie9bNVm_sIS4nw'

$(document).ready(function() {
var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [121.8733, 13.5221],
    zoom: 5,
});

const colors = ['#8dd3c7','#ffffb3',]
const colorScale = d3.scaleOrdinal()
  .domain(['cluster_capacity', 'cluster_cases'])
  .range(colors)

const num_colors = ['#fdd49e', '#fdbb84', '#fc8d59', '#e34a33', '#b30000']
const num_colorScale = d3.scaleOrdinal()
  .domain(['low', 'moderate', 'high', 'very high', 'critical'])
  .range(num_colors)

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

map.on('load', () => {
    map.addSource('hospital_capacity', {
        'type': 'geojson',
        'data': 'data/cases_and_capacity.geojson',
        'cluster': true,
        'clusterRadius': 50,
        'clusterProperties': {
            'cluster_capacity': ['+', ['get', 'Capacity']],
            'cluster_cases': ['+', ['get', 'Cases']],
        },
    });

    map.addLayer({
        'id': 'hospital',
        'type': 'circle',
        'source': 'hospital_capacity',
        'filter': ['!=', ['get', 'cluster'], true],
        'paint': {
            'circle-color': [
                'step',
                ['get', 'Cases'],
                num_colorScale('low'),
                10, num_colorScale('moderate'),
                50, num_colorScale('high'),
                100, num_colorScale('very high'),
                99999999999, num_colorScale('critical'),
            ],
            'circle-radius': 6,
            'circle-opacity': 1,
        }
    });

    map.addLayer({
        'id': 'hospital_outer',
        'type': 'circle',
        'source': 'hospital_capacity',
        'filter': ['!=', ['get', 'cluster'], true],
        'paint': {
        'circle-stroke-color': [
            'step',
            ['get', 'Cases'],
            num_colorScale('low'),
            10, num_colorScale('moderate'),
            50, num_colorScale('high'),
            100, num_colorScale('very high'),
            99999999999, num_colorScale('critical'),
        ],
        'circle-stroke-width': 1,
        'circle-radius': 8,
        'circle-color': [
            'step',
            ['get', 'Cases'],
            num_colorScale('low'),
            10, num_colorScale('moderate'),
            50, num_colorScale('high'),
            100, num_colorScale('very high'),
            99999999999, num_colorScale('critical'),
        ],
        'circle-opacity': 0.3,
        }
   });

   map.addLayer({
       'id': 'hospital_cluster',
       'type': 'circle',
       'source': 'hospital_capacity',
       'filter': ['has', 'point_count'],
       'paint': {
           'circle-color': [
               'step',
               ['get', 'cluster_cases'],
               num_colorScale('low'),
               100, num_colorScale('moderate'),
               250, num_colorScale('high'),
               500, num_colorScale('very high'),
               99999999999, num_colorScale('critical'),
           ],
           'circle-radius': [
             'step',
             ['get', 'cluster_cases'],
             10,
             10,
             12,
             20,
             24,
             30,
             36
           ],
       'circle-stroke-color': [
           'step',
           ['get', 'cluster_cases'],
           num_colorScale('low'),
           100, num_colorScale('moderate'),
           250, num_colorScale('high'),
           500, num_colorScale('very high'),
           99999999999, num_colorScale('critical'),
       ],
       'circle-stroke-width': 2,
       'circle-opacity': 0.3,
       }
   });

   map.addLayer({
       'id': 'hospital_cluster_count',
       'type': 'symbol',
       'source': 'hospital_capacity',
       'filter': ['has', 'point_count'],
       'layout': {
           // 'text-field': ['concat', "COV: ", ['get', 'cluster_cases'], "\nCAP: ", ['get', 'cluster_capacity']],
           'text-field': ['concat', "COV:\n", ['get', 'cluster_cases']],
           // 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
           'text-size': 12
       }
   });

   map.on('click', 'hospital_cluster', function(e) {
       var features = map.queryRenderedFeatures(e.point, {
           layers: ['hospital_cluster']
       });
       var clusterId = features[0].properties.cluster_id;
       map.getSource('hospital_capacity').getClusterExpansionZoom(
           clusterId,
           function(err, zoom) {
               if (err) return;

               map.easeTo({
                   center: features[0].geometry.coordinates,
                   zoom: zoom
               });
               }
       );
       // console.log(e.features[0].properties)
   });

    map.on('click', 'hospital', function(e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var hospital = e.features[0].properties.Hospital.toUpperCase();
        var covid_cases = e.features[0].properties.Cases;
        var cap = e.features[0].properties.Capacity;
        var address = e.features[0].properties.Address;
        var contact = e.features[0].properties.Contact;
        var service =  e.features[0].properties["Service Capability Level"];

        var popup = `<p><b>${hospital}<hr>Cases:</b><br>${covid_cases}<br><b>Capacity:</b><br>${cap}<hr><b>Service Level:</b><br>${service}<br><b>Address:</b><br>${address}<br><b>Contact:</b><br>${contact}</p>`

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popup)
        .addTo(map);
        });


    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'hospital', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseenter', 'hospital_cluster', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'hospital', function() {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseleave', 'hospital_cluster', function() {
        map.getCanvas().style.cursor = '';
    });

    // map.on('data', (e) => {
    //     if (e.sourceId !== 'hospital_capacity' || !e.isSourceLoaded) return;
    //
    //     map.on('move', updateMarkers);
    //     map.on('moveend', updateMarkers);
    //     updateMarkers();
    // });

})

map.resize();

})
