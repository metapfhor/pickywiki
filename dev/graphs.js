function buildGraphs(nodes,links){
	function consolidateGraph(link){
		function updateTime(graph,node){
			if(node.startTime<graph.startTime){
				graph.startTime=node.startTime;
				graph.duration+=(graph.startTime-node.startTime);
			}
			if((node.endTime)>(graph.startTime+graph.duration)){
				graph.duration=node.endTime-graph.startTime;
			}
		}
		var a=link.source.graph,b=link.target.graph;
		if(b.length==1){
			a.nodes.push(link.target);
			a.links.push(link);
			link.target.graph=a;
			updateTime(a,link.target);
			delete b;
			return a;
		}else{
			b.nodes.push(link.source);
			b.links.push(link);
			link.source.graph=b;
			updateTime(b,link.source);
			delete a;
			return b;
		}
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
		consolidateGraph(links[i]);
	}
	return graphs.sort(function(a,b){
		return b.duration-a.duration;
	 });
}

function packGraphs(data){
	var graphs = buildGraphs(data.nodes,data.links);
	var strip = d3.layout.stripPacker([],data.earliest,data.latest);
	var g,n=graphs.length;
	for(var i=0;i<n;i++){
		if((g=graphs[i]).nodes.length>1){
			d3.layout.quickMDS(g.nodes,g.links,0.05);
			g.nodes.sort(function(a,b){return a-b;});
			strip.add(g.nodes);
			strip.addLinks(g.links);
		}else{
			strip.add(g.nodes);		
		}
	}
}

