import requests
import json
from collections import Counter
import os
import time
from datetime import datetime
from bs4 import BeautifulSoup

def get_latest_draw():
    """최신 회차 번호 가져오기"""
    # 동행복권 결과 페이지에서 최신 회차 파싱
    url = "https://www.dhlottery.co.kr/gameResult.do?method=byWin"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        # 회차 정보 찾기: <div class="win_result"> 안에 <h4>제 XXX회 당첨결과</h4>
        win_result = soup.find('div', class_='win_result')
        if win_result:
            h4 = win_result.find('h4')
            if h4:
                text = h4.get_text()
                # "제 1150회 당첨결과" 같은 텍스트에서 숫자 추출
                import re
                match = re.search(r'제\s+(\d+)회', text)
                if match:
                    return int(match.group(1))
    except Exception as e:
        print(f"최신 회차 가져오기 실패: {e}")


def collect_lotto_data():
    """전체 로또 데이터 수집 및 저장 (증분 업데이트)"""
    latest_draw = get_latest_draw()
    if latest_draw is None:
        # 동행복권 페이지 파싱 실패 시 기본값 (또는 API 결과 등으로 보완 가능)
        latest_draw = 1155 # 예시 최신 회차
        print(f"최신 회차 파싱 실패로 기본값 {latest_draw} 사용")

    all_draws = []
    all_numbers = []

    # 기존 데이터 로드 (있으면)
    if os.path.exists('lotto_data.json'):
        try:
            with open('lotto_data.json', 'r', encoding='utf-8') as f:
                all_draws = json.load(f)
            print(f"기존 데이터 로드: {len(all_draws)}회차")

            # 기존 데이터에서 마지막 회차 확인
            if all_draws:
                last_draw = max(draw['drawNo'] for draw in all_draws)
                print(f"마지막 저장 회차: {last_draw}회")
            else:
                last_draw = 0

            # 기존 데이터의 모든 번호 수집
            for draw in all_draws:
                all_numbers.extend(draw["numbers"])

        except Exception as e:
            print(f"기존 데이터 로드 실패: {e}")
            all_draws = []
            last_draw = 0
    else:
        last_draw = 0

    # 새 데이터 수집 (last_draw + 1부터)
    start_draw = last_draw + 1
    if start_draw <= latest_draw:
        print(f"신규 데이터 수집: {start_draw}회 ~ {latest_draw}회")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        for i in range(start_draw, latest_draw + 1):
            url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={i}"
            try:
                # 0.1초 지연으로 차단 방지
                time.sleep(0.1)
                response = requests.get(url, headers=headers)
                res = response.json()

                if res.get("returnValue") == "success":
                    draw_data = {
                        "drawNo": res["drwNo"],
                        "drawDate": res["drwNoDate"],
                        "numbers": [res[f"drwtNo{j}"] for j in range(1, 7)],
                        "bonus": res["bnusNo"]
                    }
                    all_draws.append(draw_data)
                    all_numbers.extend(draw_data["numbers"])

                    if i % 50 == 0:
                        print(f"{i}회차 처리 완료...")
            except Exception as e:
                print(f"Error at draw {i}: {e}")
                continue

    # 데이터 저장 (백엔드용)
    with open('lotto_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_draws, f, ensure_ascii=False, indent=2)

    # 빈도수 계산 및 저장
    count = Counter(all_numbers)
    frequency = count.most_common(45)

    stats = {
        "total_draws": len(all_draws),
        "latest_draw": latest_draw,
        "frequency": frequency,
        "last_updated": str(datetime.now())
    }

    # 백엔드 폴더에 저장 (참고용)
    with open('lotto_stats.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    # 웹사이트 public 폴더에 자동 복사
    try:
        # 프로젝트 루트의 public 폴더와 빌드 결과물 docs 폴더 모두 업데이트
        paths = ['../public/lotto_stats.json', '../docs/lotto_stats.json']
        for path in paths:
            if os.path.exists(os.path.dirname(os.path.abspath(os.path.join(os.getcwd(), path)))):
                with open(os.path.join(os.getcwd(), path), 'w', encoding='utf-8') as f:
                    json.dump(stats, f, ensure_ascii=False, indent=2)
                print(f"웹사이트 경로 업데이트 완료: {path}")
    except Exception as e:
        print(f"웹사이트 경로 업데이트 실패: {e}")

    print(f"데이터 수집 완료: 총 {len(all_draws)}회차 (신규 {latest_draw - last_draw}회차)")
    return stats

def generate_recommendation():
    """번호 추천 생성"""
    if not os.path.exists('lotto_stats.json'):
        collect_lotto_data()

    with open('lotto_stats.json', 'r', encoding='utf-8') as f:
        stats = json.load(f)

    # 새로운 알고리즘: 상위 15개에서 4개, 하위 15개에서 2개 선택
    import random

    # 상위 15개 번호 (고빈도)
    top_15 = [num for num, _ in stats['frequency'][:15]]

    # 하위 15개 번호 (저빈도, 행운 요소)
    bottom_15 = [num for num, _ in stats['frequency'][-15:]]

    # 상위에서 4개, 하위에서 2개 랜덤 선택
    selected_top = random.sample(top_15, 4)
    selected_bottom = random.sample(bottom_15, 2)

    # 조합 및 정렬
    recommended = sorted(selected_top + selected_bottom)

    return {
        "numbers": recommended,
        "method": "balanced_frequency_mix",
        "stats_version": stats.get("last_updated")
    }

if __name__ == "__main__":
    # 데이터 수집 실행
    stats = collect_lotto_data()
    print("가장 많이 나온 숫자 TOP 10:", stats['frequency'][:10])

    # 추천 번호 생성
    rec = generate_recommendation()
    print("추천 번호:", rec['numbers'])
