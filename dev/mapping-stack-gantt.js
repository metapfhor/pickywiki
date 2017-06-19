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
			d.duration=d.label.length*3600*24*1000*7*Math.random();
		}
		data.latest=Math.max(d.startTime+d.duration,data.latest);
	}

	for(var i=0;i<n;i++){
		placeAfterReqs(data.nodes[i]);
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




function recalcBoxes(){

}


var area = d3.svg.area()
    .x(function(d) { return x(d.x); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });


var n = 5, // number of layers
    m = 200, // number of samples per layer
    stack = d3.layout.stack().offset("silhouette"),
    layers0 = stack(bumpLayer(n))
    

var width = 960,
    height = 500;

var x = d3.scale.linear()
    .domain([0, m - 1])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, d3.max(layers0.concat(layers0), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    .range([height, 0]);

var color = d3.scale.linear()
    .range(["#aad", "#556"]);

var area = d3.svg.area()
    .x(function(d) { return x(d.x); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.selectAll("path")
    .data(layers0)
  .enter().append("path")
    .attr("d", area)
    .style("fill", function() { return color(Math.random()); });

function bumpLayer(n) {
	var imp=1;
	var width=960;
  function bump(a) {
    var x = Math.random()/2*(width),
        r = 20;
		console.info(width);
      	a.push({x:x-r,y:imp,y0:0});
		a.push({x:x+r,y:imp,y0:0});
  }

  var a = [], i;
  for (i = 0; i < n; ++i){ a[i]=[]; bump(a[i]);}
  return a;
}

