$class('tool.PlaceSearch').define({
    tmpl:{}, //템블릿 html
    searchResult: null, //검색결과
    sortBy:'relevance', //관련도순:relevance, 랭킹:rank 거리순:distance
    currMakers: [],

    geo_box01_dom: $('#geo_box01'), //검색입력영역
    placeResult_dom:$("#placeResult"),
    placeList_dom:$('#placeList'),
    placePage_dom:$('#placePage'),
    placeKeyword_dom: $('#placeKeyword'),
    placeKeywordStr_dom: $('#placeKeywordStr'),
    placeCnt_dom: $('#placeCnt'),
    placeOrder1_dom: $('#placeSearchResult #placeOrder1'),
    placeOrder2_dom: $('#placeSearchResult #placeOrder2'),
    placeSearchResult_dom: $("#placeSearchResult"), //검색결과영역
    placeElement_dom:null,

    clusterer: null,
    infoWindow: null,
    autoComplate:null, 
    pageNavi: null, 

    //생성자
    PlaceSearch: function(){
        var me = this;
        require(["raw-loader!./html/placeResult.html", "raw-loader!./html/placeInfoWindow.html", 
                 "raw-loader!./html/placeClusterInfoWindow.html", '../util/autoComplate', '../util/pageNavi'],
            function(placeResultHtml, placeInfoWindow, placeClusterInfoWindow, autoComplate, pageNavi) {
                me.tmpl.placeResultHtml = placeResultHtml;
                me.tmpl.placeInfoWindow = placeInfoWindow;
                me.tmpl.placeClusterInfoWindow = placeClusterInfoWindow;
                me.autoComplate = new util.AutoComplate(me.placeKeyword_dom, {fun:me.autoComplateCallback, thisArg:me});
                me.pageNavi = new util.PageNavi(me.placePage_dom, {fun:me.searchCall, thisArg:me});
            }
        );
        me.clusterer = new olleh.maps.overlay.MarkerClusterer({
            gap: 1,
            displayArea: false,
            minZoom: 0,
            maxZoom: 14,
            clusterOpts: {
                iconFn: function (size) {
                    //this.setDisplaySize(true);
                    // var iconInfo = olleh.maps.overlay.MarkerCluster.DEFAULT_ICON_FN(size);
                    // iconInfo.origin = new olleh.maps.Point(51 * (4 - Math.min(Math.floor(size / 20), 4)), -3);
                    // return iconInfo;
                    return {
                        url: './assets/images/ic_now_plus.png',
                        size: new olleh.maps.Size(25, 32),
                        anchor: new olleh.maps.Point(12, 32),
                        origin: new olleh.maps.Point(-2, 0)
                    };
                }
            },
            afterCluster: function (cluster) {
                cluster.onEvent('click', function(e){
                    me.clusterInfoWindowShow(cluster.getAllMarkers());
                });
            }
        }),
        me.clusterer.setMap(_map);
        me.mapEvent();
        me.domEvent();
    },

    //dom의 이벤트바인딩
    domEvent: function(){
        var me = this;
        $(".btn_d").click(function() {
			$("#aside").stop().animate({left: '0px'}, 500 );
			$(".bg_black").css({"display":"block"});
        });
        
        $("#geo_box01 .btn_search").click(function() {
            me.searchCall(true);
        });

        $("#placeClear").click(function(){
            me.placeResult_dom.html('');
            me.placeList_dom.scrollTop(0);
            me.placeKeywordStr_dom.text('');
            me.placeCnt_dom.text('');
            me.pageNavi.clear();
            me.clusterer.clear();
        });

        me.placeOrder1_dom.click(function(){
            me.placeOrder1_dom.attr('class', 'on');
            me.placeOrder2_dom.attr('class', '');
            me.sortBy = 'relevance';
            me.searchCall();
        });
        me.placeOrder2_dom.click(function(){
            me.placeOrder1_dom.attr('class', '');
            me.placeOrder2_dom.attr('class', 'on');
            me.sortBy = 'distance';
            me.searchCall();
        });

        $(".btn_road").click(function () {
            _app.placeSearch.hide();
            _app.roadSearch.show();
        });
    },

    //지도의 이벤트바인딩
    mapEvent: function(){
        var me = this;
        _map.onEvent('click', function(event) {
            if(event.originEvent.target.id=='layer_container' && me.infoWindow){
                me.infoWindow.close();
                me.listElementFocus(null);
            }
            return;
        });
    },

    //장소검색 api호출 및 결과처리
    searchCall: function(pageInit){
        var me = this;
        if(me.placeKeyword_dom.val()==""){
            return;
        }
        if(pageInit){
            me.pageNavi.clear();
        }
        me.placeResultVisible();
        me.autoComplate.close();
        var start = (me.pageNavi.currentPage-1) * me.pageNavi.pageSize;
        var point = olleh.maps.LatLng.valueOf(_map.getCenter());
        $.ajax({
			url: _app.geomasterUrl+"/search/v1.0/pois?sortBy="+me.sortBy+"&numberOfResults="+me.pageNavi.pageSize+"&start="+start,
            type: "post",
            contentType: "application/json",
            dataType: "json",
            headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
			data: JSON.stringify({"terms":me.placeKeyword_dom.val(), "point":{"lat":point.y, "lng":point.x}}),
			success: function(result) {
                me.searchResult = result;
                if(me.searchResult.pois){
                    me.placeDisplay();
                    me.mapDisplay();
                    me.placeKeywordStr_dom.text(me.placeKeyword_dom.val());
                    me.placeCnt_dom.text(me.searchResult.numberOfPois + "건");
                }
            },
            error: function(err){
            }
        });
    },

    autoComplateCallback: function(keyWord){
        this.searchCall();
    },

    placeResultVisible: function(){
        var me = this;
        me.placeSearchResult_dom.show();
        _app.eventbusjs.dispatch('placeSearchShow');
    },

    placeDisplay: function(){
        var me = this;
        me.placeResult_dom.html('');
        me.placeList_dom.scrollTop(0);
        me.searchResult.pois.forEach((element, idx) => {
            var phone = '';
            if(element.phones){
                if(element.phones.normal && element.phones.normal.length>0){
                    phone = element.phones.normal[0];
                }
                if(element.phones.representation && element.phones.representation.length>0){
                    phone = element.phones.representation[0];
                }
            }
            var obj = {id:element.id, order:String.fromCharCode(65+idx), name:element.name,
                    phone:phone, category:element.category.middleName + " > " + element.category.subName,
                    address:element.address.siDo + " " + element.address.siGunGu + " " + element.address.street + " " + element.address.streetNumber,
                    addressGibun:element.address.eupMyeonDong + " " + element.address.houseNumber,
                    extension:element.extension
            };
            element.purifyData = obj;
            me.placeResult_dom.append(olleh.maps.util.applyTemplate( me.tmpl.placeResultHtml, obj));
        });
        //이벤트바이딩.
        var startBtn = $('#placeList .placeElement .ico_start');
        var endBtn = $('#placeList .placeElement .ico_end');
        me.placeElement_dom = $('#placeList .placeElement');
        me.placeElement_dom.click(function(){
            var me = _app.placeSearch;
            me.placeElement_dom.attr('class', 'placeElement');
            $(this).attr('class', 'placeElement on');
            me.currMakers.forEach((marker, idx) => {
                if(this.id==marker.uuid){
                    me.infoWindowShow(marker, marker.purifyData, true, true, false);
                    marker.orgZIndex = $(marker.elements.upper_overlay_pane).css('z-index');
                    marker.setZIndex(olleh.maps.overlay.BaseOverlay.MAX_ZINDEX);
                    return;
                }
            });
        })
        startBtn.click(function(event){
            event.stopPropagation();
            me.currMakers.forEach((marker, idx) => {
                if(this.id=='start_'+marker.uuid){
                    _app.placeSearch.hide();
                    _app.roadSearch.show();
                    _app.roadSearch.setStart(marker);
                    return;
                }
            });
        });
        endBtn.click(function(event){
            event.stopPropagation();
            me.currMakers.forEach((marker, idx) => {
                if(this.id=='end_'+marker.uuid){
                    _app.placeSearch.hide();
                    _app.roadSearch.show();
                    _app.roadSearch.setEnd(marker);
                    return;
                }
            });
        });
        
        if(me.searchResult.numberOfPois > me.pageNavi.pageSize){
            me.pageNavi.makeNavi(me.searchResult.numberOfPois)
            me.pageNavi.show();
        }else{
            me.pageNavi.hide();
        }
    },

    listElementFocus: function(marker){
        var me = this;
        me.placeElement_dom.attr('class', 'placeElement');
        if(marker){
            for(var i=0; i<me.placeElement_dom.length; i++){
                if(me.placeElement_dom[i].id==marker.uuid){
                    $(me.placeElement_dom[i]).attr('class', 'placeElement on');
                    me.placeList_dom.scrollTop(144*i);
                    return;
                }
            }
        }
    },

    mapDisplay: function(){
        var me = this;
        var bound = null;
        me.currMakers = [];
        me.clusterer.clear();
        me.clusterer.setMap(null);
        me.searchResult.pois.forEach((element, idx) => {
            var latLngPoint = new olleh.maps.LatLng(element.point.lat, element.point.lng);
            var point = olleh.maps.UTMK.valueOf(latLngPoint)
            var marker = new olleh.maps.overlay.Marker({
                position: point,
                icon:{url:'./assets/images/ic_firm_'+String.fromCharCode(65+idx)+'.png'},
            });
            marker['uuid'] = element.id;
            marker['purifyData'] = element.purifyData;
            marker['purifyData']['imgUrl'] = './assets/images/ic_firm_'+String.fromCharCode(65+idx)+'.png';
            marker.onEvent('click', function(e) {
                me.infoWindowShow(marker, element.purifyData, false, false, true);
            });
            me.currMakers.push(marker);
            me.clusterer.add(marker);
            //_app.themeLayer.selectRelease();

            if(idx==0){
                bound = new olleh.maps.Bounds(point, point);
            }else{
                bound = bound.union(point);
            }
        });
        if(bound){
            bound.expand(300, 400);
            _map.fitBounds(bound);
        }
        me.clusterer.setMap(_map);
    },

    infoWindowShow: function(marker, purifyData, maxZoomIn, centerMove, listFocus){
        var me = this;
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
        if(listFocus){
            me.listElementFocus(null);
        }
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: marker.getPosition(),
            disableCloseButton: true,
            padding: 0,
            content: olleh.maps.util.applyTemplate(me.tmpl.placeInfoWindow, purifyData)
        });
        if(centerMove){
            _map.setCenter(marker.getPosition());
        }
        if(maxZoomIn){
            _map.setZoom(13);
        }
        me.infoWindow.setPixelOffset(new olleh.maps.Point(0, 10));
        me.infoWindow.open(_map, marker);
        if(listFocus){
            me.listElementFocus(marker);
        }
        me.timer = setInterval(function() {
            clearInterval(me.timer);
            $(".btn_lyclose").click(function(){
                if(me.infoWindow){
                    me.infoWindow.close();
                    me.listElementFocus(null);
                    marker.setZIndex(marker.orgZIndex);
                }
            });

            $(".btn_geolist .btn_detail").click(function(){
                if(marker.purifyData.extension && marker.purifyData.extension.homepageURL){
                    window.open(marker.purifyData.extension.homepageURL);
                }else{
                    alert("상세정보가 없습니다.")
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

            $(".btn_geolist .ico_via").click(function(){
                me.infoWindow.close();
                _app.placeSearch.hide();
                _app.roadSearch.show();
                _app.roadSearch.setWp(marker);
            });
        },500);
    },

    clusterInfoWindowShow: function(markerArr){
        var me = this;
        var tmpl = '';
        if(_map.getZoom()<13){
            return;
        }
        var lastmaker = null;
        markerArr.forEach((marker, idx) => {
            lastmaker = marker;
            tmpl += olleh.maps.util.applyTemplate(me.tmpl.placeClusterInfoWindow, marker.purifyData)
        })
        if(me.infoWindow){
            me.infoWindow.close();
            me.listElementFocus(null);
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
                var me = _app.placeSearch;
                var id = this.id;
                markerArr.forEach((marker, idx) => {
                    if(id==marker.uuid){
                        me.infoWindowShow(marker, marker.purifyData, true, true, false);
                        me.listElementFocus(marker);
                        return;
                    }
                });
            });
        },500);
    },

    hide: function(){
        var me = this;
        me.geo_box01_dom.hide();
        me.placeSearchResult_dom.hide();
        if(me.clusterer){
            me.clusterer.clear();
        }
        _app.eventbusjs.dispatch('placeSearchHide');
    },

    show: function(){
        var me = this;
        me.geo_box01_dom.show();
        me.placeSearchResult_dom.show();
        me.searchCall();
        _app.eventbusjs.dispatch('placeSearchShow');
    },

    release: function(){
        var me = this;
        if(me.clusterer){
            me.clusterer.clear();
        }
    }
});