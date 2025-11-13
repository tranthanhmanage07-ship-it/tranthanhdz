// ==UserScript==
// @name         TranThanh AutoFill (from repo)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Lấy profile từ data.json trên GitHub và tự động điền form trên các site (MMOO, TT88, 789P, GO99, NOHU)
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

    // Nếu repo/username/branch khác: thay link bên dưới bằng link "Raw" tới data.json của bạn
    const RAW_URL = 'https://raw.githubusercontent.com/tranthanhmanage07-ship-it/tranthanhdz/main/data.json';

    function gmFetchJson(url, cb){
        if(typeof GM_xmlhttpRequest === 'function'){
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(res){
                    try { cb(null, JSON.parse(res.responseText)); }
                    catch(e){ cb(e); }
                },
                onerror: function(err){ cb(err); }
            });
        } else {
            // fallback fetch (may be blocked by CORS)
            fetch(url).then(r=>r.json()).then(j=>cb(null,j)).catch(e=>cb(e));
        }
    }

    function dispatchInput(el, value){
        if(!el) return;
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function findSelectors(){
        return {
            user: [
                'input[placeholder*="tên tài khoản"]',
                'input[placeholder*="tài khoản"]',
                'input[name*="user"]',
                'input[id*="username"]',
                'input[type="text"]'
            ],
            pass: [
                'input[placeholder*="mật khẩu"]',
                'input[type="password"]'
            ],
            fullname: [
                'input[placeholder*="Họ và tên"]',
                'input[name*="fullname"]',
                'input[name*="name"]'
            ],
            account: [
                'input[placeholder*="Số tài khoản"]',
                'input[placeholder*="tài khoản"]',
                'input[formcontrolname*="account"]',
                'input[name*="account"]'
            ],
            branch: [
                'input[placeholder*="Chi nhánh"]',
                'input[placeholder*="thành phố"]',
                'input[name*="branch"]'
            ]
        };
    }

    function qFirst(arr){
        for(const s of arr){
            const el = document.querySelector(s);
            if(el) return el;
        }
        return null;
    }

    function fill(profile){
        if(!profile) return console.log('No profile to fill');
        const sel = findSelectors();
        const userEl = qFirst(sel.user);
        const passEl = qFirst(sel.pass);
        // Some pages have multiple password inputs - we try to fill in sequence
        const passEls = Array.from(document.querySelectorAll('input[type="password"]'));
        const fullnameEl = qFirst(sel.fullname);
        const accountEl = qFirst(sel.account);
        const branchEl = qFirst(sel.branch);

        if(profile.user && userEl) dispatchInput(userEl, profile.user);
        if(profile.pass && passEls.length>0) dispatchInput(passEls[0], profile.pass);
        if(profile.pass && passEls.length>1) dispatchInput(passEls[1], profile.pass);
        if(profile.withdraw && passEls.length>2) dispatchInput(passEls[2], profile.withdraw);

        if(profile.fullname && fullnameEl) dispatchInput(fullnameEl, profile.fullname);
        if(profile.account && accountEl) dispatchInput(accountEl, profile.account);
        if(profile.branch && branchEl) dispatchInput(branchEl, profile.branch);

        console.log('TranThanh AutoFill: filled', profile.name || profile.user);
    }

    // allow choosing profile by URL ?profile=name
    const urlParams = new URLSearchParams(window.location.search);
    const wantedProfile = urlParams.get('profile');

    gmFetchJson(RAW_URL, function(err, data){
        if(err){ console.warn('Failed load data.json', err); return; }
        if(!data || !data.profiles) { console.warn('data.json missing profiles'); return; }
        let activeName = data.active || (data.profiles[0] && data.profiles[0].name) || null;
        if(wantedProfile) activeName = wantedProfile;
        const profile = data.profiles.find(p=>p.name === activeName) || data.profiles[0];
        // wait a bit for page to render fields (SPA)
        setTimeout(()=> fill(profile), 700);
        // also try to fill again after navigation / slow components
        setTimeout(()=> fill(profile), 1600);
    });

})();
