const genUUID = function genUUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
export function initZoomSteps(min = -1, max = 1, obj) {
    let zoomSteps = [];
    let _min = min * 10;
    let _max = max * 10;
    let _steps = Math.abs(Math.max(_min, _max) - Math.min(_min, _max));
    obj.maxZoom = _steps;
    for (let i = 1, v = _min; i <= _steps; i += 1, v += 1) {
        let e = Math.exp(v / 10);
        zoomSteps.push({ zoomIndex: i, zoomLevel: e });
    }
    return zoomSteps;
}
export { genUUID };
