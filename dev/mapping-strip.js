ns="http://www.w3.org/2000/svg";
w=1000;
h=600;

function getData() {
		var qs="[[Category:Ticket tracker]]|?Date created|?Date resolved|?Date required|?Ticket components";
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
					item.label=item.fulltext.replace("Ticket:","");
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

function prepareData(){
	var data=getData();

	data.earliest=d3.min(data.nodes,function(d){return d.printouts["Date created"]})*1000;

	data.latest=d3.max(data.nodes,function(d){return d.printouts["Date created"]})*1000;

	var n=data.nodes.length,req,ordered = [];

	for(var i=0;i<n;i++){
		d=data.nodes[i]
		d.startTime=d.printouts["Date created"]*1000;
		ordered[i]=false;
		//calc time required in milliseconds
		if((req=d.printouts["Date required"]).length){
			d.duration=(req*1000-d.startTime);
		}else{
			//if none exists fake it based on string length -> one weekish per character
			d.duration=d.label.length*3600*24*1000*3;
		}
		data.latest=Math.max(d.startTime+d.duration,data.latest);
	}
	var o;
	for(var i=0;i<n;i++){
		placeAfterReqs((o=data.nodes[i]));
		
	}	

	for(var i=0;i<n;i++){
		o=data.nodes[i];
		o.endTime=o.startTime+o.duration;
		o.height=10;
	}

	function placeAfterReqs(d){
		var reqs=d.prereqs;
		for(var j=0;j<reqs.length;j++){
			if(!ordered[reqs[j].index]){
					placeAfterReqs(reqs[j]);
			}
			d.startTime=Math.max(reqs[j].startTime+reqs[j].duration,d.startTime);
	
			data.latest=Math.max(d.startTime+d.duration,data.latest);
			
		}
		ordered[d.index]=true;
	}

	return data;
};


var data = prepareData();

strip = d3.layout.stripPacker(data.nodes,data.earliest,data.latest);

viz=d3.select("#graph").append("svg:svg").attr("width",w).attr("height",h).style("display","inline");
d3.select("#graph").append("br");
time=d3.time.scale().domain([data.earliest,data.latest]).range([0,w]);
node=viz.selectAll("rect.node").data(data.nodes).enter().append("svg:rect").attr("fill","blue").attr("fill-opacity","0.2");
node.attr("height",function(d){return d.height});
draw();



function draw(){
	node.attr("width",function(d){return time(data.earliest+d.duration)}).attr("x",function(d){return time(d.startTime)}).attr("y",function(d){return d.y});

}






