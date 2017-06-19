

function smwAsk(query, callback) {
        var ask = 'https://intranet.fungalgenomics.ca/intwiki/api.php?action=ask&query=' + query + '|limit=500&format=json';
        $.getJSON(ask, callback);
}

function updateNodes(callback) {
        smwAsk('[[Category:Unresolved tickets]]|?Date created|?Date resolved|?Date required|?Ticket components', function(data) {
                $('#canvas').html('<img src="Loader.gif" alt="spinner" /> Loading map …');

                $.each(data.query.results, function(key, val) {
                        c = {};
			c.page = key;
			c.dateCreated = val.printouts['Date created'][0];
			c.dateRequired = val.printouts['Date required'][0];
			c.dateResolved = val.printouts['Date resolved'][0];
			c.components = [];
			$.each(val.printouts['Ticket components'], function(k, v) {
				c.components.push(v.fulltext);
			});

                        elements.push(c);
                        });

		console.log(elements);
		callback(elements);
        });
}


function getPage(page, oldid) {
return;
	var ask = 'http://www.genozymes-ge3ls.ca/wiki/' + page.replace(' ', '_') + '?action=render' + (oldid > 0 ? '&oldid=' + oldid : "");
	$.get(ask, function(data) {
		$('#contents').html(data);
		$('#contents').fadeIn();
		$('#contents').find('a').bind('click', function() { alert(JSON.stringify($(this))); return false });
	});
}


var elements = [];
var colors = ['#00A0B0', '#6A4A3C', '#CC333F', '#EB6841', '#EDC951', '#7DBE3C', '#000000'];
var graph = new Graph();

updateNodes(gotElements);
getPage('PickyWiki', '5531');

function gotElements(elements) {
var named = {};
var nodes = [];
$.each(elements, function(k, n) {
	nodes[k] = graph.newNode({keyid: n.keyid, pagename: n.pagename});
	named[n.pagename] = n;
});

$.each(elements, function(k, e) {
	n = nodes[k];
	$.each(e.links, function(j, ls) {
		$.each((""+ls).split(","), function(m, l) {
			if (named[l]) {
				n2 = nodes[named[l].keyid];
				var e = graph.newEdge(n, n2);
				e.data.stroke = colors[Math.floor(Math.random() * colors.length)];
			} else {
//				alert("no " + l + " from " + n.pagename);
			}
		});
	});
});


// below here is all springy specific -----------

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var width = canvas.width;
var height = canvas.height;
var zoom = 45.0;

var layout = new Layout.ForceDirected(graph, 500.0, 500.0, 0.5);


// calculate bounding box of graph layout.. with ease-in
var currentBB = layout.getBoundingBox();
var targetBB = {bottomleft: new Vector(-10, -10), topright: new Vector(10, 10)};

setInterval(function(){
	targetBB = layout.getBoundingBox()
	// current gets 20% closer to target every iteration
	currentBB = {
		bottomleft: currentBB.bottomleft.add( targetBB.bottomleft.subtract(currentBB.bottomleft)
			.divide(10)),
		topright: currentBB.topright.add( targetBB.topright.subtract(currentBB.topright)
			.divide(10))
	};
}, 10);

// convert to/from screen coordinates
toScreen = function(p) {
	var size = currentBB.topright.subtract(currentBB.bottomleft);
	var sx = p.subtract(currentBB.bottomleft).divide(size.x).x * width;
	var sy = p.subtract(currentBB.bottomleft).divide(size.y).y * height;

	return new Vector(sx, sy);
};

fromScreen = function(s) {
	var size = currentBB.topright.subtract(currentBB.bottomleft);
	var px = (s.x / width) * size.x + currentBB.bottomleft.x;
	var py = (s.y / height) * size.y + currentBB.bottomleft.y;

	return new Vector(px, py);
};


// half-assed drag and drop
var selected = null;
var nearest = null;
var dragged = null;

jQuery('#canvas').mousedown(function(e){
	var pos = jQuery(this).position();
	var p = fromScreen({x: e.pageX - pos.left, y: e.pageY - pos.top});
	selected = nearest =  layout.nearest(p);

	renderer.start();
});

jQuery('#canvas').mousemove(function(e){
	var pos = jQuery(this).position();
	var p = fromScreen({x: e.pageX - pos.left, y: e.pageY - pos.top});
	nearest = layout.nearest(p);

	if (dragged !== null)
	{
		dragged.point.p.x = p.x;
		dragged.point.p.y = p.y;
	} else if (selected !== null) {
		dragged = selected;
		dragged.oldm = dragged.point.m;
		dragged.olddata = dragged.node.data;
		dragged.node.data = jQuery.extend(true, {}, dragged.node.data); // deep copy
		dragged.point.m = 1000.0;
	}

	renderer.start();
});

jQuery(window).bind('mouseup',function(e){
	if (dragged !== null)
	{
		dragged.node.data = dragged.olddata;
	} else {
	$('#content').fadeOut();
getPage(selected.node.data.pagename);

}
selected = null;
	dragged = null;
});




var boxWidth = 100;
var boxHeight = 38;

var renderer = new Renderer(1, layout,
	function clear()
	{
		ctx.clearRect(0,0,width,height);

		ctx.lineWidth = 0.1;
		ctx.strokeStyle = "rgba(0,0,0,0.5)";

		// ctx.beginPath();
		// ctx.moveTo(toScreen(new Vector(-5,0)).x, toScreen(new Vector(-5,0)).y);
		// ctx.lineTo(toScreen(new Vector(5,0)).x, toScreen(new Vector(5,0)).y);
		// ctx.stroke();

		// ctx.beginPath();
		// ctx.moveTo(toScreen(new Vector(0,5)).x, toScreen(new Vector(0,5)).y);
		// ctx.lineTo(toScreen(new Vector(0,-5)).x, toScreen(new Vector(0,-5)).y);
		// ctx.stroke();
	},
	function drawEdge(edge, p1, p2)
	{
		var x1 = toScreen(p1).x;
		var y1 = toScreen(p1).y;
		var x2 = toScreen(p2).x;
		var y2 = toScreen(p2).y;

		var direction = new Vector(x2-x1, y2-y1);
		var normal = direction.normal().normalise();

		var from = graph.getEdges(edge.source, edge.target);
		var to = graph.getEdges(edge.target, edge.source);

		var total = from.length + to.length;
		var n = from.indexOf(edge);

		var spacing = 6.0;

		// Figure out how far off centre the line should be drawn
		var offset = normal.multiply(-((total - 1) * spacing)/2.0 + (n * spacing));

		var s1 = toScreen(p1).add(offset);
		var s2 = toScreen(p2).add(offset);

		var intersection = intersect_line_box(s1, s2, {x: x2-boxWidth/2.0, y: y2-boxHeight/2.0}, boxWidth, boxHeight);

		if (!intersection)
			intersection = s2;

		var stroke = typeof(edge.data.stroke) !== 'undefined' ? edge.data.stroke : "#000000";
		ctx.strokeStyle = stroke;

		var arrowWidth;
		var arrowLength;
		if (selected !== null && (selected.node === edge.source || selected.node === edge.target))
		{
			ctx.lineWidth = 5;
			arrowWidth = 7;
			arrowLength = 10;
		}
		else
		{
			ctx.lineWidth = 2;
			arrowWidth = 3;
			arrowLength = 8;
		}

		// line
		var lineEnd = intersection.subtract(direction.normalise().multiply(arrowLength * 0.5));

		ctx.beginPath();
		ctx.moveTo(s1.x, s1.y);
		ctx.lineTo(lineEnd.x, lineEnd.y);
		ctx.stroke();

		// arrow
		ctx.save();
		ctx.fillStyle = stroke;
		ctx.translate(intersection.x, intersection.y);
		ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
		ctx.beginPath();
		ctx.moveTo(-arrowLength, arrowWidth);
		ctx.lineTo(0, 0);
		ctx.lineTo(-arrowLength, -arrowWidth);
		ctx.lineTo(-arrowLength * 0.8, -0);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	},
	function drawNode(node, p)
	{
		var fill = typeof(node.data.fill) !== 'undefined' ? node.data.fill : "#FFFFFF";

		var s = toScreen(p);


		// box edge
		if (selected !== null && selected.node === node)
		{
			ctx.fillStyle = "#F2EFD9";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2.5;
		}
		else if (nearest !== null && nearest.node === node)
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 3;
		}
		else
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1.5;
		}

		ctx.save();
		ctx.shadowBlur = 5;
		ctx.shadowColor = '#000000';
		ctx.fillRect(s.x - boxWidth/2.0, s.y - boxHeight/2.0, boxWidth, boxHeight);
		ctx.restore();

		ctx.strokeRect(s.x - boxWidth/2.0, s.y - boxHeight/2.0, boxWidth, boxHeight);


		// clip drawing within rectangle
		ctx.save()
		ctx.beginPath();
		ctx.rect(s.x - boxWidth/2.0+2, s.y - boxHeight/2.0+2, boxWidth-4, boxHeight-4);
		ctx.clip();


		// render pagename
		if (typeof(node.data.pagename) !== 'undefined')
		{
			ctx.save();
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			ctx.font = "11px UniversUltraCn";
			ctx.shadowBlur = 0;
			ctx.shadowColor = '#FFFFFF';
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = -1;
			ctx.fillStyle = "#000000";
			ctx.fillText(node.data.pagename, s.x - boxWidth/2.0 + 28, s.y - boxHeight/2.0 + 7);
			ctx.restore();
		}

		ctx.restore()

	}
);

renderer.start();


// helpers for figuring out where to draw arrows
function intersect_line_line(p1, p2, p3, p4)
{
	var denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));

	// lines are parallel
	if (denom === 0) {
		return false;
	}

	var ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
	var ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;

	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return false;
	}

	return new Vector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
}

function intersect_line_box(p1, p2, p3, w, h)
{
	var tl = {x: p3.x, y: p3.y};
	var tr = {x: p3.x + w, y: p3.y};
	var bl = {x: p3.x, y: p3.y + h};
	var br = {x: p3.x + w, y: p3.y + h};

	var result;
	if (result = intersect_line_line(p1, p2, tl, tr)) { return result; } // top
	if (result = intersect_line_line(p1, p2, tr, br)) { return result; } // right
	if (result = intersect_line_line(p1, p2, br, bl)) { return result; } // bottom
	if (result = intersect_line_line(p1, p2, bl, tl)) { return result; } // left

	return false;
}
}


