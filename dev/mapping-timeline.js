
//var data = prepareData();
//var data1={};
//data1.earliest=data.earliest;
//data1.latest=data.latest;
//data1.links=data.links;
//data.links=[];
//data1.nodes=data.nodes.splice(70);
//data.links=[];

var viz = d3.select("#graph");
timeline = d3.timelineBrowser(viz);
timeline.add(prepareData());
timeline.pane.load("https://intranet.fungalgenomics.ca/intwiki/Ticket:PickyWiki");

//setTimeout(function(){timeline.add(prepareData())},1000);
//setTimeout("timeline.set(data)",4000);

