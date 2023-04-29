import { genUUID, initZoomSteps } from '../utils/index';
import Canvas from '../canvas';
import $ from 'jquery';
import { jsStereo } from '../stereo';
import { inRange, sortedLastIndex } from 'lodash';
import { Config } from '../config';
// UI helpers
/**
 * @name onMouseDown
 * @param {Event} ev
 */
function onMouseDown(ev) {
    let self = this;
    // console.log(`Mouse down event detected...`);
    self._isDragging = true;
    self._dragStartPosition = Canvas.getTransformedPoint(self.ctx, ev.offsetX, ev.offsetY);
    ev.preventDefault();
}
/**
 * @name onMouseUp
 * @param {Event} ev
 */
function onMouseUp(ev) {
    let self = this;
    // console.log(`Mouse up event detected...`);
    self._isDragging = false;
    ev.preventDefault();
}
/**
 * @name onMouseMove
 * @param {Event} ev
 */
function onMouseMove(ev) {
    let self = this;
    self._currentTransformedCursor = Canvas.getTransformedPoint(self.ctx, ev.offsetX, ev.offsetY);
    if (self._isDragging) {
        let tx = self._currentTransformedCursor.x - self._dragStartPosition.x;
        let ty = self._currentTransformedCursor.y - self._dragStartPosition.y;
        self.ctx.translate(tx, ty);
        // call redraw base layer
        window.requestAnimationFrame(function() {
            self._baseWorker.postMessage({
                type: 'translate',
                lastX: tx,
                lastY: ty,
                scale: self.scale
            });
        });
        // redraw characteristic points layer
        window.requestAnimationFrame(function() {
            self._sectorWorker.postMessage({
                type: 'translate',
                lastX: tx,
                lastY: ty,
                scale: self.scale
            });
        });
        // redraw characteristic points layer
        window.requestAnimationFrame(function() {
            self._charWorker.postMessage({
                type: 'translate',
                lastX: tx,
                lastY: ty,
                scale: self.scale
            });
        });
    }
    // update infotab
    if (self._infopad) {
        self._infopad.mouseX.innerHTML = ev.offsetX.toString().padStart(4, "0");
        self._infopad.mouseY.innerHTML = ev.offsetY.toString().padStart(4, "0");
        self._infopad.canvasX.innerHTML = self._currentTransformedCursor.x;
        self._infopad.canvasY.innerHTML = -self._currentTransformedCursor.y;    // !!!swap Y axis!!!
        self._infopad.worldX.innerHTML = `${self._currentTransformedCursor.x / self._map_resolution} m`;
        self._infopad.worldY.innerHTML = `${-self._currentTransformedCursor.y / self._map_resolution} m`;
    }
    ev.preventDefault();
}
/**
 * @name onMouseOut
 * @param {Event} ev
 */
function onMouseOut(ev) {
    let self = this;
    // console.log(`Mouse out event detected...`);
    self._isDragging = false;
    ev.preventDefault();
}
/**
 * @name onMouseWheel
 * @param {Event} ev
 */
function onMouseWheel(ev) {
    let self = this;
    console.log(`Mouse wheel event detected...`);
    let tmpIndex = -1;
    let minIndex = -1;  // using lodash inRange requires extend bundaries to include lower and upper values of the boundaries
    let maxIndex = self._options.scales.length;
    let currentZoomIndex = self._options.scales.findIndex(s => s.sel === true);
    const zoom = ev.deltaY < 0 ? 1.1 : 0.9;
    if (ev.wheelDelta < 0) {
        if ((currentZoomIndex - 1) > 0) {
            self._options.scales[currentZoomIndex].sel = false;
            self._options.scales[currentZoomIndex - 1].sel = true;
            self._baseWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
            self._sectorWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
            self._charWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
        }
        console.log(`Zoom out...`);
    } else {
        if ((currentZoomIndex + 1) < maxIndex) {
            self._options.scales[currentZoomIndex].sel = false;
            self._options.scales[currentZoomIndex + 1].sel = true;
            self._baseWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
            self._sectorWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
            self._charWorker.postMessage({
                type: 'scale',
                scale: zoom,
                lastX: self._currentTransformedCursor.x,
                lastY: self._currentTransformedCursor.y,
            });
        }
        console.log(`Zoom in...`);
    }
    ev.preventDefault();
}
// UI class
export class UI {
    /**
     *
     * @param {Object} options see below generic options:
     *      - stepSize    {Number} unit step between adjacent scale factors in range of min percentage and max percentage, default 10
     *
     *      - minPercent  {Number} minimum scale percentage - 100 is the normal zoom - below 100 makes zoom out, above 100 makes zoom in effect
     *
     *      - maxPercent  {Number} maximum scale percentage - 100 is the normal zoom - below 100 makes zoom out, above 100 makes zoom in effect
     *
     *      - minScale    {Number} minimum scale factor
     *
     *      - maxScale    {Number} maximum scale falctor
     *
     *      - id          {String} id string of the UI instance
     */
    constructor(options = {}) {
        this._options = Object.assign({}, options);
        this._id = `UI-${genUUID()}`;
        this.view;
        this._busy = false;
        this._isDragging = false;
        this._dragStartPosition = { x: 0, y: 0 };
        this._currentTransformedCursor;
        this._onMouseDown  = onMouseDown.bind(this);
        this._onMouseMove  = onMouseMove.bind(this);
        this._onMouseUp    = onMouseUp.bind(this);
        this._onMouseUp    = onMouseOut.bind(this);
        this._onMouseWheel = onMouseWheel.bind(this);
        this._stereo       = new jsStereo({
            SYS_CENTER_LAT: 47.4452777777778,
            SYS_CENTER_LON: 19.2322222222222
        });
        this._map_resolution = Config.ui.map_resolution;    // 1 pixel 500 meters
        self._maps = [];
        self._sectors = [];
        self._tracks = [];
        // info pad
        this._infopad = {
            div: $.find('div.infotab')[0],
            mouseX: $.find('div#mx')[0],
            mouseY: $.find('div#my')[0],
            canvasX: $.find('div#cx')[0],
            canvasY: $.find('div#cy')[0],
            worldX: $.find('div#wx')[0],
            worldY: $.find('div#wy')[0]
        };
        this._xform;
        this._ctx;
        this._canvas;
        this._maxZoom;
        this._zoomIndex;
        this._init();
    }
    _init() {
        let self = this;
        this._options.layers = [...$.find('canvas')];
        // init scales
        // this._options.scales = this._init_scales();    // setup scale values in range from min to max scale with 'fixed' values calculated by the method using logarithmic function
        this._options.scales = initZoomSteps(Config.ui.ZOOM_RANGE_MIN, Config.ui.ZOOM_RANGE_MAX, self);
        this._zoomIndex = this._options.scales.find(z => z.zoomLevel === 1).zoomIndex;
        // initialize top layer
        this._parent = document.querySelector('div.wrapper');
        this._canvas = document.querySelector('canvas#top');
        this._canvas.width = this._parent.offsetWidth;
        this._canvas.height = this._parent.offsetHeight;
        this._ctx = this._canvas.getContext('2d');
        Canvas.trackTransforms(this._ctx);
        this._ctx.translate((((this._canvas.width / 2) + 0.5) >> 0), (((this._canvas.height / 2) + 0.5) >> 0));
        this._xform = this._ctx.getTransform();
        console.log(self._canvas.width, self._canvas.height);
        // panning event handlers
        // mouse down - for panning
        this._canvas.addEventListener('mousedown', this._onMouseDown, false);
        // mouse move - during panning or not panning
        this._canvas.addEventListener('mousemove', this._onMouseMove, false);
        // mouse up - detect end of panning of mouse move was occurred during the panning
        this._canvas.addEventListener('mouseup', this._onMouseUp, false);
        // mouse out - detect mouse pointer leaves top canvas region
        this._canvas.addEventListener('mouseout', this._onMouseUp, false);
        // zooming event handlers
        this._canvas.addEventListener('wheel', this._onMouseWheel, true);
        // get base layer - not interactive layer and send to the worker thread
        this._baseWorker = new Worker('js/worker_base.js');
        this._charWorker = new Worker('js/worker_characteristic.js');
        this._sectorWorker = new Worker('js/worker_sector.js')
        this._trackWorker = new Worker('js/worker_track.js')
        this._base = document.querySelector('canvas#base');
        this._sector = document.querySelector('canvas#sector');
        this._characteristic = document.querySelector('canvas#characteristic');
        this._track = document.querySelector('canvas#track');
        let offscreen = this._base.transferControlToOffscreen();
        let offscreen01 = this._characteristic.transferControlToOffscreen();
        let offscreen02 = this._sector.transferControlToOffscreen();
        let offscreen03 = this._track.transferControlToOffscreen();
        // this._zoomIndex = self._options.scales.find(s => s.zoomLevel === 1).zoomIndex;
        this._zoomIndex = 28;
        this._baseWorker.postMessage({
            type: 'canvas',
            offscreen,
            width: self._canvas.width,
            height: self._canvas.height,
            scale: self._xform.a,                   // or d - they shall be the same and common signed as well
            centerX: self._xform.e,         // transform X
            centerY: self._xform.f,         // transform Y
            mapres: self._map_resolution    // map resolutions: 1 pixel equals 1 / map resolution meters
        }, [offscreen]);
        this._charWorker.postMessage({
            type: 'canvas',
            offscreen: offscreen01,
            width: self._canvas.width,
            height: self._canvas.height,
            scale: self._xform.a,                   // or d - they shall be the same and common signed as well
            centerX: self._xform.e,         // transform X
            centerY: self._xform.f,         // transform Y
            mapres: self._map_resolution    // map resolutions: 1 pixel equals 1 / map resolution meters
        }, [offscreen01]);
        this._sectorWorker.postMessage({
            type: 'canvas',
            offscreen: offscreen02,
            width: self._canvas.width,
            height: self._canvas.height,
            scale: self._xform.a,                   // or d - they shall be the same and common signed as well
            centerX: self._xform.e,         // transform X
            centerY: self._xform.f,         // transform Y
            mapres: self._map_resolution,    // map resolutions: 1 pixel equals 1 / map resolution meters
            sectors: self._sectors
        }, [offscreen02]);
        this._trackWorker.postMessage({
            type: 'canvas',
            offscreen: offscreen03,
            width: self._canvas.width,
            height: self._canvas.height,
            scale: self._xform.a,                   // or d - they shall be the same and common signed as well
            centerX: self._xform.e,         // transform X
            centerY: self._xform.f,         // transform Y
            mapres: self._map_resolution    // map resolutions: 1 pixel equals 1 / map resolution meters
        }, [offscreen03]);
        //
        this._baseWorker.onmessage = function(e) {
            const msg_type = e.data.msg_type;
            switch(msg_type) {
                case 'update_ready':
                    if (!this._busy) {
                        // console.log(`Ready to draw...`);
                        this._busy = true;
                        requestAnimationFrame(function() {
                            self._baseWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._firs),
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                            });
                        });
                        requestAnimationFrame(function() {
                            self._sectorWorker.postMessage({
                                type: 'clear',
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                            });
                            self._sectorWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._sectors.find(s => s.id === 'TWR').points),
                                role: 'ALL',
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                            });
                        });
                        requestAnimationFrame(function() {
                            self._charWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._cpoints),
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                            });
                        });
                    }
                    break;
                case 'update_finished':
                    if (this._busy) {
                        this._busy = false;
                    }
                    break;
                case 'scale_ready':
                    this._busy = true;
                        requestAnimationFrame(function() {
                            self._baseWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._firs),
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                                lastX: self._currentTransformedCursor.x,
                                lastY: self._currentTransformedCursor.y,
                                mapres: self._map_resolution
                            });
                        });
                        requestAnimationFrame(function() {
                            self._sectorWorker.postMessage({
                                type: 'clear',
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                                lastX: self._currentTransformedCursor.x,
                                lastY: self._currentTransformedCursor.y,
                                mapres: self._map_resolution
                            });
                            self._sectorWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._sectors.find(s => s.id === 'TWR').points),
                                role: 'ALL',
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                                lastX: self._currentTransformedCursor.x,
                                lastY: self._currentTransformedCursor.y,
                                mapres: self._map_resolution
                            });
                        });
                        requestAnimationFrame(function() {
                            self._charWorker.postMessage({
                                type: 'draw',
                                maps: JSON.stringify(self._cpoints),
                                scale: self._options.scales[self.zoomIndex-1].zoomLevel,
                                lastX: self._currentTransformedCursor.x,
                                lastY: self._currentTransformedCursor.y,
                                mapres: self._map_resolution
                            });
                        });
                    break;
                default:
                    break;
            }
        }
        // map coords converter worker
        // get map data from map.json
        $.getJSON("data/map.json", function(data) {
            self._maps = Object.assign([], data);
            self._maps.forEach((map) => {
                // FIR
                if (map.border && Array.isArray(map.border)) {
                    map.border.forEach((p, i) => {
                        let xy = self._stereo.forward(p[1], p[0]);
                        p.push(xy.x * self._map_resolution);
                        p.push(xy.y * self._map_resolution);
                        map.border[i] = p;
                    })
                }
                // LAKES
                if (map.lakes && Array.isArray(map.lakes)) {
                    map.lakes.forEach(l => {
                        let pts = l.points;
                        if (pts && Array.isArray(pts)) {
                            pts.forEach((p, i) => {
                                let xy = self._stereo.forward(p.lat, p.lon);
                                pts[i].x = xy.x * self._map_resolution;
                                pts[i].y = xy.y * self._map_resolution;
                            });
                        }
                    });
                }
                // RIVERS
                if (map.rivers && Array.isArray(map.rivers)) {
                    map.rivers.forEach(r => {
                        let pts = r.points;
                        if (pts && Array.isArray(pts)) {
                            pts.forEach((p, i) => {
                                let xy = self._stereo.forward(p.lat, p.lon);
                                pts[i].x = xy.x * self._map_resolution;
                                pts[i].y = xy.y * self._map_resolution;
                            });
                        }
                    });
                }
                // AIRPORTS
                if (map.airports && Array.isArray(map.airports)) {
                    map.airports.forEach(a => {
                        let rwys = a.rwys;
                        if (rwys && Array.isArray(rwys)) {
                            rwys.forEach(r => {
                                let coords = r.coords;
                                if (coords && Array.isArray(coords)) {
                                    coords.forEach((c, i) => {
                                        let xy = self._stereo.forward(c.lat, c.lon);
                                        coords[i].x = xy.x * self._map_resolution;
                                        coords[i].y = xy.y * self._map_resolution;
                                    });
                                }
                            });
                        }
                    });
                }
                // CHARPOINTS
                if (map.charpoints && Array.isArray(map.charpoints)) {
                    map.charpoints.forEach((c, i) => {
                        let xy = self._stereo.forward(c.lat, c.lon);
                        map.charpoints[i].x = xy.x * self._map_resolution;
                        map.charpoints[i].y = xy.y * self._map_resolution;
                    });
                }
            });
            // FIRs - boundaries, lakes, rivers
            self._firs = [];
            // [self._maps.map(b => b.border), self._maps.map(l => l.lakes), self._maps.map(r => r.rivers)];
            self._maps.forEach(m => {
                let fir = {};
                if (m) {
                    if (m.border) {
                        fir.border = m.border;
                    }
                    if (m.lakes) {
                        fir.lakes  = m.lakes;
                    }
                    if (m.rivers) {
                        fir.rivers = m.rivers;
                    }
                }
                self._firs.push(fir);
            });
            // Airports and characteristic points
            self._cpoints = [];
            self._maps.forEach(m => {
                let cpoint = {};
                if (m) {
                    if (m.airports) {
                        cpoint.airports = m.airports;
                    }
                    if (m.charpoints) {
                        cpoint.charpoints = m.charpoints;
                    }
                }
                self._cpoints.push(cpoint);
            })
            // console.log({firs: self._firs});
        });
        // limit points
        $.getJSON('data/limits.json', (data) => {
            self._limit_points = Object.assign([], data);
            if (self._limit_points && Array.isArray(self._limit_points)) {
                self._limit_points.forEach((lp,i) => {
                    let cstr,lat,lon, x, y;
                    if (lp.coordstring) {
                        cstr = lp.coordstring.replace(/\s+/g, '');
                        let [ll] = cstr.matchAll(/^(\d{2})(\d{2})(\d{2})[NS]0(\d{2})(\d{2})(\d{2})[EW]$/g);
                        if (ll.length === 7) {
                            ll = ll.slice(1, 7).map(e => parseInt(e));
                            // LAT
                            lat = ll[0];
                            lat += ll[1] / 60;
                            lat += ll[2] / (60 * 60);
                            // LON
                            lon = ll[3];
                            lon += ll[4] / 60;
                            lon += ll[5] / (60 * 60);
                            // GET XY
                            let xy = self._stereo.forward(lat, lon);
                            self._limit_points[i] = {id: lp.id, x: xy.x * self._map_resolution, y: -xy.y * self._map_resolution};
                        }
                    }
                });
            }
        });
        // get sectors data
        $.getJSON('data/sectors.json', (data) => {
            self._sectors = Object.assign([], data.sector);
            let sector = data?.sector;
            let volume  = data?.volume;
            let layer   = data?.layer;
            // console.log(self._limit_points);
            sector.forEach((s, i) => {
                let _sector = {
                    id: s.id,
                    type: 'XXX',
                    bottom: Number.POSITIVE_INFINITY,
                    top: Number.NEGATIVE_INFINITY,
                    points: [],
                    active: false
                };
                if (_sector.id.match(/^[TNS][EW]?[LU]$/g)) {
                    _sector.type = 'APP';
                } else if (_sector.id.match(/^[NS][EW]$/)) {
                    _sector.type = 'APP';
                } else if (_sector.id.match(/^TWR$/)) {
                    _sector.type = 'TWR';
                } else if (_sector.id.match(/^[N|E|W|S]{2,}/)) {
                    _sector.type = 'ACC';
                } else {
                    _sector.type = 'FIS';
                }
                // process sector volumes...
                s.volume.forEach(v => {
                    let _vol = volume.find(_v => _v.id === v);
                    // get layers and calculate vertical limits of the sector
                    _vol.layer.forEach(_l => {
                        let _layer = layer.find(l => l.id === _l);
                        if (_layer) {
                            if (_layer.bottom < _sector.bottom) {
                                _sector.bottom = _layer.bottom;
                            }
                            if (_layer.top > _sector.top) {
                                _sector.top = _layer.top;
                            }
                            let _lpoints = []
                            _vol.limit_point.forEach((lpid, i) => {
                                if (self._limit_points) {
                                    // find x,y coordinates of the limit point and store into sector definition
                                    let lp = self._limit_points.find(p => p.id === lpid);
                                    _lpoints.push(lp);
                                }
                            });
                            _sector.points.push(_lpoints);
                        }
                    });
                    self._sectors[i] = _sector;
                });
                self._accSectors =  self._sectors.filter(s => s.type === 'ACC');
                self._appSectors =  self._sectors.filter(s => s.type === 'APP');
                self._twrSectors =  self._sectors.filter(s => s.type === 'TWR');
                self._fisSectors =  self._sectors.filter(s => s.type === 'FIS');
                // console.log(self._sectors);
            });
        });
        console.log({UI: this});
    }
    get base() { return this._base; }
    get busy() { return this._busy; }
    set busy(b = false) { return this._busy = b; }
    get ctx() { return this._ctx; }
    get canvas() { return this._canvas; }
    get maxZoom() { return this._maxZoom; }
    set maxZoom(z) { return this._maxZoom = z; }
    get zoomIndex() { return this._zoomIndex; }
    set zoomIndex(z) { return this._zoomIndex = z; }
    get scaleFactor() { return this._options.scales[this.zoomIndex - 1].zoomLevel; }
}
