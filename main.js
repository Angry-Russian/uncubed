"use strict";

var Animator = function(){
    var drw;
    
    function Animator(cnv, drawables){
        this.canvas = cnv;
        this.context = cnv.getContext('2d');
        drw = drawables || [];
    }
    
    Animator.prototype.draw = function(){
        for(var i = 0, l = drw.length; i<l; i++){
            var subj = drw[i];
            subj.draw.bind(subj)(this.context);
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }
    
    Animator.prototype.update = function(){
        for(var i = 0, l = drw.length; i<l; i++){
            var subj = drw[i];
            subj.update.bind(subj)();
        }
    }
    
    return Animator
}();

var Face = function(){
    function Face(opts){
        this.color = opts.color || "0xFFFFFF";
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.width = opts.width || 32;
        this.height = opts.height || 32;
    }
    
    Face.prototype.draw = function DrawFace(c){
        c.fillStyle = this.color;
        c.fillRect(this.x, this.y, this.width, this.height);
    }
    
    Face.prototype.update = function UpdateFace(){
        
    }
    
    return Face;
}();

var Adapter = function(){
    var target = null,
        directionOffset = 0;;
    function Adapter(obj, offset){
        if(!obj) throw "object cannot be undefined";
        target = obj;
        directionOffset = offset;
    }
    
    Face.prototype.Adapter = function DrawFace(c){
        target.draw.bind(target)(c);
    }
    
    Face.prototype.Adapter = function UpdateFace(){
        target.update.bind(target)();
    }
    
    return Adapter;
}();

$(function($){
    var top = new Face({color: "#f00"});
    var bot = new Face({color: "#00f", x:33});
    var anim = new Animator(document.getElementById('main'), [top, bot]);
});