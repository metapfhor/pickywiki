ns="http://www.w3.org/2000/svg";
w=1000;
h=600;
function getData() {
		var qs="[[Category:Ticket tracker]]|?Date created|?Date resolved|?Date required|?Ticket components|?Category";
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

var itemMap=[];
function parseData(data){
	var nodes=[];
	var links=[];
	var items=[];
	var newMap=[];
	
	function initItem(a){
			a.prereqs=[];
			a.dependencies=[];
			a.label=a.fulltext.replace("Ticket:","")
			a.links=[];
	}
	
	function registerItem(a){
		itemMap[a.fulltext]=a;
		newMap[a.fulltext]=a;
		initItem(a);
		return a;
	}
    
    function getComponents(a){
        return a.printouts["Ticket components"];
    }

	function mergeItems(a,b){//a<-b
       // console.info("merging items: "+a.label+" <- "+b.fulltext.replace("Ticket:",""))
		updateItem(a,b);
        var c;
		//for(var x in linkTypes){
			var comps=getComponents(b);
           // console.info(comps.length);
			for(var j=0;j<comps.length;j++){
                c=itemMap[comps[j].fulltext];
				if(c!=undefined){
                        if(!isLinkedTo(a,c)){
                                linkItems(a,c);
                        }else{
                                links.push(getLink(a,c))
                        }
				}        
			}
		//}
		return a;
	}
	
	function isLinkedTo(a,b){
		for(var l in a.prereqs){
			if(a.prereqs[l]==b)return true;
		}
		for(var l in a.dependencies){
			if(a.dependencies[l]==b)return true;
		}
		return false;
	}
    
    function getLink(a,b){
        for(var l in a.links){
                if(a.links[l].source==b||a.links[l].target==b)return a.links[l];
        }
    }
	
	function linkItems(a,b){
		var link={source:a,target:b};
		links.push(link);
		a.prereqs.push(b);
		a.links.push(link);
		b.dependencies.push(a);
		b.links.push(link);  
	}
	
	function updateItem(a,b){//a<-b
		return;
		
	}
	
	function isUnregisteredItem(a){
		return itemMap[a.fulltext]==undefined;
	}
	function isNewItem(a){
		return newMap[a.fulltext]!=undefined;
	}
	
	function isValidItem(a){
		return !isUnregisteredItem(a);
	}

	var item;
	var updates=[];
	//start by registering everything
	for(var x in data.query.results){
		item=data.query.results[x];
		if(isUnregisteredItem(item)){
			items.push(registerItem(item));
		}else{
			updates.push({old:itemMap[item.fulltext],new:item});
		}
	}
	var pair;
	//push updated data to nodes and links
	for(var i=0;i<updates.length;i++){
		pair = updates[i];
		nodes.push(mergeItems(pair.old,pair.new));
	}
	var otherItem;
	var linkTypes=['Helps'];
	for(var i=0;i<items.length;i++){
		item=items[i];
		if(isValidItem(item)){
			updateItem(item,item);
			nodes.push(item);
			for(var x in linkTypes){
				var comps=getComponents(item);
				for(var j=0;j<comps.length;j++){
					//push new links
					if(!isUnregisteredItem(comps[j])&&isNewItem(comps[j])){
						linkItems(item,itemMap[comps[j].fulltext],x);
					}               
				}
			}
		}
		
	}
	return {nodes:nodes,links:links};
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

	for(var i=0;i<n;i++){
		placeAfterReqs(data.nodes[i]);
	}

	for(var i=0;i<n;i++){
		o=data.nodes[i];
		o.endTime=o.startTime+o.duration;
		//o.y=-50;//quick hack to get unpacked events off screen
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

