const _river = {
    lineWidth: 1.25,
    strokeStyle: "rgb(10, 10, 240)"
};
const _lake = {
    fillStyle: "rgb(10, 10, 240)"
};
const _fir = {
    lineWidth: 2,
    strokeStyle: 'rgb(240, 0, 0)',
    fillStyle: 'rgb(16, 22, 36)'
};
const cross = {
    xAxis: 510000,
    yAxis: 510000,
    lineWidth: .35,
    strokeStyle: 'rgb(223, 223, 223)',
};
const circles = [
    {
        x: 0,
        y: 0,
        r: 5000,
        s: 'rgb(223, 223, 223)',
        f: 'rgb(223, 223, 223, 0)',
        l: .15
    },{
        x: 0,
        y: 0,
        r: 50000,
        s: 'rgb(223, 223, 223)',
        f: 'rgb(223, 223, 223, 0)',
        l: .125
    },{
        x: 0,
        y: 0,
        r: 100000,
        s: 'rgb(223, 223, 223)',
        f: 'rgb(223, 223, 223, 0)',
        l: .15
    },{
        x: 0,
        y: 0,
        r: 250000,
        s: 'rgb(223, 223, 223)',
        f: 'rgb(223, 223, 223, 0)',
        l: .125
    },{
        x: 0,
        y: 0,
        r: 500000,
        s: 'rgb(223, 223, 223)',
        f: 'rgb(223, 223, 223, 0)',
        l: .15
    }
]
let maps, canvas, ctx, lastX, lastY, centerX, centerY, scale = 1, mapres;
self.addEventListener('message', function(e) {
    function clearCTX(ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        ctx.restore();
    }
    function drawBASE(ctx, maps) {
        // demo draw on base layer:
        // console.log(maps[0].name)
        if (typeof maps !== 'undefined') {
            self.maps = Object.assign([], maps);
            maps.forEach(map => {
                // draw border and fir first
                let border = map.border;
                let strokeStyle = _fir.strokeStyle;  // fir border color
                let fillStyle   = _fir.fillStyle;      // fir content color
                let borderWidth = _fir.lineWidth / self.scale;   // border width
                ctx.save();
                ctx.fillStyle = fillStyle;
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = borderWidth;
                if (border && Array.isArray(border)) {
                    border.forEach((p, i) => {
                        let lat, lon, y, x;
                        if (i === 0) {
                            ctx.beginPath();
                            ctx.moveTo(p[2], -p[3]);
                        } else {
                            ctx.lineTo(p[2], -p[3]);
                        }
                    });
                    ctx.lineTo(border[0][2], -border[0][3]);
                    // ctx.closePath();
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                // draw lakes
                let lakes = map.lakes;
                // console.log({lakes});
                if (lakes && Array.isArray(lakes)) {
                    ctx.save();
                    ctx.fillStyle = _lake.fillStyle;
                    lakes.forEach(l => {
                        let pts = l.points;
                        if (pts && Array.isArray(pts)) {
                            pts.forEach((p, i) => {
                                if (i === 0) {
                                    ctx.beginPath();
                                    ctx.moveTo(p.x, -p.y);
                                } else {
                                    ctx.lineTo(p.x, -p.y);
                                }
                            });
                            ctx.lineTo(pts[0].x, -pts[0].y);
                            ctx.fill();
                        }
                    })
                    ctx.restore();
                }
                // rivers
                let rivers = map.rivers;
                // console.log({rivers});
                if (rivers && Array.isArray(rivers)) {
                    ctx.save();
                    ctx.strokeStyle = _river.strokeStyle;
                    ctx.lineWidth = _river.lineWidth;
                    rivers.forEach(r => {
                        let pts = r.points;
                        if (pts && Array.isArray(pts)) {
                            pts.forEach((p, i) => {
                                if (i === 0) {
                                    ctx.beginPath();
                                    ctx.moveTo(p.x, -p.y);
                                } else {
                                    ctx.lineTo(p.x, -p.y);
                                }
                            });
                            // ctx.closePath();
                            ctx.stroke();
                        }
                    });
                    ctx.restore();
                }
            });
        }
        // a cross in the middle of the canvas
        ctx.save();
        ctx.lineWidth = cross.lineWidth / self.scale;
        ctx.strokeStyle = cross.strokeStyle;
        // vertical axis
        ctx.beginPath();
        ctx.moveTo(0, cross.yAxis * self.mapres);
        ctx.lineTo(0, -cross.yAxis * self.mapres);
        ctx.stroke();
        // horizontal axis
        ctx.beginPath();
        ctx.moveTo(cross.xAxis * self.mapres, 0);
        ctx.lineTo(-cross.xAxis * self.mapres, 0);
        ctx.stroke();
        ctx.restore();
        // concentric circles
        ctx.save();
        ctx.fillStyle = "rgba(240, 240, 0, .25)";
        ctx.font = `bold italic ${11 / self.scale}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        // ctx.fillText("050 km", 100, 0);
        // ctx.fillText("050 km", -100, 0);
        // ctx.fillText("100 km", 200, 0);
        // ctx.fillText("100 km", -200, 0);
        // ctx.fillText("250 km", 500, 0);
        // ctx.fillText("250 km", -500, 0);
        // ctx.fillText("500 km", 1000, 0);
        // ctx.fillText("500 km", -1000, 0);
        circles.forEach(c => {
            let xr = -c.r * self.mapres;
            let xl = c.r * self.mapres;
            let yt = xl;
            let yb = xr;
            if (Math.abs(c.r / 1000 >= 50)) {
                let text = `${c.r / 1000 + 0.5 >> 0} km`;
                ctx.fillText(text, xr, c.y);
                ctx.fillText(text, xl, c.y);
                ctx.fillText(text, c.x, yt);
                ctx.fillText(text, c.x, yb);
            }
        });
        circles.forEach(c => {
            ctx.beginPath();
            ctx.lineWidth = c.l * self.scale;
            ctx.strokeStyle = c.s;
            ctx.fillStyle = c.f;
            ctx.arc(c.x, c.y, c.r * self.mapres, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
        ctx.restore();
        // and concentric circles 4 times...
    }
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
        drawBASE(self.ctx, self.maps);
        self.postMessage({
            msg_type: 'update_ready'
        });
    }
    if (e.data.type === 'scale') {
        // console.log({scale: e.data.scale});
        // self.ctx.save();
        self.lastX = e.data.lastX;
        self.lastY = e.data.lastY;
        self.scale = e.data.scale;
        self.ctx.translate(self.lastX, self.lastY);
        self.ctx.scale(e.data.scale, e.data.scale);
        self.ctx.translate(-self.lastX, -self.lastY);
        // self.ctx.restore();
        self.postMessage({
            msg_type: 'scale_ready'
        });
    }
    if (e.data.type === 'draw') {
        const maps = JSON.parse(e.data.maps);
        self.maps = Object.assign([], maps);
        self.ctx.save();
        clearCTX(self.ctx);
        drawBASE(self.ctx, maps);
        self.ctx.restore();
        self.postMessage({
            msg_type: 'update_finished'
        });
    }
});