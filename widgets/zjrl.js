var WidgetMetadata = {
    id: "zhuijurili",
    title: "追剧日历(各项榜单、今日推荐)",
    modules: [
        {
            id: "todayPlay",
            title: "今日播出",
            functionName: "loadTmdbItems",
            cacheDuration: 21600,
            params: [
                {
                    name: "sort_by",
                    title: "类型",
                    type: "enum",
                    value: "今天播出的剧集",
                    enumOptions: [
                        { title: "剧集", value: "今天播出的剧集" },
                        { title: "番剧", value: "今天播出的番剧" },
                        { title: "国漫", value: "今天播出的国漫" },
                        { title: "综艺", value: "今天播出的综艺" }
                    ]
                }
            ]
        },
        {
            id: "tomorrowPlay",
            title: "明日播出",
            functionName: "loadTmdbItems",
            cacheDuration: 21600,
            params: [
                {
                    name: "sort_by",
                    title: "类型",
                    type: "enum",
                    value: "明天播出的剧集",
                    enumOptions: [
                        { title: "剧集", value: "明天播出的剧集" },
                        { title: "番剧", value: "明天播出的番剧" },
                        { title: "国漫", value: "明天播出的国漫" },
                        { title: "综艺", value: "明天播出的综艺" }
                    ]
                }
            ]
        },
        {
            id: "weekPlay",
            title: "播出周历",
            functionName: "loadWeekTmdbItems",
            cacheDuration: 21600,
            params: [
                {
                    name: "sort_by",
                    title: "类型",
                    type: "enum",
                    value: "juji_week.json",
                    enumOptions: [
                        { title: "剧集", value: "juji_week.json" },
                        { title: "番剧", value: "fanju_week.json" },
                        { title: "国漫", value: "guoman_week.json" },
                        { title: "综艺", value: "zongyi_week.json" }
                    ]
                },
                {
                    name: "weekday",
                    title: "周几",
                    type: "enum",
                    value: "All",
                    belongTo: {
                        paramName: "sort_by",
                        value: ["juji_week.json", "fanju_week.json", "guoman_week.json", "zongyi_week.json"]
                    },
                    enumOptions: [
                        { title: "全部", value: "All" },
                        { title: "周一", value: "Monday" },
                        { title: "周二", value: "Tuesday" },
                        { title: "周三", value: "Wednesday" },
                        { title: "周四", value: "Thursday" },
                        { title: "周五", value: "Friday" },
                        { title: "周六", value: "Saturday" },
                        { title: "周日", value: "Sunday" }
                    ]
                }
            ]
        },
        {
            id: "todayReCommand",
            title: "今日推荐",
            functionName: "loadTmdbItems",
            cacheDuration: 43200,
            params: [
                {
                    name: "sort_by",
                    title: "类型",
                    type: "constant",
                    value: "今日推荐"
                }
            ]
        },
        {
            id: "rank",
            title: "各项榜单",
            functionName: "loadTmdbItems",
            cacheDuration: 86400,
            params: [
                {
                    name: "sort_by",
                    title: "类型",
                    type: "enum",
                    value: "现正热播",
                    enumOptions: [
                        { title: "现正热播", value: "现正热播" },
                        { title: "人气 Top 10", value: "人气 Top 10" },
                        { title: "新剧雷达", value: "新剧雷达" },
                        { title: "热门国漫", value: "热门国漫" },
                        { title: "已收官好剧", value: "已收官好剧" },
                        { title: "华语热门", value: "华语热门" },
                        { title: "本季新番", value: "本季新番" }
                    ]
                }
            ]
        },
        {
            id: "area",
            title: "地区榜单",
            functionName: "loadTmdbItems",
            cacheDuration: 86400,
            params: [
                {
                    name: "sort_by",
                    title: "地区",
                    type: "enum",
                    value: "国产剧",
                    enumOptions: [
                        { title: "国产剧", value: "国产剧" },
                        { title: "日剧", value: "日剧" },
                        { title: "英美剧", value: "英美剧" },
                        { title: "番剧", value: "番剧" },
                        { title: "韩剧", value: "韩剧" },
                        { title: "港台剧", value: "港台剧" }
                    ]
                }
            ]
        }
    ],
    version: "1.0.4",
    description: "解析追剧日历今/明日播出剧集/番剧/国漫/综艺、周历、各项榜单、今日推荐等",
    author: "cats798",
    site: "https://github.com/huangxd-/ForwardWidgets"
};

// ---------- 常量与工具函数 ----------
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const API_SUFFIXES = {
    home1: [
        "今天播出的剧集", "今天播出的番剧",
        "明天播出的剧集", "明天播出的番剧",
        "现正热播", "人气 Top 10", "新剧雷达",
        "热门国漫", "已收官好剧"
    ],
    home0: [
        "华语热门", "本季新番", "今日推荐",
        "国产剧", "日剧", "英美剧", "番剧", "韩剧", "港台剧"
    ]
};

const areaTypes = ["国产剧", "日剧", "英美剧", "番剧", "韩剧", "港台剧"];

// 生成反向映射
const suffixMap = {};
Object.entries(API_SUFFIXES).forEach(([suffix, values]) => {
    values.forEach(value => suffixMap[value] = suffix);
});

// 安全 JSON 解析（备用，目前数据已为对象）
function safeJson(data) {
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch (_) {
            return {};
        }
    }
    return data || {};
}

// 确保返回数组
function ensureArray(v) {
    return Array.isArray(v) ? v : [];
}

// ---------- TMDB 数据获取 ----------
async function fetchTmdbData(id, mediaType) {
    try {
        const tmdbResult = await Widget.tmdb.get(`/${mediaType}/${id}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        if (!tmdbResult) {
            console.warn(`TMDB 数据为空: ${mediaType}/${id}`);
            return null;
        }
        return tmdbResult;
    } catch (error) {
        console.error(`获取 TMDB 数据失败: ${mediaType}/${id}`, error.message);
        return null;
    }
}

// 将原始条目（含 tmdb_id）转换为 MediaItem
async function fetchTmdbItems(scItems) {
    if (!Array.isArray(scItems)) return [];

    const promises = scItems.map(async (scItem) => {
        if (!scItem || (!scItem.id && !scItem.tmdb_id)) return null;

        const mediaType = scItem.hasOwnProperty('isMovie') ? (scItem.isMovie ? 'movie' : 'tv') : 'tv';
        const tmdbId = scItem.id ?? scItem.tmdb_id;

        const tmdbData = await fetchTmdbData(tmdbId, mediaType);
        if (!tmdbData) return null;

        // 构造完整图片 URL
        const posterUrl = tmdbData.poster_path ? TMDB_IMAGE_BASE + tmdbData.poster_path : "";
        const backdropUrl = tmdbData.backdrop_path ? TMDB_IMAGE_BASE + tmdbData.backdrop_path : "";

        return {
            id: String(tmdbData.id),
            title: tmdbData.title ?? tmdbData.name ?? "无标题",
            description: tmdbData.overview || "",
            posterUrl: posterUrl,
            backdropUrl: backdropUrl,
            releaseDate: tmdbData.release_date ?? tmdbData.first_air_date,
            rating: tmdbData.vote_average,
            mediaType: mediaType,
            // 此处未提供 videoUrl/link，条目仅用于展示
        };
    });

    const results = await Promise.allSettled(promises);
    return results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
}

// ---------- 数据源请求 ----------
async function fetchDefaultData(sort_by) {
    const url_prefix = "https://zjrl-1318856176.cos.accelerate.myqcloud.com";
    const suffix = suffixMap[sort_by];
    if (!suffix) {
        console.warn("未知的 sort_by 类型:", sort_by);
        return [];
    }
    const url = `${url_prefix}/${suffix}.json`;

    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            console.error(`请求失败: ${url} 状态码 ${response.status}`);
            return [];
        }

        const data = safeJson(response.data);
        if (!Array.isArray(data)) {
            console.warn("返回数据非数组:", data);
            return [];
        }

        let items = [];
        if (sort_by === "今日推荐") {
            const rec = data.find(item => item.type === "1s");
            items = rec?.content || [];
        } else if (areaTypes.includes(sort_by)) {
            const category = data.find(item => item.type === "category");
            const areaItem = category?.content?.find(item => item.title === sort_by);
            items = areaItem?.data || [];
        } else {
            const target = data.find(item => item.title === sort_by);
            items = target?.content || [];
        }

        return await fetchTmdbItems(items);
    } catch (error) {
        console.error(`fetchDefaultData 异常:`, error.message);
        return [];
    }
}

async function fetchOtherData(typ, sort_by) {
    const whichDay = sort_by.includes("今天") ? "today" : "tomorrow";
    const url = `https://gist.githubusercontent.com/huangxd-/5ae61c105b417218b9e5bad7073d2f36/raw/${typ}_${whichDay}.json`;

    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            console.error(`请求失败: ${url} 状态码 ${response.status}`);
            return [];
        }

        const items = ensureArray(safeJson(response.data));
        return await fetchTmdbItems(items);
    } catch (error) {
        console.error(`fetchOtherData 异常:`, error.message);
        return [];
    }
}

async function fetchWeekData(weekday, sort_by) {
    const url = `https://gist.githubusercontent.com/huangxd-/5ae61c105b417218b9e5bad7073d2f36/raw/${sort_by}`;

    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            console.error(`请求失败: ${url} 状态码 ${response.status}`);
            return [];
        }

        const data = safeJson(response.data);
        let items = [];
        if (weekday === "All") {
            items = [
                ...(data.Monday || []),
                ...(data.Tuesday || []),
                ...(data.Wednesday || []),
                ...(data.Thursday || []),
                ...(data.Friday || []),
                ...(data.Saturday || []),
                ...(data.Sunday || [])
            ];
        } else {
            items = data[weekday] || [];
        }

        return await fetchTmdbItems(items);
    } catch (error) {
        console.error(`fetchWeekData 异常:`, error.message);
        return [];
    }
}

// ---------- 模块入口函数 ----------
async function loadTmdbItems(params = {}) {
    const sort_by = params.sort_by || "";
    if (!sort_by) {
        console.warn("loadTmdbItems 缺少 sort_by 参数");
        return [];
    }

    let res;
    if (sort_by === "今天播出的国漫" || sort_by === "明天播出的国漫") {
        res = await fetchOtherData("guoman", sort_by);
    } else if (sort_by === "今天播出的综艺" || sort_by === "明天播出的综艺") {
        res = await fetchOtherData("zongyi", sort_by);
    } else {
        res = await fetchDefaultData(sort_by);
    }

    return ensureArray(res);
}

async function loadWeekTmdbItems(params = {}) {
    const weekday = params.weekday || "All";
    const sort_by = params.sort_by || "";
    if (!sort_by) {
        console.warn("loadWeekTmdbItems 缺少 sort_by 参数");
        return [];
    }

    const res = await fetchWeekData(weekday, sort_by);
    return ensureArray(res);
}