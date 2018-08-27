$class('util.PageNavi').define({
    pageSize:10, 
    currentPage:1,
    target_dom: null,
    pageSpan: null,
    before: null,
    next:  null,
    callBackInfo: null,

    PageNavi: function(targetDom, callBackInfo){
        var me = this;
        me.target_dom = targetDom;
        me.callBackInfo = callBackInfo;
        require(['raw-loader!./pageNavi.html'],
            function(pageNaviHtml) {
                me.target_dom.append(pageNaviHtml);
                me.domEvent();
            }
        );
    },

    domEvent: function(){
        var me = this;
        me.pageSpan = me.target_dom.find('span');
        me.before = me.target_dom.find('#before');
        me.next = me.target_dom.find('#next');

        me.before.click(function(){
            me.beforeHandler();
        });

        me.next.click(function(){
            me.nextHandler();
        });
    },

    clear: function(){
        var me = this;
        me.currentPage = 1;
        me.pageSpan.html('');
        me.before.hide();
        me.next.hide();
    },

    beforeHandler: function(){
        var me = this;
        me.currentPage = Math.floor(me.currentPage/5) * 5;
        if(me.currentPage%5==0){
            me.currentPage = Math.floor((me.currentPage-1)/5) * 5 + 1;
        }
        if(me.callBackInfo.thisArg){
            me.callBackInfo.fun.apply(me.callBackInfo.thisArg, []);
        }else{
            me.callBackInfo.fun();
        }
    },

    nextHandler: function(){
        var me = this;
        me.currentPage = Math.ceil(me.currentPage/5) * 5 + 1;
        if(me.callBackInfo.thisArg){
            me.callBackInfo.fun.apply(me.callBackInfo.thisArg, []);
        }else{
            me.callBackInfo.fun();
        }
    },

    makeNavi: function(numberOfPois){
        var me = this;
        me.pageSpan.html('');
        var totalPage = (numberOfPois%me.pageSize)==0 ? numberOfPois/me.pageSize : numberOfPois/me.pageSize + 1
        var startPage = Math.floor(me.currentPage/5) * 5 + 1;
        if(me.currentPage%5==0){
            startPage = Math.floor((me.currentPage-1)/5) * 5 + 1;
        }
        var endPage = Math.ceil(me.currentPage/5) * 5;

        if(startPage==1){
            me.before.hide();
        }else{
            me.before.show();
        }

        if(endPage+1>totalPage){
            me.next.hide();
        }else{
            me.next.show();
        }

        for(var i=startPage; i<endPage+1; i++){
            if(i>totalPage){
                continue;
            }
            if(i==me.currentPage){
                me.pageSpan.append('<a href="javascript:void(0)" class="on">'+i+'</a>');
            }else{
                me.pageSpan.append('<a href="javascript:void(0)">'+i+'</a>');
            }
        }
        me.pageSpan.children().click(function(){
            me.currentPage = parseInt(this.text);
            if(me.callBackInfo){
                if(me.callBackInfo.thisArg){
                    me.callBackInfo.fun.apply(me.callBackInfo.thisArg, []);
                }else{
                    me.callBackInfo.fun();
                }
            }
        });
    },

    show: function(){
        this.target_dom.show();
    },

    hide: function(){
        this.target_dom.hide();
    }
});