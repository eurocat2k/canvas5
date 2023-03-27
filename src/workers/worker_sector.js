let maps, canvas, ctx, lastX, lastY, centerX, centerY, scale = 1, role, mapres;
self.addEventListener('message', function(e) {
    function clearCTX(ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        ctx.restore();
    }
    function draw(ctx, sectors, role) {
        let context = ctx;
        ctx.save();
        ctx.lineWidth = 1 / self.scale;
        ctx.strokeStyle = 'white';
        try {
            if (sectors && Array.isArray(sectors)) {
                sectors.forEach(s => {
                    // console.log({s});
                    let fp;
                    s.forEach((p, i) => {
                        console.log({p});
                        if (i === 0) {
                            fp = Object.assign({}, p);
                            context.beginPath();
                            context.moveTo(p.x, p.y);
                        } else {
                            context.lineTo(p.x, p.y);
                        }
                    });
                    // context.lineTo(fp.x, fp.y);
                    context.stroke();
                })
                // console.log({sectors,role});
            }   
        } catch (error) {
            console.error;
        }
        ctx.restore();
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
        self.sectors = e.data.sectors;
        self.postMessage({
            msg_type: 'update_ready'
        });
    }
    if (e.data.type === 'translate') {
        self.lastX = e.data.lastX;
        self.lastY = e.data.lastY;
        self.ctx.translate(self.lastX, self.lastY);
        clearCTX(self.ctx);
        draw(self.ctx, maps, role);
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
    if (e.data.type === 'clear') {
        // maps = e.data.maps;
        role = e.data.role;
        maps = Object.assign([], e.data.maps);
        self.ctx.save();
        clearCTX(self.ctx);
        self.ctx.restore();
        self.postMessage({
            msg_type: 'clear_finished'
        });
    }
    if (e.data.type === 'draw') {
        maps = JSON.parse(e.data.maps);
        role = e.data.role;
        self.sectors = Object.assign([], maps);
        self.ctx.save();
        clearCTX(self.ctx);
        draw(self.ctx, maps, role);
        self.ctx.restore();
        self.postMessage({
            msg_type: 'update_finished'
        });
    }
});