
/*var data = prepareData();
var data1={};
data1.earliest=data.earliest;
data1.latest=data.latest;
data1.links=data.links;
//data.links=[];
//data1.nodes=data.nodes.splice(70);
//data.links=[];
*/

var viz = d3.select("#graph");
//console.info(viz)

timeline = d3.timelineBrowser(viz);

timeline.add(prepareData());
timeline.lineHeight(25);
//timeline.pane.load("http://stickywiki.genozymes-ge3ls.ca/wiki/StickyWiki/2012/April")
//listenForChanges();


//setTimeout("timeline.set(data)",4000);

