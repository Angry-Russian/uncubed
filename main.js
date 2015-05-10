"use strict";

function transpose(array){
	var side = Math.ceil(Math.sqrt(array.length));
	var copy = [];
	
	array.length = side*side; // make sure array is square
	copy.length = array.length;
	
	for(var i = 0, l = array.length; i<l; i++){
		var x = i%side,
			y = Math.floor(i/side);
		copy[y + x * side] = array[i];
	}
	return copy;
}

function flip(array, vertical){
	var side = Math.ceil(Math.sqrt(array.length));
	var copy = [];
	
	array.length = side*side; // make sure array is square
	copy.length = array.length;
	
	for(var i = 0, l = array.length; i<l; i++){
		var x = i%side,
			y = Math.floor(i/side);
		if(vertical)
			copy[x + (side - y - 1) * side] = array[i];
		else
			copy[(side - x - 1) + y * side] = array[i];
	}
	return copy;
}

function rotateCW(array){
	return flip(transpose(array));
}

function rotateCCW(array){
	return flip(transpose(array), true);
}

function shift(loop, n){

	if(!loop || !loop.length) return loop;

	var tile;
	var nextTile;
	var colors = [];
	var rotations = [];
	for(var i = 0, l = loop.length; i<l; i++){
		tile = loop[i];
		nextTile = loop[(i+n)%l];
		colors.push([tile.color, tile.selectedColor]);

		for(var d = 0; d<4; d++){
			var neighbor = tile.get(d);
			var nf = neighbor.getFace();

			if(nf.parent !== tile.parent && loop.indexOf(nf) < 0){
				if(rotations.indexOf(nf.parent) < 0) rotations.push(nf.parent);

			}

		}
	}

	for(i=0; i<rotations.length; i++){
		rotations[i].rotate(Math.PI/2);
	}

	for(i=0; i<l; i++){
		nextTile = loop[(i+n)%l];
		nextTile.color = colors[i][0];
		nextTile.selectedColor = colors[i][1];
	}
};

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
		c.translate(-this.width/2, -this.height/2);
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
	
	Face.prototype.getComponents = function() {
		return this.components;
	}

	Face.prototype.getLoop = function GetLoop(d, l){
		var list = l || [];
		if(list.indexOf(this) < 0){
			list.push(this);
			var next = this.get(d);
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
		
		modifiedCoords.x = Math.cos(rad) * d + this.width/2;
		modifiedCoords.y = Math.sin(rad) * d + this.height/2;
		
		this.selected = (
			Math.abs(modifiedCoords.x - this.width/2) < this.width/2+0.5
		 && Math.abs(modifiedCoords.y - this.height/2) < this.height/2+0.5);
		
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
	
	Face.prototype.rotate = function(r){

		this.rotation += r;
		return this;
	}

	return Face;
}();

var Adapter = function(){
	
	function Adapter(offset, obj){
		if(!obj) throw "object cannot be undefined";
		this.target = obj;
		this.directionOffset = offset;
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

	Adapter.prototype.getComponents = function(){
		var c = this.target.getComponents();
		var f;
		if(!this.directionOffset){
			return c;
		}else{
			f = (this.directionOffset > 0)?rotateCCW:rotateCW;
		}

		for(var i = 0, l = Math.abs(this.directionOffset); i<l; i++){
			c = f(c);
		}//*/

		return c;
	}
	
	Adapter.prototype.getDirectionOffset = function GetDirectionOffset(i){
		return (i+this.directionOffset)%this.target.refs.length;
	}
	
	Adapter.prototype.set = function Set(i, face){
		return this.target.set(i+this.directionOffset, face);
	}
	
	Adapter.prototype.setColor = function(c){
		return this.target.setColor(c);
	}
	
	Adapter.prototype.rotate = function(r){
		return this.target.rotate(r);
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
};

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
};

function getCoordsFromDirection(d){
	return {
		x: Math.sin(d*Math.PI/2),
		y: Math.cos(d*Math.PI/2)
	};
};

function buildCube(d, r, ro, n, w){

	var i, j, k = 0, nn = n*n, lastFace, lastLayer, layers = [], faces = [];
	var rotationOffset = Math.PI/d;
	
	d = Math.abs(~~d);
	r = r || 0;
	ro = ro || 0;
	w = w || 31;

	var sides = d*(d-1);
	for(i = 0; i<sides; i++){
		var rc = Math.floor(360/sides*i);
		faces[i] = new Face({
			x: i * w,
			y : j * w,
			width: w,
			height: w,
			color: 'hsl(' + rc + ', 100%, 50%)',
			selectedColor: 'hsl(' + rc + ', 100%, 42%)'
		});

		// add n^2 tiles to each face
		var s = (w) / n;
		for(k = 0; k<nn; k++){
			var x = (0.5 + (k % n))*s;
			var y = (0.5 + Math.floor(k / n))*s;
			face = new Face({color: faces[i].color, selectedColor:faces[i].selectedColor, x:x, y:y, width: faces[i].width/n-1, height: faces[i].height/n-1, sides:4});
			faces[i].components.push(face);
		}
	}
	
	for(i = 0; i<d-1; i++){ // lattice layers = d-1
		
		var layer = faces.slice(i*d, (i+1)*d);
		for(j = 0; j < d; j++){ // faces per layer
			var up, left, right, down, offsetH = 0, offsetV = 0, face = layer[j];
			var rotation = (Math.PI*2)/d*j + rotationOffset * i;
			
			face.rotation = rotation + Math.PI *0.75;
			face.x = (ro + r * (d-i-1)) * Math.cos(rotation);
			face.y = (ro + r * (d-i-1)) * Math.sin(rotation);
			
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
			}

			for(var fi in face.components){ // for every face
				var f = face.components[fi];
				x = fi%n; y = ~~(fi/n);
				var up, left, // neighboring tiles
					side = { // tests to check border tiles
					up:   y === 0,
					down: y === n-1,
					left:  x === 0,
					right: x === n-1,
				};
				var tmpOffsetV = offsetV;
				var tmpOffsetH = offsetH;

				if(side.up){
					up = face.get(3).getComponents()[n*n-n+x];
				}else{
					up = face.components[x + (y-1) * n];
					tmpOffsetV = 0;
				}

				if(side.left){
					left = face.get(2).getComponents()[y*n+n-1];
				}else{
					left = face.components[(x-1) + y * n];
					tmpOffsetH = 0;
				}



				if(up){
					f.set( 3, new Adapter( tmpOffsetV, up));
					up.set(1+tmpOffsetV, new Adapter( -tmpOffsetV, f));
				}

				if(left){
					f.set( 2, new Adapter( tmpOffsetH, left));
					left.set(0+tmpOffsetH, new Adapter( -tmpOffsetH, f));
				}

				if(down){
					down = face.get(1).getComponents()[x];
					f.set(1, new Adapter( 1, down));
				}

				if(right){
					right = face.get(0).getComponents()[y*n];
					f.set(0, new Adapter( -1, right));
				}

				f.parent = face;
			}
			face.color = face.selectedColor;
			//face.color = 'rgba(0, 0, 0, 0.15)';
			//face.selectedColor = 'rgba(0, 0, 0, 0.15)';
		}
		lastLayer = layer;
	}
	
	return faces;
};

$(function($){
	var dimentions = Math.max(2, parseInt($('#dimensions').val())),
		tiles = 5,
		mouse = {x: 0, y: 0},
		centerX = $('body').width()/2,
		centerY = $('body').height()/2,
		faces = buildCube(dimentions, Math.sqrt(32*32) - 20, 20, tiles);
		//Math.sqrt(32*32*2)*dimentions/(2*Math.PI) - Math.sqrt(32*32*2)*0.5

	var container = new Face({
		x: 450,
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
	

	var hold = null;
	var selecting = false;
	var directionRing = {
		x: 15, y: 15, width: 0, height: 0, target: null, direction:null,
		draw:function(c){
			c.beginPath();
			c.fillStyle = 'rgba(255, 255, 255, 0.35)';
			c.strokeStyle = 'rgba(255, 255, 255, 0.35)';

			c.shadowColor = '#999';
			c.shadowBlur = 1;
			c.shadowOffsetX = 0;
			c.shadowOffsetY = 2;


			c.arc(this.x, this.y, 10, 0, Math.PI*2, false);
			c.fill();
			
			c.shadowColor = 'rgba(0, 0, 0, 0)';
			c.shadowBlur = 0;
			c.shadowOffsetX = 0;
			c.shadowOffsetY = 0;

			if(this.direction !== null){
				c.beginPath();
				var oldFill = c.fillStyle;
				c.fillStyle = 'rgba(240, 240, 240, .85)';
				c.moveTo(this.x, this.y);
				c.arc(this.x, this.y, 8, this.direction - Math.PI/4, this.direction + Math.PI/4, false);
				c.lineTo(this.x, this.y);
				c.fill();
				
				c.strokeStyle = "#333";
				c.fillStyle = "#333";

			} else c.strokeStyle = c.fillStyle = "rgba(255, 255, 255, .85)";

			c.beginPath();
			c.moveTo(-5+this.x, 0+this.y);
			c.lineTo(0+this.x, 5+this.y);
			c.lineTo(5+this.x, 0+this.y);
			c.lineTo(0+this.x, -5+this.y);
			c.lineTo(-5+this.x, 0+this.y);

			c.moveTo(this.x-2, this.y-2);
			c.lineTo(this.x+2, this.y-2);
			c.lineTo(this.x+2, this.y+2);
			c.lineTo(this.x-2, this.y+2);
			c.lineTo(this.x-2, this.y-2);
			
			c.fill();
			//c.stroke();
		},
		update:function(m){

		},
		select:function(coords){
			var x = coords.x - this.x;
			var y = coords.y - this.y;
			if(Math.abs(x) > 5 || Math.abs(y) > 5){
				this.direction = Math.floor((Math.atan2(y, x)+Math.PI/4)/(Math.PI/2))*(Math.PI/2);
			}else this.direction = null;
		}
	};

	$('body').on('mousedown', 'canvas', function(e){
		e.preventDefault();
		controls.activate();

		var selected = container.select(mouse);

		if(selected.length>0){
			selecting = true;
			hold = selected[0];
			hold.components.push(directionRing);
			directionRing.x = selected[1].x + selected[1].width/2;
			directionRing.y = selected[1].y + selected[1].height/2;
			directionRing.target = selected[1];
		}

		
	}).on('mouseup', 'canvas', function(e){
		e.preventDefault();
		controls.deactivate();
		if(selecting){
			hold = hold.components.pop();
			hold = null;
			selecting = false;
			container.select(mouse);

			var d = directionRing.direction/(Math.PI/2);
			var loop = directionRing.target.getLoop(d);
			directionRing.target = null;

			shift(loop, tiles);
		}
		
	}).on('mouseout', 'canvas', function(e){
		controls.deactivate();
		
	}).on('mousemove', function(e){
		mouse.x = e.pageX;
		mouse.y = e.pageY;

		var loop = [];
		var selected = container.select(mouse);
		
		if(!selecting){
			if(selected.length>1)
				loop = selected[0].getLoop(2)
					.concat(selected[1].getLoop(0))
					.concat(selected[0].getLoop(3))
					.concat(selected[1].getLoop(3));//*/

		}else if(directionRing.direction !== null){
			var d = directionRing.direction/(Math.PI/2);
			loop = directionRing.target.getLoop(d);
		}

		for(var i = 0, l = loop.length; i<l; i++){
			loop[i].selected = true;
		}
		
	}).on('submit change', '#generator', function(e){
		e.preventDefault();
		delete container.components;
		var n = Math.max(2, parseInt($('#dimensions').val()));
		container.components = buildCube(n, Math.sqrt(32*32*2)-20, 32, 5);
		//Math.sqrt(32*32*2)*n/(2*Math.PI) - Math.sqrt(32*32*2)*0.5
		controls.radius = Math.floor(n/2*(Math.sqrt(1800)+31+10));
		
	});
	
	var anim = new Animator(document.getElementById('main'), [controls]);
	anim.bindInteractions();
	anim.start();
});