var Main = new(function() {
    var pValues = [0];
    var pIndex = 0;
    var endIdx = 0;
    var exerNum = "0";
    var code = "";
    var copiedCode = "";
    var frames = [];
    var events = [];
    var worker;
    var gifData = "";
    var exitted = false;
    var ledStuff = [];
    var frameIdx = 0;
    var emptyLedStates = [];
    var editor;
    var msgSent = false;
    var lastE = false;
    this.init = function() {
        // console.log(elem.context);
        editor = ace.edit("editor");
        editor.setTheme("ace/theme/arduinoCoby");
        editor.getSession().setMode("ace/mode/coby");
        editor.setValue("void setup()\n{\n  \n}\n\nvoid loop()\n{\n  \n}\n");
        editor.gotoLine(3, 3);
        editor.getSession().setTabSize(2);
        if (localStorage.myCode) {
            editor.setValue(localStorage.myCode);
        }
        /*var codeConsole=ace.edit("console");
		codeConsole.setReadOnly(true);*/
        //codeConsole.setTheme("ace/theme/terminal");
        if (localStorage.myname) {
            document.getElementById("userName").value = localStorage.myname;
        } else {
            document.getElementById("userName").value = "Your Name here";
        }

        if (localStorage.pValues) {
            pValues = JSON.parse(localStorage.pValues);
        } else {
            pValues = [0];
        }

        document.getElementById("exerciseNum").onchange = function() {
            exerNum = this.value;

        };;

        potentiometerControls(pValues);
        document.body.onresize = resize;
        resize();
    }

    function resize() {
        editor.resize();
        editor.renderer.updateFull();
    }

    this.saveCode = function() {

        localStorage.myCode = editor.getValue();
        localStorage.myname = document.getElementById("userName").value;
        localStorage.pValues = JSON.stringify(pValues);
    }

    /*$scope.$watch('coding', function() {
        console.log('resizing editor');
        editor.resize();
        editor.renderer.updateFull();
    }, true);*/
    function frame(ledsOn, delay, pValue) {
        this.ledsOn = ledsOn;
        this.delay = delay;
        this.pValue = pValue || 0;
    }


    function parseEvents() {
        console.log("Events", events);
        var gotEvents = false;
        for (var i = 0; i < 13; i++) {
            emptyLedStates[i] = false;
        }

        function getFrameFrom(start) {
            var frameSaved = false;
            var ledStates = emptyLedStates;
            for (var ind = start; ind < events.length; ind++) {

                (function(i) {

                    if (!frameSaved) {
                        var e = events;
                        if (e[i].pin != undefined) {
                            ledStates[e[i].pin] = e[i].brightness;

                        } else if (e[i].delay != undefined) {
                            var lds = new frame(ledStates, e[i].delay, e[i].pValue); //{ledsOn:ledStates,delay:events[i].delay};
                            frameSaved = true;
                            console.log("Frame Added", ledStuff);
                            ledStuff[frameIdx++] = JSON.stringify(lds)
                            if (e[i + 1]) {
                                getFrameFrom(i + 1);
                            } else {
                                endIdx = i;
                            }
                        }
                    }
                })(ind);
            }
        }
        nextPIndex(getFrameFrom);
    }

    function nextPIndex(call) {
        if (pIndex < pValues.length - 1) {
            pIndex++;

            codeCopy();

        } else {
            call(endIdx);
            //ledStuff=JSON.parse(ledStuff);

            for (var i = 0; i < ledStuff.length; i++) {
                var fr = JSON.parse(ledStuff[i]);
                if (fr.delay <= 0) {
                    ledStuff.splice(i, 1);
                }
            }
            //ledStuff=JSON.stringify(ledStuff);
            console.log("LED Data", ledStuff);
            finishAndMakeGif();
        }
    }

    function finishAndMakeGif() {
        for (var i = 0; i < ledStuff.length; i++) {
            ledStuff[i] = JSON.parse(ledStuff[i]);
        }
        //	console.log(ledStuff);
        document.getElementById("preview").innerHTML = "Gifferizing...";
        makeGif(ledStuff, function(g) {
            blobToData(g, function(u) {
                document.getElementById("preview").innerHTML = "<img src='" + g + "'></img>";
                gifData = u;
                document.getElementById("export-page").style.display = "block";
                exitted = false;
            });
        }, function(p) {
            if (p < 1)
                consoleMsg("Giffing It: " + Math.floor(p * 100) + "%");
            else if (p == 1) {
                consoleMsg("Done Giffing.");
            }
        });
        frameIdx = 0;
        pIndex = 0;
        endIdx = 0;
        events = [];

        ledStuff = [];
        frames = [];
    }

    this.exportPage = function() {
        var saveWorker = new Worker("saveFileWorker.js");
        var scripts = [
            "ace/ace.js",
            "ace/mode-coby.js",
            "ace/theme-arduinoCoby.js"
        ];
        var scriptText = "";
        var title = document.getElementById("userName").value + "_Exercise-" + exerNum;

        function getScript(i) {
            if (scripts[i] != undefined) {
                $.get(scripts[i], function(d) {
                    scriptText += "<script>" + d + "</script>";
                    getScript(i + 1);
                });
            } else {

                saveWorker.postMessage({
                    editorText: editor.getValue(),
                    gifData: gifData,
                    scriptTxt: scriptText,
                    title: title
                });

            }
        }
        getScript(0);
        saveWorker.onmessage = function(e) {
            console.log(e);
            var blob = new Blob([e.data], {
                type: "text/html"
            });
            saveAs(blob, title + ".html");
            //var a=document.createElement("a");
            //	a.setAttribute("href","data:application/xhtml;charset=utf-8," + e.data);
            //	a.setAttribute("download", "LED_GIF.html");

        }

    }

    function fixedCode(c) {

        var res = c.replace("void loop", "void loop1");
        res = res.replace(/Serial/g, "//Serial");
        res = res.replace(/analogRead(18)/g, "0");
        res += "void loop() { loop1(); exit(); }";
        return res;
    }

    function bottomScroll(objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    function consoleMsg(msg) {
        document.getElementById("consoleMsg").innerHTML = msg;
    }

    function consoleColor(col) {
        document.getElementById("console").style.color = col;
    }

    function consoleLog(msg) {
        document.getElementById("console").innerHTML += msg + "</br>";
        bottomScroll(document.getElementById("console"));
    }

    function consoleMsgClear() {
        document.getElementById("consoleMsg").innerHTML = "";
    }

    function consoleClear() {
        document.getElementById("console").innerHTML = "";
    }

    function workerMsg(event) {
        if (event.data.type == "write") {
            event.data.pValue = pValues[pIndex];
            events.push(event.data);
            // $scope.pins[event.data.pin] = event.data.brightness;
            // $scope.$digest();
            //	events.push(event);
            //frames.push(event.data.pin);
        } else if (event.data.type == "msg") {
            if (event.data.msg == "not enough arguments to 'exit'") {
                exitted = true;
                parseEvents();
                editor.getSession().setAnnotations([]);
                consoleColor("white");
                consoleClear();
            } else {
                consoleColor("red");
                consoleMsgClear();
                consoleLog(event.data.msg)
                if (lastE) {
                    editor.getSession().setAnnotations([{
                        row: lastE.data.line,
                        column: lastE.data.column,
                        text: "Something isn't right here... ",
                        type: "error"
                    }]);
                    editor.gotoLine(lastE.data.line + 1, lastE.data.columb);
                    lastE = false;
                }
            }
        } else
        if (event.data.type == "error") {

            if (msgSent && lastE) {

            } else {
                lastE = event;
            }
        } else if (event.data.type == "delay") {
            // console.log(event.data);
        } else {
            // console.log("received other webworker event:");
            // console.log(event);
        }
    }

    function codeCopy() {

        copiedCode = code.replace("analogRead(5)", "" + pValues[pIndex]);
        //console.log(copiedCode);
        if (worker) {
            worker.terminate();
        }
        worker = new Worker("picoc.min.js");
        worker.onmessage = workerMsg;
        worker.postMessage({
            code: copiedCode
        });
    }


    this.runCode = function() {
        code = "#include <Arduino.h>\n" + editor.getValue();
        code = fixedCode(code);

        codeCopy();
        console.log(copiedCode);
    }


    function blobToData(bloburl, callback) {
        var x = new XMLHttpRequest();
        x.responseType = "blob";
        x.onload = function() {
            var blob = x.response;
            var r = new FileReader;
            r.onload = function() {
                var result = r.result;
                if (callback) {
                    callback(result);
                }
            }
            r.readAsDataURL(blob);
        }
        x.open("GET", bloburl);
        x.send();
    }
	
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
		
    function potentiometerControls() {
        var html = "Potentiometer Values: </br><hr>";
        for (var i = 0; i < pValues.length; i++) {
            html += '<ul class="horiz"><li><input type="number" min="0" max="1023" class="pBox form-control" onchange="changePValue(' + i + ',this.value)"value="' + pValues[i] + '"></input></li>';
            html += '<li><button type="button" class="btn btn-danger delete" onclick="deletePValue(' + i + ')">Delete</button></li></ul>';
            html += "<hr>";
        }
        html += '<button type="button" onclick="addPValue()" class="btn btn-primary">Add Value</button>';
        document.getElementById("pEditor").innerHTML = html;
    }

    this.deletePValue = function(ind) {
        pValues.splice(ind, 1);
        potentiometerControls();
    }

    this.addPValue = function() {
        pValues.push(0);
        potentiometerControls();
    }

    this.changePValue = function(ind, val) {
        val = "" + val;
        val = parseInt(val);
        pValues[ind] = val;
        potentiometerControls();
    }

})();