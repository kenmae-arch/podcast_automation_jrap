/*
 * J-RAP DEEP DIVE — 共通スクリプト
 *
 * 方針
 *  - 事実は docs/episodes.json(パイプラインが生成)と docs/series.json(手入力)だけを見る。
 *    ページ側で話数や日付を書き足さない。新しい回を配信すれば自動で反映される。
 *  - JS が動かなくても本文は読める。隠すのは has-js が付いたときだけ(CSS 側で担保)。
 *  - アニメーションライブラリは使わない(GitHub Pages の静的サイト)。
 */
(function () {
  "use strict";

  document.documentElement.classList.add("has-js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* docs/ からの相対位置。ページごとに <html data-base="../"> で指定する */
  var BASE = document.documentElement.getAttribute("data-base") || "./";
  function url(path) {
    return BASE + String(path).replace(/^\.?\//, "");
  }

  /* ── データ ─────────────────────────────────────────── */

  var dataPromise = null;
  function loadData() {
    if (!dataPromise) {
      dataPromise = Promise.all([
        fetch(url("episodes.json")).then(function (r) {
          if (!r.ok) throw new Error("episodes.json");
          return r.json();
        }),
        fetch(url("series.json")).then(function (r) {
          if (!r.ok) throw new Error("series.json");
          return r.json();
        })
      ]).then(function (res) {
        var episodes = (res[0] || []).map(parseEpisode);
        var meta = res[1] || {};
        var series = (meta.series || []).map(function (s) {
          var mine = episodes.filter(function (ep) { return ep.image === s.art; });
          /* 公開話数は必ず episodes.json から数える。series.json には書かない */
          return Object.assign({}, s, {
            episodes: mine.sort(function (a, b) { return a.no - b.no; }),
            published: mine.length
          });
        });
        /* エピソードにシリーズを逆参照させ、安定したアンカーIDを与える */
        series.forEach(function (s) {
          s.episodes.forEach(function (ep) {
            ep.series = s;
            ep.id = s.slug + "-" + pad(ep.no);
          });
        });
        episodes.forEach(function (ep, i) {
          if (!ep.id) ep.id = "ep-" + pad(i + 1);
        });
        return { episodes: episodes, series: series, upcoming: meta.upcoming || [] };
      });
    }
    return dataPromise;
  }

  function pad(n) {
    return String(n).length < 2 ? "0" + n : String(n);
  }

  /*
   * タイトルの型: {アーティスト}『{アルバム}』全曲解説 #{n} {キャッチコピー}『{曲名}』
   * 例外: 「#4(最終回) 世代をつなぐ祝福『Cool running』」のような注記付き。
   * 型に合わない回でも落ちないよう、素のタイトルへフォールバックする。
   */
  function parseEpisode(raw) {
    var ep = Object.assign({}, raw);
    ep.date = (raw.published || "").slice(0, 10);
    ep.headline = raw.title;
    ep.no = null;

    var m = /^(.*?)『(.*?)』全曲解説\s*#(\d+)(?:[（(]([^）)]*)[）)])?\s*(.*)$/.exec(raw.title || "");
    if (m) {
      ep.artist = m[1].trim();
      ep.album = m[2].trim();
      ep.no = parseInt(m[3], 10);
      ep.note = (m[4] || "").trim();
      var rest = (m[5] || "").trim();
      var r = /^(.*?)『(.+)』\s*$/.exec(rest);
      if (r) {
        ep.headline = r[1].trim();
        ep.song = r[2].trim();
      } else {
        ep.headline = rest;
      }
    }
    return ep;
  }

  /* ── DOM ヘルパー ───────────────────────────────────── */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    return iso ? iso.replace(/-/g, ".") : "";
  }

  /* ── エピソード一覧 ─────────────────────────────────── */

  /*
   * options.showSeries … 見出しの下にシリーズ名を出す(横断一覧で使う)
   * options.limit       … 先頭 N 件だけ描画する
   */
  function renderEpisodes(container, episodes, options) {
    var opts = options || {};
    container.innerHTML = "";

    if (!episodes.length) {
      container.appendChild(el("p", "empty", "エピソードはまだありません。"));
      return;
    }

    var list = opts.limit ? episodes.slice(0, opts.limit) : episodes;

    list.forEach(function (ep) {
      var item = el("details", "episode");
      item.id = ep.id;

      var summary = el("summary", "episode__summary");

      if (ep.image) {
        var art = el("img", "episode__art");
        art.src = url(ep.image);
        art.alt = "";
        art.loading = "lazy";
        art.width = 64;
        art.height = 64;
        summary.appendChild(art);
      }

      var body = el("div", "episode__body");

      var meta = el("div", "episode__meta");
      if (ep.no != null) {
        var no = el("span", "episode__no", "#" + pad(ep.no));
        meta.appendChild(no);
      }
      meta.appendChild(el("span", null, formatDate(ep.date)));
      if (ep.note) meta.appendChild(el("span", null, ep.note));
      body.appendChild(meta);

      var title = el("h3", "episode__title");
      /* キャッチコピーと曲名は改行位置を制御したいので塊に分ける */
      if (ep.song) {
        title.appendChild(el("span", "nb", ep.headline));
        title.appendChild(el("span", "nb", "『" + ep.song + "』"));
      } else {
        title.textContent = ep.headline;
      }
      body.appendChild(title);

      if (opts.showSeries && ep.series) {
        body.appendChild(
          el("div", "episode__series", ep.series.artist + "『" + ep.series.album + "』")
        );
      }

      summary.appendChild(body);
      summary.appendChild(el("span", "episode__toggle", "OPEN"));
      item.appendChild(summary);

      var detail = el("div", "episode__detail");
      detail.appendChild(el("p", "episode__desc", ep.description || ""));

      var audio = el("audio", "episode__audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = url("audio/" + ep.audio_file);
      detail.appendChild(audio);

      item.appendChild(detail);
      container.appendChild(item);
    });

    openFromHash(container);
  }

  /* 共有された URL(#shinkoiwa-03)で開いた回を展開して見せる */
  function openFromHash(container) {
    var hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    var target = container.querySelector('[id="' + CSS.escape(hash) + '"]');
    if (!target) return;
    target.open = true;
    target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }

  /* ── シリーズ ───────────────────────────────────────── */

  function seriesTitle(s) {
    return s.artist + "『" + s.album + "』(" + s.year + ")";
  }

  function renderSeriesCard(s, options) {
    var opts = options || {};
    var card = el("a", "series-card");
    card.href = url("series/" + s.slug + "/");

    var art = el("img", "series-card__art");
    art.src = url(s.art);
    art.alt = "";
    art.loading = "lazy";
    art.width = 96;
    art.height = 96;
    card.appendChild(art);

    var body = el("div", "series-card__body");

    var head = el("div", "series-card__num");
    head.appendChild(el("span", null, "SERIES " + s.number));
    body.appendChild(head);

    body.appendChild(el("h3", "series-card__title", seriesTitle(s)));
    body.appendChild(el("p", "series-card__desc", s.summary));

    if (opts.progress !== false) body.appendChild(renderProgress(s));

    body.appendChild(el("div", "series-card__more", "シリーズを見る →"));
    card.appendChild(body);
    return card;
  }

  /* options.showCount: false … 話数を数字で持つ要素が近くにあるとき、重複表示を避ける */
  function renderProgress(s, options) {
    var opts = options || {};
    var wrap = el("div", "progress");

    var tag = el("span", "status-tag" + (s.status === "running" ? " status-tag--running" : ""));
    tag.textContent = s.status === "running" ? "連載中" : "完結";
    wrap.appendChild(tag);

    var track = el("div", "progress__track");
    var bar = el("div", "progress__bar");
    var ratio = s.total_tracks ? Math.min(1, s.published / s.total_tracks) : 0;
    bar.setAttribute("data-progress", String(ratio));
    track.appendChild(bar);
    wrap.appendChild(track);

    if (opts.showCount !== false) {
      wrap.appendChild(el("span", null, s.published + " / 全" + s.total_tracks + "話"));
    }

    /* 幅の反映は次フレーム。トランジションを効かせるため */
    requestAnimationFrame(function () {
      bar.style.width = (ratio * 100).toFixed(1) + "%";
    });
    return wrap;
  }

  /* ── モバイルメニュー ───────────────────────────────── */

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var overlay = document.querySelector("[data-menu]");
    if (!toggle || !overlay) return;

    var lastFocused = null;

    function focusables() {
      return Array.prototype.slice.call(
        overlay.querySelectorAll('a[href], button:not([disabled])')
      );
    }

    function open() {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var f = focusables();
      if (f.length) f[0].focus();
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      overlay.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      /* オーバーレイの外へフォーカスが逃げないようにする */
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      if (overlay.hidden) open(); else close();
    });

    overlay.querySelectorAll("[data-menu-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    /* ページ内アンカーで移動したらメニューは閉じる */
    overlay.querySelectorAll('a[href^="#"], a[href*="#"]').forEach(function (a) {
      a.addEventListener("click", close);
    });

    /* デスクトップ幅に戻ったら開きっぱなしを解除する */
    var mq = window.matchMedia("(min-width: 640px)");
    var onChange = function (e) { if (e.matches && !overlay.hidden) close(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ── スクロール表示 ─────────────────────────────────── */

  function initReveal(root) {
    var targets = (root || document).querySelectorAll(".reveal:not(.is-visible)");
    if (!targets.length) return;

    function showAll() {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
    }

    if (!("IntersectionObserver" in window) || reduced) {
      showAll();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    targets.forEach(function (t) { io.observe(t); });

    /*
     * 保険。監視が何らかの理由で発火しなくても、数秒後には必ず出す。
     * 演出のために本文が読めなくなる事故のほうが、演出を失うより重い。
     */
    window.setTimeout(showAll, 2500);
  }

  /* ── 波形 ───────────────────────────────────────────── */

  var BAR_HEIGHTS = [22, 34, 14, 40, 26, 18, 38, 30, 12, 36, 24, 40,
                     16, 28, 20, 34, 12, 38, 26, 30, 16, 40, 22, 32];

  function initWaveforms() {
    document.querySelectorAll("[data-waveform]").forEach(function (host) {
      if (host.childElementCount) return;
      BAR_HEIGHTS.forEach(function (h, i) {
        var bar = document.createElement("span");
        bar.style.height = h + "px";
        bar.style.animationDelay = (i * 70) + "ms";
        host.appendChild(bar);
      });
    });
  }

  /* ── 話数カウンター ─────────────────────────────────── */

  /*
   * HTML には最終値を静的に書いておき、JS はそれを 1 から数え上げるだけにする。
   * こうすると JS 無効でも正しい話数が出る。データ読み込み後に値を差し替えた
   * ときは、呼び出し側から countUp() を呼び直す。
   */
  function countUp(node) {
    var target = parseInt(node.textContent.replace(/[^\d]/g, ""), 10);
    if (!target || reduced) return;

    var prefix = /^#/.test(node.textContent.trim()) ? "#" : "";
    var start = null;
    var duration = 1400;

    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = prefix + Math.max(1, Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    }
    node.textContent = prefix + "1";
    requestAnimationFrame(step);
  }

  function initCounters() {
    document.querySelectorAll("[data-countup]").forEach(countUp);
  }

  /* ── 墨煙(WebGL) ─────────────────────────────────── */

  /*
   * ヒーロー背面の墨のにじみ。可視のときだけコンテキストを持ち、外れたら
   * 明示的に破棄する(ページを行き来してコンテキストが枯渇しないように)。
   * WebGL が無い環境では CSS の radial-gradient がそのまま最終形になる。
   */
  function initInkSmoke() {
    var host = document.querySelector("[data-ink-smoke]");
    if (!host || !("IntersectionObserver" in window)) return;

    var gl = null, canvas = null, loop = null, uR, uT, uK;
    var strength = parseFloat(host.getAttribute("data-ink-strength")) || 0.6;

    function init() {
      canvas = document.createElement("canvas");
      host.appendChild(canvas);
      gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
      if (!gl) { canvas.remove(); canvas = null; return false; }

      var vs = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
      var fs =
        "precision highp float;uniform vec2 R;uniform float T;uniform float K;" +
        "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
        "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}" +
        "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<6;i++){v+=a*n(p);p=m*p*2.02+vec2(1.7,9.2);a*=.5;}return v;}" +
        "void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=uv*vec2(R.x/R.y,1.)*1.6;float t=T*.055;" +
        "vec2 q=vec2(fbm(p+t*.12),fbm(p+vec2(5.2,1.3)-t*.09));" +
        "vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+t*.18),fbm(p+3.2*q+vec2(8.3,2.8)-t*.13));" +
        "float f=fbm(p+3.6*r-vec2(0.,t*.5));" +
        "float w=pow(smoothstep(.28,1.05,f+.25*q.y),1.5);" +
        "w*=.25+.75*uv.y;" +
        "vec3 paper=vec3(.969,.967,.960);vec3 ink=vec3(.10,.096,.088);" +
        "gl_FragColor=vec4(mix(paper,ink,w*K),1.);}";

      var mk = function (type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      var program = gl.createProgram();
      gl.attachShader(program, mk(gl.VERTEX_SHADER, vs));
      gl.attachShader(program, mk(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        canvas.remove(); canvas = null; gl = null; return false;
      }
      gl.useProgram(program);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(program, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      uR = gl.getUniformLocation(program, "R");
      uT = gl.getUniformLocation(program, "T");
      uK = gl.getUniformLocation(program, "K");
      return true;
    }

    function draw(t) {
      if (!gl || !canvas || gl.isContextLost()) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.75;
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uT, t);
      gl.uniform1f(uK, strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function start() {
      if (!gl && !init()) return;
      if (reduced) { draw(8); return; }  /* 1フレームだけ描いて静止 */
      cancelAnimationFrame(loop);
      var tick = function (t) {
        draw(t / 1000);
        loop = requestAnimationFrame(tick);
      };
      loop = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(loop);
      if (gl) {
        var ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
        gl = null;
      }
      if (canvas) { canvas.remove(); canvas = null; }
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.05 }).observe(host);
  }

  /* ── 起動 ───────────────────────────────────────────── */

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    initMenu();
    initWaveforms();
    initCounters();
    initInkSmoke();
    initReveal();
  });

  window.JRAP = {
    base: BASE,
    url: url,
    loadData: loadData,
    renderEpisodes: renderEpisodes,
    renderSeriesCard: renderSeriesCard,
    renderProgress: renderProgress,
    seriesTitle: seriesTitle,
    initReveal: initReveal,
    countUp: countUp,
    el: el
  };
})();
