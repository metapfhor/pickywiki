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
		  width:"100%",
		  "vertical-align":"middle",
		  right:"0px",
		  "height":controlHeight+"px",
		  "text-align":"right",
		  left:0+"px",
		  top:0+"px"}).attr("class","control");
		  
  	
  	
	  frame.style({position:"absolute",
		  top:0+"px",
		  left:0+"px",
		  "width":width+"px",
		  "height":"100%",
		  height:"100%",
		  "overflow-x":"visible",
		  "background-color":"#DCDCDC"
	  });	
	    
	    /*
	    contentScroll = frame.append("div")
		  .style({position:"absolute",
		  top:controlHeight,
		  left:0,
		  "width":"100%",
		  overflow:"auto",
		  }); */
  
	    
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
	.call(d3.behavior.drag().on("drag",drag_move).on("dragstart",highlight).on("dragend",unhighlight));
	  var cueHeight=1; 

		  

	var arrowStart=3*draggerWidth/16;
	var arrowUp=4*draggerHeight/16;
	var arrowOut=2.75*draggerWidth/16;
	var shaftWidth=draggerHeight/8;
	var shaftStart=5*draggerWidth/40;
	svg = dragger.append("svg:svg").attr({width:draggerWidth,height:draggerHeight}).style({position:"absolute",top:((controlHeight-draggerHeight)/2)+"px",right:0+""})
    g = svg.append("svg:g").attr({id:"resize_right",transform:"translate("+draggerWidth/2+",0)",class:"button"})
    g.append("svg:rect").attr({x:draggerWidth/40,y:draggerHeight/20,width:draggerWidth/20,height:18*draggerHeight/20});
    g.append("svg:path")
    .attr({d:"M "+shaftStart+" "+(draggerHeight/2-shaftWidth/2)+" l"+arrowStart+" 0 l0 "+(-arrowUp)+" l"+arrowOut
		  +" "+ (arrowUp+shaftWidth/2)+" l"+(-arrowOut)+" "+ (arrowUp+shaftWidth/2)+" l0"+(-arrowUp)+" l"+(-arrowStart)+" 0 Z"})
    
	svg.append("svg:use").attr({"xlink:href":"#resize_right",transform:"rotate(180,"+(draggerWidth/2)+","+(draggerHeight/2)+")"});
		
    var side = Math.sqrt(25/144)*collapseSize;
	collapseSvg = control.append("div").style(
	  {position:"absolute",
	  height:"100%",
	  width:collapseSize+"px",
	  top:0+"px",
	  right:(draggerWidth+8)+"px",
	  "overflow":"visible"}
	);
	
	;
    //minimize
    g = collapseSvg.append("svg:svg").attr(
	  {width:collapseSize,
	  height:collapseSize,
	  id:"expandButton"}
	).style(
	  {position:"absolute",
	  top:8+"px",
	  right:"0px"}
	).on("mousedown",collapse_start).append("svg:g").attr("class","button");
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize-side,height:collapseSize/10})
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize/10,height:collapseSize})
    g.append("svg:rect").attr({x:0,y:0.9*collapseSize,width:collapseSize,height:collapseSize/10})
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize/10,height:collapseSize})
    g.append("svg:rect").attr({x:collapseSize*0.9,y:side,width:collapseSize/10,height:collapseSize-side})
    g = g.append("svg:g").attr({id:"gMinimize","transform":"rotate(270,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    g.append("svg:path").attr({d:"M "+(0.2*collapseSize)+" "+(0.2*collapseSize)+" l"+side+" 0 l"+(-side)+" "+side+" Z"});
    g.append("svg:rect").attr({x:(collapseSize/3-Math.sqrt(2)/2),y:3*collapseSize/8,width:(2*collapseSize/3),height:(collapseSize/4),transform:"rotate(45,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    var factor =1.5;
    g = d3.select(collapseSvg[0][0].firstChild).append("svg:g").attr({"fill-opacity":0,class:"button"});
	g.append("svg:rect").attr({x:0,y:0,width:collapseSize-factor*side,height:collapseSize/10})
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize/10,height:collapseSize})
    g.append("svg:rect").attr({x:0,y:collapseSize*0.9,width:collapseSize,height:collapseSize/10})
    g.append("svg:rect").attr({x:0,y:0,width:collapseSize/10,height:collapseSize})
    g.append("svg:rect").attr({x:collapseSize*0.9,y:factor*side,width:collapseSize/10,height:collapseSize-factor*side})
    g = g.append("svg:g").attr({id:"gExpand","transform":"translate("+0+",-"+0+")rotate(90,"+(collapseSize/2)+","+(collapseSize/2)+")"})
    g.append("svg:path").attr({d:"M "+0+" "+0+" l"+side+" 0 l"+(-side)+" "+side+" Z"});
    g.append("svg:rect").attr({x:((1-Math.sqrt(2)/2)*collapseSize/10),y:3*collapseSize/8,width:(0.8*collapseSize),height:(collapseSize/4),transform:"rotate(45,"+(collapseSize/2)+","+(collapseSize/2)+")"})
		
		
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
	control.transition().duration(dt).style("left",(collapseSize+8)+"px").each("end",unhighlight.bind(collapseSvg[0][0]));
	collapseSvg.transition().duration(dt).style("right","4px");
	collapseSvg.on("mousedown",expand_start);
	collapseSvg[0][0].firstChild.firstChild.setAttribute("fill-opacity",0);
	collapseSvg[0][0].firstChild.lastChild.setAttribute("fill-opacity",1);
	dragger.style("display","none");
	dispatch.resize({size:(collapseSize+8)});
	};
	
	function expand(){
		frame.transition().duration(dt).style("left",0+"px");
		control.transition().duration(dt).style("left",0+"px").each("end",unhighlight.bind(collapseSvg[0][0]));
		collapseSvg.transition().duration(dt).style("right",(draggerWidth+10)+"px").each("end",function(){dragger.style("display","inherit");});		
		collapseSvg.on("mousedown",collapse_start);
		collapseSvg[0][0].firstChild.firstChild.setAttribute("fill-opacity",1);
		collapseSvg[0][0].firstChild.lastChild.setAttribute("fill-opacity",0);
		dispatch.resize({size:width});
	};
	
	function load(url){
		d3.text(url,function(err,req){
			content.html(req);			
		})
	}
	function updateHeight(){
		content.attr("height",(totalHeight-controlHeight)+"px");
	}
	
	
	var lastX,touch;
	
	function highlight(){
	  d3.select(this).selectAll("g.button").attr("class","buttonHi");;
	}
	
	function unhighlight(){
	  d3.select(this).selectAll("g.buttonHi").attr("class","button");
	}
  
	function drag_move(){
		width+=d3.event.dx;
		width=Math.min(width,totalWidth);
		frame.style({width:width+"px"});
		content.attr("width",(width-scroll)+"px");
		dispatch.resize({size:width});
	}
	
	function collapse_start(){
	  function event_collapse(){
		sel.on("mouseout",null);
		sel.on("mouseover", null);
		sel.on("mouseup",null);
		collapse();
	  }
	  if(d3.event.which==1){
		var sel = d3.select(this);
		highlight.bind(this)();
		sel.on("mouseout",function(){sel.on("mouseup",null);sel.on("mouseover",function(){sel.on("mouseup",event_collapse)})});
		sel.on("mouseup",event_collapse);
	  }
	}
	
	function expand_start(){
	  function event_expand(){
		sel.on("mouseout",null);
		sel.on("mouseover", null);
		sel.on("mouseup",null);
		expand();
	  }
	  if(d3.event.which==1){
		var sel = d3.select(this);
		highlight.bind(this)();
		sel.on("mouseout",function(){sel.on("mouseup",null);sel.on("mouseover",function(){sel.on("mouseup",event_expand)})});
		sel.on("mouseup",event_expand);
		
	  }
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



