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

        const cur_temp = $(".temperature_text strong").text().replace("현재 온도", "").trim();
        
        let v1 = "정보 없음"; 
        let v2 = "정보 없음"; 
        let v3 = "정보 없음"; 
        let v4 = "정보 없음"; 

        $(".summary_list .sort").each((i, el) => {
            const text = $(el).text();
            if (text.includes("체감")) v1 = $(el).find(".desc").text();
            if (text.includes("습도")) v2 = $(el).find(".desc").text();
            if (text.includes("풍속") || text.includes("m/s")) v3 = $(el).find(".desc").text();
        });

        $(".summary_list .sort").each((i, el) => {
            const text = $(el).text();
            if (text.includes("강수") || (text.includes("%") && !text.includes("습도"))) {
                v4 = $(el).find(".desc").text();
            }
        });

        let retMsg = "현재 " + area + "의 날씨 정보입니다.\n";
        retMsg += "\n현재온도 : " + cur_temp;
        retMsg += "\n체감온도 : " + v1;
        retMsg += "\n습도 : " + v2;
        retMsg += "\n풍속 : " + v3;
        retMsg += "\n강수확률 : " + v4;

        return retMsg;

    } catch (e) {
        return "날씨 정보를 불러오는 중 오류가 발생했습니다.";
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("서버가 " + PORT + "번 포트에서 대기 중입니다.");
});