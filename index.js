if(typeof(window._app) == "undefined") window._app = {};
if(typeof(window._map) == "undefined") window._map = {};

_app.geomasterUrl = "https://gis.kt.com";
_app.apiKey = "Bearer 9886c37a33aca43c88541d669306b8fc431a710760ba0982c524eb30223ecbf657f880a9";
_app.ollehApiKey = "9886c37a33aca43c88541d669306b8fc431a710760ba0982c524eb30223ecbf657f880a9";

_app.guid = function(){
    function s4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

window.onload = function(){
    require(['./src/map/mapHandler', './src/tool/placeSearch', './src/tool/roadSearch', 
             './src/tool/baseLayer', './src/tool/themeLayer', './src/tool/contextMenu', 
             './src/left/leftMenu', './src/override/customInfoWindow','./src/left/leftResultMgr', 'eventbusjs'],
        function(mapHandler, placeSearch, roadSearch, baseLayer, themeLayer, contextMenu, leftMenu, customInfoWindow, leftResultMgr, eventbusjs){
            _app.eventbusjs = eventbusjs;
            _app.mapHandler = new map.MapHandler();
            _app.mapHandler.initMap('ollehMap');

            _app.placeSearch = new tool.PlaceSearch();
            _app.roadSearch = new tool.RoadSearch();
            _app.leftMenu = new left.LeftMenu();
            _app.baseLayer = new tool.BaseLayer();
            _app.themeLayer = new tool.ThemeLayer();
            _app.contextMenu = new tool.ContextMenu('ollehMap');
            _app.leftResultMgr = new left.LeftResultMgr();
        }
    );
};