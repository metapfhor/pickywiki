(d3.layout.stripPacker = function(events,start,end){
var spacer=10;
function d3_eventstripNode(x1,y1,x2,y2) {
	var node ={};
	node.left=null;
	node.right=null;
	node.point=null;
	node.bounds={
		start:   x1,
		top:    y1,
		end:  x2,
		height: y2
	}
	node.fits=function(event){
		return event.startTime>=node.bounds.start && event.endTime<=node.bounds.end;
	};
	node.inlay=function(event,offset){
		node.left=d3_eventstripNode(node.bounds.start,node.bounds.top,event.endTime,node.bounds.height);
		node.left.left=d3_eventstripNode(node.bounds.start,node.bounds.top,event.startTime,node.bounds.height);
		node.left.right=d3_eventstripNode(event.startTime,node.bounds.top,event.endTime,node.bounds.height);
		node.right=d3_eventstripNode(event.endTime,node.bounds.top,node.bounds.end,node.bounds.height);
		node.left.right.point=event;
		event.y=offset+node.bounds.top;
		return node.left.right;
	}
	node.insert=function(event,offset){
		if(node.left!=null){
			return (n=node.left.insert(event,offset))!=null?n:node.right.insert(event,offset);
		}else{		
			if(node.point!=null)return null;
			if(!node.fits(event)){
				return null;
			}else{
				return node.inlay(event,offset);
			}
		}
		}
	return node;
}
function d3_eventStrip(start,end){
	var strip={};

	var nextStrip=null;
	var t1=start,t2=end;
	strip.root=d3_eventstripNode(start,0,end,10);
	strip.offset=0;
	strip.insert=function(event){
				var inserted = strip.root.insert(event,strip.offset);
				if(inserted==null){
					if(nextStrip==null){
						nextStrip=d3_eventStrip(t1,t2);
						nextStrip.offset=strip.offset+10
					}
					nextStrip.insert(event);
			}
		}
	return strip;
}
var rootStrip = d3_eventStrip(start,end);
console.info(events);
events.forEach(rootStrip.insert);
})

