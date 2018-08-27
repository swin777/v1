$class("override.CustomInfoWindow").extend(olleh.maps.overlay.InfoWindow).define({
    placeSearchResult_dom: $("#placeSearchResult"), //검색결과영역
    attSearchResult_dom: $("#attSearchResult"), //검색결과영역

    _autoPan: function() {
        var gap = _app['leftResultMgr'].leftGap();
        
        var t = this.getMap().getOverlayLayer().layerMgr,
            e = olleh.maps.overlay.BaseInfoWindow,
            i = t.getLayerPxFromCoord(t.getCenter()),
            s = new olleh.maps.Point(Math.round(i.x), Math.round(i.y)),
            o = t.getViewportSize(),
            n = Math.round(o.width / 2),
            a = Math.round(o.height / 2),
            r = t.getLayerPxFromViewportPx(new olleh.maps.Point(gap, 0)),
            l = t.getLayerPxFromViewportPx(t.getViewportSize().asPoint()),
            h = this._calInfoData(),
            m = this.getOriginalLayerPx(),
            p = h.size,
            d = h.topLeft,
            u = h.bottomRight,
            c = m.x,
            g = m.y,
            f = d.subtract(r),
            _ = l.subtract(u),
            v = !0,
            y = !0;
        if (f.x > 0 && _.x > 0 && (v = !1, c = s.x), f.y > 0 && _.y > 0 && (y = !1, g = s.y), v || y) {
            var x = o.subtract(p),
                w = x.width < 0,
                b = x.height < 0,
                E = s.subtract(m),
                P = E.x > 0,
                C = E.y > 0;
            v && (c = w ? d.x - e.AUTO_PAN_MARGIN + n : P ? d.x - e.AUTO_PAN_MARGIN + n : d.x + p.width + e.AUTO_PAN_MARGIN - n), y && (g = b ? d.y - e.AUTO_PAN_MARGIN + a : C ? d.y - e.AUTO_PAN_MARGIN + a : a < p.height && _.y > 0 ? d.y - e.AUTO_PAN_MARGIN + a : u.y + e.AUTO_PAN_MARGIN - a);
            var T = t.getCoordFromLayerPx(new olleh.maps.Point(c-gap, g));
            t.panTo(T)
        }
    }
});