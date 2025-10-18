# Firebase設定手順書

このドキュメントでは、英語音読トレーニングアプリにFirebaseを設定する手順を説明します。

---

## 前提条件

- ✅ Googleアカウントを持っている
- ✅ GitHubにアプリをアップロード済み

---

## ステップ1: Firebaseプロジェクトを作成

### 1.1 Firebaseコンソールにアクセス

1. https://console.firebase.google.com/ にアクセス
2. Googleアカウントでログイン

### 1.2 新しいプロジェクトを作成

1. 「プロジェクトを追加」をクリック
2. **プロジェクト名**: `english-reading-app`（任意の名前でOK）
3. 「続行」をクリック
4. **Googleアナリティクス**: 「有効にする」（推奨）または「無効」でもOK
5. 「プロジェクトを作成」をクリック
6. 完了するまで待つ（30秒ほど）

---

## ステップ2: Firebaseアプリを追加

### 2.1 Webアプリを追加

1. プロジェクト概要画面で、**ウェブアイコン** `</>` をクリック
2. **アプリのニックネーム**: `English Reading App`
3. ✅ **Firebase Hostingも設定します** のチェックは**外す**（GitHub Pagesを使用するため）
4. 「アプリを登録」をクリック

### 2.2 Firebase設定情報をコピー

表示される設定コードから、以下の部分をコピーします：

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**重要**: この情報は後で使うので、メモ帳などに保存しておいてください。

---

## ステップ3: Firestoreデータベースを作成

### 3.1 Firestoreを有効化

1. 左サイドバーの「構築」→「**Firestore Database**」をクリック
2. 「データベースの作成」をクリック

### 3.2 セキュリティルールを設定

1. **本番環境モードで開始**を選択
2. 「次へ」をクリック
3. **ロケーション**: `asia-northeast1`（東京）を選択
4. 「有効にする」をクリック
5. 完了するまで待つ（1分ほど）

### 3.3 セキュリティルールを編集

1. 「ルール」タブをクリック
2. 以下のルールをコピーして貼り付け：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userScores/{document=**} {
      // 読み取りは禁止（管理者のみFirebaseコンソールから閲覧可能）
      allow read: if false;

      // 書き込みは誰でも可能（匿名データのみ）
      allow write: if true;
    }
  }
}
```

3. 「公開」をクリック

**このルールの意味:**
- ✅ 誰でもスコアを送信できる（`allow write: if true`）
- ❌ ユーザーは他人のスコアを見られない（`allow read: if false`）
- ✅ あなた（管理者）だけがFirebaseコンソールでデータを閲覧できる

---

## ステップ4: Firebase設定をアプリに追加

### 4.1 app.js を編集

1. `app.js` をエディタで開く
2. 1行目〜9行目のFirebase設定を、ステップ2.2でコピーした設定に置き換える：

**変更前:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

**変更後（例）:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyB1234567890abcdefghijklmnopqrstuv",
    authDomain: "english-reading-app.firebaseapp.com",
    projectId: "english-reading-app",
    storageBucket: "english-reading-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

### 4.2 ファイルをGitHubにプッシュ

```bash
git add app.js
git commit -m "Firebase設定を追加"
git push origin main
```

---

## ステップ5: 動作確認

### 5.1 アプリをテスト

1. GitHub Pagesのサイトにアクセス:
   https://itiyabosi.github.io/English-reading-app-for-ld/

2. ブラウザの開発者ツールを開く（F12キー）

3. 「Console」タブを確認し、以下のメッセージが表示されることを確認：
   ```
   ✓ Firebase初期化完了
   ```

4. クイズを1回プレイする

5. Consoleに以下が表示されることを確認：
   ```
   ✓ ローカルストレージに保存しました
   ✓ データベースに保存しました
   ```

### 5.2 Firestoreでデータを確認

1. Firebaseコンソール → Firestore Database
2. 「データ」タブをクリック
3. `userScores` コレクションにデータが追加されていることを確認

**表示される情報:**
- `correctCount`: 正解数
- `totalQuestions`: 問題数
- `avgReadingTime`: 平均音読時間
- `avgAnswerTime`: 平均解答時間
- `results`: 各問題の詳細
- `browser`: ブラウザ種類
- `timestamp`: 日時

---

## ステップ6: データの閲覧と分析

### 6.1 Firebaseコンソールでデータを見る

1. Firebaseコンソール → Firestore Database → データ
2. 各ドキュメントをクリックして詳細を表示

### 6.2 CSVにエクスポート

残念ながら、Firebaseコンソールには直接CSVエクスポート機能がありません。
以下の方法でエクスポートできます：

**方法1: Firebaseコンソールでコピー&ペースト**
1. 各ドキュメントを手動でコピー
2. スプレッドシートに貼り付け

**方法2: Cloud Functionsを使う（上級者向け）**
- Firebase Functionsでエクスポート機能を作成

**方法3: ローカルのデータをCSV出力**
- アプリの「スコアをCSV出力」ボタンを使用（ローカルデータのみ）

---

## トラブルシューティング

### ❌ エラー: "Firebase初期化失敗"

**原因**: Firebase設定が間違っている

**解決策**:
1. `app.js` の1〜9行目のFirebase設定を確認
2. Firebaseコンソールの「プロジェクトの設定」→「マイアプリ」で正しい設定をコピー
3. 再度 `app.js` に貼り付け

### ❌ エラー: "Missing or insufficient permissions"

**原因**: Firestoreのセキュリティルールが正しく設定されていない

**解決策**:
1. Firebaseコンソール → Firestore Database → ルール
2. ステップ3.3のルールをコピー&貼り付け
3. 「公開」をクリック

### ❌ データが保存されない

**原因1**: ユーザーがデータ収集に同意していない

**解決策**: スタート画面のチェックボックスにチェックが入っているか確認

**原因2**: Firebase設定が間違っている

**解決策**: ブラウザの開発者ツールでConsoleを確認し、エラーメッセージを確認

---

## セキュリティに関する注意事項

### ⚠️ APIキーの公開について

Firebase WebのAPIキーは**公開されても安全**です：

- ✅ GitHub上に公開されても問題ありません
- ✅ Firestoreのセキュリティルールで保護されています
- ✅ 悪意のあるユーザーがデータを読み取ることはできません

**理由:**
- セキュリティルールで `allow read: if false` としているため、読み取り不可
- 書き込みのみ許可しているが、匿名データのみ

### 🔒 さらに安全にする方法

悪意のあるユーザーが大量にデータを書き込むのを防ぐには：

1. Firebaseコンソール → Firestore Database → ルール
2. 以下のルールに変更：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userScores/{document=**} {
      allow read: if false;

      // データサイズとレート制限を追加
      allow write: if request.resource.size() < 50000  // 50KB以下
                   && request.time > resource.data.timestamp + duration.value(10, 's');  // 10秒に1回まで
    }
  }
}
```

---

## 無料枠の管理

### 📊 使用量を確認する

1. Firebaseコンソール → 「使用状況」タブ
2. 「Firestore」のグラフを確認

### 🔔 アラートを設定する

1. Firebaseコンソール → 「プロジェクトの設定」
2. 「使用量と請求額」タブ
3. 「予算アラートを設定」
4. 金額: `100円` など

**無料枠:**
- 書き込み: 1日 20,000回
- 読み取り: 1日 50,000回
- ストレージ: 1GB

---

## まとめ

✅ Firebaseプロジェクト作成
✅ Firestore Database有効化
✅ セキュリティルール設定
✅ アプリに設定を追加
✅ 動作確認完了

これで、ユーザーのスコアデータが自動的にFirebaseに保存されるようになりました！

---

## サポート

問題が発生した場合は、以下にIssueを作成してください：
https://github.com/itiyabosi/English-reading-app-for-ld/issues
