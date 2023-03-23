let mapObj, canvas, ctx, lastX, lastY, centerX, centerY, scale = 1, mapres;
const _rwy = {
    lineWidth: 2,
    strokeStyle: 'rgb(221, 221, 221)'
};
const _cp = {
    'A' : {
        lineWidth: 1,
        fillStyle: 'rgb(0, 225, 255)',
        font: ' 12px monospace',
        baseLine: 'hanging',
        align: 'left',
        dim: 5
    },
    'C' : {
        lineWidth: 1,
        fillStyle: 'rgb(218, 218, 218)',
        font: '10px monospace',
        baseLine: 'hanging',
        align: 'left',
        dim: 7,
    },
    'N' : {
        lineWidth: 1,
        fillStyle: 'rgb(0, 255, 115)',
        font: '10px monospace',
        baseLine: 'hanging',
        align: 'left',
        dim: 8,
    }
};
self.addEventListener('message', function(e) {
    function clearCTX(ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        ctx.restore();
    }
    function drawCPoint(ctx, x, y, dim) {
        let triangle = {
            x1: x + dim / 2,
            y1: y,
            // 2*PI = 180, 180 / 3 = 60 - the angles 60 degrees, all sides equal, the rotation angle PI = 90 degrees CCW
            x2: x + dim / 2 * Math.cos((((2 * Math.PI) / 3))),
            y2: y + dim / 2 * Math.sin((((2 * Math.PI) / 3))),
            x3: x + dim / 2 * Math.cos((((4 * Math.PI) / 3))),
            y3: y + dim / 2 * Math.sin((((4 * Math.PI) / 3)))
        }
        ctx.save();
        ctx.strokeStyle = _cp['C'].fillStyle;
        ctx.lineWidth = _cp['C'].lineWidth / self.scale;
        ctx.translate(x, -y);
        ctx.rotate(((3 * Math.PI) / 2));    // !!! rotata |> to /\ !!!
        ctx.translate(-x, y);
        ctx.beginPath();
        ctx.moveTo(triangle.x1, -triangle.y1);
        ctx.lineTo(triangle.x2, -triangle.y2);
        ctx.lineTo(triangle.x3, -triangle.y3);
        ctx.lineTo(triangle.x1, -triangle.y1);
        ctx.stroke();
        ctx.restore();
    }
    function drawNPoint(ctx, x, y, dim) {
        let triangle = {
            x1: x + dim / 2,
            y1: y,
            // 2*PI = 180, 180 / 3 = 60 - the angles 60 degrees, all sides equal, the rotation angle PI = 90 degrees CCW
            x2: x + dim / 2 * Math.cos((((2 * Math.PI) / 3))),
            y2: y + dim / 2 * Math.sin((((2 * Math.PI) / 3))),
            x3: x + dim / 2 * Math.cos((((4 * Math.PI) / 3))),
            y3: y + dim / 2 * Math.sin((((4 * Math.PI) / 3)))
        }
        // circle
        ctx.beginPath();
        ctx.strokeStyle = _cp['N'].fillStyle;
        ctx.lineWidth = _cp['N'].lineWidth / self.scale;
        ctx.arc(x, -y, _cp['N'].dim / 2 / self.scale, 0, 2 * Math.PI);
        ctx.stroke();
        // triangle inside the circle
        ctx.save();
        // ctx.strokeStyle = _cp['C'].fillStyle;
        // ctx.lineWidth = _cp['C'].lineWidth / self.scale;
        ctx.translate(x, -y);
        ctx.rotate(((3 * Math.PI) / 2));    // !!! rotata |> to /\ !!!
        ctx.translate(-x, y);
        ctx.beginPath();
        ctx.lineWidth = (_cp['N'].lineWidth - _cp['N'].lineWidth / 4) / self.scale; // triangle line with is 75% of the circle's line with
        ctx.moveTo(triangle.x1, -triangle.y1);
        ctx.lineTo(triangle.x2, -triangle.y2);
        ctx.lineTo(triangle.x3, -triangle.y3);
        ctx.lineTo(triangle.x1, -triangle.y1);
        ctx.stroke();
        ctx.restore();
    }
    function drawAPoint(ctx, x, y, dim) {
        let d = dim/2 + 0.5 >> 0;
        ctx.beginPath();
        ctx.strokeStyle = _cp['A'].fillStyle;
        ctx.lineWidth = _cp['A'].lineWidth / self.scale;
        ctx.moveTo(x-d, -y+d);    // top left
        ctx.lineTo(x+d, -y+d);    // top right
        ctx.lineTo(x+d, -y-d);   // bottom right
        ctx.lineTo(x-d, -y-d);   // bottom left
        ctx.lineTo(x-d, -y+d);
        ctx.stroke();
    }
    function draw(ctx, mapObj) {
        self.mapObj = mapObj;
        if (mapObj && Array.isArray(mapObj)) {
            mapObj.forEach(mo => {
                // airport strips
                let airports = mo.airports;
                if (airports && Array.isArray(airports)) {
                    ctx.save();
                    ctx.strokeStyle = _rwy.strokeStyle;
                    ctx.lineWidth   = _rwy.lineWidth / self.scale;
                    airports.forEach(a => {
                        let rwys = a.rwys;
                        if (rwys && Array.isArray(rwys)) {
                            rwys.forEach(r => {
                                let coords = r.coords;
                                // console.log({id: r.id, coords});
                                if (coords && Array.isArray(coords)) {
                                    coords.forEach((c, i) => {
                                        if (i === 0) {
                                            ctx.beginPath();
                                            ctx.moveTo(c.x, -c.y);
                                        } else {
                                            ctx.lineTo(c.x, -c.y);
                                        }
                                    });
                                    ctx.stroke();
                                }
                            });
                        }
                    });
                    ctx.restore();
                }
                // characteristic points
                let charpoints = mo.charpoints;
                if (charpoints && Array.isArray(charpoints)) {
                    ctx.save();
                    ctx.fillStyle = _cp.fillStyle;
                    charpoints.forEach(c => {
                        if (c.type === 'A') {
                            ctx.font = _cp.font;
                            ctx.fillStyle = _cp['A'].fillStyle;
                            ctx.strokeStyle = _cp['A'].fillStyle;
                            ctx.textAlign = _cp['A'].align;
                            ctx.textBaseline = _cp['A'].baseLine;
                            ctx.fillText(c.name, c.x + _cp['A'].dim / self.scale, -c.y + _cp['A'].dim / self.scale);
                            // symbol
                            drawAPoint(ctx, c.x, c.y, _cp['A'].dim / self.scale);
                        } else if (c.type === 'C') {
                            ctx.font = _cp.font;
                            ctx.fillStyle = _cp['C'].fillStyle;
                            ctx.textAlign = _cp['C'].align;
                            ctx.textBaseline = _cp['C'].baseLine;
                            ctx.fillText(c.name, c.x + _cp['C'].dim / 2 / self.scale, -c.y + _cp['C'].dim / 2 / self.scale);
                            drawCPoint(ctx, c.x, c.y, _cp['C'].dim);
                        } else if (c.type === 'N') {
                            ctx.font = _cp.font;
                            ctx.fillStyle = _cp['N'].fillStyle;
                            ctx.textAlign = _cp['N'].align;
                            ctx.textBaseline = _cp['N'].baseLine;
                            ctx.fillText(c.name, c.x + _cp['C'].dim / self.scale, -c.y - _cp['C'].dim / self.scale);
                            drawNPoint(ctx, c.x, c.y, _cp['N'].dim);
                        }
                    });
                    ctx.restore();
                }
            });
        }
        // characteristic point symbols regarding to the type of characteristic point
        // characteristic points
    }
    // message handlers
    if (e.data.type === 'canvas') {
        // console.log(e.data);
        self.centerX = e.data.centerX;
        self.centerY = e.data.centerY;
        self.scale = e.data.scale;
        self.canvas = e.data.offscreen;
        self.canvas.width = e.data.width;
        self.canvas.height = e.data.height;
        self.ctx = self.canvas.getContext('2d');
        self.ctx.scale(self.scale, self.scale);
        self.ctx.translate(self.centerX, self.centerY);
        self.mapres = e.data.mapres;
        self.postMessage({
            msg_type: 'update_ready'
        });
    }
    if (e.data.type === 'translate') {
        self.lastX = e.data.lastX;
        self.lastY = e.data.lastY;
        self.ctx.translate(self.lastX, self.lastY);
        clearCTX(self.ctx);
        draw(self.ctx, self.mapObj);
        self.postMessage({
            msg_type: 'update_ready'
        });
    }
    if (e.data.type === 'scale') {
        // console.log({scale: e.data.scale});
        self.lastX = e.data.lastX;
        self.lastY = e.data.lastY;
        self.scale = e.data.scale;
        self.ctx.translate(self.lastX, self.lastY);
        self.ctx.scale(e.data.scale, e.data.scale);
        self.ctx.translate(-self.lastX, -self.lastY);
        clearCTX(self.ctx);
        draw(self.ctx, self.mapObj);
        self.postMessage({
            msg_type: 'scale_ready'
        });
    }
    if (e.data.type === 'draw') {
        // console.log(e.data);
        const mapObj = e.data.maps;
        self.mapObj = Object.assign([], mapObj);
        self.ctx.save();
        clearCTX(self.ctx);
        draw(self.ctx, mapObj);
        self.ctx.restore();
        self.postMessage({
            msg_type: 'update_finished'
        });
    }
});