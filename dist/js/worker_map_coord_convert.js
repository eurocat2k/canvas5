// locals
let maps = [], stereo;
//
self.onmessage = function(e) {
    const msg_type = e.data.type;
    // console.log({data: e.data});
    switch(msg_type) {
        case 'convert':
            stereo = e.data.stereo;
            self.maps = e.data.maps;
            self.maps.forEach(map => {
                console.log({map, stereo});
                // convert border coords to XY
                if (map.border && Array.isArray(map.border)) {
                    map.border.forEach((p, idx) => {
                        let lon, lat, xy;
                        // xy = stereo(p[0], p[1]);
                        // map.border[idx].push(xy.x);
                        // map.border[idx].push(xy.y);
                        console.log({invert: JSON.stringify(stereo)});
                    });
                }
            });
            break;
    }
    self.postMessage({
        type: 'conversion_finished',
        maps: self.maps
    })
}
self.onerror = function(e) {

}