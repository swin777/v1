$class('tool.BaseLayer').define({
    layer_rOpen: $(".layer_rOpen"),
    mapType1_dom: $(".mapType1"),
    placeSearchResult_dom: $("#placeSearchResult"), //검색결과영역
    attSearchResult_dom: $("#attSearchResult"), //검색결과영역

    cadastralLayer:null, //지적편집도
    contourMapLayer:null, //지형도

    BaseLayer: function(){
        var me = this;
        $( ".btn_option" ).click(function() {
            me.layer_rOpen.css({"display":"block"});
        });
        $( ".btn_rOpen" ).click(function() {
            me.layer_rOpen.css({"display":"none"});
        });

        me.initLayer()
        me.mapType1();     
        me.mapType2();   

        _app.eventbusjs.addEventListener('leftExpand', me.leftExpandCollapse, me);
        _app.eventbusjs.addEventListener('leftCollapse', me.leftExpandCollapse, me);
        _app.eventbusjs.addEventListener('placeSearchHide', me.leftExpandCollapse, me);
        _app.eventbusjs.addEventListener('placeSearchShow', me.leftExpandCollapse, me);
        _app.eventbusjs.addEventListener('roadSearchHide', me.leftExpandCollapse, me);
        _app.eventbusjs.addEventListener('roadSearchShow', me.leftExpandCollapse, me);
    },

    leftExpandCollapse: function(){
        if($('.ollehmap-corner').length>0){
            $('.ollehmap-corner').css('left', _app['leftResultMgr'].leftGap());
            $('.ollehmap-corner h1').css('position', 'initial');
        }
    },

    initLayer: function(){
        var me = this;
        me.cadastralLayer = new olleh.maps.layer.OllehTileLayer({
            name: 'OllehCadastral',
            label: '지적편집도',
            tileURLTmpl: 'http://map.ktgis.com/CadastralMap/cadastral4.04.1_0527/layers/_alllayers/l#{z}/r#{y}/c#{x}.png',
            minZoom: 3,
            maxZoom: 13,
            autoActivate: true
        });

        me.contourMapLayer = new olleh.maps.layer.OllehTileLayer({
            name: 'OllehContourMap',
            label: '지형도',
            //layerType: 'base',   // BaseLayer임을 명시해야함
            tileURLTmpl: 'http://map.ktgis.com/HybridMap/3d130924/layers/_alllayers/l#{z}/r#{y}/c#{x}.png',
            minZoom: 0,
            maxZoom: 13,
            autoActivate: true
        });
    },

    mapType1: function(){
        var me = this;
        me.mapType1_dom.click(function(){
            me.mapType1_dom.prop("checked", false);
            var tdom = $(this)
            tdom.prop("checked", true);
            _map.setMapTypeId(tdom.attr("mapType"));
        })
    },

    mapType2: function(){
        var me = this;

        $("#trafficInfo").change(function(){
            if($(this).is(":checked")){
                _map.services.trafficInfo.activate();
            }else{
                _map.services.trafficInfo.deactivate();
            }
            me.leftExpandCollapse();
        });

        $("#cadastral").change(function(){
            if($(this).is(":checked")){
                me.cadastralLayer.setMap(_map);
            }else{
                me.cadastralLayer.setMap(null);
            }
        });

        $("#contour").change(function(){
            if($(this).is(":checked")){
                me.contourMapLayer.setMap(_map);
            }else{
                me.contourMapLayer.setMap(null);
            }
        });
    }
});