$class('util.AutoComplate').define({    
    autoComplateTimer: null,
    autoKeyword: '',
    inputKeyWord: null,
    autoComplateArea: null,
    callbackInfo :null,
    js_open:null, 
    js_close:null,
    mode:true, //autoComplate사용여부
    guidVal:null,

    AutoComplate: function(inputKeyWord, callbackInfo, rightVal){
        var me = this;
        me.callbackInfo = callbackInfo;
        me.inputKeyWord = inputKeyWord;

        require(["raw-loader!./autoComplate.html"],
            function(autoComplateHtml) {
                me.inputKeyWord.parent().append(autoComplateHtml);
                me.autoComplateArea = me.inputKeyWord.parent().find('.wrap_inpbox');
                if(rightVal){
                    me.inputKeyWord.parent().find('.btn_auto_toggle').css('right', rightVal); 
                }
                me.inputKeyWord.focus(function() {
                    me.autoComplateHandler();
                });
                me.inputKeyWord.focusout(function() {
                    if(me.autoComplateTimer){
                        clearInterval(me.autoComplateTimer);
                        me.autoComplateTimer = null;
                    }
                });
                me.inputKeyWord.parent().find('.autoToggle').click(function(){
                    if(me.mode){
                        me.mode = false;
                        $(this).text('자동완성기능 켜기');
                        me.close();
                        me.autoComplateClear();
                    }else{
                        me.mode = true;
                        $(this).text('자동완성기능 끄기');
                    }
                })

                me.inputKeyWord.keypress(function (e) {
                    if (e.which == 13) {
                        if(me.callbackInfo){
                            if(me.callbackInfo.thisArg){
                                me.callbackInfo.fun.apply(me.callbackInfo.thisArg, [me.inputKeyWord.val(), me.callbackInfo.etcArg]);
                            }else{
                                me.callbackInfo.fun(me.inputKeyWord.val(), me.callbackInfo.etcArg);
                            }
                        }
                        me.inputKeyWord.blur();
                        me.close();
                    }
                });

                me.js_open = me.inputKeyWord.parent().find('.js_open');
                me.js_close = me.inputKeyWord.parent().find('.js_close');
                me.js_open.click(function(){
                    me.open();
                })
                me.js_close.click(function(){
                    me.close();
                })
            }
        );
    },

    autoComplateHandler: function(){
        var me = this;
        if(!me.mode){
            return;
        }
        me.guidVal = _app.guid();
        var point = olleh.maps.LatLng.valueOf(_map.getCenter());
        if(me.inputKeyWord.val()!=''){
            me.open();
        }
        me.autoComplateTimer = setInterval(function() {
            if(me.inputKeyWord.val()!='' && me.autoKeyword != me.inputKeyWord.val()){
                me.open();
                $.ajax({
                    url: _app.geomasterUrl+"/search/v1.0/utilities/autocomplete?guid="+me.guidVal,
                    type: "post",
                    contentType: "application/json",
                    dataType: "json",
                    headers:{"Authorization":_app.apiKey, "Accept":"application/json", "Accept-Language":"ko-KR"},
                    data: JSON.stringify({"terms":me.inputKeyWord.val(), "point":{"lat":point.y, "lng":point.x}}),
                    success: function(result) {
                        var remberGuidVal = this.url.split('guid=')[1];
                        if(remberGuidVal==me.guidVal && result.suggests){
                            me.autoComplateClear();
                            result.suggests.forEach((element, idx) => {
                                me.autoComplateArea.append('<a href="javascript:void(0)">'+element.terms+'</a>')
                            })
                            for(var i=1; i<me.autoComplateArea.find('a').length; i++){
                                $(me.autoComplateArea.find('a')[i]).click(function(){
                                    clearInterval(me.autoComplateTimer);
                                    me.autoComplateTimer = null;
                                    me.close();
                                    me.inputKeyWord.val(this.text);
                                    if(me.callbackInfo){
                                        if(me.callbackInfo.thisArg){
                                            me.callbackInfo.fun.apply(me.callbackInfo.thisArg, [this.text, me.callbackInfo.etcArg]);
                                        }else{
                                            me.callbackInfo.fun(this.text, me.callbackInfo.etcArg);
                                        }
                                    }
                                });
                            }
                        }
                        me.autoKeyword = me.inputKeyWord.val();
                    },
                    error: function(err){
                        me.autoKeyword = me.inputKeyWord.val();
                    }
                });
            }else if(me.inputKeyWord.val()==''){
                me.close();
                me.autoComplateClear();
            }
        },500);
    },

    autoComplateClear: function(){
        var me = this;
        var removeEle = [];
        for(var i=0; i<me.autoComplateArea.children().length; i++){
            if($(me.autoComplateArea.children()[i]).get(0).tagName =='A'){
                removeEle.push($(me.autoComplateArea.children()[i]));
            }
        }
        for(var i=0; i<removeEle.length; i++){
            removeEle[i].remove();
        }
    },

    open: function(){
        var me = this;
        me.js_open.hide();
        me.js_close.show();
        me.autoComplateArea.show();
    },

    close: function(){
        var me = this;
        me.js_open.show();
        me.js_close.hide();
        me.autoComplateArea.hide();
    }
});