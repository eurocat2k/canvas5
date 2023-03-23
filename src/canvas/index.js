import { genUUID } from "../utils";
// Canvas class
class Canvas {
    /**
     * @name Canvas constructor
     * @description creates canvas instance with canvas properties and event handlers
     * @param {Object} options shall contain id from the HTML body DOM elements, width, height, is interactive (boolean, default false)df
     *  - id        {String} unique id - identified canvas DOM element of the top layer - interactive
     *  - width     {Number} width of the canas in pixels
     *  - height    {Number} height of the canvas in pixels
     *  - centerX   {Number} translate X default = 0
     *  - centerY   {Number} transale Y default = 0
     *  - scale     {Number} scaleFactor default = 1
     *  - interact  {Boolean} is input device event handler allowed, default true
     */
    constructor(options = {}) {
        this._options = Object.assign({}, options);
        this._canvas;
        this._ctx;
        this._options.id = options.id ? options.id : `canvas-${genUUID()}`;
        // init
        this._init();
    }
    trackTransforms(ctx){
        var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
        var xform = svg.createSVGMatrix();
        ctx.getTransform = function(){ return xform; };
        var savedTransforms = [];
        var save = ctx.save;
        ctx.save = function(){
            savedTransforms.push(xform.translate(0,0));
            return save.call(ctx);
        };
        var restore = ctx.restore;
        ctx.restore = function(){
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };
        var scale = ctx.scale;
        ctx.scale = function(sx,sy){
            xform = xform.scaleNonUniform(sx,sy);
            return scale.call(ctx,sx,sy);
        };
        var rotate = ctx.rotate;
        ctx.rotate = function(radians){
            xform = xform.rotate(radians*180/Math.PI);
            return rotate.call(ctx,radians);
        };
        var translate = ctx.translate;
        ctx.translate = function(dx,dy){
            xform = xform.translate(dx,dy);
            return translate.call(ctx,dx,dy);
        };
        var transform = ctx.transform;
        ctx.transform = function(a,b,c,d,e,f){
            var m2 = svg.createSVGMatrix();
            m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
            xform = xform.multiply(m2);
            return transform.call(ctx,a,b,c,d,e,f);
        };
        var setTransform = ctx.setTransform;
        ctx.setTransform = function(a,b,c,d,e,f){
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx,a,b,c,d,e,f);
        };
        var pt  = svg.createSVGPoint();
        ctx.transformedPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
        ctx.canvasPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
    }
    static trackTransforms(ctx) {
        var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
        var xform = svg.createSVGMatrix();
        ctx.getTransform = function(){ return xform; };
        var savedTransforms = [];
        var save = ctx.save;
        ctx.save = function(){
            savedTransforms.push(xform.translate(0,0));
            return save.call(ctx);
        };
        var restore = ctx.restore;
        ctx.restore = function(){
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };
        var scale = ctx.scale;
        ctx.scale = function(sx,sy){
            xform = xform.scaleNonUniform(sx,sy);
            return scale.call(ctx,sx,sy);
        };
        var rotate = ctx.rotate;
        ctx.rotate = function(radians){
            xform = xform.rotate(radians*180/Math.PI);
            return rotate.call(ctx,radians);
        };
        var translate = ctx.translate;
        ctx.translate = function(dx,dy){
            xform = xform.translate(dx,dy);
            return translate.call(ctx,dx,dy);
        };
        var transform = ctx.transform;
        ctx.transform = function(a,b,c,d,e,f){
            var m2 = svg.createSVGMatrix();
            m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
            xform = xform.multiply(m2);
            return transform.call(ctx,a,b,c,d,e,f);
        };
        var setTransform = ctx.setTransform;
        ctx.setTransform = function(a,b,c,d,e,f){
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx,a,b,c,d,e,f);
        };
        var pt  = svg.createSVGPoint();
        ctx.transformedPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
        ctx.canvasPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
    }
    _init() {
        let self = this;
        try {
            if (self._options.canvas) {
                self._canvas = self._options.canvas;
                self._ctx = self._canvas.getContext('2d');
            } else {
                let canvas = document.querySelector(`canvas#${self._options.id}`);
                if (canvas) {
                    self._canvas = canvas;
                    self._ctx = canvas.getContext('2d');
                }
            }
            self._canvas.width = self._options.width;
            self._canvas.height = self._options.height;
            self.trackTransforms(self._ctx);
            // translate and scale
            self._ctx.setTransform(this._options.scale, 0, 0, this._options.scale, this._options.centerX, this._options.centerY);
        } catch (error) {
            console.warn(error);
        }
        console.log(this);
    }
    getTransformedPoint(x, y) {
        const originalPoint = new DOMPoint(x, y);
        return self.ctx.getTransform().inverse().transformPoint(originalPoint);
    }
    static getTransformedPoint(ctx, x, y) {
        const originalPoint = new DOMPoint(x, y);
        return ctx.transformedPoint(originalPoint.x, originalPoint.y);
    }
    get scale() { return this._options.scale; }
    get id() { return this._options.id; }
    set id(v) { return this._options.id = v; }
    get ctx() { return this._ctx; }
    get canvas() { return this._canvas; }
    get width() { return this._options.width; }
    get height() { return this._options.height; }
    get origin() {
        return {
            x: this._options.centerX,
            y: this._options.centerY
        }
    }
    // expect Object {x: ###, y: ###}
    set origin(o = {x, y}) {
        return {
            x: this._options.centerX = o.x,
            y: this._options.centerY = o.y
        }
    }
    get xform() {
        return this._ctx.getTransform();
    }
}

export default Canvas;