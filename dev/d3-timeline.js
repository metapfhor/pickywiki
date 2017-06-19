(d3.timeline = function(data,viz){
	var timeline = {};
	var lineHeight = 10;
	var lineSpacer =1;
	var width = viz[0][0].offsetWidth;
	var height = viz[0][0].offsetHeight;
	var formatNumber = d3.format(".1f");
	var spacer = 15;
	var zoomHeight = Math.min(80,height);
	
	//begin axis stuff
	var x = d3.time.scale()
		.domain([data.earliest,data.latest])
		.range([0, width]);
	time=x;

	var axis = d3.svg.axis()
		.scale(x)
		.tickSize(height-15, 0)
		.orient("bottom");

	var svg = viz.append("svg:svg")
		.attr("width", width)
		.attr("height", height)
		.append("svg:g")

	var back = svg.append("svg:g");
	var drag = d3.behavior.drag().on("drag",panTime);
	back.append("svg:rect").attr({"width":width,"height":height,"fill-opacity":0})

	var links=back.selectAll("line.link").data(data.links).enter().append("svg:line").attr("stroke-width","1").attr("stroke","black");

	var nodes=back.selectAll("rect.node").data(data.nodes).enter().append("svg:rect").attr("fill","blue").attr("fill-opacity","0.8");
	nodes.attr("height",lineHeight);
	nodes.append("svg:title").text(function(d){return d.label});
	var markers=back.selectAll("rect.node").data(data.nodes).enter().append("svg:rect").attr("fill","black").attr("fill-opacity","0.8");
	markers.attr({"height":lineHeight,"width":1});

	//back.call(drag);
	function maxScale(dom){
		//return ((dom[1]-dom[0])/axis.ticks()[0])/(3600*24000);
		return ((dom[1]-dom[0])/10)/(3600*24000);
	}

	function panTime(){
		var dom =x.domain();	
		//console.info(d3.event.dx);	
		var dt = x.invert(-d3.event.dx).getTime();
		x.domain([new Date(dt),new Date(dom[1].getTime()-dom[0].getTime()+dt)]);
		checkTrans(x.domain());
	}



	var lastDom = x.domain();
	var zoom = d3.behavior.zoom().scaleExtent([1,maxScale(lastDom)]).x(x).on("zoom",updateAxis);
	var lastScale = zoom.scale();
	var  lastTranslate = zoom.translate();

	
	var gAxis = svg.append("svg:g").attr("class", "x axis");
	gAxis.call(axis)
		

	svg.call(zoom);

	function updateAxis(){
		
		var dom = x.domain();

		if(d3.event.scale&&d3.event.scale!=lastScale){
			checkZoom(dom);
		}else{
			checkTrans(dom);
			 console.info("translation");
			 //redraw();
		}
		lastScale=zoom.scale();
		lastTranslate=zoom.translate();
	}
	function checkZoom(dom){
		dom=[Math.max(data.earliest,dom[0]),Math.min(data.latest,dom[1])];
		x.domain(dom);
		zoom.x(x);
		zoom.scaleExtent([0,maxScale(dom)]);
		gAxis.transition()
	    .duration(0)
	    .call(axis);

		redraw();

	}
	function checkTrans(dom){
		if(dom[0]<data.earliest||dom[1]>data.latest){
			x.domain(lastDom);
			zoom.x(x);
		}else{

			gAxis.call(axis);
			redraw();
		}
	}
	function redraw(){
	  gAxis.call(axis);
		lastDom=x.domain();
		begin = x.domain()[0].getTime();
		nodes.each(function(d,i){
			this.setAttribute("width",x(begin+d.duration));
			this.setAttribute("x",x(d.startTime));
		});
		markers.each(function(d,i){
			this.setAttribute("x",x(d.startTime));
		})
		links.each(function(d,i){
			this.setAttribute("x1",x(d.source.startTime));
			this.setAttribute("x2",x(d.target.startTime));
		});
	}
	//end axis stuff	

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
			}
			function addNode(node){
				a.nodes.push(node);
				node.graph=a;
				updateTime(a,node);
			}
			function addLink(link){
				//console.info(link);
				a.links.push(link);		
			}
			var a=link.source.graph,b=link.target.graph;
			//b->a
			b.nodes.forEach(addNode);
			a.links.push(link);
			b.links.forEach(addLink);
			return b;
		}
		var graphs=[],g,n=nodes.length,o;
		for(var i=0;i<n;i++){
			o=nodes[i];
			g=(o.graph={});
			g.nodes=[nodes[i]];
			g.links=[];
			g.startTime=o.startTime;
			g.duration=o.duration;
			graphs.push(g);
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
		var graphs = buildGraphs(data.nodes,data.links);
		var strip = d3.layout.stripPacker([],data.earliest,data.latest);
		var g,n=graphs.length;
		console.info(n);
		for(var i=0;i<n;i++){
			if((g=graphs[i]).nodes.length>1){
				//d3.layout.quickMDS(g.nodes,g.links,0.0005);
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
	var linkAttr={x1:function(d){return x(d.source.startTime);},
			y1:function(d){return stripPos(d.source.y);},
			x2:function(d){return x(d.target.startTime);},
			y2:function(d){return stripPos(d.target.y);}
	};
	var markerAttr = {x:function(d){return x(d.startTime);},
						y:function(d){return stripPos(d.y);}
	};
	var nodeAttr = {width:function(d){return x(begin+d.duration);},
				x:function(d){return x(d.startTime);},
				y:function(d){return stripPos(d.y);}
	};
	function draw(){
		begin = x.domain()[0].getTime();
		//nodes.attr(nodeAttr);
		nodes.each(function(d,i){
			this.setAttribute("width",x(begin+d.duration));
			this.setAttribute("x",x(d.startTime));
			this.setAttribute("y",stripPos(d.y));
		});
		markers.each(function(d,i){
			this.setAttribute("x",x(d.startTime));
			this.setAttribute("y",stripPos(d.y));
		})
		//links.attr(linkAttr);
		links.each(function(d,i){
			this.setAttribute("x1",x(d.source.startTime));
			this.setAttribute("y1",stripPos(d.source.y));
			this.setAttribute("x2",x(d.target.startTime));
			this.setAttribute("y2",stripPos(d.target.y));
		});
			 
	}

	
	
	packGraphs(data);

	draw();

	return timeline;

})();



