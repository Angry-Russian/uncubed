"use strict";

var Animator = function(){
	
	function Animator(cnv, drawables){
		this.canvas = cnv;
		this.context = cnv.getContext('2d');
		this.drawables = drawables || [];
		
		this.events = {
			mousemove:[],
			click:[]
		}
		
		var that = this;
		$(window).on('resize', function(){
			cnv.width = $(cnv).width();
			cnv.height = $(cnv).height();
			that.draw();
		}).trigger('resize');
	}
	
	Animator.prototype.draw = function Draw(){
		this.canvas.width = this.canvas.width;
		for(var i = 0, l = this.drawables.length; i<l; i++){
			var subj = this.drawables[i];
			subj.draw.bind(subj)(this.context);
		}
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
	Animator.prototype.start = function Start(){
		this.draw();
	}
	
	Animator.prototype.update = function Update(){
		for(var i = 0, l = this.drawables.length; i<l; i++){
			var subj = this.drawables[i];
			subj.update.bind(subj)();
		}
	}
	
	Animator.prototype.bindInteractions = function(){
		var that = this;
		$(this.canvas).on('mousemove click', function(e){
			var eventData = {
				target:that.canvas,
				mouseX: e.pageX,
				mouseY: e.pageY
			};
			
			that.events['mousemove'].forEach(function(i, v){
				if(v && typeof v == 'function')
					v(eventData);
			})
		});
	}
	
	Animator.prototype.on = function(e, callback){
		if(this.events[e]!== undefined){
			this.events[e].push(callback);
		}
	}
	
	return Animator
}();

var Face = function(){
	
	function Face(opts){
		this.color = opts.color || "#FFFFFF";
		this.originalColor = this.color;
		this.components = opts.components || [];
		this.refs = [];
		
		if(opts.sides) this.refs.length = opts.sides;
		
		this.x = opts.x || 0;
		this.y = opts.y || 0;
		this.width = opts.width || 32;
		this.height = opts.height || 32;
		this.rotation = opts.rotation || 0;
	}
	
	Face.prototype.draw = function Draw(c){
		c.save();
		c.translate(this.x+this.width/2, this.y+this.height/2);
		c.rotate(this.rotation);
		c.translate(-this.width/2, -this.height/2);
		
		c.fillStyle = this.color;
		c.fillRect(0, 0, this.width, this.height);
		
		if(this.components){
			for(var i = 0, l = this.components.length; i<l; i++){
				this.components[i].draw.bind(this.components[i])(c);
			}
		}
		c.restore();
	}
	
	Face.prototype.update = function Update(){
		
	}
	
	Face.prototype.get = function Get(i){
		var ref, len = this.refs.length;
		while(i<0 && len > 0){i+=len;}
		ref = this.refs[i%len];
		return ref;
	}
	
	Face.prototype.getFace = function GetFace(){
		return this;
	}
	
	Face.prototype.getLoop = function GetLoop(d, l){
		var list = l || [];
		console.log("getting loop in direction", d);
		if(list.indexOf(this) < 0){
			list.push(this);
			this.get(d).getLoop(d, list);
		}
		return list;
		
	}
	
	Face.prototype.getRefs = function GetRefs(){
		return this.refs;
	}
	
	Face.prototype.set = function Set(i, face){
		var len = this.refs.length;
		while(i<0 && len > 0){i+=len;}
		this.refs[i] = face;
		return this;
	}
	
	Face.prototype.setColor = function SetFaceColor(c){
		this.color = c;
		if(!this.originalcolor) this.originalColor = c;
	}
	
	return Face;
}();

var Adapter = function(){
	
	function Adapter(offset, obj){
		if(!obj) throw "object cannot be undefined";
		this.target = obj;
		this.directionOffset = offset;
		this.face = obj;
	}
	
	Adapter.prototype.draw = function Draw(c){
		this.target.draw.bind(this.target)(c);
	}
	
	Adapter.prototype.update = function Update(){
		this.target.update.bind(this.target)();
	}
	
	Adapter.prototype.get = function Get(i){
		return this.target.get.bind(this.target)(i+this.directionOffset);
	}
	
	Adapter.prototype.getLoop = function GetLoop(d, list){
		console.log(this.directionOffset, this.target);
		return this.target.getLoop.bind(this.target)(d+this.directionOffset, list);
	}
	
	Adapter.prototype.getFace = function GetFace(){
		return this.target;
	}
	
	Adapter.prototype.getDirectionOffset = function GetDirectionOffset(i){
		return (i+this.directionOffset)%this.face.refs.length;
	}
	
	Adapter.prototype.set = function Set(i, face){
		return this.target.set(i+this.directionOffset, face);
	}
	
	Adapter.prototype.setColor = function(c){
		return this.target.setColor(c);
	}
	
	return Adapter;
}();


var done = 0;
function debugFace(face){
	face.getFace().components.push({
		ref:  face.getFace(),
		draw: function(c){
			
			for(var ii = 0, ll = this.ref.getRefs().length, col=['#fff', '#f00', '#ff0', '#0ff']; ii<ll; ii++){
				var nextAdapter = this.ref.get(ii);
				var next = nextAdapter.getFace();
				
				if(next){
					var nextX = next.x + 15;
					var nextY = next.y + 15;
					
					c.beginPath();
					
					c.moveTo(15 + (Math.cos(ii * Math.PI/2)*15), 15 + (Math.sin(ii * Math.PI/2)*15));
					//c.moveTo(0, 0);
					
					c.rotate(-this.ref.rotation);
					c.lineTo(nextX - this.ref.x - 15, nextY - this.ref.y - 15);
					c.rotate(this.ref.rotation);
					
					c.strokeStyle = col[ii];
					c.stroke();
					
				}else{
					console.log('wtf', next);
				}
			}
		}
	});//*/
}

function debugLoop(dir, face, depth){
	if(!depth) depth = 255;
	var loop = face.getLoop(dir);
	console.log("Loop:", loop);
	for(var i = 0; i<loop.length && i < depth; i++){
		var f = loop[i];
		f.components.push({
			face: f,
			draw:function(canvas){
				
				canvas.beginPath();
				canvas.arc(this.face.width/2, this.face.height/2, 4, 0, Math.PI * 2, false);
				canvas.strokeStyle = "white";
				canvas.stroke();
				
			}
		})
	}//*/
	return loop;
	
}

function getCoordsFromDirection(d){
	return {
		x: Math.sin(d*Math.PI/2),
		y: Math.cos(d*Math.PI/2)
	};
}

function buildCube(d){
	var i, j, lastFace, lastLayer, layers = [], faces = [];
	
	var rotationOffset = Math.PI/d;
	
	var colorScheme = ['silver', 'red', 'green', 'blue', 'gold', 'cyan'];
	
	d = Math.abs(~~d);
	
	var sides = d*(d-1);
	for(i = 0; i<sides; i++){
		faces[i] = new Face({
			x: 1 + i * 32,
			y : 1 + j * 32,
			color: colorScheme[i%d] //'#'+ ('000000' + Math.floor(Math.random()*0x1000000).toString(16)).slice(-6)
		});
	}
	
	for(i = 0; i<d-1; i++){ // lattice layers = d-1
		
		var layer = faces.slice(i*d, (i+1)*d);
		for(j = 0; j < d; j++){ // faces per layer
			var up, left, right, down, offset = 0, face = layer[j]
			
			// face.color = colorScheme[i];
			// if(!j)debugFace(face);
			
			var rotation = (Math.PI*2)/d*j + rotationOffset * i;
			
			face.rotation = rotation + Math.PI *0.75;
			face.x = 32 * (d-i) * Math.cos(rotation);
			face.y = 32 * (d-i) * Math.sin(rotation);
			
			if(!lastLayer){ // if this is the outermost layer
				up = layer[(j+1)%d];
				left = layer[(j+d-1)%d];
				offset = 1;
				
			}else{ // if it's not the innermost layer
				up = lastLayer[(j+1)%d];
				left = lastLayer[j];
			}
			
			face.set(3, new Adapter(offset, up));
			up.set(1, new Adapter( -offset, face));
			face.set(2, new Adapter(offset, left));
			left.set(0, new Adapter(-offset, face));
			
			if(i===d-2){ // this is the innermost layer
				right = layer[(j+1)%d];
				down = layer[(j+d-1)%d];
				
				face.set(0, new Adapter(-1, right));
				face.set(1, new Adapter(1, down));
			}else{
				// nothing to do, right and down will be set by lower layers
			}
		}
		lastLayer = layer;
	}
	
	return faces;
}

$(function($){
	var dimentions = 4;
	var top = new Face({color: "#f00", x:0, y: 64, width: 31, height: 31, sides:4}),
		bot = new Face({color: "#00f", x:0, y: 128, width: 31, height: 31, sides:4}),
		centerX = $('body').width()/2,
		centerY = $('body').height()/2,
		faces = [],
		colors = ['rgba(255, 255, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(0, 255, 255, 0.5)', 'rgba(255, 0, 255, 0.5)'];
	
	faces = buildCube(dimentions);
	
	// add 9 "tiles" into each face, which are also faces
	for(var j = 0, l = faces.length; j<l; j++ ){
		var f = faces[j];
		for(var k = 0; k<9; k++){
			var x = (k % 3)*10;
			var y = Math.floor(k / 3)*10;
			f.components.push(new Face({color: (!k)?'#fff':f.color, x:x, y:y, width: 9, height: 9, sides:4}));
		}
		f.color = 'rgba(0, 0, 0, 0.3)';
	}
	
	// debugLoop(0, faces[8]);
	// debugFace(debugLoop(2, faces[0]).slice(-2, -1)[0]);
	// debugFace(faces[0]);
	// debugFace(faces[2].get(0).get(0));
	
	var anim = new Animator(document.getElementById('main'), [new Face({color:'rgba(0, 0, 0, 0)', x:450, y: 220, wodth: 0, height: 0, components:faces})]);
	anim.bindInteractions();
	anim.start();
});