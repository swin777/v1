$class('tool.ThemeLayer').define({
    wrap_facilty: $(".wrap_facilty"), 
    themeByn: $(".themeByn"), 
    themeMsg: $(".themeMsg"), 
    themeSelectImg: $("#themeSelectImg"),
    
    tmpl:{},
    markerArr:[],
    themeCode:null,
    markerImgUrl:null,
    resultPois:null,
    exeMode:false,
    clusterer: null,
    infoWindow: null,
    guidVal:null,
    idleEvent:true,
    warnMsged:false,

    ThemeLayer: function(){
        var me = this;
        require(["raw-loader!./html/routeInfoWindow.html", "raw-loader!./html/placeClusterInfoWindow.html"],
            function(routeInfoWindow, placeClusterInfoWindow) {
                me.tmpl.routeInfoWindow = routeInfoWindow;
                me.tmpl.placeClusterInfoWindow = placeClusterInfoWindow;
            }
        );        
        me.clusterer = new olleh.maps.overlay.MarkerClusterer({
            gap: 1,
            displayArea: false,
            minZoom: 0,
            maxZoom: 14,
            clusterOpts: {
                iconFn: function (size) {
                    this.setDisplaySize(true);
                    var iconInfo = olleh.maps.overlay.MarkerCluster.DEFAULT_ICON_FN(size);
                    iconInfo.origin = new olleh.maps.Point(51 * (4 - Math.min(Math.floor(size / 20), 4)), -3);
			        return iconInfo;
                }
            },
            afterCluster: function (cluster) {
                cluster.onEvent('click', function(e){
                    me.clusterInfoWindowShow(cluster.getAllMarkers());
                });
            }
        }),
        me.clusterer.setMap(_map);
        me.domEvent();
        me.mapEvent();
    },

    domEvent: function(){
        var me = this;
        $(".btn_theme").click(function(){
            me.wrap_facilty.css({"display":"block"});
        });

        $(".close_facilty").click(function(){
            me.wrap_facilty.css({"display":"none"});
        });

        me.themeByn.click(function(){
            var tDom = $(this);
            if(tDom.parent().attr('class')=='off'){
                me.themeByn.parent().attr('class', 'off');
                tDom.parent().attr('class', 'on');
                me.themeCode = tDom.attr('code');
                me.markerImgUrl = $(tDom.children()[0]).attr('src');
                me.themeSelectImg.attr('src', me.markerImgUrl);
                if(_map.getZoom()<11){
                    _map.setZoom(11);
                }
                me.searchCall(0);
            }else{
                tDom.parent().attr('class', 'off');
                me.themeCode = null;
                me.markerImgUrl = null;
                me.themeSelectImg.attr('src', './assets/images/btn_thema.png');
                me.mapClear();
            }
        });
    },

    mapEvent: function(){
        var me = this;
        _map.onEvent('idle', function() {
            if(me.idleEvent){
                me.searchCall(0);
            }
            me.idleEvent = true;
        });
        _map.onEvent('click', function(event) {
            if(event.originEvent.target.id=='layer_container' && me.infoWindow){
                me.infoWindow.close();
                if(me.idleEvent){
                    me.searchCall(0);
                }else{
                    me.idleEvent = true;
                }
            }
            return;
        });
    },

    warnMsgShow: function(){
        var me = this;
        if(!me.warnMsged){
            me.themeMsg.show();
            me.timerwarn = setInterval(function() {
                clearInterval(me.timerwarn);
                me.themeMsg.hide();
            },2000);
            me.warnMsged = true;
        }
    },

    searchCall: function(start){
        var me = this;
        me.mapClear();
        if(!me.themeCode){
            return;
        }
        if(_map.getZoom()<11){
            if(me.themeCode){
                me.warnMsgShow();
            }
            return;
        }
        me.warnMsged = false;
        if(start==0){
            me.resultPois = [];
            me.guidVal = _app.guid();
        }
        var point = olleh.maps.LatLng.valueOf(_map.getCenter());
        var lefBottom = olleh.maps.LatLng.valueOf(_map.getBounds().leftBottom);
        var rightTop = olleh.maps.LatLng.valueOf(_map.getBounds().rightTop);
        $.ajax({
            //url: _app.geomasterUrl+"/search/v1.0/pois?sortBy=rank&numberOfResults=50&start="+start+"&guid="+me.guidVal,
            url: _app.geomasterUrl+"/search/v1.0/pois?numberOfResults=50&start="+start+"&guid="+me.guidVal,
            type: "post",
            contentType: "application/json",
            dataType: "json",
            headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
			data: JSON.stringify({
                "theme":{"code":[me.themeCode]},
                //"point":{"lat":point.y, "lng":point.x},
                "bound":{"left":lefBottom.x, "bottom":lefBottom.y, "right":rightTop.x, "top":rightTop.y}
            }),
			success: function(result) {
                var remberGuidVal = this.url.split('guid=')[1];
                if(remberGuidVal==me.guidVal){
                    me.resultPois = me.resultPois.concat(result.pois);
                    if(result.numberOfPois>50 && result.numberOfPois>start && result.pois.length==50 && start<49 && _map.getZoom()!=13){
                        start += 50;
                        me.searchCall(start);
                    }else{
                        me.mapDisplay();
                    }
                }
            },
            error: function(err){}
        });
    },

    mapDisplay: function(){
        var me = this;
        me.clusterer.setMap(null);
        me.resultPois.forEach((element, idx) => {
            var latLngPoint = new olleh.maps.LatLng(element.point.lat, element.point.lng);
            var point = olleh.maps.UTMK.valueOf(latLngPoint)
            var marker = new olleh.maps.overlay.Marker({
                position: point,
                icon:{url:me.markerImgUrl, size: new olleh.maps.Size(22, 22)},
            });

            var phone = '';
            if(element.phones){
                if(element.phones.normal && element.phones.normal.length>0){
                    phone = element.phones.normal[0];
                }
                if(element.phones.representation && element.phones.representation.length>0){
                    phone = element.phones.representation[0];
                }
            }
            var obj = {id:element.id, name:element.name, imgUrl:me.markerImgUrl, typeImgUrl:me.markerImgUrl,
                    phone:phone, category:element.category.middleName + " > " + element.category.subName,
                    address:element.address.siDo + " " + element.address.siGunGu + " " + element.address.street + " " + element.address.streetNumber,
                    addressGibun:element.address.eupMyeonDong + " " + element.address.houseNumber
            };
            marker.purifyData = obj;
            marker.onEvent('click', function(e) {
                me.infoWindowShow(marker);
            });
            me.markerArr.push(marker);
            me.clusterer.add(marker);
        });
        _app.placeSearch.release();
        _app.roadSearch.release();
        me.clusterer.setMap(_map);
    },

    mapClear: function(){
        var me = this;
        me.clusterer.clear();
        me.markerArr = [];
    },

    infoWindowShow: function(marker){
        var me = this;
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
        me.idleEvent = false;
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: marker.getPosition(),
            disableCloseButton: true,
            padding: 0,
            content: olleh.maps.util.applyTemplate(me.tmpl.routeInfoWindow, marker.purifyData)
        });
        me.infoWindow.setPixelOffset(new olleh.maps.Point(0, 10));
        me.infoWindow.open(_map, marker);
        me.timer = setInterval(function() {
            clearInterval(me.timer);
            $(".btn_lyclose").click(function(){
                if(me.infoWindow){
                    me.infoWindow.close();
                }
                if(me.idleEvent){
                    me.searchCall(0);
                }else{
                    me.idleEvent = true;
                }
            });
    
            $(".btn_geolist .ico_start").click(function(){
                me.infoWindow.close();
                _app.placeSearch.hide();
                _app.roadSearch.show();
                _app.roadSearch.setStart(marker);
            });
    
            $(".btn_geolist .ico_end").click(function(){
                me.infoWindow.close();
                _app.placeSearch.hide();
                _app.roadSearch.show();
                _app.roadSearch.setEnd(marker);
            });
        },500);
    },

    clusterInfoWindowShow: function(markerArr){
        var me = this;
        var tmpl = '';
        if(_map.getZoom()<13){
            return;
        }
        me.idleEvent = false;
        var lastmaker = null;
        markerArr.forEach((marker, idx) => {
            lastmaker = marker;
            tmpl += olleh.maps.util.applyTemplate(me.tmpl.placeClusterInfoWindow, marker.purifyData)
        })
        if(me.infoWindow){
            me.infoWindow.close();
        }
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: lastmaker.getPosition(),
            disableCloseButton: true,
            padding: 6,
            content: tmpl
        });
        me.infoWindow.setPixelOffset(new olleh.maps.Point(0, 10));
        me.infoWindow.open(_map, lastmaker);
        me.custerTimer = setInterval(function() {
            clearInterval(me.custerTimer);
            $(".js_link").click(function(){
                var me = _app.themeLayer;
                var id = this.id;
                markerArr.forEach((marker, idx) => {
                    if(id==marker.purifyData.id){
                        me.infoWindowShow(marker);
                        return;
                    }
                });
            });
        },500);
    },

    selectRelease: function(){
        var me = this;
        me.themeByn.parent().attr('class', 'off');
        me.themeCode = null;
        me.markerImgUrl = null;
        me.themeSelectImg.attr('src', './assets/images/btn_thema.png');
        me.mapClear();
    }
});