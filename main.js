"use strict";

var Animator = function(){
	var drw;
	
	function Animator(cnv, drawables){
		this.canvas = cnv;
		this.context = cnv.getContext('2d');
		
		drw = drawables || [];
		
		var that = this;
		$(window).on('resize', function(){
			cnv.width = $(cnv).width();
			cnv.height = $(cnv).height();
			that.draw();
		}).trigger('resize');
	}
	
	Animator.prototype.draw = function Draw(){
		this.canvas.width = this.canvas.width;
		for(var i = 0, l = drw.length; i<l; i++){
			var subj = drw[i];
			subj.draw.bind(subj)(this.context);
		}
		//window.requestAnimationFrame(this.draw.bind(this));
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
		this.color = opts.color || "#FFFFFF";
		this.originalColor = this.color;
		this.components = [];
		this.refs = [];
		if(opts.sides) this.refs.length = opts.sides;
		console.log('creating face with', opts.sides, 'sides');
		
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
		var len = this.refs.length;
		while(i<0 && len > 0){i+=len;}
		return this.refs[i%len];
	}
	
	Face.prototype.getFace = function GetFace(){
		return this;
	}
	
	Face.prototype.getLoop = function GetLoop(d, l){
		var list = l || [];
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

function debugFace(face){
	face.components.push({
		ref:  face.getFace(),
		draw: function(c){
			c.rotate(-this.ref.rotation);
			for(var ii = 0, ll = this.ref.getRefs().length, col=['#fff', '#0f0', '#f0f', '#000']; ii<ll; ii++){
				var next = this.ref.get(ii).getFace();
				if(next){
					c.translate(-face.x, -face.y);
					c.beginPath();
					c.moveTo(this.ref.x, this.ref.y);
					c.lineTo(next.x, next.y);
					c.strokeStyle = col[ii];
					c.stroke();
					c.translate(face.x, face.y);
				}else{
					console.log('wtf', next);
				}
			}
			c.rotate(this.ref.rotation);
		}
	});//*/
}

function debugLoop(dir, face){
	var loop = face.getLoop(dir);
	for(var i = 0; i<loop.length; i++){
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
	
}


function getCoordsFromDirection(d){
	return {
		x: Math.sin(d*Math.PI/2),
		y: Math.cos(d*Math.PI/2)
	};
}

$(function($){
	
	var top = new Face({color: "#f00", x:0, y: 64, width: 31, height: 31, sides:4}),
		bot = new Face({color: "#00f", x:0, y: 128, width: 31, height: 31, sides:4}),
		centerX = $('body').width()/2,
		centerY = $('body').height()/2,
		faces = [],
		colors = ['rgba(255, 255, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(0, 255, 255, 0.5)', 'rgba(255, 0, 255, 0.5)'];
		
	faces.push(top);
	for(var i = 0; i<4; i++){
		// create intermediary faces
		var face = new Face({color: colors[i], x:32, y:32*i, width: 31, height: 31, sides:4});
		
		// connect to top and bottom
		top.set(i, new Adapter(-i, face));
		bot.set((4-i)%4, new Adapter(-(2-i)%4, face));
		
		face.set(2, new Adapter(i, top));
		face.set(0, new Adapter(2-i, bot));
		
		// connect to up and down if they exist
		if(i>0){
			face.set(3, new Adapter(0, faces[i]));
			faces[i].set(1, new Adapter(0, face));
		}
		if(i===3){
			face.set(1, new Adapter(0, faces[1]));
			faces[1].set(3, new Adapter(0, face));
		}
		
		faces.push(face);
	}
	faces.push(bot);
	
	// add 9 "tiles" into each face, which are also faces
	for(var j = 0, l = faces.length; j<l; j++ ){
		var f = faces[j];
		for(var k = 0; k<9; k++){
			var x = (k % 3)*10 +1;
			var y = Math.floor(k / 3)*10+1;
			f.components.push(new Face({color: f.color, x:x, y:y, width: 9, height: 9, sides:4}));
		}
		f.color = 'rgba(0, 0, 0, 0.3)';
	}
	
	for(var ri = 0, rr = [32, 64], rl = 2; ri<rl; ri++){
		
		var radialOffset = -Math.PI/2;
		for(var ci = 0; ci<3; ci++){
			
			var face = faces[ri*3+ci];
			var r = Math.PI*2/3 * ci + radialOffset - Math.PI/3*ri;
			
			face.x = centerX + Math.cos(r) * rr[ri];
			face.y = centerY + Math.sin(r) * rr[ri];
			face.rotation = r + Math.PI/4;
			if(!ri){
				face.getFace().components.push({
					draw:function(c){
						c.strokeStyle = "rgba(255, 255, 255, 0.3)";
						c.beginPath();
						c.arc(15, 15, 56, 0, Math.PI * 2, false);
						c.stroke();
					}
				});
			}
		}
	}
	
	// debug lines
	// debugFace(faces[2]);
	debugLoop(2, faces[0]);
	
	face.getFace().components.push({
		draw:function(c){
			c.restore();
			c.strokeStyle = "rgba(255, 255, 255, 0.3)";
			c.beginPath();
			c.arc(centerX+15, centerY+15, 96, 0, Math.PI * 2, false);
			c.stroke();
		}
	});
	
	var anim = new Animator(document.getElementById('main'), faces);
	anim.draw();
});