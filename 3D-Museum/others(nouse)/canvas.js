"use strict";
var v1="";
var index="";
var dict=['link0',"link1","link2","link3","link4","link5","link6","link7"];

(function () {
	// ======== private vars ========
	var faces = [], camera;
	var target, targetold, faceOver, isMoving;
	var globalRX = 0, globalRY = 0;
	//
	// ===== pointer library =====
	//
	var canvas = {};
	(function() {
		this.elem = document.createElement("canvas");
		document.body.appendChild(this.elem);
		this.ctx = this.elem.getContext("2d");
		this.width = 0;
		this.height = 0;
		this.resize = function () {
			this.width  = this.elem.width  = +this.elem.offsetWidth;
			this.height = this.elem.height = +this.elem.offsetHeight;
		}
		this.elem.onselectstart = function() { return false; }
		this.elem.ondragstart   = function() { return false; }
		window.addEventListener('resize', this.resize.bind(this), false);
		this.resize();
		this.cursor = "";
		this.setCursor = function (type) {
			if (type !== this.cursor) {
				this.cursor = type;
				this.elem.style.cursor = type;
			}
		}
		this.pointer = {
			x: 0,
			y: 0,
			dx: 0,
			dy: 0,
			touchMode: false,
			center: function (s) {
				this.dx *= s;
				this.dy *= s;
				endX = endY = 0;
			},
			sweeping: false
		}
		var started = false, startX = 0, startY = 0, endX = 0, endY = 0;
		this.addEvent = function (t, e, fn) {
			for (var i = 0, events = e.split(','); i < events.length; i++) {
				t.addEventListener(events[i], fn.bind(this.pointer), false );
			}
		}
		this.addEvent(window, "mousemove,touchmove", function (e) {
			e.preventDefault();
			this.touchMode = e.targetTouches;
			var pointer = this.touchMode ? this.touchMode[0] : e;
			this.x = pointer.clientX;
			this.y = pointer.clientY;
			if (started) {
				this.sweeping = true;
				this.dx = endX - (this.x - startX);
				this.dy = endY - (this.y - startY);
			}
			if (this.move) this.move(e);
		});
		this.addEvent(this.elem, "mousedown,touchstart", function (e) {
			this.touchMode = e.targetTouches;
			if (this.touchMode) e.preventDefault();
			var pointer = this.touchMode ? this.touchMode[0] : e;
			startX = this.x = pointer.clientX;
			startY = this.y = pointer.clientY;  
			started = true;
			if (this.click) this.click(e);
			setTimeout(function () {
				if (!started && Math.abs(startX - this.x) < 11 && Math.abs(startY - this.y) < 11) {
					if (this.tap) this.tap(e);
				}
            }.bind(this), 200);
            // setTimeout(function(){
            //         window.location.href = "https://www.ccu.edu.tw/";
            // }, 5000); 
                 
		});
		this.addEvent(window, "mouseup,touchend,touchcancel", function (e) {
			e.preventDefault();
			endX = this.dx;
			endY = this.dy;
			started = false;
			this.sweeping = false;
		});
	}).apply(canvas);
	var ctx = canvas.ctx;
	var pointer = canvas.pointer;
	//
	// perspective projection
	//
	var transform = {};
	// ==== image constructor ====
	transform.Image = function (imgSrc, lev) {
		this.canvas        = canvas;
		this.ctx           = ctx;
		this.pointer       = pointer;
		this.texture       = new Image();
        this.texture.src   = imgSrc;
		this.lev           = lev || 1;
		this.isLoading     = true;
		this.points        = new Float64Array(6 * (this.lev + 1) * (this.lev + 1));
        this.triangles     = new Float64Array(14 * this.lev * this.lev);
	}
	// ---- init triangles ----
	transform.triangle = function (t, p, k, p0, p1, p2) {
		t[k + 0] = p0;
		t[k + 1] = p1;
		t[k + 2] = p2;
		t[k + 3] = p[p0 + 2] * (p[p2 + 3] - p[p1 + 3]) - p[p1 + 2] * p[p2 + 3] + p[p2 + 2] * p[p1 + 3] + (p[p1 + 2] - p[p2 + 2]) * p[p0 + 3];
		t[k + 4] = p[p1 + 3] - p[p2 + 3];
		t[k + 5] = p[p1 + 2] - p[p2 + 2];
		t[k + 6] = p[p2 + 2] * p[p1 + 3] - p[p1 + 2] * p[p2 + 3];
	}
	// ==== loading prototype ====
	transform.Image.prototype.loading = function () {
		if (this.texture.complete && this.texture.width) {
			this.isLoading = false;
			// ---- create points ----
			var k = 0;
			for (var i = 0; i <= this.lev; i++) {
				for (var j = 0; j <= this.lev; j++) {
					var tx = (i * (this.texture.width / this.lev));
					var ty = (j * (this.texture.height / this.lev));
					this.points[k * 6 + 2] = tx;
					this.points[k * 6 + 3] = ty;
					this.points[k * 6 + 4] = tx / this.texture.width;
					this.points[k * 6 + 5] = ty / this.texture.height;
					k++;
				}
			}
			var lev = this.lev + 1;
			k = 0;
			for (var i = 0; i < this.lev; i++) {
				for (var j = 0; j < this.lev; j++) {
					// ---- up ----
					transform.triangle(this.triangles, this.points, k,
						6 * (j + i * lev),
						6 * (j + i * lev + 1),
						6 * (j + (i + 1) * lev)
					);
					// ---- down ----
					k += 7;
					transform.triangle(this.triangles, this.points, k,
						6 * (j + (i + 1) * lev + 1),
						6 * (j + (i + 1) * lev),
						6 * (j + i * lev + 1)
					);
					k += 7;
				}
			}
		}
	}
	// ==== transform prototype ====
	transform.Image.prototype.transform = function (pt0, pt1, pt2, pt3) {
		// ---- loading ----
		if (this.isLoading) {
			this.loading();
			return false;
		} else {
			// ---- project points ----
			var p = this.points, t = this.triangles;
			for (var i = 0, len = p.length; i < len; i += 6) {
				var mx = pt0.X + p[i + 5] * (pt3.X - pt0.X);
				var my = pt0.Y + p[i + 5] * (pt3.Y - pt0.Y);
				p[i + 0] = (mx + p[i + 4] * (pt1.X + p[i + 5] * (pt2.X - pt1.X) - mx));
				p[i + 1] = (my + p[i + 4] * (pt1.Y + p[i + 5] * (pt2.Y - pt1.Y) - my));
			}
			// ---- draw triangles ----
			for (var i = 0, len = t.length; i < len; i += 7) {
				var p0 = t[i + 0];
				var p1 = t[i + 1];
				var p2 = t[i + 2];
				// ---- centroid ----
				var xc = (p[p0 + 0] + p[p1 + 0] + p[p2 + 0]) / 3;
				var yc = (p[p0 + 1] + p[p1 + 1] + p[p2 + 1]) / 3;
				var dx, dy, d, adx, ady;
				this.ctx.save();
				this.ctx.beginPath();
				// ---- draw non anti-aliased triangle ----
				dx = xc - p[p0 + 0], adx = dx < 0 ? -dx : dx;
				dy = yc - p[p0 + 1], ady = dy < 0 ? -dy : dy;
				d = adx > ady ? adx : ady;
				this.ctx.moveTo(p[p0 + 0] - 2 * (dx / d), p[p0 + 1] - 2 * (dy / d));
				dx = xc - p[p1 + 0], adx = dx < 0 ? -dx : dx;
				dy = yc - p[p1 + 1], ady = dy < 0 ? -dy : dy;
				d = adx > ady ? adx : ady;
				this.ctx.lineTo(p[p1 + 0] - 2 * (dx / d), p[p1 + 1] - 2 * (dy / d));
				dx = xc - p[p2 + 0], adx = dx < 0 ? -dx : dx;
				dy = yc - p[p2 + 1], ady = dy < 0 ? -dy : dy;
				d = adx > ady ? adx : ady;
				this.ctx.lineTo(p[p2 + 0] - 2 * (dx / d), p[p2 + 1] - 2 * (dy / d));
				// ---- clip ----
				this.ctx.clip();
				// ---- texture mapping ----
				this.ctx.transform(
					-(p[p0 + 3] * (p[p2 + 0] - p[p1 + 0]) -  p[p1 + 3] * p[p2 + 0]  + p[p2 + 3] *  p[p1 + 0] + t[i + 4] * p[p0 + 0]) / t[i + 3], // m11
					 (p[p1 + 3] *  p[p2 + 1] + p[p0 + 3]  * (p[p1 + 1] - p[p2 + 1]) - p[p2 + 3] *  p[p1 + 1] - t[i + 4] * p[p0 + 1]) / t[i + 3], // m12
					 (p[p0 + 2] * (p[p2 + 0] - p[p1 + 0]) -  p[p1 + 2] * p[p2 + 0]  + p[p2 + 2] *  p[p1 + 0] + t[i + 5] * p[p0 + 0]) / t[i + 3], // m21
					-(p[p1 + 2] *  p[p2 + 1] + p[p0 + 2]  * (p[p1 + 1] - p[p2 + 1]) - p[p2 + 2] *  p[p1 + 1] - t[i + 5] * p[p0 + 1]) / t[i + 3], // m22
					 (p[p0 + 2] * (p[p2 + 3] * p[p1 + 0]  -  p[p1 + 3] * p[p2 + 0]) + p[p0 + 3] * (p[p1 + 2] *  p[p2 + 0] - p[p2 + 2]  * p[p1 + 0]) + t[i + 6] * p[p0 + 0]) / t[i + 3], // dx
					 (p[p0 + 2] * (p[p2 + 3] * p[p1 + 1]  -  p[p1 + 3] * p[p2 + 1]) + p[p0 + 3] * (p[p1 + 2] *  p[p2 + 1] - p[p2 + 2]  * p[p1 + 1]) + t[i + 6] * p[p0 + 1]) / t[i + 3]  // dy
				);
				this.ctx.drawImage(this.texture, 0, 0);
				this.ctx.restore();
			}
			return true;
		}
	}
	// ==== isPointerInside prototype ====
	transform.Image.prototype.isPointerInside = function (x, y, p0, p1, p2, p3) {
		this.ctx.beginPath();
		this.ctx.moveTo(p0.X, p0.Y);
		this.ctx.lineTo(p1.X, p1.Y);
		this.ctx.lineTo(p2.X, p2.Y);
		this.ctx.lineTo(p3.X, p3.Y);
		this.ctx.closePath();
		return this.ctx.isPointInPath(x, y);
	}
	//
	// ===== tweens engine =====
	//
	var tweens = {};
	(function() {
		var tweens = [];
		var proto = {
			normalPI: function () {
				if (Math.abs(this.target - this.value) > Math.PI) {
					if (this.target < this.value)  this.value -= 2 * Math.PI;
					else this.value += 2 * Math.PI;
				}
			},
			setTarget: function (target, speedMod) {
				this.speedMod = (speedMod) ? speedMod : 1;
				this.target   = target;
				if (this.isAngle) {
					this.target = this.target % (2 * Math.PI);
					this.normalPI();
				}
				if (this.running && this.oldTarget === target) return;
				this.oldTarget = target;
				this.running   = true;
				this.prog      = 0;
				this.from      = this.value;
				this.dist      = -(this.target - this.from) * 0.5;
			},
			ease: function () {
				if (!this.running) return;
				var s = this.speedMod * this.steps;
				if (this.prog++ < s) {
					this.value = this.dist * (Math.cos(Math.PI * (this.prog / s)) - 1) + this.from;
					if (this.isAngle) this.normalPI();
				} else {
					this.running = false;
					this.value = this.target;
				}
			}
		}
		this.add = function (steps, initValue, initValueTarget, isAngle) {
			var tween = Object.create(proto);
			tween.target   = initValueTarget || 0;
			tween.value    = initValue  || 0;
			tween.steps    = steps;
			tween.isAngle  = isAngle || false;
			tween.speedMod = 1;
			tween.setTarget(tween.target);
			tweens.push(tween);
			return tween;
		}
		this.iterate = function () {
			for (var i = 0, len = tweens.length; i < len; i++) {
				tweens[i].ease();
			}
		}
	}).apply(tweens);
	// ======== points constructor ========
	var Point = function (parentFace, point, rotate) {
		this.face = parentFace;
		this.x = point[0];
		this.y = point[1];
		this.z = point[2];
		this.scale = 0;
		this.X = 0;
		this.Y = 0;
		if (rotate) {
			this.x += rotate.x;
			this.y += rotate.y;
			this.z += rotate.z;
		}
		return this;
	}
	// ======== points projection ========
	Point.prototype.project = function () {
		// ---- 3D rotation ----
		var p = camera.rotate(
			this.x - camera.x.value,
			this.y - camera.y.value,
			this.z - camera.z.value
		)
		// ---- distance to the camera ----
		if (this.face) {
			var z = p.z + camera.focalLength;
			var distance = Math.sqrt(p.x * p.x + p.y * p.y + z * z);
			if (distance > this.face.distance) this.face.distance = distance;
		}
		// --- 2D projection ----
		this.scale = (camera.focalLength / (p.z + camera.focalLength)) * camera.zoom.value;
		this.X = (canvas.width  * 0.5) + (p.x * this.scale);
		this.Y = (canvas.height * 0.5) + (p.y * this.scale);
	}
	// ======= faces constructor ========
	var Face = function (path, f) {
		this.f = f;
		var w  = f.w * 0.5;
		var h  = f.h * 0.5;
		var ax = f.rx * Math.PI * 0.5;
		var ay = f.ry * Math.PI * 0.5;
		this.locked   = false;
		this.hidden   = f.hidden || null;
		this.visible  = true;
		this.distance = 0;
		// ---- center point ----
		this.pc = new Point(this, [f.x, f.y, f.z]);
		// ---- 3D rotation ----
		var rotate = function (x, y, z, ax, ay) {
			var tz = z * Math.cos(ay) + x * Math.sin(ay);
			var ty = y * Math.cos(ax) + tz * Math.sin(ax);
			return {
				x: x * Math.cos(ay) - z * Math.sin(ay),
				y: ty,
				z: tz * Math.cos(ax) - y * Math.sin(ax)
			}
		}
		// ---- quad points ----
		this.p0 = new Point(this, [f.x, f.y, f.z], rotate(-w, -h, 0, ax, ay));
		this.p1 = new Point(this, [f.x, f.y, f.z], rotate( w, -h, 0, ax, ay));
		this.p2 = new Point(this, [f.x, f.y, f.z], rotate( w,  h, 0, ax, ay));
		this.p3 = new Point(this, [f.x, f.y, f.z], rotate(-w,  h, 0, ax, ay));
		// ---- corner points ----
		this.c0 = new Point(false, [f.x, f.y, f.z], rotate(-w, -h, -15, ax, ay));
		this.c1 = new Point(false, [f.x, f.y, f.z], rotate( w, -h, -15, ax, ay));
		this.c2 = new Point(false, [f.x, f.y, f.z], rotate( w,  h, -15, ax, ay));
		this.c3 = new Point(false, [f.x, f.y, f.z], rotate(-w,  h, -15, ax, ay));
		// ---- target angle ----
		var r = rotate(ax, ay, 0, ax, ay, 0);
		this.ax = r.x + Math.PI / 2;
		this.ay = r.y + Math.PI / 2;
		// ---- create 3D image ----
        this.img = new transform.Image(path + f.src, f.tl || 2);
        
	}
	// ======== face projection ========
	Face.prototype.project = function () {
		this.visible = true;
		this.distance = -99999;
		// ---- points projection ----
		this.p0.project();
		this.p1.project();
		this.p2.project();
		this.p3.project();
		// ---- back face culling ----
		if (!(
			((this.p1.Y - this.p0.Y) / (this.p1.X - this.p0.X) - 
			(this.p2.Y - this.p0.Y) / (this.p2.X - this.p0.X) < 0) ^ 
			(this.p0.X <= this.p1.X == this.p0.X > this.p2.X)
		) || this.hidden) {
			this.visible = false;
			this.distance = -99999;
			if (!this.locked && this.hidden === false) this.hidden = true;
		}
	}
	// ======== face border ========
	Face.prototype.border = function () {
		this.c0.project();
		this.c1.project();
		this.c2.project();
		this.c3.project();
		this.pc.project();
		ctx.beginPath();
		ctx.moveTo(this.c0.X, this.c0.Y);
		ctx.lineTo(this.c1.X, this.c1.Y);
		ctx.lineTo(this.c2.X, this.c2.Y);
		ctx.lineTo(this.c3.X, this.c3.Y);
		ctx.closePath();
		ctx.lineWidth = this.pc.scale * this.f.w / 30;
		ctx.strokeStyle = "rgb(255,255,255)";
		ctx.lineJoin = "round";
		ctx.stroke();
	}
	// ======== is pointer inside ? =========
	var selectFace = function () {
		isMoving = false;
		target = false;
		for (var i = 0, f; f = faces[i++];) {
			if (f.visible) {
				if (
					f.img.isPointerInside(
						pointer.x,
						pointer.y,
						f.p0, f.p1, f.p2, f.p3
					)
				) target = f;	
			} else break;
		}
		if (target && target.f.select != false && !pointer.sweeping) {
			faceOver = target;
			canvas.setCursor("pointer");
		} else canvas.setCursor("move");
	}
	// ======== onmove ========
	pointer.move = function () {
		isMoving = true;
	}
	// ======== onclick ========
	pointer.click = function () {
		selectFace();
		// ---- target image ----
		if (target && target.f.select != false) {

            index=target.f.id
            if(index == undefined){
                index=target.f.target
            }
            console.log(index)
            console.log(dict[index])
            setTimeout(function(){
                    // window.location.href = "var"+target.f.id;
            }, 2000); 


			if (target == targetold) {
				// ---- reset scene ----
				camera.center();
				targetold = false;
			} else {
				targetold = target;
				target.locked = false;
				// ---- target redirection ----
				if (target.f.target != "") {
					for (var i = 0, f; f = faces[i++];) {
						if (f.f.id && f.f.id == target.f.target) {
							target = f;
							targetold = f;
							if (f.hidden) {
								f.hidden = false;
								f.locked = true;
								targetold = false;
							}
							break;
						}
					}
				}
				// ---- move camera ----
				target.pc.project();
				camera.setTarget(target);
			}
        }
        
	}
	var init = function (json) {
		// ---- init camera ----
		camera = {
			x:  tweens.add(100),
			y:  tweens.add(100),
			z:  tweens.add(100, 0,0),
			rx: tweens.add(100, 0,0, true),
			ry: tweens.add(100, 0,0, true),
			zoom: tweens.add(100, 0.1, 2),
			focalLength: 450,
			centered: false,
			cosX: 0,
			cosY: 0,
			sinX: 0,
			sinY: 0,
			setTarget: function (target) {
				// ---- set position ----
				this.x.setTarget(target.pc.x);
				this.y.setTarget(target.pc.y);
				this.z.setTarget(target.pc.z);
				// ---- set view angles ----
				this.rx.setTarget((Math.PI * 0.5) - target.ax - globalRX);
				this.ry.setTarget((Math.PI * 0.5) - target.ay - globalRY);
				// ---- zoom ----
				this.zoom.setTarget(target.f.zoom ? target.f.zoom : 3);
				this.centered = false;
			},
			center: function () {
				this.x.setTarget(0);
				this.y.setTarget(0);
				this.z.setTarget(0);
				this.zoom.setTarget(2);
				this.centered = true;
			},
			move: function () {
				// ---- easing camera position and view angle ----
				tweens.iterate();
				// ---- additional drag/touch rotations ----
				globalRX += (((-pointer.dy * 0.01) - globalRX) * 0.1);
				globalRY += (((-pointer.dx * 0.01) - globalRY) * 0.1);
				if (!this.centered && pointer.sweeping) {
					// ---- reset zoom & position ----
					this.center();
					targetold = false;
				}
				// ---- pre calculate trigo ----
				this.cosX = Math.cos(this.rx.value + globalRX);
				this.sinX = Math.sin(this.rx.value + globalRX);
				this.cosY = Math.cos(this.ry.value + globalRY);
				this.sinY = Math.sin(this.ry.value + globalRY);
			},
			rotate: function (x, y, z) {
				// ---- 3D rotation ----
				var r = this.cosY * z + this.sinY * x;
				return {
					x: this.cosY * x - this.sinY * z,
					y: this.sinX * r + this.cosX * y,
					z: this.cosX * r - this.sinX * y	
				}
			}
		}
		// ---- create faces ----
		for (var i = 0, f; f = json.faces[i++];) {
			faces.push(
				new Face(json.path, f)
			);
		}
        // ---- engine start ----
        
        run();
        
        
	}
    // ===== main loop =====
    
	var run = function () {
		requestAnimationFrame(run);
		var i, f;
		ctx.clearRect(0,0, canvas.width, canvas.height);
		// ---- 3D projection ----
		for (i = 0; f = faces[i++];) {
			f.project();
		}
		// ---- faces depth sorting ----
		faces.sort(function (p0, p1) {
			return p1.distance - p0.distance;
		});
		// ---- drawing ----
		for (i = 0; f = faces[i++];) {
			if (f.visible) {
				// ---- draw image ----
				f.img.transform(f.p0, f.p1, f.p2, f.p3);
				if (f.locked && pointer.sweeping) f.locked = false;
				if (f === faceOver) faceOver.border();
			} else break;
		}
		// ---- pointer over ----
        isMoving && selectFace();
 
		// ---- camera ----
        camera.move();
        
	}
	return {    
		load: init
	}
})().load({
	path: "",
	faces: [
		// ---- main images ----
		{id: "1", src:"https://i.imgur.com/gY27Djv.jpg",  x:0,    y:0,    z:200,  rx:0,  ry:0,  w: 300, h: 200, select: false},
		{id: "2", src:"https://i.imgur.com/0YzxMJH.jpg",  x:200,  y:0,    z:0,    rx:0,  ry:-1, w: 300, h: 200},
		{id: "3", src:"https://i.imgur.com/tMeEkLE.jpg",  x:0,    y:150,  z:0,    rx:1,  ry:0,  w: 300, h: 200},
		{id: "4", src:"https://i.imgur.com/VBzl323.jpg",  x:0,    y:-150, z:0,    rx:-1, ry:0,  w: 300, h: 200},
		{id: "5", src:"https://i.imgur.com/nJiUzsl.jpg", x:-200, y:0,    z:0,    rx:0,  ry:1,  w: 300, h: 200},
        {id: "6", src:"https://i.imgur.com/wuvDtsr.jpg", x:0,    y:0,    z:-200, rx:0,  ry:-2, w: 300, h: 200},
        
		// ---- special hidden image :) ----
		{id: "7", target: "1", src:"https://i.imgur.com/B10DND5.png", x:0, y:0, z:200, rx:0, ry:-2, w: 300, h: 200, hidden: true},
		// ---- small targets ----
		{src:"https://i.imgur.com/wuvDtsr.jpg",  target: "6", x:0,    y:-40, z:170, rx:0, ry:0, w: 80, h: 60, tl: 1},
		{src:"https://i.imgur.com/nJiUzsl.jpg", target: "5", x:-100, y:-40, z:170, rx:0, ry:0, w: 80, h: 60, tl: 1},
		{src:"https://i.imgur.com/VBzl323.jpg",  target: "4", x:100,  y:-40, z:170, rx:0, ry:0, w: 80, h: 60, tl: 1},
		{src:"https://i.imgur.com/tMeEkLE.jpg",  target: "3", x:0,    y:40,  z:170, rx:0, ry:0, w: 80, h: 60, tl: 1},
		{src:"https://i.imgur.com/0YzxMJH.jpg",  target: "2", x:-100, y:40,  z:170, rx:0, ry:0, w: 80, h: 60, tl: 1},
		{src:"https://i.imgur.com/gY27Djv.jpg",    target: "7", x:100,  y:40,  z:170, rx:0, ry:0, w: 80, h: 60, tl: 1}
	] 
});