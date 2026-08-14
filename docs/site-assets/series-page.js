/*
 * シリーズ詳細ページの中身を組み立てる。
 *
 * ページ側は <html data-series-slug="..."> を指すだけでよく、話数・進捗・
 * エピソードはすべて episodes.json / series.json から引く。新しいシリーズを
 * 始めるときは docs/series/<slug>/ を複製して、slug と静的な meta 情報
 * (title / description / canonical / og:image と初期表示のテキスト)を
 * 差し替えれば動く。
 */
(function () {
  "use strict";

  var slug = document.documentElement.getAttribute("data-series-slug");
  var episodesBox = document.querySelector("[data-series-episodes]");

  function fail(message) {
    if (episodesBox) episodesBox.innerHTML = '<p class="empty">' + message + "</p>";
  }

  JRAP.loadData().then(function (data) {
    var series = data.series.filter(function (s) { return s.slug === slug; })[0];
    if (!series) {
      fail("このシリーズの情報が見つかりませんでした。");
      return;
    }

    function setText(selector, text) {
      var node = document.querySelector(selector);
      if (node) node.textContent = text;
    }

    var running = series.status === "running";

    setText("[data-series-number]", "SERIES " + series.number);
    setText("[data-series-label]", "SERIES " + series.number + " — " + (running ? "連載中" : "完結"));
    setText("[data-series-title]", JRAP.seriesTitle(series));
    if (series.lead) setText("[data-series-lead]", series.lead);
    if (series.note) setText("[data-series-note]", series.note);
    setText("[data-series-total]", "/ 全" + series.total_tracks + "話 公開");

    var art = document.querySelector("[data-series-art]");
    if (art) {
      art.src = JRAP.url(series.art);
      art.alt = series.art_alt || "";
    }

    var count = document.querySelector("[data-series-count]");
    if (count && count.textContent !== String(series.published)) {
      count.textContent = String(series.published);
      JRAP.countUp(count);
    }

    /* すぐ上のカウンターが「11 / 全13話 公開」を出しているので、バー側の数字は省く */
    var progress = document.querySelector("[data-series-progress]");
    if (progress) progress.replaceWith(JRAP.renderProgress(series, { showCount: false }));

    JRAP.renderEpisodes(episodesBox, series.episodes, { showSeries: false });

    var others = document.querySelector("[data-series-others]");
    if (others) {
      var rest = data.series.filter(function (s) { return s.slug !== slug; });
      others.innerHTML = "";
      if (!rest.length) {
        others.appendChild(JRAP.el("p", "empty", "ほかのシリーズはまだありません。"));
      } else {
        rest.forEach(function (s) { others.appendChild(JRAP.renderSeriesCard(s)); });
      }
    }

    JRAP.initReveal();
  }).catch(function () {
    fail("エピソードを読み込めませんでした。RSSフィードからお聴きいただけます。");
  });
})();
