'use client';

console.log("페이지 렌더링 시작");

import { useState, useEffect } from 'react';

interface Stats {
  total_draws: number;
  latest_draw: number;
  frequency: [number, number][];
  last_updated: string;
}

interface Recommendation {
  numbers: number[];
  method: string;
  stats_version: string;
}

export default function LottoPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [visibleNumbers, setVisibleNumbers] = useState<number[]>([]);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showTopNumbers, setShowTopNumbers] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [counters, setCounters] = useState({
    totalDraws: 0,
    samples: 0,
    numbersOut: 0,
    accuracy: 0,
    progressWidth: 0
  });
  const [hasGenerated, setHasGenerated] = useState(false);
  const [processStep, setProcessStep] = useState(0);

  // 번호별 색상 함수
  const getNumberColor = (num: number): string => {
    if (num >= 1 && num <= 10) return 'bg-yellow-400';      // 노란색
    if (num >= 11 && num <= 20) return 'bg-blue-400';      // 파란색
    if (num >= 21 && num <= 30) return 'bg-red-400';       // 빨간색
    if (num >= 31 && num <= 40) return 'bg-green-400';     // 초록색
    if (num >= 41 && num <= 45) return 'bg-orange-400';    // 주황색
    return 'bg-gray-400'; // fallback
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 데이터 로딩 후 바로 카운터 애니메이션 + TOP 번호 표시
  useEffect(() => {
    if (stats && !loading) {
      // 0.5초 후 바로 TOP 번호 표시 + 카운터 애니메이션 시작
      setTimeout(() => {
        setShowTopNumbers(true);
      }, 500);
    }
  }, [stats, loading]);

  // 카운터 애니메이션
  useEffect(() => {
    if (showTopNumbers && stats) {
      const targetTotalDraws = stats.total_draws;
      const targetNumbersOut = stats.total_draws * 6;
      const targetAccuracy = 99.9;
      const duration = 2000; // 2초
      const steps = 60;
      const stepDuration = duration / steps;

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        // ease-out 효과
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);

        setCounters({
          totalDraws: Math.floor(targetTotalDraws * easeOutProgress), // Draw 애니메이션
          samples: Math.floor((targetTotalDraws * 45) * easeOutProgress), // Samples 애니메이션
          numbersOut: Math.floor((targetTotalDraws * 6) * easeOutProgress),  // Numbers 애니메이션
          accuracy: targetAccuracy * easeOutProgress,
          progressWidth: 100 * easeOutProgress
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          // 최종 값 설정
          setCounters({
            totalDraws: targetTotalDraws, // Draw: 회차
            samples: targetTotalDraws * 45, // Samples: 회차 × 45
            numbersOut: targetTotalDraws * 6,  // Numbers: 회차 × 6
            accuracy: targetAccuracy,
            progressWidth: 100
          });
          // 카운터 애니메이션 끝난 후 시스템 메시지 전환 시작
          setTimeout(() => setProcessStep(1), 500); // 0.5초 후 메시지 전환 시작
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [showTopNumbers, stats]);



  // [핵심] 페이지 로드 시 단계를 올리고 로딩을 끝내는 효과
  useEffect(() => {
    if (isInitialLoading) {
      const timer = setInterval(() => {
        setProcessStep((prev) => {
          if (prev >= 4) {
            clearInterval(timer);
            // 모든 단계가 끝나고 0.5초 뒤에 버튼으로 전환
            setTimeout(() => setIsInitialLoading(false), 500);
            return 4;
          }
          return prev + 1;
        });
      }, 1000); // 1초마다 다음 단계로 가독성 있게 이동

      return () => clearInterval(timer);
    }
  }, [isInitialLoading]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/LottoStats-Web/lotto_stats.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('통계 데이터 로딩 실패:', error);
      setError('데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendation = () => {
    if (!stats) return;

    setGenerating(true);
    setProcessStep(0);
    setVisibleNumbers([]);

    // 클라이언트 사이드 추천 번호 생성 (백엔드 로직 복제)
    const top15 = stats.frequency.slice(0, 15).map(([num]) => num);
    const bottom15 = stats.frequency.slice(-15).map(([num]) => num);

    // 상위 15개에서 4개, 하위 15개에서 2개 랜덤 선택
    const shuffleArray = (array: number[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const selectedTop = shuffleArray([...top15]).slice(0, 4);
    const selectedBottom = shuffleArray([...bottom15]).slice(0, 2);
    const recommendedNumbers = [...selectedTop, ...selectedBottom].sort((a, b) => a - b);

    const data = {
      numbers: recommendedNumbers,
      method: "balanced_frequency_mix",
      stats_version: stats.last_updated
    };

    setRecommendation(data);

    // 광고 표시 (5초)
    setShowingAd(true);
    setTimeout(() => {
      setShowingAd(false);

      // 번호 애니메이션 (로또 추첨처럼 하나씩 표시)
      data.numbers.forEach((num: number, index: number) => {
        setTimeout(() => {
          setVisibleNumbers(prev => [...prev, num]);
        }, index * 800); // 0.8초 간격
      });
    }, 5000);

    setGenerating(false);
    setHasGenerated(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-2xl animate-pulse">🎯 로딩 중...</div>
      </div>
    );
  }

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">데이터 로딩 실패</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchStats();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            LottoLab AI
          </h1>
          <p className="text-lg text-gray-700 font-medium">Advanced Lottery Prediction Engine</p>
          <p className="text-sm text-gray-600">Balanced Frequency Analysis with Historical Data Optimization</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 transform hover:scale-105 transition-transform duration-300">
            {/* 콤팩트한 데이터 대시보드 */}
            <div className="w-full max-w-sm bg-white text-gray-900 p-4 rounded-2xl shadow-2xl mb-6 mx-auto border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-blue-600 text-xs font-mono uppercase tracking-wider">AI Engine v2.0</p>
                  <h2 className="text-lg font-bold text-gray-900">DATA ANALYSIS</h2>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[9px]">Draw #{counters.totalDraws.toLocaleString()}</p>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="mb-3">
                <div className="flex justify-between text-[9px] mb-1 text-gray-500">
                  <span>DATA INTEGRITY</span>
                  <span>{Math.round(counters.progressWidth)}% SECURED</span>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${counters.progressWidth}%` }}
                  ></div>
                </div>
              </div>

              {/* 통계 수치들 */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">Samples</p>
                  <p className="text-sm font-mono font-bold text-blue-600">{counters.samples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">Numbers</p>
                  <p className="text-sm font-mono font-bold text-green-600">{counters.numbersOut.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">Accuracy</p>
                  <p className="text-sm font-mono font-bold text-purple-600">{counters.accuracy.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* TOP 7 번호 표시 - 2줄 레이아웃 (위 4개, 아래 3개) */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">🏆 가장 많이 나온 번호 TOP 8</h3>
              <div className="grid grid-cols-4 gap-3 place-items-center">
                {stats.frequency.slice(0, 8).map((item, index) => (
                  <div key={item[0]} className={`${getNumberColor(item[0])} text-white w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold shadow-lg transform hover:scale-110 transition-transform animate-fade-in`}
                       style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="text-base leading-none">{item[0]}</div>
                    <div className="text-xs opacity-80 leading-none">({item[1]}회)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 번호 생성 버튼 - 추천 번호 생성 후에는 숨김 */}
        {!hasGenerated && (
          <div className="text-center mb-4">
            {isInitialLoading || generating ? (
              <div className="relative px-6 py-3 bg-gray-400 text-gray-200 rounded-full font-bold text-sm shadow-2xl cursor-not-allowed overflow-hidden">
                {/* 전체 배경을 로딩 바처럼 채우는 효과 */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: isInitialLoading ? `${(processStep + 1) * 20}%` : '100%' }}
                ></div>
                <div className="relative z-10">
                  {isInitialLoading && processStep === 0 ? '🔄 System Loading...' :
                   processStep === 1 ? '[SYSTEM] Data Load Complete...' :
                   processStep === 2 ? '[SYSTEM] Frequency Matrix Computing...' :
                   processStep === 3 ? '[SYSTEM] Pattern Noise Removal Complete...' :
                   processStep === 4 ? '[SYSTEM] Opt. Combination Top 1 Extracted.' :
                   '🔄 Generating...'}
                </div>
              </div>
            ) : showingAd ? (
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-2xl cursor-not-allowed"
                disabled={true}
              >
                ⚡ Extracting...
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl disabled:opacity-50 disabled:transform-none"
                onClick={generateRecommendation}
                disabled={generating || showingAd}
              >
                🎲 번호 생성하기
              </button>
            )}
          </div>
        )}

        {/* 광고 표시 */}
        {showingAd && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 text-center animate-pulse">
            <div className="text-2xl font-bold text-blue-600 mb-2">⚙️ Generating...</div>
            <div className="text-lg mb-2">잠시만 기다려주세요 (5초)</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* 추천 번호 애니메이션 */}
        {recommendation && !showingAd && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            {/* 추천 번호 타이틀 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🎉 추천 번호 🎉</h2>
            </div>
            {/* 번호들 - 2줄 레이아웃 (위 3개, 아래 3개) */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 place-items-center">
              {recommendation.numbers.map((num, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-2xl transform transition-all duration-700 ${
                    visibleNumbers.includes(num)
                      ? `${getNumberColor(num)} scale-110 animate-bounce`
                      : 'bg-gray-300'
                  }`}
                  style={{
                    animationDelay: visibleNumbers.includes(num) ? `${index * 0.2}s` : '0s'
                  }}
                >
                  {visibleNumbers.includes(num) ? num : '?'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 광고 배너 */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-dashed border-blue-300 p-4 text-center">
          <div className="text-lg mb-1">📢</div>
          <div className="text-gray-700 font-medium text-sm">광고 배너 자리 (AdMob 연동 예정)</div>
          <div className="text-xs text-gray-500 mt-1">수익화 기능 구현 예정</div>
        </div>
      </div>
    </div>
  );
}
