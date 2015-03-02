"use strict";

var Animator = function(){
    var drw;
    
    function Animator(cnv, drawables){
        this.canvas = cnv;
        this.context = cnv.getContext('2d');
        
        drw = drawables || [];
        
        $(window).on('resize', function(){
            cnv.width = $(cnv).width();
            cnv.height = $(cnv).height();
        }).trigger('resize');
    }
    
    Animator.prototype.draw = function Draw(){
        this.canvas.width = this.canvas.width;
        for(var i = 0, l = drw.length; i<l; i++){
            var subj = drw[i];
            subj.draw.bind(subj)(this.context);
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }
    
    Animator.prototype.update = function Update(){
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
        this.components = [];
        this.refs = [];
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.width = opts.width || 32;
        this.height = opts.height || 32;
    }
    
    Face.prototype.draw = function Draw(c){
        c.fillStyle = this.color;
        c.fillRect(this.x, this.y, this.width, this.height);
        if(this.components){
            c.translate(this.x, this.y);
            for(var i = 0, l = this.components.length; i<l; i++){
                this.components[i].draw.bind(this.components[i])(c);
            }
            c.translate(-this.x, -this.y);
        }
    }
    
    Face.prototype.update = function Update(){
        
    }
    
    Face.prototype.get = function Get(i){
        return this.refs[i];
    }
    
    Face.prototype.getFace = function GetFace(){
        return this;
    }
    
    
    Face.prototype.getRefs = function GetRefs(){
        return this.refs;
    }
    
    Face.prototype.set = function Set(i, face){
        this.refs[i] = face;
    }
    
    return Face;
}();

var Adapter = function(){
    var target = null,
        directionOffset = 0;
    function Adapter(offset, obj){
        if(!obj) throw "object cannot be undefined";
        target = obj;
        directionOffset = offset;
        this.face = obj;
    }
    
    Adapter.prototype.draw = function Draw(c){
        target.draw.bind(target)(c);
    }
    
    Adapter.prototype.update = function Update(){
        target.update.bind(target)();
    }
    
    Adapter.prototype.get = function Get(i){
        return target.get(i+directionOffset);
    }
    
    Adapter.prototype.getFace = function GetFace(){
        return target;
    }
    
    Adapter.prototype.getDirectionOffset = function GetDirectionOffset(){
        return directionOffset
    }
    
    Adapter.prototype.set = function Set(i, face){
        target.set(i+directionOffset, face);
    }
    
    return Adapter;
}();

$(function($){
    var top = new Face({color: "#f00", x:0, y: 32*0, width: 31, height: 31}),
        bot = new Face({color: "#00f", x:64, y: 32*3, width: 31, height: 31}),
        faces = [],
        colors = ['#0f0', '#ff0', '#0ff', '#f0f'];
        
    faces.push(top);
    for(var i = 0; i<4; i++){
        // create faces
        var face = new Face({color: colors[i], x:32, y:32*i, width: 31, height: 31});
        faces.push(face);
        top.set(i, new Adapter(i, face));
        bot.set(3-i, new Adapter(3-i, face));
        face.set(3-i, new Adapter(i, top));
        face.set(i, new Adapter(3-i, bot));
        face = null;
    }
    
    faces.push(bot);
    
    for(var j = 0, l = faces.length; j<l; j++ ){
        // for each face, create tiles
        for(var k = 0; k<9; k++){
            var x = (k % 3)*10 +1;
            var y = Math.floor(k / 3)*10+1;
            faces[j].components.push(new Face({color:'rgba(0, 0, 0, 0.1)', x:x, y:y, width: 9, height: 9}));
        }
    }
    
    var anim = new Animator($('#main').get(0), faces);
    anim.draw();
});