const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("도담카카오 날씨 봇 서버 정상 작동 중!");
});

app.post('/message', async (req, res) => {
    const userMessage = req.body.msg;

    if (userMessage && userMessage.startsWith("/날씨")) {
        let area = userMessage.slice(3).trim();

        if (area.length > 0) {
            let weatherResult = await getWeatherFromNaver(area);
            return res.json({ reply: weatherResult });
        } else {
            return res.json({ reply: "검색할 지역을 입력해주세요. 예) /날씨 서울" });
        }
    }

    res.json({ reply: "" });
});

async function getWeatherFromNaver(area) {
    try {
        const url = "https://m.search.naver.com/search.naver?query=날씨+" + encodeURIComponent(area);
        const responseData = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            }
        });

        const $ = cheerio.load(responseData.data);
        const weatherInfo = $(".weather_info");

        if (weatherInfo.length === 0) {
            return "'" + area + "'의 날씨 정보를 찾을 수 없습니다.";
        }

        // 1. 현재 온도 (정규식으로 깔끔하게 추출)
        let rawTempText = $(".temperature_text strong").text();
        let tempMatch = rawTempText.match(/([0-9.]+°)/);
        let cur_temp = tempMatch ? tempMatch[1] : "정보 없음";

        // 2. 어제와의 온도 비교 (예: "어제보다 2° 높아요" 등)
        let diff_temp = $(".temperature_info .temperature").text().trim();
        if (!diff_temp) diff_temp = "정보 없음";

        let v1 = "정보 없음"; // 체감온도
        let v2 = "정보 없음"; // 습도
        let v3 = "정보 없음"; // 풍속
        let v4 = "정보 없음"; // 강수확률

        // 3. 요약 리스트(체감온도, 습도, 풍속 등) 파싱
        $(".summary_list .sort").each((i, el) => {
            let fullText = $(el).text();
            let descVal = $(el).find(".desc").text().trim();

            if (fullText.includes("체감")) {
                v1 = descVal;
            } else if (fullText.includes("습도")) {
                v2 = descVal;
            } else if (fullText.includes("풍속") || fullText.includes("m/s")) {
                v3 = descVal;
            }
        });

        // 4. 강수확률 확실하게 찾기 (요약 정보 혹은 시간별 예보에서 %)
        $(".summary_list .sort").each((i, el) => {
            let fullText = $(el).text();
            let descVal = $(el).find(".desc").text().trim();
            if (fullText.includes("강수") || (fullText.includes("%") && !fullText.includes("습도"))) {
                v4 = descVal;
            }
        });

        // 요약에서 못 찾았을 경우 시간별 예보 영역에서 % 탐색
        if (v4 === "정보 없음") {
            $(".item_time, .cell_weather, .weather_item, .report_card").each((i, el) => {
                let hText = $(el).text();
                let match = hText.match(/([0-9]+%)/);
                if (match) {
                    v4 = match[1];
                    return false; // break loop
                }
            });
        }

        // 5. 최종 출력 메시지 디자인
        let retMsg = "[ " + area + " 날씨 정보 ]\n";
        retMsg += "─────────────────\n";
        retMsg += "현재온도 : " + cur_temp + " (" + diff_temp + ")\n";
        retMsg += "체감온도 : " + v1 + "\n";
        retMsg += "습도 : " + v2 + "\n";
        retMsg += "풍속 : " + v3 + "\n";
        retMsg += "강수확률 : " + v4;

        return retMsg;

    } catch (e) {
        return "날씨 정보를 불러오는 중 오류가 발생했습니다.";
    }
}