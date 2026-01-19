import requests
import json
import time
import os
import shutil
from collections import Counter
from datetime import datetime

def collect_lotto_stats():
    timestamp = int(time.time() * 1000)
    url = f"https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all&_={timestamp}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.dhlottery.co.kr/lt645/result',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
    }

    try:
        print(f"동행복권 API 데이터 요청 중...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        raw_json = response.json()

        # 1. 데이터 리스트 추출 (data -> list 경로 확인)
        data_list = []
        if isinstance(raw_json, dict) and 'data' in raw_json:
            inner_data = raw_json['data']
            if isinstance(inner_data, dict) and 'list' in inner_data:
                data_list = inner_data['list']
                print(f"데이터 리스트를 찾았습니다. (총 {len(data_list)}개 회차)")

        if not data_list:
            print("데이터 리스트를 찾지 못했습니다. 구조를 다시 확인하세요.")
            return None

        all_numbers = []
        latest_draw = 0
        
        # 2. 데이터 파싱 및 번호 수집
        for item in data_list:
            try:
                # 회차 번호 (ltEpsd)
                draw_no = int(item.get('ltEpsd', 0))
                if draw_no > latest_draw:
                    latest_draw = draw_no
                
                # 당첨번호 및 보너스 번호 (tm1WnNo ~ tm6WnNo, bnsWnNo)
                draw_numbers = [
                    int(item.get('tm1WnNo', 0)), int(item.get('tm2WnNo', 0)), 
                    int(item.get('tm3WnNo', 0)), int(item.get('tm4WnNo', 0)), 
                    int(item.get('tm5WnNo', 0)), int(item.get('tm6WnNo', 0)),
                    int(item.get('bnsWnNo', 0))
                ]
                # 유효한 번호(1~45)만 필터링하여 추가
                all_numbers.extend([n for n in draw_numbers if 1 <= n <= 45])
            except (KeyError, TypeError, ValueError):
                continue

        # 3. 빈도수 집계
        counts = Counter(all_numbers)
        # 1번부터 45번까지 루프를 돌며 [번호, 횟수] 형식으로 저장
        frequency = [[i, counts.get(i, 0)] for i in range(1, 46)]

        stats = {
            "total_draws": len(data_list),
            "latest_draw": latest_draw,
            "frequency": frequency,
            "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        # 4. JSON 파일 저장
        file_name = 'lotto_stats.json'
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)

        # 5. Next.js public 폴더로 복사
        if os.path.exists('../public'):
            shutil.copy(file_name, '../public/lotto_stats.json')
            print("데이터를 ../public/lotto_stats.json 경로로 복사했습니다.")

        print(f"성공! 최신 회차: {latest_draw}회 (총 {len(data_list)}개 회차 데이터 집계 완료)")
        return stats

    except Exception as e:
        print(f"데이터 처리 중 오류 발생: {e}")
        return None

if __name__ == "__main__":
    collect_lotto_stats()