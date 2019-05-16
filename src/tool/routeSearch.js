$class('tool.RouteSearch').define({
    attList_dom:null, 
    routeList_dom:null,
    attWrap_dom:null,
    routeWrap_dom:null,
    all_a_dom:null,
    total_dist_dom:$('#routeWrap #total_dist'),
    total_time_dom:$('#routeWrap #total_time'),
    routeResult_dom: $('#routeResult'),
    routeElement_dom:null,
    routeByPoiDiv: $('.routeByPoiDiv'),
    routeByPoiInput: $('#routeByPoiInput'),
    attSearchResult_dom: $("#attSearchResult"), //검색결과영역
    routeIngMsg: $(".routeIngMsg"),
    realTimeStr: $("#routeWrap #realTimeStr"),

    tmpl:{},
    attMappingInfo:null,
    priority:null,
    searchResult:null,
    markerArr:[], //marker
    polyineArr:[], //marker를 제외한 tooltip, polyline
    routeByPoiResult:null, 
    routeByPoiArr:[],
    executeMode:false,

    RouteSearch: function(attList_dom, routeList_dom, attWrap_dom, routeWrap_dom){
        var me = this;
        require(["raw-loader!./html/routeResult.html", "raw-loader!./html/routeResultWindow.html", "raw-loader!./html/placeInfoSimpleWindow.html",
                "../util/autoComplate"],
            function(routeResultHtml, routeResultWindowHtml, placeInfoSimpleWindowHtml, autoComplate) {
                me.tmpl.routeResultHtml = routeResultHtml;
                me.tmpl.routeResultWindowHtml = routeResultWindowHtml;
                me.tmpl.placeInfoSimpleWindowHtml = placeInfoSimpleWindowHtml;
                me.autoComplate = new util.AutoComplate(me.routeByPoiInput, {fun:me.autoComplateCallback, thisArg:me}, 45);
            }
        );

        me.attList_dom = attList_dom;
        me.routeList_dom = routeList_dom;
        me.attWrap_dom = attWrap_dom;
        me.routeWrap_dom = routeWrap_dom;
        me.domEvent();
    },

    domEvent: function(){
        var me = this;

        me.all_a_dom = me.routeWrap_dom.find('a');
        me.routeWrap_dom.find('a').click(function(){
            if(me.executeMode){
                alert("길찾기 중입니다.");
                return;
            }
            me.all_a_dom.attr('class', '');
            $(this).attr('class', 'on');
            me.searchCall();
        });

        $('#allBoundBtn').click(function(){
            if(me.infoWindow){
                me.infoWindow.close();
            }
            me.allBound();
        });

        $('#routeByPoiBtn').click(function(){
            me.routeByPoiDiv.show();
        });

        $('#routeByPoiClearBtn').click(function(){
            me.routeByPoiClear();
        });

        $('#routeByPoiClose').click(function(){
            me.routeByPoiDiv.hide();
        });

        $('#routeByPoiExe').click(function(){
            if(me.routeByPoiInput.val()=='' || !me.searchResult){
                return;
            }
            me.routeByPoiSearch();
            me.routeByPoiDiv.hide();
        });
    },

    autoComplateCallback: function(keyWord){
        this.routeByPoiSearch();
    },

    wpOrder: function(){
        var me = this;
        var wp = $('#geo_box02 .wrap_inpAdd');
        for(var i=0; i<wp.length; i++){
            if(me.attMappingInfo[wp[i].id]){
                me.attMappingInfo[wp[i].id].order = i+1;
            }
        }
    },

    getWp: function(idx){
        var me = this;
        var arr = [];
        for(var i=1; i<(_app.wpTotalCnt+1); i++){
            if(me.attMappingInfo['wp'+i]){
                arr.push(me.attMappingInfo['wp'+i])
            }
        }
        return arr[idx-1];
    },

    searchCall: function(attMappingInfo){
        var me = this;
        _app.roadSearch.mapClear();
        if(attMappingInfo){
            me.attMappingInfo = attMappingInfo;
        }
        me.wpOrder();
        me.mapClear();
        var param = me.makeSendParam();
        if(!param || me.routeIngMsg.css('display')=='block'){
            return;
        }
        me.executeMode = true;
        me.routeIngMsg.show();
        $.ajax({
            //url: _app.geomasterUrl+"/lbs/rp?key="+_app.ollehApiKey+param,
            url: _app.geomasterUrl+"/lbs/rp/v1.41?1=1"+param,
            type: "GET",
            contentType: "application/json",
            dataType: "json",
			success: function(result) {
                me.routeIngMsg.hide();
                me.attList_dom.hide();
                me.routeList_dom.show();
                me.attWrap_dom.hide();
                me.routeWrap_dom.show();
                me.searchResult = me.conversionOld(result);
                me.searchResult.LatLngPath = me.getLatLngPath();
                me.summeyDisplay();
                me.listDisplay();
                me.mapDisplay();
                me.executeMode = false;
            },
            error: function(err){
                me.routeIngMsg.hide();
                alert("길찾기 실패하였습니다.");
                me.executeMode = false;
            }
        });
    },

    //구버전에 맞게 결과의 데이터구조변경
    conversionOld: function(result){
        var route = result.result.routes[0]
        var bounding_box = route.bounding_box
        var conResult = {
            DATA:{link:[], mbr_maxx:bounding_box.min_x, mbr_maxy:bounding_box.min_y, mbr_minx:bounding_box.max_x, mbr_miny:bounding_box.max_y}, 
            ROUTE:{rg:[], total_dist:route.total_distance, total_time:route.total_real_duration}
        }
        route.paths.forEach((path, idx) => {
            conResult.DATA.link = conResult.DATA.link.concat(path.links)
            conResult.ROUTE.rg = conResult.ROUTE.rg.concat(path.guides[0].tbts)
        })
        return conResult;
    },

    makeSendParam: function(){
        var me = this;
        var priority = 3;
        for(var i=0; i<me.all_a_dom.length; i++){
            var objDom = $(me.all_a_dom[i])
            if(objDom.attr('class')=='on'){
                priority = objDom.attr('val');
                break;
            }
        }
        if(priority==6){
            me.realTimeStr.hide()
        }else{
            me.realTimeStr.show()
        }
        var param = "&st=" + me.attMappingInfo.start.getPosition().x + "," + me.attMappingInfo.start.getPosition().y +
                    "&dt=" + me.attMappingInfo.end.getPosition().x + "," + me.attMappingInfo.end.getPosition().y +
                    "&priority=" + priority;
        var wpsStrBool = true
        for(var i=1; i<(_app.wpTotalCnt+1); i++){
            if(me.attMappingInfo['wp'+i]){
                var wpMarker = me.attMappingInfo['wp'+i]
                var order = wpMarker.order;
                if(wpsStrBool){
                    param += "&wps=" + wpMarker.getPosition().x + "," + wpMarker.getPosition().y;
                    wpsStrBool = false
                }else{
                    param += ";" + wpMarker.getPosition().x + "," + wpMarker.getPosition().y;
                }
            }
        }
        return param;
    },

    summeyDisplay: function(){
        var me = this;
        var route = me.searchResult.ROUTE;
        me.total_dist_dom.text(me.distFormat(route.total_dist));
        me.total_time_dom.text(me.timeFormat(route.total_time));
    },

    listDisplay:function(){
        var me = this;
        me.routeResult_dom.html('');
        me.routeList_dom.scrollTop(0);
        var rg = me.searchResult.ROUTE.rg;
        var wpCnt = 0;
        rg.forEach((rgEle, idx) => {
            var obj = null;
            if(rgEle.type==101){
                obj = {id:idx, imgUrl:'./assets/images/turnByturn/img_start.png', ment:"출발지: " + me.attMappingInfo.start.purifyData.name, turnByturnImg:'img_start.png', display:'none'};
            }else if(rgEle.type==201){
                wpCnt++;
                var wp = me.getWp(wpCnt);
                obj = {id:idx, imgUrl:'./assets/images/turnByturn/img_via.png', ment:"경유지: " + wp.purifyData.name, turnByturnImg:'img_via.png', display:'none'};
            }else if(rgEle.type==301){
                obj = {id:idx, imgUrl:'./assets/images/turnByturn/img_stop.png', ment:"도착지: " + me.attMappingInfo.end.purifyData.name, turnByturnImg:'img_stop.png', display:'none'};
            }else{
                var mAndI = me.mentAndImage(rgEle);
                obj = {id:idx, imgUrl:'./assets/images/marker_num_'+idx+'.png', ment:mAndI.ment, turnByturnImg:mAndI.turnByturnImg, display:'block'};
            }
            me.routeResult_dom.append(olleh.maps.util.applyTemplate( me.tmpl.routeResultHtml, obj));
        });
        //이벤트바이딩.
        me.routeElement_dom = me.routeList_dom.find('.routeElement');
        me.routeElement_dom.click(function(){
            var me = _app.routeSearch;
            me.routeElement_dom.attr('class', 'routeElement');
            $(this).attr('class', 'routeElement on');
            var selectIdx = this.id;
            me.markerArr.forEach((marker, idx) => {
                if(selectIdx==marker.idx){
                    me.infoWindowShow(marker, true, true, false);
                    return;
                }
            });
        })
    },

    mapDisplay: function(){
        var me = this;
        var DATA = me.searchResult.DATA;
        var link = me.searchResult.DATA.link;
        var rg = me.searchResult.ROUTE.rg;
        var wpCnt = 0;

        //영역 bound
        me.allBound();

        //link path그리기
        link.forEach((linkEle, idx) => {
            var utmkArr = [];
            linkEle.vertices.forEach((vertexEle) => {
                utmkArr.push(new olleh.maps.UTMK(vertexEle.x, vertexEle.y))
            });
            var path = new olleh.maps.Path(utmkArr);
            var polyline = new olleh.maps.vector.Polyline({
                map: _map,
                path: path,
                strokeColor: 'blue',
                //strokeOpacity: .5,
                strokeWeight: 5
            });
            me.polyineArr.push(polyline);
        });

        //Route
        rg.forEach((rgEle, idx) => {
            if(rgEle.type==101){ //출발지
                var startMarker = new olleh.maps.overlay.Marker({
                    position: me.attMappingInfo.start.getPosition(),
                    icon:{url:'./assets/images/turnByturn/img_start.png', size: new olleh.maps.Size(45, 45)},
                    map: _map
                });
                startMarker.ment = "출발지: " + me.attMappingInfo.start.purifyData.name;
                startMarker.imgUrl = './assets/images/turnByturn/img_start.png';
                startMarker.turnByturnImg = './assets/images/turnByturn/img_start.png';
                startMarker.idx = idx;
                startMarker.turnByturnImgVisible = 'none';
                startMarker.onEvent('mouseover',function() {
                    startMarker.tooltip = me.addMiniTooltip(startMarker, "출발지: " + me.attMappingInfo.start.purifyData.name);
                });
                startMarker.onEvent('mouseout',function() {
                    me.removeTooltip(startMarker.tooltip);
                });
                startMarker.onEvent('click', function(e) {
                    me.infoWindowShow(startMarker, false, false, true);
                });
                me.markerArr.push(startMarker);
            }else if(rgEle.type==201){ //경유지
                wpCnt++;
                var wp = me.getWp(wpCnt);
                var wpMarker = new olleh.maps.overlay.Marker({
                    position: wp.getPosition(),
                    icon:{url:'./assets/images/turnByturn/img_via.png', size: new olleh.maps.Size(45, 45)},
                    map: _map
                });
                wpMarker.ment = "경유지: " + wp.purifyData.name;
                wpMarker.imgUrl = './assets/images/turnByturn/img_via.png';
                wpMarker.turnByturnImg = './assets/images/turnByturn/img_via.png';
                wpMarker.idx = idx;
                wpMarker.turnByturnImgVisible = 'none';
                wpMarker.onEvent('mouseover',function() {
                    wpMarker.tooltip = me.addMiniTooltip(wpMarker, "경유지: " + wp.purifyData.name);
                });
                wpMarker.onEvent('mouseout',function() {
                    me.removeTooltip(wpMarker.tooltip);
                });
                wpMarker.onEvent('click', function(e) {
                    me.infoWindowShow(wpMarker, false, false, true);
                });
                me.markerArr.push(wpMarker);
            }else if(rgEle.type==301){ //도착지
                var endMarker = new olleh.maps.overlay.Marker({
                    position: me.attMappingInfo.end.getPosition(),
                    icon:{url:'./assets/images/turnByturn/img_stop.png', size: new olleh.maps.Size(45, 45)},
                    map: _map
                });
                endMarker.ment = "도착지: " + me.attMappingInfo.end.purifyData.name;
                endMarker.imgUrl = './assets/images/turnByturn/img_stop.png';
                endMarker.turnByturnImg = './assets/images/turnByturn/img_stop.png';
                endMarker.idx = idx;
                endMarker.turnByturnImgVisible = 'none';
                endMarker.onEvent('mouseover',function() {
                    endMarker.tooltip = me.addMiniTooltip(endMarker, "도착지: " + me.attMappingInfo.end.purifyData.name);
                });
                endMarker.onEvent('mouseout',function() {
                    me.removeTooltip(endMarker.tooltip);
                });
                endMarker.onEvent('click', function(e) {
                    me.infoWindowShow(endMarker, false, false, true);
                });
                me.markerArr.push(endMarker);
            }else{
                var utmk = new olleh.maps.UTMK(rgEle.coord.x, rgEle.coord.y)
                var marker = new olleh.maps.overlay.Marker({
                    position: utmk,
                    icon:{
                        url:'./assets/images/marker_num_'+idx+'.png', 
                        size: new olleh.maps.Size(19, 19),
                        anchor: new olleh.maps.Point(19/2, 19/2)
                    },
                    map: _map
                });
                marker.idx = idx;
                marker.rg = rgEle;
                var mAndI = me.mentAndImage(rgEle);
                marker.ment = mAndI.ment;
                marker.turnByturnImg = mAndI.turnByturnImg;
                marker.imgUrl = './assets/images/marker_num_'+idx+'.png';
                marker.turnByturnImgVisible = 'block';
                marker.idx = idx;
                marker.onEvent('mouseover',function() {
                    var newIcon = {
                        url: './assets/images/marker_num_over_'+this.idx+'.png',
                        size: new olleh.maps.Size(19, 19),
                        //anchor: new olleh.maps.Point(19/2, 19/2)
                      };
                    marker.setIcon(newIcon);
                    marker.tooltip = me.addMiniTooltip(marker, marker.ment)
                });
                marker.onEvent('mouseout',function() {
                    var newIcon = {
                        url: './assets/images/marker_num_'+this.idx+'.png',
                        size: new olleh.maps.Size(19, 19),
                        //anchor: new olleh.maps.Point(19/2, 19/2)
                      };
                    marker.setIcon(newIcon);
                    me.removeTooltip(marker.tooltip);
                });
                marker.onEvent('click', function(e) {
                    me.infoWindowShow(marker, false, false, true);
                });
                me.markerArr.push(marker);
            }
        });
    },

    routeByPoiSearch: function(){
        var me = this;
        me.routeByPoiClear();
        var route = {points:me.searchResult.LatLngPath, distance: 500}
        $.ajax({
			url: _app.geomasterUrl+"/search/v1.0/pois?&numberOfResults=50",
            type: "post",
            contentType: "application/json",
            dataType: "json",
            //headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
			data: JSON.stringify({"terms":me.routeByPoiInput.val(), "route":route}),
			success: function(result) {
                me.routeByPoiResult = result;
                if(me.routeByPoiResult.pois){
                    me.routeByPoiDisplay();
                }
            },
            error: function(err){
            }
        });
    },

    routeByPoiDisplay: function(){
        var me = this;
        me.routeByPoiResult.pois.forEach((element, idx) => {
            var latLngPoint = new olleh.maps.LatLng(element.point.lat, element.point.lng);
            var point = olleh.maps.UTMK.valueOf(latLngPoint);
            var marker = new olleh.maps.overlay.Marker({
                size: new olleh.maps.Size(20, 20),
                position: point,
                map:_map
            });
            me.routeByPoiArr.push(marker);

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
                addressGibun:element.address.eupMyeonDong + " " + element.address.houseNumber
            };
            marker.purifyData = obj;

            marker.onEvent('click', function(e) {
                me.infoWindowShow2(marker);
            });
        })
    },

    allBound: function(){
        var me = this;
        var DATA = me.searchResult.DATA;
        var bound = new olleh.maps.Bounds(new olleh.maps.UTMK(DATA.mbr_minx, DATA.mbr_miny), new olleh.maps.UTMK(DATA.mbr_maxx, DATA.mbr_maxy));
        _map.fitBounds(bound);
        if(me.boundTimer){
            clearInterval(me.boundTimer);
        }

        if(_app.leftResultMgr.leftGap()>0){
            me.boundTimer = setInterval(function() {
                clearInterval(me.boundTimer);
                try{
                    var xgap = (_map.layerMgr.getCoordFromLayerPx(new olleh.maps.Point(394, 0)).x - _map.layerMgr.getCoordFromLayerPx(new olleh.maps.Point(0, 0)).x)/2;
                    var bound = new olleh.maps.Bounds(new olleh.maps.UTMK(DATA.mbr_minx-xgap, DATA.mbr_miny), new olleh.maps.UTMK(DATA.mbr_maxx+xgap, DATA.mbr_maxy));
                    _map.fitBounds(bound);
                    var currCenter = _map.getCenter();
                    currCenter.x = currCenter.x - xgap;
                    _map.setCenter(currCenter);
                }catch(e){
                    clearInterval(me.boundTimer);
                }
            },500)
        }else{
            clearInterval(me.boundTimer);
        }
    },

    infoWindowShow: function(marker, maxZoomIn, centerMove, listFocus){
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
            content: olleh.maps.util.applyTemplate(me.tmpl.routeResultWindowHtml, marker)
        });
        
        if(centerMove){
            _map.setCenter(marker.getPosition());
        }
        if(maxZoomIn){
            _map.setZoom(11);
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
                }
            });
        },500)
    },

    infoWindowShow2: function(marker){
        var me = this;
        if(me.infoWindow){
            me.infoWindow.close();
            delete me.infoWindow;
        }
        me.infoWindow = new override.CustomInfoWindow({
            disableAutoPan: false,
            position: marker.getPosition(),
            disableCloseButton: true,
            padding: 0,
            content: olleh.maps.util.applyTemplate(me.tmpl.placeInfoSimpleWindowHtml, marker.purifyData)
        });
        me.infoWindow.setPixelOffset(new olleh.maps.Point(0, 10));
        me.infoWindow.open(_map, marker);
        me.timer = setInterval(function() {
            clearInterval(me.timer);
            $(".btn_lyclose").click(function(){
                if(me.infoWindow){
                    me.infoWindow.close();
                }
            });
        },500);
    },

    addMiniTooltip : function(marker, ment) {
		var tooltip = new olleh.maps.overlay.Tooltip({
		      position: marker.getPosition(),
		      content: ment
		    });
		var icon = marker.getIcon();
		var height;
		if(icon.size.height > 25)
			height = icon.size.height/2-7;
		else
			height = icon.size.height/2-3;

		var tooltipOption = {
			pixelOffset: new olleh.maps.Point(5, -(height))
		}

		tooltip.setOptions(tooltipOption);
		tooltip.open(_map, marker);
		return tooltip;
    },
    
    removeTooltip : function(tooltip) {
		if(typeof(tooltip) == "undefined" || tooltip == null) return;
		tooltip.close();
		tooltip.setMap(null);
		tooltip = null;
		return tooltip;
    },
    
    listElementFocus: function(marker){
        var me = this;
        if(marker){
            for(var i=0; i<me.routeElement_dom.length; i++){
                if(me.routeElement_dom[i].id==marker.idx){
                    me.routeList_dom.scrollTop(60 + 40*(i-1));
                    return;
                }
            }
        }
    },

    mentAndImage: function(rgd){
        var ment = '';
        var turnByturnImg = '' //'icon_road_' + rgd.type + '_' + rgd.tspdinfo + '.png';

        if(rgd.short_direction && (rgd.short_direction).length > 0){
            ment += (rgd.short_direction + ' 방면 ');
        }
       
        switch(rgd.type){
            case 0: ment += '안내없음'; turnByturnImg='icon_road_0_5.png'; break;
            case 1001: ment += '직진'; turnByturnImg='icon_road_1_5.png'; break;
            case 1002: ment += '무발성 직진'; turnByturnImg='icon_road_36_5.png'; break;
            case 1101: ment += '1시 방향 우회전'; turnByturnImg='icon_road_2_5.png'; break;
            case 1102: ment += '2시 방향 우회전'; turnByturnImg='icon_road_3_5.png'; break;
            case 1103: ment += '우회전'; turnByturnImg='icon_road_4_5.png'; break;
            case 1104: ment += '4시 방향 우회전'; turnByturnImg='icon_road_5_5.png'; break;
            case 1105: ment += '5시 방향 우회전'; turnByturnImg='icon_road_6_5.png'; break;
            case 1201: ment += '7시 방향 좌회전'; turnByturnImg='icon_road_7_5.png'; break;
            case 1202: ment += '8시 방향 좌회전'; turnByturnImg='icon_road_8_5.png'; break;
            case 1203: ment +=  '좌회전'; turnByturnImg='icon_road_9_5.png'; break;
            case 1204: ment += '10시 방향 좌회전'; turnByturnImg='icon_road_10_5.png'; break;
            case 1205: ment += '11시 방향 좌회전';turnByturnImg='icon_road_11_5.png';  break;
            case 1301: ment += '직전 방향에 고가도로 진입'; turnByturnImg='icon_road_12_5.png'; break
            case 1302: ment += '오른쪽 방향에 고가도로 진입'; turnByturnImg='icon_road_13_5.png'; break;
            case 1303: ment += '왼쪽 방향에 고가도로 진입'; turnByturnImg='icon_road_14_5.png'; break;
            case 1304: ment += '오른쪽 방향에 고가도로 옆 도로 진입'; turnByturnImg='icon_road_16_5.png'; break;
            case 1305: ment += '왼쪽 방향에 고가도로 옆 도로 진입'; turnByturnImg='icon_road_17_5.png'; break;
            case 1401: ment += '지하차도 진입'; turnByturnImg='icon_road_15_5.png'; break;
            case 1402: ment += '오른쪽 방향에 지하차도 옆도로 진입'; turnByturnImg='icon_road_18_5.png'; break;
            case 1403: ment += '왼쪽방향에 지하타도 옆도로 진입'; turnByturnImg='icon_road_19_5.png'; break;
            case 1501: ment += '오른쪽 도로 진입'; turnByturnImg='icon_road_20_5.png'; break;
            case 1502: ment += '왼쪽 도로 진입'; turnByturnImg='icon_road_21_5.png'; break;
            case 1601: ment += '직진 방향에 고속도로 진입'; turnByturnImg='icon_road_22_5.png'; break;
            case 1602: ment += '오른쪽 방향에 고속도로 진입'; turnByturnImg='icon_road_23_5.png'; break;
            case 1603: ment += '왼쪽 방향에 고속도로 진입'; turnByturnImg='icon_road_24_5.png'; break;
            case 1604: ment += '오른쪽 방향에 고속도로 출구'; turnByturnImg='icon_road_28_5.png'; break;
            case 1605: ment += '왼쪽 방향에 고속도로 출구'; turnByturnImg='icon_road_29_5.png'; break;
            case 1701: ment += '직진 방향에 도시고속도로 진입'; turnByturnImg='icon_road_25_5.png'; break;
            case 1702: ment += '오른쪽 방향에 도시고속도로 진입'; turnByturnImg='icon_road_26_5.png'; break;
            case 1703: ment += '왼쪽 방향에 도시고속도로 진입'; turnByturnImg='icon_road_27_5.png'; break;
            case 1704: ment += '오른쪽 방향에 도시고속도로 출구'; turnByturnImg='icon_road_30_5.png'; break;
            case 1705: ment += '왼쪽 방향에 도시고속도로 출구'; turnByturnImg='icon_road_31_5.png'; break;
            case 1801: ment += '분기점에서 직진'; turnByturnImg='icon_road_32_5.png'; break;
            case 1802: ment += '분기점에서 오른쪽'; turnByturnImg='icon_road_33_5.png'; break;
            case 1803: ment += '분기점에서 왼쪽'; turnByturnImg='icon_road_34_5.png'; break;
            case 1901: ment += 'U-turn'; turnByturnImg='icon_road_35_5.png'; break;
            case -1: ment += '터널'; turnByturnImg='icon_road_37_5.png'; break;
            case 38: ment += '없음'; turnByturnImg='icon_road_38_5.png'; break;
            case 39: ment += '없음'; turnByturnImg='icon_road_39_5.png'; break;
            case 2001: ment += '로터리에서 1시 방향'; turnByturnImg='icon_road_40_5.png'; break;
            case 2002: ment += '로터리에서 2시 방향'; turnByturnImg='icon_road_41_5.png'; break;
            case 2003: ment += '로터리에서 3시 방향'; turnByturnImg='icon_road_42_5.png'; break;
            case 2004: ment += '로터리에서 4시 방향'; turnByturnImg='icon_road_43_5.png'; break;
            case 2005: ment += '로터리에서 5시 방향'; turnByturnImg='icon_road_44_5.png'; break;
            case 2006: ment += '로터리에서 6시 방향'; turnByturnImg='icon_road_45_5.png'; break;
            case 2007: ment += '로터리에서 7시 방향'; turnByturnImg='icon_road_46_5.png'; break;
            case 2008: ment += '로터리에서 8시 방향'; turnByturnImg='icon_road_47_5.png'; break;
            case 2009: ment += '로터리에서 9시 방향'; turnByturnImg='icon_road_48_5.png'; break;
            case 2010: ment += '로터리에서 10시 방향'; turnByturnImg='icon_road_49_5.png'; break;
            case 2011: ment += '로터리에서 11시 방향'; turnByturnImg='icon_road_50_5.png'; break;
            case 2012: ment += '로터리에서 12시 방향'; turnByturnImg='icon_road_51_5.png'; break;
            case 101: return '출발지';
            case 201: return '경유지';
            case 301: return '목적지';
            default : ment = ''; break;
        }
        var dist = rgd.nextdist;
        if(dist > 0){
            if(dist >= 1000){
                dist = (((dist / 1000) | 0) +'k');
            }
            if(ment.length > 0 ){
                ment += ' 후 ';
            }
            ment += (dist + 'm 이동');
        }
        return {"ment":ment, "turnByturnImg":turnByturnImg};
    },

    mapClear: function(){
        var me = this;
        me.markerArr.forEach((marker, idx) => {
            marker.setMap(null);
        });
        me.polyineArr.forEach((polyline, idx) => {
            polyline.setMap(null);
        });
        me.routeByPoiArr.forEach((marker, idx) => {
            marker.setMap(null);
        });
        me.markerArr = [];
        me.polyineArr = [];
        me.routeByPoiArr = [];
    },

    routeByPoiClear: function(){
        var me = this;
        me.routeByPoiArr.forEach((marker, idx) => {
            marker.setMap(null);
        });
        me.routeByPoiArr = [];
    },

    distFormat: function(val){
        if(val<1000){
            return val + "m";
        }else{
            return parseFloat(val/1000).toFixed(2) + "km";
        }
    },

    getLatLngPath: function() {
        var me  = this;
        var LatLngPath = [];
        me.searchResult.DATA.link.forEach((link, i) => {
            link.vertices.forEach((vertex, j) => {
                var latlng = new olleh.maps.LatLng.valueOf(new olleh.maps.UTMK(vertex));
                LatLngPath.push({lat: latlng.y, lng: latlng.x});
            });
        });
        return LatLngPath;
    },

    timeFormat: function(val){
        if(val<3601){
            return "약 " + Math.round((val/3600)*60) + "분";
        }else{
            var hour = Math.floor(val/3600);
            var min = Math.round((val/3600 - hour)*60);
            return "약 " + hour + "시간 " + min + "분";
        }
    }
});