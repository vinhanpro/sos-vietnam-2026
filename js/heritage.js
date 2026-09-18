/* Finite cinematic player. No auth state or operational API writes. */
(() => {
'use strict';
const $=id=>document.getElementById(id),host=$('filmScene');if(!host)return;
const chapters=[
['1890','Từ quê hương','Ngày 19 tháng 5, Nguyễn Sinh Cung chào đời tại Nghệ An. Khi đi học, Người mang tên Nguyễn Tất Thành.'],
['1911','Ra đi tìm đường cứu nước','Tháng 6, Người rời Việt Nam. Những năm tiếp theo là hành trình lao động, tìm hiểu đời sống và hoạt động ở nhiều nước.'],
['1920','Một bước ngoặt','Tại Đại hội Tours, Nguyễn Ái Quốc tham gia thành lập Đảng Cộng sản Pháp, đánh dấu bước chuyển trong hoạt động cách mạng.'],
['1930','Hợp nhất tổ chức','Nguyễn Ái Quốc chủ trì hội nghị thành lập Đảng Cộng sản Việt Nam, thống nhất các tổ chức cộng sản.'],
['1941','Trở về Tổ quốc','Ngày 28 tháng 1, Người trở về nước. Tháng 5, Hội nghị Trung ương lần thứ tám quyết định thành lập Mặt trận Việt Minh.'],
['1945','Ngày độc lập','Ngày 2 tháng 9, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, tuyên bố thành lập nước Việt Nam Dân chủ Cộng hòa.'],
['1954','Kháng chiến và xây dựng','Cuộc kháng chiến chống Pháp giành thắng lợi với chiến dịch Điện Biên Phủ. Người cùng Trung ương tiếp tục lãnh đạo xây dựng miền Bắc.'],
['1969','Khép lại một cuộc đời','Chủ tịch Hồ Chí Minh qua đời ngày 2 tháng 9 tại Hà Nội, để lại bản Di chúc và di sản tư tưởng.']
];
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),synth=window.speechSynthesis;
let film,seconds=0,frame=0,last=0,playing=false,ready=false,caption=-99,audio=false,voice=null,utterance=null,closed=false;
const duration=112;
const time=value=>Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');
function silence(){if(utterance){utterance.onend=null;utterance.onerror=null;synth?.cancel();utterance=null;}}
function controls(){
$('filmPlay').disabled=!ready;$('filmReplay').disabled=!ready;$('filmSeek').disabled=!ready;
$('filmPlay').textContent=playing?'Tạm dừng':seconds>=duration?'Xem lại':'Phát';
$('film').dataset.state=!ready?'loading':playing?'playing':seconds>=duration?'ended':'paused';
$('filmTime').textContent=time(seconds)+' / '+time(duration);$('filmSeek').value=String(seconds);
}
function speak(){
silence();if(!audio||!voice||!playing||caption<0||caption>7)return;
const chapter=chapters[caption];utterance=new SpeechSynthesisUtterance(chapter.join('. '));
utterance.lang='vi-VN';utterance.voice=voice;utterance.rate=1;
utterance.onerror=()=>{silence();audio=false;refreshVoice();$('filmNotice').textContent='Lời dẫn không phát được. Cảnh 3D tiếp tục không âm thanh.';};
synth.speak(utterance);
}
function paint(){
film?.render(seconds,reduce.matches);
const next=seconds<12?-2:seconds<20?-1:seconds<108?Math.min(7,Math.floor((seconds-20)/11)):8;
if(next!==caption){
caption=next;
const text=next===-2?['TỪ KHÔNG GIAN · ĐẾN VIỆT NAM','Hành trình Bác.','Một cuộc đời qua những dấu mốc lịch sử.']:next===-1?['1890 — 1969','Hồ Chí Minh','Từ những nét sáng, một chân dung dần hiện lên.']:next===8?['1890 — 1969','Hành trình còn được nhớ.','Tư liệu lịch sử · hình ảnh và không gian 3D minh họa.']:chapters[next];
$('filmEyebrow').textContent=text[0];$('filmTitle').textContent=text[1];$('filmText').textContent=text[2];
$('film').dataset.chapter=next>=0&&next<8?chapters[next][0]:next===8?'end':'intro';speak();
}
controls();
}
function pause(){playing=false;cancelAnimationFrame(frame);frame=0;silence();controls();}
function tick(now){
if(!playing||document.hidden||!ready)return;
seconds=Math.min(duration,seconds+Math.min((now-last)/1000,.15));last=now;paint();
if(seconds>=duration){pause();return;}frame=requestAnimationFrame(tick);
}
function play(){if(!ready||playing)return;if(seconds>=duration){seconds=0;caption=-99;}playing=true;last=performance.now();paint();speak();frame=requestAnimationFrame(tick);}
function refreshVoice(){
voice=synth?.getVoices().find(v=>/^vi(?:-|_|$)/i.test(v.lang))||null;
$('filmAudio').disabled=!voice;$('filmAudio').textContent=!voice?'Chưa có giọng Việt':audio?'Lời dẫn: bật':'Lời dẫn: tắt';
$('filmAudio').setAttribute('aria-pressed',String(audio));
}
$('filmPlay').addEventListener('click',()=>playing?pause():play());
$('filmReplay').addEventListener('click',()=>{pause();seconds=0;caption=-99;paint();if(!reduce.matches)play();});
$('filmSeek').addEventListener('input',()=>{const target=Number($('filmSeek').value);pause();seconds=target;caption=-99;paint();});
$('filmAudio').addEventListener('click',()=>{audio=!audio;refreshVoice();if(audio)speak();else silence();});
$('filmSources').addEventListener('click',()=>{pause();$('sourceDialog').showModal();});
$('filmFullscreen').addEventListener('click',async()=>{
try{if(document.fullscreenElement)await document.exitFullscreen();else if($('film').requestFullscreen)await $('film').requestFullscreen();else $('filmNotice').textContent='Trình duyệt này chưa hỗ trợ toàn màn hình; cảnh vẫn xem được trong cửa sổ.';}
catch{$('filmNotice').textContent='Không mở được toàn màn hình trên trình duyệt này.';}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
reduce.addEventListener('change',()=>{pause();paint();$('filmNotice').textContent=reduce.matches?'Đã bật giảm chuyển động. Cảnh đang dừng; có thể tua hoặc chủ động nhấn Phát.':'';});
window.addEventListener('resize',()=>{film?.resize();paint();},{passive:true});
window.addEventListener('pagehide',event=>{pause();if(!event.persisted){closed=true;film?.dispose();}});
synth?.addEventListener('voiceschanged',refreshVoice);refreshVoice();
(async()=>{
try{
const module=await import('./heritage-film.js?v=film2');
film=await module.createHeritageFilm(host,()=>{pause();ready=false;controls();$('film').dataset.state='unavailable';$('filmNotice').textContent='Đồ họa 3D bị gián đoạn. Hãy tải lại trang hoặc trở về cổng trực ban.';});
if(closed){film.dispose();return;}
ready=true;paint();$('filmNotice').textContent=reduce.matches?'Chế độ giảm chuyển động: cảnh đang dừng. Chủ động nhấn Phát để xem.':'';
if(!reduce.matches&&!document.hidden)play();
}catch{pause();$('film').dataset.state='unavailable';$('filmNotice').textContent='Không tải được cảnh 3D hoặc tư liệu. Hãy tải lại trang; cổng trực ban không bị ảnh hưởng.';$('filmText').textContent='Cảnh cinematic chưa sẵn sàng trên thiết bị này.';}
})();
})();
