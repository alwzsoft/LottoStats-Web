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

        data_list = []
        if isinstance(raw_json, dict) and 'data' in raw_json:
            inner_data = raw_json['data']
            if isinstance(inner_data, dict) and 'list' in inner_data:
                data_list = inner_data['list']

        if not data_list:
            print("데이터 리스트를 찾지 못했습니다.")
            return None

        all_numbers = []
        latest_draw = 0
        
        for item in data_list:
            try:
                draw_no = int(item.get('ltEpsd', 0))
                if draw_no > latest_draw:
                    latest_draw = draw_no
                
                draw_numbers = [
                    int(item.get('tm1WnNo', 0)), int(item.get('tm2WnNo', 0)), 
                    int(item.get('tm3WnNo', 0)), int(item.get('tm4WnNo', 0)), 
                    int(item.get('tm5WnNo', 0)), int(item.get('tm6WnNo', 0)),
                    int(item.get('bnsWnNo', 0))
                ]
                all_numbers.extend([n for n in draw_numbers if 1 <= n <= 45])
            except (KeyError, TypeError, ValueError):
                continue

        counts = Counter(all_numbers)
        frequency = [[i, counts.get(i, 0)] for i in range(1, 46)]
        frequency.sort(key=lambda x: x[1], reverse=True) 

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

        # 5. 경로 복사 (public 및 docs 폴더 모두 대응)
        target_paths = ['../public/lotto_stats.json', '../docs/lotto_stats.json', '../lotto_stats.json']
        
        for path in target_paths:
            # 절대 경로 계산
            abs_path = os.path.abspath(os.path.join(os.getcwd(), path))
            target_dir = os.path.dirname(abs_path)
            
            # 폴더가 존재하는지 확인 후 복사
            if os.path.exists(target_dir):
                shutil.copy(file_name, abs_path)
                print(f"데이터를 {path} 경로로 복사했습니다.")
            else:
                print(f"경고: {target_dir} 폴더가 존재하지 않아 복사를 건너뜁니다.")

        print(f"성공! 최신 회차: {latest_draw}회")
        return stats

    except Exception as e:
        print(f"데이터 처리 중 오류 발생: {e}")
        return None

if __name__ == "__main__":
    collect_lotto_stats()