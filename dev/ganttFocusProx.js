

function ganttFocus(viz,data){
	function redrawNodes(){
		node.attr("transform", function(d) { return "translate(".concat(d.x).concat(",").concat(d.y).concat(")"); });
	};

	function redrawLinks(){
		link.attr("x1",function(d){return d.source.x;})
		.attr("y1",function(d){return d.source.y;})
		.attr("x2",function(d){return d.target.x;})
		.attr("y2",function(d){return d.target.y;});
	};
	var x,dx;
	dragTimeStart = function(elm,event){
		x=event.clientX;
		elm.setAttribute("onmousemove","dragTimeMove(this,event)");
		elm.setAttribute("onmouseup","dragTimeEnd(this)");
	}

	dragTimeEnd = function(elm){
		elm.removeAttribute("onmousemove");
		elm.removeAttribute("onmouseup");	
	}



	bigText = function(i){
		data.nodes[i].fixed=2;
		nodeLabels[i].transition().duration(400).attr("transform","scale(0.32)")
	}

	smallText = function(i){
		nodeLabels[i].transition().delay(200).duration(400).attr("transform","scale(0.1)").each("end",function(d,i){data.nodes[i].fixed=0;})
	}



	function rescaleNodeBoxes(){
		nodeBox.attr("width",function(d,i){return d.width});
	}

	highlightNode = function (viz){
		//viz.setAttribute("stroke","deepskyblue");
		var lines=viz.__data__.links;
		for(var i=0;i<lines.length;i++){
			links[lines[i].index].transition().duration(100).attr("stroke","#00BFFF")
		}
	}
	unhighlightNode = function(viz){
		//viz.setAttribute("stroke","black");
		var lines=viz.__data__.links;
		for(var i=0;i<lines.length;i++){
			links[lines[i].index].transition().duration(100).attr("stroke","#000000")
		}
	}

	downNode = function(viz,name){
		viz.setAttribute("onmouseup","loadPage(this,\""+name+"\")");
		viz.setAttribute("onmousemove","dontLoadPage(this)");
	}

	dontLoadPage = function (viz){
		viz.removeAttribute("onmouseup");
		viz.removeAttribute("onmousemove");
	}

	loadPage = function (viz,name){
		dontLoadPage(viz);
		if(contentsPanel.firstChild!=null){
			contentsPanel.replaceChild(getPageDiv(name),contentsPanel.firstChild)
		}else{
			contentsPanel.appendChild(getPageDiv(name));
		}
	}

	function filterVisible(string){

	var nodes = [];
	var lines;
	node.each(function(d,i){
		//console.info(d);
		if(d.label.toLowerCase().indexOf(string)==-1){
					this.setAttribute("style","display:none");
					lines=d.links;				
					for(var i=0;i<lines.length;i++){
						if(data.links[lines[i].index].source.label.toLowerCase().indexOf(string)==-1||data.links[lines[i].index].target.label.toLowerCase().indexOf(string)==-1)links[lines[i].index].style("display","none");
					}
		}else{
			nodes.push(d);
			this.removeAttribute("style");
			lines=d.links;
			for(var i=0;i<lines.length;i++){
				if(data.links[lines[i].index].source.label.toLowerCase().indexOf(string)!=-1&&data.links[lines[i].index].target.label.toLowerCase().indexOf(string)!=-1)links[lines[i].index].style("display","inline");
			}
		}
	})
	return nodes;
	};

	

	var focus = {},event = d3.dispatch("start","tick","domain","dragged","end");

	//background rect for dragging
	zoom = d3.behavior.zoom().scaleExtent([1,10]).on("zoom",semanticZoom);
	//viz.append("svg:rect").attr("x","0").attr("y","0").attr("width",viz.attr("width")).attr("height",viz.attr("height")).attr("fill-opacity","1").attr("fill","green").attr("onmousedown","dragTimeStart(this,event)");
	viz.append("svg:rect").attr("x","0").attr("y","0").attr("width",viz.attr("width")).attr("height",viz.attr("height")).attr("fill-opacity","0").attr("fill","green")
    .call(zoom).append("svg:g");
	
	var lastScale=1,lastX;
	function semanticZoom(){
		if(lastX!==undefined){console.info([(lastX-d3.event.translate[0]),d3.event.scale])}else{console.info(d3.event.translate[0])};
		panner.attr("transform","translate(0,"+d3.event.translate[1]+")");
		if(lastScale!=d3.event.scale){
			//zoom Y
			mds.toScreenY.range([0,h*d3.event.scale]);
		}else{
			//dragging time
			if(lastX!==undefined){
				console.info(d3.event.translate[1]);
				mds.shiftTime(d3.event.translate[0]-lastX);
				
			}
		}
		lastX=d3.event.translate[0];
		lastY=d3.event.translate[1];
		lastScale=d3.event.scale;
	}
	var panner = viz.append("svg:g").attr("transform","translate(0,0)");
	//edge lines
	var link=panner.selectAll("line.link").data(data.links).enter().append("svg:line").attr("stroke-width","1").attr("stroke","black");
	var links=[];
	link.each(function(d,i){
		links.push(link.filter(function(dd,ii){return ii==i?true:false}));
	});
	var boxHeight=10
	

    var node=panner.selectAll("g.node").data(data.nodes).enter().append("svg:g").attr("fill","silver")//.attr("stroke-width","1").attr("stroke","black")
	.attr("onmousedown",function(d){return "downNode(this,\""+d.fullurl+"\")"});

	node.each(function(d,i){d.viz=this});

	var nodeBox=node.append("svg:rect").attr("height",boxHeight).attr("x","0").attr("y","0").attr("fill-opacity","0.7");

	var nodeLabel=node.append("svg:g");

	var nodeTextBox=nodeLabel.append("svg:g");

	var nodeText=nodeTextBox.append("svg:text").text(function(d,i){return d.label}).attr("x","0").attr("y","10")
	.style("font-size","120px").attr("stroke-width","0").attr("fill","black");

	var nodeLabels=[];

	nodeText.each(function(d,i){
		this.setAttribute("y",this.getBBox().height/4);
	});

	nodeTextBox.each(function(d,i){
		this.setAttribute("transform","scale(0.1)")
		nodeLabels.push(d3.select(this));
	});

	nodeLabel.each(function(d,i){
		this.setAttribute("transform","translate(0,"+boxHeight/2+")");
	});

	


	var time = d3.time.scale().domain([new Date(data.earliest),new Date(data.latest)]).range([0,w]);

	var mds = d3.layout.mdsGantt().size([w, h]).padding([0,25,0,10]).nodes(data.nodes).links(data.links).timedomain([new Date(data.earliest),new Date(data.latest)]).start();

	node.each(function(d){d.x=time(d.startTime);});

	rescaleNodeBoxes();

	node.attr("onmouseover","highlightNode(this)").attr("onmouseout","unhighlightNode(this)");

	nodeLabel.attr("onmouseover",function(d,i){return "bigText("+i+")"})

	nodeLabel.attr("onmouseout",function(d,i){return "smallText("+i+")"})



	node.call(mds.drag);

	var t_axis=d3.svg.axis().scale(time).orient("bottom");

	var axis = viz.append("svg:g").call(t_axis);

	mds.on("tick",function() {
		redrawNodes();	
		redrawLinks();
		event.tick({type:"tick"});
	});

	mds.on("domain",function(){
		//console.info("re-domain");
		axis.remove();
		t_axis.scale(mds.time())
		axis = viz.append("svg:g").call(t_axis);
		//console.info("range changed!");
		rescaleNodeBoxes();
		redrawNodes();	
		redrawLinks();
		event.domain({type:"domain"});
	})
	mds.on("dragged",function(){
		event.dragged({type:"dragged"})
	})

	focus.filter = function(string){
		mds.nodes(filterVisible(string));
		return focus;
	}
	focus.nodes = function() {
      return mds.nodes();
    };
	focus.scope = function(){
		return mds.scope();
	}
    focus.size = function(x) {
      if (!arguments.length) return mds.size();
      return mds;
    };
	focus.time = function(x){
		if (!arguments.length) return time;
		return mds.time(x);
	}
	focus.timedomain = function(x){
		if (!arguments.length) return mds.timedomain();
		rescaleNodeBoxes();
		return mds.timedomain(x);

		
	}
	focus.resume = function(){
		mds.resume();
	}

	return d3.rebind(focus, event, "on");
};





