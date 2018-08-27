$class('left.LeftResultMgr').define({
    placeSearchResult_dom: $("#placeSearchResult"), //검색결과영역
    attSearchResult_dom: $("#attSearchResult"), //검색결과영역

    LeftResultMgr: function(){
        var me = this;
        
        $("#placeSearchResult .btn_open03").click(function(){
            if(me.placeSearchResult_dom.css('left')=='0px'){
                me.placeSearchResult_dom.stop().animate({ left: '-394px' }, 500, function(){
                    _app.eventbusjs.dispatch('leftExpand');
                });
            }else{
                me.placeSearchResult_dom.stop().animate({ left: '0px' }, 500, function(){
                    _app.eventbusjs.dispatch('leftCollapse');
                });
            }
        })

        $("#attSearchResult .btn_open03").click(function(){
            if(me.attSearchResult_dom.css('left')=='0px'){
                me.attSearchResult_dom.stop().animate({ left: '-394px' }, 500, function(){
                    _app.eventbusjs.dispatch('leftExpand');
                });
            }else{
                me.attSearchResult_dom.stop().animate({ left: '0px' }, 500, function(){
                    _app.eventbusjs.dispatch('leftCollapse');
                });
            }
        });
    },

    leftGap: function(){
        var me = this;
        var gap = 0;
        if(me.placeSearchResult_dom.css('display')=='block' && me.placeSearchResult_dom.css('left')=='0px'){
            gap = 394;
        }

        if(me.attSearchResult_dom.css('display')=='block' && me.attSearchResult_dom.css('left')=='0px'){
            gap = 394;
        }
        return gap;
    }
});