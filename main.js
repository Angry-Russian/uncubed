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
		this.update();
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
		this.selectedColor = opts.selectedColor || "#rgba(255, 255, 255, 0.5)";
		this.originalColor = this.color;
		this.components = opts.components || [];
		this.refs = [];
		
		if(opts.sides) this.refs.length = opts.sides;
		
		this.x = opts.x || 0;
		this.y = opts.y || 0;
		this.width = opts.width || 0;
		this.height = opts.height || 0;
		this.rotation = opts.rotation || 0;
		this.scale = opts.scale || 1;
		this.selected = opts.selected || false;
		this.selectCoords = null;
	}
	
	Face.prototype.draw = function Draw(c){
		c.save();
		c.translate(this.x, this.y);
		c.rotate(this.rotation);
		//c.translate(-this.width/2, -this.height/2);
		c.scale(this.scale, this.scale);
		
		c.fillStyle = this.selected ? this.selectedColor : this.color;
		c.fillRect(0, 0, this.width, this.height);
		
		if(this.selectCoords){
			c.save();
			c.beginPath();
			c.moveTo(0, 0);
			c.lineTo(this.selectCoords.x - this.x, this.selectCoords.y - this.y);
			c.strokeStyle = 'red';
			c.stroke();
			c.restore();
		}
		
		if(this.components){
			for(var i = 0, l = this.components.length; i<l; i++){
				this.components[i].draw.bind(this.components[i])(c);
			}
		}
		
		c.restore();
	}
	
	Face.prototype.update = function Update(){
		if(this.components.length){
			// this.rotation += 0.001 * Math.PI*2;
			for(var i = 0, l = this.components.length; i<l; i++){
				if(this.components[i].update) this.components[i].update();
			}
		}
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
		console.log('checking', this);
		if(list.indexOf(this) < 0){
			list.push(this);
			var next = this.get(d);
			console.log(' - next', next);
			if(next) next.getLoop(d, list);
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
	
	Face.prototype.select = function(coords){
		//this.selectCoords = coords;
		
		var modifiedCoords = {x: coords.x - this.x, y: coords.y - this.y};
		var rad = Math.atan2(modifiedCoords.y, modifiedCoords.x) - this.rotation;
		var d = Math.sqrt(Math.pow(modifiedCoords.x, 2) + Math.pow(modifiedCoords.y, 2)) / this.scale;
		
		modifiedCoords.x = Math.cos(rad) * d;
		modifiedCoords.y = Math.sin(rad) * d;
		
		this.selected = (
			Math.abs(modifiedCoords.x - this.width/2) < this.width/2
		 && Math.abs(modifiedCoords.y - this.height/2) < this.height/2);
		
		//this.selected && debugLoop(0, this) && debugLoop(1, this);
		
		var sel = [];
		
		if(this.selected) sel.push(this);
		
		for(var i = 0, l = this.components.length; i<l; i++){
			if(this.components[i].select){
				var s = this.components[i].select(modifiedCoords);
				sel = sel.concat(s);
			}
		}
		return sel;
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

var TransformController = function(){
	function TransformController(opts){
		this.rotation = opts.rotation || 0;
		this.x = opts.x || 0;
		this.y = opts.y || 0;
		this.radius = opts.radius || 196;
		this.target = opts.target || null;
		this.follow = opts.follow || null;
		this.active = false;
	}
	
	TransformController.prototype.draw = function(c){
		c.save();
		c.setTransform(1, 0, 0, 1, 0, 0);
		
		
		c.shadowColor = '#999';
		c.shadowBlur = 1;
		c.shadowOffsetX = 0;
		c.shadowOffsetY = 2;
		
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
		c.strokeStyle = "rgba(255, 255, 255, 0.75)";
		c.stroke();
		
		c.beginPath();
		c.arc(this.x, this.y, 4, 0, Math.PI*2, false);
		c.strokeStyle = "rgba(255, 255, 255, 0.75)";
		c.stroke();
		
		c.beginPath();
		c.arc(this.x - Math.cos(this.rotation) * this.radius, this.y - Math.sin(this.rotation) * this.radius, 8, 0, Math.PI*2, false);
		
		c.fillStyle = !this.active ? 'rgba(255, 255, 255, .5)' : 'white';
		c.fill();
		c.strokeStyle = "rgba(255, 255, 255, 0.75)";
		c.stroke();
		
		c.restore();
		
		this.target.draw(c);
	}
	
	TransformController.prototype.update = function(){
		if(this.target){
			if(this.follow && this.active) this.rotation = Math.atan2(this.y - this.follow.y, this.x - this.follow.x);
			this.target.rotation = this.rotation;
			this.target.x = this.x;
			this.target.y = this.y;
			this.target.update();
		}
	}
	
	TransformController.prototype.activate = function(){
		if(this.follow &&
			Math.abs(this.follow.x - (this.x - Math.cos(this.rotation) * this.radius)) < 16 &&
			Math.abs(this.follow.y - (this.y - Math.sin(this.rotation) * this.radius)) < 16)
				this.active = true;
	}
	
	TransformController.prototype.deactivate = function(){
		this.active = false;
	}
	
	return TransformController;
}();

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

function buildCube(d, r, ro){

	var i, j, lastFace, lastLayer, layers = [], faces = [];
	var rotationOffset = Math.PI/d;
	
	d = Math.abs(~~d);
	r = r || 32;
	ro = ro || 0;
	
	var sides = d*(d-1);
	for(i = 0; i<sides; i++){
		var rc = Math.floor(360/sides*i);
		faces[i] = new Face({
			x: i * 31,
			y : j * 31,
			width: 31,
			height: 31,
			color: 'hsl(' + rc + ', 100%, 50%)',
			selectedColor: 'hsl(' + rc + ', 100%, 85%)'
		});
	}
	
	for(i = 0; i<d-1; i++){ // lattice layers = d-1
		
		var layer = faces.slice(i*d, (i+1)*d);
		for(j = 0; j < d; j++){ // faces per layer
			var up, left, right, down, offsetH = 0, offsetV = 0, face = layer[j]
			
			// face.color = colorScheme[i];
			// if(!j)debugFace(face);
			
			var rotation = (Math.PI*2)/d*j + rotationOffset * i;
			
			face.rotation = rotation + Math.PI *0.75;
			face.x = (ro + r * (d-i)/2) * Math.cos(rotation);
			face.y = (ro + r * (d-i)/2) * Math.sin(rotation);
			
			if(!lastLayer){ // if this is the outermost layer
				up = layer[(j+1)%d];
				left = layer[(j+d-1)%d];
				offsetV = 1;
				offsetH = -1;
				
			}else{ // if it's not the innermost layer
				up = lastLayer[(j+1)%d];
				left = lastLayer[j];
			}
			
			face.set(3, new Adapter (offsetV, up));
			up.set(1, new Adapter(-offsetV, face));
			face.set(2, new Adapter( offsetH, left));
			left.set(0, new Adapter(-offsetH, face));
			
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
	
	subdivide(faces, 3);
	
	return faces;
}

function subdivide(faces, n){
	var nn = n*n;
	// add 9 "tiles" into each face, which are also faces
	for(var j = 0, l = faces.length; j<l; j++ ){
		var f = faces[j];
		for(var k = 0; k<nn; k++){
			var x = 1 + (k % n)*10;
			var y = 1 + Math.floor(k / n)*10;
			var face = new Face({color: f.color, selectedColor:f.selectedColor, x:x, y:y, width: f.width/n-1, height: f.height/n-1, sides:4});
			
			/*var up  =	(k>n) ? faces[k-n] : null;
			var left =	(k%n) ? faces[k-1] : null;
			
			if(left) left.set(0, new Adapter(0, face)), face.set(3, new Adapter(0, left));
			if(up)	 up.set(  1, new Adapter(0, face)), face.set(2, new Adapter(0, up));//*/
			
			f.components.push(face);
		}
		f.color = 'rgba(0, 0, 0, 0.15)';
		f.selectedColor = 'rgba(0, 0, 0, 1)';
	}//*/
}

$(function($){
	var dimentions = Math.max(2, parseInt($('#dimensions').val())),
		mouse = {x: 0, y: 0},
		centerX = $('body').width()/2,
		centerY = $('body').height()/2,
		faces = buildCube(dimentions, 50, 0);

	var container = new Face({
		x:450,
		y: 220,
		width: 0,
		height: 0,
		scale: 1.5,
		components:faces,
		color:'rgba(0, 0, 0, 0)'
	});
	
	var controls = new TransformController({
		follow: mouse,
		target: container,
		radius: Math.floor(dimentions/2*(Math.sqrt(1800)+31+10)),
		rotation: -Math.PI/2,
		x: window.innerWidth/2,
		y: window.innerHeight/2,
	});
	
	
	
	$(window).on('resize', function(e){
		controls.x = window.innerWidth/2;
		controls.y = window.innerHeight/2;
		
	});
	
	$('body').on('mousedown', 'canvas', function(e){
		e.preventDefault();
		controls.activate();
		
		var loop = [];
		var selected = container.select(mouse);
		console.log('selected', selected[0]);
		console.log('getting first loop (0)');
		loop = selected[0].getLoop(0);
		for(var i = 0, l = loop.length; i<l; i++){
			loop[i].selectedColor = '#F00';
			loop[i].selected = true;
		}
		
		console.log('getting second loop (1)');
		loop = selected[0].getLoop(1);
		for(var i = 0, l = loop.length; i<l; i++){
			loop[i].selectedColor = loop[i].selected?'#0F0':'#00F';
			loop[i].selected = true;
		}
		
	}).on('mouseup', 'canvas', function(e){
		e.preventDefault();
		controls.deactivate();
		
	}).on('mouseout', 'canvas', function(e){
		controls.deactivate();
		
	}).on('mousemove', function(e){
		mouse.x = e.pageX;
		mouse.y = e.pageY;
		// container.select(mouse);
		
	}).on('submit change', '#generator', function(e){
		e.preventDefault();
		delete container.components;
		var n = Math.max(2, parseInt($('#dimensions').val()));
		container.components = buildCube(n, 50, 2);
		controls.radius = Math.floor(n/2*(Math.sqrt(1800)+31+10));
		
	});
	
	var anim = new Animator(document.getElementById('main'), [controls]);
	anim.bindInteractions();
	anim.start();
});