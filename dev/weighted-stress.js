var Lx,Lw,z,distance,weight,initializedMDS=false;

function initMDS(){
	N=graph.nodes.length;
	z=[];
	var n,p;
	layout.init();
	for(var i=0;i<N;i++){
		p=layout.nodePoints[graph.nodes[i].id].p;
		layout.x[i]=p.x;
		layout.y[i]=p.y;
		graph.nodes[i].index=i;
		//console.info(layout.x);
	}
	console.info(layout.x[0]);
	buildWeightedLaplacian();
	initializedMDS=true;
	Layout.ForceDirected.prototype.applyWeightedStress=Layout.ForceDirected.prototype.applyWeightedStressPrime

}

function applyMDS(){
localMDS();
return;
var N=graph.nodes.length;
var x=Array(N);
var y=Array(N);
//console.info(layout.x);
vec_copyTo(layout.x,x);
//console.info(x[0]);
//console.info(layout.x);
vec_copyTo(layout.y,y);

buildLaplacian();
trans(Lx,x,z);
conjugateGradient(Lw,z,x)
trans(Lx,y,z);
conjugateGradient(Lw,z,y)
//console.info(x);
vec_copyTo(x,layout.x);
vec_copyTo(y,layout.y);
var p;
	for(var i=0;i<N;i++){
		p=layout.nodePoints[graph.nodes[i].id];
		p.p.x=layout.x[i];
		p.p.y=layout.y[i];
	}
}

function localMDS(){
var N=graph.nodes.length;
var totalWeight;
var x,y;
for(var i=0;i<N;i++){
	x=0;
	totalWeight=0;
	for(var j=0;j<N;j++){
		if(i!=j){
			totalWeight+=weight[i][j];
			x+=weight[i][j]*(layout.x[j]+distance[i][j]*(layout.x[i]-layout.x[j])/indexedDistance(i,j));
		}
	}
	layout.x[i]=x/totalWeight;
}

for(var i=0;i<N;i++){
	y=0;
	totalWeight=0;
	for(var j=0;j<N;j++){
		if(i!=j){
			totalWeight+=weight[i][j];
			y+=weight[i][j]*(layout.y[j]+distance[i][j]*(layout.y[i]-layout.y[j])/indexedDistance(i,j));
		}
	}
	layout.y[i]=y/totalWeight;
}



var p;
	for(var i=0;i<N;i++){
		p=layout.nodePoints[graph.nodes[i].id];
		p.p.x=layout.x[i];
		p.p.y=layout.y[i];
	}
}



function Dijkstra(src,nodes){
	var N=graph.nodes.length;
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
		nodes[i].index=i;
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
		eF=graph.getEdgesFrom(u);
		//eT=graph.getEdgesTo(u);
		neighbors=[];
		for(var i=0;i<u.connections.length;i++){
			if(u.connections[i].source!=u){
			neighbors.push(u.connections[i].source);
			}else{
				neighbors.push(u.connections[i].target);
			}
			
		}
		for(var i=0;i<neighbors.length;i++){
			if(dist[neighbors[i].index]>dist[bestIndex]+1){
				dist[neighbors[i].index]=dist[bestIndex]+1;
			}
		}
		done[bestIndex]=true;
	}
	//console.info(dist);
	return dist;
	
}

function buildDistanceMatrix(){
	var N=graph.nodes.length;
	distance=Array(N);

	for(var i=0;i<N;i++){
		distance[i]=Dijkstra(graph.nodes[i],graph.nodes);
	}
}

function buildWeightedLaplacian(){
	buildDistanceMatrix(graph);
	var N=graph.nodes.length;
	weight=Array(N);
	//wieghting 
	for(var i=0;i<N;i++){
		weight[i]=Array(N);
		for(var j=0;j<N;j++){
			weight[i][j]=1/(distance[i][j]*distance[i][j]);
		}
	}
	Lw=Array(N);
	for(var i=0;i<N;i++){
		Lw[i]=Array(N);
		for(var j=0;j<N;j++){
			if(i!=j){
				Lw[i][j]=-weight[i][j];	
			}else{
				Lw[i][i]=0;
				for(var k=0;k<N;k++){
					if(k!=i){
						Lw[i][i]+=weight[i][k];				
					}
				}
			}
		}
	}
}

function buildLaplacian(){
	var N=graph.nodes.length;
	Lx=Array(N);
	for(var i=0;i<N;i++){
		Lx[i]=Array(N);	
		for(var j=0;j<N;j++){
			if(i!=j){
				Lx[i][j]=-1/(distance[i][j]*indexedDistance(i,j));
				if(isNaN(Lx[i][j]))Lx[i][j]=1;
				//console.info(i+","+j+": "+Lx[i][j]);
			}
		}
		for(var k=0;k<N;k++){
			Lx[i][i]=0;
			if(k!=i){
				Lx[i][i]-=Lx[i][k];				
			}
		}
	}
}

function distanceBetween(p1,p2){
	var d1=p1.p.x-p2.p.x;
	var d2=p1.p.y-p2.p.y;
	return Math.sqrt(d1*d1+d2*d2)
}

function indexedDistance(i,j){
	var dx = layout.x[i]-layout.x[j];
	var dy = layout.y[i]-layout.y[j];
	
	return Math.sqrt(dx*dx+dy*dy);
}




function conjugateGradient(A,b,x0){

	var n=x0.length;
	var r=Array(N),p=Array(N);
	var alpha,beta,delta;
	var tmp1=Array(N),tmp2=Array(N);
	trans(A,x0,tmp1);

	vec_sub(b,tmp1,r);
    vec_copyTo(r,p);
	iter=true;

	while(iter){
		alpha=inner_prod(r,r)/XTAY(p,A,p);
		
		scal_prod(alpha,p,tmp2);

		vec_add(x0,tmp2,x0);
		scal_prod(alpha,tmp1,tmp2);
		beta=inner_prod(r,r);
		vec_sub(r,tmp2,r);
		delta=inner_prod(r,r)
		if(Math.sqrt(delta)<10^-12){
			iter=false;
			break;
		}
		beta=delta/beta;
		scal_prod(beta,p,tmp1);
		vec_add(r,tmp1,p);

	}
}

function XTAY(U,M,V){
	var out=0;
	for(var i=0;i<M.length;i++){
		out+=U[i]*inner_prod(M[i],V);
	}
return out;
}

function trans(A,x,xp){
	for(var i=0;i<A.length;i++){
		xp[i]=inner_prod(A[i],x);
	}
}

function inner_prod(u,v){
	var out=0;
	for(var i=0;i<u.length;i++){out+=u[i]*v[i];}
	return out;
}

function scal_prod(k,u,v){
	n=u.length;
	for(var i=0;i<u.length;i++){v[i]=u[i]*k;}
}

function vec_add(u,v,w){
	n=u.length;
	for(var i=0;i<n;i++){
		w[i]=u[i]+v[i];
	}
}

function vec_sub(u,v,w){
	n=u.length;
	for(var i=0;i<n;i++){
		w[i]=u[i]-v[i];
	}
}

function vec_copyTo(u,v){
	n=u.length;
	for(var i=0;i<n;i++){v[i]=u[i];}
}


