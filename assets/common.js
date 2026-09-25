/* 중3 과학 시즌2 수업 자료 공용 스크립트 */
(function () {
  "use strict";

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }
  };

  var PAGES = [
    { file: "index.html", unit: "", title: "수업 홈" },
    { file: "01-cell-division.html", unit: "Ⅴ-1 생식", title: "세포 분열과 체세포 분열" },
    { file: "02-meiosis.html", unit: "Ⅴ-1 생식", title: "감수 분열" },
    { file: "03-development.html", unit: "Ⅴ-1 생식", title: "수정과 발생" },
    { file: "04-mendel.html", unit: "Ⅴ-2 유전", title: "멘델과 분리의 법칙" },
    { file: "05-independent.html", unit: "Ⅴ-2 유전", title: "독립의 법칙" },
    { file: "06-human-genetics.html", unit: "Ⅴ-2 유전", title: "사람의 유전" },
    { file: "07-parallax.html", unit: "Ⅶ-1 별", title: "연주 시차와 거리" },
    { file: "08-magnitude.html", unit: "Ⅶ-1 별", title: "별의 밝기와 등급" },
    { file: "09-star-color.html", unit: "Ⅶ-1 별", title: "별의 색과 표면 온도" },
    { file: "10-review.html", unit: "총정리", title: "시험 대비 총정리" },
    { file: "wrong-notes.html", unit: "오답 노트", title: "나의 오답 노트", nav: false }
  ];

  var S2 = window.S2 = { store: store, PAGES: PAGES };

  /* ---------- 오답 노트 (이 기기의 브라우저에만 저장) ---------- */
  var WKEY = "s2-wrong-v1";
  function wid(page, q) {
    var s = page + "|" + q, h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return "w" + (h >>> 0).toString(36);
  }
  S2.wrong = {
    all: function () {
      try { var v = JSON.parse(store.get(WKEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    },
    save: function (list) { store.set(WKEY, JSON.stringify(list)); S2.wrong.badge(); },
    add: function (item, page) {
      if (!item || item.t === "essay") return;
      var list = S2.wrong.all(), id = item._wid || wid(page, item.q), now = Date.now();
      var cur = list.filter(function (x) { return x.id === id; })[0];
      if (cur) { cur.miss = (cur.miss || 1) + 1; cur.last = now; }
      else {
        list.push({ id: id, page: item._page || page, t: item.t, q: item.q, o: item.o, a: item.a, e: item.e || "", tag: item._origTag != null ? item._origTag : (item.tag || ""), miss: 1, first: now, last: now });
      }
      S2.wrong.save(list);
    },
    remove: function (id) { S2.wrong.save(S2.wrong.all().filter(function (x) { return x.id !== id; })); },
    clear: function () { S2.wrong.save([]); },
    idOf: function (item, page) { return item._wid || wid(page, item.q); },
    badge: function () {
      var n = S2.wrong.all().length;
      document.querySelectorAll(".wn-count").forEach(function (b) { b.textContent = n; b.style.display = n ? "" : "none"; });
    }
  };

  /* ---------- 테마 / 발표 모드 ---------- */
  var theme = store.get("s2-theme");
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  if (store.get("s2-big") === "1") document.documentElement.classList.add("big");

  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    var isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("s2-theme", next);
  }
  function toggleBig() {
    var on = document.documentElement.classList.toggle("big");
    store.set("s2-big", on ? "1" : "0");
  }

  function currentFile() {
    var p = location.pathname.split("/").pop() || "index.html";
    return decodeURIComponent(p);
  }

  /* ---------- 상단 바, 목차, 이전/다음 ---------- */
  function buildChrome() {
    var file = currentFile();
    var idx = -1;
    PAGES.forEach(function (p, i) { if (p.file === file) idx = i; });
    var page = PAGES[idx] || PAGES[0];

    var bar = document.createElement("header");
    bar.className = "topbar";
    bar.innerHTML =
      '<div class="inner">' +
      '<a class="home" href="index.html">🔬 중3 과학 시즌2</a>' +
      '<span class="crumb">' + (page.unit ? page.unit + " · " + page.title : "생식과 유전 · 별") + "</span>" +
      '<span class="spacer"></span>' +
      '<div class="tools">' +
      '<a class="icon-btn wn-btn" href="wrong-notes.html" title="틀린 문제만 모아 보기 (이 기기에 저장)">📒 오답 <b class="wn-count"></b></a>' +
      '<button class="icon-btn" data-act="big" title="글자 크게 (발표 모드)">가+ 발표</button>' +
      '<button class="icon-btn" data-act="theme" title="밝게/어둡게">🌓</button>' +
      '<button class="icon-btn" data-act="print" title="인쇄 / PDF 저장">🖨</button>' +
      "</div></div><div class=\"progress-bar\"></div>";
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('[data-act="big"]').onclick = toggleBig;
    bar.querySelector('[data-act="theme"]').onclick = toggleTheme;
    bar.querySelector('[data-act="print"]').onclick = function () { window.print(); };

    var prog = bar.querySelector(".progress-bar");
    window.addEventListener("scroll", function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%";
    }, { passive: true });

    // 목차
    var toc = document.querySelector(".toc");
    if (toc) {
      var secs = document.querySelectorAll("main section.block[id]");
      var html = "<b>이 차시 목차</b>";
      secs.forEach(function (s) {
        var h = s.querySelector("h2");
        var label = h ? h.textContent.replace(/^\s*\d+\s*/, "") : s.id;
        html += '<a href="#' + s.id + '">' + label + "</a>";
      });
      toc.innerHTML = html;
      var links = toc.querySelectorAll("a");
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (e.isIntersecting) {
              links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
            }
          });
        }, { rootMargin: "-20% 0px -70% 0px" });
        secs.forEach(function (s) { io.observe(s); });
      }
    }

    // 이전 / 다음
    var main = document.querySelector("main");
    var NAV = PAGES.filter(function (p) { return p.nav !== false; });
    var nidx = -1;
    NAV.forEach(function (p, i) { if (p.file === file) nidx = i; });
    S2.wrong.badge();
    if (main && nidx > 0) {
      var pager = document.createElement("nav");
      pager.className = "pager";
      var prev = NAV[nidx - 1], next = NAV[nidx + 1];
      pager.innerHTML =
        (prev ? '<a class="prev" href="' + prev.file + '"><small>← 이전 차시</small>' + prev.title + "</a>" : "<span></span>") +
        (next ? '<a class="next" href="' + next.file + '"><small>다음 차시 →</small>' + next.title + "</a>" : "");
      main.appendChild(pager);
      store.set("s2-visited-" + file, "1");
    }
  }

  /* ---------- 정답 보기, 빈칸, 뒤집기 카드 ---------- */
  function bindInteractions(root) {
    root = root || document;
    root.querySelectorAll("[data-reveal]").forEach(function (btn) {
      if (btn._b) return; btn._b = 1;
      btn.addEventListener("click", function () {
        var t = document.getElementById(btn.getAttribute("data-reveal"));
        if (!t) return;
        var on = t.classList.toggle("show");
        btn.textContent = on ? (btn.getAttribute("data-hide") || "정답 숨기기") : (btn.getAttribute("data-label") || "정답 보기");
      });
      if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", btn.textContent);
    });
    root.querySelectorAll(".blank").forEach(function (b) {
      if (b._b) return; b._b = 1;
      b.setAttribute("tabindex", "0");
      b.setAttribute("role", "button");
      var tg = function () { b.classList.toggle("open"); };
      b.addEventListener("click", tg);
      b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tg(); } });
    });
    root.querySelectorAll(".flip").forEach(function (f) {
      if (f._b) return; f._b = 1;
      f.setAttribute("tabindex", "0");
      f.addEventListener("click", function () { f.classList.toggle("on"); });
      f.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.classList.toggle("on"); } });
    });
  }
  S2.bind = bindInteractions;

  S2.blankAll = function (containerId, open) {
    document.querySelectorAll("#" + containerId + " .blank").forEach(function (b) { b.classList.toggle("open", open); });
  };

  /* ---------- 퀴즈 엔진 ----------
   items: [{t:'mc', q, o:[...], a:index, e:'해설', tag}, {t:'ox', q, a:true/false, e}, {t:'short', q, a:['정답','허용답'], e}]
  */
  S2.quiz = function (el, items, opts) {
    opts = opts || {};
    if (typeof el === "string") el = document.getElementById(el);
    var score = 0, answered = 0;
    var circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];
    var scorable = items.filter(function (x) { return x.t !== "essay"; }).length;
    el.classList.add("quiz");
    el.innerHTML = "";
    var box = null;

    function update() {
      if (box) box.querySelector(".s").textContent = "맞힌 문제 " + score + " / " + scorable + " (푼 문제 " + answered + ")";
    }
    var page = opts.page || currentFile();
    function feedback(q, ok, item, msg) {
      var fb = q.querySelector(".fb");
      fb.className = "fb show " + (ok ? "ok" : "no");
      var note = "";
      if (!ok) {
        S2.wrong.add(item, page);
        note = ' <span class="wn-note">📒 오답 노트에 저장했어요.</span>';
      } else if (opts.review) {
        S2.wrong.remove(S2.wrong.idOf(item, page));
        note = ' <span class="wn-note">✅ 맞혔으니 오답 노트에서 뺐어요.</span>';
      }
      fb.innerHTML = (ok ? "<b>⭕ 정답!</b> " : "<b>❌ 다시 확인!</b> ") + (msg || "") + note;
      answered++; if (ok) score++;
      update();
      if (opts.onAnswer) opts.onAnswer(item, ok);
    }

    items.forEach(function (item, i) {
      var q = document.createElement("div");
      q.className = "q";
      var tag = item.tag ? '<span class="tag">' + item.tag + "</span>" : "";
      q.innerHTML = '<div class="qh"><span class="qn">Q' + (i + 1) + '.</span><span class="qt">' + item.q + tag + "</span>" +
        (opts.review ? '<button class="btn wn-del" title="오답 노트에서 빼기">✕ 빼기</button>' : "") + "</div>" +
        (item.fig ? '<div class="figure">' + item.fig + "</div>" : "");
      if (item.t === "mc") {
        var o = document.createElement("div"); o.className = "opts";
        item.o.forEach(function (txt, k) {
          var b = document.createElement("button");
          b.className = "opt"; b.innerHTML = circled[k] + " " + txt;
          b.onclick = function () {
            var bs = o.querySelectorAll(".opt");
            bs.forEach(function (x) { x.disabled = true; });
            bs[item.a].classList.add("right");
            if (k !== item.a) b.classList.add("wrong");
            feedback(q, k === item.a, item, (k === item.a ? "" : "정답은 <b>" + circled[item.a] + "</b>. ") + (item.e || ""));
          };
          o.appendChild(b);
        });
        q.appendChild(o);
      } else if (item.t === "ox") {
        var ox = document.createElement("div"); ox.className = "ox";
        [["O", true], ["X", false]].forEach(function (p) {
          var b = document.createElement("button");
          b.className = "opt"; b.textContent = p[0];
          b.onclick = function () {
            var bs = ox.querySelectorAll(".opt");
            bs.forEach(function (x) { x.disabled = true; });
            bs[item.a ? 0 : 1].classList.add("right");
            if (p[1] !== item.a) b.classList.add("wrong");
            feedback(q, p[1] === item.a, item, (p[1] === item.a ? "" : "정답은 <b>" + (item.a ? "O" : "X") + "</b>. ") + (item.e || ""));
          };
          ox.appendChild(b);
        });
        q.appendChild(ox);
      } else if (item.t === "short") {
        var s = document.createElement("div"); s.className = "short";
        s.innerHTML = '<input type="text" placeholder="답을 입력하세요" aria-label="답 입력"><button class="btn primary">확인</button><button class="btn">정답 보기</button>';
        var inp = s.querySelector("input"), bs2 = s.querySelectorAll("button");
        var norm = function (x) { return String(x).replace(/\s+/g, "").replace(/[.,。]/g, "").toLowerCase(); };
        var done = false;
        var check = function () {
          if (done || !inp.value.trim()) return;
          done = true; inp.disabled = true;
          var ok = item.a.some(function (a) { return norm(a) === norm(inp.value); });
          feedback(q, ok, item, "정답: <b>" + item.a[0] + "</b>. " + (item.e || ""));
        };
        bs2[0].onclick = check;
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
        bs2[1].onclick = function () {
          if (done) return; done = true; inp.disabled = true;
          feedback(q, false, item, "정답: <b>" + item.a[0] + "</b>. " + (item.e || ""));
        };
        q.appendChild(s);
      } else if (item.t === "essay") {
        var w = document.createElement("div");
        var id = "essay-" + Math.random().toString(36).slice(2);
        w.innerHTML = '<textarea rows="3" style="width:100%;font:inherit;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text)" placeholder="먼저 스스로 써 본 뒤 모범 답안과 비교해 보세요."></textarea>' +
          '<button class="btn reveal-btn" data-reveal="' + id + '">모범 답안 보기</button><div class="answer" id="' + id + '">' + item.a + "</div>";
        q.appendChild(w);
      }
      var fb = document.createElement("div"); fb.className = "fb"; q.appendChild(fb);
      if (opts.review) {
        q.querySelector(".wn-del").onclick = function () {
          S2.wrong.remove(S2.wrong.idOf(item, page));
          q.remove();
          if (opts.onRemove) opts.onRemove(item);
        };
      }
      el.appendChild(q);
    });

    if (scorable > 3 && opts.score !== false) {
      box = document.createElement("div");
      box.className = "score-box";
      box.innerHTML = '<span class="s"></span><button class="btn">처음부터 다시</button>';
      box.querySelector("button").onclick = function () { S2.quiz(el, items, opts); };
      el.appendChild(box);
      update();
    }
    bindInteractions(el);
  };

  /* ---------- 단계 보기(stepper) ----------
   steps: [{tab, title, svg (string or fn), html}]
  */
  S2.stepper = function (el, steps) {
    if (typeof el === "string") el = document.getElementById(el);
    el.classList.add("stepper");
    el.innerHTML = '<div class="tabs" role="tablist"></div><div class="stage"><div class="pic"></div><div class="desc"></div></div>' +
      '<div class="ctrl"><button class="btn" data-d="-1">← 이전</button><span class="muted small pos"></span><button class="btn primary" data-d="1">다음 →</button></div>';
    var tabs = el.querySelector(".tabs"), pic = el.querySelector(".pic"), desc = el.querySelector(".desc"), pos = el.querySelector(".pos");
    var cur = 0;
    steps.forEach(function (s, i) {
      var b = document.createElement("button");
      b.textContent = s.tab; b.setAttribute("role", "tab");
      b.onclick = function () { show(i); };
      tabs.appendChild(b);
    });
    function show(i) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      var s = steps[cur];
      pic.innerHTML = typeof s.svg === "function" ? s.svg() : s.svg;
      desc.innerHTML = "<h3>" + s.title + "</h3>" + s.html;
      tabs.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("on", k === cur); b.setAttribute("aria-selected", k === cur); });
      pos.textContent = (cur + 1) + " / " + steps.length;
      el.querySelector('[data-d="-1"]').disabled = cur === 0;
      el.querySelector('[data-d="1"]').disabled = cur === steps.length - 1;
      bindInteractions(desc);
    }
    el.querySelectorAll(".ctrl button").forEach(function (b) {
      b.onclick = function () { show(cur + Number(b.getAttribute("data-d"))); };
    });
    el.tabIndex = 0;
    el.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });
    show(0);
  };

  /* ---------- 염색체 그리기 ----------
   x,y: 중심, len: 길이, color, dup: 복제된(염색 분체 2개) 상태, rot: 회전(도)
  */
  S2.chromo = function (x, y, len, color, dup, rot, w) {
    w = w || 7;
    rot = rot || 0;
    var h = len, r = w / 2, out = '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')">';
    if (dup) {
      out += '<rect x="' + (-w - 0.6) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + color + '"/>';
      out += '<rect x="0.6" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + color + '"/>';
      out += '<circle cx="0" cy="0" r="' + (w * 0.55) + '" fill="' + color + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/>';
    } else {
      out += '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + color + '"/>';
      out += '<circle cx="0" cy="0" r="' + (w * 0.45) + '" fill="' + color + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/>';
    }
    return out + "</g>";
  };
  S2.COL = { dadL: "#3b82f6", momL: "#ef4444", dadS: "#60a5fa", momS: "#f87171" };

  S2.fmt = function (n, d) {
    if (!isFinite(n)) return "–";
    d = d == null ? 2 : d;
    return Number(n.toFixed(d)).toLocaleString("ko-KR");
  };

  // 인쇄할 때는 접힌 심화 내용도 펼침
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details.adv").forEach(function (d) { d.setAttribute("open", ""); });
  });

  document.addEventListener("DOMContentLoaded", function () {
    buildChrome();
    bindInteractions(document);
  });
})();
