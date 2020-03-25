mapboxgl.accessToken = 'pk.eyJ1IjoiYm5ociIsImEiOiJjazg2MXpuaTUwZDkzM2VycTJ3Nzd1aWJhIn0.m5u8w_MFie9bNVm_sIS4nw'

$(document).ready(function() {
var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [121.8733, 13.5221],
    zoom: 5,
});

// const colors = ['#8dd3c7','#ffffb3',]
// const colorScale = d3.scaleOrdinal()
//   .domain(["cluster_capacity", "cluster_cases"])
//   .range(colors)

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

map.on('load', () => {
    map.addSource('hospital_capacity', {
        'type': 'geojson',
        'data': 'data/hospital_capacity.geojson',
        'cluster': true,
        'clusterRadius': 50,
        'clusterProperties': {
            'cluster_capacity': ['+', ['get', 'Capacity']],
            'cluster_cases': ['+', ['get', 'Cases']],
        },
    });

    map.addLayer({
        'id': 'capacity_cluster',
        'type': 'circle',
        'source': 'hospital_capacity',
        'filter': ['has', 'point_count'],
        'paint': {
            'circle-color': 'rgba(255,255,255,0.5)',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10,
              10,
              20,
              20,
              30,
              30,
              40,
              40,
              50
            ],
        'circle-stroke-color': '#8dd3c7',
        'circle-stroke-width': 3,
        }
    });

    map.addLayer({
        'id': 'cluster-count',
        'type': 'symbol',
        'source': 'hospital_capacity',
        'filter': ['has', 'point_count'],
        'layout': {
            'text-field': ['get', 'cluster_cases'],
            // 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.on('click', 'capacity_cluster', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['capacity_cluster']
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

    map.addLayer({
        'id': 'hospital',
        'type': 'circle',
        'source': 'hospital_capacity',
        'filter': ['!=', ['get', 'cluster'], true],
        'paint': {
            'circle-color': '#2ca25f',
            'circle-radius': 4,
        }
    });

    map.addLayer({
        'id': 'hospital_outer',
        'type': 'circle',
        'source': 'hospital_capacity',
        'filter': ['!=', ['get', 'cluster'], true],
        'paint': {
        'circle-stroke-color': '#2ca25f',
        'circle-stroke-width': 1,
        'circle-radius': 8,
        'circle-color': "rgba(0, 0, 0, 0)"
        }
   });


    map.on('click', 'hospital', function(e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var hospital = e.features[0].properties.Hospital;
        var covid_cases = e.features[0].properties.Cases;
        var cap = e.features[0].properties.Capacity;
        var address = e.features[0].properties.Address;
        var contact = e.features[0].properties.Contact;
        var service =  e.features[0].properties["Service Capability Level"];

        var popup = `<p><b>${hospital}<hr>CAPACITY: ${cap}<br>CASES: ${covid_cases}</b><hr><b>Service Level:</b><br>${service}<br><b>Address:</b><br>${address}<br><b>Contact:</b><br>${contact}</p>`

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

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'hospital', function() {
        map.getCanvas().style.cursor = '';
    });

})

map.resize();

})
