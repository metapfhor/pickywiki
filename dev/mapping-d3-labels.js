ns="http://www.w3.org/2000/svg";
w=1000;
h=600;

function getData() {
		var qs="[[Category:StickyWiki/2012]] OR [[Category:StickyWiki]]&po=Endangers|Helps|Links|Causes|Requires";
        return parseData(smwAsk(qs));
}



function getPageDiv(page, oldid) {
	var ask = 'http://www.genozymes-ge3ls.ca/wiki/' + page.replace(' ', '_') + '?action=render' + (oldid > 0 ? '&oldid=' + oldid : "");
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", ask, false );
    xmlHttp.send( null );
	var out = document.createElement("div");
	out.innerHTML=xmlHttp.responseText
    return out;
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
				var labelAnchors = [];
				var labelAnchorLinks = [];
				for(var i=0;i<items.length;i++){
					itemMap[items[i].title]=items[i];			
				}
				linkTypes=['endangers', 'helps', 'links', 'causes', 'requires'];
				for(var i=0;i<items.length;i++){
					item=items[i];
					nodes.push(item);
					labelAnchors.push({node:item});
					labelAnchors.push({node:item});
					labelAnchorLinks.push({source:2*i,target:2*i+1});
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
				return {"nodes":nodes,"links":links,"labelAnchors":labelAnchors,"labelAnchorLinks":labelAnchorLinks};
}

function redrawNodes(){
 node.attr("cx", function(d) { return isNaN(d.x)?0:d.x; })
       .attr("cy", function(d) {  return isNaN(d.y)?0:d.y; });
};

function redrawLinks(){
	link.attr("x1",function(d){return d.source.x;})
	.attr("y1",function(d){return d.source.y;})
	.attr("x2",function(d){return d.target.x;})
	.attr("y2",function(d){return d.target.y;});
};

function redrawLabels(){
	var dx,dy,r,b,len,theta,cx,cy,rot;	
	var spacer=7;
	anchorNode.each(function(d,i){
		if(i%2==0){
			d.x=d.node.x;
			d.y=d.node.y;
		}else{
			dx=d.x-d.node.x;
			dy=d.y-d.node.y;
			r=Math.sqrt(dx*dx+dy*dy);
			dx/=r;
			dy/=r;
			theta=Math.atan2(dy,dx);
			rot="rotate("+theta+","+(d.node.x+dx*spacer)+","+(d.node.y+dy*spacer)+")";
			if(dx<=0){//left
				b=this.getBBox();
				bbox=b;
				len=(Math.sqrt(b.width*b.width+b.height*b.height));
				dx*=spacer;		
				dx-=len;			
				dy*=spacer;
			}else{
				dx*=spacer;
				dy*=spacer;
			}
			cx=d.node.x+dx;
			cy=d.node.y+dy;
			this.setAttribute("x",cx);
			this.setAttribute("y",cy);
			//this.setAttribute("transform","rotate("+dx>0?theta:-theta+","+cx+","+cy+")");
			//this.setAttribute("x",(x=(d.x-d.node.x)<=0?d.x-this.getBBox().width:d.x));	
			//this.setAttribute("y",y=d.y);	
		}
	});
	//anchorNode.attr("y",function(d){return d.y;}).attr("x",function(d){return d.x});


};

function highlightNode(viz){
	viz.setAttribute("stroke","deepskyblue");
}
function unhighlightNode(viz){
	viz.setAttribute("stroke","black");
}

viz=d3.select("#graph").append("svg").attr("width",w).attr("height",h).style("display","inline");
cont=d3.select("#contents").append("div").attr("width",200).attr("height",h).style("display","inline");
var force = d3.layout.mds().size([w, h]).padding(10);
var force2 = d3.layout.force().gravity(0).linkDistance(5).linkStrength(8).charge(-100).size([w, h]);
			
picky=getData();
force.nodes(picky.nodes);
force.links(picky.links);
force.start();
force2.nodes(picky.labelAnchors);
force2.links(picky.labelAnchorLinks);
force2.start();



link=viz.selectAll("line.link").data(picky.links).enter().append("line").attr("stroke-width","1").attr("stroke","black");
node=viz.selectAll("circle.node").data(picky.nodes).enter().append("circle").attr("r","5").attr("fill","green").attr("stroke-width","1").attr("stroke","black")
.call(force.drag).attr("onmousedown",function(d){return "downNode(this,\""+d.title+"\")"}).attr("onmouseover","highlightNode(this)").attr("onmouseout","unhighlightNode(this)")
anchorNode=viz.selectAll("text.anchor").data(picky.labelAnchors).enter().append("text").text(function(d,i){return i%2==0?"":d.node.title});
anchorNode.classed("noselect");


force.on("tick",function() {
	force2.start();
	console.info("hi");
	redrawNodes();	
	redrawLinks();
	redrawLabels();
  });



//for(var i=0;i<picky.nodes.length;i++){
	//picky.nodes[i].weight=1/(picky.nodes[i].weight*picky.nodes[i].weight);
//}

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

function lowdens(){
	force.charge(-800).start();
}

