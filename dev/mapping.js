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
				linkTypes=['endangers', 'helps', 'links', 'causes', 'requires'];
				for(var i=0;i<items.length;i++){
					item=items[i];
					elm=new Object();
					elm.pagename=item.title;
					elm.type=item.properties.type;
					elm.links=[];
					for(x in linkTypes){
						if(item.properties[x]){
							if(item.properties[x] instanceof Array){
								for(var j=0;j<item.properties[x].length;j++){
									elm.links.push({linkType:x,link:item.properties[x][j]});
								}
							}else{
								elm.links.push({linkType:x,link:item.properties[x]});
							}
							
						}
					}
					elements[elm.pagename]=elm;
					elements.push(elm);
				}
				return elements;
}


function gotElements(elements) {
sys.size=0;
sys.nodes=[];
for(i=0;i<elements.length;i++){
		n=elements[i];
		
	currNode=sys.getNode(n.pagename)
	if(currNode==undefined){
		currNode=sys.addNode(n.pagename,{x:0,y:0,fixed:true});
		//currNode=sys.addNode(n.pagename,{fixed:true});
		sys.size++;
		sys.nodes.push(currNode);
	}
	
	if(n.links.length>0){
		for(j=0;j<n.links.length;j++){
			otherNode=n.links[j].link;
			edgeType=n.links[j].linkType;
			if(elements[otherNode]!=null){
				otherNode=sys.getNode(otherNode);
				if(otherNode==undefined){
					otherNode=sys.addNode(n.links[j].link,{x:0,y:0,fixed:true});
					//otherNode=sys.addNode(n.links[j].link,{fixed:true});
					sys.size++;
					sys.nodes.push(otherNode);
				}
				sys.addEdge(currNode,otherNode,edgeType);
			}
		}
	}
	
}
console.info("done adding nodes");

}

var basic = {
init:function(system){
sys=system;


//viz.setAttribute("transform","translate("+(svg.scrollWidth/2)+","+(svg.scrollHeight/2)+")");
system.screenSize(svg.scrollWidth,svg.scrollHeight)
system.eachEdge(function(e,p1,p2){
	basic.createEdgeViz(e,p1,p2);	
	})

system.eachNode(function(n,p){
	n.p.x=0;
    n.p.y=0;
	basic.createNodeViz(n,p);

})

basic.initMouseHandling();
initMDS(sys);
},redraw:function(){
	//return;
	//console.info(x);
	applyMDS(sys);
	sys.eachNode(function(n,p){
	if(n.viz==null){
		basic.createNodeViz(n,p);
	}
	n.viz.setAttribute("x",(p.x-5))
	n.viz.setAttribute("y",(p.y-5)) 
    })

	sys.eachEdge(function(e,p1,p2){
	if(e.viz==null){
		basic.createEdgeViz(e,p1,p2);
	}
	e.viz.setAttribute("x1",p1.x);
	e.viz.setAttribute("y1",p1.y);
	e.viz.setAttribute("x2",p2.x);
	e.viz.setAttribute("y2",p2.y);
    })
},createNodeViz:function(n,p){

	n.viz=document.createElementNS(ns,"rect");
	n.viz.setAttribute("width","10");
	n.viz.setAttribute("height","10");
	n.viz.setAttribute("fill","cyan");

	n.viz.setAttribute("x",(p.x-5))
	n.viz.setAttribute("y",(p.y-5)) 
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
        var oldmass = 1


        var handler = {clicked:function(e){

        		var pos = $(svg).offset();
        		_mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
        		selected = nearest = dragged = sys.nearest(_mouseP);
            
            if (dragged.node !== null) dragged.node.fixed = true
//        		if  (selected.node !== null) dragged.node.tempMass = 10000
        		      		
            $(svg).bind('mousemove', handler.dragged)
        		$(window).bind('mouseup', handler.dropped)
      		
        		return false
          },dragged:function(e){
            var old_nearest = nearest && nearest.node._id
        		var pos = $(svg).offset();
        		var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (!nearest) return
        		if (dragged !== null && dragged.node !== null){
              var p = sys.fromScreen(s)
        			dragged.node.p = p//{x:p.x, y:p.y}
//        			dragged.tempMass = 100000
        		}

            return false
        	},dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null;
            selected = null
            $(svg).unbind('mousemove', handler.dragged)
        		$(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
       $(svg).bind('mousedown', handler.clicked)
      }

};






sys = arbor.ParticleSystem(1,1,0.5,true,1,0.2);
updateNodes();
console.info(sys.parameters());
sys.renderer=basic;
//console.info(updateNodes());




//getPage('PickyWiki', '5531');




