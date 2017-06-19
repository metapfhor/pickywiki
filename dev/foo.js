(d3.layout.eventStrip = function(events,start,end){
function d3_eventstripNode(x1,y1,x2,y2) {
	return {
		left: null,
		right: null,
		down: null,
		point: null,
		bounds:{
			start:   x1,
  			top:    y1,
 			end:  x2,
 			height: y2
		}
		fits:function(event){
			return event.startTime>bounds.start && rect.endTime<bounds.end;
		},
		fitsPerfectly:function(event){
			return event.startTime==bounds.start && event.endTime==bounds.right;
		},
		insert:function(event){
			if(left!=null){
				return (n=left.insert(event))!=null?n:right.insert(event);
			}else{		
			if(point!=null)return null;
			if(!fits(event)){
				return null
			}else{
				return inlay(event);
			}
		},
		inlay:function(event)(){
			left=d3_eventstripNode(bounds.start,bounds.top,event.endTime,bounds.height);
			left.left=d3_eventstripNode(bounds.start,bounds.top,event.startTime,bounds.height);
			left.right=d3_eventstripNode(event.startTime,bounds.top,event.endTime,bounds.height);
			right=d3_eventstripNode(event.endTime,bounds.bottom,bounds.end,bounds.height);
			left.right.point=event;
			event.y=bounds.top;
			return left.right;
		}
    };
}
function d3_eventStrip(start,end){
	return {
		nextStrip:null,
		root:d3_eventstripNode(start,0,end,1000)
		insert:function(event){
				var in = root.insert(event);
				if(in==null){
					if(nextTree==null)nextTree=d3_eventStrip(start,end);
					nextTree.insert(event);
			}
		}
	}
}
var root = d3_eventStrip(start,end);
events.forEach(root.insert);
})

