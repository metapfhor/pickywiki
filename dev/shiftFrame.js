d3.shiftFrame=function(viz){

	var frame=viz.append("div").attr("class","shiftFrame");
	var width=500;
	var controlHeight = 36
	var body;
  var totalHeight;	
  var draggerWidth=30;
  var draggerHeight=20;
  var collapseSize=20;
	var margin=leftPadding=8;
	var control,content,dragger,svg,g,gTri,tri,collapseSvg;
  var dt = 250;
  var dispatch = d3.dispatch("filter","resize");
  var scroll=8;
  
  function init(){
  
    function resize(update){
	    totalHeight=viz[0][0].offsetHeight;
	    totalWidth=viz[0][0].offsetWidth;
	    updateHeight();
    }
    control = frame.append("div")
		  .style({position:"relative",
		  "background-color":"#C0C0C0",
		  width:"100%",
		  "vertical-align":"middle",
		  right:"0px",
		  "height":controlHeight+"px",
		  "text-align":"right",
		  left:0+"px",
		  top:0+"px"}).attr("class","hithereiamcontrol");
		  
  	
  	
  	frame.style({position:"absolute",
	    top:0+"px",
	    left:0+"px",
    //	"min-width":width,
	    "width":width+"px",
	    "height":"100%",
	    height:"100%",
	    "overflow-x":"visible",
	    "background-color":"#DCDCDC"});	
	    
	    /*
	    contentScroll = frame.append("div")
		  .style({position:"absolute",
		  top:controlHeight,
		  left:0,
		  "width":"100%",
		  overflow:"auto",
		  }); */
  
//      contentScroll.on("scroll",scrollDrag) //this idea seems to be garbage
	    
	  content = frame.append("iframe")
	  .style({
	  "padding-left":leftPadding+"px",
	  overflow:"visible"
	  }).attr({width:(width-scroll)+"px",seamless:"seamless"});  
		  
		dragger = control.append("div")
		  .style({position:"absolute",
		  height:"100%",
		  width:draggerWidth+"px",
		  top:0+"px",
		  right:4+"px",
		  "overflow":"visible"})
		  .call(d3.behavior.drag().on("drag",dragger_move));
		  var cueHeight=1; 

		  

		  
	svg = dragger.append("svg:svg").attr({width:draggerWidth,height:draggerHeight}).style({position:"absolute",top:((controlHeight-draggerHeight)/2)+"px",right:0+""})
    g = svg.append("svg:g").attr({id:"resize_right",transform:"translate("+draggerWidth/2+",0)",fill:"black"})
    g.append("svg:rect").attr({x:1,y:0,width:2,height:draggerHeight});
    g.append("svg:path")
    .attr({d:"M 5 "+(7*draggerHeight/16)+" l"+(2*((draggerWidth/2)-5)/3)+" 0 l0 "+(-3*draggerHeight/16)+" l"+(((draggerWidth/2)-5)/3)+" "+ (draggerHeight/4)+" l"+(-((draggerWidth/2)-5)/3)+" "+ (draggerHeight/4)+" l0"+(-3*draggerHeight/16)+" l"+(-2*((draggerWidth/2)-5)/3)+" 0 Z"})
    svg.append("svg:use").attr({"xlink:href":"#resize_right",transform:"rotate(180,"+(draggerWidth/2)+","+(draggerHeight/2)+")"});
		
    var side = Math.sqrt(25/144)*collapseSize;
		collapseSvg = control.append("svg:svg").attr({width:collapseSize,height:collapseSize}).style({position:"absolute",top:8+"px",right:(draggerWidth+8)+"px"}).on("mousedown",collapse);
    //minimize
    g = collapseSvg.append("svg:g");
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize-side,height:2})
    g.append("svg:rect").attr({x:0,y:0,width:2,height:collapseSize})
    g.append("svg:rect").attr({x:0,y:collapseSize-2,width:collapseSize,height:2})
    g.append("svg:rect").attr({x:0,y:0,width:2,height:collapseSize})
    g.append("svg:rect").attr({x:collapseSize-2,y:side,width:2,height:collapseSize-side})
    g = g.append("svg:g").attr({"transform":"rotate(270,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    g.append("svg:path").attr({d:"M3 3 l"+side+" 0 l"+(-side)+" "+side+" Z"});
    g.append("svg:rect").attr({x:(collapseSize/3-Math.sqrt(2)/2),y:3*collapseSize/8,width:(2*collapseSize/3),height:(collapseSize/4),transform:"rotate(45,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    
    g = collapseSvg.append("svg:g").attr({"fill-opacity":0});
		g.append("svg:rect").attr({x:0,y:0,width:collapseSize-1.5*side,height:2})
    g.append("svg:rect").attr({x:0,y:0,width:2,height:collapseSize})
    g.append("svg:rect").attr({x:0,y:collapseSize-2,width:collapseSize,height:2})
    g.append("svg:rect").attr({x:0,y:0,width:2,height:collapseSize})
    g.append("svg:rect").attr({x:collapseSize-2,y:1.5*side,width:2,height:collapseSize-1.5*side})
    g = g.append("svg:g").attr({"transform":"translate(2,-2)rotate(90,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    g.append("svg:path").attr({d:"M3 3 l"+side+" 0 l"+(-side)+" "+side+" Z"});
    g.append("svg:rect").attr({x:(collapseSize/3-Math.sqrt(2)/2),y:3*collapseSize/8,width:(2*collapseSize/3),height:(collapseSize/4),transform:"rotate(45,"+(collapseSize/2)+","+(collapseSize/2)+")"})
		
		
	filter = control.append("input").attr({type:"text"}).style({position:"absolute",top:5+"px",right:(16+collapseSize+draggerWidth)+"px"}).on("input",filterInput)
		
		
		
		
	window.addEventListener("resize",resize);
	 

		resize();
  }
  
  var currFilter="";
  function filterInput(){    
    setTimeout(filterChange.bind(this),1000);
  }
  
  function filterChange(){
    if(currFilter!=this.value){
      currFilter=this.value;
      console.info("fireing event!!!")
      dispatch.filter({keyword:currFilter})
    }   
  }
  
	function collapse(){
    
		frame.transition().duration(dt).style("left",(-frame[0][0].offsetWidth)+"px");
		
		control.transition().duration(dt).style("left",28+"px");
		
    collapseSvg.transition().duration(dt).style("right","4px");
		collapseSvg.on("mousedown",expand);
		collapseSvg[0][0].firstChild.setAttribute("fill-opacity",0);
		collapseSvg[0][0].lastChild.setAttribute("fill-opacity",1);
		dragger.style("display","none");
		dispatch.resize({size:28});
	};
	
	function expand(){
	  var sel = d3.select(this);
		frame.transition().duration(dt).style("left",0+"px");
		control.transition().duration(dt).style("left",0+"px");
		
		collapseSvg.transition().duration(dt).style("right",(draggerWidth+10)+"px").each("end",function(){dragger.style("display","inherit");});		
		collapseSvg.on("mousedown",collapse);
		collapseSvg[0][0].firstChild.setAttribute("fill-opacity",1);
		collapseSvg[0][0].lastChild.setAttribute("fill-opacity",0);
		dispatch.resize({size:width});
	};
	
	function load(url){
		d3.text(url,function(err,req){
			content.html(req);			
		})
	}
	function updateHeight(){
		content.attr("height",(totalHeight-controlHeight)+"px");
	//	dragger.style("height",totalHeight-controlHeight-2)
	}
	
	
	var lastX,touch;
	function dragger_move(dx){
		dx=d3.event.dx;
		width+=dx;
		width=Math.min(width,totalWidth);
		frame.style({width:width+"px"});
		content.attr("width",(width-scroll)+"px");
		dispatch.resize({size:width});
	}


	frame.collapse=function(){
	  collapse();
	  return frame;
	}
	
	frame.expand=function(){
	  expand();
	  return frame;
	}
	frame.load=function(url){
	  //load(url);
    content.attr("src",url)
	  return frame;
	}
	
	frame.width=function(x){
	  if(!arguments.length)return width;
	  width=Math.min(x,totalWidth);
	  frame.style({width:width+"px"});
	  content.attr("width",(width-scroll)+"px");
	  return timeline;
	}
	
	init();
	dispatch.resize({width:width});
	return d3.rebind(frame, dispatch, "on");
}



