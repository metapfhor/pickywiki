function ganttContext(viz,focus){
	
	function redrawNodes(){
		node.attr("transform", function(d) { return "translate(".concat(horizontalScale(d.x)).concat(",").concat(verticalScale(d.y)).concat(")"); });

	};

	function redrawLinks(){
		link.attr("x1",function(d){return horizontalScale(d.source.x);})
		.attr("y1",function(d){return verticalScale(d.source.y);})
		.attr("x2",function(d){return horizontalScale(d.target.x);})
		.attr("y2",function(d){return verticalScale(d.target.y);});
	};
	var scope=focus.scope();
	var early=scope[0].getTime();
	function nodeWidth(d){
		return time(data.earliest+d.duration);
	}
	function refocus(){
		focus.timedomain(brush.extent());
		focus.resume();
	}

	function drawBrush(){
		brushBox = brushGroup.call(brush).selectAll("rect").attr("height",viz.attr("height")).attr("fill-opacity",0.3).style("shape-rendering","crispEdges").style("stroke","#ffffff")
	}

	var context = {},event = d3.dispatch("start","tick","domain","end");

	var verticalScale=d3.scale.linear().domain([0,focus.size()[1]]).range([0,viz.attr("height")]);
	console.info(focus.time(scope[1]));
	var horizontalScale=d3.scale.linear().domain([focus.time(scope[0]),focus.time(scope[1])]).range([0,viz.attr("width")]);
	//edge lines
	var link=viz.selectAll("line.link").data(data.links).enter().append("svg:line").attr("stroke-width","1").attr("stroke","black");
	var links=[];
	link.each(function(d,i){
		links.push(link.filter(function(dd,ii){return ii==i?true:false}));
	});
	var boxHeight=3

	var node=viz.selectAll("g.node").data(data.nodes).enter().append("svg:g").attr("stroke-width","1").attr("stroke","black").attr("fill","silver")
	.attr("onmousedown",function(d){return "downNode(this,\""+d.fullurl+"\")"});

	var nodeBox=node.append("svg:rect").attr("height",boxHeight).attr("x","0").attr("y","0");
	var brushGroup=viz.append("svg:g");
	var time = d3.time.scale().domain(scope).range([0,viz.attr("width")]);

	var brush = d3.svg.brush().x(time).on("brush", refocus);
	brush.extent(focus.timedomain());
	drawBrush();
	nodeBox.attr("width",function(d,i){return nodeWidth(d)})

	var t_axis=d3.svg.axis().scale(time).orient("bottom");

	var axis = viz.append("svg:g").call(t_axis);

	focus.on("tick",function() {
		redrawNodes();	
		redrawLinks();
		event.tick({type:"tick"});
	});

	focus.on("dragged",function(){
		axis.remove();
		scope=focus.scope();
		early=scope[0].getTime();
		console.info(scope[1]);
		horizontalScale.domain([focus.time(scope[0]),focus.time(scope[1])])
		axis = viz.append("svg:g").call(t_axis.scale(time.domain(scope)));
		drawBrush();
		nodeBox.attr("width",function(d,i){return horizontalScale(focus.time(early+d.duration))});
		console.info("dragged!");
		redrawNodes();	
		redrawLinks();
	})
	
	focus.on("domain",function(){
	//console.info("rebrush");
	brush.extent(focus.timedomain());
	drawBrush();
	horizontalScale.domain([focus.time(scope[0]),focus.time(scope[1])])

	})


	return d3.rebind(context, event, "on");
};





