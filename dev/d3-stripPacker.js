(
d3.layout.stripPacker = function(events,start,end){
	var t1=start;
	var t2=end;
	var spacer=10;
	var offset;
	var packer = {};
	function d3_eventstripNode(x1,x2) {
		var node ={};
		node.left=null;
		node.right=null;
		node.point=null;
		node.bounds={
			start:   x1,
			end:  x2,
		}
		node.fits=function(event){
			return event.startTime>=node.bounds.start && event.endTime<=node.bounds.end;
		};
		node.inlay=function(event,offset){
			node.left=d3_eventstripNode(node.bounds.start,event.endTime);
			node.left.left=d3_eventstripNode(node.bounds.start,event.startTime);
			node.left.right=d3_eventstripNode(event.startTime,event.endTime);
			node.right=d3_eventstripNode(event.endTime,node.bounds.end);
			node.left.right.point=event;
			event.y=offset;
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
		strip.nextStrip=null;
		strip.t1=start;
		strip.t2=end;
		strip.root=d3_eventstripNode(start,end);
		strip.insert=function(event,offset){
					return strip.root.insert(event,offset);
			}
		return strip;
	}
	packer.strips=[];
	packer.add=function(event,last){
		function insert(event){
			var n=packer.strips.length;
			inserted=null;
			for(var i=0;i<n&&inserted==null;i++){
				inserted=packer.strips[i].insert(event,i);
			}
			if(inserted==null){
				packer.strips[n]=d3_eventStrip(t1,t2);
				packer.strips[n].insert(event,n);	
			}
		}
		if(event.forEach!=undefined){
			event.forEach(insert);
		}else{
			insert(event);
		}		
	}
	packer.addLinks=function(links){
		//this is gonna have to be real magic!!!!!!!!!!!!!!!!!!!!!
		return;
	}
	packer.getHeight=function(){
		return packer.strips.length;
	}
	packer.reset=function(){
	  delete packer.strips;
	  packer.strips=[];
	}
	packer.add(events);
	return packer;
}

)
