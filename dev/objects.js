   var svg = "http://www.w3.org/2000/svg";
	var linkdrawingProps=["y1","y2","t1","t2"];
	
	var eventdrawingProps=["startTime","duration","y","links"];
	var eventdrawingMethods=["placeLinks"];
  var begin;
  function drawEvent(d){
    return function(){
	 // if(!d.printouts)console.info(d);
      var left,top,width;
      width=Math.max(port.scale(begin+d.duration),1);
	  left=port.scale(d.startTime);
      top=stripPos(d.y);
      this.style.width=(width-markerWidth).toString().concat("px");
      this.style.left=left.toString().concat("px");
      this.style.top=top.toString().concat("px");
      this.box.setAttribute("x",left);
      this.box.setAttribute("width",width);
      this.box.setAttribute("y",top);
	  for(var x in d.links){
	  
		if(d.links[x].line)d.links[x].line.draw();
	  }
//	  this.text.setAttribute("x",left);
//      this.text.setAttribute("y",top+0.2*lineHeight);
    }
  }

  function drawLink(d,s,t){
		
		
		
	  return function(){
		function get(o){
		  //return d.__transition__ || d;
		  return (o.__transition__==undefined? o:o.__transition__);
		}
		var dp=get(d);
		var sp=get(d.source);
		var tp=get(d.target);
	    this.setAttribute("x1",port.scale(dp.t1));
	    this.setAttribute("x2",port.scale(dp.t2));
	    this.setAttribute("y1",stripPos(sp.y+dp.y1));
	    this.setAttribute("y2",stripPos(tp.y+dp.y2));
	  }
  }
  

	function eventLink(d){
	  var out = document.createElementNS(svg,"line");
	  out.__data__=d;
	  out.setAttribute("class","link");
	  d.line=out;
	  out.highLine=document.createElementNS(svg,"line");
	  out.highLine.setAttribute("class","linkHi");
	  
	  
	  out.highlight=function(){
	    this.highlighted=true;
		d3.select(this).classed("hidden",true);
		d3.select(this.highLine).classed("hidden",false);
		out.draw=out.draw.bind(out.highLine);
		out.draw();
	  }
	  out.unHighlight=function(){
	    this.highlighted=false;
	    d3.select(this).classed("hidden",false);
		d3.select(this.highLine).classed("hidden",true);
	
		out.draw=drawLink(d);
		out.draw();
	  }
	  out.classed=function(css,val){
	    d3.select(this).classed(css,val)
	    d3.select(this.highLine).classed(css,val);
	    return out;
	  }
	  out.styled=function(arg,val){
	    d3.select(this).style(arg,val);
	    d3.select(this.highLine).style(arg,val);
	  }
	  
	  out.unselect=function(){
	    out.classed("link",false)
	    out.classed("fadedLink",true);
	  }
	  out.draw=drawLink(d);
	  
	  out.update=function(newTrans){
		var u = d.update(newTrans,function(){return function(){return out.draw}},function(){out.draw();});
  
		out.draw=drawLink(d);
		if(out.highlighted){
		  out.draw=out.draw.bind(out.highLine);
		}
		
		u();
	  }
	  //d.drawingProps=linkdrawingProps;
	  return out;
    }//end link
	

    function event(d){
      var out = document.createElement("div");
      out.setAttribute("class","event pwLine");
	  
      out.__data__=d;
      out.pattern = document.createElementNS(svg,"pattern");
      
      out.pattern.box  = out.pattern.appendChild(document.createElementNS(svg,"rect"));
      out.pattern.box.setAttribute("class","event pwLine");
      out.pattern.text = out.pattern.appendChild(document.createElementNS(svg,"text"));
      out.pattern.text.appendChild(document.createTextNode(d.label));
      
      d3.select(out.pattern).attr({patternUnits:"userSpaceOnUse",width:out.pattern.text.getComputedLength(),height:lineHeight,x:0,y:0,id:d.label+"_text_pattern"})
      out.box = document.createElementNS(svg,"rect");
      out.box.setAttribute("class","pwLine");
      out.box.setAttribute("fill","url(#"+d.label+"__text_pattern)");
	  
	  
	 
	  //out.pattern.text.setAttribute("class","event line");
	  //out.pattern.text.setAttribute("font-size",0.8*lineHeight);
	  
      
	  out.appendChild(document.createTextNode(d.label));
	  out.setAttribute("title",d.label)
	  out.classed=function(css,val){
		d3.select(out).classed(css,val);
		d3.select(out.box).classed(css,val);
		return out;
	  }
	
	  out.styled=function(arg,val){
		d3.select(out).style(arg,val);
		d3.select(out.box).style(arg,val);
	   
	  }
	  
	  out.unselect=function(){
		out.classed("event",false)
		out.classed("fadedEvent",true);
	  }
	  
	  out.draw=drawEvent(d);
	  strip.add(d);
	  
	  out.update=function(newTrans){
		
		function reDraw(){
		  out.draw=drawEvent(d);
		  out.draw()
		  /*if(d.links.length){
			d.links.forEach(function(l){
			  if(l.line)l.line.draw=drawLink(l);
			})
		  }*/
		}
		
		function getDraw(d){
		  return function(){
			return drawEvent(d.__transition__).bind(out);
		  }
		}
		
		var u = d.update(newTrans,getDraw(d),reDraw)
		
		u();
		
		/*
		if(d.updates.y!=undefined){
		  
		  if(d.tween){
			d.tween.y=d3.interpolateNumber(d.get("y"),d.updates.y);
		  }else{
			d.update(newTrans,getDraw,redraw)();
		  }
		  
		}*/
		
		
		
		d.placeLinks();
	  }
	  
      out.addListeners=function(){
		out.addEventListener("click",click)
		out.addEventListener("dblclick",dblclick);
		out.addEventListener("touchstart",handleTouch);
		out.addEventListener("mouseover",highlightLinks);
		return true;
	  }
	  out.removeListeners=function(){
		out.removeEventListener("click",click)
		out.removeEventListener("dblclick",dblclick);
		out.removeEventListener("touchstart",handleTouch);
		out.removeEventListener("touchend",touchEnd);
		out.removeEventListener("mouseover",highlightLinks);
		out.removeEventListener("mouseout",unhighlightLinks);
	  }

      
      out.box.highlight=function(){
		var sel = d3.select(this);
		sel.classed("eventHi",true)
		sel.classed("event",false);

      }
      out.box.unHighlight=function(){
		var sel = d3.select(this);
		sel.classed("eventHi",false)
		sel.classed("event",true);

      }
      out.box.select=function(){
		if(selectedEvent)selectedEvent.classed("eventSel",false)
		selectedEvent=d3.select(this).classed("eventSel",true)
      }

	d.box=out.box;
	function handleTouch(){
	  this.addEventListener("touchend",touchEnd);
	}

    function touchEnd(){
	  highlightLinks.bind(this)();
	  
	  if(this.touchTime&&((new Date())-this.touchTime)<2000){
		dblclick.bind(this)();
	  }else{
		click.bind(this)();
	  }
	  
	  this.touchTime=new Date();
	  this.addEventListener("touchmove",function(){
		this.removeEventListener("touchend",touchEnd)
	  })
    }
      function click(){
		this.box.select();
		dispatch.select({ticket:this.__data__});
      }
      function dblclick(){
		dispatch.focus({ticket:this.__data__});
      }
      function highlightLinks(){
		if(highlightedEvent)unhighlightLinks.bind(highlightedEvent)();
		highlightedEvent=this;
		this.box.highlight()
		var links = this.__data__.links;
		var n=links.length,i;
		for(i=0;i<n;i++){
		  if(links[i].line)links[i].line.highlight();
		}
		links=this.__data__.dependencies
		n=links.length;
		for(i=0;i<n;i++){
		  if(links[i].box)links[i].box.highlight();
		}
		links=this.__data__.prereqs
		n=links.length;
		for(i=0;i<n;i++){
		  if(links[i].box)links[i].box.highlight();
		}
	
		this.addEventListener("mouseout",unhighlightLinks);
      }
      function unhighlightLinks(){
		this.box.unHighlight();
		var links = this.__data__.links;
		var n=links.length,i;
		for(var i=0;i<n;i++){
		  if(links[i].line)links[i].line.unHighlight();
	}
	links=this.__data__.dependencies
	n=links.length;
	for(i=0;i<n;i++){
	  if(links[i].box)links[i].box.unHighlight();
	}
	links=this.__data__.prereqs
	n=links.length;
	for(i=0;i<n;i++){
	  if(links[i].box)links[i].box.unHighlight();
	}
	this.removeEventListener("mouseout",unhighlightLinks);
    }
      return out;
    }//end event
	

