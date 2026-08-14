# 概要

これは「日本語ラップ アルバム全曲解説(J-RAP DEEP DIVE)」(ポッドキャスト公式サイト/GitHub Pages)のトップページの構成およびテキストのアイデアです。

DESIGN.md(見た目の仕様)と対になり、CONTENTS.md(この文書)が中身を担います。矛盾したときは本ファイル(事実)を優先してください。事実の創作は禁止です。

---

## 0. メタ情報

- **title**: 日本語ラップ アルバム全曲解説 - 名盤を、1曲ずつ。
- **meta-description**: 日本語ラップの名盤を1話1曲で深掘り解説するポッドキャスト。制作背景・リリックのテーマ・音楽的な仕掛けを、1話10〜15分でじっくり読み解きます。第1弾はMall Boyz『Mall Tape』、第2弾はZORN『新小岩』。
- **og:title**: 日本語ラップ アルバム全曲解説 | J-RAP DEEP DIVE
- **og:description**: meta-description と同一

---

## 1. グローバルナビ

<!-- 1ページ構成のため、ページ内アンカー+外部リンクで構成 -->

- HOME
- SERIES(#series シリーズ一覧)
- EPISODES(#episodes)
- ABOUT(#about)
- RSS(feed.xml へ外部リンク)

---

## 2. HERO

- **メインコピー**:
  名盤を、1曲ずつ。
- **サブコピー**: 日本語ラップの名盤を、1話1曲で深掘りする長尺解説ポッドキャスト。制作背景・リリックのテーマ・音楽的な仕掛けを、10〜15分でじっくり。
- 番組名: 日本語ラップ アルバム全曲解説(英語キッカー: J-RAP DEEP DIVE)
- **連載中の看板(ヒーロー内に必須)**: 連載中: ZORN『新小岩』全13話 — #11まで公開中
  - CTA: 最新話を聴く → #episodes
  - サブCTA: RSSで購読 → feed.xml

---

## 3. ABOUT

- **ラベル**: ABOUT
- **見出し**: この番組について
- **本文**:
  日本語ラップの名盤を、1シリーズ=1アルバム、1話=1曲の形式でたどる解説ポッドキャストです。1話4,000〜6,000字(約10〜15分)の長尺で、制作背景・リリックのテーマ・音楽的な仕掛けを掘り下げます。

  歌詞の朗読・引用は行わず、批評・解説を目的とした番組です。事実と編集上の解釈は区別し、解釈は「このシリーズでは〜と捉えます」の形で示します。

  海外アーティスト編の姉妹番組「アルバム全曲解説」も配信中です。
- **キーワード列**: Japanese Hip Hop / Album Guide / Track by Track / Deep Dive Podcast

---

## 4. SERIES(連載中)

- **ラベル**: NOW RUNNING
- **見出し**: 連載中のシリーズ

| No | シリーズ名 | 本文 | 画像 / リンク先 |
| --- | --- | --- | --- |
| 02 | ZORN『新小岩』(2020) | 全13話中11話公開。地元・新小岩を名乗ることから始まる、生活と地元の物語を1曲ずつ読み解く。 | art/shinkoiwa.jpg(alt: 『新小岩』シリーズアートワーク。夕焼けの商店街アーケードと総武線) |

---

## 5. SERIES(完結)

- **ラベル**: ARCHIVE
- **見出し**: 完結したシリーズ

| No | シリーズ名 | 本文 | 画像 / リンク先 |
| --- | --- | --- | --- |
| 01 | Mall Boyz『Mall Tape』(2018) | 全4話・完結。TohjiとgummyboyによるMall Boyzの1st EPを、1曲目『Higher』から順に解説。 | art/malltape.jpg(alt: 『Mall Tape』シリーズアートワーク。夜のモールの吹き抜けとエスカレーター) |

---

## 6. EPISODES(#episodes)

- **見出し**: EPISODES
- **仕様**: エピソード一覧は `docs/episodes.json` から自動生成する(日付降順)。各行 = 日付 / タイトル / 要約 / シリーズアートワーク / `<audio>` プレーヤー(音声はサイト内で再生できる。姉妹番組サイトと異なりプレーヤーは必須)。
- **タイトルの型**: `{アーティスト}『{アルバム}』全曲解説 #{n} {キャッチコピー}『{曲名}』`
  - 例: ZORN『新小岩』全曲解説 #3 土手と夕焼けの詩学『Memory Lane』
  - 例: Mall Boyz『Mall Tape』全曲解説 #1 上昇の合図『Higher』
- 欠損フィールドは非表示にする。「不明」「TBD」等の代替文字列を画面に出さない。

---

## 7. 購読(#subscribe)

- **見出し**: 番組を購読する
- **CTAボタン**: RSSフィード → https://kenmae-arch.github.io/podcast_automation_jrap/feed.xml
- 将来 Spotify / Apple Podcasts / Amazon Music のバッジ導線を追加する可能性がある(現時点でURLは無いので架空のリンクを作らないこと)

---

## 8. フッター(#footer)

- **運営情報**:
  Produced and edited by kenmae
- **リンク**:
  - GitHub: https://github.com/kenmae-arch/podcast_automation_jrap
  - 姉妹番組: アルバム全曲解説(海外編): https://kenmae-arch.github.io/podcast_automation_music/
- **権利表記(必須)**:
  歌詞の朗読・引用は行わず、批評・解説を目的とした番組です。楽曲の権利は各権利者に帰属します。
- **コピーライト**: © kenmae

---
