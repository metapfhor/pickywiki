(function(){
  function d3_identity(d) {
    return d;
  }
  function d3_layout_mdsGanttDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_mdsGanttDragend(d) {
    d.fixed &= 1;
  }
  function d3_layout_mdsGanttMouseover(d) {
    d.fixed |= 4;
  }
  function d3_layout_mdsGanttMouseout(d) {
    d.fixed &= 3;
  }
d3.layout.mdsTimeSpanner = function() {
	var change=false;
	function dragmove(d) {
		var rng=time.range()
		var tmp,o,begin=0,end=size[0],dx=0;
		var min=begin,max=end;
		change=false;
		function pushDependencies(d){
			var n=d.dependencies.length
			for(var i=0;i<n;i++){
				o=d.dependencies[i]
				if((tmp=d.x+d.width)>o.x){
					o.x=tmp;
					o.startTime=time.invert(o.x).getTime();
					pushDependencies(o);
					if((tmp+=o.width)>max){
						max=tmp;
						change=true;
					}
				}
			}
		}
		function pushPrereqs(d){
			var n=d.prereqs.length;
			for(var i=0;i<n;i++){
				o=d.prereqs[i];
				if(o.x+o.width>d.x){
					o.x=d.x-o.width
					o.startTime=time.invert(o.x).getTime();
					pushPrereqs(o);
					if(o.x<min){
						min=o.x;
						change=true;
					}
				}
			}
		}

		if(d.x<d3.event.x){
			d.x=d3.event.x;
			d.startTime=time.invert(d.x).getTime();
			d.y=d3.event.y;
			pushDependencies(d);
			if((tmp=d.x+d.width)>max){
				max=tmp;
				change=true;
			}
		}else{
			if(d.x>d3.event.x){
				d.x=d3.event.x;
				d.startTime=time.invert(d.x);
				d.y=d3.event.y;
				pushPrereqs(d);
				if(d.x<min){
					min=d.x;
					change=true;
				}
			}else{
				d.y=d3.event.y;
			}
		}

		if(change){
			if(max>end){
				dx=max-end;
				time.domain([time.invert(0),time.invert(size[0]+dx)]);
			}else{
				if(min<begin){
					dx=min-begin;
					time.domain([time.invert(dx),time.invert(size[0])]);
				}
			}
			console.info("rescale");
			
			mds.timescale(time);
		}

	  //d.startTime=time.invert(d.x);
		
		mds.resume();
		change=false;
	}
	

	
    var mds = {}, event = d3.dispatch("start","tick","range","end"), size = [ 0, 0 ], alpha,drag,padding=[0,0], nodes = [], links = [], neighbors, distance,weight=[],nan=false,x,y,px,py,neighbors;
	var maxX=-Infinity,minX=Infinity,maxY=-Infinity,minY=Infinity,sX,sY;
	var time = d3.time.scale().domain([0,0]).range([0,0]),offset=0;
    
	

	
		mds.tick = function() {
      if ((alpha *= .99) < .00005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
	  var n = nodes.length,xCurr,yCurr,ni,nj,dist
	  var cX=(maxX-minX)/2,cY=(maxY-minY)/2;
	 // minX=Infinity;
	//STILL NOT SUPER STABLE, CAN BE GREATLY IMPROVED
      for(var i=0;i<n;i++){
			ni=nodes[i];
			px[i]=Math.max(Math.min(ni.x,2*size[0]),-2*size[0])
			px[i]=px[i]/sX;
			//if(px[i]<minX)minX=px[i];
			x[i]=px[i];
			py[i]=Math.min(Math.max(ni.y,0),size[1])/sY+minY;	
		}


	
      var pMinX=minX,pMaxX=maxX,pMinY=minY,pMaxY=maxY,pSX=sX,pSY=sY,fixed=false;
      maxX=-Infinity,minX=Infinity,maxY=-Infinity,minY=Infinity,sX,sY;
		//console.info(nodes[0].x);
  		for(var i=0;i<n;i++){
			
			ni=nodes[i];
			if(!ni.fixed){
				xCurr=0;
				yCurr=0;
				totalWeight=0;
				for(var j=0;j<n;j++){
					if(i!=j){
						nj=nodes[j];
					
						if(isFinite(distance[i][j])){
							totalWeight+=weight[i][j];
							dist=nodeDistance(i,j);
							//if(dist<sX*2){
								xCurr+=weight[i][j]*(px[j]+distance[i][j]*(px[i]-px[j])/dist);
								yCurr+=weight[i][j]*(py[j]+distance[i][j]*(py[i]-py[j])/dist);
							//}
						}else{
							console.info("ruh roh");
						}
					}
				}
				xCurr/=totalWeight;
				//x[i]=xCurr;
				//xCurr=px[i];
				
				yCurr/=totalWeight;
				y[i]=yCurr;
				
			}else{
				fixed=true;
				x[i]=px[i];
				//yCurr=y[i];
				y[i]=py[i];
				
			}

			if(xCurr>maxX)maxX=xCurr;
			if(xCurr<minX)minX=xCurr;

			if(yCurr>maxY)maxY=yCurr;
			if(yCurr<minY)minY=yCurr;
		}

		//rescaling & update px

		sX=(size[0]-padding[0]-padding[2])/(maxX-minX);
		sY=(size[1]-padding[1]-padding[3])/(maxY-minY);
		for(var i=0;i<n;i++){
			ni=nodes[i];
			if(!ni.fixed){
				ni.y=(y[i]-minY)*sY+padding[1];
			}
		}



      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
	    
   function nodeDistance(i,j){
		var dx = px[i]-px[j];
		var dy = py[i]-py[j];
		return (dx=Math.sqrt(dx*dx+dy*dy))==0?Number.MIN_VALUE:dx;
		} 
    mds.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
	  mds.timescale(time);
      return mds;
    };
    mds.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return mds;
    };
    mds.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return mds;
    };
    mds.alpha = function(x) {
      if (!arguments.length) return alpha;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(mds.tick);
      }
      return mds;
    };
	mds.padding = function(x){
	if (!arguments.length) return padding;
		if(x.length){
			if(x.length==2){
				padding=[x[0],x[1],x[0],x[1]]			
			}else{
				if(x.length==4)padding=x;		
			}
		}else{
			padding = [x,x,x,x];	
		}
      return mds;
	}
	mds.timescale = function(x){
		if (!arguments.length) return time;
		time=x;
		var n=nodes.length,early=time.domain()[0].getTime(),o;
		for(var i=0;i<n;i++){
			o=nodes[i];
			o.width=time(early+o.duration);
			o.x=time(o.startTime);
		}
		event.range({type:"range"});
       return mds;
	}
	mds.shiftTime =function(x){
		rng=time.range();
		time.domain([time.invert(rng[0]-x),time.invert(rng[1]-x)]);
		n=nodes.length;
		for(var i=0;i<n;i++){
			nodes[i].x+=x;
		}	
			event.range({type:"range"});
		return mds;
	}

    mds.start = function() {
      function position(dimension, size) {
        var j = -1, m = neighbors[i].length, x;
        //while (++j < m) if (!isNaN(x = neighbors[i][j][dimension])) return x;
        return Math.random() * size;
      }
      function neighbor() {
        if (!neighbors) {
          neighbors = [];
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            if( neighbors[o.source.index].indexOf(o.target==-1)) neighbors[o.source.index].push(o.target);
            if( neighbors[o.target.index].indexOf(o.source==-1)) neighbors[o.target.index].push(o.source);
          }
        }
        //console.info(neighbors);
      }
      
	function buildDistanceMatrix(){
	var N=nodes.length;
	distance=Array(N);

		for(var i=0;i<N;i++){
			distance[i]=Dijkstra(nodes[i]);
		}
		//console.info(distance);
	}    
   function Dijkstra(src){
	var N=nodes.length;
	var dist=Array(N);
	var previous=Array(N);
	var done=Array(N);
	for(var i=0;i<N;i++){
		if(nodes[i]!=src){
			dist[i]=Infinity;
		}else{
			dist[i]=0;
		}
		done[i]=false;
	}
	var bestDist=Infinity,eF,eT;
	while(true){
		bestDist=Infinity
		for(var i=0;i<N;i++){
			if(!done[i] && dist[i]<bestDist){
				u=nodes[i];
				bestDist=dist[i];
				bestIndex=i;			
			}
		}
		if(bestDist==Infinity){break;}
		
		for(var i=0;i<neighbors[bestIndex].length;i++){
			if(dist[neighbors[bestIndex][i].index]>dist[bestIndex]+1){
				dist[neighbors[bestIndex][i].index]=dist[bestIndex]+1;
			}
		}
		done[bestIndex]=true;
	}
	return dist;
	
	}      
      
      
      
      var i, j, n = nodes.length, m = links.length, w = size[0], h = size[1], o;
	  x=new Array(n),y=new Array(n),px=new Array(n),py=new Array(n);
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
		o.links = [];
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
		o.index=i;
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
		o.source.links.push(o);
		o.target.links.push(o);
        ++o.source.weight;
        ++o.target.weight;
      }
      //build neighbor matrix for positioning and dijkstra
      neighbor();
      for (i = 0; i < n; ++i) {
		//	console.info(i);       
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        y[i] = o.y;
        px[i] = o.x;
        py[i] = o.y;
		if(o.x>maxX)maxX=o.x;
		if(o.x<minX)minX=o.x;

		if(o.y>maxY)maxY=o.y;
		if(o.y<minY)minY=o.y;
       // console.info(o.x);
      }
	  sX=(size[0]-2*padding[0])/(maxX-minX);
	  sY=(size[1]-2*padding[1])/(maxY-minY);

	  //first pass dijkstra     
      buildDistanceMatrix();
	  //connect disjoint graphs to r.
	  //not sure this is the best way to go but its a quick fix!!!!
	var cnx;	
	var cont=distance[0];
		var dmax=0;
	for(i=0;i<n;i++){
		for(var j=0;j<n;j++){
			if(i!=j && isFinite(distance[i][j])){
				dmax=Math.max(distance[i][j],dmax);
			}
		}	
	}
	dmax/=Math.min(dmax,Math.log(dmax))
	for(i=0;i<n;i++){
		for(var j=0;j<n;j++){
			if(!isFinite(distance[i][j])){
						distance[i][j]=dmax;
			}

		}	
	}
	//for(i=0;i<n;i++){
		//if(!isFinite(distance[0][i])){
		//	neighbors[0].push(nodes[i]);
		//	cnx=Math.round(Math.random()*n);			
		//	while(!isFinite(distance[0][cnx])){
		//		cnx=Math.round(Math.random()*n);
		//	}
		//	neighbors[i].push(nodes[cnx]);
		//	buildDistanceMatrix();
		//}
	//}
	neighbors=undefined;
	neighbor();

	  //wieghting matrix
      for(i=0;i<n;i++){
			weight[i]=[];
			for(var j=0;j<n;j++){
				weight[i][j]=1/(distance[i][j]*distance[i][j]);
			}
		}
      return mds.resume();
    };


    mds.resume = function() {
      return mds.alpha(.1);
    };
    mds.stop = function() {
      return mds.alpha(0);
    };
    mds.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart", d3_layout_mdsGanttDragstart).on("drag", dragmove).on("dragend", d3_layout_mdsGanttDragend);
      this.on("mouseover.mds", d3_layout_mdsGanttMouseover).on("mouseout.mds", d3_layout_mdsGanttMouseout).call(drag);
    };
	mds.neighbors = function(i){
	if (!arguments.length) return neighbors;
      return neighbors[i];
	};
    return d3.rebind(mds, event, "on");
  };

})();
