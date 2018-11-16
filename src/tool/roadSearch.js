$class('tool.RoadSearch').define({
    tmpl:{}, //템블릿 html
    searchResult: null, //검색결과
    sortBy:'relevance', //관련도순:relevance, 랭킹:rank 거리순:distance
    currMakers: [],

    geo_box02_dom: $('#geo_box02'), //검색입력영역
    startKeyword_dom: $('#startKeyword'),
    endKeyword_dom: $('#endKeyword'),
    wp1Keyword_dom: $('#wp1Keyword'),
    wp2Keyword_dom: $('#wp2Keyword'),
    wp3Keyword_dom: $('#wp3Keyword'),
    wayPointArea_dom: $('.wayPointArea'),
    wrap_inpAdd_dom: $('.wrap_inpAdd'),

    attSearchResult_dom: $("#attSearchResult"), //검색결과영역
    attResult_dom:$("#attResult"),
    attList_dom:$('#attList'),
    attPage_dom:$('#attPage'),
    attElement_dom:null,

    attKeywordStr_dom: $('#attKeywordStr'),
    attCnt_dom: $('#attCnt'),
    attOrder1_dom: $('#attOrder1'),
    attOrder2_dom: $('#attOrder2'),
    attWrap_dom: $('#attWrap'),
    routeWrap_dom: $('#routeWrap'),
    routeList_dom:$('#routeList'),
    placeOrder1_dom: $('#attSearchResult #placeOrder1'),
    placeOrder2_dom: $('#attSearchResult #placeOrder2'),

    wpCnt:0,
    keyWord: null,
    clusterer: null,
    infoWindow: null,
    autoComplateArr: [],
    pageNavi:null,
    routeSearch:null,
    attention: null, //start, wp1, wp2, wp3, end
    attMappingInfo: {start:null, wp1:null, wp2:null, wp3:null, end:null},

    RoadSearch: function(){
        var me = this;
        me.attSearchResult_dom.css('top', '80px');
        me.wayPointArea_dom.sortable();
        me.wayPointArea_dom.disableSelection();

        require(["raw-loader!./html/placeResult.html", "raw-loader!./html/placeInfoWindow.html", 
                "raw-loader!./html/placeClusterInfoWindow.html", "raw-loader!./html/routeInfoWindow.html",
                '../util/autoComplate', '../util/pageNavi', './routeSearch'],
            function(placeResultHtml, placeInfoWindow, placeClusterInfoWindow, routeInfoWindow, autoComplate, pageNavi, routeSearch) {
                me.tmpl.placeResultHtml = placeResultHtml;
                me.tmpl.placeInfoWindow = placeInfoWindow;
                me.tmpl.placeClusterInfoWindow = placeClusterInfoWindow;
                me.tmpl.routeInfoWindow = routeInfoWindow;
                me.autoComplateArr.push(new util.AutoComplate(me.startKeyword_dom, {fun:me.autoCallBack, thisArg:me, etcArg:{attention:'start'}}));
                me.autoComplateArr.push(new util.AutoComplate(me.endKeyword_dom, {fun:me.autoCallBack, thisArg:me, etcArg:{attention:'end'}}));
                me.autoComplateArr.push(new util.AutoComplate(me.wp1Keyword_dom, {fun:me.autoCallBack, thisArg:me, etcArg:{attention:'wp1'}}));
                me.autoComplateArr.push(new util.AutoComplate(me.wp2Keyword_dom, {fun:me.autoCallBack, thisArg:me, etcArg:{attention:'wp2'}}));
                me.autoComplateArr.push(new util.AutoComplate(me.wp3Keyword_dom, {fun:me.autoCallBack, thisArg:me, etcArg:{attention:'wp3'}}));
                me.pageNavi = new util.PageNavi(me.attPage_dom, {fun:me.searchCall, thisArg:me});
                me.routeSearch = new tool.RouteSearch(me.attList_dom, me.routeList_dom, me.attWrap_dom, me.routeWrap_dom);
                _app.routeSearch = me.routeSearch;
            }
        );
        me.clusterer = new olleh.maps.overlay.MarkerClusterer({
            gap: 1,
            displayArea: false,
            minZoom: 0,
            maxZoom: 14,
            clusterOpts: {
                iconFn: function (size) {
                    // this.setDisplaySize(true);
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

    domEvent: function(){
        var me = this;
        $(".btn_Gsearch").click(function () {
            _app.placeSearch.show();
            _app.roadSearch.hide();
        });

        me.geo_box02_dom.find(".btn_gclose").click(function(){
            me.wpRemove(this);
        })

        me.geo_box02_dom.find(".btn_via").click(function(){
            me.wpAdd();
        })

        $("#geo_box02 .btn_search").click(function() {
            me.attention = $(this).attr('class').split(" ").reverse()[0];
            me.keyWord = me[me.attention+"Keyword_dom"].val();
            me.searchCall(true);
        });

        $("#geo_box02 .btn_gadd").click(function() {
            var start = me.attMappingInfo['start'];
            var end = me.attMappingInfo['end'];
            me.attMappingInfo['start'] = end;
            me['startKeyword_dom'].val(end.purifyData.name);
            me.attMappingInfo['end'] = start;
            me['endKeyword_dom'].val(start.purifyData.name);
            if(me.attMappingInfo['start'] && me.attMappingInfo['end']){
                me.routeSearchCall();
            }
        });

        $("#attSearchResult #wpAddBtn").click(function(){
            me.wpAdd();
        });

        $("#attSearchResult #routeClearBtn").click(function(){
            me.allClear();
        });

        $("#attSearchResult #routeSerchBtn").click(function(){
            if(me.infoWindow){
                me.infoWindow.close();
            }
            if(me.clusterer){
                me.clusterer.clear();
            }
            me.routeSearchCall();
        });

        $("#roadClear").click(function(){
            me[me.attention+"Keyword_dom"].val('');
            me.attResult_dom.html('');
            me.attList_dom.scrollTop(0);
            me.attKeywordStr_dom.text('');
            me.attCnt_dom.text('');
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
    },

    mapEvent: function(){
    },

    attMapping: function(marker){
        var me = this;
        for(var member in me.attMappingInfo){
            if(member!=me.attention && me.attMappingInfo[member]){
                if(marker.getPosition().x == me.attMappingInfo[member].getPosition().x && marker.getPosition().y == me.attMappingInfo[member].getPosition().y){
                    me.attMappingInfo[me.attention] = null;
                    me[me.attention+"Keyword_dom"].val('');
                    alert(me.getKeywordLabel(me.attention) + " 과 " + me.getKeywordLabel(member) + " 동일합니다.");
                    return;
                }
            }
        }
        me.attMappingInfo[me.attention] = marker;
        me[me.attention+'Keyword_dom'].val(marker.purifyData.name);
    },

    autoCallBack: function(keyWord, etcArg){
        var me = this;
        me.attention = etcArg.attention
        me.keyWord = keyWord;
        me.searchCall(true);
    },

    allClear: function(){
        var me = this;
        me.attList_dom.show();
        me.routeList_dom.hide();
        me.attWrap_dom.show();
        me.routeWrap_dom.hide();
        me.routeSearch.mapClear();
        me.pageNavi.clear();
        me.startKeyword_dom.val('');
        me.endKeyword_dom.val('');
        me.wp1Keyword_dom.val('');
        me.wp2Keyword_dom.val('');
        me.wp3Keyword_dom.val('');
        me.attMappingInfo = {start:null, wp1:null, wp2:null, wp3:null, end:null};
        me.attResult_dom.html('');
        me.attList_dom.scrollTop(0);
        me.attKeywordStr_dom.text('');
        me.attCnt_dom.text('');
        me.wpRemoveAll();
        me.mapClear();
    },

    wpAdd: function(){
        var me = this;
        if(me.wpCnt<3){
            for(var i=0; i<me.wrap_inpAdd_dom.length; i++){
                var dom = $(me.wrap_inpAdd_dom[i]);
                if(dom.css('display')=='none'){
                    dom.show();
                    break;
                }
            }
            me.wpCnt++;
            me.attSearchResultHeight();
        }else{
            alert("경유지는 3개까지 입니다.");
        }
    },

    wpRemove: function(target){
        var me = this;
        $(target.parentNode).hide();
        me.wpCnt--;
        //var id = 'wp'+target.parentNode.id.split("").reverse().join("").substring(0,1);
        var id = target.parentNode.id;
        me[id+'Keyword_dom'].val('');
        me.attMappingInfo[id] = null;
        me.attSearchResultHeight();
        if(me.attMappingInfo['start'] && me.attMappingInfo['end']){
            me.routeSearchCall();
        }
        if(me.wpMarker){
            me.wpMarker.setMap(null);
        }
    },

    wpRemoveAll: function(){
        var me = this;
        me.wpCnt = 0;
        for(var i=1; i<4; i++){
            var id ='wp'+i;
            $('#'+id).hide();
            me[id+'Keyword_dom'].val('');
            me.attMappingInfo[id] = null;
        }
        me.attSearchResultHeight();
    },

    searchCall: function(pageInit){
        var me = this;
        if(!me.keyWord){
            return;
        }
        me.attList_dom.show();
        me.routeList_dom.hide();
        me.attWrap_dom.show();
        me.routeWrap_dom.hide();
        me.currMakers = [];
        me.routeSearch.mapClear();
        if(pageInit){
            me.pageNavi.clear();
        }
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
        me.attResultVisible();
        me.autoComplateArr.forEach((autoComplate) => {
            autoComplate.close();
        });
        var start = (me.pageNavi.currentPage-1) * me.pageNavi.pageSize;
        var point = olleh.maps.LatLng.valueOf(_map.getCenter());
        $.ajax({
			url: _app.geomasterUrl+"/search/v1.0/pois?sortBy="+me.sortBy+"&numberOfResults="+me.pageNavi.pageSize+"&start="+start+"&mode=NAVIGATION",
            type: "post",
            contentType: "application/json",
            dataType: "json",
            //headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
			data: JSON.stringify({"terms":me.keyWord, "point":{"lat":point.y, "lng":point.x}}),
			success: function(result) {
                me.searchResult = result;
                if(me.searchResult.pois){
                    me.attDisplay();
                    me.mapDisplay();
                    me.attKeywordStr_dom.text(me.keyWord);
                    me.attCnt_dom.text(new Intl.NumberFormat("en-US").format(me.searchResult.numberOfPois) + "건");
                }
            },
            error: function(err){
            }
        });
    },

    attDisplay: function(){
        var me = this;
        me.attResult_dom.html('');
        me.attList_dom.scrollTop(0);
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
            var obj = {id:element.id, order:String.fromCharCode(65+idx), name:element.name, branch:' ' + element.branch, subName:element.subName?'('+element.subName+')':'',
                    phone:phone, category:element.category.middleName + " > " + element.category.subName,
                    address:element.address.siDo + " " + element.address.siGunGu + " " + element.address.street + " " + element.address.streetNumber,
                    addressGibun:element.address.eupMyeonDong + " " + element.address.houseNumber,
                    extension:element.extension
            };
            element.purifyData = obj;
            me.attResult_dom.append(olleh.maps.util.applyTemplate( me.tmpl.placeResultHtml, obj));
        });
        //이벤트바이딩.
        var startBtn = $('#attList .placeElement .ico_start');
        var endBtn = $('#attList .placeElement .ico_end');
        me.attElement_dom = $('#attList .placeElement')
        me.attElement_dom.click(function(){
            var me = _app.roadSearch;
            me.attElement_dom.attr('class', 'placeElement');
            $(this).attr('class', 'placeElement on');
            me.currMakers.forEach((marker, idx) => {
                if(this.id==marker.uuid){
                    me.infoWindowShow(marker, marker.purifyData, true, true, false, me.tmpl.routeInfoWindow);
                    marker.orgZIndex = $(marker.elements.upper_overlay_pane).css('z-index');
                    marker.setZIndex(olleh.maps.overlay.BaseOverlay.MAX_ZINDEX);
                    me.attMapping(marker);
                    return;
                }
            });
        })
        startBtn.click(function(event){
            event.stopPropagation();
            me.currMakers.forEach((marker, idx) => {
                if(this.id=='start_'+marker.uuid){
                    me.setStart(marker);
                    me.show();
                    return;
                }
            });
        });
        endBtn.click(function(event){
            event.stopPropagation();
            me.currMakers.forEach((marker, idx) => {
                if(this.id=='end_'+marker.uuid){
                    me.setEnd(marker);
                    me.show();
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
        if(me.attElement_dom){
            me.attElement_dom.attr('class', 'placeElement');
        }
        if(marker){
            for(var i=0; i<me.attElement_dom.length; i++){
                if(me.attElement_dom[i].id==marker.uuid){
                    $(me.attElement_dom[i]).attr('class', 'placeElement on');
                    me.attList_dom.scrollTop(144*i);
                    return;
                }
            }
        }
    },

    mapDisplay: function(){
        var me = this;
        var bound = null;
        me.mapClear();
        me.searchResult.pois.forEach((element, idx) => {
            var latLngPoint = new olleh.maps.LatLng(element.point.lat, element.point.lng);
            if(element.routeOptimization && element.routeOptimization.multipleEntrance && element.routeOptimization.multipleEntrance.length>0){
                latLngPoint = new olleh.maps.LatLng(element.routeOptimization.multipleEntrance[0].lat, element.routeOptimization.multipleEntrance[0].lng);
            }
            var point = olleh.maps.UTMK.valueOf(latLngPoint)
            var marker = new olleh.maps.overlay.Marker({
                position: point,
                icon:{url:'./assets/images/ic_firm_'+String.fromCharCode(65+idx)+'.png'},
            });
            marker['uuid'] = element.id;
            marker['purifyData'] = element.purifyData;
            marker['purifyData']['imgUrl'] = './assets/images/ic_firm_'+String.fromCharCode(65+idx)+'.png';
            marker.onEvent('click', function(e) {
                me.infoWindowShow(marker, element.purifyData, false, false, true, null);
            });
            me.currMakers.push(marker);
            me.clusterer.add(marker);
            //_app.themeLayer.selectRelease();

            if(idx==0){
                bound = new olleh.maps.Bounds(point, point);
                me.attMapping(marker); //첫번째것을 기본으로 세팅함.
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

    infoWindowShow: function(marker, purifyData, maxZoomIn, centerMove, listFocus, tmpl){
        var me = this;
        _app.placeSearch.infoWindowClose();
        me.infoWindowClose();
        if(listFocus){
            me.listElementFocus(null);
        }

        var content;
        if(!tmpl){
            content = olleh.maps.util.applyTemplate(me.tmpl.placeInfoWindow, purifyData);
        }else{
            var cloneObj = JSON.parse(JSON.stringify(purifyData));
            if(me.attention=='start'){
                cloneObj.typeImgUrl = './assets/images/img_start.gif';
            }else if(me.attention=='end'){
                cloneObj.typeImgUrl = './assets/images/img_stop.gif';
            }else {
                cloneObj.typeImgUrl = './assets/images/img_via.gif';
            }
            content = olleh.maps.util.applyTemplate(tmpl, cloneObj);
        }
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: marker.getPosition(),
            disableCloseButton: true,
            padding: 0,
            content: content
        });
        if(centerMove){
            _map.setCenter(marker.getPosition());
        }
        if(maxZoomIn){
            if(_map.getZoom()<11){
                _map.setZoom(11);
            }
            if(centerMove){
                _map.setCenter(marker.getPosition());
            }
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
                me.setStart(marker);
                me.show();
            });
    
            $(".btn_geolist .ico_end").click(function(){
                me.infoWindow.close();
                me.setEnd(marker);
                me.show();
            });

            $(".btn_geolist .ico_via").click(function(){
                me.infoWindow.close();
                me.setWp(marker);
                me.show();
            });
        },500)
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
        _app.placeSearch.infoWindowClose();
        me.infoWindowClose();
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: lastmaker.getPosition(),
            disableCloseButton: true,
            padding: 6,
            content: tmpl
        });
        me.infoWindow.setPixelOffset(new olleh.maps.Point(0, 10));
        me.infoWindow.open(_map, lastmaker);
        $(".js_link").click(function(){
            var me = _app.roadSearch;
            var id = this.id;
            markerArr.forEach((marker, idx) => {
                if(id==marker.uuid){
                    me.infoWindowShow(marker, marker.purifyData, true, true, false, null);
                    me.listElementFocus(marker);
                    return;
                }
            });
        });
    },

    infoWindowClose: function(){
        var me = this;
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
    },

    attSearchResultHeight: function(){
        var me = this;
        var height = (me.wpCnt * 40) + 80
        me.attSearchResult_dom.css('top', height+'px');
    },

    attResultVisible: function(){
        var me = this;
        me.attSearchResult_dom.show();
        _app.eventbusjs.dispatch('roadSearchShow');
    },

    startMarker:null,
    setStart: function(marker, noInfoWindow){
        var me = this;
        if(me.startMarker){
            me.startMarker.setMap(null);
        }
        me.startMarker = marker;
        me.attention = 'start';
        me.attMapping(marker);
        if(!noInfoWindow){
            me.infoWindowShow(marker, marker.purifyData, true, true, false, me.tmpl.routeInfoWindow);
        }
        if(!(me.attMappingInfo['start'] && me.attMappingInfo['end'])){
            me.startMarker.setMap(_map);
        }
    },

    endMarker:null,
    setEnd: function(marker, noInfoWindow){
        var me = this;
        if(me.endMarker){
            me.endMarker.setMap(null);
        }
        me.endMarker = marker;
        me.attention = 'end';
        me.attMapping(marker);
        if(!noInfoWindow){
            me.infoWindowShow(marker, marker.purifyData, true, true, false, me.tmpl.routeInfoWindow);
        }
        if(!(me.attMappingInfo['start'] && me.attMappingInfo['end'])){
            me.endMarker.setMap(_map);
        }
    },

    wpMarker:null,
    setWp: function(marker, noInfoWindow){
        var me = this;
        if(me.wpMarker){
            me.wpMarker.setMap(null);
        }
        if(me.wpCnt==0){
            me.wpAdd();
        }
        me.wpMarker = marker;
        me.attention = 'wp' + me.wpCnt;
        me.attMapping(marker);
        if(!noInfoWindow){
            me.infoWindowShow(marker, marker.purifyData, true, true, false, me.tmpl.routeInfoWindow);
        }
        if(!(me.attMappingInfo['start'] && me.attMappingInfo['end'])){
            me.wpMarker.setMap(_map);
        }
    },

    hide: function(){
        var me = this;
        me.geo_box02_dom.hide();
        me.attSearchResult_dom.hide();
        me.attResult_dom.html(''); //POI 검색했던 결과는 지운다.
        me.attList_dom.scrollTop(0);
        me.pageNavi.clear();
        me.routeSearch.mapClear();
        me.infoWindowClose();
        if(me.clusterer){
            me.clusterer.clear();
        }
        _app.eventbusjs.dispatch('roadSearchHide');
    },

    show: function(){
        var me = this;
        me.geo_box02_dom.show();
        me.attSearchResult_dom.show();
        if(me.attMappingInfo['start'] && me.attMappingInfo['end']){
            me.routeSearchCall();
        }
        _app.eventbusjs.dispatch('roadSearchShow');
    },

    release: function(){
        var me = this;
        if(me.clusterer){
            me.clusterer.clear();
        }
    },

    mapClear: function(){
        var me = this;
        if(me.clusterer){
            me.clusterer.clear();
            me.clusterer.setMap(null);
        }
        if(me.startMarker){
            me.startMarker.setMap(null);
        }
        if(me.endMarker){
            me.endMarker.setMap(null);
        }
        if(me.wpMarker){
            me.wpMarker.setMap(null);
        }
    },

    routeSearchCall: function(){
        var me = this;
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
        if(me.startKeyword_dom.val()=='' && me.attMappingInfo['start']){
            me.startKeyword_dom.val(me.attMappingInfo['start'].purifyData.name);
        }
        if(me.endKeyword_dom.val()=='' && me.attMappingInfo['end']){
            me.endKeyword_dom.val(me.attMappingInfo['end'].purifyData.name);
        }
        for(var i=1; i<4; i++){
            if(me.attMappingInfo['wp'+i]){
                if(me['wp'+i+'Keyword_dom'].val()=='' && me['wp'+i+'Keyword_dom']){
                    me['wp'+i+'Keyword_dom'].val(me.attMappingInfo['wp'+i].purifyData.name);
                }
            }
        }
        if(!me.attMappingInfo.start){
            alert("출발지를 선택하세요.");
            return null;
        }
        if(!me.attMappingInfo.end){
            alert("도착지를 선택하세요.");
            return null;
        }
        me.routeSearch.searchCall(me.attMappingInfo);
    },

    getKeywordLabel: function(keywordType){
        if(keywordType=='start'){
            return '출발지';
        }else if(keywordType=='wp1'){
            return '경유지1';
        }else if(keywordType=='wp2'){
            return '경유지2';
        }else if(keywordType=='wp3'){
            return '경유지3';
        }else if(keywordType=='end'){
            return '도착지';
        }
        return '';
    }
});