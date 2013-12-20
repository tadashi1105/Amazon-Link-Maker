/*
 * ApphtmlWeb.js
 * @version 2.0
 * @author Toshiya NISHIO(http://www.toshiya240.com)
 */

////////////////////////////////////////////////////////////////////////////////
// 設定値の永続化

var storage = {
  set: function(key, obj) {
    this.remove(key);
    window.localStorage.setItem(key, JSON.stringify(obj));
  },
  get: function(key) {
    var val = window.localStorage.getItem(key);
    if (val == null || val == "undefined") {
      return "";
    } else {
      return JSON.parse(val);
    }
  },
  remove: function(key) {
    window.localStorage.removeItem(key);
  },
  clear: function() {
    window.localStorage.clear();
  }
};

function storageClear() {
  var c = prompt('初期化すると登録したIDと全てのテンプレートが失われます。よろしいですか？','OK押すと全てが初期化します。');
  if (c) {
    storage.clear();
  }
}

function loadConfig() {
  var conf_aff = storage.get("apphtml_conf_aff");
  $("#conf_aff").val(conf_aff);
};

function reloadConfig() {
  loadConfig();
  conf_template = storage.get("apphtml_conf_template");
  if (conf_template == "") conf_template = preset();

  setOutSelection();
  $("#conf_out").selectmenu("refresh");
}

function saveConfig() {
  storage.set("apphtml_conf_aff", $("#conf_aff").val());
  storage.set("apphtml_conf_out", $("#conf_out option:selected").val());
  storage.set("apphtml_conf_template", conf_template);

  setTemplateSelection();
  $("#template").selectmenu("refresh");

  return true;
};

////////////////////////////////////////////////////////////////////////////////
// テンプレート定義

var conf_template = {};

function Template(name, content) {
  this.name = name;
  this.content = content;
}

function defaultTemplate() {
  return [
    new Template('画像リンク（小）', '<a href="${url}"><img src="${imgS}"></a>'),
    new Template('画像リンク（中）', '<a href="${url}"><img src="${imgM}"></a>'),
    new Template('テキストリンク', '<a href="${url}">${title}</a>'),
    new Template('画像（中）付きテキスト', '<div class="amz-link-box"><a href="${url}" target="_blank"><img src="${imgM}" style="float:left;border:0;margin-right:1em;"></a><a href="${url}" target="_blank"><span style="font-weight:bold;">${title}</span></a><br><span>カテゴリー： ${category}</span><br><span>リリース日： ${release}</span><br><a href="${url}" target="_blank"><span>Amazonで見る</span></a><div style="clear:both;"></div></div>')
  ];
};

function preset() {
  return {
    'All': defaultTemplate(),
    'Apparel': defaultTemplate(),
    'Automotive': defaultTemplate(),
    'Baby': defaultTemplate(),
    'Beauty': defaultTemplate(),
    'Books': defaultTemplate(),
    'DVD': defaultTemplate(),
    'Electronics': defaultTemplate(),
    'ForeignBooks': defaultTemplate(),
    'Grocery': defaultTemplate(),
    'HealthPersonalCare': defaultTemplate(),
    'Hobbies': defaultTemplate(),
    'HomeImprovement': defaultTemplate(),
    'Jewelry': defaultTemplate(),
    'Kitchen': defaultTemplate(),
    'Music': defaultTemplate(),
    'Shoes': defaultTemplate(),
    'Software': defaultTemplate(),
    'VHS': defaultTemplate(),
    'Video': defaultTemplate(),
    'VideoGames': defaultTemplate(),
    'Watches': defaultTemplate()
  };
};

var selectedTemplateIndex = undefined;

function saveTemplate() {
  var addmode = (selectedTemplateIndex == -1);

  var name = $("#template-editor-name").val();
  var content = $("#template-editor-content").val();
  if (!name || !content) {
    showError("名前と内容を入力してください。");
    return false;
  }
  var title = $("#template-list-title").text();
  var kind = entity[title];
  if (addmode) {
    conf_template[kind].push(new Template(name, content));
  } else {
    var selectedTemplate = conf_template[kind][selectedTemplateIndex];
    selectedTemplate.name = name;
    selectedTemplate.content = content;
  }

  var title = $("#template-list-title").text();
  showTemplateList(title, {transition:"slideup", reverse:true});

  return true;
}

function deleteTemplate() {
  // TODO: 確認ダイアログを表示した方がよいか？
  var title = $("#template-list-title").text();
  var kind = entity[title];
  conf_template[kind].splice(selectedTemplateIndex, 1);

  var title = $("#template-list-title").text();
  showTemplateList(title, {transition:"slideup", reverse:true});
}

function addTemplate() {
  showTemplateEditor(-1);
}

////////////////////////////////////////////////////////////////////////////////
// 画面共通

var entity = {
  'All':       'All',
  '服＆ファッション小物':  'Apparel',
  'カー＆バイク用品':    'Automotive',
  'ベビー＆マタニティ':    'Baby',
  'コスメ':   'Beauty',
  '本（和書）':          'Books',
  'DVD':     'DVD',
  '家電＆カメラ':   'Electronics',
  '洋書': 'ForeignBooks',
  '食品＆飲料':     'Grocery',
  'ヘルス＆ビューティー':   'HealthPersonalCare',
  'ホｌビー':   'Hobbies',
  'ＤＩＹ・工具':   'HomeImprovement',
  'ジュエリー':   'Jewelry',
  'ホーム＆キッチン':   'Kitchen',
  'ミュージック':   'Music',
  'シューズ＆バッグ':   'Shoes',
  'ソフトウェア':   'Software',
  'VHS':   'VHS',
  'ビデオ':   'Video',
  'ゲーム':   'VideoGames',
  '時計':   'Watches',
};

/* All Apparel Automotive Baby Beauty Books DVD Electronics ForeignBooks Grocery HealthPersonalCare Hobbies HomeImprovement Jewelry Kitchen Music Shoes Software SportingGoods VHS Video VideoGames Watches*/
////////////////////////////////////////////////////////////////////////////////
// 検索画面

function setKindSelection() {
  $kind = $("#kind");
  $kind.empty();
  for (var label in entity) {
    $kind.append($("<option>").text(label).val(entity[label]));
  }
  $("#kind option").eq(0).attr("selected", true);
}

function setTemplateSelection() {
  var $templateSelection = $("#template");
  $templateSelection.empty();
  var kind = $("#kind option:selected").val();
  var selectedTemplate = conf_template[kind];
  for (var i = 0; i < selectedTemplate.length; i++) {
    var text = selectedTemplate[i].name;
    var val = selectedTemplate[i].content;
    $templateSelection.append($("<option>").text(text).val(val));
  }
  $("#template option").eq(0).attr("selected", true);
};

$(document).on("change", "#kind", function() {
  setTemplateSelection();
  $("#template").selectmenu("refresh");
});

$(document).ready(function () {
  $("#keywords").keypress(function (e) {
    if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
    search();
    }
  });
});

function search() {
  var kind = $("#kind option:selected").val();
  var fmt = $("#template option:selected").val();

  var d = document,
      e = d.createElement('script');
  var url = "apphtml.js";
  e.out = $("#conf_out").val();
  e.knd = kind;
  e.key = $("#keywords").val();
  e.amz = $("#conf_aff").val();
  e.fmt = encodeURIComponent(fmt);
  e.charset = 'utf-8';
  e.src = url;
  e.id = 'bmlt';
  d.body.appendChild(e);
};

////////////////////////////////////////////////////////////////////////////////
// 設定画面

var outParams = {
  "ポップアップ": "popup",
  "ポップアップ→Textforce": "pop-textforce",
  "Textforce": "textforce",
  "Textforce→Safari": "safari-textforce",
  "DraftPad": "draftpad",
  "するぷろ": "slpro",
  "Moblogger": "moblogger",
  "Moblogger(追記)": "moblogger-app",
  "Moblogger(コピー)": "moblogger-pb",
  "MyEditor": "myeditor",
  "MyEditor(カーソル)": "myeditor-cursor",
  "Rowline": "rowline",
  "TextHandler": "msth",
  "ThumbEdit(送信)": "thumbedit",
  "ThumbEdit(追記)": "thumbedit-insert",
  "PressSync Pro": "presssync",
  "Textwell": "textwell",
  "はてなブログ（新規投稿）": "hatenablog",
  "Drafts": "drafts"
};

function setOutSelection() {
  var conf_out = storage.get("apphtml_conf_out");
  if (conf_out == "") conf_out = "popup";
  var $conf_out = $("#conf_out");
  $conf_out.empty();
  for (var label in outParams) {
    $conf_out.append($("<option>").text(label).val(outParams[label]));
  }
  $conf_out.find("option[value="+conf_out+"]").attr("selected", true);
}

function showTemplateList(title, option) {
  if (!option) {
    option = {};
    option.transition = 'slide';
  }
  $("#template-list-title").text(title);
  var $templateListView = $("#template-list-view");
  $templateListView.empty();
  var kind = entity[title];
  var selectedTemplate = conf_template[kind];
  for (var i = 0; i < selectedTemplate.length; i++) {
    var text = selectedTemplate[i].name;
    var val = selectedTemplate[i].content;
    var $li = $("<li>");
    $li.append($("<a>").text(text).attr(
          'href', 'javascript:showTemplateEditor("'+i+'");'));
    $templateListView.append($li);
  }
  $.mobile.changePage("#template-list", option);
  $templateListView.listview("refresh");
}

function showTemplateEditor(index) {
  var addmode = (index == -1);
  selectedTemplateIndex = index;

  var title = $("#template-list-title").text();
  $("#template-editor-title").text(title);

  var kind = entity[title];

  if (!addmode) {
    var selectedTemplate = conf_template[kind][index];

    $("#template-editor-name").val(selectedTemplate.name);
    $("#template-editor-content").val(selectedTemplate.content);
  } else {
    $("#template-editor-name").val("");
    $("#template-editor-content").val("");
  }

  var $placeholderList = $("#placeholder-list");
  $placeholderList.empty();
  for (var i = 0; i < placeholderList.length; ++i) {
    var ph = placeholderList[i];
    if (kind in ph.avail) {
      var $li = $("<li>");
      $li.append(
          $("<a>").text(ph.name).attr(
            'href', 'javascript:insertPlaceholder("'+i+'");'));
      $placeholderList.append($li);
    }
  }

  if (addmode) {
    $("#template-editor-delete-btn-area").hide();
  } else {
    $("#template-editor-delete-btn-area").show();
  }
  $.mobile.changePage("#template-editor", {transition: "slideup"});
  $placeholderList.listview("refresh");
}

$(document).on("swipeleft", "#template-editor", function() {
  $("#template-editor-panel").panel("open");
});

////////////////////////////////////////////////////////////////////////////////
// 予約語入力支援

var allEntity = {
  All:"",
  Apparel:"",
  Automotive:"",
  Baby:"",
  Beauty:"",
  Books:"",
  DVD:"",
  Electronics:"",
  ForeignBooks:"",
  Grocery:"",
  HealthPersonalCare:"",
  Hobbies:"",
  HomeImprovement:"",
  Jewelry:"",
  Kitchen:"",
  Music:"",
  Shoes:"",
  Software:"",
  VHS:"",
  Video:"",
  VideoGames:"",
  Watches:"",
};

function Placeholder(name, kwd, avail) {
  this.name = name;
  this.kwd = kwd;
  this.avail = avail;
};

var placeholderList = [
new Placeholder('画像（小）', '${imgS}', allEntity),
new Placeholder('画像（中）', '${imgM}', allEntity),
new Placeholder('画像（大）', '${imgL}', allEntity),
new Placeholder('タイトル', '${title}', allEntity),
new Placeholder('商品リンク', '${url}', allEntity),
new Placeholder('作者', '${name}', {Books:""}),
new Placeholder('出版社/メーカー', '${publish}', allEntity),
new Placeholder('内容紹介', '${summary}', allEntity),
new Placeholder('カテゴリー', '${category}', allEntity),
new Placeholder('価格', '${price}', allEntity),
new Placeholder('中古価格', '${usedprice}', allEntity),
new Placeholder('ASIN', '${asin}', allEntity),
new Placeholder('リリース日', '${release}', allEntity),
new Placeholder('実行日', '${today}', allEntity)
];

function insertPlaceholder(index) {
  var ph = placeholderList[index];
  var content = $("#template-editor-content").get(0);
  var orig = content.value;
  var pos = content.selectionStart;
  var npos = pos + ph.kwd.length;
  content.value = orig.substr(0, pos) + ph.kwd + orig.substr(pos);
  content.setSelectionRange(npos, npos);
  $("#template-editor-panel").panel("close");
  content.focus();
}

////////////////////////////////////////////////////////////////////////////////
// その他

function showError(msg) {
  $("#error_msg").text(msg);
  $dialog = $("<a href='#error_page' data-rel='dialog'></a>");
  $dialog.get(0).click();
  $dialog.remove();
}


////////////////////////////////////////////////////////////////////////////////
// 初期化

$(function() {
  loadConfig();
});

$(document).on("pagebeforecreate", "#main", function() {
  conf_template = storage.get("apphtml_conf_template");
  if (conf_template == "") conf_template = preset();

  setKindSelection();
  setOutSelection();
  setTemplateSelection();
});