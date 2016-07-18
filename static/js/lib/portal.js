/**
 * Created by JavieChan on 2016/6/23.
 * Updated by JavieChan on 2016/6/27.
 */

;(function(){
    var isMobile=false, canyzm=true, verify;
    Portal = {
        opt: {
            target: null,
            openid: '',
            ac_ip: '',
            vlanId: '',
            ssid: '',
            user_ip: '',
            user_mac: '',
            ap_mac: '',
            firsturl: '',
            urlparam: '',
            appid: '',
            shopid: ''
        },
        auth: function(param){
            for(var i in param)
                this.opt[i] = param[i];
            this.porHTML();
            this.userChange();
            this.unitLogin();
            this.unitYzm();
            //this.opt.appid ? this.opt.shopid ? this.opt.urlparam ? (console.log("done")) : alert("urlparam不能为空") : alert("shopid不能为空") : alert("appid不能为空");
        },
        porHTML: function(){
            var self = this;
            var div = self.opt.target;
            div.innerHTML = '<div id="portal_zone">'+
                '<div>'+
                    '<input type="text" id="portal_user" name="portal_user" placeholder="账号/手机号：" />'+
                    '<span><button type="button" id="portal_yzm">获取验证码</button></span>'+
                '</div>'+
                '<div>'+
                    '<input type="text" id="portal_pwd" name="portal_pwd" placeholder="密码/验证码：" />'+
                '</div>'+
                '<button type="button" id="portal_login">登录</button>'+
            '</div>';
            self.user = document.getElementById('portal_user');
            self.pwd = document.getElementById('portal_pwd');
            self.yzm = document.getElementById('portal_yzm');
            self.login = document.getElementById('portal_login');
        },
        userChange: function(){
            var self = this;
            //为user输入框添加change事件
            self.addEventHandler(self.user, 'change', function(e) {
                var evt = e || window.event;
                var target = evt.srcElement || evt.target;
                var val = target.value.trim();
                if(!(/^1\d{10}$/).test(val)){
                    self.pwd.value = '';
                    self.pwd.setAttribute('type', 'password');
                    isMobile = false;
                }else{
                    self.pwd.value = '';
                    self.pwd.setAttribute('type', 'text');
                    isMobile = true;
                }
                if(val!=''){self.pwd.focus();}
            });
        },
        unitYzm: function(){
            var self = this;
            self.addEventHandler(self.yzm, 'click', function(e) {
                if(!isMobile){alert('请输入正确的手机号!');return false;}
                self.unitAjax('/wnl/mobile', 'mobile='+self.user.value.trim()+'&mask=256', function(data){
                    eval("var objSucc =" + data);
                    verify = objSucc.verify;
                    alert("验证码已下发到手机，请注意查收！");
                    self.yzm.innerHTML='<span id="portal_sec">60</span>秒重新获取';
                    self.yzm.disabled = true;
                    timeoutYzm();
                }, function(error){
                    alert('获取验证码失败，请检查网络！');
                });
            });
        },
        unitLogin: function(){
            var self = this;
            self.addEventHandler(self.login, 'click', function(e) {
                var user = self.user.value.trim(), pwd = self.pwd.value.trim();
                if(!user){alert('请填写账号/手机号'); self.user.focus(); return false;}
                if(!pwd){alert('请填写密码/验证码'); self.pwd.focus(); return false;}
                var obj = {
                    user: user,
                    password: pwd,
                    openid: self.opt.openid,
                    ac_ip: self.opt.ac_ip,
                    vlanId: self.opt.vlanId,
                    ssid: self.opt.ssid,
                    user_ip: self.opt.user_ip,
                    user_mac: self.opt.user_mac,
                    ap_mac: self.opt.ap_mac,
                    firsturl: self.opt.firsturl,
                    urlparam: self.opt.urlparam,
                    appid: self.opt.appid,
                    shopid: self.opt.shopid
                };
                if(isMobile){
                    console.log(self.MD5yzm(pwd) + ' ' + verify);
                    if(self.MD5yzm(pwd)==verify){
                        self.unitAjax('/wnl/register', 'mobile='+user+'&mask=256&mac='+self.opt.ap_mac, function(data){
                            eval("var objSucc =" + data);
                            obj.user = objSucc.user;
                            obj.password = objSucc.password;
                            self.unitPortal(obj, self.opt.firsturl, self.opt.urlparam);
                        });
                    }else{
                        alert('验证码错误');
                    }
                }else{
                    self.unitPortal(obj, self.opt.firsturl, self.opt.urlparam);
                }
            });
        },
        unitPortal: function(obj, firsturl, urlparam){
            var self = this;
            self.login.innerHTML = '正在验证';
            self.login.disabled = true;
            self.unitAjax('/account', self.unitSerialze(obj), function(data){
                self.login.innerHTML = '验证成功';
                self.login.disabled = false;
                window.location.href = firsturl+(urlparam ? '?'+urlparam : '');
            }, function(error){
                self.login.innerHTML = '重新验证';
                self.login.disabled = false;
                eval("var objErr =" + error);
                alert('验证失败：'+ objErr.Msg);
            });
        },
        unitAjax: function(url, param, fnSucc, fnFaild){
            //1.创建对象
            var oAjax = null;
            if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
                oAjax=new XMLHttpRequest();
            }else {// code for IE6, IE5
                oAjax=new ActiveXObject("Microsoft.XMLHTTP");
            }
            //2.连接服务器
            oAjax.open("POST", url, true);   //open(方法, url, 是否异步)
            //3.发送请求
            oAjax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            oAjax.send(param);
            //4.接收返回
            oAjax.onreadystatechange = function(){  //OnReadyStateChange事件
                //接收响应数据
                if(oAjax.readyState == 4){  //4为完成
                    if(oAjax.status == 200){    //200为成功
                        fnSucc(oAjax.responseText);
                    }else{
                        if(fnFaild){
                            fnFaild(oAjax.responseText);
                        }
                    }
                }
            };
        },
        MD5yzm: function(yzm){
            var m = hex_md5(yzm);
            var md1=m.substr(12, 4), md2=m.substr(-4);
            return md1+md2;
        },
        unitSerialze: function(obj){
            var a=[];
            for(var key in obj){
                a.push(key+'='+obj[key]);
            }
            return a.join('&');
        },
        addEventHandler: function(oTarget, sEventType, fnHandler){
            if(oTarget.addEventListener){
                oTarget.addEventListener(sEventType,fnHandler,false);
            } else if(oTarget.attachEvent){
                oTarget.attachEvent("on"+sEventType,function(){
                    return fnHandler.call(oTarget,window.event);
                });
            } else{
                oTarget["on"+sEventType]=fnHandler;
            }
        }
    };
    function timeoutYzm(){
        var delay = document.getElementById('portal_sec').innerText;
        var t = setTimeout(timeoutYzm, 1000);
        if(delay>1){
            delay--;
            document.getElementById('portal_sec').innerText = delay;
            canyzm = false;
        }else{
            clearTimeout(t);
            document.getElementById('portal_yzm').innerHTML='获取验证码';
            document.getElementById('portal_yzm').disabled = false;
            canyzm = true;
        }
    }
})();
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz));}
function b64_md5(s){ return binl2b64(core_md5(str2binl(s), s.length * chrsz));}
function str_md5(s){ return binl2str(core_md5(str2binl(s), s.length * chrsz));}
function hex_hmac_md5(key, data) { return binl2hex(core_hmac_md5(key, data)); }
function b64_hmac_md5(key, data) { return binl2b64(core_hmac_md5(key, data)); }
function str_hmac_md5(key, data) { return binl2str(core_hmac_md5(key, data)); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Calculate the HMAC-MD5, of a key and some data
 */
function core_hmac_md5(key, data)
{
  var bkey = str2binl(key);
  if(bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
  return core_md5(opad.concat(hash), 512 + 128);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert a string to an array of little-endian words
 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
 */
function str2binl(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
  return bin;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
  return str;
}

/*
 * Convert an array of little-endian words to a hex string.
 */
function binl2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of little-endian words to a base-64 string
 */
function binl2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * ( i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * ((i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * ((i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}
