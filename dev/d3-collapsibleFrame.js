(collapsibleFrame=function(){
	var out=document.createElement("div");
	var frame=d3.select(out);
	var width="500px";
	var control = frame.append("div").style({position:"relative","background-color":"orange","font-size":"20px","vertical-align":"top",right:"0","text-align":"right","padding-right":5});
	control.text("<<");
	var svg = control.append("svg:svg").attr({width:35,height:25}).style({position:"absolute",right:0});
	var tri = svg.append("svg:path").attr({d:"M5 0 l12.5 12.5 l-12.5 12.5 Z",fill:"black"});
	frame.style({"position":"relative","top":0,"left":0,"max-width":width})
	var content = frame.append("div").style({"position":"relative","left":0,"top":0,"background-color":"green","overflow-x":"visible","overflow-y":"scroll"});
		
	
	
	out.collapse=function(){
		//content.style("overflow-x","hidden");
		frame.transition().duration("250").style("left","-"+width).each("end",function(){
			console.info(control);
			control.style("left",35);
		});
		control.text(">>");
		control.on("mousedown",out.expand);
	};
	out.expand=function(){
		//content.style("overflow-x","scroll");
		frame.transition().duration("250").style("left","0px").each("start",function(){
			control.style("left",0);
		});
		control.text("<<");
		control.on("mousedown",out.collapse);
	};
	out.load=function(url){
		d3.xhr(url,function(err,req){
			console.info(req);
			content.each(function(){console.info(arguments);this.innerHTML=req.responseText;});
		})
	}
	control.on("mousedown",out.collapse);
	return out;
}
)
