function makeGif(frames, callback,progress) {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.height = 500;
            canvas.width = 250;
			
			var gif = new GIF({
                workers: 4,
				quality:0
            });
			gif.on("finished", function(g) {
				if(callback) {
					callback(URL.createObjectURL(g));
				} else {
					var img = document.createElement("img");
					img.src = (URL.createObjectURL(g));
					document.body.appendChild(img);
				}
            });
			
			gif.on("progress", function(p) {
			    if(progress) {
				    progress(p);
				}
			});
			var s = 87;
            var ledNumToX = [
                s, s, s, s, s, s, s,
                5, 5, 5, 5, 5, 5, 5
            ];
			
            var ledNumToY = [
                165, 140, 115, 90, 65, 35, 10,
                165, 140, 115, 90, 65, 35, 7
            ];
			
            var ledNumToColor = [

                "red", "#00FF00", "red", "#00FF00", "red", "#00FF00", "red",
                "orange", "orange", "orange", "blue", "blue", "yellow", "yellow"
            ];
			
			if(frames.length == 0) {
			frames[0]={ledsOn:[0,0,0,0,0,0,0,0,0,0,0,0,0], delay:1000,pValue:0};
			}

            var maxFrames = frames.length;
			var shieldImg = new Image();
			var radius = 7.5;
			
			var d = new Date();
			var days = ["Sun","Mon","Tues","Wed","Thurs","Fri","Sat"];
			var months = ["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"];
			var curDay = days[d.getDay()];
			var date = d.getDate();
			var month = months[d.getMonth()];
			var year = d.getFullYear();
			var minutes = d.getMinutes();
			if(minutes < 10) {
				minutes = "0" + minutes;
			}
			var time = d.getHours() + ":" + minutes;
			
			var name = "";
			var exerNum = "";
			shieldImg.src = "assets/shield.png"
			shieldImg.onload = function() {
				canvas.width = shieldImg.width;
				canvas.height = shieldImg.height + 100;
				name = document.getElementById("userName").value;
				exerNum = document.getElementById("exerciseNum").value || "0";
				for(var i = 0; i < maxFrames; i++) {
					animate(i);
				}
				gif.render();
			};
			
			function animate(i) {
				ctx.fillStyle="white";
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(shieldImg, 0,0);
				for(var k = 0; k < ledNumToX.length; k++) {

					if(frames[i].ledsOn[k]) {
						ctx.fillStyle = ledNumToColor[k];
						ctx.beginPath();
						ctx.arc(ledNumToX[k] + radius,ledNumToY[k] + radius,radius,0,2*Math.PI,false);
						ctx.closePath();
						ctx.fill();
					}
					
				}
				
				ctx.fillStyle = "black";
				ctx.font = "15px Helvetica";
				
				ctx.fillText("Frame: " + i,5,shieldImg.height + 15);
				ctx.fillText(name,5,shieldImg.height + 30);
				ctx.fillText("Exercise#"+exerNum,5,shieldImg.height + 45);
				ctx.fillText(curDay + " " +month + " " + date, 5, shieldImg.height + 60);
				ctx.fillText(time + " " + year,5,shieldImg.height + 75);
				ctx.fillText("Potent: " + frames[i].pValue,5,shieldImg.height + 90);
				
				gif.addFrame(canvas, {copy:true, delay:frames[i].delay});
			}
			
			
            
        }