(function(){

d3.layout.quickMDS = function(nodes,links,threshold) {


	
    var mds = {}, size = [ nodes.length, nodes.length ],x,y,px,py,stress=0,pstress=-Infinity,neighbors,weight=[],iter=99;
	var maxX=-Infinity,minX=Infinity,maxY=-Infinity,minY=Infinity,sX,sY;
	var time = d3.time.scale().domain([0,0]).range([0,0]);	
	var first,last;
	mds.tick = function() {
		function nodeDistanceCartesian(i,j){
			var dx = px[i]-px[j];
			var dy = py[i]-py[j];
			return (dx=Math.sqrt(dx*dx+dy*dy))==0?Number.MIN_VALUE:dx;
		}
	  var n = nodes.length,xCurr,yCurr,ni,nj,dist;
	  stress=0;
  		for(var i=0;i<n;i++){
			ni=nodes[i];
			xCurr=0;
			yCurr=0;
			totalWeight=0;
			for(var j=0;j<n;j++){
				if(i!=j){
					
					nj=nodes[j];
					dist=nodeDistanceCartesian(i,j);
					totalWeight+=weight[i][j];
					xCurr+=weight[i][j]*(px[j]+distance[i][j]*(px[i]-px[j])/dist);
					yCurr+=weight[i][j]*(py[j]+distance[i][j]*(py[i]-py[j])/dist);
					stress+=weight[i][j]*Math.pow((dist-distance[i][j]),2);
					//console.info(stress);
					
				}
			}
			xCurr/=totalWeight;
			//x[i]=xCurr;
			//xCurr=px[i];
			
			yCurr/=totalWeight;
			y[i]=yCurr;
		}
		pstress=stress;
		iter=iter+1;
    };
	    
 
    mds.init = function() {
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
	  first=Infinity;
	  last=-Infinity;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
		if(o.startTime<first)first=o.startTime;
		if(o.startTime>last)last=o.startTime;
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
	  time = d3.time.scale().domain([first,last]).range([0,size[0]]);
      for (i = 0; i < n; ++i) {
		//	console.info(i);       
        o = nodes[i];
        if (isNaN(o.x)) o.x = time(o.startTime);
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


	  //first pass dijkstra     
      buildDistanceMatrix();


	  //wieghting matrix
      for(i=0;i<n;i++){
			weight[i]=[];
			for(var j=0;j<n;j++){
				weight[i][j]=1/(distance[i][j]*distance[i][j]);
			}
		}
   
	  	
    };
    mds.init();
    while(((stress-pstress)/stress)>threshold){
			mds.tick();
	}
	//console.info("mds exit after "+iter+" iterations:"+pstress+" -> "+stress);
	return;
  };

})();
