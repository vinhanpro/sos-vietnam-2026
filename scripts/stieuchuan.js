/*--STIEUCHUAN v1.0.12.2024--*/
//return DD/MM/YYYY
function getDMY() {
	const d=new Date();
	return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
}
//return YYYYMMDD
function getYMDs() {
	const d=new Date();
	return d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");
}
//return YYYYMMDD from s=dd/mm/yyyy
function getYMD(s) {
	return s.substr(6)+s.substr(3,2)+s.substr(0,2);
}
//return hh:mm:ss
function getHMS() {
	const d=new Date();
	return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");
}
//return hhmmss
function getHMSs() {
	const d=new Date();
	return String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+String(d.getSeconds()).padStart(2,"0");
}
//return YYYYMMDDhhmmss
function getFullDateTime() {
	const d=new Date();
	return d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+String(d.getSeconds()).padStart(2,"0");
}
//---
function reFTime(s) {	//return time hh:mm:ss-dd/mm/yyyy
	return s.substr(8,2)+':'+s.substr(10,2)+':'+s.substr(12)+'-'+s.substr(6,2)+'/'+s.substr(4,2)+'/'+s.substr(0,4);
}
//return YYYYMMDD -> DD/MM/YYYY
function reDMY(s) {
	return s.substr(6,2)+"/"+s.substr(4,2)+"/"+s.substr(0,4);
}
//return hhmmss -> hh:mm:ss
function reHMS(s) {
	return s.substr(0,2)+":"+s.substr(2,2)+":"+s.substr(4,2);
}
//return tu FullDateTime ->DD/MM/YYYY
function reFullDMY(s) {
	return s.substr(6,2)+"/"+s.substr(4,2)+"/"+s.substr(0,4);
}
//return tu FullDateTime ->hh:mm:ss
function reFullHMS(s) {
	return s.substr(8,2)+":"+s.substr(10,2)+":"+s.substr(12,2);
}
//valid email -> true/false
function validEmail(st) {
	var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if (st.match(mailformat)) {
		return true;
	} else {
		return false;
	}
}
//check special chars
function checkSpecChar(s) {
	var format = /[`~!#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]+/;
	if (format.test(s)) {
	  return true;
	} else {
	  return false;
	}
}
//check IMG wxh tra ve 1 promise object; vi du su dung: checkIMG=checkImageWH(file,320,320); checkIMG.then((kq)=>{if (kq==true) alert('ok'); else alert('no');});
function checkImageWH(f,w,h) {
	return new Promise((resolve, reject) => {
    if (!f) {
      reject();
    }
    var img = new Image();
    img.src = window.URL.createObjectURL(f);
    img.onload = function () {
    	var k=true;
    	if (img.width>(w+10) || img.height>(h+10)) {
				k=false;
			}
			window.URL.revokeObjectURL(img.src);
      resolve(k);
    };
  });
}
//check type of file: (file, array_check)
function checkTypeF(f,a) {
	const ten=f.name;
	const ext=ten.split('.').pop().toLowerCase();
	if (a.includes(ext)) return true;
	else return false;
}
//check file size max_MB
function checkSizeF(f,maxMB) {
	const k=f.size;
	//doi MB -> Bytes
	const B=maxMB*1048576;
	if (k<B) return true;
	else return false;
}
//--
function hientb(o,s) {
	o.text(s);
	o.show();
	const t=setTimeout(function() {
		o.hide(500);
		clearTimeout(t);
	},9000);
}
//--
/*
//thay doi noi dung html cho object (div)
var div=$('#div_id');
datHTML(div,html).then(()=>{});
*/
function datHTML(selector, html) {
  return new Promise((resolve) => {
    selector.html(html);
    //immediately resolve after setting HTML
    resolve();
  });
}
//-----
//thamso: url, method, kieu data tra ve, obj data gui len server | vidu: $.when(goiServer('/codanhsach','post','text',{nhom:'BV',ten:'abc'})).done(function(kq) {alert(kq);});
function goiServer(u1,m1,k1,o1) {
	return $.ajax({
    "async": true,
    "crossDomain": true,
    "url": u1,
    "type": m1,
    "dataType": k1,
    "data": o1
  });
}
function goiSV(u1,m1,k1,o1,fun1) {
	$.when(goiServer(u1,m1,k1,o1)).done(function(kq) {
		fun1(kq);
	});
}
//--
function goiServerUpload(u1,m1,k1,o1) {
	return $.ajax({
    "async": true,
    "crossDomain": true,
    "url": u1,
    "type": m1,
    "dataType": k1,
    "data": o1,
		"cache": false,
		"contentType": false,
		"processData": false,
  });
}
function goiUL(u1,m1,k1,o1,fun1) {
	$.when(goiServerUpload(u1,m1,k1,o1)).done(function(kq) {
		fun1(kq);
	});
}
//-------------
//vd: tachHangNghin(12345,',') => 12,345
function tachHangNghin(x,dau) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, dau);
}
//--
