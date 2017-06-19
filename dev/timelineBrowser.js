d3.timelineBrowser=function(viz){
  var browser={}
  var refreshTime=5000;
  var refreshId;
  var refresh;
  var timeline = d3.timeline(viz);
   pane = d3.shiftFrame(viz);
 // pane.collapse();
  browser.pane=pane;
  browser.add=function(x){
    if(typeof(x)=="object"){
      timeline.add(x);
      return;
    }
    if(typeof(x)=="function"){
      timeline.add(x());
      if(refresh)clearInterval(refreshId);
      refresh=function(){timeline.add(x());}
      refreshId=setInterval(refresh,refreshTime)
      return;
    }
  };
  browser.set=function(x){
    if(typeof(x)=="object"){
      timeline.set(x);
      return;
    }
    if(typeof(x)=="function"){
      timeline.set(x());
      if(refresh)clearInterval(refreshId);
      refresh=function(){timeline.set(x());}
      refreshId=setInterval(refresh,refreshTime)
    }
  };
  browser.refresh=function(x){
    if(arguments.length)return refreshTime;
    refreshTime=x;
    if(refreshId)clearInterval(refreshId);
    if(refresh)setInterval(refresh,refreshTime)
  }
  browser.domain=timeline.domain;
  browser.padding=timeline.padding;
  browser.filter=timeline.filterElements
  browser.filterJSON=function(x){

    return timeline.filterElements(function(d,i){
      var empty;
      function check(o){
          empty=true;
          for(z in o){
            empty=false;
            if(o[z]==x[y]||(o[z].indexOf&&o[z].indexOf(x[y])!=-1))return true;
          }
          if(empty){
             return o==x[y]||(o.indexOf&&o.indexOf(x[y])!=-1)
          }
          
      }
      var y,z,match=false,props;
      for(y in x){
         props=y.split(".");
         for(var i=0;i<props.length&&d;i++){
              d=d[props[i]];
         }
         if(d){
           match=check(d)||found;
         }
         if(match){
            break;
         }
      }
      return match;
    });
  }
  
  
  browser.filterKeyword=function(x){
    return timeline.filterElements(function(d,i){
      return d.fulltext.toLowerCase().indexOf(x)!=-1;
    });
  }
  
  browser.filterActive=function(x){
    if(!arguments.length)x=true;
    return timeline.filterElements(function(d,i){
      return d.active==x;
    });
  }
  
  browser.filterStartDate=function(x,y){
    if(!y)y=x;
    return timeline.filterElements(function(d,i){
      return (d.startTime>=x&&d.startTime<=y)||(d.startTime<=x&&d.startTime>=y);
    });
  }
  
  browser.filterDuration=function(x,y){
    if(!y)y=x;
    return  timeline.filterElements(function(d,i){
      return (d.duration>=x&&d.duration<=y)||(d.duration<=x&&d.duration>=y);
    });
  }
  
  browser.zoomTo=function(x){
    var earliest=Infinity,latest=-Infinity,z;
    for(y in x.nodes){
      z=x.nodes[y]
      if(z.startTime<earliest)earliest=z.startTime;
      if(z.endTime>latest)latest=z.endTime;
    }
    timeline.domain(earliest,latest);
  }
  
  timeline.on("select",function(){
    pane.load(arguments[0].ticket.fullurl);
  })
  
  pane.on("filter",function(){
    browser.filterKeyword(arguments[0].keyword);
  })
  
  pane.on("resize",function(){
    timeline.padding([arguments[0].size,timeline.padding()[1]])
   // timeline.redraw();
  })
  pane.expand();
  return browser;
}
