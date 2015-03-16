onmessage = function(e) {
	var html = "";
	
	var scriptText=e.scriptTxt;
	html += '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + e.data.title + '</title>';
	
	
	
	
	console.log("I got a message!", e.data);
	goOn();
	function goOn() {
		html +=  e.data.scriptTxt;
		html += '</head><body>';
		html += '<div style="background:url(' + e.data.gifData + ');width:113px; height:290px;"></div>';
		html += '<div id="coder" style="width:500px;height:500px;">' + e.data.editorText + '</div>';
	
		html += '<script>var editar = ace.edit("coder");editar.setTheme("ace/theme/arduinoCoby"); editar.getSession().setMode("ace/mode/coby");editar.setReadOnly(true);</script>';
		html += '</body></html>';
		var dataURL= "data:application/xhtml;charset=utf-8," + encodeURIComponent(html);
		//download("LED_GIF.html", html);
		var res=encodeURIComponent(html);
		postMessage(html);
	}
};
