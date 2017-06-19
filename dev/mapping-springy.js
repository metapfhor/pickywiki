ns="http://www.w3.org/2000/svg"
var x,y;
function updateNodes() {
		var qs="[[Category:StickyWiki/2012]] OR [[Category:StickyWiki]]&po=Endangers|Helps|Links|Causes|Requires";
        gotElements(gotData(smwAsk(qs)));
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


function gotData(data) {
				var elements=[];
				var items=data.ask.results.items;
				var item;
				var elm;
				var type;
				linkTypes=['endangers', 'helps', 'links', 'causes', 'requires'];
				for(var i=0;i<items.length;i++){
					item=items[i];
					elm=new Object();
					elm.pagename=item.title;
					elm.type=item.properties.type;
					elm.links=[];
					for(x in linkTypes){
						type=linkTypes[x];
						if(item.properties[type]!=undefined){
							if(item.properties[type] instanceof Array){
								for(var j=0;j<item.properties[type].length;j++){
									elm.links.push({linkType:type,link:item.properties[type][j]});
								}
							}else{
								elm.links.push({linkType:type,link:item.properties[type]});
							}
							
						}
					}


					elements[elm.pagename]=elm;
					elements.push(elm);
				}
				return elements;
}


function gotElements(elements) {
var ind;
var currNode,otherNode,edge;
var k=0;
for(i=0;i<elements.length;i++){
		n=elements[i];
		
	
	if((currNode=graph.nodeSet[n.pagename])==undefined){
		currNode=new Node(n.pagename);
		graph.addNode(currNode);
	}
	if(n.links.length>0){
		for(j=0;j<n.links.length;j++){
			otherNode=n.links[j].link;
			edgeType=n.links[j].linkType;
			if(elements[otherNode]!=null){
				otherNode=graph.nodeSet[otherNode];
				if(otherNode==undefined){
					otherNode= new Node(n.links[j].link);
					graph.addNode(otherNode)
				}
				graph.addEdge(new Edge("e_".concat(k++),currNode,otherNode,{type: edgeType}));

			}
		}
	}
	
}
console.info("done adding nodes");

}

function pruneTree(){
root=graph.nodes[0];
buildDistanceMatrix(graph);
for(var i=1;i<graph.nodes.length;i++){
		buildDistanceMatrix(graph);
		if(!isFinite(distance[0][i])){
			graph.removeNode(graph.nodes[i]);
			i--;
		}
}

}

var graph = new Graph();
var layout = new Layout.ForceDirected(graph, 50, 5000, 0.5);

var render = new Renderer(0.00001,layout,
function clear(){
},function drawEdge(e,p1,p2){
if(e.viz==null){
		basic.createEdgeViz(e,p1,p2);
	}
	var s1=toScreen(p1);
	var s2=toScreen(p2);
	e.viz.setAttribute("x1",s1.x);
	e.viz.setAttribute("y1",s1.y);
	e.viz.setAttribute("x2",s2.x);
	e.viz.setAttribute("y2",s2.y);

},function drawNode(n,p){
	if(n.viz==null){
		basic.createNodeViz(n,p);
	}
	var s=toScreen(p);
	n.viz.setAttribute("transform","translate(".concat(s.x-5).concat(",").concat(s.y-5).concat(")"));
});

var basic = {
createNodeViz:function(n,p){

	n.viz=document.createElementNS(ns,"g");
	n.viz.setAttribute("fill","cyan");
	var rect=document.createElementNS(ns,"rect");
	rect.setAttribute("width","10");
	rect.setAttribute("height","10");
	rect.setAttribute("x","0");
	rect.setAttribute("y","0");
	n.viz.appendChild(rect);
	var text = rect=document.createElementNS(ns,"text");
	text.appendChild(document.createTextNode(n.id));
	text.setAttribute("style","font-size:8px")
	text.setAttribute("y","8");
	
	n.viz.appendChild(text);
	
	n.viz.setAttribute("transform","translate(".concat(p.x-5).concat(",").concat(p.y-5).concat(")"));
	viz.appendChild(n.viz);
},createEdgeViz:function(e,p1,p2){

	e.viz=document.createElementNS(ns,"line");
	e.viz.setAttribute("x1",p1.x);
	e.viz.setAttribute("y1",p1.y);
	e.viz.setAttribute("x2",p2.x);
	e.viz.setAttribute("y2",p2.y);
	e.viz.setAttribute("stroke","black");
	e.viz.setAttribute("stroke-width","1");
	if(viz.hasChildNodes()){
		viz.insertBefore(e.viz,viz.firstChild);
	}else{
		viz.appendChild(e.viz);
	}
},initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
      	selected = null;
      	nearest = null;
      	var dragged = null;
        var oldmass = 1;
		width=svg.scrollWidth;
		halfWidth=width/2;
		height=svg.scrollHeight;
		halfHeight=height/2;
		viz.setAttribute("transform","translate("+(width/2)+","+(height/2)+")");

		svg.setAttribute("onmousedown","handler.clicked(event)");

}}; 

        var handler = {clicked:function(e){

        		var pos = {left: svg.offsetLeft, top: svg.offsetTop};
        		_mouseP = fromScreen({x:e.pageX-pos.left-halfWidth, y:e.pageY-pos.top-halfHeight});
        		selected = nearest = dragged = layout.nearest(_mouseP);
            
            if (dragged.node !== null) {
				dragged.point.oldMass = dragged.point.m;
				dragged.point.m	= Infinity;
				console.info(dragged.node.data.pagename);
			}
        		svg.setAttribute("onmousemove","handler.dragged(event)");
				body.setAttribute("onmouseup","handler.dropped()");      		

        		return false
          },dragged:function(e){
            var old_nearest = nearest && nearest.node._id
        		var pos = {left: svg.offsetLeft, top: svg.offsetTop};
        		var s = fromScreen({x:e.pageX-pos.left-halfWidth, y:e.pageY-pos.top-halfHeight});

            if (!nearest) return
        		if (dragged !== null && dragged.node !== null){
              		//alert(dragged);
					dragged.node.viz.setAttribute("fill","red");
        			dragged.point.p.x = s.x;
					dragged.point.p.y = s.y;
        		}
			render.start();
            return false
        	},dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
			dragged.node.viz.setAttribute("fill","cyan");            
			if (dragged.node !== null) dragged.node.fixed = false
           // dragged.node.tempMass = 1000
			dragged.point.m=dragged.point.oldMass;
            dragged = null;
            selected = null
			svg.removeAttribute("onmousemove");
			body.removeAttribute("onmouseup");
            _mouseP = null
			render.start();
            return false
          }
        }
		

// calculate bounding box of graph layout.. with ease-in
var currentBB;

// convert to/from screen coordinates
toScreen = function(p) {
	currentBB = layout.getBoundingBox();
	var size = currentBB.topright.subtract(currentBB.bottomleft);
	var sx = p.divide(size.x).x * (width);
	var sy = p.divide(size.y).y * (height);

	return new Vector(sx, sy);
};

fromScreen = function(s) {
	currentBB = layout.getBoundingBox();
	var size = currentBB.topright.subtract(currentBB.bottomleft);
	var px = (s.x / width) * size.x;
	var py = (s.y / height) * size.y;

	return new Vector(px, py);
};




updateNodes();
pruneTree();

console.info("init");
basic.initMouseHandling();

initMDS();

render.start();

