mapboxgl.accessToken = 'pk.eyJ1IjoiYm5ociIsImEiOiJjazg2MXpuaTUwZDkzM2VycTJ3Nzd1aWJhIn0.m5u8w_MFie9bNVm_sIS4nw'

$(document).ready(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [121.8733, 13.5221],
        zoom: 5,
    });

    const num_colors = ['#fdd49e', '#fdbb84', '#fc8d59', '#e34a33', '#b30000']
    const num_colorScale = d3.scaleOrdinal()
      .domain(['low', 'moderate', 'high', 'very high', 'critical'])
      .range(num_colors)

    // map.addControl(
    //     new MapboxGeocoder({
    //         accessToken: mapboxgl.accessToken,
    //         mapboxgl: mapboxgl
    //     })
    // );
    //
    // map.addControl(
    //     new MapboxDirections({
    //         accessToken: mapboxgl.accessToken
    //     }),
    //     'top-right'
    // );

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
        map.addSource('facilities', {
            'type': 'geojson',
            // 'data': 'https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/conf_fac_tracking/FeatureServer/0/query?where=count_%3E0&outFields=*&f=pgeojson',
            'data': 'https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/conf_fac_tracking/FeatureServer/0/query?where=facility%3C%3E%27For%20validation%27&outFields=*&f=pgeojson',
            // 'data': facilities,
            'cluster': true,
            'clusterRadius': 60,
            'clusterProperties': {
                'cluster_count': ['+', ['get', 'count_']],
            },
        });

        map.addLayer({
            'id': 'facility',
            'type': 'circle',
            'source': 'facilities',
            'filter': ['!=', ['get', 'cluster'], true],
            'paint': {
                'circle-color': [
                    'step',
                    ['get', 'count_'],
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
            'id': 'facility_outer',
            'type': 'circle',
            'source': 'facilities',
            'filter': ['!=', ['get', 'cluster'], true],
            'paint': {
            'circle-stroke-color': [
                'step',
                ['get', 'count_'],
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
                ['get', 'count_'],
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
           'id': 'facility_cluster',
           'type': 'circle',
           'source': 'facilities',
           'filter': ['has', 'point_count'],
           'paint': {
               'circle-color': [
                   'step',
                   ['get', 'cluster_count'],
                   num_colorScale('low'),
                   100, num_colorScale('moderate'),
                   250, num_colorScale('high'),
                   500, num_colorScale('very high'),
                   99999999999, num_colorScale('critical'),
               ],
               'circle-radius': [
                 'step',
                 ['get', 'cluster_count'],
                 10,
                 15,
                 12,
                 30,
                 24,
                 45,
                 36,
                 60,
                 48,
               ],
           'circle-stroke-color': [
               'step',
               ['get', 'cluster_count'],
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
           'id': 'facility_cluster_count',
           'type': 'symbol',
           'source': 'facilities',
           'filter': ['has', 'point_count'],
           'layout': {
               'text-field': ['concat', 'FAC: ', ['get', 'point_count'], '\nCAS: ', ['get', 'cluster_count']],
               'text-size': 12
           }
       });

       buildFacilityList();

       map.on('click', 'facility_cluster', function(e) {
           var features = map.queryRenderedFeatures(e.point, {
               layers: ['facility_cluster']
           });
           var clusterId = features[0].properties.cluster_id;
           map.getSource('facilities').getClusterExpansionZoom(
               clusterId,
               function(err, zoom) {
                   if (err) return;

                   map.easeTo({
                       center: features[0].geometry.coordinates,
                       zoom: zoom
                   });
                   }
           );
       });

        map.on('click', 'facility', function(e) {
            // showPopup(e.features[0])
            var popUps = document.getElementsByClassName('mapboxgl-popup');
            /** Check if there is already a popup on the map and if so, remove it */
            if (popUps[0]) popUps[0].remove();


            var coordinates = e.features[0].geometry.coordinates.slice();
            var facility = e.features[0].properties.facility.toUpperCase();
            var covid_cases = e.features[0].properties.count_;

            var popup = `<h6 class='pt-2 pb-1' style='border-bottom: 0.5px solid #00853e; color: #00853e'>${facility}</h6><p>Confirmed Cases: ${covid_cases}</p>`

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popup)
            .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'facility', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseenter', 'facility_cluster', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'facility', function() {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseleave', 'facility_cluster', function() {
            map.getCanvas().style.cursor = '';
        });

    })

    map.resize();

    function showPopup(feature){
        var popUps = document.getElementsByClassName('mapboxgl-popup');
        /** Check if there is already a popup on the map and if so, remove it */
        if (popUps[0]) popUps[0].remove();
        var coordinates = feature.geometry.coordinates.slice();
        var facility = feature.properties.facility.toUpperCase();
        var covid_cases = feature.properties.count_;

        var popup = `<h6 class='pt-2 pb-1' style='border-bottom: 0.5px solid #00853e; color: #00853e'>${facility}</h6><p>Confirmed Cases: ${covid_cases}</p>`

        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popup)
        .addTo(map);
    }

    function buildFacilityList() {
        $.getJSON('https://services5.arcgis.com/mnYJ21GiFTR97WFg/ArcGIS/rest/services/conf_fac_tracking/FeatureServer/0/query?where=facility%3C%3E%27For%20validation%27&outFields=*&f=pgeojson', function(facilities) {
            facilities.features.forEach(function(facility, i){
                var prop = facility.properties;

                /* Add a new listing section to the sidebar. */
                var listings = document.getElementById('listings');
                var listing = listings.appendChild(document.createElement('div'));
                /* Assign a unique `id` to the listing. */
                listing.id = 'listing-' + prop.ObjectId;
                /* Assign the `item` class to each listing for styling. */
                listing.className = 'item';

                /* Add the link to the individual listing created above. */
                var link = listing.appendChild(document.createElement('a'));
                link.href = '#';
                link.className = 'title';
                link.id = 'link-' + prop.ObjectId;
                link.innerHTML = prop.facility;

                link.addEventListener('click', function(e) {
                    // console.log(this.id)
                    for (var i = 0; i < facilities.features.length; i++) {
                      if (this.id === 'link-' + facilities.features[i].properties.ObjectId) {
                        var clickedListing = facilities.features[i];
                        flyToFacility(clickedListing);
                        showPopup(clickedListing);
                      }
                    }
                        var activeItem = document.getElementsByClassName('active');
                        if (activeItem[0]) {
                        activeItem[0].classList.remove('active');
                        }
                    this.parentNode.classList.add('active');
                });

                /* Add details to the individual listing. */
                var details = listing.appendChild(document.createElement('div'));
                details.innerHTML = `Cases: ${prop.count_}`;
            });
        });
    }

    function flyToFacility(currentFeature) {
        map.flyTo({
            center: currentFeature.geometry.coordinates,
            zoom: 15
        });
        // $('#show-sidebar-btn').show();
    }

    function getComp(e) {
        if (['==', '<', '>', '<=', '>='].includes(e)) {
            return e;
        } else {
            return '<=';
        }
    };

    var filterBtn = document.getElementById('filter-btn');
    var resetMapBtn = document.getElementById('resetMap');
    // var clearBtn = document.getElementById('clear-btn');

    filterBtn.onclick = function() {
        var num = Number(document.getElementById('num-text').value);
        var comp = getComp(document.getElementById('comp-text').value);
        if (num && comp){
            map.setFilter('facility', ['all', [comp, 'count_', num]]);
            map.setFilter('facility_outer', ['all', [comp, 'count_', num]]);
            // map.setFilter('facility_cluster', ['all', [comp, ['get', 'point_count'], num], ['has', 'point_count']]);
            // map.setFilter('facility_cluster_count', ['all', [comp, ['get', 'point_count'], num], ['has', 'point_count']]);
        } else {
            map.setFilter('facility', ['!=', ['get', 'cluster'], true],);
            map.setFilter('facility_outer', ['!=', ['get', 'cluster'], true],);
            // map.setFilter('facility_cluster', ['has', 'point_count']);
            // map.setFilter('facility_cluster_count', ['has', 'point_count']);
        }
    };

    resetMapBtn.onclick = function() {
        map.flyTo({
            center: [121.8733, 13.5221],
            zoom: 5,
        });
    }

    // clearBtn.onclick = function() {
    //     document.getElementById('num-text').value = '';
    //     document.getElementById('comp-text').value = '';
    //
    //     map.setFilter('facility', ['!=', ['get', 'cluster'], true],);
    //     map.setFilter('facility_outer', ['!=', ['get', 'cluster'], true],);
    //     // map.setFilter('facility_cluster', ['has', 'point_count']);
    //     // map.setFilter('facility_cluster_count', ['has', 'point_count']);
    // };
});
