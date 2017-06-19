ns="http://www.w3.org/2000/svg";
w=1000;
h=600;

function getData() {
		var qs="[[Category:Unresolved tickets]]|?Date created|?Date resolved|?Date required|?Ticket components";
        return parseData(smwAsk(qs));
}



function getPageDiv(page, oldid) {
	var ask = page + '?action=render' + (oldid > 0 ? '&oldid=' + oldid : "");
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", ask, false );
    xmlHttp.send( null );
	var out = document.createElement("div");
	out.innerHTML=xmlHttp.responseText
    return out;
}

function smwAsk(query) {
    var ask = 'https://intranet.fungalgenomics.ca/intwiki/api.php?action=ask&query=' + query + '|limit=5000&format=json';
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", ask, false );
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}


function parseData(data) {

				var keys = Object.keys(data.query.results)
				var nodes=[];
				var links=[];
				var items=[];
				var itemMap=[];
				for(x in data.query.results){
					item=data.query.results[x]
					items.push(item);
					item.prereqs=[];
					item.dependencies=[];
					item.label=item.fulltext.substr(7);
					itemMap[item.fulltext]=item;
				}
				var item,otherItem;
				var elm;
				var type;
				
				

				linkTypes=['endangers', 'helps', 'links', 'causes', 'requires'];
				for(var i=0;i<items.length;i++){
					item=items[i];
					nodes.push(item);
					
					comps=item.printouts["Ticket components"];
						for(var j=0;j<comps.length;j++){
							if((otherItem=itemMap[comps[j].fulltext])!=undefined){
								links.push({source:item,target:otherItem});
								item.prereqs.push(otherItem);
								otherItem.dependencies.push(item);
							}
						}
				}
				return {"nodes":nodes,"links":links};
}

function redrawNodes(){
	node.attr("transform", function(d) { return "translate(".concat(d.x).concat(",").concat(d.y).concat(")"); });
};

function redrawLinks(){
	link.attr("x1",function(d){return d.source.x;})
	.attr("y1",function(d){return d.source.y;})
	.attr("x2",function(d){return d.target.x;})
	.attr("y2",function(d){return d.target.y;});
};




viz=d3.select("#graph").append("svg:svg").attr("width",w).attr("height",h).style("display","inline").attr("onmousedown","dragTimeStart(this,event)");
brushbox=viz.append("svg:g");
cont=d3.select("#contents").append("div").attr("width",200).attr("height",h).style("display","inline");
//var mds = d3.layout.force().gravity(0.1).charge(-120).size([w, h]);
var x,dx;
function dragTimeStart(elm,event){
	x=event.clientX;
	elm.setAttribute("onmousemove","dragTimeMove(this,event)");
	elm.setAttribute("onmouseup","dragTimeEnd(this)");
}

function dragTimeEnd(elm){
	elm.removeAttribute("onmousemove");
	elm.removeAttribute("onmouseup");	
}

function dragTimeMove(elm,event){
	dx=event.clientX-x;
	x=event.clientX;
	mds.shiftTime(dx);
}
			
picky=getData();
span=d3.extent(picky.nodes,function(d){return d.printouts["Date created"]})
earliest=span[0]*1000;
latest=span[1]*1000;




link=viz.selectAll("line.link").data(picky.links).enter().append("svg:line").attr("stroke-width","1").attr("stroke","black");
links=[];
link.each(function(d,i){
	links.push(link.filter(function(dd,ii){return ii==i?true:false}));
});
boxHeight=10

node=viz.selectAll("g.node").data(picky.nodes).enter().append("svg:g").attr("stroke-width","1").attr("stroke","black").attr("fill","silver")
.attr("onmousedown",function(d){return "downNode(this,\""+d.fullurl+"\")"});

nodeBox=node.append("svg:rect").attr("height",boxHeight).attr("x","0").attr("y","0");

//first calc the time durations of everything
//then reposition everything so that events can only
//occur after their dependencies have finished
//neighbors=mds.neighbors();
ordered = [];
node.each(function(d,i){
	var req;
	d.startTime=d.printouts["Date created"]*1000;
	ordered.push(false);
	//calc time required in milliseconds
	if((req=d.printouts["Date required"]).length){
		d.duration=(req*1000-d.startTime);
	}else{
		//if none exists fake it based on string length -> one day per character
		d.duration=d.label.length*3600*24*1000*7*Math.random();
	}
	latest=Math.max(d.startTime+d.duration,latest);
});

n = node[0].length;

node.each(function(d,i){
	placeAfterReqs(d);
	
});

function placeAfterReqs(d){
	var reqs=d.prereqs;
	for(var j=0;j<reqs.length;j++){
		if(!ordered[reqs[j].index]){
				placeAfterReqs(reqs[j]);
		}
		d.startTime=Math.max(reqs[j].startTime+reqs[j].duration,d.startTime);
		latest=Math.max(d.startTime+d.duration,latest);
	}
	ordered[d.index]=true;
}






time = d3.time.scale().domain(
[new Date(earliest),new Date(latest)
]).range([0,w]);

var brush = d3.svg.brush()
    .x(time)
    .on("brush", brush);


node.each(function(d){d.x=time(d.startTime);});
nodeBox.attr("width",function(d,i){return nodeWidth(d)})

node.attr("onmouseover","highlightNode(this)").attr("onmouseout","unhighlightNode(this)");

function nodeWidth(d){
	return time(earliest+d.duration);
}

var mds = d3.layout.mdsTimeSpanner().size([w, h]).padding([0,25,0,10]).nodes(picky.nodes).links(picky.links).timescale(time).start();

node.call(mds.drag);

t_axis=d3.svg.axis().scale(time).orient("bottom");

axis = viz.append("svg:g").call(t_axis);



mds.on("tick",function() {
	//node.each(function(d){d.x=time(d.startTime);});
	console.info("hi");
	redrawNodes();	
	redrawLinks();
	//redrawLabels();
  });

mds.on("range",function(){
	console.info("howdy");
	axis.remove();
	axis = viz.append("svg:g").call(t_axis);
	nodeBox.attr("width",function(d,i){return nodeWidth(d)})
	//console.info("range changed!");
	redrawNodes();	
	redrawLinks();
})



//for(var i=0;i<picky.nodes.length;i++){
	//picky.nodes[i].weight=1/(picky.nodes[i].weight*picky.nodes[i].weight);
//}

function highlightNode(viz){
	viz.setAttribute("stroke","deepskyblue");
	var lines=viz.__data__.links;
	for(var i=0;i<lines.length;i++){
		links[lines[i].index].transition().duration(100).attr("stroke","#00BFFF")
	}
}
function unhighlightNode(viz){
	viz.setAttribute("stroke","black");
	var lines=viz.__data__.links;
	for(var i=0;i<lines.length;i++){
		links[lines[i].index].transition().duration(100).attr("stroke","#000000")
	}
}

function downNode(viz,name){
	viz.setAttribute("onmouseup","loadPage(this,\""+name+"\")");
	viz.setAttribute("onmousemove","dontLoadPage(this)");
}

function dontLoadPage(viz){
	viz.removeAttribute("onmouseup");
	viz.removeAttribute("onmousemove");
}

function loadPage(viz,name){
	dontLoadPage(viz);
	if(contentsPanel.firstChild!=null){
		contentsPanel.replaceChild(getPageDiv(name),contentsPanel.firstChild)
	}else{
		contentsPanel.appendChild(getPageDiv(name));
	}
}

filterVisible=function(string){

var nodes = [];
var lines;
node.each(function(d,i){
	//console.info(d);
	if(d.label.toLowerCase().indexOf(string)==-1){
				this.setAttribute("style","display:none");
				lines=d.links;				
				for(var i=0;i<lines.length;i++){
					if(picky.links[lines[i].index].source.label.toLowerCase().indexOf(string)==-1||picky.links[lines[i].index].target.label.toLowerCase().indexOf(string)==-1)links[lines[i].index].style("display","none");
				}
	}else{
		nodes.push(d);
		this.removeAttribute("style");
		lines=d.links;
		for(var i=0;i<lines.length;i++){
			if(picky.links[lines[i].index].source.label.toLowerCase().indexOf(string)!=-1&&picky.links[lines[i].index].target.label.toLowerCase().indexOf(string)!=-1)links[lines[i].index].style("display","inline");
		}
	}
})
return nodes;
};

brushbox.call(brush).selectAll("rect").attr("x",0).attr("y","0").attr("height",h).attr("fill-opacity",0.125).style("shape-rendering","crispEdges").style("stroke","#ffffff")

function brush(){
	console.info("brushing")

}

filter=function(elm){
	mds.nodes(filterVisible(elm.value.toLowerCase()));
}

