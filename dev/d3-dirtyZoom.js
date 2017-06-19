  d3.behavior.rangeZoom = function() {
 	  var translate = [ 0, 0 ], translate0, scale = 1, scale0, scaleExtent = d3_behavior_zoomInfinity, event = d3_eventDispatch(zoom, "zoom"), x, origRngX, y, origRngY, startloc, touchtime;
    function zoom() {
      this.on("mousedown.zoom", mousedown).on("mousewheel.zoom", mousewheel).on("mousemove.zoom", mousemove).on("DOMMouseScroll.zoom", mousewheel).on("dblclick.zoom", dblclick).on("touchstart.zoom", touchstart).on("touchmove.zoom", touchmove).on("touchend.zoom", touchstart);
    }
    zoom.translate = function(x) {
      if (!arguments.length) return translate;
      translate = x.map(Number);
      rescale();
      return zoom;
    };
    zoom.scale = function(x) {
      if (!arguments.length) return scale;
      scale = +x;
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(x) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = x == null ? d3_behavior_zoomInfinity : x.map(Number);
      return zoom;
    };
    zoom.rangeExtent = function(x){
		
    }
    zoom.x = function(z) {
      if (!arguments.length) return x;
		if(!x){
			x = z;
			origRngX = z.range();
			rescale();
		}else{
			x = z;
			origRngX = z.range();
			translate = [ 0, 0 ];
			scale = 1;
		}
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y;
		if(y){
			y = z;
			origRngY = z.domain();
			rescale();
		}else{
			y = z;
			origRngY = z.domain();
			translate = [ 0, 0 ];
			scale = 1;
		}
    };
    function location(p) {
      return [ (p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale ];
    }
    function point(l) {
      return [ l[0] * scale + translate[0], l[1] * scale + translate[1] ];
    }
    function scaleTo(s) {
      scale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      translate[0] += p[0] - l[0];
      translate[1] += p[1] - l[1];
    }
    function rescale() {
      if (x) x.range([translate[0]+(origRngX[0]-translate[0])*scale,translate[0]+(origRngX[1]-translate[0])*scale]);
      if (y) y.range([translate[1]+(origRngY[0]-translate[1])*scale,translate[1]+(origRngY[1]-translate[1])*scale]);
    }
    function dispatch(event) {
      rescale();
      d3.event.preventDefault();
      event({
        type: "zoom",
        scale: scale,
        translate: translate
      });
    }
    function mousedown() {
      var target = this, event_ = event.of(target, arguments), eventTarget = d3.event.target, moved = 0, w = d3.select(window).on("mousemove.zoom", mousemove).on("mouseup.zoom", mouseup), l = location(d3.mouse(target));
      window.focus();
      d3_eventCancel();
      function mousemove() {
        moved = 1;
        translateTo(d3.mouse(target), l);
        dispatch(event_);
      }
      function mouseup() {
        if (moved) d3_eventCancel();
        w.on("mousemove.zoom", null).on("mouseup.zoom", null);
        if (moved && d3.event.target === eventTarget) w.on("click.zoom", click, true);
      }
      function click() {
        d3_eventCancel();
        w.on("click.zoom", null);
      }
    }
    function mousewheel() {
      if (!translate0) translate0 = location(d3.mouse(this));
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * scale);
      translateTo(d3.mouse(this), translate0);
      dispatch(event.of(this, arguments));
    }
    function mousemove() {
      translate0 = null;
    }
    function dblclick() {
      var p = d3.mouse(this), l = location(p), k = Math.log(scale) / Math.LN2;
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
      translateTo(p, l);
      dispatch(event.of(this, arguments));
    }
    function touchstart() {
      var touches = d3.touches(this), now = Date.now();
      scale0 = scale;
      translate0 = {};
      touches.forEach(function(t) {
        translate0[t.identifier] = location(t);
      });
      d3_eventCancel();
      if (touches.length === 1) {
        if (now - touchtime < 500) {
          var p = touches[0], l = location(touches[0]);
          scaleTo(scale * 2);
          translateTo(p, l);
          dispatch(event.of(this, arguments));
        }
        touchtime = now;

  	  } else if (touches.length > 1) {	
   		 var loc0 = location(touches[0]), loc1 = location(touches[1]);
    	 startloc = [(loc0[0] - loc1[0]), (loc0[1] - loc1[1])];
      }
    }
    function touchmove() {
      var touches = d3.touches(this), p0 = touches[0], l0 = translate0[p0.identifier];
      if (p1 = touches[1]) {
        var p1, l1 = translate0[p1.identifier];
        p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
        l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
  	 if (d3.event.scale == undefined) {
	      var loc0 = location(touches[0]), loc1 = location(touches[1]), endloc = [(loc0[0] - loc1[0]), (loc0[1] - loc1[1])];
	     d3.event.scale = Math.sqrt((endloc[0] * endloc[0]) + (endloc[1] * endloc[1])) / Math.sqrt((startloc[0] * startloc[0]) + (startloc[1] * startloc[1]));	
    }
        scaleTo(d3.event.scale * scale0);
      }
      translateTo(p0, l0);
      touchtime = null;
      dispatch(event.of(this, arguments));
    }
    return d3.rebind(zoom, event, "on");
  };
