// アプリケーションの状態管理
const app = {
    questions: [], // 生成された問題リスト
    currentQuestionIndex: 0, // 現在の問題番号
    readingStartTime: null, // 音読開始時刻
    readingEndTime: null, // 音読完了時刻（80%検出時点）
    answerStartTime: null, // 解答開始時刻
    results: [], // 結果記録
    totalQuestions: 10, // 問題総数
    recognition: null, // 音声認識オブジェクト
    recognizedText: '', // 認識されたテキスト
    isRecording: false, // 録音中フラグ
    recognitionHistory: [], // 音声認識の履歴（自己修正検出用）
};

// タイマー更新用
let timerInterval = null;

// DOM要素の取得
const elements = {
    startScreen: document.getElementById('start-screen'),
    questionScreen: document.getElementById('question-screen'),
    resultScreen: document.getElementById('result-screen'),
    historyScreen: document.getElementById('history-screen'),
    loading: document.getElementById('loading'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    viewHistoryBtn: document.getElementById('view-history-btn'),
    backToStartBtn: document.getElementById('back-to-start-btn'),
    exportAllBtn: document.getElementById('export-all-btn'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    startRecordingBtn: document.getElementById('start-recording-btn'),
    stopRecordingBtn: document.getElementById('stop-recording-btn'),
    readingPhase: document.getElementById('reading-phase'),
    passage: document.getElementById('passage'),
    questionText: document.getElementById('question-text'),
    choices: document.getElementById('choices'),
    feedback: document.getElementById('feedback'),
    questionNumber: document.getElementById('question-number'),
    timer: document.getElementById('timer'),
    progress: document.getElementById('progress'),
    historyList: document.getElementById('history-list'),
    recognitionStatus: document.getElementById('recognition-status'),
    recognitionText: document.getElementById('recognition-text'),
    recognizedText: document.getElementById('recognized-text'),
    recognitionResult: document.getElementById('recognition-result'),
    comparisonDisplay: document.getElementById('comparison-display'),
    recognitionFeedback: document.getElementById('recognition-feedback'),
    readingInstruction: document.getElementById('reading-instruction'),
};

// イベントリスナーの設定
elements.startBtn.addEventListener('click', startQuiz);
elements.restartBtn.addEventListener('click', resetQuiz);
elements.exportCsvBtn.addEventListener('click', exportScoresToCSV);
elements.viewHistoryBtn.addEventListener('click', showHistory);
elements.backToStartBtn.addEventListener('click', () => showScreen('start'));
elements.exportAllBtn.addEventListener('click', exportScoresToCSV);
elements.clearHistoryBtn.addEventListener('click', clearHistory);
elements.startRecordingBtn.addEventListener('click', startRecording);
elements.stopRecordingBtn.addEventListener('click', stopRecording);

// クイズ開始
async function startQuiz() {
    showLoading(true);
    await generateQuestions();
    showLoading(false);

    showScreen('question');
    app.currentQuestionIndex = 0;
    app.results = [];
    displayQuestion();
}

// AI問題生成機能（英検3級レベル）
async function generateQuestions() {
    // 問題プール（英検3級相当）
    const questionPool = [
        {
            passage: "Tom goes to school by bus every day. He gets up at seven o'clock and has breakfast with his family. After breakfast, he walks to the bus stop near his house. The bus comes at eight o'clock.",
            question: "トムは毎日どうやって学校に行きますか？",
            choices: ["歩いて", "バスで", "自転車で", "電車で"],
            correctAnswer: 1
        },
        {
            passage: "My sister likes reading books. She goes to the library every Saturday. She reads many kinds of books, but she likes mystery stories the best.",
            question: "妹が一番好きな本のジャンルは何ですか？",
            choices: ["歴史の本", "ミステリー", "料理の本", "マンガ"],
            correctAnswer: 1
        },
        {
            passage: "Last Sunday, we had a picnic in the park. The weather was sunny and warm. We ate sandwiches and played soccer. We had a great time together.",
            question: "先週の日曜日の天気はどうでしたか？",
            choices: ["雨が降っていた", "曇っていた", "晴れて暖かかった", "雪が降っていた"],
            correctAnswer: 2
        },
        {
            passage: "Mary wants to be a teacher when she grows up. She likes children and enjoys helping them learn new things. She studies hard at school every day.",
            question: "メアリーは将来何になりたいですか？",
            choices: ["医者", "先生", "看護師", "料理人"],
            correctAnswer: 1
        },
        {
            passage: "I usually watch TV after dinner. My favorite program is about animals. It shows animals from all over the world. I learn many interesting things from the program.",
            question: "この人が好きなテレビ番組は何についてですか？",
            choices: ["スポーツ", "音楽", "動物", "料理"],
            correctAnswer: 2
        },
        {
            passage: "Ken's birthday is next Friday. His friends are planning a surprise party for him. They will bring cake and presents. Ken doesn't know about the party yet.",
            question: "ケンは誕生日パーティーのことを知っていますか？",
            choices: ["はい、知っています", "いいえ、知りません", "自分で計画しました", "友達に教えました"],
            correctAnswer: 1
        },
        {
            passage: "In winter, I like to drink hot chocolate. My mother makes it for me when I come home from school. It makes me feel warm and happy.",
            question: "この人はいつホットチョコレートを飲みますか？",
            choices: ["朝食時", "学校から帰った後", "寝る前", "昼食時"],
            correctAnswer: 1
        },
        {
            passage: "My father works at a hospital. He is a doctor. He helps sick people every day. He works very hard, but he loves his job.",
            question: "この人の父親の職業は何ですか？",
            choices: ["先生", "看護師", "医者", "警察官"],
            correctAnswer: 2
        },
        {
            passage: "Emma is learning to play the piano. She practices for one hour every day after school. Her dream is to play in a concert someday.",
            question: "エマは何を学んでいますか？",
            choices: ["ギター", "バイオリン", "ピアノ", "ドラム"],
            correctAnswer: 2
        },
        {
            passage: "We need to buy some food for dinner tonight. We don't have any vegetables or meat. Let's go to the supermarket after work.",
            question: "この人たちは何を買う必要がありますか？",
            choices: ["本", "服", "食べ物", "おもちゃ"],
            correctAnswer: 2
        },
        {
            passage: "Sarah loves swimming. She goes to the pool three times a week. She can swim very fast. She wants to join the swimming team next year.",
            question: "サラは週に何回プールに行きますか？",
            choices: ["1回", "2回", "3回", "毎日"],
            correctAnswer: 2
        },
        {
            passage: "Mike has a pet dog named Lucky. Lucky is five years old and very friendly. Every morning, Mike takes Lucky for a walk in the park before school.",
            question: "マイクは毎朝学校の前に何をしますか？",
            choices: ["宿題をする", "犬の散歩をする", "テレビを見る", "友達と遊ぶ"],
            correctAnswer: 1
        },
        {
            passage: "Yesterday was Jane's mother's birthday. Jane made a cake for her mother. It was a chocolate cake. Her mother was very happy and thanked Jane.",
            question: "ジェーンは母親のために何を作りましたか？",
            choices: ["クッキー", "ケーキ", "サンドイッチ", "スープ"],
            correctAnswer: 1
        },
        {
            passage: "I have two brothers and one sister. My older brother is a college student. My younger brother and sister go to elementary school. We all live together with our parents.",
            question: "この家族には子供が何人いますか？",
            choices: ["2人", "3人", "4人", "5人"],
            correctAnswer: 2
        },
        {
            passage: "Bob doesn't like vegetables. His mother always tells him to eat them because they are good for his health. Bob is trying to eat a little bit every day.",
            question: "ボブの母親はなぜ野菜を食べるように言いますか？",
            choices: ["安いから", "健康に良いから", "おいしいから", "作るのが簡単だから"],
            correctAnswer: 1
        },
        {
            passage: "The school library is open from Monday to Friday. Students can borrow up to three books at a time. They must return the books within two weeks.",
            question: "学生は一度に何冊まで借りられますか？",
            choices: ["1冊", "2冊", "3冊", "4冊"],
            correctAnswer: 2
        },
        {
            passage: "Amy wants to visit Australia next summer. She has never been there before. She is studying English hard so she can talk with people there.",
            question: "エイミーはなぜ英語を一生懸命勉強していますか？",
            choices: ["テストのため", "オーストラリアで話すため", "先生になるため", "本を読むため"],
            correctAnswer: 1
        },
        {
            passage: "My grandmother lives in the countryside. She grows many vegetables in her garden. When I visit her, she always gives me fresh tomatoes and cucumbers.",
            question: "祖母はどこに住んでいますか？",
            choices: ["都市", "田舎", "山", "海の近く"],
            correctAnswer: 1
        },
        {
            passage: "John plays basketball every weekend with his friends. He is the tallest player on his team. He practices shooting baskets for an hour before each game.",
            question: "ジョンはいつバスケットボールをしますか？",
            choices: ["毎日", "週末", "月曜日", "放課後"],
            correctAnswer: 1
        },
        {
            passage: "Lisa is afraid of speaking English in class. Her teacher encourages her to try. Last week, Lisa spoke in English for the first time. She felt very proud of herself.",
            question: "先週リサは何をしましたか？",
            choices: ["テストに合格した", "クラスで初めて英語を話した", "新しい友達を作った", "本を読んだ"],
            correctAnswer: 1
        },
        {
            passage: "There is a new restaurant near my house. It opened last month. The food is delicious and the prices are reasonable. I go there with my family every Friday night.",
            question: "このレストランはいつオープンしましたか？",
            choices: ["先週", "先月", "去年", "今日"],
            correctAnswer: 1
        },
        {
            passage: "David wakes up at six thirty every morning. He jogs for thirty minutes in the park. After jogging, he takes a shower and eats breakfast. Then he goes to work.",
            question: "デビッドは朝何分ジョギングしますか？",
            choices: ["15分", "30分", "45分", "1時間"],
            correctAnswer: 1
        },
        {
            passage: "My favorite season is autumn. The weather is cool and comfortable. I like to see the red and yellow leaves on the trees. I also enjoy eating apples and pears.",
            question: "この人が好きな季節はいつですか？",
            choices: ["春", "夏", "秋", "冬"],
            correctAnswer: 2
        },
        {
            passage: "Nancy is a nurse. She works at a children's hospital. She takes care of sick children and makes them feel better. She loves her job very much.",
            question: "ナンシーの職業は何ですか？",
            choices: ["医者", "看護師", "先生", "保育士"],
            correctAnswer: 1
        },
        {
            passage: "I went to the beach with my friends yesterday. We swam in the ocean and played volleyball on the sand. We stayed there until sunset. It was a wonderful day.",
            question: "この人たちはいつまでビーチにいましたか？",
            choices: ["お昼まで", "午後3時まで", "日没まで", "夜まで"],
            correctAnswer: 2
        },
        {
            passage: "Peter's hobby is taking pictures. He has a good camera. He likes to take pictures of flowers and birds. He wants to have a photo exhibition someday.",
            question: "ピーターの趣味は何ですか？",
            choices: ["絵を描くこと", "写真を撮ること", "歌うこと", "料理すること"],
            correctAnswer: 1
        },
        {
            passage: "The train station is ten minutes from my house by bike. I ride my bike there every morning. The train leaves at seven forty-five. I never miss it.",
            question: "電車は何時に出発しますか？",
            choices: ["7時15分", "7時30分", "7時45分", "8時"],
            correctAnswer: 2
        },
        {
            passage: "Helen studies French at a language school. She goes there twice a week after work. She plans to visit France next year. She is very excited about the trip.",
            question: "ヘレンは週に何回語学学校に行きますか？",
            choices: ["1回", "2回", "3回", "毎日"],
            correctAnswer: 1
        },
        {
            passage: "My mother is a good cook. She makes dinner for our family every day. My favorite food is her spaghetti. She uses fresh tomatoes and herbs from our garden.",
            question: "この人の母親が庭で育てているものは何ですか？",
            choices: ["花", "野菜とハーブ", "果物", "米"],
            correctAnswer: 1
        },
        {
            passage: "It's raining today, so the soccer game was canceled. The students are disappointed. They practiced hard for this game. The game will be held next Saturday instead.",
            question: "サッカーの試合はいつ行われますか？",
            choices: ["今日", "明日", "来週の土曜日", "来月"],
            correctAnswer: 2
        },
        {
            passage: "Karen has three cats. Their names are Mimi, Toto, and Coco. She feeds them every morning and evening. The cats like to sleep on her bed at night.",
            question: "カレンは何匹猫を飼っていますか？",
            choices: ["1匹", "2匹", "3匹", "4匹"],
            correctAnswer: 2
        },
        {
            passage: "The museum is closed on Mondays. It opens at nine in the morning and closes at five in the afternoon. The entrance fee is five dollars for adults and free for children.",
            question: "子供の入場料はいくらですか？",
            choices: ["無料", "2ドル", "5ドル", "10ドル"],
            correctAnswer: 0
        },
        {
            passage: "Andy's parents are both teachers. His father teaches math at a high school. His mother teaches English at a junior high school. They enjoy their work.",
            question: "アンディの父親は何を教えていますか？",
            choices: ["英語", "数学", "理科", "歴史"],
            correctAnswer: 1
        },
        {
            passage: "I'm going to have a test tomorrow. I studied for three hours last night. I will study for two more hours tonight. I want to get a good score.",
            question: "この人は昨夜何時間勉強しましたか？",
            choices: ["1時間", "2時間", "3時間", "5時間"],
            correctAnswer: 2
        },
        {
            passage: "Susan loves chocolate ice cream. She buys it at the ice cream shop near her school. She eats it on her way home. It costs two dollars fifty cents.",
            question: "スーザンが好きなアイスクリームは何味ですか？",
            choices: ["バニラ", "チョコレート", "ストロベリー", "抹茶"],
            correctAnswer: 1
        },
        {
            passage: "Our school festival will be next month. My class is going to perform a play. We practice after school every Tuesday and Thursday. Everyone is working hard.",
            question: "このクラスは何曜日に練習していますか？",
            choices: ["月曜日と水曜日", "火曜日と木曜日", "水曜日と金曜日", "毎日"],
            correctAnswer: 1
        },
        {
            passage: "George wants to buy a new computer. He has been saving money for six months. He needs two hundred more dollars. He will buy it next month.",
            question: "ジョージはどのくらい貯金していますか？",
            choices: ["3ヶ月", "6ヶ月", "1年", "2年"],
            correctAnswer: 1
        },
        {
            passage: "The post office is between the bank and the bookstore. It's very convenient. I go there once a week to send letters to my friend in Canada.",
            question: "郵便局はどこにありますか？",
            choices: ["銀行の隣", "銀行と本屋の間", "本屋の向かい", "駅の近く"],
            correctAnswer: 1
        },
        {
            passage: "Julie is learning how to drive. She takes lessons every Saturday morning. Her instructor is very patient and kind. She will take the driving test in two months.",
            question: "ジュリーはいつ運転のレッスンを受けていますか？",
            choices: ["毎日", "平日", "土曜日の朝", "日曜日"],
            correctAnswer: 2
        },
        {
            passage: "The weather forecast says it will snow tomorrow. We are all excited because we love snow. We plan to build a snowman in the park if there is enough snow.",
            question: "明日の天気予報は何ですか？",
            choices: ["雨", "雪", "晴れ", "曇り"],
            correctAnswer: 1
        },
        {
            passage: "My uncle lives in New York. He is a musician. He plays the guitar in a band. I visited him last summer and watched his concert.",
            question: "叔父の職業は何ですか？",
            choices: ["先生", "音楽家", "医者", "会社員"],
            correctAnswer: 1
        },
        {
            passage: "Rebecca is allergic to cats. When she is near a cat, she starts sneezing. Her friend has a cat, so she cannot visit her friend's house very often.",
            question: "レベッカは何にアレルギーがありますか？",
            choices: ["犬", "猫", "花粉", "食べ物"],
            correctAnswer: 1
        },
        {
            passage: "The supermarket near my apartment is open twenty-four hours a day. It's very useful when I need something late at night. I often go shopping there after work.",
            question: "このスーパーマーケットはいつ開いていますか？",
            choices: ["朝だけ", "昼だけ", "夜だけ", "24時間"],
            correctAnswer: 3
        },
        {
            passage: "Kevin plays tennis every Sunday afternoon. He has been playing for five years. He practices with his coach for two hours each time. He is getting better and better.",
            question: "ケビンは何年テニスをしていますか？",
            choices: ["2年", "3年", "5年", "10年"],
            correctAnswer: 2
        },
        {
            passage: "My dentist told me to brush my teeth three times a day. I should also use dental floss every night. I want to keep my teeth healthy and strong.",
            question: "歯医者は1日に何回歯を磨くように言いましたか？",
            choices: ["1回", "2回", "3回", "4回"],
            correctAnswer: 2
        },
        {
            passage: "Nina works at a flower shop. She arranges beautiful bouquets for customers. She loves working with flowers. The shop is closed on Wednesdays.",
            question: "花屋は何曜日に閉まっていますか？",
            choices: ["月曜日", "火曜日", "水曜日", "木曜日"],
            correctAnswer: 2
        },
        {
            passage: "I forgot my umbrella at home this morning. It started raining in the afternoon. My friend shared her umbrella with me. I was very grateful.",
            question: "この人は傘をどうしましたか？",
            choices: ["買った", "借りた", "友達と一緒に使った", "使わなかった"],
            correctAnswer: 2
        },
        {
            passage: "Tim's birthday party is this Saturday. He invited twenty friends. His mother is making a big cake. They will have the party in their backyard.",
            question: "ティムは何人友達を招待しましたか？",
            choices: ["10人", "15人", "20人", "30人"],
            correctAnswer: 2
        },
        {
            passage: "The movie starts at seven o'clock. We should arrive at the theater thirty minutes early to buy tickets. Let's meet at the station at six fifteen.",
            question: "映画は何時に始まりますか？",
            choices: ["6時", "6時15分", "6時30分", "7時"],
            correctAnswer: 3
        },
        {
            passage: "Betty is writing a letter to her grandmother. She writes to her once a month. Her grandmother lives far away and doesn't use email or phones.",
            question: "ベティはどのくらいの頻度で手紙を書きますか？",
            choices: ["毎週", "月に1回", "3ヶ月に1回", "年に1回"],
            correctAnswer: 1
        },
        {
            passage: "The airplane arrived two hours late because of bad weather. All the passengers were tired and hungry. The airline gave everyone a meal voucher as an apology.",
            question: "飛行機が遅れた理由は何ですか？",
            choices: ["機械の故障", "悪天候", "パイロットの病気", "乗客が多すぎた"],
            correctAnswer: 1
        },
        {
            passage: "Rachel is a vegetarian. She doesn't eat meat or fish. She eats a lot of vegetables, fruits, and beans. She has been a vegetarian for three years.",
            question: "レイチェルは何を食べませんか？",
            choices: ["野菜", "果物", "肉と魚", "豆"],
            correctAnswer: 2
        },
        {
            passage: "My alarm clock rings at six every morning. Sometimes I press the snooze button and sleep for ten more minutes. Then I get up and start my day.",
            question: "目覚まし時計は何時に鳴りますか？",
            choices: ["5時", "6時", "7時", "8時"],
            correctAnswer: 1
        },
        {
            passage: "Oliver joined the drama club last year. He performed in a school play last month. He played the main character. His parents came to watch and were very proud.",
            question: "オリバーは劇で何の役をしましたか？",
            choices: ["主役", "脇役", "ナレーター", "何もしなかった"],
            correctAnswer: 0
        },
        {
            passage: "The new shopping mall has three floors. There are many shops selling clothes, books, and electronics. There is also a food court on the third floor.",
            question: "フードコートは何階にありますか？",
            choices: ["1階", "2階", "3階", "4階"],
            correctAnswer: 2
        },
        {
            passage: "Sophie is learning Spanish online. She studies for forty-five minutes every evening. She can already have simple conversations in Spanish. She finds it fun and useful.",
            question: "ソフィーは毎晩何分勉強しますか？",
            choices: ["30分", "45分", "1時間", "2時間"],
            correctAnswer: 1
        },
        {
            passage: "The bakery sells fresh bread every morning. The most popular item is their chocolate croissant. It sells out by ten o'clock. Many people come early to buy it.",
            question: "チョコレートクロワッサンは何時までに売り切れますか？",
            choices: ["9時", "10時", "11時", "正午"],
            correctAnswer: 1
        },
        {
            passage: "William broke his leg while skiing last winter. He couldn't walk for two months. He had to use crutches. Now he is completely recovered.",
            question: "ウィリアムは何ヶ月歩けませんでしたか？",
            choices: ["1ヶ月", "2ヶ月", "3ヶ月", "6ヶ月"],
            correctAnswer: 1
        },
        {
            passage: "The concert tickets cost fifty dollars each. I bought two tickets for my friend and me. We are going to see our favorite singer next weekend.",
            question: "チケット1枚の値段はいくらですか？",
            choices: ["25ドル", "50ドル", "75ドル", "100ドル"],
            correctAnswer: 1
        },
        {
            passage: "Diana is afraid of heights. She doesn't like riding in airplanes or going to tall buildings. She prefers to stay on the ground. Her friends try to help her overcome this fear.",
            question: "ダイアナは何が怖いですか？",
            choices: ["暗闇", "高いところ", "水", "動物"],
            correctAnswer: 1
        },
        {
            passage: "The gym is open from six in the morning until ten at night. I usually go there at seven in the morning before work. I exercise for an hour.",
            question: "この人は何時にジムに行きますか？",
            choices: ["6時", "7時", "8時", "夜"],
            correctAnswer: 1
        },
        {
            passage: "Claire wants to lose weight. She stopped eating sweets and started jogging. She has already lost five kilograms. She feels healthier and happier.",
            question: "クレアは何キロ痩せましたか？",
            choices: ["3キロ", "5キロ", "10キロ", "15キロ"],
            correctAnswer: 1
        },
        {
            passage: "The history test had fifty questions. I could answer forty-five of them. I think I did well. The results will be announced next week.",
            question: "テストには何問ありましたか？",
            choices: ["40問", "45問", "50問", "100問"],
            correctAnswer: 2
        },
        {
            passage: "Brandon's favorite sport is soccer. He watches every World Cup game on TV. He also plays soccer with his friends on weekends. His dream is to become a professional player.",
            question: "ブランドンの夢は何ですか？",
            choices: ["サッカー選手になること", "医者になること", "先生になること", "歌手になること"],
            correctAnswer: 0
        },
        {
            passage: "The cherry blossoms bloom in April in Japan. People have picnics under the trees. They enjoy the beautiful pink flowers. The season only lasts about two weeks.",
            question: "桜の季節はどのくらい続きますか？",
            choices: ["1週間", "2週間", "1ヶ月", "2ヶ月"],
            correctAnswer: 1
        },
        {
            passage: "Melissa works as a flight attendant. She travels to different countries every week. She has visited more than thirty countries. She loves meeting people from around the world.",
            question: "メリッサは何カ国以上訪れましたか？",
            choices: ["10", "20", "30", "50"],
            correctAnswer: 2
        },
        {
            passage: "The coffee shop on Main Street makes the best coffee in town. It's always crowded on weekday mornings. Many people stop there on their way to work. The owner is very friendly.",
            question: "コーヒーショップはいつ一番混んでいますか？",
            choices: ["週末", "平日の朝", "午後", "夜"],
            correctAnswer: 1
        },
        {
            passage: "Jacob is saving money to buy a bicycle. The bicycle costs three hundred dollars. He has saved one hundred and fifty dollars so far. He needs to save for three more months.",
            question: "ジェイコブはこれまでいくら貯めましたか？",
            choices: ["100ドル", "150ドル", "200ドル", "300ドル"],
            correctAnswer: 1
        },
        {
            passage: "The zoo is home to over two hundred animals. You can see lions, elephants, monkeys, and many other animals. It takes about three hours to see everything.",
            question: "動物園には何匹以上動物がいますか？",
            choices: ["100", "200", "300", "500"],
            correctAnswer: 1
        },
        {
            passage: "Victoria plays the violin in the school orchestra. She has been playing since she was six years old. She practices for ninety minutes every day after school.",
            question: "ヴィクトリアは何歳からバイオリンを弾いていますか？",
            choices: ["5歳", "6歳", "7歳", "10歳"],
            correctAnswer: 1
        },
        {
            passage: "My brother graduated from university last year. Now he works for a computer company. He is a software engineer. He enjoys creating new programs.",
            question: "この人の兄は今何をしていますか？",
            choices: ["大学生", "ソフトウェアエンジニア", "先生", "医者"],
            correctAnswer: 1
        },
        {
            passage: "The library has a children's section on the second floor. There are picture books, storybooks, and educational books. Children can also watch videos there on weekends.",
            question: "子供たちはいつビデオを見ることができますか？",
            choices: ["毎日", "平日", "週末", "月曜日だけ"],
            correctAnswer: 2
        },
        {
            passage: "Emma is planning a trip to Italy. She is learning Italian phrases from a book. She will go there in August for two weeks. She is very excited about seeing Rome and Venice.",
            question: "エマはどのくらいイタリアに滞在しますか？",
            choices: ["1週間", "2週間", "3週間", "1ヶ月"],
            correctAnswer: 1
        },
        {
            passage: "The annual marathon will be held in our city next Sunday. About five thousand runners will participate. The race starts at eight in the morning. Many people come to watch.",
            question: "マラソンには何人くらい参加しますか？",
            choices: ["1000人", "3000人", "5000人", "10000人"],
            correctAnswer: 2
        },
        {
            passage: "Christopher collects stamps from different countries. He has over five hundred stamps in his collection. His grandfather gave him his first stamp when he was eight years old.",
            question: "クリストファーは何枚以上切手を持っていますか？",
            choices: ["100", "300", "500", "1000"],
            correctAnswer: 2
        },
        {
            passage: "The restaurant serves lunch from eleven thirty to two thirty. Dinner is served from five thirty to nine thirty. The restaurant is closed between lunch and dinner.",
            question: "ディナーは何時から提供されますか？",
            choices: ["4時30分", "5時", "5時30分", "6時"],
            correctAnswer: 2
        },
        {
            passage: "Hannah got a new smartphone for her birthday. It has a very good camera. She takes pictures of her food and posts them on social media. Her friends like her photos.",
            question: "ハンナは何の写真を撮りますか？",
            choices: ["風景", "食べ物", "動物", "人"],
            correctAnswer: 1
        },
        {
            passage: "The park near our school has a big playground. There are swings, slides, and a sandbox. Many children play there after school. Parents sit on benches and watch their children.",
            question: "公園には何がありますか？",
            choices: ["プール", "遊び場", "図書館", "レストラン"],
            correctAnswer: 1
        },
        {
            passage: "Matthew is taking piano lessons. His teacher comes to his house every Wednesday at four o'clock. He practices for thirty minutes before each lesson. He is learning to play classical music.",
            question: "先生は何曜日に来ますか？",
            choices: ["月曜日", "火曜日", "水曜日", "木曜日"],
            correctAnswer: 2
        },
        {
            passage: "The hotel room costs one hundred and twenty dollars per night. We will stay there for three nights. The hotel also has a swimming pool and a restaurant.",
            question: "ホテルの部屋は1泊いくらですか？",
            choices: ["80ドル", "100ドル", "120ドル", "150ドル"],
            correctAnswer: 2
        },
        {
            passage: "Olivia doesn't like hot weather. She prefers cool autumn days. In summer, she stays inside and uses the air conditioner. She can't wait for autumn to come.",
            question: "オリビアが好きな季節はいつですか？",
            choices: ["春", "夏", "秋", "冬"],
            correctAnswer: 2
        },
        {
            passage: "The bookstore is having a sale this week. All books are thirty percent off. I bought three books yesterday. I saved fifteen dollars.",
            question: "本は何パーセント割引ですか？",
            choices: ["20%", "30%", "40%", "50%"],
            correctAnswer: 1
        },
        {
            passage: "Nathan wants to be healthier. He stopped smoking last month. He also started eating more vegetables and fruits. He feels much better now.",
            question: "ネイサンはいつタバコをやめましたか？",
            choices: ["先週", "先月", "去年", "今日"],
            correctAnswer: 1
        },
        {
            passage: "The science museum has many interesting exhibits. My favorite is the dinosaur section. There are large dinosaur skeletons and interactive displays. I visit the museum several times a year.",
            question: "この人が一番好きなセクションは何ですか？",
            choices: ["宇宙", "恐竜", "海洋", "昆虫"],
            correctAnswer: 1
        },
        {
            passage: "Isabella is studying to become a doctor. She is in her third year of medical school. She studies very hard and often stays up late. She wants to help sick people.",
            question: "イザベラは医学部の何年生ですか？",
            choices: ["1年", "2年", "3年", "4年"],
            correctAnswer: 2
        },
        {
            passage: "The bus to the airport leaves every thirty minutes. The trip takes about forty-five minutes. You should arrive at the airport two hours before your flight.",
            question: "バスはどのくらいの頻度で出発しますか？",
            choices: ["15分ごと", "30分ごと", "1時間ごと", "2時間ごと"],
            correctAnswer: 1
        },
        {
            passage: "Alex's dog is very smart. It can sit, shake hands, and roll over. Alex taught these tricks to his dog when it was a puppy. Now the dog is three years old.",
            question: "アレックスの犬は何歳ですか？",
            choices: ["1歳", "2歳", "3歳", "5歳"],
            correctAnswer: 2
        },
        {
            passage: "The concert hall can hold one thousand people. Tonight's concert is completely sold out. The famous pianist will perform works by Mozart and Beethoven.",
            question: "コンサートホールの収容人数は何人ですか？",
            choices: ["500人", "1000人", "1500人", "2000人"],
            correctAnswer: 1
        },
        {
            passage: "Sophia has been working at the same company for fifteen years. She started as an intern and now she is a manager. She enjoys her job and her colleagues.",
            question: "ソフィアは何年同じ会社で働いていますか？",
            choices: ["5年", "10年", "15年", "20年"],
            correctAnswer: 2
        },
        {
            passage: "The pharmacy is open from nine in the morning to seven in the evening on weekdays. On Saturdays, it closes at five. It is closed on Sundays and holidays.",
            question: "薬局は土曜日に何時に閉まりますか？",
            choices: ["3時", "5時", "7時", "9時"],
            correctAnswer: 1
        },
        {
            passage: "Ethan loves reading mystery novels. He reads at least two books every month. His favorite author is Agatha Christie. He has read all of her books.",
            question: "イーサンは月に何冊以上本を読みますか？",
            choices: ["1冊", "2冊", "3冊", "5冊"],
            correctAnswer: 1
        },
        {
            passage: "The camping trip is planned for next month. We will stay in the mountains for four days. We need to bring tents, sleeping bags, and food. Everyone is looking forward to it.",
            question: "キャンプは何日間ですか？",
            choices: ["2日", "3日", "4日", "1週間"],
            correctAnswer: 2
        },
        {
            passage: "Charlotte is on a diet. She exercises at the gym five times a week. She also eats smaller portions at meals. She has already lost eight pounds in two months.",
            question: "シャーロットは週に何回ジムに行きますか？",
            choices: ["3回", "4回", "5回", "毎日"],
            correctAnswer: 2
        },
        {
            passage: "The art gallery is showing paintings by local artists this month. The exhibition is free to enter. It's open every day except Tuesdays. Many people visit on weekends.",
            question: "美術館は何曜日に閉まっていますか？",
            choices: ["月曜日", "火曜日", "水曜日", "日曜日"],
            correctAnswer: 1
        },
        {
            passage: "Ryan is learning to cook. He watches cooking videos online every evening. Last week, he made pasta for the first time. His family said it was delicious.",
            question: "ライアンは先週初めて何を作りましたか？",
            choices: ["パン", "ケーキ", "パスタ", "スープ"],
            correctAnswer: 2
        },
        {
            passage: "The amusement park has fifteen rides. The roller coaster is the most popular. People wait in line for up to an hour to ride it. The park is open from ten to eight.",
            question: "遊園地には何個のアトラクションがありますか？",
            choices: ["10", "15", "20", "25"],
            correctAnswer: 1
        },
        {
            passage: "Grace teaches yoga classes three times a week. Each class has about twenty students. She has been teaching for ten years. She loves helping people stay healthy.",
            question: "グレースは週に何回ヨガを教えていますか？",
            choices: ["1回", "2回", "3回", "5回"],
            correctAnswer: 2
        },
        {
            passage: "The new bridge was completed last year. It connects the two sides of the city. It took five years to build. Now people can cross the river in just ten minutes.",
            question: "橋の建設に何年かかりましたか？",
            choices: ["3年", "5年", "7年", "10年"],
            correctAnswer: 1
        },
        {
            passage: "Daniel forgot his lunch at home today. He bought a sandwich at the cafeteria instead. It cost six dollars. Next time, he will remember to bring his lunch.",
            question: "サンドイッチはいくらでしたか？",
            choices: ["4ドル", "5ドル", "6ドル", "8ドル"],
            correctAnswer: 2
        },
        {
            passage: "The weather has been very dry lately. It hasn't rained for three weeks. The farmers are worried about their crops. Everyone hopes it will rain soon.",
            question: "どのくらい雨が降っていませんか？",
            choices: ["1週間", "2週間", "3週間", "1ヶ月"],
            correctAnswer: 2
        },
        {
            passage: "Lily's apartment is on the tenth floor. There is an elevator, but it is broken today. She had to walk up the stairs. She was very tired when she reached her apartment.",
            question: "リリーのアパートは何階にありますか？",
            choices: ["5階", "8階", "10階", "15階"],
            correctAnswer: 2
        }
    ];

    // 問題プールからランダムに10問を選択
    const shuffled = questionPool.sort(() => Math.random() - 0.5);
    app.questions = shuffled.slice(0, 10);
}

// 問題表示
function displayQuestion() {
    const question = app.questions[app.currentQuestionIndex];

    // 進捗表示
    elements.questionNumber.textContent = `問題 ${app.currentQuestionIndex + 1}/${app.totalQuestions}`;
    const progressPercent = ((app.currentQuestionIndex) / app.totalQuestions) * 100;
    elements.progress.style.width = `${progressPercent}%`;

    // 文章と問題を表示
    elements.passage.textContent = question.passage;
    elements.questionText.textContent = question.question;
    elements.readingPhase.classList.remove('hidden');
    elements.feedback.classList.add('hidden');

    // 選択肢を表示（最初から選択可能）
    elements.choices.innerHTML = '';
    question.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = `${index + 1}. ${choice}`;
        button.disabled = false; // 最初から有効化
        button.style.opacity = '1';
        button.dataset.index = index;
        button.addEventListener('click', () => selectAnswerWithReading(index), { once: true });
        elements.choices.appendChild(button);
    });

    // 音声認識UIをリセット
    resetRecordingUI();
    app.recognizedText = '';
    app.recognitionHistory = [];
    app.readingStartTime = null;
    app.readingEndTime = null;
    app.answerStartTime = null;

    // 指示を表示
    elements.readingInstruction.textContent = '「測定開始」ボタンを押して、文章を声に出して読んでください';

    // タイマーはまだ開始しない
    elements.timer.textContent = '0.0秒';
}

// タイマー表示
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - (app.answerStartTime || app.readingStartTime)) / 1000;
        elements.timer.textContent = `${elapsed.toFixed(1)}秒`;
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 解答選択時の処理（音読時間を計算）
function selectAnswerWithReading(selectedIndex) {
    // 音読時間を計算（ラグ補正版）
    let readingTime;
    if (app.readingEndTime && app.readingStartTime) {
        // 音読完了時刻が記録されていればそれを使用（ラグ補正済み）
        readingTime = (app.readingEndTime - app.readingStartTime) / 1000;
    } else if (app.readingStartTime) {
        // 録音していない場合は現在時刻から計算
        readingTime = (Date.now() - app.readingStartTime) / 1000;
    } else {
        // 録音していない場合は0
        readingTime = 0;
    }

    // まだ録音中なら停止して音声チェック
    if (app.isRecording) {
        // 音読完了時刻を記録（まだ記録されていない場合）
        if (!app.readingEndTime && app.readingStartTime) {
            app.readingEndTime = Date.now();
            readingTime = (app.readingEndTime - app.readingStartTime) / 1000;
        }

        // 解答時間の計測開始（音読完了時点から）
        if (app.readingEndTime && !app.answerStartTime) {
            app.answerStartTime = app.readingEndTime;
            console.log('解答時間の計測を開始しました（音読完了時点から）');
        }

        // 音声認識を停止（解答選択時）
        if (app.recognition) {
            app.recognition.stop();
        }
        app.isRecording = false;

        // UI更新
        elements.startRecordingBtn.classList.remove('hidden');
        elements.stopRecordingBtn.classList.add('hidden');
        elements.recognitionStatus.classList.add('hidden');

        // 最終的な認識結果をチェック
        if (app.recognizedText) {
            compareTextWithPassage();
        }
    }

    selectAnswer(selectedIndex, readingTime);
}

// 解答選択
function selectAnswer(selectedIndex, readingTime) {
    const answerTime = app.answerStartTime ? (Date.now() - app.answerStartTime) / 1000 : 0;
    const question = app.questions[app.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    // 結果を記録
    app.results.push({
        questionNumber: app.currentQuestionIndex + 1,
        passage: question.passage,
        question: question.question,
        selectedAnswer: question.choices[selectedIndex],
        correctAnswer: question.choices[question.correctAnswer],
        isCorrect: isCorrect,
        readingTime: readingTime,
        answerTime: answerTime
    });

    // 選択肢のボタンを無効化し、正誤を表示
    const choiceButtons = elements.choices.querySelectorAll('.choice-btn');
    choiceButtons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correctAnswer) {
            btn.classList.add('correct');
        }
        if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // フィードバック表示
    stopTimer();
    elements.feedback.classList.remove('hidden');
    if (isCorrect) {
        elements.feedback.className = 'feedback correct';
        elements.feedback.textContent = `✓ 正解です！ 音読: ${readingTime.toFixed(1)}秒 / 解答: ${answerTime.toFixed(1)}秒`;
    } else {
        elements.feedback.className = 'feedback incorrect';
        elements.feedback.textContent = `✗ 不正解です。正解は「${question.choices[question.correctAnswer]}」です。 音読: ${readingTime.toFixed(1)}秒 / 解答: ${answerTime.toFixed(1)}秒`;
    }

    // 次の問題へ移行
    setTimeout(() => {
        app.currentQuestionIndex++;
        if (app.currentQuestionIndex < app.totalQuestions) {
            displayQuestion();
        } else {
            showResults();
        }
    }, 3000);
}

// 結果表示
function showResults() {
    showScreen('result');

    const correctCount = app.results.filter(r => r.isCorrect).length;
    const avgReadingTime = app.results.reduce((sum, r) => sum + r.readingTime, 0) / app.results.length;
    const avgAnswerTime = app.results.reduce((sum, r) => sum + r.answerTime, 0) / app.results.length;

    // スコアをローカルストレージに保存
    saveScore({
        date: new Date().toISOString(),
        correctCount: correctCount,
        totalQuestions: app.totalQuestions,
        avgReadingTime: avgReadingTime,
        avgAnswerTime: avgAnswerTime,
        results: app.results
    });

    elements.progress.style.width = '100%';
    document.getElementById('final-score').textContent = `${correctCount}/${app.totalQuestions}`;
    document.getElementById('avg-reading-time').textContent = `${avgReadingTime.toFixed(1)}秒`;
    document.getElementById('avg-answer-time').textContent = `${avgAnswerTime.toFixed(1)}秒`;

    // 詳細結果
    const detailsContainer = document.getElementById('result-details');
    detailsContainer.innerHTML = '<h3 style="margin-bottom: 15px;">詳細結果：</h3>';

    app.results.forEach((result) => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
        resultItem.innerHTML = `
            <div class="result-item-header">
                問題 ${result.questionNumber}: ${result.isCorrect ? '✓ 正解' : '✗ 不正解'}
            </div>
            <div>${result.question}</div>
            <div style="margin-top: 5px;">あなたの解答: ${result.selectedAnswer}</div>
            ${!result.isCorrect ? `<div>正解: ${result.correctAnswer}</div>` : ''}
            <div class="result-item-time">
                音読時間: ${result.readingTime.toFixed(1)}秒 / 解答時間: ${result.answerTime.toFixed(1)}秒
            </div>
        `;
        detailsContainer.appendChild(resultItem);
    });
}

// 画面切り替え
function showScreen(screenName) {
    elements.startScreen.classList.remove('active');
    elements.questionScreen.classList.remove('active');
    elements.resultScreen.classList.remove('active');
    elements.historyScreen.classList.remove('active');

    switch(screenName) {
        case 'start':
            elements.startScreen.classList.add('active');
            break;
        case 'question':
            elements.questionScreen.classList.add('active');
            break;
        case 'result':
            elements.resultScreen.classList.add('active');
            break;
        case 'history':
            elements.historyScreen.classList.add('active');
            break;
    }
}

// ローディング表示
function showLoading(show) {
    if (show) {
        elements.loading.classList.remove('hidden');
    } else {
        elements.loading.classList.add('hidden');
    }
}

// リセット
function resetQuiz() {
    stopTimer();
    app.currentQuestionIndex = 0;
    app.results = [];
    elements.timer.textContent = '0.0秒';
    elements.progress.style.width = '0%';
    showScreen('start');
}

// ローカルストレージにスコアを保存
function saveScore(scoreData) {
    let scores = JSON.parse(localStorage.getItem('readingScores') || '[]');
    scores.push(scoreData);
    localStorage.setItem('readingScores', JSON.stringify(scores));
    console.log('スコアを保存しました:', scoreData);
}

// すべてのスコアを取得
function getAllScores() {
    return JSON.parse(localStorage.getItem('readingScores') || '[]');
}

// スコアをCSV形式で出力
function exportScoresToCSV() {
    const scores = getAllScores();
    if (scores.length === 0) {
        alert('まだ記録されたスコアがありません。');
        return;
    }

    // CSVヘッダー
    let csv = '日時,正解数,問題数,正答率(%),平均音読時間(秒),平均解答時間(秒)\n';

    // データ行
    scores.forEach(score => {
        const date = new Date(score.date).toLocaleString('ja-JP');
        const accuracy = ((score.correctCount / score.totalQuestions) * 100).toFixed(1);
        csv += `${date},${score.correctCount},${score.totalQuestions},${accuracy},${score.avgReadingTime.toFixed(1)},${score.avgAnswerTime.toFixed(1)}\n`;
    });

    // 詳細データも追加
    csv += '\n詳細結果\n';
    csv += '日時,問題番号,正誤,音読時間(秒),解答時間(秒),問題文,あなたの解答,正解\n';

    scores.forEach(score => {
        const date = new Date(score.date).toLocaleString('ja-JP');
        score.results.forEach(result => {
            const correct = result.isCorrect ? '正解' : '不正解';
            csv += `${date},${result.questionNumber},${correct},${result.readingTime.toFixed(1)},${result.answerTime.toFixed(1)},"${result.question}","${result.selectedAnswer}","${result.correctAnswer}"\n`;
        });
    });

    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `英語音読スコア_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// コンソールにスコアを表示
function printScoresToConsole() {
    const scores = getAllScores();
    console.log('=== 保存されているスコア一覧 ===');
    scores.forEach((score, index) => {
        console.log(`\n--- 記録 ${index + 1} ---`);
        console.log(`日時: ${new Date(score.date).toLocaleString('ja-JP')}`);
        console.log(`正解数: ${score.correctCount}/${score.totalQuestions} (${((score.correctCount/score.totalQuestions)*100).toFixed(1)}%)`);
        console.log(`平均音読時間: ${score.avgReadingTime.toFixed(1)}秒`);
        console.log(`平均解答時間: ${score.avgAnswerTime.toFixed(1)}秒`);
        console.log('詳細:');
        score.results.forEach(result => {
            console.log(`  問題${result.questionNumber}: ${result.isCorrect ? '✓' : '✗'} 音読:${result.readingTime.toFixed(1)}秒 解答:${result.answerTime.toFixed(1)}秒`);
        });
    });
    console.log('\n=========================');
}

// スコア履歴画面を表示
function showHistory() {
    showScreen('history');
    displayHistory();
}

// スコア履歴を表示
function displayHistory() {
    const scores = getAllScores();
    elements.historyList.innerHTML = '';

    if (scores.length === 0) {
        elements.historyList.innerHTML = '<div class="empty-history">まだ記録がありません。<br>問題を解いてスコアを記録しましょう！</div>';
        return;
    }

    // 新しい順に表示
    scores.reverse().forEach((score, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const date = new Date(score.date).toLocaleString('ja-JP');
        const accuracy = ((score.correctCount / score.totalQuestions) * 100).toFixed(1);

        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-date">${date}</span>
                <span class="history-item-score">正答率: ${accuracy}%</span>
            </div>
            <div class="history-item-stats">
                <div class="history-stat">
                    <div class="history-stat-label">正解数</div>
                    <div class="history-stat-value">${score.correctCount}/${score.totalQuestions}</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-label">音読時間</div>
                    <div class="history-stat-value">${score.avgReadingTime.toFixed(1)}秒</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-label">解答時間</div>
                    <div class="history-stat-value">${score.avgAnswerTime.toFixed(1)}秒</div>
                </div>
            </div>
        `;

        elements.historyList.appendChild(historyItem);
    });
}

// 履歴を削除
function clearHistory() {
    if (confirm('本当にすべての履歴を削除しますか？この操作は取り消せません。')) {
        localStorage.removeItem('readingScores');
        displayHistory();
        alert('履歴を削除しました。');
    }
}

// 音声認識の初期化
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error('このブラウザは音声認識をサポートしていません');
        alert('お使いのブラウザは音声認識機能をサポートしていません。Chrome、Edge、Safariなどのブラウザをお使いください。');
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // 英語の音声認識
    recognition.continuous = true; // 継続的に認識
    recognition.interimResults = true; // 途中経過も取得

    recognition.onstart = () => {
        console.log('音声認識を開始しました');
        app.isRecording = true;
        app.recognizedText = '';
        app.recognitionHistory = []; // 履歴をリセット
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // すべての確定済み結果を累積
        for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // 確定済みテキストを保存（累積）
        app.recognizedText = finalTranscript.trim();

        // 認識履歴に記録（タイムスタンプ付き）
        if (finalTranscript.trim()) {
            app.recognitionHistory.push({
                timestamp: Date.now(),
                text: app.recognizedText,
                isFinal: true
            });
        }

        // リアルタイムで認識中のテキストを表示（確定済み + 認識中）
        const displayText = app.recognizedText + (interimTranscript ? ' ' + interimTranscript : '');
        if (elements.recognizedText) {
            elements.recognizedText.textContent = displayText || '認識中...';
        }

        // 文末まで読んだかチェック
        if (app.recognizedText) {
            checkIfReadingComplete();
        }
    };

    recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        if (event.error === 'no-speech') {
            elements.recognitionText.textContent = '音声が検出されませんでした';
        } else if (event.error === 'not-allowed') {
            alert('マイクへのアクセスが許可されていません。ブラウザの設定からマイクのアクセスを許可してください。');
        }
    };

    recognition.onend = () => {
        console.log('音声認識が終了しました');
        app.isRecording = false;
    };

    return recognition;
}

// 録音開始
function startRecording() {
    // 音声認識を初期化
    app.recognition = initSpeechRecognition();
    if (!app.recognition) {
        return;
    }

    // UI更新
    elements.startRecordingBtn.classList.add('hidden');
    elements.stopRecordingBtn.classList.remove('hidden');
    elements.recognitionStatus.classList.remove('hidden');
    elements.recognitionResult.classList.add('hidden');
    elements.recognitionText.textContent = '音声を認識中...';
    elements.recognizedText.textContent = '';

    // 指示を更新
    elements.readingInstruction.textContent = '音読中... 文章を最後まで読んでください';

    // 音読開始時刻を記録してタイマー開始
    app.readingStartTime = Date.now();
    startTimer();

    // 認識開始
    try {
        app.recognition.start();
    } catch (error) {
        console.error('音声認識の開始に失敗しました:', error);
        alert('音声認識の開始に失敗しました。再度お試しください。');
        resetRecordingUI();
    }
}

// 音読完了を自動検出
function checkIfReadingComplete() {
    if (!app.isRecording || !app.recognizedText) return;

    // 既に完了検出済みならスキップ
    if (app.readingEndTime) return;

    const question = app.questions[app.currentQuestionIndex];
    const originalText = question.passage.toLowerCase().replace(/[.,!?]/g, '');
    const recognizedText = app.recognizedText.toLowerCase().replace(/[.,!?]/g, '');

    const originalWords = originalText.split(/\s+/).filter(w => w.length > 0);
    const recognizedWords = recognizedText.split(/\s+/).filter(w => w.length > 0);

    console.log(`認識進捗: ${recognizedWords.length}/${originalWords.length} 単語 (${((recognizedWords.length / originalWords.length) * 100).toFixed(1)}%)`);

    // 認識した単語数が元のテキストの80%以上なら読了と判定
    if (recognizedWords.length >= originalWords.length * 0.8) {
        // 音読完了時刻を記録（ラグ補正のため、検出時点を音読完了時刻とする）
        app.readingEndTime = Date.now();

        // 解答時間の計測開始（音読完了時点から）
        if (!app.answerStartTime) {
            app.answerStartTime = app.readingEndTime;
            console.log('音読完了を検出しました。解答時間の計測を開始します。');
        }

        // 音声認識は継続（解答選択まで続ける）
        console.log('音声認識を継続します（解答選択まで）');
    }
}

// 録音停止（手動停止用）
function stopRecording() {
    if (app.recognition && app.isRecording) {
        app.recognition.stop();
    }

    // UI更新
    elements.startRecordingBtn.classList.remove('hidden');
    elements.stopRecordingBtn.classList.add('hidden');
    elements.recognitionStatus.classList.add('hidden');

    // 音読完了時刻を記録（まだ記録されていない場合）
    if (!app.readingEndTime && app.readingStartTime) {
        app.readingEndTime = Date.now();
    }

    // 解答時間の計測開始（音読完了時点から）
    if (app.readingEndTime && !app.answerStartTime) {
        app.answerStartTime = app.readingEndTime;
        console.log('解答時間の計測を開始しました（音読完了時点から）');
    }

    // 認識結果を比較
    if (app.recognizedText) {
        compareTextWithPassage();
        // 指示を更新
        elements.readingInstruction.textContent = '4択の中から正しい答えを選んでください';
    } else {
        alert('音声が認識されませんでした。もう一度お試しください。');
        elements.readingInstruction.textContent = '「測定開始」ボタンを押して、文章を声に出して読んでください';
    }
}

// 録音UIをリセット
function resetRecordingUI() {
    elements.startRecordingBtn.classList.remove('hidden');
    elements.stopRecordingBtn.classList.add('hidden');
    elements.recognitionStatus.classList.add('hidden');
    elements.recognitionResult.classList.add('hidden');
}

// テキスト比較とハイライト表示（高精度版）
function compareTextWithPassage() {
    const question = app.questions[app.currentQuestionIndex];
    const originalText = question.passage.toLowerCase().replace(/[.,!?]/g, '');
    const recognizedText = app.recognizedText.toLowerCase().replace(/[.,!?]/g, '');

    const originalWords = originalText.split(/\s+/);
    const recognizedWords = recognizedText.split(/\s+/);
    const displayWords = question.passage.split(/\s+/);

    // 動的計画法で最適なマッチングを計算
    const matchResult = findOptimalMatching(originalWords, recognizedWords);

    // 自己修正を検出
    const selfCorrections = detectSelfCorrections(originalWords, app.recognitionHistory);

    // 結果を表示
    let comparisonHTML = '';
    let incorrectCount = 0;
    const incorrectWords = [];

    matchResult.matches.forEach((match, index) => {
        const originalWord = originalWords[index];
        const displayWord = displayWords[index];

        // 自己修正があるかチェック
        const selfCorrection = selfCorrections.find(sc => sc.wordIndex === index);

        if (selfCorrection) {
            // 自己修正成功 - 青色でハイライト
            const incorrectAttempts = selfCorrection.incorrectAttempts.join(', ');
            comparisonHTML += `<span class="word self-corrected" title="自己修正: ${incorrectAttempts} → ${selfCorrection.correctAttempt}">` +
                `${displayWord}<sup>✓</sup></span> `;
        } else if (match.type === 'exact') {
            // 完全一致 - ハイライトしない（正しく読めているので強調不要）
            comparisonHTML += `${displayWord} `;
        } else if (match.type === 'similar') {
            // 類似（発音の揺れ程度） - ハイライトしない
            comparisonHTML += `${displayWord} `;
        } else if (match.type === 'incorrect') {
            // 明らかな読み間違え - 赤でハイライト
            incorrectCount++;
            incorrectWords.push({
                original: displayWord,
                recognized: match.recognized
            });
            comparisonHTML += `<span class="word incorrect" title="読み間違え: ${match.recognized}">` +
                `${displayWord}</span> `;
        } else if (match.type === 'missing') {
            // 読み飛ばし - 黄色でハイライト
            incorrectCount++;
            incorrectWords.push({
                original: displayWord,
                recognized: '(読み飛ばし)'
            });
            comparisonHTML += `<span class="word missing" title="読み飛ばされました">${displayWord}</span> `;
        }
    });

    // 結果を表示
    elements.comparisonDisplay.innerHTML = comparisonHTML;
    elements.recognitionResult.classList.remove('hidden');

    // フィードバック
    const totalWords = originalWords.length;
    const correctCount = totalWords - incorrectCount;
    const accuracy = (correctCount / totalWords) * 100;
    const errorRate = (incorrectCount / totalWords) * 100;

    // 音読時間を計算（分単位）
    const readingTime = app.readingStartTime ? (Date.now() - app.readingStartTime) / 1000 : 0;
    const readingTimeMinutes = readingTime / 60;
    const wordsPerMinute = readingTimeMinutes > 0 ? Math.round(totalWords / readingTimeMinutes) : 0;

    let feedbackClass = '';
    let feedbackText = '';

    if (incorrectCount === 0) {
        feedbackClass = 'excellent';
        feedbackText = `完璧です！すべて正確に読めています！\n読速度: ${wordsPerMinute} wpm（分速${wordsPerMinute}語）`;
    } else if (incorrectCount <= 2) {
        feedbackClass = 'good';
        feedbackText = `良くできました！\n読み間違え: ${incorrectCount}箇所（${errorRate.toFixed(1)}%）\n読速度: ${wordsPerMinute} wpm`;
    } else {
        feedbackClass = 'needs-improvement';
        feedbackText = `読み間違え: ${incorrectCount}箇所（${errorRate.toFixed(1)}%）\n読速度: ${wordsPerMinute} wpm\n赤色と黄色の単語を確認してください。`;
    }

    elements.recognitionFeedback.className = `recognition-feedback ${feedbackClass}`;
    elements.recognitionFeedback.style.whiteSpace = 'pre-line'; // 改行を有効化
    elements.recognitionFeedback.textContent = feedbackText;
}

// 自己修正を検出する関数
function detectSelfCorrections(originalWords, recognitionHistory) {
    if (recognitionHistory.length < 2) {
        return []; // 履歴が少ない場合は自己修正を検出できない
    }

    const selfCorrections = [];

    // 各履歴エントリーを分析
    for (let i = 1; i < recognitionHistory.length; i++) {
        const previousText = recognitionHistory[i - 1].text.toLowerCase().replace(/[.,!?]/g, '');
        const currentText = recognitionHistory[i].text.toLowerCase().replace(/[.,!?]/g, '');

        const previousWords = previousText.split(/\s+/).filter(w => w.length > 0);
        const currentWords = currentText.split(/\s+/).filter(w => w.length > 0);

        // 新しく追加された単語を検出
        const startIndex = Math.min(previousWords.length, currentWords.length - 1);

        for (let wordIdx = startIndex; wordIdx < currentWords.length; wordIdx++) {
            const currentWord = currentWords[wordIdx];

            // 元のテキストの同じ位置にある単語と比較
            if (wordIdx < originalWords.length) {
                const originalWord = originalWords[wordIdx];

                // 前の履歴で同じ位置に違う単語があったかチェック
                if (wordIdx < previousWords.length) {
                    const previousWord = previousWords[wordIdx];

                    // 前回は間違っていたが、今回は正しい場合
                    const previousMatches = wordsAreSame(previousWord, originalWord) ||
                                          getMatchScore(previousWord, originalWord) >= 7;
                    const currentMatches = wordsAreSame(currentWord, originalWord) ||
                                         getMatchScore(currentWord, originalWord) >= 7;

                    if (!previousMatches && currentMatches && previousWord !== currentWord) {
                        // 自己修正を検出
                        const existing = selfCorrections.find(sc => sc.wordIndex === wordIdx);
                        if (existing) {
                            existing.incorrectAttempts.push(previousWord);
                        } else {
                            selfCorrections.push({
                                wordIndex: wordIdx,
                                incorrectAttempts: [previousWord],
                                correctAttempt: currentWord
                            });
                        }
                    }
                }
            }
        }
    }

    console.log('検出された自己修正:', selfCorrections);
    return selfCorrections;
}

// 動的計画法で最適な単語マッチングを見つける
function findOptimalMatching(originalWords, recognizedWords) {
    const n = originalWords.length;
    const m = recognizedWords.length;

    // DPテーブル: dp[i][j] = 最初のi個の元単語とj個の認識単語のマッチングスコア
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(-Infinity));
    const path = Array(n + 1).fill(null).map(() => Array(m + 1).fill(null));

    dp[0][0] = 0;

    for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= m; j++) {
            if (dp[i][j] === -Infinity) continue;

            // ケース1: 元単語[i]と認識単語[j]をマッチさせる
            if (i < n && j < m) {
                const score = getMatchScore(originalWords[i], recognizedWords[j]);
                if (dp[i + 1][j + 1] < dp[i][j] + score) {
                    dp[i + 1][j + 1] = dp[i][j] + score;
                    path[i + 1][j + 1] = { type: 'match', i, j, score };
                }
            }

            // ケース2: 元単語[i]が読み飛ばされた（認識単語を消費しない）
            if (i < n) {
                const penalty = -5; // 読み飛ばしペナルティ
                if (dp[i + 1][j] < dp[i][j] + penalty) {
                    dp[i + 1][j] = dp[i][j] + penalty;
                    path[i + 1][j] = { type: 'skip', i, j };
                }
            }

            // ケース3: 余分な単語が認識された（元単語を消費しない）
            if (j < m) {
                const penalty = -2; // 余分な単語ペナルティ
                if (dp[i][j + 1] < dp[i][j] + penalty) {
                    dp[i][j + 1] = dp[i][j] + penalty;
                    path[i][j + 1] = { type: 'extra', i, j };
                }
            }
        }
    }

    // バックトラッキングで最適なマッチングを復元
    const matches = [];
    let i = n, j = m;
    let recogIndex = m - 1;

    while (i > 0 || j > 0) {
        const p = path[i][j];
        if (!p) break;

        if (p.type === 'match') {
            const matchType = classifyMatch(originalWords[i - 1], recognizedWords[j - 1], p.score);
            matches.unshift({
                originalIndex: i - 1,
                type: matchType,
                recognized: recognizedWords[j - 1]
            });
            i--;
            j--;
        } else if (p.type === 'skip') {
            matches.unshift({
                originalIndex: i - 1,
                type: 'missing',
                recognized: null
            });
            i--;
        } else if (p.type === 'extra') {
            j--;
        }
    }

    // すべての元単語に対する結果を確保
    const completeMatches = [];
    for (let idx = 0; idx < n; idx++) {
        const match = matches.find(m => m.originalIndex === idx);
        if (match) {
            completeMatches.push(match);
        } else {
            completeMatches.push({
                originalIndex: idx,
                type: 'missing',
                recognized: null
            });
        }
    }

    return { matches: completeMatches };
}

// 2つの単語のマッチングスコアを計算
function getMatchScore(word1, word2) {
    // 完全一致
    if (word1 === word2) return 10;

    // 数字と英単語の同一性チェック
    if (wordsAreSame(word1, word2)) return 10;

    // レーベンシュタイン距離で類似度を計算
    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - distance / maxLength;

    // 類似度に基づいてスコアを返す
    if (similarity >= 0.85) return 8;  // かなり類似
    if (similarity >= 0.7) return 5;   // やや類似
    if (similarity >= 0.5) return 2;   // 微妙に類似
    return -3; // 全く違う
}

// マッチのタイプを分類
function classifyMatch(word1, word2, score) {
    if (score >= 10) return 'exact';      // 完全一致
    if (score >= 7) return 'similar';     // 類似（発音の揺れ程度）
    if (score >= 2) return 'incorrect';   // 読み間違え
    return 'incorrect';                   // 明らかな読み間違え
}

// 数字を英単語に変換（またはその逆）
function normalizeWord(word) {
    const numberMap = {
        '0': 'zero', 'zero': '0',
        '1': 'one', 'one': '1',
        '2': 'two', 'two': '2',
        '3': 'three', 'three': '3',
        '4': 'four', 'four': '4',
        '5': 'five', 'five': '5',
        '6': 'six', 'six': '6',
        '7': 'seven', 'seven': '7',
        '8': 'eight', 'eight': '8',
        '9': 'nine', 'nine': '9',
        '10': 'ten', 'ten': '10',
        '11': 'eleven', 'eleven': '11',
        '12': 'twelve', 'twelve': '12',
        '13': 'thirteen', 'thirteen': '13',
        '14': 'fourteen', 'fourteen': '14',
        '15': 'fifteen', 'fifteen': '15',
        '16': 'sixteen', 'sixteen': '16',
        '17': 'seventeen', 'seventeen': '17',
        '18': 'eighteen', 'eighteen': '18',
        '19': 'nineteen', 'nineteen': '19',
        '20': 'twenty', 'twenty': '20',
        '30': 'thirty', 'thirty': '30',
        '40': 'forty', 'forty': '40',
        '50': 'fifty', 'fifty': '50',
        '60': 'sixty', 'sixty': '60',
        '70': 'seventy', 'seventy': '70',
        '80': 'eighty', 'eighty': '80',
        '90': 'ninety', 'ninety': '90',
        '100': 'hundred', 'hundred': '100',
    };

    return word.toLowerCase();
}

// 2つの単語が同じ意味かチェック（数字考慮）
function wordsAreSame(word1, word2) {
    word1 = word1.toLowerCase();
    word2 = word2.toLowerCase();

    // 完全一致
    if (word1 === word2) return true;

    // 数字と英単語のマッピング
    const numberToWord = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty', '30': 'thirty',
        '40': 'forty', '50': 'fifty', '60': 'sixty', '70': 'seventy',
        '80': 'eighty', '90': 'ninety', '100': 'hundred'
    };

    // word1が数字でword2が英単語（またはその逆）
    if (numberToWord[word1] === word2 || numberToWord[word2] === word1) {
        return true;
    }

    return false;
}

// 単語の類似度判定（簡易版）
function isSimilar(word1, word2) {
    // 完全一致
    if (word1 === word2) return true;

    // 数字と英単語の同一性チェック
    if (wordsAreSame(word1, word2)) return true;

    // レーベンシュタイン距離で類似度を判定
    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - distance / maxLength;

    // 80%以上の類似度で正解とする
    return similarity >= 0.8;
}

// レーベンシュタイン距離を計算
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // 置換
                    matrix[i][j - 1] + 1,     // 挿入
                    matrix[i - 1][j] + 1      // 削除
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

// ページ読み込み時に実行
window.addEventListener('load', () => {
    console.log('英語音読トレーニングアプリが起動しました');
    console.log('スコアを確認するには: printScoresToConsole()');
    console.log('スコアをCSV出力するには: exportScoresToCSV()');
});
