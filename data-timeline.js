ns="http://www.w3.org/2000/svg";
w=1000;
h=600;

function transitionable(){
	this.getDisplayed=function(){return this.__transition__||this;};
	this.propagate=function(p,v){
		if(this[p]!=undefined){
			if(this[p]!=v){
			  if(this.updates==undefined){
				this.updates={};
			  }
			  //console.info("updating: "+p+" <- "+v);
			  this.updates[p]=v;
			}
		  }else{
			this[p]=v;
		  }
	};
	this.get=function(x){
		var o=this.__transition__;
		if (o) {
			o=o[x];
			if (o) {
				return o;
			}else{
				return this[x];
			}
		}else{
			return this[x];
		}
	};
	var trans;
	this.update=function(newTrans,tween,callback){
		copyProps=function(){
			fields = this.drawingProps;
			for(var x in fields){
				p = fields[x];
				if(o[p]==undefined)o[p]=this[p];
			}
		}.bind(this)//end copyProps
		
		copyMethods =function(){
			fields=this.drawingMethods;
			for(var x in fields){
				p = fields[x];
				if(o[p]==undefined)o[p]=this[p].bind(o);
			}
		}.bind(this)//end copyMethods
		
		registerTweens=function(){
			if(o){
				//if(this.constructor==node)console.info([o,u,newTrans]);
				var func = tween!=undefined?tween():undefined;
				for(var x in u){
					p=u[x];
					if(o[x]==undefined){
						//if(x=="y")console.info("initializing __transition__."+x+": "+o[x]);
						o[x]=this.get(x);
					}
					if(newTrans||this.tween[x]!=undefined){
						//console.info("tweening "+x+": "+o[x]+" -> "+p);
						this.tween[x]=d3.interpolateNumber(o[x],p)
					}else{
						//if(x=="y")console.info("setting __transition__."+x+": "+o[x]+" -> "+p)
						o[x]=p;
					}
				}
					
				if(newTrans){
					trans.tween("update",function(){
						return function(t){
							this.__runTween__(t);
							if(func)func();
						}
					})
				}
			}else{
				if(this.constructor==node){
					//console.info("no transition is present")
					//console.info(this);
				}
			}
		}.bind(this)//end tween
		
		updateData=function(){
			for(var x in u){
				//console.info("updating "+x+": "+this[x]+" -> "+u[x])
				this[x]=u[x];
			}
			this.updates=undefined;
		}.bind(this)//end update
		
		var o,u=this.updates,p,fields;
		//if(u==undefined){
		//	return function(){};
		//}
		if(newTrans){
			//if we have a transition already going on
			if ((o = this.__transition__)) {
				trans=d3.select(this).transition().duration(inTime);
			}else{
				trans=d3.select(this).transition().duration(inTime);
				var o=this.__transition__;
				//copy over properties and methods requiered for drawing;
				copyProps();
				copyMethods();
				this.tween={};
				this.__runTween__=function(t){
					for(var x in this){
						o[x]=this[x](t);
					}
				}.bind(this.tween);
			}
		
		}else{
			o = this.__transition__;
		};
		

		registerTweens();
		
		
		//add drawing properties to __transition__ object
		
		if(trans)trans.each("end",function(){this.tween=undefined;trans=undefined;if(callback)callback();})
		
		return updateData;
	}
}


function node(d){
	for(var x in d){
		this[x]=d[x];
	}
	this.prereqs=[];
	this.dependencies=[];
	this.links=[];
	this.label=d.fulltext.replace("Ticket:","");
	this.initProps=function(){
                var req;
				
					if(this.printouts["Start date"].length){
						this.startTime=this.printouts["Start date"]*1000;
					}else{
						var today = new Date().getTime();
						today-=today%(24*60*60*1000);
						this.startTime=today;
					}
					
					
					if(!this.printouts["Duration"].length){
						if((req=this.printouts["Date required"]).length){
							this.duration=(req*1000-this.startTime);
						}else{
							//if none exists fake it based on string length -> three days per character
							this.duration=this.label.length*3600*24*1000*3;
						}
					}else{
						this.duration=this.printouts["Duration"]*24*60*60*1000;
					}
					
					//a.duration*=Math.random();
					this.asap=this.printouts["Asap"]*1 || false;
        }
}
node.prototype = new transitionable();
node.prototype.constructor = node
node.isValidItem=function(){//the crux of the matter when switching between datasets seem to be here
			return (this.printouts["Start date"].length&&this.printouts["Date required"].length||this.printouts["Duration"].length);
    }
node.prototype.isValidItem=node.isValidItem;


function link(s,t){
	this.source=s;
	this.target=t;
	this.name=s.label+" -> "+t.label
}
link.prototype = new transitionable();
link.prototype.constructor = link


function smWikiClient(mainQuery,printouts,api,linkTypes){
	
		function fetchData() {
		var qs=mainQuery.concat(printouts);
		var out=smwAsk(qs);
		return out;
	}
	
	function getArticle(title){
		var qs=mainQuery.concat("[[".concat(title.concat("]]".concat(printouts))));
		return smwAsk(qs);
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
		var ask = api + '?action=ask&query=' + query + '|limit=5000&format=json';
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open( "GET", ask, false );
		xmlHttp.send( null );
		return JSON.parse(xmlHttp.responseText);
	}
	
		
	var itemMap=[];
	
	function prepareData(data){//parse data and check for any updates in response
		
		var ordered=[];
		var initProps=[];
		var startProps=[];
		var newProps=[];
		
		if(!data){
			data=parseData(fetchData());
		}else{
			data=parseData(data);
		}    
	
		//make sure all temporal dependencies are enforced and updates in properties are registered
		orderData();
		
		data.earliest=getEarliest(data.nodes);
		data.latest=getLatest(data.nodes);
		console.info(data);
		
		data.invalid.forEach(function(d,i){
			if(d.links.length)d.links.forEach(function(d,i){
				console.info(d.name)
			})
		})
	
		
		return data;
	
		
		function mostRecent(d,p){
			if(d.updates){
				if(d.updates[p]){
					return d.updates[p].end
				}
			}
				return d[p];
		};
		function getEarliest(arr){return d3.min(arr,function(d){
				return mostRecent(d,"startTime");
			})
		;};
		
		function getLatest(arr){return d3.max(arr,function(d){
				return mostRecent(d,"endTime");
			});
		};
		
		
		
		
		   
		function parseData(data){
			var nodes=[];
			var links=[];
			var items=[];
			var newMap=[];
			var item;
			var updates=[];
			var invalid=[];
			
			function registerItem(a){
				var n = new node(a);
				itemMap[a.fulltext]=n;
				newMap[a.fulltext]=n;
				if(n.isValidItem())n.initProps();
				return n;
			}
			
			function getComponents(a,t){
				return a.printouts[t];
			}
		
			function consolidateLinks(a,b){//a<-b
			   // console.info("merging item links: "+a.label+" <- "+b.fulltext.replace("Ticket:",""))
	
				var c;
				for(var x in linkTypes){
					var comps=getComponents(b,linkTypes[x].key);
	
					for(var j=0;j<comps.length;j++){
						c=itemMap[comps[j].fulltext];
						if(c!=undefined){
								if(!isLinkedTo(a,c)){
									
									if(linkTypes[x].direction=='forward'){
										linkItems(a,c);
									}else{
										if(linkTypes[x].direction=='backward')linkItems(c,a);
									}
								}else{
									links.push(getLink(a,c))
								}
						}        
					}
				}
	
			}
			
			function validateLinks(a){
					function removeLinkage(l,i){
						function removeElm(arr,d){
							arr.splice(arr.indexOf(d),1)
						}
						removeElm(l.source.prereqs,l.target);
						removeElm(l.target.dependencies,l.source);
						if(l.source==a){
							removeElm(l.target,l);
						}else{
							removeElm(l.source,l)
						}
						a.links.splice(i);
					}
					var n=a.links.length;
					for(var i=0;i<n;i++){
						if(links.indexOf(a.links[i])==-1){
							removeLinkage(a.links[i],i);
						}
					}
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
				var l=new link(a,b);
				links.push(l);
				a.prereqs.push(b);
				a.links.push(l);
				b.dependencies.push(a);
				b.links.push(l);  
			}
		
			
			function isUnregisteredItem(a){
				return itemMap[a.fulltext]==undefined;
			}
			function isNewItem(a){
				return newMap[a.fulltext]!=undefined;
			}
					
			function linkNew(arr){
				for(var i=0;i<arr.length;i++){
					item=arr[i];
					nodes.push(item);
					for(var x in linkTypes){
						var comps=getComponents(item,linkTypes[x].key);
						if(comps!=undefined){
							for(var j=0;j<comps.length;j++){
								//push new links
								if(!isUnregisteredItem(comps[j])&&isNewItem(comps[j])){
									//console.info("usable link: "+comps[j].fulltext)
									//console.info(itemMap[comps[j].fulltext]);
									if(linkTypes[x].direction.indexOf('forward')==0){
										linkItems(itemMap[comps[j].fulltext],item);
									}else{
										if(linkTypes[x].direction.indexOf('backward')==0)linkItems(item,itemMap[comps[j].fulltext]);
									}
									
								}else{
									console.info("unusable link: "+comps[j].fulltext)
								}               
							}
						}
					}
				}
			}
		
			var otherItem;
			//start by registering everything
			for(var x in data.query.results){
				item=data.query.results[x];
				
				if(node.isValidItem.bind(item)()){
					otherItem=itemMap[item.fulltext];
					if(!otherItem){
						items.push(registerItem(item));
					}else{
						initProps(item);
						updates.push({old:otherItem,new:item});
						
					}
				}else{
					otherItem=itemMap[item.fulltext];
					if(!otherItem){
						invalid.push(registerItem(item));
					}else{
						initProps(item);
						updates.push({old:otherItem,new:item});
						
					}
				}
			}
			
			var pair,n,o;
			//push old nodes which will be updated further along the stream
			for(var i=0;i<updates.length;i++){
				o=updates[i].old;
				n=updates[i].new;
				consolidateLinks(o,n);
				nodes.push(updates[i].old);
			}
			
			 for(var i=0;i<updates.length;i++){
				validateLinks(updates[i].old);
			}
			
			linkNew(items);
	
			return {nodes:nodes,links:links,updates:updates,invalid:invalid};
		}//end parseData
		
		
	
		
		
		function orderData(){
			
			function copyProps(d,i,arr){
				var props=["startTime","endTime","duration","asap"];
				if(!arr[i])arr[i]={};
				for(var x in props){
					var p=props[x];
					arr[i][p]=d[p];
				}
			}
			function registerInitProps(d){
				if(d.endTime){
					copyProps(d,d.index,initProps);
				}
				copyProps(d,d.index,newProps);
			}
			function updateItem(a,b){
				function hasChangedDuration(){
					var i=a.index;
					return initProps[i]&&newProps[i].duration!=initProps[i].duration;
				}
				//overwrite startProps with updated data
				copyProps(b,a.index,startProps);
			}//end updateItem
			
		
			
			function placeAfterReqs(d){
				function checkOrder(d,o){
					newProps[d.index].startTime=Math.max(newProps[o.index].startTime+newProps[o.index].duration,newProps[d.index].startTime);
				}
		
				//if(d.asap)return;//pretty sure this the opposite of what we want but it does the trick for now
				var reqs=d.prereqs;
				var startTime,origStart=d.startTime,o;
				for(var j=0;j<reqs.length;j++){
					o=reqs[j];
					if(o.isValidItem()){
						if(!ordered[o.index]){
							placeAfterReqs(o);
						}
						checkOrder(d,o);	
					}
					
				}
				
				ordered[d.index]=true;
			}//end placeAfterReqs
			
			
			function propagateNewProp(d,p){
				var i=d.index;
				function propHasChanged(){
				return initProps[i][p]!=newProps[i][p];
				}
				function isOldItem(){
					return initProps[i]!=undefined;
				}
				if(isOldItem()){
					if(propHasChanged())d.propagate(p,newProps[i][p]);
				}else{
					d[p]=newProps[i][p];
				}
			}
	
		
			//begin 
			
			var n=data.nodes.length;
			for(var i=0;i<n;i++){
				d=data.nodes[i];
				//console.info(new Date(d.duration));
				d.index=i;
				ordered[i]=false;
				registerInitProps(d);
			}
	
			//push new props onto old ones and register any changes in duration
			n=data.updates.length;
			for (var i=0;i<n;i++) {
				d=data.updates[i].old;
				copyProps(data.updates[i].new,d.index,newProps);
				
				
			}
			n=data.nodes.length;
			//ensure order is maintained and register and changes in startTime
			for(var i=0;i<n;i++){
				//console.info(new Date(data.nodes[i].duration));
				placeAfterReqs(data.nodes[i]);
			}
			//calculate new end times after having shuffled things around
			var origEnd;
			for (var i=0;i<n;i++) {
				d=data.nodes[i];
				p=newProps[d.index]
				p.endTime=p.startTime+p.duration;
				propagateNewProp(d,"endTime");
				
				propagateNewProp(d,"duration");
				//console.info(new Date(d.duration));
				propagateNewProp(d,"startTime");
			}
		}//end orderData
	};
	
	
	
	
	function listenForChanges(){
		var client = new Faye.Client("http://access.fungalgenomics.ca:8000/faye");
		
		client.subscribe("/updates/articleSave",function(m){
			handleMessage(m)	
		})
		function handleMessage(m){
			console.info(m)
			timeline.add(prepareData(getArticle(m)));
		};
	}
	var out = {};
	out.prepareData=prepareData;
	out.listenForChanges=listenForChanges;
	return out;
}


