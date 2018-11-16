$class('map.MapHandler').define({
    map: null,
    
    initMap: function(domId){
        var me = this;
        this.map = new olleh.maps.Map(document.getElementById(domId), {
            zoomControl: true,
            zoomControlOptions: {
                  top: 10,
                  right: 15
            },
            panControl: false,
            scaleControl: true,
            scaleControlOptions:{
                    left: 7, // 기본 14
                    bottom:5
            },
            copyrightControl: true,
            copyrightControlOptions:{bottom:9},
            mapTypeControl: false,
            measureControl: true,
            measureControlOptions:{right:15},
            zoom:11,
            center: new olleh.maps.UTMK(953828.1032726372, 1952440.2230947923)
        });
    
        //var coordCenter = new olleh.maps.UTMK(953828.1032726372, 1952440.2230947923); //958386.063532902, 1941447.5761742294:우면동, 953828.1032726372, 1952440.2230947923:광화문, 965898.9999999991, 1928928.9999999197:분당
        //this.map.setCenter(coordCenter);
        //this.map.setZoom(11);
        _map = this.map;

        $('.btn_present').click(function() {
            if (navigator.geolocation) { // GPS를 지원하면
                navigator.geolocation.getCurrentPosition(function(position) {
                    var position = new olleh.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    _map.panTo(position);
                }, function(error) {
                    console.error(error);
                }, {
                    enableHighAccuracy: false,
                    maximumAge: 0,
                    timeout: Infinity
                });
            } else {
                alert('GPS를 지원하지 않습니다');
            }
        });
    }
});
