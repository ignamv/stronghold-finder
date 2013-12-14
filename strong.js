function load() {
    canvas = document.getElementById("map");
    ctx = canvas.getContext("2d");
}

function deleteMeasurements() {
    var opts = document.getElementById('measurement_list');
    var selected = opts.selectedOptions;
    for(var ii=selected.length-1; ii>=0; ii--) {
        opts.removeChild(selected[ii]);
    }
}

function newMeasurementButton() {
    var x1 = parseFloat(document.getElementById('x1').value);
    var x2 = parseFloat(document.getElementById('x2').value);
    var y1 = parseFloat(document.getElementById('y1').value);
    var y2 = parseFloat(document.getElementById('y2').value);
    addMeasurement(x1,x2,y1,y2);
    refreshMap();
}

function addMeasurement(x1, x2, y1, y2) {
    var optionText = "("+x1+","+y1+") to ("+x2+","+y2+")";
    console.log('Added '+optionText);
    var option = document.createElement("option");
    option.appendChild(document.createTextNode(optionText));
    option.x1 = x1;
    option.x2 = x2;
    option.y1 = y1;
    option.y2 = y2;
    option.className = 'measurement';
    document.getElementById("measurement_list").appendChild(option);
}

function refreshMap() {
    var measurements = document.getElementsByClassName('measurement');
    console.log(canvas.width);
    console.log(canvas.height);
    ctx.clearRect(0,0,canvas.width, canvas.height)
    if(measurements.length < 2) {
        return;
    }
    // Find bounding rectangle
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for(var ii=0; ii<measurements.length; ii++) {
        var option = measurements[ii];
        minx = Math.min(minx,Math.min(option.x1,option.x2))
        miny = Math.min(miny,Math.min(option.y1,option.y2))
        maxx = Math.max(maxx,Math.max(option.x1,option.x2))
        maxy = Math.max(maxy,Math.max(option.y1,option.y2))
    }
    console.log('['+minx+','+maxx+']x['+miny+','+maxy+']');
    ctx.save();
    var scale = 1./Math.max((maxx-minx)/canvas.width,
                            (maxy-miny)/canvas.height);
    ctx.scale(scale, scale);
    ctx.lineWidth = 1./scale;
    ctx.translate(-minx, -miny);
    // Linear least squares problem comes down to a matrix equation
    // (A B)(x) = (E)
    // (B D)(y)   (F)
    var A=0,B=0,C=0,D=0,E=0,F=0;
    for(var ii=0; ii<measurements.length; ii++) {
        var curr = measurements[ii];
        var dirx = curr.x2-curr.x1;
        var diry = curr.y2-curr.y1;
        var norm = Math.sqrt(dirx*dirx+diry*diry);
        dirx /= norm;
        diry /= norm;
        ctx.beginPath()
        ctx.moveTo(curr.x1,curr.y1);
        ctx.lineTo(curr.x2,curr.y2);
        ctx.stroke();
        var arrowLength = 10/scale, arrowWidth = 5/scale;
        ctx.beginPath();
        ctx.moveTo(curr.x2,curr.y2);
        ctx.lineTo(curr.x2-arrowLength*dirx-arrowWidth*diry,
                   curr.y2-arrowLength*diry+arrowWidth*dirx);
        ctx.lineTo(curr.x2-arrowLength*dirx+arrowWidth*diry,
                   curr.y2-arrowLength*diry-arrowWidth*dirx);
        ctx.lineTo(curr.x2,curr.y2);
        ctx.fill();
        // Build up normal equation matrix
        A += diry*diry;
        B += -dirx*diry;
        D += dirx*dirx;
        var cross = curr.x1*diry-curr.y1*dirx;
        E += diry*cross;
        F += -dirx*cross;
    }
    // Solve least squares problem
    var determinant = A*D-B*B;
    if(determinant < 1e-9) {
        // TODO: add proper condition check
        console.log('No solution');
    } else {
        var solx = (E*D-B*F)/determinant;
        var soly = (A*F-B*E)/determinant;
        console.log('Solution at ('+solx+','+soly+')');
        var crossSize = 5 / scale;
        ctx.beginPath();
        ctx.moveTo(solx-crossSize,soly);
        ctx.lineTo(solx+crossSize,soly);
        ctx.moveTo(solx,-crossSize+soly);
        ctx.lineTo(solx,+crossSize+soly);
        ctx.stroke();
    }
    ctx.restore();
}

function data() {
    nMeasurements = 8;
    //var centerX = Math.random()*500-250;
    //var centerY = Math.random()*500-250;
    var centerX = 0;
    var centerY = 0;
    var noise = 50;
    for(var ii=0; ii<nMeasurements; ii++) {
        //x1 = Math.random()*1000-500;
        //y1 = Math.random()*1000-500;
        x1 = Math.cos(ii*2.*Math.PI/nMeasurements)*1000;
        y1 = Math.sin(ii*2.*Math.PI/nMeasurements)*1000;
        x2 = x1 * 0.5 + noise * (Math.random()-0.5);
        y2 = y1 * 0.5 + noise * (Math.random()-0.5);
        addMeasurement(Math.round(x1),Math.round(x2),
                       Math.round(y1),Math.round(y2));
    }
    refreshMap();
}
