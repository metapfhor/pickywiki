d3.timeline = function(viz){
  var svg = "http://www.w3.org/2000/svg";
  var timeline = {};
  var lineSpacer =1;
  var screenWidth,paddedWidth,height;
  var formatNumber = d3.format(".1f");
  var spacer = 15;
  var markerWidth = 1;
  var nodeColor = "green";
  var dispatch = d3.dispatch("select");
  var inTime=750;
  var outTime=750;
  var tickets=[];
  var padding = [0,0]
  
  var events,eventLinks;
	//var links,nodes;
	
	var axisSvg,gAxis,plot,zoom,lastScale,lastTrans,xDraw,x0,xAxis,highlightedEvent;
	//var port
  function initViewer(){   
    function resize(){
      screenWidth=plot[0][0].parentNode.offsetWidth;
      height=plot[0][0].parentNode.offsetHeight;
      xAxis.range([0,screenWidth]);
      handlePadding();
      axis.tickSize(height-15,0);
      gAxis.call(axis)
    } 
	  
    
    xAxis = d3.time.scale();
    x0 = d3.time.scale();
    
    zoom = d3.behavior.zoom().on("zoom",handleZoom);
    lastScale = 1;
    lastTrans = [0,0];
	
    plot = viz.append("div")
    .style({position:"absolute",
    left:0,
    top:0,
    width:"100%",
    height:"100%",
    overflow:"hidden"}).call(zoom);
    
    
    
    window.addEventListener("resize",resize);

    axisSvg = plot.append("svg:svg")
    .style({position:"absolute",
    height:"100%",
    width:"100%",
    left:0,
    top:0}).attr("class","axisSvg");

    axis = d3.svg.axis()
    .scale(xAxis)
    .orient("bottom");

    gAxis = axisSvg.append("svg:g").attr("class", "x axis");
	screenWidth=plot[0][0].parentNode.offsetWidth;
      height=plot[0][0].parentNode.offsetHeight;
      xAxis.range([0,screenWidth]);
     
      axis.tickSize(height-15,0);
      gAxis.call(axis)
    
    port = viewport(plot);
	 handlePadding();
	resize();
    
    
  }//end initViewer
	
	var earliest=Infinity,latest=-Infinity;
	
  function viewport(sel){
    var back,backSvg,fade,exist,xDraw;
	
	backSvg = sel.append("svg:svg")
    .style({position:"absolute",
      width:"100%",
      height:"100%",
      left:0,
      top:0,
	  overflow:"auto"}).append("svg:g").attr("tranform","translate("+padding[0]+")");
    
    back = sel.append("div")
    .style({position:"absolute",
      left:padding[0],
      top:0,
      width:"100%",
      height:"100%",
      opacity:1,
      overflow:"visible"}).attr("class","back");    

    
    
    xDraw = d3.time.scale();
    
    function buildContainers(){ 
       exist = back.append("div")
      .style({position:"absolute",
	  left:0,
	  top:0,
	  width:"100%",
	  height:"100%",
	  overflow:"visible"}).attr("class","exist");
  
      fade = exist.append("div")
      .style({position:"absolute",
	  left:0,
	  top:0,
	  opacity:0,
	  width:"100%",
	  height:"100%",
	  overflow:"visible"}).transition().duration(inTime).style("opacity",1).attr("class","fade");
		
      gLinks = backSvg.insert("svg:g",":first-child");
      fadeLinks = gLinks.append("svg:g").style("opacity",0).transition().duration(inTime).style("opacity",1)[0][0];
      gLinks=gLinks[0][0];
      gNodes = backSvg.append("svg:g");
      fadeNodes = gNodes.append("svg:g").style("opacity",0).transition().duration(inTime).style("opacity",1)[0][0];
      gNodes=gNodes[0][0];
	    
    }//end containers
    
    function updateElements(data){
      function fadeInNew(selection,data,parent,fade,child,selector){
	if(selection){
	  var oldData=selection.data();
	  for(var i=0;i<data.length;i++){
	    var j=oldData.indexOf(data[i]);
	    if(j!=-1){
	      j=selection[0][j];
	      if(j.move)j.move();
	      parent.appendChild(j);
	    }else{
	      fade.appendChild(child(data[i]))
	    }
	  }	
	}else{
	  for(var i=0;i<data.length;i++){
	      fade.appendChild(child(data[i]));
	  }
       }
      return d3.select(parent).selectAll(selector);
      }//end fadeInNew
    
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
      
      events=data.nodes;
      earliest=Math.min(earliest,data.earliest);
      latest=Math.max(latest,data.latest);
      
      resetDomains();
      fadeOld();
      buildContainers();
      
      eventLinks=filterLinks(data.links); 
      links=fadeInNew(links,eventLinks,gLinks,fadeLinks,link,"line.link"); 
  
      nodes=fadeInNew(nodes,data.nodes,exist[0][0],fade[0][0],event,"div.event");
   
      resetZoom();
      
    }//end updateELements
    function fadeOld(){
      if(exist){
	exist.transition().duration(outTime).style("opacity",0).each("end",function(){d3.select(this).remove()})
	d3.select(gLinks).transition().duration(outTime).style("opacity",0).each("end",function(){d3.select(this).remove()})
	d3.select(gNodes).transition().duration(outTime).style("opacity",0).each("end",function(){d3.select(this).remove()})
      }
    }//end fadeOld
    function filterElements(filter){
      function moveFiltered(selection,existing,parent,fade,filter){
	var filtered=[];
	selection.filter(filter).each(function(d,i){
	  if(existing.indexOf(d)!=-1){
	    if(this.move)this.move();
	    parent.appendChild(this);
	  }else{
	    if(this.move)this.fadeMove();
	    fade.appendChild(this);
	  }
	  filtered.push(d);
	});
       return filtered;
      }//end moveFiltered
      
      fadeOld();
      buildContainers();   
  
      events=moveFiltered(nodes,events,exist[0][0],fade[0][0],filter);
      eventLinks=moveFiltered(links,eventLinks,gLinks,fadeLinks,function(d,i){return events.indexOf(d.target)!=-1&&events.indexOf(d.source)!=-1});
      return {nodes:events,links:eventLinks,earliest:earliest,latest:latest};
    }//end filterElements
    
    back.domain=function(x){
      xDraw.domain(x)
    }
    
    back.range=function(x){
      xDraw.range(x);
      back.style("width",x[1]);
    }
    
    back.invert=function(x){
      return xDraw.invert(x);
    }
    
    back.redraw=function placeElements(){
      begin = xDraw.domain()[0].getTime();

      var left,top,width;
      if(nodes){
	nodes.each(function(d,i){
	  width=xDraw(begin+d.duration);
	  left=xDraw(d.startTime);
	  top=stripPos(d.y);
	  this.style.width=width-markerWidth;
	  this.style.left=left;
	  this.style.top=top;
	  this.box.setAttribute("x",left);
	  this.box.setAttribute("width",width);
	  this.box.setAttribute("y",top);
      });
      }
      if(links){
	links.each(function(d,i){
	  this.setAttribute("x1",xDraw(d.source.startTime));
	  this.setAttribute("x2",xDraw(d.target.startTime));
	  this.setAttribute("y1",stripPos(d.source.y));
	  this.setAttribute("y2",stripPos(d.target.y));
	});
      }
    }//end redraw
	
	back.padding=function(x){
	  backSvg.attr("transform","translate("+x[0]+")");
	  
	}
    
    back.updateElements=updateElements;
    back.filterElements=filterElements;
    return back;
  }//end viewport

   function resetDomains(){
    x0.domain([earliest,latest]);
    port.domain([earliest,latest]);
    xAxis.domain([port.invert(-padding[0]),port.invert(paddedWidth+padding[1])]);
   }//end moveFiltered
   
   function resetZoom(){
    zoom.scale(1);
    lastScale=1;
    zoom.translate([0,0]);
    stripHeight=stripPos(strip.getHeight()+1);
	port.style({top:0,height:stripHeight,width:(paddedWidth)*lastScale});
    zoom.scaleExtent([1,maxScale(x0.domain())]);
    gAxis.call(axis);
   }

  function link(d){
   var out = document.createElementNS(svg,"line");
   out.__data__=d;
   out.setAttribute("class","link");
   d.line=out;
   return out;
  }//end link   
   
  function event(d){
    var out = document.createElement("div");
    out.setAttribute("class","event");
    out.__data__=d;
    out.box = document.createElementNS(svg,"rect");
    out.box.setAttribute("class","event");
    out.box.setAttribute("height",lineHeight);
    fadeNodes.appendChild(out.box);
    out.appendChild(document.createTextNode(d.label));
    out.move=function(){
      gNodes.appendChild(out.box);
    }
    out.fadeMove=function(){
      fadeNodes.appendChild(out.box);
    }
    out.addEventListener("click",click)
    out.addEventListener("dblclick",dblclick);
    out.addEventListener("touchstart",handleTouch);
    out.addEventListener("mouseover",highlightLinks);
    d.box=out.box;

    function handleTouch(){
      this.addEventListener("touchend",touchEnd);
    }
    
    function touchEnd(){
      if(this.touchTime&&((new Date())-this.touchTime)<1000){
          dblclick.bind(this)();
        }else{
          click.bind(this)();
        }
        if(highlightedEvent)unhighlightLinks.bind(highlightedEvent)();
        highlightedEvent=this;
        highlightLinks.bind(this)();
        this.touchTime=new Date();
        this.addEventListener("touchmove",function(){
          console.info("i have moved!!!!!!!");
          this.removeEventListener("touchend",touchEnd)
        })
    }
    function click(){
      dispatch.select({ticket:this.__data__});
    }
    function dblclick(){
      console.info("please focus on: "+this.__data__.label);
    }
    function highlightLinks(){
      this.box.setAttribute("class","eventHi");
      var links = this.__data__.links;
      var n=links.length,i;
      for(i=0;i<n;i++){
        if(links[i].line)links[i].line.setAttribute("class","linkHi");
      }
      links=this.__data__.dependencies
      n=links.length;
      for(i=0;i<n;i++){
        if(links[i].box)links[i].box.setAttribute("class","eventHi");
      }
      links=this.__data__.prereqs
      n=links.length;
      for(i=0;i<n;i++){
       if(links[i].box)links[i].box.setAttribute("class","eventHi");
      }
      
      this.addEventListener("mouseout",unhighlightLinks)
    }
    function unhighlightLinks(){
      this.box.setAttribute("class","event");
      var links = this.__data__.links;
      var n=links.length,i;
      for(var i=0;i<n;i++){
        if(links[i].line)links[i].line.setAttribute("class","link");
      }
            links=this.__data__.dependencies
      n=links.length;
      for(i=0;i<n;i++){
        if(links[i].box)links[i].box.setAttribute("class","event");
      }
      links=this.__data__.prereqs
      n=links.length;
      for(i=0;i<n;i++){
        if(links[i].box)links[i].box.setAttribute("class","event");
      }
      this.removeEventListener(unhighlightLinks);
    }
    
    return out;
  }//end event


    

  
  function maxScale(dom){
    return ((dom[1]-dom[0])/10)/(3600*24000);
  } 

	var strip;
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
		strip.add(data.nodes);
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

  function stripPos(i){
    return i*(lineHeight+lineSpacer);
  }
  var begin;
  var stripHeight=0;
  
  initViewer();
  
  timeline.redraw=port.placeElements;

  timeline.add=function(data){
    if(!strip)strip = d3.layout.stripPacker([],data.earliest,data.latest);
    packGraphs(data);
    port.updateElements(data);
    port.redraw();
    return timeline;
  }
  
  timeline.set=function(data,clear){
    if(clear)strip = d3.layout.stripPacker([],data.earliest,data.latest);
    packGraphs(function(){
      if(!clear){
        var newNodes=[]; 
        var nodes=data.nodes; 
        for(x in nodes){
          if(nodes[x].y==undefined)newNodes.push(nodes[x])
        }
        return {nodes:newNodes,links:data.links};
      }else{
         return data;
      }
    }());
    port.updateElements(data);
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
      return filterElements(function(){return true})
    }else{
      return filterElements(x);
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
  
  
  function handleZoom(t,s){
    if(t==undefined){
      t = d3.event.translate;
      s = d3.event.scale;
    }
	  
    begin = data.earliest;

    
    //t[0]=Math.max(Math.min(padding[0],t[0]),paddedWidth+padding[0]-(paddedWidth)*s);
    //t[1]=stripHeight>height?Math.max(Math.min(0,t[1]),height-stripHeight):0;
    
    checkTranslation(t,s);
    
    drawDomain(t,s);
    axisDomain(t,s);
    if(s!=lastScale){
      t[1]=lastTrans[1];
      lastScale=s;
    }
    port.redraw();
    port.style({top:t[1]});

    lastTrans=t;
    zoom.translate(t);
    
	  gAxis.call(axis);	
	}
	
  function checkTranslation(t,s){
    t[1]=stripHeight>height?Math.max(Math.min(0,t[1]),height-stripHeight):0;
    t[0]=Math.max(Math.min(0,t[0]),paddedWidth-(paddedWidth)*s);
  }
  
  function axisDomain(t,s){
    xAxis.domain([port.invert(-padding[0]),port.invert(paddedWidth+padding[1])])
  };
  
  function drawDomain(t,s){
    port.domain([x0.invert(-t[0]/s),x0.invert((paddedWidth-t[0])/s)]);
  }
  	
  function handlePadding(dx){
    paddedWidth=screenWidth-padding[0]-padding[1];
    port.range([0,paddedWidth]);
    x0.range([0,paddedWidth]);
	checkTranslation(lastTrans,lastScale);
    if(earliest) axisDomain(lastTrans,lastScale);
    port.padding(padding);
     port.style({left:padding[0],top:lastTrans[1]})
	 port.redraw();
    

	 gAxis.call(axis);
	 
  }
		
  

  return d3.rebind(timeline, dispatch, "on");

}