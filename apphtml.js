(function () {

    var step = 1,
        d = document,
        w = window;
    var items = {},
        hit = 0;

    // 親JSからパラメータを取得
    var script = d.getElementById("bmlt");
    var knd = script.knd,
        out = script.out,
        key = script.key,
        amz = script.amz,
        fmt = decodeURIComponent(script.fmt);

    // 見ているサイトがiTunesWebだった場合
    // if (location.href.indexOf("https://itunes.apple.com/") != -1) {
    //     var urlAry = location.href.split("/id");
    //     appId = urlAry[1];
    //     urlAry = appId.split("?");
    //     appId = urlAry[0];
    // }

    // 検索キーワードを取得（選択されたキーワードがある場合にはそっちを優先）
    if (key == "") {
        if (d.selection) key = d.selection.createRange().text;
        else if (w.selection) key = w.selection.createRange().text;
        else if (w.getSelection) key = w.getSelection();
        else if (d.getSelection) key = d.getSelection();
        else key = '';
        if (key == "") key = prompt("What do you want to search?", "");
        if (key == "" || !key) {
            prompt('Result', 'Not Found ...');
            return;
        }
    }

    // bookmarkletの予約語
    var bmAry = ['imgS', 'imgM', 'imgL', 'title', 'url', 'name', 'publish', 'summary', 'category', 'price', 'usedprice', 'asin', 'release', 'today'];

    // メイン処理（非同期実行を防ぐ為にTimerを利用）
    var timerId = setInterval(function () {
        switch (step) {
        case 1:
            step = 0;
            getWebApi();
            break;
        case 2:
            step = 0;
            dispData();
            break;
        case 3:
            while (d.getElementById("bmlt"))
                d.getElementById("bmlt").parentNode.removeChild(d.getElementById("bmlt"));
            clearInterval(timerId);
            timerId = null;
            return 0;
        }
    }, 100);

    // Amazon-json.php をコールしてJSON形式で値を取得
    function getWebApi() {
        $.ajax({
            url: "amazon-json.php",
            type: "GET",
            dataType: "json",
            async: false,
            data: {
                'search_index': knd,
                'keywords': key
            }
        })
        .done(function(data){
            if (data.result == 'failed') {
                prompt('Result', 'Not Found ...');
                step = 3;
                return;
            }

            var result = data.result.Item;
            if (result){
                for (var i = 0; i < result.length; i++){
                    var item = result[i];
                    items[i] = item;
                    items[i].imgS = item.SmallImage ? item.SmallImage.URL : '';
                    items[i].imgM = item.MediumImage ? item.MediumImage.URL : '';
                    items[i].imgL = item.LargeImage ? item.LargeImage.URL : '';
                    items[i].title = item.ItemAttributes.Title;
                    items[i].url = item.DetailPageURL;
                    items[i].name = item.ItemAttributes.Author ? item.ItemAttributes.Author : '';
                    items[i].publish = item.ItemAttributes.Manufacturer ? item.ItemAttributes.Manufacturer : '';
                    items[i].summary = item.EditorialReviews && item.EditorialReviews.EditorialReview && item.EditorialReviews.EditorialReview.Content ? item.EditorialReviews.EditorialReview.Content : '';
                    items[i].category = item.ItemAttributes.Binding;
                    if(item.OfferSummary){

                        items[i].price = item.OfferSummary.LowestNewPrice ? item.OfferSummary.LowestNewPrice.Amount : '';
                        items[i].usedprice = item.OfferSummary.LowestUsedPrice ? item.OfferSummary.LowestUsedPrice.Amount : '';

                    } else {
                        items[i].price = '';
                        items[i].usedprice = '';
                    }
                    console.log(items[i]);
                    items[i].asin = item.ASIN;
                    items[i].release = item.ItemAttributes.ReleaseDate ? item.ItemAttributes.ReleaseDate : '';

                    var r = prompt('【' + (i + 1) + '/' + result.length + '】' + items[i].title, 'OK→次, キャンセル→決定');
                    if (!r) {
                        hit = i;
                        step = 2;
                        return;
                    }
                }
            } else {
                prompt('Result', 'Not Found ...');
                step = 3;
                return;
            }
        })
        .fail(function(data){
            prompt('通信失敗', 'Not Found ...');
            step = 3;
            return;
        });
    }

    // 結果の整理と出力方法ごとの処理
    function dispData() {
        var x = '',
            chk = '';
        var z = items[hit],
            pData = fmt;

        // 結果をbookmarklet予約語に変換してfmtを置換
        var bmData = handData(z);
        for (var j = 0; j < bmAry.length; j++) {
            var keys = bmAry[j],
                value = bmData[keys],
                reg = new RegExp('\\${' + keys + '}', 'g');
            pData = pData.replace(reg, value);
        }
        x = pData + '\n';
        chk = pData;
        if (chk != '') {
            // 出力方法ごとの処理（プレビュー表示）
            if (out == "preview" ) {
                d.body.innerHTML =
                '<div id="bkmlt_preview">' +
                "<form><input type='button' value='プレビュー表示を消す' onclick='javascript:" +
                'var a=document.getElementById("bkmlt_preview");a.parentNode.removeChild(a);' +
                "'>　<input type='button' value='HTMLを選択する' onclick='javascript:" +
                'var a=document.getElementById("bkmklt_ret");a.focus();' +
                "'>　<input type='button' value='HTMLの内容でプレビューを書き直す' onclick='javascript:" +
                'var a=document.getElementById("bkmklt_ret").value;' +
                'document.getElementById("bkmklt_rewrite").innerHTML=a;' +
                "'></form>" + '<textarea style="width:99%;font-size:80%;" rows="10" id="bkmklt_ret"' +
                'onfocus="javascript:this.select();">' + x + '</textarea><br><p>プレビュー</p><div id="bkmklt_rewrite">' +
                 x + '</div></div>' + d.body.innerHTML;
            }
            // 出力方法ごとの処理（ポップアップ表示）
            if (out == "popup") {
                prompt("result", x);
                if ($("#ajax_msg").length){
                    $("#ajax_msg").append(
                        '<div id="bkmlt_preview">' +
                        "<form><input type='button' value='プレビュー表示を消す' onclick='javascript:" +
                        'var a=document.getElementById("bkmlt_preview");a.parentNode.removeChild(a);' +
                        "'>　<input type='button' value='HTMLを選択する' onclick='javascript:" +
                        'var a=document.getElementById("bkmklt_ret");a.focus();' +
                        "'>　<input type='button' value='HTMLの内容でプレビューを書き直す' onclick='javascript:" +
                        'var a=document.getElementById("bkmklt_ret").value;' +
                        'document.getElementById("bkmklt_rewrite").innerHTML=a;' +
                        "'></form>" + '<textarea style="width:99%;font-size:80%;" rows="10" id="bkmklt_ret"' +
                        'onfocus="javascript:this.select();">' + x + '</textarea><br><p>プレビュー</p><div id="bkmklt_rewrite">' +
                        x + '</div></div>'
                        );
                }
            }
            // 出力方法ごとの処理（ポップアップ→Textforce連携）
            if (out == "pop-textforce") {
                prompt("result", x);
                w.location = 'textforce://';
            }
            // 出力方法ごとの処理（Texeforce連携）
            if (out == "textforce") {
                w.location = 'textforce://file?path=/blog.html&method=write&after=quick_look&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Texeforce連携しSafariに戻る）
            if (out == "safari-textforce") {
                w.location = 'textforce://file?path=/blog.html&method=write&after=quick_look&text=' + encodeURIComponent(x) + '&callback=' + encodeURIComponent(location.href);
            }
            // 出力方法ごとの処理（DraftPad連携）
            if (out == "draftpad") {
                w.location = 'draftpad:///insert?after=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（するぷろ連携）
            if (out == "slpro") {
                w.location = 'slpro://' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Moblogger連携）
            if (out == "moblogger") {
                prompt("result", x);
                w.location = 'moblogger://';
            }
            // 出力方法ごとの処理（Mobloggerを起動して追記）
            if (out == "moblogger-app") {
                w.location = 'moblogger://append?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Mobloggerを起動してクリップボードにコピー）
            if (out == "moblogger-pb") {
                w.location = 'moblogger://pboard?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（MyEditor連携）
            if (out == "myeditor") {
                prompt("result", x);
                w.location = 'myeditor://';
            }
            // 出力方法ごとの処理（MyEditorを起動してカーソル位置にコピー）
            if (out == "myeditor-cursor") {
                w.location = 'myeditor://cursor?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Rowlineを起動して文末に追加）
            if (out == "rowline") {
                w.location = 'rowline:///set?loc=bottom&view=lines&callback=seeq://&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（@matubizさん作MyScripts用スクリプト、TextHandlerに送信）
            if (out == "msth") {
                w.location = 'myscripts://run?title=TextHandler&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（ThumbEditに送る）
            if (out == "thumbedit") {
                w.location = 'thumbedit://?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（ThumbEditに追記）
            if (out == "thumbedit-insert") {
                w.location = 'thumbedit://?text=' + encodeURIComponent(x) + '&mode=insert';
            }
            // 出力方法ごとの処理（PressSync Proに送る）
            if (out == "presssync") {
                w.location = 'presssync:///message?' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（textwellに送る）
            if (out == "textwell") {
                w.location = 'textwell:///insert?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（はてなブログで新規作成）
            if (out == "hatenablog") {
                w.location = 'hatenablog:///new?title=new%20post&body=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Draftsで新規作成）
            if (out == "drafts") {
                w.location = 'drafts://x-callback-url/create?text=' + encodeURIComponent(x);
            }
        }
        step = 3;
    }

    // Bookmarklet予約語へのセット

    function handData(data) {
        var x = new Array(bmAry),
            i, j, tmp, reg;

        //Entity毎にセット
        if (knd == "All" || knd == "Apparel" || knd == "Automotive" || knd == "Baby" || knd == "Beauty" || knd == "Books" || knd == "DVD" || knd == "Electronics" || knd == "ForeignBooks" || knd == "Grocery" || knd == "HealthPersonalCare" || knd == "Hobbies" || knd == "HomeImprovement" || knd == "Jewelry" || knd == "Kitchen" || knd == "Music" || knd == "Shoes" || knd == "Software" || knd == "VHS" || knd == "Video" || knd == "VideoGames" || knd == "Watches") {

            if (data.imgS == "") x.imgS = 'http://placehold.it/62x80&text=No%20Image';
            else x.imgS = data.imgS;
            if (data.imgM == "") x.imgM = 'http://placehold.it/125x160&text=No%20Image';
            else x.imgM = data.imgM;
            if (data.imgL == "") x.imgL = 'http://placehold.it/375x480&text=No%20Image';
            else x.imgL = data.imgL;
            x.title = data.title;
            x.url = AMZUrl(data.asin, amz);
            if (data.name == "") x.name = 'なし';
            else x.name = data.name;
            if (data.publish == "") x.publish = 'なし';
            else x.publish = data.publish;
            if (data.summary == "") x.summary = 'なし';
            else x.summary = data.summary;
            if (data.category == "") x.category = 'なし';
            else x.category = data.category;
            if (eval(data.price) == 0) x.price = '無料';
            else x.price = '￥' + fmtNumber(data.price);
            if (eval(data.usedprice) == 0) x.usedprice = '無料';
            else x.usedprice = '￥' + fmtNumber(data.usedprice);
            x.asin = data.asin;
            if (data.release == "") x.release = 'なし';
            else x.release = data.release;

        }
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        var dd = now.getDate();
        x.today = y + "-" + m + "-" + dd;
        return x;
    }

    // 数字のカンマ編集
    function fmtNumber(x) {
        var s = '' + x,
            p = s.indexOf('.');
        if (p < 0) p = s.length;
        var r = s.substring(p, s.length);
        for (var i = 0; i < p; i++) {
            var c = s.substring(p - 1 - i, p - 1 - i + 1);
            if (i > 0 && i % 3 == 0) r = ',' + r;
            r = c + r;
        }
        return r;
    }

    // 再生時間を変換
    function sizeTime(x) {
        var r = Math.round((eval(x) / 60000));
        r = fmtNumber(r);
        r = r + ' 分';
        return r;
    }

    // PHGアフィリエイトリンクまたはLinkShareリンク生成
    function AMZUrl(asin, id) {
        if (amz != "") {
            var affId = "/" + id + "/";
            var affUrl = "http://www.amazon.co.jp/exec/obidos/ASIN/" + asin + affId;
            return affUrl;
        } else
            var affUrl = "http://www.amazon.co.jp/exec/obidos/ASIN/" + asin + "/tadashi05-22/";
        return affUrl;
    }
})();
