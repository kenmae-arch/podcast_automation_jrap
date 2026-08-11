"""配信済みエピソードの音声だけを作り直すツール。

読み仮名の改善などで音声を差し替えたいときに使う。台本は
scripts/published/ のアーカイブから読み、以下を守って差し替える:

- 音声ファイル名は必ず変える(配信先がURL単位でキャッシュするため)
- episodes.json の guid は変えない(変えると別エピソード扱いで重複配信される)

    python tools/regenerate_episode.py 1              # 通算1話目を v2 として再生成
    python tools/regenerate_episode.py 1 --suffix v3  # 接尾辞を指定
"""
import argparse
import json
import logging
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

import config  # noqa: E402
from audio_generator import create_audio_generator  # noqa: E402
from rss_manager import RSSManager  # noqa: E402

logger = logging.getLogger(__name__)


def regenerate(number: int, suffix: str) -> None:
    episodes_path = config.DOCS_DIR / "episodes.json"
    episodes = json.loads(episodes_path.read_text(encoding="utf-8"))
    if not 1 <= number <= len(episodes):
        raise SystemExit(f"エピソード {number} がありません(全{len(episodes)}話)")
    entry = episodes[number - 1]

    scripts = sorted(config.PUBLISHED_SCRIPTS_DIR.glob(f"*_ep{number:03d}.json"))
    if not scripts:
        raise SystemExit(f"台本アーカイブが見つかりません: *_ep{number:03d}.json")
    script = json.loads(scripts[-1].read_text(encoding="utf-8"))["script"]

    old_path = config.AUDIO_DIR / entry["audio_file"]
    new_path = config.AUDIO_DIR / f"{old_path.stem}_{suffix}.mp3"
    if new_path.exists():
        raise SystemExit(f"既に存在します: {new_path.name}(--suffix を変えてください)")

    logger.info("再生成: #%03d %s -> %s", number, entry["audio_file"], new_path.name)
    create_audio_generator().generate(script, new_path)

    entry["audio_file"] = new_path.name
    entry["size_bytes"] = new_path.stat().st_size
    # guid・published はそのまま。エピソードの同一性を保つ。
    episodes_path.write_text(
        json.dumps(episodes, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    if old_path.exists() and old_path != new_path:
        old_path.unlink()
        logger.info("旧音声を削除しました: %s", old_path.name)

    RSSManager().regenerate()
    logger.info("完了: %s (%.1f KB)", new_path.name, entry["size_bytes"] / 1024)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("episode", type=int, help="通算エピソード番号")
    ap.add_argument("--suffix", default="v2", help="新しい音声ファイル名の接尾辞")
    args = ap.parse_args()
    regenerate(args.episode, args.suffix)
