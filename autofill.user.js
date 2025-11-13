// ==UserScript==
// @name         TranThanh AutoFill Full (fetch JSON)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Lấy dữ liệu từ raw.githubusercontent.com và tự động điền form
// @match        *://m.mmoo.team/*
// @match        *://m.1tt88.vip/*
// @match        *://m.789p1.vip/*
// @match        *://m.1go99.vip/*
// @match        *://m.8nohu.vip/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';
    const RAW_JSON_URL = "https://raw.githubusercontent.com/yourname/tranthanhdz/main/data.json"; // <-- THAY ĐỔI Ở ĐÂY

    function fetchData(url, cb) {
        if (typeof GM_xmlhttpRequest !== 'undefined') {
            GM_xmlhttpRequest({
                method: "GET", url: url,
                onload: function(res) {
                    try { cb(null, JSON.parse(res.responseText||'{}')); }
                    catch(e){ cb(e); }
                }, onerror: cb
            });
        } else {
            fetch(url).then(r=>r.json()).then(d=>cb(null,d)).catch(cb);
        }
    }

    fetchData(RAW_JSON_URL, function(err, data) {
        if (err) { console.error("Lỗi fetch data.json:", err); return; }
        if (!data || !data.username) { console.warn("data.json trống hoặc chưa có username."); return; }

        const btn = document.createElement('button');
        btn.innerText = '⚡ Tự động điền';
        Object.assign(btn.style, {
            position:'fixed', right:'15px', top:'90px', zIndex:99999,
            background:'#ff4081', color:'#fff', border:'none', padding:'8px 14px', borderRadius:'10px', cursor:'pointer'
        });
        document.body.appendChild(btn);

        btn.onclick = () => {
            const setVal = (selList, v) => {
                for (const sel of selList) {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.focus();
                        el.value = v;
                        el.dispatchEvent(new Event('input', {bubbles:true}));
                        el.dispatchEvent(new Event('change', {bubbles:true}));
                        return true;
                    }
                }
                return false;
            };

            setVal(['input[placeholder*="tên tài khoản"]','input[name*="user"]','input[placeholder*="tài khoản"]'], data.username || '');
            setVal(['input[placeholder*="mật khẩu"]','input[name*="password"]','input[type="password"]'], data.password || '');
            // nếu có nhiều input password, set confirm
            const pwdEls = document.querySelectorAll('input[type="password"]');
            if (pwdEls && pwdEls.length >= 2) { pwdEls[1].value = data.password || ''; pwdEls[1].dispatchEvent(new Event('input',{bubbles:true})); }

            setVal(['input[placeholder*="Họ và tên"]','input[name*="fullname"]'], data.fullname || '');
            setVal(['input[placeholder*="Chi nhánh"]','input[placeholder*="thành phố"]','input[name*="branch"]'], data.branch || '');
            setVal(['input[placeholder*="tài khoản"]','input[formcontrolname*="account"]','input[name*="account"]'], data.accountNumber || '');

            alert("✅ Đã điền (theo data.json). Kiểm tra lại các ô và gửi.");
        };
    });
})();