
var data = prepareData();
var data1={};
data1.earliest=data.earliest;
data1.latest=data.latest;
data1.links=data.links;
//data.links=[];
//data1.nodes=data.nodes.splice(70);
//data.links=[];

var viz = d3.select("#graph");
timeline = d3.timelineBrowser(viz);
timeline.padding([30,0]).add(data);
var bool=true;
function randLetter(){var alph="abcdefghijklmnopqrstuvwxyz"; return alph.charAt(Math.floor(Math.random()*26));}
function iter(){timeline.filterKeyword(randLetter()); bool=!bool;;setTimeout(function(){timeline.filter()},2000)}

setInterval(iter,4000)
