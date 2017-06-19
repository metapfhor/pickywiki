d3.timeline = function(viz){
 
  var timeline = {};
  var lineSpacer =1;
  lineHeight=15;
  var nodes,links;
  var screenWidth,paddedWidth,screenHeight;
  var spacer = 15;
  markerWidth = 1;
  var nodeColor = "green";
  dispatch = d3.dispatch("select","focus");
  inTime=750;
  outTime=750;
  var moveTime=250;
  var tickets=[];
  var padding = [0,36];

  var events,eventLinks;
  
  
    node.prototype.placeLinks=function(){
	  function overlap(a,b) {
		return (a.starTime>b.startTime && a.startTime<b.endTime)||(a.endTime>b.startTime && a.endTime<b.endTime);
	  }
	  function startsAreCloser(a,b){
		return Math.abs(b.startTime-a.startTime)<Math.abs(b.endTime-a.endTime);
	  }
	  function closestTime(a,b){
		var diff=[Math.abs(a.startTime-b.startTime),Math.abs(a.endTime-b.startTime),Math.abs(a.startTime-b.endTime),Math.abs(a.endTime-b.endTime)]
		var min = Infinity;
		var mIndex=0;
		for(var x in diff){
		  if(diff[x]<min){
			min=diff[x];
			mIndex=x;
		  }
		}
		return mIndex%2==0?a.startTime:a.endTime;
	  }
	  
	  
	  var placeLink=function(l){
		
		var o,time,map;
		if((l.source==this)||(l.target==this)){
		  if((l.source==this)){
			o=l.target
			time=closestTime(this,o);
			map="t1";
		  }else{
			o=l.source;
			time=closestTime(this,o);
			map="t2";
		  }
		  if(time==this.startTime){
			startLinks.push({link:l,map:map});
		  }else{
			endLinks.push({link:l,map:map});
		  }
		  l.propagate(map,time);
		}
	  }.bind(this)
	  
	  function linkHeight(i,n){
		return (i/n)+(1/(2*n));
	  }
	  var sorter=function(a,b){
		function sin(l){
		  
		  var opp,hyp;
		  if(l.source==d){
			opp=(this.y-l.target.y);
		  }else{
			opp=(this.y-l.source.y);
		  }
		  opp=opp||0.5;
		  hyp=xDraw(earliest+Math.abs(l.t1-l.t2));
		  hyp = Math.sqrt(hyp*hyp+opp*opp);
		  return opp/hyp;
		}
		//if(a.theta==undefined){
		//  a.theta = Math.asin(sin(a.link));
		//}
		//if(b.theta==undefined){
		//  b.theta = Math.asin(sin(b.link));
		//}
		if(a.theta==undefined){
		  a.theta = sin(a.link);
		}
		if(b.theta==undefined){
		  b.theta = sin(b.link);
		}
		return b.theta-a.theta
	  }.bind(this);

	  var o,startLinks=[],endLinks=[],n;
	  
	  for(var i=0;i<this.links.length;i++){
		o=this.links[i];
		o.sin=undefined;
		if(!o.inactive)placeLink(o);
	  }
	  
	  n=startLinks.length;
	  startLinks.sort(sorter);
	  
	  
	  for(var i=0;i<n;i++){
		o=startLinks[i];
		o.link.propagate(o.map.replace("t","y"),linkHeight(i,startLinks.length));
		o.link.update(false)();
		
	  }
	  n=endLinks.length;
	  endLinks.sort(sorter);
	  for(var i=0;i<n;i++){
		o=endLinks[i];
		o.link.propagate(o.map.replace("t","y"),linkHeight(i,endLinks.length));
		o.link.update(false)();
	  }
	}//end node.placeLinks
	
	node.prototype.drawingProps=["startTime","duration","y","links"];
	node.prototype.drawingMethods=["placeLinks"];
	
	link.prototype.drawingProps=["y1","y2","t1","t2"];
  
  

	//var links,nodes;

	var axisSvg,gAxis,gAxisTip,plot,zoom,xDraw,x0,axisScale;
	//var lastScale,lastTrans;
	//var port
  function initViewer(){
    function resize(){
      screenWidth=plot[0][0].parentNode.offsetWidth;
      screenHeight=plot[0][0].parentNode.offsetHeight;
      axisScale.range([0,screenWidth]);
      handlePadding();
      axis.tickSize(screenHeight-15,0);
      redrawAxis();
      port.style({width:screenWidth+"px",height:screenHeight+"px"});
    }


    axisScale = d3.time.scale();
    x0 = d3.time.scale();

    zoom = d3.behavior.directionalZoom().on("zoom",handleZoom);
    lastScale = 1;
    lastTrans = [0,0];
	
	drag = d3.behavior.drag();
	drag.on("dragstart",function(d,i){
	  
	  
	  this.touchTime=xDraw.invert(d3.offsetX)+d.startTime;
	})//end dragStart
	
	drag.on("drag",function(d,i){
	 
	  for (var x in d3.event.sourceEvent) {
	   if (typeof(d3.event.sourceEvent[x])=="function") {
	    console.info("d3.event.function: "+x);
	   }
	  }
	  d3.event.sourceEvent.stopPropagation();
	  var redraw=false,dom=port.domain();
	  var isEarliest = d.startTime == earliest;
	  var isLatest = d.endTime == latest;
	  var startTime = d.startTime+(xDraw.invert(d3.event.dx)-dom[0]);
	  d.propagate("startTime",startTime);
	  d.propagate("endTime",startTime+d.duration);
	  
	  //update properties, do not create new transition
	  d.update(false)();
	  
	  
	  
	  if(isLatest){
		tmp = d3.max(events,function(d){return d.endTime});
		if(tmp!=latest){
		  redraw=true;
		  latest=tmp;
		}
	  }
	  if(isEarliest){
		tmp = d3.min(events,function(d){return d.startTime});
		if(tmp!=earliest){
		  redraw=true;
		  earliest=tmp;
		}
	  }
	  
	  dom = port.domain();
	  port.domain([Math.max((isEarliest?d.startTime:dom[0]),earliest),Math.min(Math.max((isLatest?d.endTime:dom[1]),d.endTime),latest)]);
	  
	  
	  //check startTime
	  if(earliest>d.startTime){
		redraw=true;
		earliest=d.startTime;
		port.domain([earliest,port.domain()[1]]);
	  }
	  
	  //check endTime
	  if(latest<d.endTime){
		redraw=true;
		latest=d.endTime;
		port.domain([port.domain()[0],latest]);
	  }
	  
	  x0.domain([earliest,latest]);
	  axisScale.domain([port.invert(-padding[0]),port.invert(paddedWidth+padding[1])]);
	  
	  this.draw();
	  
	  if(d.links.length){
		d.placeLinks();
	  }
	  
	  if(redraw){
		port.redraw();
		redrawAxis();
	  }
	})//end dragMove
	
	drag.on("dragend",function(d){
	 
	  this.touchTime=undefined
	  strip = d3.layout.stripPacker([],earliest,latest);
	  var oldY=d.y;
	  strip.add(d,d.y);
	  var data = nodes.data();
	  data.splice(d.index,1);
	  strip.add(data);
	  strip.add(d);
	  d.updates.y=Math.min(d.updates.y,oldY);
	  
	  //strip = d3.layout.stripPacker(nodes.data(),earliest,latest);
	  nodes.each(function(o){
		if(o.__transition__){
		  this.update(false);
		}else{
		  this.update(true);
		}
	  });
	  if(links)links.each(function(o){this.update(true)})
	  port.redraw();
	})//end dragEnd
	
    plot = viz.append("div")
    .style({position:"absolute",
    left:0+"px",
    top:0+"px",
    width:"100%",
    height:"100%",
    overflow:"hidden"}).attr("class","plot")
	
    window.addEventListener("resize",resize);

    axisSvg = plot.append("svg:svg")
    .style({position:"absolute",
    height:"100%",
    width:"100%",
    left:0+"px",
    top:0+"px"}).attr("class","axisSvg");

    axis = d3.svg.axis()
    .scale(axisScale)
    .orient("bottom");
	


    gAxis = axisSvg.append("svg:g").attr("class", "x axis");
	screenWidth=plot[0][0].parentNode.offsetWidth;
	screenHeight=plot[0][0].parentNode.offsetHeight;
	axisScale.range([0,screenWidth]);

	axis.tickSize(screenHeight-15,0);
	//redrawAxis();
	
	//plot[0][0].addEventListener("mouseover",listenForLines);
    
	port = viewport(plot);
	
	plot.call(zoom);
	//this.addEventListener("keydown",function(){
	 // console.info("asdasdasdasdas");  
	//});
	
	function listenForLines(e){
	   
	  function checkCntrl(e){
		function resize(e){
		  console.info(e.wheelDeltaX);
		  timeline.lineHeight(lineHeight*(1+(.1*(e.wheelDeltaX/120))));
		  e.stopPropagation();
		}
		if(e.keyCode==16){
		  console.info("we have shift")
		  window.addEventListener("mousewheel",resize,true);
		  window.addEventListener("keyup",function(e){
			
			if(e.keyCode==16)window.removeEventListener("mousewheel",resize,true);
		  
		  })
		}
	  }
	  
	  window.addEventListener("keydown",checkCntrl);
	  
	  this.addEventListener("mouseout",function(){
		window.removeEventListener("keydown",checkCntrl);
	  })
	  
	}
	
	
	
	
	
	
	
	
	
	handlePadding();
	resize();


  }//end initViewer

  var earliest=Infinity,latest=-Infinity;

  function viewport(sel){
    var back,backSvg,backG,fade,exist,gLinks,gNodes,frontG,old;
    var visEvents,visLinks;
    var filter;
    back = sel.append("div")
    .style({position:"absolute",
      left:padding[0]+"px",
      top:0+"px",
      opacity:1,
      overflow:"visible",
	  "pointer-events":"none"}).attr("class","back");

    backSvg = back.append("svg:svg")
    .style({position:"absolute",
	  width:screenWidth+"px",
	  height:"100%",
	  left:(-padding[0])+"px",
	  top:0+"px",
	  overflow:"auto",
	  "pointer-events":"none"});

	backG=backSvg.append("svg:g").attr("transform","translate("+padding[0]+")");

	frontSvg = back.append("svg:svg")
    .style({position:"absolute",
	  width:screenWidth+"px",
	  height:"100%",
	  left:(-padding[0])+"px",
	  top:0+"px",
	  overflow:"auto",fill:"none",
	  "pointer-events":"none"});


	
    xDraw = d3.time.scale();
	buildContainers();


    function buildContainers(){
      gLinks = backG.insert("svg:g",":first-child");
      gLinks=gLinks[0][0];

      gNodes = backG.append("svg:g");
      gNodes=gNodes[0][0];

      frontG=frontSvg.append("svg:g").attr("transform","translate("+padding[0]+")");


    }//end containers

    function updateElements(data,append){
	  function fadeInOut(selection,data,child,appendChild,parent,selector){
		function fadeNew(d){
		  var o=child(d).classed("fadeIn",true);
		  appendChild(o);
		  d3.select(o).call(drag);
		  d3.timer(function(){
			o.classed("fadeIn",false);
			if(o.addListeners)o.addListeners()
			return true;}
		  ,inTime);
		}
		function fadeOld(o){
		  if(o.removeListeners)o.removeListeners();
		  o.unselect();
		  o.classed("fadeOut",true);
		  return o;
		}
		if(selection){
		 
		  var oldData=selection.data();
		  var found=[];
		  var sel=selection[0],e;
		  for(var i=0;i<data.length;i++){
			var j=oldData.indexOf(data[i]);
			if(j==-1){
			  fadeNew(data[i]);
			}else{
			  if(!append){
				found[j]=true;
				
				
			  }
			  //if updateable element and data has updates
			  if((e=sel[j]).update&&e.__data__.updates!=undefined){
				e.update()
				e.__data__.updates=undefined;
			  }
			}
		  }
		  if(!append){
			var old=[]
			for(var i=0;i<oldData.length;i++){
				if(!found[i])old.push(fadeOld(sel[i]));
			}
			var cut = function(o){return function(){d3.selectAll(o).remove();return true}};
			d3.timer(cut(old),outTime);
		  }
		}else{
		  for(var i=0;i<data.length;i++){
			fadeNew(data[i]);
		  }
		  
		}
		return d3.select(parent).selectAll(selector);
      }//end fadeInOut

      function filterLinks(links){
	var out = [];
	function checkLink(l){
	  if(events.indexOf(l.target)!=-1&&events.indexOf(l.source)!=-1)out.push(l);
	}
	for(var i=0;i<links.length;i++){
	 checkLink(links[i]);
	}
	return out;
      }//end filterLinks
      
    function remove(elm){
	  elm.parentNode.removeChild(elm);
	  return true;
	}

      events=data.nodes;
      
	  earliest=Infinity
      latest=-Infinity;
      
     
     

      eventLinks=filterLinks(data.links);
	  
      
      nodes=fadeInOut(nodes,data.nodes,event,appendEvent,back[0][0],"div.event");
	  
	  nodes.each(function(d){
		if(d.startTime<earliest){
		  earliest=d.startTime;
		}
		if(d.endTime>latest){
		  latest=d.endTime;
		}	  
	  ;});
	  
	  resetDomains();
	  
	  nodes.each(function(d){d.placeLinks();})
	   
	  links=fadeInOut(links,eventLinks,eventLink,appendLink,gLinks,"line.link");
	  
      resetZoom();

    }//end updateELements
	
	function appendLink(l){
	  gLinks.appendChild(l);
	  frontG[0][0].appendChild(l.highLine);
	}
	
	function appendEvent(e){
	  back[0][0].insertBefore(e,back[0][0].lastChild);
	  console.info("adding pattern: "+e.pattern)
	  gNodes.appendChild(e.pattern);
	  gNodes.appendChild(e.box);
	}
	
    function fadeOld(){
	  
      if(exist){


	  exist.each(fadeOut);
	  d3.select(gLinks).each(fadeOut);
	  d3.select(gNodes).each(fadeOut);
	 
	  d3.timer(remove.bind(gLinks),outTime);
	  d3.timer(remove.bind(gNodes),outTime);
      }
    }//end fadeOld
    function filterElements(filter){
	  function info(elm){
		return elm.tagName+"."+(elm.className.animVal?elm.className.animVal:elm.className);
	  }
	  function fadeFiltered(selection,existing,filter){
		function fadeInTimeout(elm){
			return function(){
			  if(elm.addListeners)elm.addListeners();
			  elm.timeout=0;
			}
		}
		function fadeOutTimeout(elm){
		  return function(){
			  //elm.styled("opacity",0);
			  //elm.classed("fadeOut",false);
			  elm.timeout=0;
		  }
		}
		function fadeNew(o,css){
		  o.classed("fadeOut",false);
		  
		  o.classed("fadeIn",true);
		  o.timeout=setTimeout(fadeInTimeout(o),inTime);	
		}
		function fadeOld(o){

		  o.classed("fadeIn",false);
		  
		  if(o.removeListeners)o.removeListeners();
		  
		  o.classed("fadeOut",true);

		}
	  var filtered=[];
	  var data = selection.data();
	  var d,o;
	  for(var i=0;i<data.length;i++){
		d=data[i];
		o=selection[0][i]
		if(filter(d)){
		  filtered.push(d);
		  if(existing.indexOf(d)==-1){
			fadeNew(selection[0][i]);
		  }
		  //}
		}else{
		  fadeOld(selection[0][i]);
		}
	  }
		 return filtered;
	}//end fadeFiltered

      events=fadeFiltered(nodes,events,filter);
      eventLinks=fadeFiltered(links,eventLinks,function(d,i){return events.indexOf(d.target)!=-1&&events.indexOf(d.source)!=-1});
      nodes.filter(filter).each(function(d){d.placeLinks()});
	  return {nodes:events,links:eventLinks,earliest:earliest,latest:latest};
    }//end filterElements
	


    back.domain=function(x){
      return x!=undefined?xDraw.domain(x):xDraw.domain();
    }
	
	back.scale=function(x){
	  return xDraw(x);
	}

    back.range=function(x){
      if(x!=undefined){
		back.style("width",x[1]);
		return xDraw.range(x)
	  }else{
		return xDraw.range();
	  }
    }

    back.invert=function(x){
      return xDraw.invert(x);
    }

    back.redraw=function placeElements(){
	  function drawSel(s){
		if(s){
		  s.each(function(){this.draw();});
		}
	  }
      begin = xDraw.domain()[0].getTime();//muy muy important that this be properly defined!!
	  if(nodes)drawSel(nodes);
	  //drawSel(links);
      
    }//end redraw

  back.padding=function(x){
    backSvg.style("left",(-padding[0])+"px")
    frontSvg.style("left",(-padding[0])+"px")
    backG.attr("transform","translate("+padding[0]+")");
    if(frontG)frontG.attr("transform","translate("+padding[0]+")");

  }

    back.updateElements=updateElements;
    back.filterElements=filterElements;
    return back;
  

  }//end viewport
  
  
   function resetDomains(){
    x0.domain([earliest,latest]);
    port.domain([earliest,latest]);
    axisScale.domain([port.invert(-padding[0]),port.invert(paddedWidth+padding[1])]);
   }//end moveFiltered

   function resetZoom(){
    zoom.scale([1,1]);
    lastScale=1;
    zoom.translate([0,0]);
    stripHeight=stripPos(strip.getHeight()+1);
	port.style({top:0+"px",height:Math.max(stripHeight,screenHeight)+"px",width:((paddedWidth)*lastScale)+"px"});
	console.info([[1,maxScale(x0.domain())],[0.5,3]]);
    zoom.scaleExtent([[1,maxScale(x0.domain())],[0.5,3]]);
	redrawAxis();
   }
   





  function maxScale(dom){
    return ((dom[1]-dom[0])/10)/(3600*24000);
  }

  //var strip;
  function buildGraphs(nodes,links){
    function consolidateGraph(link){
      function updateTime(graph,node){
	if(node.startTime<graph.startTime){
		graph.duration+=(graph.startTime-node.startTime);
		graph.startTime=node.startTime;

	}
	if((node.endTime)>(graph.startTime+graph.duration)){
		graph.duration=node.endTime-graph.startTime;
	}
      }//end updateTime
      function addNode(node){
      if(nodes.indexOf(node)!=-1){
	      a.nodes.push(node);
	      node.graph=a;
	      updateTime(a,node);
	    }
      }//end addNode
      function addLink(link){
	      a.links.push(link);
      }//end addLink
      var a=link.source.graph||initGraph(link.source,link);
      var b=link.target.graph||initGraph(link.target,link);
      //b->a
	b.nodes.forEach(addNode);
	b.nodes=[];
	a.links.push(link);
	b.links.forEach(addLink);
	b.links=[];
      return b;
    }//end consolidateGraph
    function initGraph(node,link){
      var g = (node.graph={});
      g.nodes=[node];
	    g.links=link?[link]:[];
	    g.startTime=node.startTime;
	    g.duration=node.duration;
	    return g;
    }
    var graphs=[],n=nodes.length,o;
    for(var i=0;i<n;i++){
	    graphs.push(initGraph(nodes[i]));
    }
    n=links.length;
    for(var i=0;i<n;i++){
	    o=consolidateGraph(links[i]);
	    graphs.splice(graphs.indexOf(o),1);
  
    }
    return graphs.sort(function(a,b){
	    return b.duration-a.duration;
    });
  }

	function packGraphs(data){
		function overlap(a,b){
			return (a.startTime>b.startTime && a.startTime<b.endTime)||
			(a.endTime>b.startTime && a.endTime<b.endTime)||
			(b.startTime>a.startTime && b.startTime<a.endTime)||
			(b.endTime>a.startTime && b.endTime<a.endTime);
		}
		//if(nodes){
		if(false){
		  var oldData=nodes.data();
		  newData=[],d;
		  for(var x in data.nodes){
			d=data.nodes[x]
			if(d.y==undefined){
			  newData.push(d);
			}
		  }
		  strip.add(newData);
		  
		  }else{
		  strip.add(data.nodes);
		}
		
		return;
		var graphs = buildGraphs(data.nodes,data.links);
		var g,n=graphs.length;
		for(var i=0;i<n;i++){
			if((g=graphs[i]).nodes.length>1){
				g.nodes.sort(function(a,b){return (a.prereqs.indexOf(b)!=-1?-1:(a.startTime-b.startTime)*(b.duration-a.duration));});
				strip.add(g.nodes,true);
				g.links.sort(function(a,b){return (b.source.duration+b.target.duration)-(a.source.duration+a.target.duration);})
				strip.addLinks(g.links);
			}else{
				strip.add(g.nodes);
			}
		}
	}

  stripPos = function(i){
    return i*(lineHeight+lineSpacer);
  }
  var stripHeight=0;

  initViewer();

  timeline.redraw=port.placeElements;

  timeline.add=function(data){
    strip = d3.layout.stripPacker([],Math.min(data.earliest,earliest),Math.max(data.latest,latest));
    port.updateElements(data,true);
    port.redraw();
	
    return timeline;
  }

  timeline.set=function(data){
    strip = d3.layout.stripPacker([],Math.min(data.earliest,earliest),Math.max(data.latest,latest));
	port.updateElements(data,false);
    port.redraw();
	
    return timeline;
  }

  timeline.padding=function(x){
    if(!arguments.length)return padding;
    var dx = x[0]-padding[0];
    padding = x;
    handlePadding(dx);
    return timeline;
  }

  timeline.filterElements=function(x){
    if(!arguments.length){
      return port.filterElements(function(){return true})
    }else{
      return port.filterElements(x);
    }
  };

  timeline.domain=function(x){
      if(!arguments)return [earliest,latest];
      if(x[0]<earliest)earliest=x[0];
      if(x[1]>latest)latest=x[1];
      resetDomains();
      resetZoom()
      handlePadding();

     return timeline;
  }

   timeline.lineHeight=function(x){
	  if(!arguments.length)return lineHeight;
	  lineHeight=x;
	  handleLineHeight();
	  stripHeight=stripPos(strip.getHeight()+1);
	  port.style({height:Math.max(stripHeight,screenHeight)+"px",width:((paddedWidth)*lastScale)+"px"});
	  port.redraw();
	  return timeline;
       }

  function handleZoom(t,s){
    if(t==undefined){
      t = d3.event.translate;
      s = d3.event.scale[0];
    }
    console.log((ev=d3.event));
    //t[0]=Math.max(Math.min(padding[0],t[0]),paddedWidth+padding[0]-(paddedWidth)*s);
    //t[1]=stripHeight>height?Math.max(Math.min(0,t[1]),screenHeight-stripHeight):0;

    checkTranslation(t,s);

    drawDomain(t,s);
    axisDomain(t,s);

    if(s!=lastScale){
      t[1]=lastTrans[1];
      lastScale=s;
    }
	if(d3.event.scale[1]*15!=lineHeight){
	  timeline.lineHeight(d3.event.scale[1]*15);
	}
    port.redraw();
    port.style({top:t[1]+"px"});

    lastTrans=t;
    zoom.translate(t);

	redrawAxis();
  }

  function checkTranslation(t,s){
    t[1]=stripHeight>screenHeight?Math.max(Math.min(0,t[1]),screenHeight-stripHeight):0;
    t[0]=Math.max(Math.min(0,t[0]),paddedWidth-(paddedWidth)*s);
  }

  function axisDomain(t,s){
    axisScale.domain([port.invert(-padding[0]),port.invert(paddedWidth+padding[1])])
  };

  function drawDomain(t,s){
    port.domain([x0.invert(-t[0]/s),x0.invert((paddedWidth-t[0])/s)]);
  }


  function handlePadding(){
    paddedWidth=screenWidth-padding[0]-padding[1];
    port.range([0,paddedWidth]);
    x0.range([0,paddedWidth]);
	checkTranslation(lastTrans,lastScale);
    if(earliest) axisDomain(lastTrans,lastScale);
    port.padding(padding);
	port.style({left:padding[0]+"px",top:lastTrans[1]+"px"})
	port.redraw();
	redrawAxis();

  }

	var lineRule
	function handleLineHeight(){
	  function getRule(){
		var o;
		var ss,rl;
		for(var x in document.styleSheets){
		  rl=document.styleSheets[x].cssRules;
		  for(var i=0;i<rl.length;i++){
			if((o=rl[i].selectorText)){
			  var o=rl[i].selectorText;
			  if(o.match("\\\.pwLine")){
			   return rl[i];
			  }
			}
		  }
		}


	  }
	  if(!lineRule){
	    lineRule=getRule();
	  }
	  lineRule.style.cssText = "height:"+lineHeight+"px; font-size:"+(0.8*lineHeight)+"px;";
	  if(nodes){
	    nodes.each(function(){this.box.setAttribute("height",lineHeight);
		       
		       d3.select(this.pattern.box).attr({width:this.pattern.getComputedLength(),height:lineHeight})
		       
		       })
	  }
	}
	
	function redrawAxis(){
	  function axisTip(g){
		axis(g);
		g.selectAll("g").each(function(d){
		  var date = port.invert(this.getAttribute("transform").split("(")[1].split(",")[0]-padding[0]).toLocaleDateString();
		  
		  if(!this.title){
			this.line=this.firstChild;
			this.tip=d3.select(this).append("svg:line")
			.style({stroke:"black",
				   "stroke-width":20,
				   "stroke-dasharray":"none",
				   "stroke-opacity":0})[0][0]
			this.title=d3.select(this).insert("svg:title",":first-child");
		  }else{
			
		  }
		  this.tip.setAttribute("x2",this.line.getAttribute("x2"));
		  this.tip.setAttribute("y2",this.line.getAttribute("y2"));
		  this.title.text(date);
		});
	  }
	  gAxis.call(axisTip)
	  //gAxisTip.call(axisTip);
	}



  return d3.rebind(timeline, dispatch, "on");

}
