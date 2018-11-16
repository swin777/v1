$class('tool.ContextMenu').define({
    layer_which:$(".layer_which"),
    addressMsg:$(".addressMsg"),
    parcelAddress:$(".addressMsg .parcelAddress"),
    roadAddress:$(".addressMsg .roadAddress"),
    searchEle : $(".layer_which .ico_search"),
    coord:null,
    pageX:null,
    pageY:null,

    ContextMenu: function(domId){
        var me = this;

        $(".layer_which .btn_rwhich").click(function(){
            me.layer_which.hide();
        });

        $(".layer_which .ico_address").click(function(){
            me.reverseGeocode('msg');
            me.layer_which.hide();
        });

        $(".layer_which .ico_search").click(function(){
            _map.setCenter(me.coord);
            if(me.searchEle.attr('class')!='ico_search line-through'){
                _app.placeSearch.searchCall(true);
            }
            me.layer_which.hide();
        });

        $(".layer_which .ico_start").click(function(){
            me.reverseGeocode('start');
            me.layer_which.hide();
        });

        $(".layer_which .ico_via").click(function(){
            me.reverseGeocode('wp');
            me.layer_which.hide();
        });

        $(".layer_which .ico_end").click(function(){
            me.reverseGeocode('end');
            me.layer_which.hide();
            
        });

        $(".layer_which .expand").click(function(){
            me.layer_which.hide();
            _map.setCenter(me.coord);
            if(_map.getZoom()<13){
                _map.setZoom(_map.getZoom()+1);
            }
        });

        $(".layer_which .cancel").click(function(){
            me.layer_which.hide();
        });

        $(document).bind("contextmenu", function(event) { 
            event.preventDefault();
        });

        _map.onEvent('rightclick', function(event) {
            if(_app.routeSearch.routeIngMsg.css('display')=='block'){
                return false;
            }
            if(event.targetDOM.id != 'layer_container'){
                return;
            }
            me.pageX = event.pageXY.x;
            me.pageY = event.pageXY.y;
            me.coord = event.getCoord();
            var adjustment = me.positionAdjustment(me.layer_which);
            me.layer_which.css({'left':adjustment.x, 'top':adjustment.y})
            me.layer_which.show();
            return false;
        });

        _map.onEvent('idle', function() {
            me.layer_which.hide();
        });

        _map.onEvent('click', function() {
            me.layer_which.hide();
        });

        _app.eventbusjs.addEventListener('inputKeyWordFocusout', me.inputKeyWordFocusout, me);
    },

    positionAdjustment: function(target){
        var me = this;
        var adjustment = {x:me.pageX, y:me.pageY};
        if((me.pageX+target.width()) > $(window).width()){
            adjustment.x = adjustment.x - ((me.pageX+target.width()) - $(window).width()) - 4;
        }
        if((me.pageY+target.height()) > $(window).height()){
            adjustment.y = adjustment.y - ((me.pageY+target.height()) - $(window).height()) - 4;
        }
        return adjustment;
    },

    reverseGeocode: function(attType){
        var me = this;
        var point = olleh.maps.LatLng.valueOf(me.coord);
        $.ajax({
			url: _app.geomasterUrl+"/search/v1.0/utilities/geocode?point.lat="+point.y+"&point.lng="+point.x,
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            //headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
			success: function(result) {
                if(result && result.residentialAddress.length>0){
                    if(attType=='msg'){
                        me.msgShow(result);
                    }else{
                        me.roadSearchBind(result, attType);
                    }
                }
            },
            error: function(err){
            }
        });
    },

    msgShow: function(result){
        var me = this;
        if(me.timerwarn){
            clearInterval(me.timerwarn);
            me.addressMsg.hide();
        }
        me.parcelAddress.text("지번주소: " + result.residentialAddress[0].parcelAddress[0].fullAddress);
        if(result.residentialAddress[0].roadAddress && result.residentialAddress[0].roadAddress.length>0){
            me.roadAddress.text("도로명주소: " + result.residentialAddress[0].roadAddress[0].fullAddress);
        }else{
            me.roadAddress.text("도로명주소: ");
        }
        var max = Math.max(me.parcelAddress.text().length, me.roadAddress.text().length)

        var adjustment = me.positionAdjustment(me.addressMsg);
        me.addressMsg.css({'left':adjustment.x, 'top':adjustment.y, 'width':(16+(max*8))});
        me.addressMsg.show();

        me.timerwarn = setInterval(function() {
            clearInterval(me.timerwarn);
            me.addressMsg.hide();
        },3000);

        _app.placeSearch.placeKeyword_dom.val(result.residentialAddress[0].parcelAddress[0].fullAddress);
        _app.placeSearch.searchCall(true);
    },

    roadSearchBind: function(result, attType){
        var me = this;
        var marker = null;

        if(attType=='start'){
            marker = new olleh.maps.overlay.Marker({
                position: me.coord,
                icon:{url:'./assets/images/turnByturn/img_start.png',size: new olleh.maps.Size(45, 45)},
            });
        }else if(attType=='end'){
            marker = new olleh.maps.overlay.Marker({
                position: me.coord,
                icon:{url:'./assets/images/turnByturn/img_stop.png', size: new olleh.maps.Size(45, 45)},
            });
        }else if(attType=='wp'){
            marker = new olleh.maps.overlay.Marker({
                position: me.coord,
                icon:{url:'./assets/images/turnByturn/img_via.png', size: new olleh.maps.Size(45, 45)},
            });
        }

        marker.purifyData = {};
        //marker.purifyData.name = result.residentialAddress[0].roadAddress[0].fullAddress;
        marker.purifyData.name = result.residentialAddress[0].parcelAddress[0].fullAddress;
        _app.placeSearch.hide();
        if(attType=='start'){
            _app.roadSearch.setStart(marker, true);
        }else if(attType=='end'){
            _app.roadSearch.setEnd(marker, true);
        }else if(attType=='wp'){
            _app.roadSearch.setWp(marker, true);
        }
        _app.roadSearch.show();
    },

    inputKeyWordFocusout: function(arg){
        var me = this;
        if(arg.target.parent().parent()[0].id=='geo_box01'){
            if(arg.target.val()==''){
                me.searchEle.attr('class', 'ico_search line-through');
            }else{
                me.searchEle.attr('class', 'ico_search');
            }
        }
    }
});