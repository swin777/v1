$class('left.LeftMenu').define({
    btnClose:$(".btn_close"),

    LeftMenu: function(){
        var me = this;
        $('.ico_sh01').click(function(){ //검색
            me.btnClose.trigger('click');
            _app.placeSearch.show();
            _app.roadSearch.hide();
        })
        $('.ico_sh02').click(function(){ //길찾기
            me.btnClose.trigger('click');
            _app.placeSearch.hide();
            _app.roadSearch.show();
        })

        $(".btn_close").click(function () {
            $("#aside").stop().animate({ left: '-400px' }, 500);
            $(".bg_black").css({ "display": "none" });
        });
    }
});