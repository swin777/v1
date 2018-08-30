$class('tool.ContextMenu').define({
    layer_which:$(".layer_which"),
    addressMsg:$(".addressMsg"),
    parcelAddress:$(".addressMsg .parcelAddress"),
    roadAddress:$(".addressMsg .roadAddress"),
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
            _app.placeSearch.searchCall();
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

        document.addEventListener("contextmenu", function(e) {
            event.preventDefault();
          });

        _map.onEvent('rightclick', function(event) {
            me.pageX = event.pageXY.x;
            me.pageY = event.pageXY.y;
            me.coord = event.getCoord();
            var adjustment = me.positionAdjustment(me.layer_which);
            me.layer_which.css({'left':adjustment.x, 'top':adjustment.y})
            me.layer_which.show();
            return false;
        });
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
            headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
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
        me.parcelAddress.text("지번주소: " + result.residentialAddress[0].parcelAddress[0].fullAddress);
        if(result.residentialAddress[0].roadAddress && result.residentialAddress[0].roadAddress.length>0){
            me.roadAddress.text("도로명주소: " + result.residentialAddress[0].roadAddress[0].fullAddress);
        }else{
            me.roadAddress.text("도로명주소: ");
        }

        var adjustment = me.positionAdjustment(me.addressMsg);
        me.addressMsg.css({'left':adjustment.x, 'top':adjustment.y});
        me.addressMsg.show();

        me.timerwarn = setInterval(function() {
            clearInterval(me.timerwarn);
            me.addressMsg.hide();
        },3000);
    },

    roadSearchBind: function(result, attType){
        var me = this;
        var marker = new olleh.maps.overlay.Marker({
            position: me.coord,
            icon:{url:'./assets/images/img_start.gif'},
        });
        marker.purifyData = {};
        //marker.purifyData.name = result.residentialAddress[0].roadAddress[0].fullAddress;
        marker.purifyData.name = result.residentialAddress[0].parcelAddress[0].fullAddress;
        _app.placeSearch.hide();
        _app.roadSearch.show();
        if(attType=='start'){
            _app.roadSearch.setStart(marker, true);
        }else if(attType=='end'){
            _app.roadSearch.setEnd(marker, true);
        }else if(attType=='wp'){
            _app.roadSearch.setWp(marker, true);
        }
    }
});