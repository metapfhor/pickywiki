ns="http://www.w3.org/2000/svg";
w=1000;
h=600;

function getData() {
		var qs="[[Category:StickyWiki/2012]] OR [[Category:StickyWiki]]&po=Endangers|Helps|Links|Causes|Requires";
        return parseData(smwAsk(qs));
}



function getPage(page, oldid) {
	var ask = 'http://www.genozymes-ge3ls.ca/wiki/' + page.replace(' ', '_') + '?action=render' + (oldid > 0 ? '&oldid=' + oldid : "");
	$.get(ask, function(data) {
		$('#contents').html(data);
		$('#contents').fadeIn();
		$('#contents').find('a').bind('click', function() { alert(JSON.stringify($(this))); return false });
	});
}

function smwAsk(query) {
    var ask = 'http:/mediawiki/api.php?action=ask&q=' + query + '&limit=5000&format=json';
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", ask, false );
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}


function parseData(data) {
				var nodes=[];
				var links=[];
				var items=data.ask.results.items;
				var item;
				var elm;
				var type;
				var itemMap=[];
				for(var i=0;i<items.length;i++){
					itemMap[items[i].title]=items[i];			
				}
				linkTypes=['endangers', 'helps', 'links', 'causes', 'requires'];
				for(var i=0;i<items.length;i++){
					item=items[i];
					nodes.push(item);
					for(x in linkTypes){
						type=linkTypes[x];
						if(item.properties[type]!=undefined){
							if(item.properties[type] instanceof Array){
								for(var j=0;j<item.properties[type].length;j++){
									if(itemMap[item.properties[type][j]]!=undefined){
										links.push({source:item,target:itemMap[item.properties[type][j]]});
									}
								}
							}else{
								if(itemMap[item.properties[type]]!=undefined){
									links.push({source:item,target:itemMap[item.properties[type]]});
								}
							}
						}
					}
				}
				return {"nodes":nodes,"links":links};
}
scale=2;
function redrawNodes(){
 viz.selectAll("circle").attr("cx", function(d) { return isNaN(d.x)?0:d.x;})
       .attr("cy", function(d) {  return isNaN(d.y)?0:d.y;});
};

function redrawLinks(){
	viz.selectAll("line")
	.attr("x1",function(d){return d.source.x;})
	.attr("y1",function(d){return d.source.y;})
	.attr("x2",function(d){return d.target.x;})
	.attr("y2",function(d){return d.target.y;});
};

picky=getData();
viz=d3.select("body").append("svg");
var force = d3.layout.mds().size([w, h]).padding(0);
force.nodes(picky.nodes);
force.links(picky.links);
force.on("tick",function() {
	console.info("hi");


	
	redrawNodes();	
	redrawLinks();

  });
force.start();

viz.selectAll("line").data(picky.links).enter().append("line").attr("stroke-width","1").attr("stroke","black");
viz.selectAll("circle").data(picky.nodes).enter().append("circle").attr("r","5").attr("fill","green").attr("stroke-width","1").attr("stroke","black")
.call(force.drag).attr("onmousedown",function(d){return "downNode(this,\""+d.title+"\")"}).attr("onmouseover","highlightNode(this)").attr("onmouseout","unhighlightNode(this)");
for(var i=0;i<picky.nodes.length;i++){
	picky.nodes[i].weight=1/(picky.nodes[i].weight*picky.nodes[i].weight);
}

function highlightNode(viz){
	viz.setAttribute("stroke","deepskyblue");
}
function unhighlightNode(viz){
	viz.setAttribute("stroke","black");
}

function downNode(viz,name){
	viz.setAttribute("onmouseup","loadPage(this,\""+name+"\")");
	viz.setAttribute("onmousemove","dontLoadPage(this)");
}

function dontLoadPage(viz){
	viz.removeAttribute("onmouseup");
	viz.removeAttribute("onmousedown");
}

function loadPage(viz,name){
	dontLoadPage(viz);
	if(contentsPanel.firstChild!=null){
		contentsPanel.replaceChild(getPageDiv(name),contentsPanel.firstChild)
	}else{
		contentsPanel.appendChild(getPageDiv(name));
	}
}
//.attr("x1",function(d){ console.info(d.source.x); return d.source.x;}).attr("y1",function(d){return d.source.y;}).attr("x2",function(d){return d.target.x;}).attr("y2",function(d){return d.target.y;}).attr("stroke-width","1").attr("stroke","black");




